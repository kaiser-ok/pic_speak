"""Download unchanged dictionary MP3s; generate Mandarin with macOS Meijia.
Existing files are reused. Run from the project root after prepare_content.py.
"""
import json, subprocess, tempfile, urllib.request, concurrent.futures, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'dist/data.json').read_text())

def prepare(item):
 key,w=item
 zh=ROOT/'dist'/w['zhAudio'].lstrip('/')
 zh.parent.mkdir(parents=True,exist_ok=True)
 if not zh.exists() or zh.stat().st_size < 1000:
  with tempfile.TemporaryDirectory(prefix='speak-audio-') as tmp:
   aiff=Path(tmp)/'word.aiff'
   subprocess.run(['say','-v','Meijia','-r','135','-o',str(aiff),w['zh']],check=True)
   subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(aiff),str(zh)],check=True)
 if zh.stat().st_size < 1000:
  raise ValueError(f'Mandarin speech engine produced empty audio for {key}')
 subprocess.run(['ffprobe','-v','error',str(zh)],check=True,capture_output=True)
 if w['source']=='moe':
  tw=ROOT/'dist'/w['twAudio'].lstrip('/')
  tw.parent.mkdir(parents=True,exist_ok=True)
  if not tw.exists():
   audio=urllib.request.urlopen(w['recordingUrl'],timeout=40).read()
   if len(audio)<1000:raise ValueError(f'Invalid audio for {key}')
   tw.write_bytes(audio)
 return key

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 futures={pool.submit(prepare,item):item[0] for item in data['words'].items()}
 for future in concurrent.futures.as_completed(futures):
  try: print('OK',future.result(),flush=True)
  except Exception as error: print('FAILED',futures[future],str(error),flush=True)
