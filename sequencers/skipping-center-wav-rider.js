const seq = require("..");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;

const sequence = [];
let selectedFrame = Math.floor(frameCount * Math.random());
let reverse = false;

for (let i = 0; i < wave.length - 1; i++) {
  const level = wave[i];

  reverse = (selectedFrame > (frameCount - 1) - selectedFrame);

  if (reverse) selectedFrame = selectedFrame - Math.round(selectedFrame * level);
  else selectedFrame = selectedFrame + Math.round(((frameCount - 1) - selectedFrame) * level);

  sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
