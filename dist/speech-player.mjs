// Media playback preserves pitch while Web Audio applies each clip's measured gain.
import {peakCeilingCurve} from './audio-levels.mjs';
export const normalizeRate = value => [0.5, 0.75, 1].includes(Number(value)) ? Number(value) : 0.75;

export class SpeechPlayer {
  constructor({createMedia = () => new Audio(), createContext = () => {
    const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Context) throw new Error('audio-unsupported');
    return new Context();
  }, onClip = () => {}, gapMs = 650, timeoutMs = 20000} = {}) {
    Object.assign(this, {createMedia, createContext, onClip, gapMs, timeoutMs});
    this.generation = 0;
    this.abort = null;
  }
  ensureAudio() {
    if (this.media) return;
    const context = this.createContext();
    const media = this.createMedia();
    media.preload = 'none';
    media.setAttribute('playsinline', '');
    const pitchProperty = ['preservesPitch','webkitPreservesPitch','mozPreservesPitch'].find(name => name in media);
    if (pitchProperty) media[pitchProperty] = true;
    media.setAttribute('data-pitch-preserved', pitchProperty ? String(media[pitchProperty]) : 'unsupported');
    try {
      const source = context.createMediaElementSource(media);
      const gain = context.createGain();
      const limiter = context.createWaveShaper();
      limiter.curve = peakCeilingCurve();
      source.connect(gain);
      gain.connect(limiter);
      limiter.connect(context.destination);
      Object.assign(this, {context, media, source, gain, limiter, pitchProperty});
    } catch (error) {
      context.close?.();
      throw error;
    }
  }
  stop() {
    this.generation++;
    this.abort?.();
    this.abort = null;
    if (this.media) {
      this.media.pause();
      this.media.removeAttribute('src');
      this.media.load();
    }
  }
  clip(clip, rate) {
    if (normalizeRate(rate) !== 1 && !this.pitchProperty) return Promise.reject(new Error('audio-slow-unsupported'));
    return new Promise((resolve, reject) => {
      const media = this.media;
      let timer;
      const cleanup = () => {
        clearTimeout(timer);
        media.removeEventListener('ended', ended);
        media.removeEventListener('error', failed);
        media.removeEventListener('playing', playing);
        media.removeEventListener('waiting', waiting);
        if (this.abort === abort) this.abort = null;
      };
      const finish = (error, completed = true) => {cleanup(); error ? reject(error) : resolve(completed);};
      const ended = () => finish(null);
      const failed = () => finish(new Error(media.error?.code === 4 ? 'audio-invalid' : 'audio-missing'));
      const playing = () => {clearTimeout(timer); this.onClip(clip);};
      const waiting = () => {clearTimeout(timer); timer = setTimeout(() => finish(new Error('audio-timeout')), this.timeoutMs);};
      const abort = () => finish(null, false);
      this.abort = abort;
      media.addEventListener('ended', ended);
      media.addEventListener('error', failed);
      media.addEventListener('playing', playing);
      media.addEventListener('waiting', waiting);
      const db = Number.isFinite(clip.gainDb) ? Math.max(-24, Math.min(18, clip.gainDb)) : 0;
      this.gain.gain.setValueAtTime(10 ** (db / 20), this.context.currentTime);
      media.src = clip.url;
      media.defaultPlaybackRate = normalizeRate(rate);
      media.playbackRate = normalizeRate(rate);
      if (this.pitchProperty) media[this.pitchProperty] = true;
      waiting();
      // Call play in the original tap, before any await, for mobile autoplay rules.
      try {Promise.resolve(media.play()).catch(error => finish(error));}
      catch (error) {finish(error);}
    });
  }
  gap() {
    return new Promise(resolve => {
      const abort = () => {clearTimeout(timer); if (this.abort === abort) this.abort = null; resolve(false);};
      const timer = setTimeout(() => {if (this.abort === abort) this.abort = null; resolve(true);}, this.gapMs);
      this.abort = abort;
    });
  }
  async play(plan, rate = 0.75) {
    this.stop();
    const run = this.generation;
    try {
      this.ensureAudio();
      // Resume the audio graph and start the media element within the same gesture.
      const resume = this.context.resume();
      for (let i = 0; i < plan.length; i++) {
        if (run !== this.generation) return false;
        const clip = this.clip(plan[i], rate);
        const [, completed] = await Promise.all([resume, clip]);
        if (!completed || run !== this.generation) return false;
        if (i < plan.length - 1 && !await this.gap()) return false;
      }
      return true;
    } catch (error) {
      if (run !== this.generation) return false;
      this.stop();
      throw error;
    }
  }
}
