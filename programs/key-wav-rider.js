const seq = require("../sequitur");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;

const threshold = seq.args.threshold;

// Define the range to map values to (after thresholding)
const minOutput = threshold ?? 0.0;
const maxOutput = 1.0;

const sequence = [];

for (let i = 0; i < wave.length - 1; i++) {
  let level = Number.parseFloat(wave[i]);

  if (level < threshold) {
    level = 0;
  }

  const normalizedLevel = (level - threshold) / (1 - threshold) * (maxOutput - minOutput) + minOutput;

  const selectedFrame = Math.ceil((frameCount - 1) * normalizedLevel);

  sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
