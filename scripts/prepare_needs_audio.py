"""Prepare complete utterances without concatenating dictionary clips."""
import argparse, json, subprocess, tempfile, urllib.request, time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('data', nargs='?', default='/tmp/speak-needs-audio.json')
parser.add_argument('--prefix', default='need_')
args = parser.parse_args()
data = json.loads(Path(args.data).read_text())
for key, word in data['words'].items():
    if not key.startswith(args.prefix):
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
                time.sleep(1)
            assert target.stat().st_size > 1000, (key, language, 'Empty audio')
            probe = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                    '-of', 'json', str(target)], check=True, capture_output=True, text=True)
            duration = float(json.loads(probe.stdout)['format']['duration'])
            assert .2 < duration < 15, (key, language, 'Unexpected audio duration', duration)
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(target), '-f', 'null', '-'], check=True)
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(target.read_bytes())
        print('OK', key, language, flush=True)
