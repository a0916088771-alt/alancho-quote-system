"use client";

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { brand, createEmptyClient, createInitialItems, priceItems, terms } from "../lib/quote-config";
import { readQuoteHistory, writeQuoteHistory } from "../lib/quote-storage";
import type { ClientInfo, CustomItem, PriceItem, Quote, QuoteLine, SelectedItem, SelectedQuoteLine } from "../lib/quote-types";
import { formatMoney, makeId, readFileAsDataUrl } from "../lib/quote-utils";

const emptyCustomItem = (): CustomItem => ({
  id: makeId(),
  name: "",
  price: 0,
  quantity: 1,
  note: ""
});

export default function Home() {
  const [client, setClient] = useState<ClientInfo>(() => createEmptyClient());
  const [items, setItems] = useState<Record<string, SelectedItem>>(() => createInitialItems());
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [depositRate, setDepositRate] = useState(50);
  const [history, setHistory] = useState<Quote[]>([]);
  const [activeId, setActiveId] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const signatureCanvas = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setHistory(readQuoteHistory());
  }, []);

  useEffect(() => {
    const canvas = signatureCanvas.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineWidth = 2;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#181716";
  }, []);

  const selectedLines = useMemo<SelectedQuoteLine[]>(
    () =>
      priceItems
        .map((item) => {
          const state = items[item.id] ?? { selected: false, quantity: 1 };
          const quantity = item.quantityEnabled ? Math.max(1, Number(state.quantity) || 1) : 1;
          return {
            ...item,
            selected: state.selected,
            quantity,
            subtotal: state.selected ? item.price * quantity : 0
          };
        })
        .filter((item) => item.selected),
    [items]
  );

  const serviceLines = selectedLines.filter((item) => item.category === "service");
  const addonLines = selectedLines.filter((item) => item.category === "addon");
  const customLines = useMemo<QuoteLine[]>(
    () =>
      customItems
        .filter((item) => item.name.trim() || item.price > 0)
        .map((item) => {
          const quantity = Math.max(1, Number(item.quantity) || 1);
          const price = Math.max(0, Number(item.price) || 0);
          return {
            id: item.id,
            name: item.name.trim() || "自訂項目",
            price,
            quantity,
            note: item.note.trim(),
            subtotal: price * quantity
          };
        }),
    [customItems]
  );
  const total = [...selectedLines, ...customLines].reduce((sum, item) => sum + item.subtotal, 0);
  const deposit = Math.round(total * (depositRate / 100));
  const balance = total - deposit;

  function updateClient(field: keyof ClientInfo, value: string) {
    setClient((current) => ({ ...current, [field]: value }));
  }

  function updateSelected(id: string, selected: boolean) {
    setItems((current) => ({
      ...current,
      [id]: { ...current[id], selected }
    }));
  }

  function updateQuantity(id: string, quantity: number) {
    setItems((current) => ({
      ...current,
      [id]: { ...current[id], quantity: Math.max(1, quantity || 1) }
    }));
  }

  function addCustomItem() {
    setCustomItems((current) => [...current, emptyCustomItem()]);
  }

  function updateCustomItem(id: string, field: keyof Omit<CustomItem, "id">, value: string | number) {
    setCustomItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (field === "price") return { ...item, price: Math.max(0, Number(value) || 0) };
        if (field === "quantity") return { ...item, quantity: Math.max(1, Number(value) || 1) };
        return { ...item, [field]: String(value) };
      })
    );
  }

  function removeCustomItem(id: string) {
    setCustomItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) {
    const file = event.target.files?.[0];
    if (!file) return;
    setter(await readFileAsDataUrl(file));
  }

  function saveQuote() {
    const id = activeId || makeId();
    const quote: Quote = {
      id,
      title: client.clientName || "未命名客戶",
      createdAt: new Date().toISOString(),
      client,
      items,
      customItems,
      quoteNotes,
      depositRate,
      logoDataUrl,
      qrDataUrl,
      signatureDataUrl
    };
    const next = [quote, ...history.filter((item) => item.id !== id)];
    setHistory(next);
    setActiveId(id);
    writeQuoteHistory(next);
  }

  function loadQuote(quote: Quote) {
    setActiveId(quote.id);
    setClient(quote.client);
    setItems({ ...createInitialItems(), ...quote.items });
    setCustomItems(quote.customItems ?? []);
    setQuoteNotes(quote.quoteNotes ?? "");
    setDepositRate(quote.depositRate);
    setLogoDataUrl(quote.logoDataUrl);
    setQrDataUrl(quote.qrDataUrl);
    setSignatureDataUrl(quote.signatureDataUrl);
    setTimeout(() => {
      if (quote.signatureDataUrl) {
        drawSignatureImage(quote.signatureDataUrl);
      } else {
        clearSignature();
      }
    }, 0);
  }

  function newQuote() {
    setActiveId("");
    setClient(createEmptyClient());
    setItems(createInitialItems());
    setCustomItems([]);
    setQuoteNotes("");
    setDepositRate(50);
    setSignatureDataUrl("");
    clearSignature();
  }

  function deleteQuote(id: string) {
    const next = history.filter((item) => item.id !== id);
    setHistory(next);
    writeQuoteHistory(next);
    if (activeId === id) newQuote();
  }

  function printPdf() {
    saveSignature();
    setTimeout(() => window.print(), 80);
  }

  function canvasPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvas.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvas.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = canvasPoint(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvas.current;
    const context = canvas?.getContext("2d");
    if (!isDrawing || !canvas || !context) return;
    const point = canvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveSignature();
  }

  function saveSignature() {
    const canvas = signatureCanvas.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL("image/png"));
  }

  function clearSignature() {
    const canvas = signatureCanvas.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl("");
  }

  function drawSignatureImage(dataUrl: string) {
    const canvas = signatureCanvas.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !dataUrl) return;
    const image = new Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = dataUrl;
  }

  return (
    <main className="min-h-screen px-4 py-5 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="print-page rounded-[8px] border border-line bg-paper p-5 shadow-soft sm:p-8 lg:p-10">
          <header className="mb-10 flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              {logoDataUrl ? (
                <img src={logoDataUrl} alt="Brand logo" className="h-16 w-16 object-contain" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center border border-ink text-xs tracking-[0.24em]">
                  A0
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-warm">Photography Quote</p>
                <h1 className="mt-2 text-3xl font-light tracking-[0.18em] sm:text-4xl">{brand.name}</h1>
              </div>
            </div>
            <div className="text-left text-sm leading-7 text-neutral-600 sm:text-right">
              <p>{brand.phone}</p>
              <p>{brand.email}</p>
            </div>
          </header>

          <section className="print-only mb-8 border-b border-line pb-8 print-avoid-break">
            <h2 className="mb-5 text-sm font-medium tracking-[0.28em]">客戶資料</h2>
            <div className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
              <PrintField label="客戶名稱" value={client.clientName} />
              <PrintField label="聯絡方式" value={client.contact} />
              <PrintField label="拍攝日期" value={client.shootDate} />
              <PrintField label="拍攝地點" value={client.location} />
              <PrintField label="報價日期" value={client.quoteDate} />
              <PrintField label="報價有效期限" value={client.validUntil} />
            </div>
            {client.notes ? (
              <div className="mt-5">
                <p className="text-xs tracking-[0.22em] text-neutral-400">備註</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-600">{client.notes}</p>
              </div>
            ) : null}
          </section>

          <div className="no-print grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-10">
              <Panel title="客戶資料">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextInput label="客戶名稱" value={client.clientName} onChange={(value) => updateClient("clientName", value)} />
                  <TextInput label="聯絡方式" value={client.contact} onChange={(value) => updateClient("contact", value)} />
                  <TextInput label="拍攝日期" type="date" value={client.shootDate} onChange={(value) => updateClient("shootDate", value)} />
                  <TextInput label="拍攝地點" value={client.location} onChange={(value) => updateClient("location", value)} />
                  <TextInput label="報價日期" type="date" value={client.quoteDate} onChange={(value) => updateClient("quoteDate", value)} />
                  <TextInput label="報價有效期限" type="date" value={client.validUntil} onChange={(value) => updateClient("validUntil", value)} />
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500">備註</span>
                  <textarea
                    value={client.notes}
                    onChange={(event) => updateClient("notes", event.target.value)}
                    rows={4}
                    className="w-full resize-none border border-line bg-white/60 px-4 py-3 text-sm outline-none transition focus:border-ink"
                    placeholder="拍攝需求、交付偏好、現場注意事項"
                  />
                </label>
              </Panel>

              <Panel title="服務項目">
                <ItemGroup
                  group="動態紀錄"
                  items={priceItems.filter((item) => item.group === "動態紀錄")}
                  state={items}
                  onSelect={updateSelected}
                  onQuantity={updateQuantity}
                />
                <ItemGroup
                  group="活動平面紀錄"
                  items={priceItems.filter((item) => item.group === "活動平面紀錄")}
                  state={items}
                  onSelect={updateSelected}
                  onQuantity={updateQuantity}
                />
                <CustomItemsEditor
                  items={customItems}
                  onAdd={addCustomItem}
                  onRemove={removeCustomItem}
                  onUpdate={updateCustomItem}
                />
              </Panel>

              <Panel title="加購項目">
                <ItemGroup
                  group="加購項目"
                  items={priceItems.filter((item) => item.category === "addon")}
                  state={items}
                  onSelect={updateSelected}
                  onQuantity={updateQuantity}
                />
              </Panel>

              <Panel title="報價備註">
                <textarea
                  value={quoteNotes}
                  onChange={(event) => setQuoteNotes(event.target.value)}
                  rows={5}
                  className="w-full resize-none border border-line bg-white/60 px-4 py-3 text-sm outline-none transition focus:border-ink"
                  placeholder="特殊拍攝需求、客戶指定內容、車馬費說明、場地費說明或其他補充事項"
                />
              </Panel>

              <Panel title="電子簽名">
                <div className="rounded-[8px] border border-line bg-white p-3">
                  <canvas
                    ref={signatureCanvas}
                    width={900}
                    height={220}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                    className="h-36 w-full touch-none bg-white"
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs tracking-[0.2em] text-neutral-400">CLIENT SIGNATURE</span>
                    <button type="button" onClick={clearSignature} className="no-print text-xs tracking-[0.2em] text-neutral-500 underline-offset-4 hover:underline">
                      清除
                    </button>
                  </div>
                </div>
              </Panel>
            </div>

            <aside className="space-y-5">
              <Summary total={total} deposit={deposit} balance={balance} depositRate={depositRate} setDepositRate={setDepositRate} />

              <Panel title="付款資訊">
                <div className="grid gap-4">
                  <UploadBox label="Logo" dataUrl={logoDataUrl} onChange={(event) => handleUpload(event, setLogoDataUrl)} onClear={() => setLogoDataUrl("")} />
                  <UploadBox label="QR Code" dataUrl={qrDataUrl} onChange={(event) => handleUpload(event, setQrDataUrl)} onClear={() => setQrDataUrl("")} />
                </div>
                <div className="mt-5 border-t border-line pt-5 text-sm leading-7 text-neutral-600">
                  <p className="font-medium text-ink">付款資訊</p>
                  <p>請依雙方確認之匯款帳戶付款，匯款後回傳後五碼。</p>
                  {qrDataUrl ? <img src={qrDataUrl} alt="Payment QR Code" className="mt-4 h-32 w-32 object-contain" /> : <div className="mt-4 flex h-32 w-32 items-center justify-center border border-dashed border-line text-xs text-neutral-400">QR Code</div>}
                </div>
              </Panel>
            </aside>
          </div>

          <section className="mt-10 border-t border-line pt-8 print-avoid-break">
            <h2 className="mb-5 text-sm font-medium tracking-[0.28em]">報價明細</h2>
            <QuoteTable title="服務明細" lines={serviceLines} />
            <QuoteTable title="自訂項目" lines={customLines} />
            <QuoteTable title="加購項目" lines={addonLines} />
            {[...selectedLines, ...customLines].length === 0 ? <p className="py-8 text-sm text-neutral-500">尚未選擇服務項目。</p> : null}
          </section>

          {quoteNotes ? (
            <section className="mt-8 border-t border-line pt-8 print-avoid-break">
              <h2 className="mb-4 text-sm font-medium tracking-[0.28em]">報價備註</h2>
              <p className="whitespace-pre-line text-sm leading-8 text-neutral-600">{quoteNotes}</p>
            </section>
          ) : null}

        <section className="mt-8 grid gap-6 border-t border-line pt-8 print-avoid-break">
            <div className="text-sm leading-8 text-neutral-600">
              <p className="font-medium tracking-[0.16em] text-ink">注意事項</p>
              <TermsList />
            </div>
            <div className="space-y-3 text-sm">
              <AmountRow label="總金額" value={total} strong />
              <AmountRow label={`訂金 ${depositRate}%`} value={deposit} />
              <AmountRow label="尾款" value={balance} />
            </div>
          </section>

          <section className="mt-8 grid gap-6 border-t border-line pt-8 md:grid-cols-[1fr_12rem] print-avoid-break">
            <div className="text-sm leading-8 text-neutral-600">
              <p className="font-medium tracking-[0.16em] text-ink">付款資訊</p>
              <p>請依雙方確認之匯款帳戶付款，匯款後回傳後五碼。</p>
              <p>{brand.name} | {brand.phone} | {brand.email}</p>
            </div>
            <div>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Payment QR Code" className="h-32 w-32 object-contain" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center border border-dashed border-line text-xs text-neutral-400">QR Code</div>
              )}
            </div>
          </section>

          <section className="mt-10 grid gap-6 border-t border-line pt-8 md:grid-cols-2 print-avoid-break">
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-400">BRAND</p>
              <p className="mt-2 text-xl tracking-[0.18em]">{brand.name}</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.24em] text-neutral-400">CLIENT SIGNATURE</p>
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Client signature" className="mt-2 h-20 max-w-full object-contain" />
              ) : (
                <div className="mt-10 border-b border-ink" />
              )}
            </div>
          </section>
        </section>

        <aside className="no-print space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-[8px] border border-line bg-paper p-5 shadow-soft">
            <div className="flex flex-col gap-3">
              <button type="button" onClick={printPdf} className="bg-ink px-5 py-3 text-sm tracking-[0.2em] text-white transition hover:bg-neutral-700">
                匯出 PDF
              </button>
              <button type="button" onClick={saveQuote} className="border border-ink px-5 py-3 text-sm tracking-[0.2em] transition hover:bg-white">
                儲存報價
              </button>
              <button type="button" onClick={newQuote} className="border border-line px-5 py-3 text-sm tracking-[0.2em] text-neutral-600 transition hover:bg-white">
                新增報價
              </button>
            </div>
          </section>

          <section className="rounded-[8px] border border-line bg-paper p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-[0.24em]">歷史報價</h2>
              <span className="text-xs text-neutral-400">{history.length}</span>
            </div>
            <div className="max-h-[34rem] space-y-3 overflow-auto pr-1">
              {history.length === 0 ? (
                <p className="text-sm leading-7 text-neutral-500">尚無歷史資料。儲存後可重新開啟修改。</p>
              ) : (
                history.map((quote) => (
                  <div key={quote.id} className={`border p-3 ${activeId === quote.id ? "border-ink bg-white" : "border-line bg-white/50"}`}>
                    <button type="button" onClick={() => loadQuote(quote)} className="block w-full text-left">
                      <span className="block text-sm font-medium">{quote.title}</span>
                      <span className="mt-1 block text-xs text-neutral-400">{new Date(quote.createdAt).toLocaleString("zh-TW")}</span>
                    </button>
                    <button type="button" onClick={() => deleteQuote(quote.id)} className="mt-3 text-xs tracking-[0.18em] text-neutral-400 hover:text-ink">
                      刪除
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid-break">
      <h2 className="mb-5 text-sm font-medium tracking-[0.28em]">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({
  label,
  value,
  type = "text",
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-line bg-white/60 px-3 text-sm outline-none transition focus:border-ink"
      />
    </label>
  );
}

function PrintField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line pb-2">
      <p className="text-xs tracking-[0.22em] text-neutral-400">{label}</p>
      <p className="mt-2 min-h-5 text-ink">{value || "-"}</p>
    </div>
  );
}

function ItemGroup({
  group,
  items,
  state,
  onSelect,
  onQuantity
}: {
  group: string;
  items: PriceItem[];
  state: Record<string, SelectedItem>;
  onSelect: (id: string, selected: boolean) => void;
  onQuantity: (id: string, quantity: number) => void;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <p className="mb-3 text-xs tracking-[0.22em] text-neutral-400">{group}</p>
      <div className="divide-y divide-line border-y border-line">
        {items.map((item) => {
          const selected = state[item.id]?.selected ?? false;
          const quantity = state[item.id]?.quantity ?? 1;
          const subtotal = selected ? item.price * (item.quantityEnabled ? quantity : 1) : 0;

          return (
            <div key={item.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <label className="flex min-w-0 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => onSelect(item.id, event.target.checked)}
                  className="mt-1 h-4 w-4 accent-ink"
                />
                <span>
                  <span className="block text-sm font-medium">{item.name}</span>
                  <span className="mt-1 block text-xs text-neutral-500">
                    {formatMoney(item.price)}
                    {item.unit ? ` / ${item.unit}` : ""}
                  </span>
                </span>
              </label>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                {item.quantityEnabled ? (
                  <label className="flex items-center gap-2 text-xs text-neutral-500">
                    {item.quantityLabel}
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      disabled={!selected}
                      onChange={(event) => onQuantity(item.id, Number(event.target.value))}
                      className="h-9 w-20 border border-line bg-white px-2 text-right text-sm text-ink outline-none disabled:opacity-40"
                    />
                  </label>
                ) : null}
                <span className="w-28 text-right text-sm">{formatMoney(subtotal)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomItemsEditor({
  items,
  onAdd,
  onRemove,
  onUpdate
}: {
  items: CustomItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Omit<CustomItem, "id">, value: string | number) => void;
}) {
  return (
    <div className="mt-8 border-t border-line pt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.22em] text-neutral-400">自訂項目</p>
          <p className="mt-2 text-sm text-neutral-500">可加入車馬費、特殊企劃、場地費或其他客製服務。</p>
        </div>
        <button type="button" onClick={onAdd} className="border border-ink px-4 py-2 text-xs tracking-[0.18em] transition hover:bg-white">
          新增項目
        </button>
      </div>

      {items.length === 0 ? (
        <div className="border border-dashed border-line bg-white/40 px-4 py-5 text-sm text-neutral-500">尚未新增自訂項目。</div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const subtotal = Math.max(0, Number(item.price) || 0) * Math.max(1, Number(item.quantity) || 1);

            return (
              <div key={item.id} className="border border-line bg-white/50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs tracking-[0.22em] text-neutral-400">CUSTOM {index + 1}</p>
                  <button type="button" onClick={() => onRemove(item.id)} className="text-xs tracking-[0.18em] text-neutral-400 hover:text-ink">
                    移除
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_8rem_7rem]">
                  <TextInput label="項目名稱" value={item.name} onChange={(value) => onUpdate(item.id, "name", value)} />
                  <NumberInput label="價格" value={item.price} onChange={(value) => onUpdate(item.id, "price", value)} />
                  <NumberInput label="數量" value={item.quantity} min={1} onChange={(value) => onUpdate(item.id, "quantity", value)} />
                </div>
                <label className="mt-4 block">
                  <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500">備註</span>
                  <textarea
                    value={item.note}
                    onChange={(event) => onUpdate(item.id, "note", event.target.value)}
                    rows={2}
                    className="w-full resize-none border border-line bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-ink"
                    placeholder="此項目的說明"
                  />
                </label>
                <div className="mt-4 flex justify-end text-sm">
                  <span className="border-b border-line pb-2 text-neutral-500">小計</span>
                  <span className="ml-4 border-b border-line pb-2">{formatMoney(subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Summary({
  total,
  deposit,
  balance,
  depositRate,
  setDepositRate
}: {
  total: number;
  deposit: number;
  balance: number;
  depositRate: number;
  setDepositRate: (value: number) => void;
}) {
  return (
    <section className="rounded-[8px] border border-line bg-white p-5 print-avoid-break">
      <p className="mb-5 text-xs tracking-[0.28em] text-neutral-400">TOTAL</p>
      <p className="text-4xl font-light tracking-[0.04em]">{formatMoney(total)}</p>
      <label className="mt-6 block text-xs tracking-[0.2em] text-neutral-500">
        訂金比例
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={depositRate}
          onChange={(event) => setDepositRate(Number(event.target.value))}
          className="mt-3 w-full accent-ink"
        />
      </label>
      <div className="mt-5 space-y-3 text-sm">
        <AmountRow label={`訂金 ${depositRate}%`} value={deposit} />
        <AmountRow label="尾款" value={balance} />
      </div>
    </section>
  );
}

function AmountRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b border-line pb-2 ${strong ? "text-lg font-medium" : ""}`}>
      <span className="text-neutral-500">{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}

function QuoteTable({
  title,
  lines
}: {
  title: string;
  lines: QuoteLine[];
}) {
  if (lines.length === 0) return null;

  return (
    <div className="mb-7 last:mb-0">
      <p className="mb-3 text-xs tracking-[0.22em] text-neutral-400">{title}</p>
      <div className="overflow-hidden border-y border-line">
        {lines.map((line) => (
          <div key={line.id} className="border-b border-line py-3 text-sm last:border-b-0">
            <div className="grid grid-cols-[1fr_auto] gap-4 sm:grid-cols-[1fr_6rem_8rem_8rem]">
              <span>{line.name}</span>
              <span className="hidden text-right text-neutral-500 sm:block">{formatMoney(line.price)}</span>
              <span className="hidden text-right text-neutral-500 sm:block">
                {line.quantity}
                {line.unit ? ` ${line.unit}` : ""}
              </span>
              <span className="text-right">{formatMoney(line.subtotal)}</span>
            </div>
            {line.note ? <p className="mt-2 whitespace-pre-line text-xs leading-6 text-neutral-500">{line.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  min = 0,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500">{label}</span>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full border border-line bg-white/70 px-3 text-right text-sm outline-none transition focus:border-ink"
      />
    </label>
  );
}

function TermsList() {
  return (
    <div className="space-y-5">
      {terms.map((section) => (
        <div key={section.title}>
          <p className="font-medium text-ink">{section.title}</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
  {section.items.map((item) => (
    <li
      key={item}
      className="whitespace-normal break-words leading-7"
    >
      {item}
    </li>
  ))}
</ol>
        </div>
      ))}
    </div>
  );
}

function UploadBox({
  label,
  dataUrl,
  onChange,
  onClear
}: {
  label: string;
  dataUrl: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="border border-line bg-white/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-[0.22em] text-neutral-500">{label}</p>
        {dataUrl ? (
          <button type="button" onClick={onClear} className="text-xs text-neutral-400 hover:text-ink">
            移除
          </button>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center border border-dashed border-line bg-white text-[10px] text-neutral-400">
          {dataUrl ? <img src={dataUrl} alt={label} className="h-full w-full object-contain" /> : "IMAGE"}
        </div>
        <label className="no-print cursor-pointer border border-ink px-3 py-2 text-xs tracking-[0.18em] transition hover:bg-white">
          上傳
          <input type="file" accept="image/*" onChange={onChange} className="hidden" />
        </label>
      </div>
    </div>
  );
}
