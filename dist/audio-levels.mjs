// Analysis helper for decoded buffers; the media player uses the same sample ceiling.
export function applyAudioLevel(buffer, gainDb = 0) {
  const db = Number.isFinite(gainDb) ? Math.max(-24, Math.min(18, gainDb)) : 0;
  const channels = Array.from({length: buffer.numberOfChannels}, (_, i) => buffer.getChannelData(i));
  let peak = 0;
  for (const samples of channels) {
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  }
  if (!peak) return buffer;
  const ceiling = 10 ** (-1.5 / 20);
  const gain = Math.min(10 ** (db / 20), ceiling / peak);
  for (const samples of channels) {
    for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  }
  return buffer;
}

// Protect sample peaks after the browser's pitch-preserving speed adjustment.
// Signals below the ceiling pass through unchanged; MP3 files remain original.
export function peakCeilingCurve() {
  const curve = new Float32Array(65537), ceiling = 10 ** (-1.5 / 20);
  for (let i = 0; i < curve.length; i++) {
    const sample = 2 * i / (curve.length - 1) - 1;
    curve[i] = Math.max(-ceiling, Math.min(ceiling, sample));
  }
  return curve;
}
