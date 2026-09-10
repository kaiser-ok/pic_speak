"""Measure speech loudness and store playback gains without re-encoding MP3s.

Run after generating audio; --check verifies that the stored measurements still
match every audio file. FFmpeg loudnorm documentation:
https://ffmpeg.org/ffmpeg-filters.html#loudnorm
"""
import argparse
import concurrent.futures
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'dist'
SETTINGS = {'targetLufs': -16.0, 'maxTruePeakDb': -1.5, 'maxGainDb': 18.0,
            'measurement': 'loudnorm-dual-mono-pad-0.5s-v1'}


def gain_for(loudness, peak):
    return round(min(SETTINGS['targetLufs'] - loudness,
                     SETTINGS['maxTruePeakDb'] - peak, SETTINGS['maxGainDb']), 2)


def fingerprint(url):
    return hashlib.sha256((PUBLIC / url.lstrip('/')).read_bytes()).hexdigest()


def measure(url):
    path = PUBLIC / url.lstrip('/')
    # Only the analysis signal is padded. Playback keeps the original duration.
    # dual_mono matches Web Audio's mono playback through both speaker channels.
    analysis = subprocess.run([
        'ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-af',
        'apad=whole_dur=0.5,loudnorm=I=-16:TP=-1.5:LRA=7:dual_mono=true:print_format=json',
        '-f', 'null', '-'], check=True, capture_output=True, text=True)
    match = re.search(r'\{\s*"input_i".*?\}', analysis.stderr, re.S)
    if not match:
        raise ValueError(f'No loudness measurement for {url}')
    stats = json.loads(match[0])
    loudness, peak = float(stats['input_i']), float(stats['input_tp'])
    if not all(math.isfinite(v) for v in (loudness, peak)):
        raise ValueError(f'Cannot measure {url}: {stats}')
    return url, {'gainDb': gain_for(loudness, peak), 'loudnessLufs': loudness,
                 'truePeakDb': peak, 'sha256': fingerprint(url)}


def check(levels, urls):
    assert all(levels.get(key) == value for key, value in SETTINGS.items()), 'Rebuild audio levels'
    assert set(levels['clips']) == set(urls), 'Audio level entries must match all audio files'
    for url in urls:
        clip = levels['clips'][url]
        assert clip['sha256'] == fingerprint(url), f'Audio changed; rebuild levels: {url}'
        gain, loudness, peak = (clip[k] for k in ('gainDb', 'loudnessLufs', 'truePeakDb'))
        assert all(math.isfinite(v) for v in (gain, loudness, peak)), url
        assert -24 <= gain <= SETTINGS['maxGainDb'], (url, gain)
        assert gain == gain_for(loudness, peak), (url, gain)
        assert peak + gain <= SETTINGS['maxTruePeakDb'] + .01, (url, peak + gain)
        assert SETTINGS['targetLufs'] - 3 <= loudness + gain <= SETTINGS['targetLufs'] + .01, (url, loudness + gain)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    path = PUBLIC / 'data.json'
    data = json.loads(path.read_text())
    urls = sorted({word[field] for word in data['words'].values() for field in ('zhAudio', 'twAudio')})
    if args.check:
        levels = data.get('audioLevels', {})
    else:
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            clips = dict(pool.map(measure, urls))
        levels = {**SETTINGS, 'clips': clips}
    check(levels, urls)
    if not args.check:
        data['audioLevels'] = levels
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    for language in ('zh', 'tw'):
        clips = [clip for url, clip in levels['clips'].items() if f'/{language}/' in url]
        before = [clip['loudnessLufs'] for clip in clips]
        after = [clip['loudnessLufs'] + clip['gainDb'] for clip in clips]
        print(f'{language}: {len(clips)} clips, {min(before):.2f}..{max(before):.2f} '
              f'→ {min(after):.2f}..{max(after):.2f} LUFS')
    print(f'PASS: {len(urls)} current audio levels, peak ceiling {SETTINGS["maxTruePeakDb"]} dBTP')


if __name__ == '__main__':
    main()
