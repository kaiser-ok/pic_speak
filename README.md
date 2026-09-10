# 一起說

手機看圖發音練習。25 張生活照片加 37 張溝通圖卡，共 62 張圖片、66 個詞彙、132 個中台語音檔。分類為生活照片、身體部位（12）、廚房用具（10）、天氣（5）、身體感受（10）；也可選全部。切換分類不自動發音，左右滑動僅在所選分類換圖。

預設每次點擊依序播放一次中文、一次台語，中間停頓 0.65 秒；再點會從頭播放，聲音不重疊。可選擇只聽中文或台語。左右滑動、上一張／下一張及鍵盤左右鍵均可換圖。

新增的身體感受為：冷、熱、痛、餓、口渴、累、頭暈、癢、反胃、發麻。「冷」採身體感冷的「寒 kuânn」；「熱」採口語熱感的「熱 jua̍h/lua̍h」，未使用物品溫度的 jia̍t/lia̍t。「發麻」圖卡表達刺麻感，不表示完全失去感覺。

## 維護

- Vercel 部署使用根目錄的 `vercel.json`，直接發布 `dist/`，不需要建置。匯入 GitHub 專案時 Root Directory 保持儲存庫根目錄；`main` 更新後會觸發重新部署。

- 網頁直接位於 `dist/`，沒有第三方前端套件、登入程式或分析追蹤。
- 原圖保留在 `pic/`。部署圖片在 `dist/assets/photos/`，縮至 1080 像素寬的 WebP 並保留方向、比例，移除原圖 EXIF。
- `dist/data.json` 是實際使用的照片清單、詞彙和百分比點選框 `[left, top, width, height]`。
- 來源標註見 `dist/sources.html`。64 詞使用教育部詞典原始台語錄音；2 詞使用 iTaigi／意傳科技台語合成發音；中文使用 macOS Meijia。
- 新增圖片在 `dist/assets/pictograms/`，保留 ARASAAC 原始 PNG。作者 Sergio Palao，所有者 Gobierno de Aragón。依 CC BY-NC-SA 非商業授權使用；衍生圖卡須以相同授權分享。逐張來源見 `content/image-sources.json`，官方條款：https://arasaac.org/terms-of-use 。此授權不改變教育部錄音或原始生活照片的各自權利。
- 新增詞彙設定在 `content/expansion.json`；執行 `scripts/expand_content.py`（相同兩個詞典參數）可合併為完整資料。執行 `python3 scripts/build_sources.py` 更新來源頁。
- `scripts/prepare_content.py` 可用 g0v/moedict-data-twblg 的 `dict-twblg.json` 與 `dict-twblg-ext.json` 重建資料。
- `scripts/prepare_audio.py` 重用已存在音檔，下載詞典原始台語音檔並產生缺少的中文音檔。需要 macOS、ffmpeg，以及生成中文語音的系統服務權限。空音檔會檢查並拒絕。
- 本機預覽：`python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`。
- 驗證：`python3 scripts/validate.py`。檢查全部資產、框的位置、照片完整性、所有音檔實際解碼、長度與非靜音，及 JavaScript 語法。

## 驗證範圍

本次已進行靜態資產與所有音檔的實際解碼檢查。尚未在實體 iPhone／Android 上驗證觸控及音訊輸出。支援 WebMCP 的瀏覽器可使用 `read_photo_practice` 和 `select_photo_practice`；目前環境無可用 WebMCP 驗證上下文，未驗證其註冊與執行。

台語地區腔調可能不同，iTaigi 的兩個詞為群眾提供的讀法。這是發音練習工具，沒有療效評估、診斷或語音評分。
