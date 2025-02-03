const seq = require("..");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;
// percentage (float) of current level to multiply frame count by
const maxLevel = seq.args.max ? Number.parseFloat(seq.args.max) : 1;
// number of frames that must be offset before level-based offset is effected
const minOffset = seq.args.min ? Number.parseInt(seq.args.min) : 0;
// number of frames to advange when no level-based offset
const baseOffset = seq.args.base ? Number.parseInt(seq.args.base) : 0;

const sequence = [];
let selectedFrame = Math.floor(frameCount * Math.random());
let reverse = false;

for (let i = 0; i < wave.length - 1; i++) {
  const level = wave[i];
  const maxOffset = Math.round(frameCount * (level * maxLevel));
  // if level-based offset is less than minOffset, do not advance
  const offset = maxOffset < minOffset ? baseOffset : maxOffset;

  if (selectedFrame + offset > frameCount - 1) reverse = true;
  else if (selectedFrame - offset < 0) reverse = false;

  if (reverse) selectedFrame = selectedFrame - offset;
  else selectedFrame = selectedFrame + offset;

  if (selectedFrame > frameCount - 1) {
    selectedFrame = selectedFrame - (selectedFrame - (frameCount - 1));
  } else if (selectedFrame < 0) {
    selectedFrame = selectedFrame + Math.abs(selectedFrame);
  }
  // if (selectedFrame > frameCount - 1 || selectedFrame < 0) {
  //   console.log("off the rails!");
  //   process.exit();
  // }

  sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
