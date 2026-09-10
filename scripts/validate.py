"""Check every asset, photo annotation and actual audio decode before release."""
import json, subprocess, re
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
public=ROOT/'dist'
data=json.loads((public/'data.json').read_text())
assert len(data['photos'])==25
assert len({p['id'] for p in data['photos']})==25
assert {p['id'] for p in data['photos']}=={p.stem for p in (ROOT/'pic').glob('*.jpeg')}
for photo in data['photos']:
 image=Image.open(public/'assets/photos'/f'{photo["id"]}.webp')
 assert image.size==(photo['width'],photo['height'])
 assert photo['objects']
 for obj in photo['objects']:
  assert obj['word'] in data['words']
  x,y,w,h=obj['box'];assert min(x,y)>=0 and min(w,h)>0 and x+w<=100 and y+h<=100
  # Minimum target size is reinforced by CSS, with full-size text buttons as an alternative.
for key,word in data['words'].items():
 for field in ['zhAudio','twAudio']:
  path=public/word[field].lstrip('/')
  assert path.exists() and path.stat().st_size>1000, path
  probe=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(path)],check=True,capture_output=True,text=True)
  duration=float(json.loads(probe.stdout)['format']['duration']);assert .2<duration<15,(path,duration)
  decoded=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
  volume=re.search(r'max_volume: ([-\w.]+) dB',decoded.stderr)
  assert volume and volume[1]!='-inf' and float(volume[1]) > -45, (path,volume)
class AssetParser(HTMLParser):
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src') and value and value.startswith('/') and not value.startswith('//'):
    path=public/value.lstrip('/');assert path.exists(),path
for page in public.glob('*.html'):AssetParser().feed(page.read_text())
subprocess.run(['node','--check',str(public/'app.js')],check=True)
print(f'PASS: {len(data["photos"])} photos, {sum(len(p["objects"]) for p in data["photos"])} annotations, {2*len(data["words"])} playable, non-silent audio files; HTML assets and JS syntax valid.')
