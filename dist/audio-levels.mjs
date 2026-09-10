// Apply each clip's measured gain once, immediately after decoding.
// MP3s remain unchanged; the ceiling also protects against decoder differences.
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
