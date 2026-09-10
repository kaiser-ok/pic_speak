# 一起說

手機生活照片發音練習。25 張照片、31 個物品點選框、29 個詞彙。預設每次點擊依序播放一次中文、一次台語，中間停頓 0.65 秒；再點會從頭播放，聲音不重疊。可選擇只聽中文或台語。左右滑動、上一張／下一張及鍵盤左右鍵均可換圖。

## 維護

- 網頁直接位於 `dist/`，沒有第三方前端套件、登入程式或分析追蹤。
- 原圖保留在 `pic/`。部署圖片在 `dist/assets/photos/`，縮至 1080 像素寬的 WebP 並保留方向、比例，移除原圖 EXIF。
- `dist/data.json` 是實際使用的照片清單、詞彙和百分比點選框 `[left, top, width, height]`。
- 來源標註見 `dist/sources.html`。27 詞使用教育部詞典原始台語錄音；2 詞使用 iTaigi／意傳科技台語合成發音；中文使用 macOS Meijia。
- `scripts/prepare_content.py` 可用 g0v/moedict-data-twblg 的 `dict-twblg.json` 與 `dict-twblg-ext.json` 重建資料。
- `scripts/prepare_audio.py` 重用已存在音檔，下載詞典原始台語音檔並產生缺少的中文音檔。需要 macOS、ffmpeg，以及生成中文語音的系統服務權限。空音檔會檢查並拒絕。
- 本機預覽：`python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`。
- 驗證：`python3 scripts/validate.py`。檢查全部資產、框的位置、照片完整性、所有音檔實際解碼、長度與非靜音，及 JavaScript 語法。

## 驗證範圍

本次已進行靜態資產與所有音檔的實際解碼檢查。尚未在實體 iPhone／Android 上驗證觸控及音訊輸出。支援 WebMCP 的瀏覽器可使用 `read_photo_practice` 和 `select_photo_practice`；目前環境無可用 WebMCP 驗證上下文，未驗證其註冊與執行。

台語地區腔調可能不同，iTaigi 的兩個詞為群眾提供的讀法。這是發音練習工具，沒有療效評估、診斷或語音評分。
