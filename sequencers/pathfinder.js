const seq = require("..");

(async () => {
  const diffs = await seq.diffs();

  sequence(diffs);
})();

function sequence(diffs) {
  const used = [];
  const frameCount = Object.keys(diffs).length;
  const firstFrame = Math.floor(Math.random() * frameCount) + 1;
  const sequence = [[firstFrame, 1 / seq.framerate]];

  for (f in diffs) used[f] = false;
  used[firstFrame] = true;

  for (i = 1; i < frameCount; i++) {
    let key = 1;
    let frame = diffs[sequence[i - 1][0]][key][0];

    while (used[frame]) {
      frame = diffs[sequence[i - 1][0]][key][0];
      key++;
    }

    sequence.push([frame, 1 / seq.framerate]);
    used[frame] = true;
    console.log("frame:", frame);
    console.log("diff:", diffs[sequence[i - 1][0]][key][1])
  }

  seq.export(sequence);
}
