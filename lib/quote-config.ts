import type { ClientInfo, PriceItem, SelectedItem, TermSection } from "./quote-types";

export const brand = {
  name: "alancho_0",
  phone: "0905390816",
  email: "a0916088771@gmail.com"
};

export const priceItems: PriceItem[] = [
  { id: "reels-shoot", category: "service", group: "動態紀錄", name: "Reels 拍攝", price: 5000 },
  { id: "reels-edit", category: "service", group: "動態紀錄", name: "Reels 單剪輯", price: 1500 },
  { id: "video-half", category: "service", group: "動態紀錄", name: "動態紀錄半天", price: 15000 },
  { id: "video-full", category: "service", group: "動態紀錄", name: "動態紀錄全天", price: 30000 },
  {
    id: "video-overtime",
    category: "service",
    group: "動態紀錄",
    name: "超時費",
    price: 2000,
    unit: "小時",
    quantityLabel: "小時",
    quantityEnabled: true
  },
  { id: "photo-half", category: "service", group: "活動平面紀錄", name: "半天 5 小時", price: 8000 },
  { id: "photo-full", category: "service", group: "活動平面紀錄", name: "一整天 8 小時", price: 15000 },
  {
    id: "photo-overtime",
    category: "service",
    group: "活動平面紀錄",
    name: "加時費",
    price: 2000,
    unit: "小時",
    quantityLabel: "小時",
    quantityEnabled: true
  },
  { id: "rush", category: "addon", group: "加購項目", name: "急件", price: 2000 },
  { id: "raw", category: "addon", group: "加購項目", name: "毛片", price: 2500 },
  {
    id: "retouch",
    category: "addon",
    group: "加購項目",
    name: "額外精修",
    price: 300,
    unit: "張",
    quantityLabel: "張數",
    quantityEnabled: true
  },
  { id: "drone", category: "addon", group: "加購項目", name: "空拍", price: 3000 },
  { id: "video-editing", category: "addon", group: "加購項目", name: "動態剪輯", price: 5000 }
];

export const terms: TermSection[] = [
  {
    title: "基本說明",
    items: [
      "報價內容依本單明細為準，檔期以訂金完成後保留。",
      "如需更改拍攝日期、地點或服務內容，請提前與攝影師確認。",
      "未列於明細之交通、場租或特殊器材需求，將依實際情況另行報價。"
    ]
  },
  {
    title: "修改規範",
    items: [
      "剪輯作品包含 3 次免費修改機會。",
      "每次修改需於收到作品後 14 日內提出。",
      "超過 3 次修改後，每次修改酌收 NT$1,000 修改費。",
      "若修改內容涉及大幅度重剪、重新企劃、重新配樂或新增素材，將另行報價。"
    ]
  },
  {
    title: "專案討論期限",
    items: [
      "專案討論期限自拍攝結束日起算 3 個月。",
      "客戶需於期限內完成所有修改與確認流程。",
      "若客戶超過 3 個月未回覆、未提供修改需求或失去聯繫，視同確認目前版本。",
      "alancho_0 有權直接交付最終版本並結案。",
      "即使客戶未回覆、未下載檔案或未完成確認，仍須依原報價支付全部費用。"
    ]
  },
  {
    title: "拍攝取消與延期規範",
    items: [
      "拍攝日前 14 天以上取消，可退還訂金 80%。",
      "拍攝日前 7 至 13 天取消，可退還訂金 50%。",
      "拍攝日前 3 至 6 天取消，可退還訂金 30%。",
      "拍攝日前 72 小時內取消，訂金恕不退還。",
      "因天災、颱風、豪雨等不可抗力因素，可免費延期一次。",
      "延期後再次取消，則依上述取消規範辦理。"
    ]
  },
  {
    title: "付款方式",
    items: [
      "確認檔期後需支付總金額 50% 作為訂金。",
      "拍攝完成後需支付剩餘尾款。",
      "作品交付前需完成所有款項支付。"
    ]
  }
];

export const createEmptyClient = (): ClientInfo => ({
  clientName: "",
  contact: "",
  shootDate: "",
  location: "",
  quoteDate: new Date().toISOString().slice(0, 10),
  validUntil: "",
  notes: ""
});

export const createInitialItems = (): Record<string, SelectedItem> =>
  priceItems.reduce<Record<string, SelectedItem>>((acc, item) => {
    acc[item.id] = { selected: false, quantity: 1 };
    return acc;
  }, {});
