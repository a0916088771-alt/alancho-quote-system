# alancho_0 攝影報價單系統

韓系、乾淨、高留白的攝影報價單網站。首頁可直接使用，不需要登入，適合長期部署在 Vercel，作為攝影工作室日常報價工具。

## 功能

- 客戶資料、拍攝日期、地點、報價期限與備註
- 固定服務項目與加購項目
- 多筆自訂項目：名稱、價格、數量、備註
- 自動計算小計、總金額、訂金與尾款
- Logo 上傳，未上傳時顯示 `alancho_0`
- QR Code 付款資訊上傳
- 手寫電子簽名
- 歷史報價儲存在同一台裝置的 `localStorage`
- 舊報價可重新開啟修改
- 一鍵開啟列印視窗，儲存為 PDF
- 響應式介面，手機、平板、電腦皆可使用

## 技術

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- localStorage

建議 Node.js 版本：20 以上。

## 安裝方式

```bash
npm install
```

## 本機啟動

```bash
npm run dev
```

打開瀏覽器前往：

```text
http://localhost:3000
```

## 正式建置

```bash
npm run build
```

建置完成後可用：

```bash
npm run start
```

## PDF 匯出測試

1. 開啟首頁。
2. 填入客戶資料。
3. 勾選服務項目或新增自訂項目。
4. 可選擇上傳 Logo、付款 QR Code，並手寫簽名。
5. 點選「匯出 PDF」。
6. 瀏覽器會開啟列印視窗。
7. 目的地選擇「儲存為 PDF」。

PDF 內容會包含品牌資訊、客戶資料、服務明細、自訂項目、加購項目、報價備註、總金額、訂金、尾款、付款資訊、注意事項與客戶簽名。

## 部署到 Vercel

### 使用 GitHub 匯入

1. 將專案推到 GitHub。
2. 到 [Vercel](https://vercel.com) 新增專案。
3. 匯入此 GitHub repository。
4. Framework Preset 選擇 `Next.js`。
5. Build Command 使用預設：

```bash
npm run build
```

6. Install Command 使用預設：

```bash
npm install
```

7. Output Directory 保持 Vercel 預設，不需另外設定。
8. 部署完成後即可直接使用首頁。

### Node 版本

專案已在 `package.json` 與 `.nvmrc` 指定 Node 20 以上。Vercel 通常會自動使用相容版本。

## 如何修改品牌資訊

品牌名稱、電話、Email 位於：

```text
lib/quote-config.ts
```

修改：

```ts
export const brand = {
  name: "alancho_0",
  phone: "0905390816",
  email: "a0916088771@gmail.com"
};
```

## 如何修改服務項目與價格

固定服務與加購項目位於：

```text
lib/quote-config.ts
```

修改 `priceItems` 即可調整名稱、分類、價格、單位與是否需要數量欄位。

範例：

```ts
{
  id: "photo-half",
  category: "service",
  group: "活動平面紀錄",
  name: "半天 5 小時",
  price: 8000
}
```

若項目需要輸入數量，例如小時或張數：

```ts
{
  id: "retouch",
  category: "addon",
  group: "加購項目",
  name: "額外精修",
  price: 300,
  unit: "張",
  quantityLabel: "張數",
  quantityEnabled: true
}
```

## 如何修改付款條款與取消規範

注意事項條款位於：

```text
lib/quote-config.ts
```

修改 `terms` 陣列即可。每個區塊包含：

```ts
{
  title: "付款方式",
  items: [
    "確認檔期後需支付總金額 50% 作為訂金。",
    "拍攝完成後需支付剩餘尾款。",
    "作品交付前需完成所有款項支付。"
  ]
}
```

這些條款會自動顯示在網頁與 PDF 中。

## localStorage 長期保存

報價歷史會儲存在同一台裝置、同一個瀏覽器的 `localStorage`。

注意：

- 不會上傳到伺服器。
- 清除瀏覽器資料會刪除歷史報價。
- 換裝置或換瀏覽器不會同步資料。

localStorage 存取邏輯位於：

```text
lib/quote-storage.ts
```

## 未來升級雲端資料庫

目前資料結構已集中在：

```text
lib/quote-types.ts
```

未來可接 Supabase 或 Firebase。資料模型說明在：

```text
docs/data-model.md
```

建議方向：

- Supabase：拆成 quotes、clients、items、custom_items、assets 等資料表。
- Firebase：每筆報價存成 `quotes/{quoteId}` 文件。
- Logo、QR Code、簽名可改存 Supabase Storage 或 Firebase Storage，報價資料只保存圖片 URL。

## 專案結構

```text
app/
  globals.css
  layout.tsx
  page.tsx
lib/
  quote-config.ts
  quote-storage.ts
  quote-types.ts
  quote-utils.ts
docs/
  data-model.md
```

主要維護位置：

- 畫面與互動：`app/page.tsx`
- 品牌、價格、條款：`lib/quote-config.ts`
- 資料型別：`lib/quote-types.ts`
- localStorage：`lib/quote-storage.ts`
- 金額格式、ID、圖片讀取：`lib/quote-utils.ts`

## 正式使用注意

此版本首頁直接可用，不含測試假資料。打開後會是乾淨表單，可直接建立正式報價單。
