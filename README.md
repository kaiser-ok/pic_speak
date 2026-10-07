# 一起說

手機看圖發音練習。共 72 張練習卡、222 組詞彙與短句、444 個中台語音檔。分類為生活照片（25）、生活需求（5）、身體部位（12）、廚房用具（10）、天氣（5）、身體感受（10）、佛教與信仰（5）；也可選全部。全部分類均可切換單字、短語、句子。生活需求重用「冷」圖卡，另增加 4 張圖片。切換分類不自動發音，左右滑動僅在所選分類換圖。

預設每次點擊依序播放一次中文、一次台語，中間停頓 0.65 秒；再點會從頭播放，聲音不重疊。可選擇只聽中文或台語。左右滑動、上一張／下一張及鍵盤左右鍵均可換圖。

播放時會依每段錄音的量測結果自動平衡音量，補足較小聲的台語，同時降低過大的錄音；不需要逐字調整音量。

新增的身體感受為：冷、熱、痛、餓、口渴、累、頭暈、癢、反胃、發麻。「冷」採身體感冷的「寒 kuânn」；「熱」採口語熱感的「熱 jua̍h/lua̍h」，未使用物品溫度的 jia̍t/lia̍t。「發麻」圖卡表達刺麻感，不表示完全失去感覺。

## 維護

- Vercel 部署使用根目錄的 `vercel.json`，直接發布 `dist/`，不需要建置。匯入 GitHub 專案時 Root Directory 保持儲存庫根目錄；`main` 更新後會觸發重新部署。

- 網頁直接位於 `dist/`，沒有第三方前端套件、登入程式或分析追蹤。
- 原圖保留在 `pic/`。部署圖片在 `dist/assets/photos/`，縮至 1080 像素寬的 WebP 並保留方向、比例，移除原圖 EXIF。
- `dist/data.json` 是實際使用的照片清單、詞彙和百分比點選框 `[left, top, width, height]`。
- 來源標註見 `dist/sources.html`。71 詞使用教育部詞典原始台語錄音；2 詞使用 iTaigi／意傳科技台語合成發音；生活需求 10 段、生活照片 58 段、其他四類新增 70 段短語與句子、佛教與信仰 11 段詞句由意傳服務以完整台羅合成，沒有拼接單字錄音；中文使用 macOS Meijia。
- 新增圖片在 `dist/assets/pictograms/`，保留 ARASAAC 原始 PNG。作者 Sergio Palao，所有者 Gobierno de Aragón。依 CC BY-NC-SA 非商業授權使用；衍生圖卡須以相同授權分享。逐張來源見 `content/image-sources.json`，官方條款：https://arasaac.org/terms-of-use 。此授權不改變教育部錄音或原始生活照片的各自權利。
- 新增詞彙設定在 `content/expansion.json`；執行 `scripts/expand_content.py`（相同兩個詞典參數）可合併為完整資料。執行 `python3 scripts/build_sources.py` 更新來源頁。
- `scripts/prepare_content.py` 可用 g0v/moedict-data-twblg 的 `dict-twblg.json` 與 `dict-twblg-ext.json` 重建資料。
- `scripts/prepare_audio.py` 重用已存在音檔，下載詞典原始台語音檔並產生缺少的中文音檔。需要 macOS、ffmpeg，以及生成中文語音的系統服務權限。空音檔會檢查並拒絕。
- 本機預覽：`python3 -m http.server 4173 --bind 127.0.0.1 --directory dist`。
- 新增或重建詞句、替換音檔後，最後執行 `python3 scripts/prepare_audio_levels.py` 重建音量資料，再執行驗證。
- 驗證：`python3 scripts/validate.py`。檢查全部資產、框的位置、照片完整性、所有音檔實際解碼、長度與非靜音、音量資料與檔案是否一致，及 JavaScript 語法與播放增益測試。

## 音量平衡

- `scripts/prepare_audio_levels.py` 以 [FFmpeg loudnorm](https://ffmpeg.org/ffmpeg-filters.html#loudnorm) 量測全部中文及台語，使用 dual-mono 對齊單聲道在雙聲道輸出的響度。短於 0.5 秒的錄音只在分析時補靜音，不改變實際播放長度。
- 目標為 -16 LUFS，真峰值上限 -1.5 dBTP，最大增益 18 dB。峰值較高的錄音優先保留餘量，因此不強制每段達到完全相同的響度。
- 結果與原音檔 SHA-256 儲存在 `dist/data.json` 的 `audioLevels`；執行 `python3 scripts/prepare_audio_levels.py --check` 可檢查新增、缺漏或已替換的音檔，避免沿用錯誤增益。
- `dist/audio-levels.mjs` 在音檔解碼後一次套用增益，並依實際解碼樣本限制峰值。快取保留調整後的音訊，重播不會累加音量；原始 MP3 不重編碼，不改語速、音高或字句。

## 生活需求練習

「生活需求」包含疼痛、覺得冷、上廁所、休息、求助。每張卡有單字／短語／句子三種長度，以「練短一點」「練長一點」切換；換卡會回到單字。所有長度都能直接選擇，不設過關條件，也不自動播放。

詞句、台羅與圖片上的詞名直接顯示；點圖片或「聽發音」會播放目前長度。換卡、改長度或切換語言會取消之前的播放。此版沒有評分或練習紀錄。

- 詞句設定：`content/needs.json`；新增圖片來源：`content/needs-image-sources.json`。4 張新 ARASAAC 原圖採 CC BY-NC-SA 4.0，作者與所有權依來源頁標註。
- 重建流程：在原本詞彙資料準備好後執行 `python3 scripts/prepare_needs.py --audio-only`、`python3 scripts/prepare_needs_audio.py`、`python3 scripts/prepare_needs.py`、`python3 scripts/build_sources.py`。語音準備需要網路、macOS Meijia 與 ffmpeg。
- 若重新執行 `expand_content.py`，接著依序執行 `prepare_needs.py`、`prepare_life_phrases.py`、`prepare_topic_phrases.py`、`prepare_faith.py` 補齊所有分類的長短句，再更新來源頁。
- 狀態回歸測試：`node --test scripts/practice-state.test.mjs`，涵蓋全部分類的三段長度、切換圖卡及物品後的長度重設、多物品照片、同一物品重播、不同分類共用短句時的正確單字；完整驗證也會執行此測試。

## 生活照片長短句

25 張生活照片的 29 種物品都有單字、短語、句子三種長度，例如「電話 → 打電話 → 我要打電話」。照片上的框與物品按鈕保留物品名稱，發音卡顯示目前長度。切換長度不會自動播放；點目前物品會重播目前長度，改點另一個物品會回到它的單字並播放。換照片也會回到第一個物品的單字。

- 設定檔：`content/life-phrases.json`。同一物品出現在不同照片時共用詞句與音檔。
- 新增或修改後依序執行：`python3 scripts/prepare_life_phrases.py --audio-only`、`python3 scripts/prepare_needs_audio.py /tmp/speak-life-audio.json --prefix life_`、`python3 scripts/prepare_life_phrases.py`、`python3 scripts/build_sources.py`。語音腳本共用整句產生與下載流程。
- 台語短句採固定的一種讀音，不將詞典列出的斜線腔調直接送入合成；例：鞋採 ê、吹風機採 tshue-hong-ki、雞卵採 ke-nn̄g、曆日採 la̍h-ji̍t。語句用於練習表達，不代表照片中的人物正在執行該動作。

## 其他分類長短句

身體部位 12 詞、廚房用具 10 詞、天氣 5 詞、身體感受 10 詞也提供三種長度，例如「手 → 洗手 → 我要洗手」、「碗 → 洗碗 → 我要洗碗」、「下雨 → 在下雨 → 外面在下雨」、「反胃 → 想吐 → 我想吐」。操作與生活照片相同，文字直接顯示，切換長度不自動發音。

- 詞句設定：`content/topic-phrases.json`。冷與腳的短語、句子共用已存在的「很冷／我很冷」與「腳痛／我的腳痛」音檔，共新增 70 段雙語詞句。
- 「用筷子」合成時以 `synthesisRoman` 加上句尾標點，避免合成服務產生異常長音檔；畫面仍顯示原本台羅。語音產生腳本會拒絕長度異常的新音檔。
- 建立音檔與合併資料：`python3 scripts/prepare_topic_phrases.py --audio-only`、`python3 scripts/prepare_needs_audio.py /tmp/speak-topic-audio.json --prefix topic_`、`python3 scripts/prepare_topic_phrases.py`、`python3 scripts/build_sources.py`。
- 感受用語為練習表達範例，沒有症狀判讀。台語採詞典口語讀音：身體感熱採 jua̍h，痠採 sng，想吐採 siūnn-beh thòo，並保留台語本調文字供參照。

## 佛教與信仰

新增 5 張照片：土地公、拜拜、佛祖、城隍廟、觀世音菩薩。此分類收錄佛教及臺灣民間信仰常用的稱呼與活動。每張皆提供三種長度，例如「拜拜 → 去拜拜 → 我要去拜拜」及「城隍廟 → 去城隍廟 → 我要去城隍廟」。切換長度不自動播放，沿用中台語與音量平衡。

- 詞句設定：`content/faith.json`；照片及逐張作者、授權資訊：`content/faith-image-sources.json`。照片來源連結同時顯示於圖卡下方及來源頁。
- 土地公、拜拜、佛祖、城隍廟使用教育部辭典原始台語錄音；觀世音菩薩完整稱呼及全部 10 段短語、句子使用完整台羅合成，未拼接錄音。觀世音菩薩採 Kuan-sè-im phôo-sat。
- 重建：`python3 scripts/prepare_faith.py --audio-only`、`python3 scripts/prepare_needs_audio.py /tmp/speak-faith-audio.json --prefix faith_`、`python3 scripts/prepare_faith.py`、`python3 scripts/build_sources.py`、`python3 scripts/prepare_audio_levels.py`，最後執行 `python3 scripts/validate.py`。

## 驗證範圍

音量平衡功能已將原有 414 段解碼為 48 kHz 浮點音訊，套用實際播放函式後重新量測：響度範圍 -17.85～-15.59 LUFS，最高真峰值 -1.5 dBTP。另有增益、雙聲道峰值限制、靜音及缺少設定的回歸測試。

本次已進行靜態資產與所有音檔的實際解碼檢查。尚未在實體 iPhone／Android 上驗證觸控及音訊輸出；台語整句合成也尚未經使用者或台語教師審聽。支援 WebMCP 的瀏覽器可使用 `read_photo_practice` 和 `select_photo_practice`；目前環境無可用 WebMCP 驗證上下文，未驗證其註冊與執行。

台語地區腔調可能不同，iTaigi 的兩個詞為群眾提供的讀法。這是發音練習工具，沒有療效評估、診斷或語音評分。
