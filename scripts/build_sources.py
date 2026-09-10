"""Render attribution from the current data, including original image sources."""
import json,html,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];public=ROOT/'dist'
data=json.loads((public/'data.json').read_text())
escape=html.escape
def url(value):return escape(urllib.parse.quote(value,safe=':/?=&%'))
rows=[]
for w in data['words'].values():
 label={'moe':'教育部辭典／萌典','ithuan-sentence':'意傳科技整句合成語音'}.get(w['source'],'iTaigi／意傳合成語音')
 rows.append(f'<tr><td>{escape(w["zh"])}</td><td>{escape(w["tw"])}<small>{escape(w["roman"])}</small></td><td><a href="{url(w["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{label}</a></td></tr>')
images=[]
seen_images=set()
for photo in data['photos']:
 if photo.get('kind')!='pictogram':continue
 if photo['image'] in seen_images:continue
 seen_images.add(photo['image'])
 s=photo['source']
 images.append(f'<article class="image-source"><img src="{escape(photo["image"])}" alt="{escape(photo["title"])}" loading="lazy" width="500" height="500"><h3>{escape(photo["title"])}</h3><p><a href="{url(s["sourcePage"])}" target="_blank" rel="noopener noreferrer">查看 ARASAAC 原圖</a></p><p>{escape(s["creator"])}<br>{escape(s["owner"])}<br><a href="{url(s["licenseUrl"])}">{escape(s["license"])}</a></p></article>')
page='''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>圖片與發音來源｜一起說</title><link rel="stylesheet" href="/styles.css"></head><body><main class="source-page"><a class="back" href="/">← 回到看圖練習</a><h1>圖片與發音來源</h1><p>生活照片由本練習的相簿提供。37 張新增圖卡取自 ARASAAC，作者 Sergio Palao，所有者 Gobierno de Aragón。圖片保留原始 PNG，依 <a href="https://arasaac.org/terms-of-use">CC BY-NC-SA</a> 使用，限非商業用途；衍生圖卡須以相同授權分享。</p><h2>圖卡來源</h2><div class="image-sources">'''+''.join(images)+'''</div><h2>單字發音</h2><p>中文使用台灣中文合成語音。台語依各來源錄音播放，表中保留詞典列出的台羅讀法；含斜線時表示詞典列有不同腔調，實際播放以錄音為準。</p><table class="source-table"><thead><tr><th scope="col">中文</th><th scope="col">台語</th><th scope="col">來源</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table><p>64 個詞彙使用教育部詞典原始錄音，依 <a href="https://creativecommons.org/licenses/by-nd/3.0/tw/">CC 姓名標示－禁止改作 3.0 臺灣</a>使用。資料整理：<a href="https://github.com/g0v/moedict-data-twblg">g0v 台語詞典資料</a>。「血壓計、遙控器」使用 iTaigi 群眾辭典（CC0）與其公開的意傳科技台語合成發音。</p></main></body></html>'''
page=page.replace('37 張新增圖卡',f'{len(images)} 張圖卡')
moe_count=sum(w['source']=='moe' for w in data['words'].values())
page=page.replace('64 個詞彙',f'{moe_count} 個詞彙')
page=page.replace('單字發音','單字與生活短句發音')
page=page.replace('表中保留詞典列出的台羅讀法','詞典單字保留詞典列出的台羅讀法')
page=page.replace('</main>', '<p>全部 67 張練習卡皆有單字、短語、句子三種長度，包含生活照片、生活需求、身體部位、廚房用具、天氣、身體感受。共 138 段不同的台語短語及句子由意傳科技服務以完整台羅語句合成，未將單字音檔拼接。合成語音與詞典錄音的音色可能不同。國語每段也使用完整語句合成。</p><p>台語詞彙與動詞讀法參考教育部辭典，包含疼、寒、便所、歇睏、鬥相共、開、食、拍、提、掛、穿、用、洗、倒、拭、磅、痠、癢、吐、天色、天氣、今仔日、外口等；「掛喙罨」與「我想欲吐」採辭典用例。語句為本練習編寫，台羅標示本調；實際合成的語調可能與家人慣用腔調不同。</p></main>')
(public/'sources.html').write_text(page)
print('Attribution rendered for',len(images),'images and',len(rows),'words')
