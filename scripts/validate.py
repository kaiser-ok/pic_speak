"""Check every asset, photo annotation and actual audio decode before release."""
import json, subprocess, re, sys
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
public=ROOT/'dist'
data=json.loads((public/'data.json').read_text())
assert len(data['photos'])==67
assert len({p['id'] for p in data['photos']})==67
assert len(data['words'])==207
assert {p['id'] for p in data['photos'] if p.get('category')=='life'}=={p.stem for p in (ROOT/'pic').glob('*.jpeg')}
for category,count in [('life',25),('body',12),('kitchen',10),('weather',5),('feelings',10),('needs',5)]:
 assert sum(p.get('category')==category for p in data['photos'])==count,(category,count)
for category in data['categories']:
 visible=[p for p in data['photos'] if category['id']=='all' or p['category']==category['id']]
 assert visible
 assert visible[(len(visible)-1+1)%len(visible)]==visible[0]
 assert visible[(0-1+len(visible))%len(visible)]==visible[-1]
for photo in data['photos']:
 image=Image.open(public/photo['image'].lstrip('/'))
 assert image.size==(photo['width'],photo['height'])
 assert photo['objects']
 for obj in photo['objects']:
  assert obj['word'] in data['words']
  x,y,w,h=obj['box'];assert min(x,y)>=0 and min(w,h)>0 and x+w<=100 and y+h<=100
  if photo['category']!='needs':
   assert len(obj['levels'])==3
   assert len(set(obj['levels']))==3
   assert obj['levels'][0]==obj['word']
   for level in obj['levels']: assert level in data['words']
 if photo.get('kind')=='pictogram':
  assert photo['source']['creator'] and photo['source']['sourcePage'].startswith('https://arasaac.org/')
  assert photo['source']['license'] in ('CC BY-NC-SA','CC BY-NC-SA 4.0')
 if photo.get('category')=='needs':
  assert len(photo['levels'])==3
  assert len(set(photo['levels']))==3
  assert photo['levels'][0]==photo['objects'][0]['word']
  for word in photo['levels']: assert word in data['words']
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
subprocess.run(['node','--check',str(public/'practice-state.mjs')],check=True)
subprocess.run(['node','--check',str(public/'audio-levels.mjs')],check=True)
subprocess.run(['node','--test',str(ROOT/'scripts/practice-state.test.mjs')],check=True)
subprocess.run(['node','--test',str(ROOT/'scripts/audio-levels.test.mjs')],check=True)
subprocess.run([sys.executable,str(ROOT/'scripts/prepare_audio_levels.py'),'--check'],check=True)
print(f'PASS: {len(data["photos"])} photos, {sum(len(p["objects"]) for p in data["photos"])} annotations, {2*len(data["words"])} playable, non-silent audio files; HTML assets and JS syntax valid.')
