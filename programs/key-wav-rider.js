const seq = require("../sequitur");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;

const threshold = seq.args.threshold ? Number(seq.args.threshold) : 0.0;

if (!Number.isFinite(threshold) || threshold < 0 || threshold >= 1) {
  console.error(`Error: invalid threshold ${seq.args.threshold} (must be 0..<1)`);
  process.exit(1);
}

const sequence = [];

for (let i = 0; i < wave.length - 1; i++) {
  const level = Number.parseFloat(wave[i]);

  // Silence below the threshold; rescale the rest evenly onto 0..1.
  const normalizedLevel = level < threshold ? 0 : (level - threshold) / (1 - threshold);

  const selectedFrame = Math.min(Math.floor(normalizedLevel * frameCount), frameCount - 1);

  sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
