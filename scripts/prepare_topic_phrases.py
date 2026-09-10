"""Add speaking lengths to body, kitchen, weather and feeling pictograms."""
import json, sys, urllib.parse
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
public = ROOT / 'dist'
data = json.loads((public / 'data.json').read_text())
entries = json.loads((ROOT / 'content/topic-phrases.json').read_text())
categories = {'body', 'kitchen', 'weather', 'feelings'}
targets = {(p['category'], obj['word']) for p in data['photos'] if p['category'] in categories for obj in p['objects']}
assert {(entry['category'], entry['word']) for entry in entries} == targets
assert len(entries) == len(targets)
levels = {}
for entry in entries:
    base = entry['word']
    levels[base] = [base]
    for length in ['phrase', 'sentence']:
        spec = entry[length]
        if 'word' in spec:
            key = spec['word']
            assert key in data['words'], f'Run prepare_needs.py before this script: {key}'
        else:
            key = f'topic_{base}_{length}'
            word = dict(spec)
            synthesis_roman = word.pop('synthesisRoman', word['roman'])
            word.update(source='ithuan-sentence', sourceUrl='https://itaigi.tw/',
                        zhAudio=f'/assets/audio/zh/{key}.mp3', twAudio=f'/assets/audio/tw/{key}.mp3',
                        recordingUrl='https://hapsing.itaigi.tw/bangtsam?' + urllib.parse.urlencode({'taibun': synthesis_roman}))
            data['words'][key] = word
        levels[base].append(key)
for photo in data['photos']:
    if photo['category'] in categories:
        for obj in photo['objects']:
            obj['levels'] = levels[obj['word']]
output = Path('/tmp/speak-topic-audio.json') if '--audio-only' in sys.argv else public / 'data.json'
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Prepared', len(entries), 'topic words with three lengths;', len(data['words']), 'total words and phrases')
