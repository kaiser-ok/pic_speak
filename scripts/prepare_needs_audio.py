"""Prepare complete utterances without concatenating dictionary clips."""
import json, subprocess, tempfile, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
data = json.loads(Path('/tmp/speak-needs-audio.json').read_text())
for key, word in data['words'].items():
    if not key.startswith('need_'):
        continue
    for language in ['zh', 'tw']:
        output = ROOT / 'dist' / word[language + 'Audio'].lstrip('/')
        if output.exists() and output.stat().st_size > 1000:
            continue
        with tempfile.TemporaryDirectory(prefix='speak-needs-audio-') as tmp:
            target = Path(tmp) / 'complete.mp3'
            if language == 'zh':
                aiff = Path(tmp) / 'speech.aiff'
                subprocess.run(['say', '-v', 'Meijia', '-r', '135', '-o', str(aiff), word['zh']], check=True)
                subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-i', str(aiff), str(target)], check=True)
            else:
                with urllib.request.urlopen(word['recordingUrl'], timeout=50) as response:
                    target.write_bytes(response.read())
            assert target.stat().st_size > 1000, (key, language, 'Empty audio')
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(target), '-f', 'null', '-'], check=True)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(target.read_bytes())
        print('OK', key, language, flush=True)
