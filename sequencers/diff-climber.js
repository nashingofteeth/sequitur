const seq = require("../src/sequitur");

(async () => {
  const diffs = await seq.diffs(undefined, undefined, true);

  sequence(diffs);
})();

function sequence(diffs) {
  var sequence = [],
    frameCount = Object.keys(diffs).length,
    previousFrame = "1",
    sequenceLength = seq.args["length"] || frameCount,
    distanceLimit = seq.args["limit"] || 1; // between 0 and 1

  for (i = 0; i < sequenceLength; i++) {
    let distance = Math.floor(
        frameCount * (i / sequenceLength) * distanceLimit,
      ),
      nextFrame = diffs[previousFrame][distance][0];
    sequence.push([nextFrame, 1 / seq.framerate]);
    previousFrame = nextFrame;
  }

  seq.export(sequence);
}
