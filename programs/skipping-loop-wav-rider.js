const seq = require("../sequitur");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;
// percentage (float) of current level to multiply frame count by
const maxLevel = seq.args.max ? Number.parseFloat(seq.args.max) : 1;
// number of frames that must be offset before level-based offset is effected
const minOffset = seq.args.min ? Number.parseInt(seq.args.min, 10) : 0;
// number of frames to advange when no level-based offset
const baseOffset = seq.args.base ? Number.parseInt(seq.args.base, 10) : 0;

const lastIndex = frameCount - 1;
const sequence = [];
let selectedFrame = Math.floor(frameCount * Math.random());
let reverse = false;

for (let i = 0; i < wave.length - 1; i++) {
  const level = Number(wave[i]);
  const maxOffset = Math.round(frameCount * (level * maxLevel));
  // if level-based offset is less than minOffset, do not advance
  const offset = maxOffset < minOffset ? baseOffset : maxOffset;

  if (selectedFrame + offset > lastIndex) reverse = true;
  else if (selectedFrame - offset < 0) reverse = false;

  if (reverse) selectedFrame = selectedFrame - offset;
  else selectedFrame = selectedFrame + offset;

  // Reflect off the ends instead of collapsing to the boundary.
  if (selectedFrame > lastIndex) {
    selectedFrame = 2 * lastIndex - selectedFrame;
  } else if (selectedFrame < 0) {
    selectedFrame = -selectedFrame;
  }
  selectedFrame = Math.min(Math.max(selectedFrame, 0), lastIndex);

  sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
