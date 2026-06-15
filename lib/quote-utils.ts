export function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const currency = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 0
});

export function formatMoney(value: number) {
  return `NT$ ${currency.format(value)}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
