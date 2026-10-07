"""Add three alternatives per phrase/sentence level, retaining the original first choice."""
import json
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
public = ROOT / 'dist'
data = json.loads((public / 'data.json').read_text())
entries = json.loads((ROOT / 'content/phrase-variants.json').read_text())
targets = {obj['word'] for photo in data['photos'] for obj in photo['objects']}
assert {entry['word'] for entry in entries} == targets
assert len(entries) == len(targets)
data['words'] = {key: value for key, value in data['words'].items() if not key.startswith('variant_')}
known = {(w['zh'], w['tw'], w['roman']): key for key, w in data['words'].items()}
choices = {}
for entry in entries:
    base = entry['word']
    choices[base] = {}
    for length in ('phrases', 'sentences'):
        assert len(entry[length]) == 2
        choices[base][length] = []
        for i, spec in enumerate(entry[length], 2):
            signature = tuple(spec[k] for k in ('zh', 'tw', 'roman'))
            key = known.get(signature)
            if key is None:
                key = f'variant_{base}_{length}_{i}'
                word = {k: spec[k] for k in ('zh', 'tw', 'roman')}
                word.update(source='ithuan-sentence', sourceUrl='https://itaigi.tw/',
                            zhAudio=f'/assets/audio/zh/{key}.mp3', twAudio=f'/assets/audio/tw/{key}.mp3',
                            recordingUrl='https://hapsing.itaigi.tw/bangtsam?' + urllib.parse.urlencode(
                                {'taibun': spec.get('synthesisRoman', word['roman'])}))
                data['words'][key] = word
                known[signature] = key
            choices[base][length].append(key)
for photo in data['photos']:
    for obj in photo['objects']:
        levels = obj.get('levels', photo.get('levels'))
        assert len(levels) == 3
        extra = choices[obj['word']]
        obj['levelChoices'] = [[levels[0]], [levels[1], *extra['phrases']], [levels[2], *extra['sentences']]]
        for row in obj['levelChoices']:
            assert len(set(row)) == len(row)
            for language in ('zh', 'tw'):
                assert len({data['words'][key][language] for key in row}) == len(row), (obj['word'], language, row)
data['mouthHints'] = json.loads((ROOT / 'content/mouth-hints.json').read_text())
assert set(data['mouthHints']).issubset(targets)
output = Path('/tmp/speak-variants-audio.json') if '--audio-only' in sys.argv else public / 'data.json'
output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print('Prepared', len(targets), 'base words with 1/3/3 choices;', len(data['words']), 'total utterances')
