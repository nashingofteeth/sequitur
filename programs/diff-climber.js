const seq = require("../sequitur");

(async () => {
  const { composite: diffs } = await seq.diffs();

  sequence(diffs);
})();

function sequence(diffs) {
  var sequence = [],
    frameCount = Object.keys(diffs).length,
    previousFrame = "1",
    sequenceLength = seq.args["length"] || frameCount,
    distanceLimit = seq.args["limit"] || 1; // between 0 and 1

  for (let i = 0; i < sequenceLength; i++) {
    let distance = Math.floor(
        frameCount * (i / sequenceLength) * distanceLimit,
      ),
      // Clamp to the valid ranking range instead of reading OOB.
      clamped = Math.min(Math.max(distance, 0), frameCount - 1),
      nextFrame = diffs[previousFrame][clamped][0];
    sequence.push([nextFrame, 1 / seq.framerate]);
    previousFrame = nextFrame;
  }

  seq.export(sequence);
}
