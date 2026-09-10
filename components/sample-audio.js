const fs = require("node:fs");
const path = require("node:path");
const wav = require("node-wav");

exports.wave = (file, framerate) => {
  const appRoot = path.join(__dirname, "..");
  const outputFile = `${appRoot}/cache/wave_${path.basename(file)}.json`;

  if (fs.existsSync(outputFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(outputFile, "utf8"));
      // Normalize legacy string values to numbers.
      if (Array.isArray(cached)) return cached.map(Number);
      return cached;
    } catch (error) {
      console.log(`Cached wave file is corrupt, regenerating: ${error.message}`);
    }
  }

  const wave = resampleAudio(file, framerate);
  fs.writeFileSync(outputFile, JSON.stringify(wave));
  return wave;
};

function sampleAudio(file) {
  console.log("sampling audio...");

  let buffer;
  try {
    buffer = fs.readFileSync(file);
  } catch (error) {
    throw new Error(`Audio file not found: ${file}`);
  }

  let data;
  try {
    // node-wav views buf.buffer without respecting byteOffset, so
    // file-read buffers from the pool can misalign Int16Array views.
    // Copy to a zero-offset buffer first.
    const aligned = Buffer.from(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.length),
    );
    data = wav.decode(aligned);
  } catch (error) {
    throw new Error(`Could not decode ${file} (16-bit PCM .wav required): ${error.message}`);
  }

  if (!data || !data.channelData || data.channelData.length === 0) {
    throw new Error(`No audio channels found in: ${file}`);
  }

  return data;
}

function resampleAudio(file, fps) {
  const sample = sampleAudio(file);
  const channels = sample.channelData;
  const numChannels = channels.length;
  const length = channels[0].length;
  const step = Math.max(1, Math.round(sample.sampleRate / fps));

  const resampled = [];
  let peak = 0;

  // Mono-mix all channels, then take RMS energy per frame window
  // (including the trailing partial window).
  for (let start = 0; start < length; start += step) {
    const end = Math.min(start + step, length);
    let sumSquares = 0;
    let count = 0;
    for (let c = 0; c < numChannels; c++) {
      const channel = channels[c];
      for (let i = start; i < end; i++) {
        const v = channel[i] || 0;
        sumSquares += v * v;
        count++;
      }
    }
    const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0;
    resampled.push(rms);
    if (rms > peak) peak = rms;
  }

  // Silent file: avoid divide-by-zero, return zeros as numbers.
  if (peak === 0) return resampled.map(() => 0);

  return resampled.map((v) => Number((v / peak).toFixed(4)));
}
