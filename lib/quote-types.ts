export type ClientInfo = {
  clientName: string;
  contact: string;
  shootDate: string;
  location: string;
  quoteDate: string;
  validUntil: string;
  notes: string;
};

export type SelectedItem = {
  selected: boolean;
  quantity: number;
};

export type CustomItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
};

export type Quote = {
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

export type PriceItem = {
  id: string;
  category: "service" | "addon";
  group: string;
  name: string;
  price: number;
  unit?: string;
  quantityLabel?: string;
  quantityEnabled?: boolean;
};

export type QuoteLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  note?: string;
  subtotal: number;
};

export type SelectedQuoteLine = QuoteLine & {
  category: "service" | "addon";
};

export type TermSection = {
  title: string;
  items: string[];
};
