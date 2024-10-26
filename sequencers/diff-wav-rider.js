const seq = require("../src/sequitur");

(async () => {
  const wave = seq.wave();
  const diffs = await seq.diffs(undefined, undefined, true);

  sequence(wave, diffs);
})();

function sequence(wave, diffs) {
  const sequence = [];
  const frameCount = Object.keys(diffs).length;
  let currentFrame = "1";
  const occurrence = [];
  const diffLimit = seq.args.limit || 1; // set between 0 and 1
  const margin = seq.args.margin || 1; // set between 1 and frameCount

  for (const f in diffs) {
    occurrence[f] = {
      count: 0,
      position: 0,
    };
  }

  for (const a in wave) {
    const amplitude = Number.parseFloat(wave[a]);
    const currentDiffs = diffs[currentFrame];
    const playhead = Math.ceil(a * (frameCount / wave.length));
    const maxDistance = seq.args.stretch
      ? margin + frameCount * amplitude
      : frameCount;
    let nextFrameIndex = Math.floor((frameCount - 1) * (amplitude * diffLimit)); // use amplitude as diffs index
    let nextFrame = currentDiffs[String(nextFrameIndex)][0];

    let forward = true;
    let distanceForward = 0;
    let distanceBack = 0;
    const targetIndex = nextFrameIndex;

    while (
      (occurrence[nextFrame].count > 0 &&
        Math.abs(occurrence[nextFrame].position - Number(a)) < margin) ||
      Math.abs(nextFrame - playhead) > maxDistance
    ) {
      if (forward && targetIndex + distanceForward + 1 < frameCount - 1) {
        nextFrameIndex = targetIndex + ++distanceForward;
      } else if (targetIndex - distanceBack + 1 > 0) {
        nextFrameIndex = targetIndex - ++distanceBack;
      }

      forward = !forward;

      nextFrame = currentDiffs[String(nextFrameIndex)][0];
    }

    occurrence[nextFrame].count++;
    occurrence[nextFrame].position = Number(a);

    sequence.push([nextFrame, 1 / seq.framerate]);

    currentFrame = nextFrame;
  }

  seq.export(sequence);
}
