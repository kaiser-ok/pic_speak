"""Merge five needs cards. --audio-only stages words before assets are available."""
import json, sys, urllib.parse
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
public = ROOT / 'dist'
data = json.loads((public / 'data.json').read_text())
needs = json.loads((ROOT / 'content/needs.json').read_text())
data['photos'] = [p for p in data['photos'] if p.get('category') != 'needs']
data['categories'] = [c for c in data['categories'] if c['id'] != 'needs']
data['categories'].insert(1, dict(id='needs', label='生活需求'))
for need in needs:
    for level in need['levels']:
        if 'zh' not in level:
            assert level['word'] in data['words']
            continue
        key = level['word']
        word = {k: level[k] for k in ['zh', 'tw', 'roman']}
        word['zhAudio'] = f'/assets/audio/zh/{key}.mp3'
        if 'audioId' in level:
            aid = level['audioId']
            word.update(source='moe', audioId=aid, twAudio=f'/assets/audio/tw/{aid}.mp3',
                        sourceUrl="https://www.moedict.tw/'" + level['tw'],
                        recordingUrl=f'https://r2-assets.moedict.tw/audio/t/{aid}.mp3')
        else:
            word.update(source='ithuan-sentence', twAudio=f'/assets/audio/tw/{key}.mp3',
                        sourceUrl='https://itaigi.tw/',
                        recordingUrl='https://hapsing.itaigi.tw/bangtsam?' + urllib.parse.urlencode({'taibun': level['roman']}))
        data['words'][key] = word
if '--audio-only' in sys.argv:
    output = Path('/tmp/speak-needs-audio.json')
else:
    sources = json.loads((ROOT / 'content/needs-image-sources.json').read_text())
    sources += json.loads((ROOT / 'content/image-sources.json').read_text())
    sources = {s['key']: s for s in sources}
    for need in needs:
        key = need['imageKey']
        image = f'/assets/pictograms/{key}.png'
        with Image.open(public / image.lstrip('/')) as im:
            width, height = im.size
        data['photos'].append(dict(id='need_' + need['id'], title=need['title'],
            alt=need['title'] + '的情境圖卡', width=width, height=height, image=image,
            category='needs', kind='pictogram', source=sources[key],
            levels=[v['word'] for v in need['levels']],
            objects=[dict(word=need['levels'][0]['word'], box=[3, 3, 94, 94])]))
    output = public / 'data.json'
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Prepared', len(data['words']), 'words and phrases')
