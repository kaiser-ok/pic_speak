import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SpeechPlayer, normalizeRate} from '../dist/speech-player.mjs';

class Media extends EventTarget {
  src = '';
  plays = [];
  paused = true;
  preservesPitch = true;
  playError = null;
  setAttribute() {}
  removeAttribute(name) { if (name === 'src') this.src = ''; }
  load() {}
  pause() { this.paused = true; }
  play() {
    this.plays.push({src:this.src, rate:this.playbackRate, pitch:this.preservesPitch});
    if (this.playError) return Promise.reject(this.playError);
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
  end() { this.paused = true; this.dispatchEvent(new Event('ended')); }
}
function setup(options = {}) {
  const media = new Media(), gains = [], heard = [];
  const context = {currentTime:0, destination:{}, resume:() => Promise.resolve(),
    createMediaElementSource:() => ({connect(){}}),
    createWaveShaper:() => ({connect(){}}),
    createGain:() => ({connect(){},gain:{setValueAtTime(value){gains.push(value);}}})};
  const player = new SpeechPlayer({createMedia:() => media, createContext:() => context,
    onClip:clip => heard.push(clip.url), gapMs:0, timeoutMs:1000, ...options});
  return {player,media,gains,heard};
}
const zh = {url:'/zh.mp3',gainDb:-3}, tw = {url:'/tw.mp3',gainDb:9};
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

test('starts on the tap, keeps pitch, applies per-language gain and sequences at ended', async () => {
  const {player,media,gains,heard} = setup();
  const done = player.play([zh,tw], .75);
  assert.deepEqual(media.plays,[{src:'/zh.mp3',rate:.75,pitch:true}]);
  assert.equal(gains[0],10 ** (-3 / 20));
  media.end(); await tick();
  assert.equal(media.plays.length,2);
  assert.equal(media.plays[1].rate,.75);
  assert.equal(gains[1],10 ** (9 / 20));
  media.end(); assert.equal(await done,true);
  assert.deepEqual(heard,['/zh.mp3','/tw.mp3']);
});
test('stopping during a clip never starts the queued second language', async () => {
  const {player,media} = setup();
  const done = player.play([zh,tw]);
  player.stop(); media.end(); await tick();
  assert.equal(await done,false);
  assert.equal(media.plays.length,1);
  assert.equal(media.paused,true);
});
test('a new tap replaces the current utterance and stopping also cancels the gap', async () => {
  const {player,media} = setup({gapMs:25});
  const old = player.play([zh,tw]);
  media.end(); await tick();
  const next = player.play([{url:'/other.mp3'}],1);
  assert.equal(await old,false);
  assert.equal(media.plays.at(-1).src,'/other.mp3');
  assert.equal(media.plays.at(-1).rate,1);
  media.end(); assert.equal(await next,true);
  await new Promise(resolve => setTimeout(resolve,30));
  assert.equal(media.plays.length,2);
});
test('a rejected play can be retried and does not leave the next utterance queued', async () => {
  const {player,media} = setup();
  media.playError = new DOMException('gesture required','NotAllowedError');
  await assert.rejects(player.play([zh,tw]),{name:'NotAllowedError'});
  assert.equal(media.paused,true);
  media.playError = null;
  const done = player.play([tw]); media.end();
  assert.equal(await done,true);
});
test('stalled media times out, and invalid speed settings use the 25% slower default', async () => {
  const {player,media} = setup({timeoutMs:10});
  const done = player.play([zh,tw]);
  media.dispatchEvent(new Event('waiting'));
  await assert.rejects(done,{message:'audio-timeout'});
  assert.equal(media.plays.length,1);
  for (const value of [null,undefined,'bad',.5,.75]) assert.equal(normalizeRate(value),.75);
  assert.equal(normalizeRate('1'),1);
});

test('unsupported pitch correction rejects slow mode but normal speed still works', async () => {
  const {player,media} = setup(); delete media.preservesPitch;
  await assert.rejects(player.play([zh],.75),{message:'audio-slow-unsupported'});
  assert.equal(media.plays.length,0);
  const done=player.play([zh],1);media.end();assert.equal(await done,true);
});
