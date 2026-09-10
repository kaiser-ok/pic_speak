"""Attach three speaking lengths to every annotated object in the life photos."""
import json, sys, urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
public = ROOT / 'dist'
data = json.loads((public / 'data.json').read_text())
entries = json.loads((ROOT / 'content/life-phrases.json').read_text())
life_objects = {o['word'] for p in data['photos'] if p['category'] == 'life' for o in p['objects']}
assert {entry['word'] for entry in entries} == life_objects
assert len(entries) == len(life_objects)
levels = {}
for entry in entries:
    base = entry['word']
    levels[base] = [base]
    for length in ['phrase', 'sentence']:
        key = f'life_{base}_{length}'
        word = dict(entry[length])
        word.update(source='ithuan-sentence', sourceUrl='https://itaigi.tw/',
                    zhAudio=f'/assets/audio/zh/{key}.mp3', twAudio=f'/assets/audio/tw/{key}.mp3',
                    recordingUrl='https://hapsing.itaigi.tw/bangtsam?' + urllib.parse.urlencode({'taibun': word['roman']}))
        data['words'][key] = word
        levels[base].append(key)
for photo in data['photos']:
    if photo['category'] == 'life':
        for obj in photo['objects']:
            obj['levels'] = levels[obj['word']]
output = Path('/tmp/speak-life-audio.json') if '--audio-only' in sys.argv else public / 'data.json'
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Prepared', len(entries), 'life objects with 3 lengths;', len(data['words']), 'total words and phrases')
