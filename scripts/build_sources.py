"""Render attribution from the current data, including original image sources."""
import json,html,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];public=ROOT/'dist'
data=json.loads((public/'data.json').read_text())
escape=html.escape
def url(value):return escape(urllib.parse.quote(value,safe=':/?=&'))
rows=[]
for w in data['words'].values():
 label='教育部辭典／萌典' if w['source']=='moe' else 'iTaigi／意傳合成語音'
 rows.append(f'<tr><td>{escape(w["zh"])}</td><td>{escape(w["tw"])}<small>{escape(w["roman"])}</small></td><td><a href="{url(w["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{label}</a></td></tr>')
images=[]
for photo in data['photos']:
 if photo.get('kind')!='pictogram':continue
 s=photo['source']
 images.append(f'<article class="image-source"><img src="{escape(photo["image"])}" alt="{escape(photo["title"])}" loading="lazy" width="500" height="500"><h3>{escape(photo["title"])}</h3><p><a href="{url(s["sourcePage"])}" target="_blank" rel="noopener noreferrer">查看 ARASAAC 原圖</a></p><p>{escape(s["creator"])}<br>{escape(s["owner"])}<br><a href="{url(s["licenseUrl"])}">{escape(s["license"])}</a></p></article>')
page='''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>圖片與發音來源｜一起說</title><link rel="stylesheet" href="/styles.css"></head><body><main class="source-page"><a class="back" href="/">← 回到看圖練習</a><h1>圖片與發音來源</h1><p>生活照片由本練習的相簿提供。37 張新增圖卡取自 ARASAAC，作者 Sergio Palao，所有者 Gobierno de Aragón。圖片保留原始 PNG，依 <a href="https://arasaac.org/terms-of-use">CC BY-NC-SA</a> 使用，限非商業用途；衍生圖卡須以相同授權分享。</p><h2>圖卡來源</h2><div class="image-sources">'''+''.join(images)+'''</div><h2>單字發音</h2><p>中文使用台灣中文合成語音。台語依各來源錄音播放，表中保留詞典列出的台羅讀法；含斜線時表示詞典列有不同腔調，實際播放以錄音為準。</p><table class="source-table"><thead><tr><th scope="col">中文</th><th scope="col">台語</th><th scope="col">來源</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table><p>64 個詞彙使用教育部詞典原始錄音，依 <a href="https://creativecommons.org/licenses/by-nd/3.0/tw/">CC 姓名標示－禁止改作 3.0 臺灣</a>使用。資料整理：<a href="https://github.com/g0v/moedict-data-twblg">g0v 台語詞典資料</a>。「血壓計、遙控器」使用 iTaigi 群眾辭典（CC0）與其公開的意傳科技台語合成發音。</p></main></body></html>'''
(public/'sources.html').write_text(page)
print('Attribution rendered for',len(images),'images and',len(rows),'words')
