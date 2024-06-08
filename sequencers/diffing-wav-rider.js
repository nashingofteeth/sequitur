const seq = require("../src/sequitur");

(async () => {
  const wave = seq.wave(),
    diffs = await seq.diffs(undefined, undefined, true);

  sequence(wave, diffs);
})();

function sequence(wave, diffs) {
  var sequence = [],
    frameCount = Object.keys(diffs).length,
    currentFrame = "1",
    nextFrame = currentFrame,
    occurance = [],
    diffLimit = seq.args["limit"] || 1, // set between 0 and 1
    margin = seq.args["margin"] || 1; // set between 1 and frameCount

  for (f in diffs) {
    occurance[f] = {
      count: 0,
      position: 0,
    };
  }

  for (a in wave) {
    let amplitude = parseFloat(wave[a]),
      currentDiffs = diffs[currentFrame],
      playhead = Math.ceil(a * (frameCount / wave.length)),
      maxDistance = seq.args["stretch"]
        ? margin + frameCount * amplitude
        : frameCount,
      nextFrameIndex = Math.floor((frameCount - 1) * (amplitude * diffLimit)), // use amplitude as diffs index
      nextFrame = currentDiffs[String(nextFrameIndex)][0];

    // restrict frame reuse
    var forward = true,
      distanceFoward = 0,
      distanceBack = 0,
      targetIndex = nextFrameIndex;
    while (
      (occurance[nextFrame].count > 0 &&
        Math.abs(occurance[nextFrame].position - Number(a)) < margin) ||
      Math.abs(nextFrame - playhead) > maxDistance
    ) {
      if (forward && targetIndex + distanceFoward + 1 < frameCount - 1) {
        nextFrameIndex = targetIndex + ++distanceFoward;
      } else if (targetIndex - distanceBack + 1 > 0) {
        nextFrameIndex = targetIndex - ++distanceBack;
      }

      foward = forward ? false : true;

      nextFrame = currentDiffs[String(nextFrameIndex)][0];
    }

    // record occurence
    occurance[nextFrame].count++;
    occurance[nextFrame].position = Number(a);

    sequence.push([nextFrame, 1 / seq.framerate]);

    currentFrame = nextFrame;
  }

  seq.export(sequence);
}
