"""Merge faith vocabulary, photographs and complete bilingual utterances."""
import json
import sys
import urllib.parse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
public = ROOT / 'dist'
data = json.loads((public / 'data.json').read_text())
entries = json.loads((ROOT / 'content/faith.json').read_text())
for entry in entries:
    for level in entry['levels']:
        key = level['word']
        word = {field: level[field] for field in ('zh', 'tw', 'roman')}
        word['zhAudio'] = f'/assets/audio/zh/{key}.mp3'
        if 'audioId' in level:
            aid = level['audioId']
            word.update(source='moe', audioId=aid, twAudio=f'/assets/audio/tw/{aid}.mp3',
                        sourceUrl="https://www.moedict.tw/'" + word['tw'],
                        recordingUrl=f'https://r2-assets.moedict.tw/audio/t/{aid}.mp3')
        else:
            word.update(source='ithuan-sentence', twAudio=f'/assets/audio/tw/{key}.mp3',
                        sourceUrl='https://itaigi.tw/',
                        recordingUrl='https://hapsing.itaigi.tw/bangtsam?' + urllib.parse.urlencode(
                            {'taibun': level.get('synthesisRoman', level['roman'])}))
        data['words'][key] = word

if '--audio-only' in sys.argv:
    output = Path('/tmp/speak-faith-audio.json')
else:
    sources = {s['key']: s for s in json.loads((ROOT / 'content/faith-image-sources.json').read_text())}
    data['photos'] = [p for p in data['photos'] if p.get('category') != 'faith']
    data['categories'] = [c for c in data['categories'] if c['id'] != 'faith']
    data['categories'].append({'id': 'faith', 'label': '佛教與信仰'})
    for entry in entries:
        source = sources[entry['id']]
        image = source['localPath']
        with Image.open(public / image.lstrip('/')) as im:
            width, height = im.size
        levels = [level['word'] for level in entry['levels']]
        data['photos'].append(dict(id='faith_' + entry['id'], category='faith', kind='photo',
            title=entry['title'], alt=source.get('alt', entry['alt']), image=image,
            width=width, height=height, source=source,
            objects=[dict(word=levels[0], levels=levels, box=source.get('box', [3, 3, 94, 94]))]))
    output = public / 'data.json'
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Prepared', len(entries), 'faith cards;', len(data['words']), 'total words and phrases')
