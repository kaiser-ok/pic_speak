import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAudioLevel } from '../dist/audio-levels.mjs';

function bufferOf(...channels) {
  const samples = channels.map(channel => Float32Array.from(channel));
  return {numberOfChannels: samples.length, getChannelData: i => samples[i], samples};
}

test('quiet speech is amplified without changing sample count or channel balance', () => {
  const buffer = bufferOf([0, .01, -.02, .04], [0, .005, -.01, .02]);
  const result = applyAudioLevel(buffer, 12);
  assert.equal(result, buffer);
  assert.equal(result.samples[0].length, 4);
  assert.ok(Math.abs(result.samples[0][3] - .04 * 10 ** (12 / 20)) < 1e-7);
  assert.ok(Math.abs(result.samples[0][3] / result.samples[1][3] - 2) < 1e-6);
});

test('positive gain cannot push either channel above the playback ceiling', () => {
  const buffer = bufferOf([0, .1, -.1], [.2, .9, -.9]);
  applyAudioLevel(buffer, 18);
  const peak = Math.max(...buffer.samples.flatMap(samples => Array.from(samples, Math.abs)));
  assert.ok(Math.abs(peak - 10 ** (-1.5 / 20)) < 1e-7);
});

test('loud clips are attenuated and silence or missing metadata stays usable', () => {
  const loud = bufferOf([.5, -.5]);
  applyAudioLevel(loud, -6);
  assert.ok(Math.abs(loud.samples[0][0] - .5 * 10 ** (-6 / 20)) < 1e-7);
  for (const gain of [undefined, NaN, Infinity, '12']) {
    const ordinary = bufferOf([.1, -.1]);
    const original = Array.from(ordinary.samples[0]);
    applyAudioLevel(ordinary, gain);
    assert.deepEqual(Array.from(ordinary.samples[0]), original);
  }
  const silence = bufferOf([0, 0, 0]);
  applyAudioLevel(silence, 18);
  assert.deepEqual(Array.from(silence.samples[0]), [0, 0, 0]);
});
