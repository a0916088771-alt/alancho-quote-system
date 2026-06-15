# 資料模型

目前系統使用瀏覽器 `localStorage` 儲存歷史報價。每一筆報價都使用同一個 `Quote` 結構，未來可直接映射到 Supabase 或 Firebase。

## Quote

```ts
type Quote = {
  id: string;
  title: string;
  createdAt: string;
  client: ClientInfo;
  items: Record<string, SelectedItem>;
  customItems?: CustomItem[];
  quoteNotes?: string;
  depositRate: number;
  logoDataUrl: string;
  qrDataUrl: string;
  signatureDataUrl: string;
};
```

## ClientInfo

```ts
type ClientInfo = {
  clientName: string;
  contact: string;
  shootDate: string;
  location: string;
  quoteDate: string;
  validUntil: string;
  notes: string;
};
```

## CustomItem

```ts
type CustomItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
};
```

## 未來雲端資料庫建議

Supabase 可拆為：

- `quotes`
- `quote_clients`
- `quote_items`
- `quote_custom_items`
- `quote_assets`

Firebase 可保留為單文件：

```text
quotes/{quoteId}
```

Logo、QR Code、簽名目前以 base64 data URL 儲存。若改為雲端版本，建議將圖片上傳到 Supabase Storage 或 Firebase Storage，再把圖片 URL 存回 quote。
