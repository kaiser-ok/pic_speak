"""Add curated vocabulary and attributed pictograms; --audio-only stages word data.

Usage: python3 scripts/expand_content.py DICTIONARY EXT_DICTIONARY [--audio-only]
Image assets and content/image-sources.json must exist for the complete expansion.
"""
import json,sys,unicodedata
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
entries=json.loads((ROOT/'content/expansion.json').read_text())
dictionary=json.loads(Path(sys.argv[1]).read_text())+json.loads(Path(sys.argv[2]).read_text())
data=json.loads((ROOT/'dist/data.json').read_text())
data['photos']=[p for p in data['photos'] if p.get('category','life')=='life']
for p in data['photos']:
 p['category']='life'
 p['image']=f'/assets/photos/{p["id"]}.webp'
data['categories']=[dict(id=k,label=v) for k,v in [('all','全部'),('life','生活照片'),('body','身體部位'),('kitchen','廚房用具'),('weather','天氣'),('feelings','身體感受')]]
for entry in entries:
 key=entry['key'];row=next(r for r in dictionary if r['title']==entry['tw'])
 h=row['heteronyms'][entry.get('variant',0)];audio_id=h.get('audio_id',h['id']).zfill(5)
 data['words'][key]=dict(zh=entry['zh'],tw=entry['tw'],roman=unicodedata.normalize('NFC',h['trs']),
  audioId=audio_id,zhAudio=f'/assets/audio/zh/{key}.mp3',twAudio=f'/assets/audio/tw/{audio_id}.mp3',
  source='moe',sourceUrl="https://www.moedict.tw/'"+entry['tw'],recordingUrl=f'https://r2-assets.moedict.tw/audio/t/{audio_id}.mp3')
if '--audio-only' in sys.argv:
 output=Path('/tmp/speak-expanded-audio-data.json')
else:
 sources=json.loads((ROOT/'content/image-sources.json').read_text())
 sources={s['key']:s for s in sources}
 for entry in entries:
  key=entry['key'];source=sources[key]
  path=ROOT/'dist/assets/pictograms'/f'{key}.png';im=Image.open(path)
  data['photos'].append(dict(id='card_'+key,title=entry['zh'],alt=entry['zh']+'的溝通圖卡',
   width=im.width,height=im.height,image=f'/assets/pictograms/{key}.png',
   category=entry['category'],kind='pictogram',source=source,
   objects=[dict(word=key,box=[3,3,94,94])]))
 output=ROOT/'dist/data.json'
output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(f'{len(data["words"])} words written to {output}')
