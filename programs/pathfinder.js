const seq = require("../sequitur");

(async () => {
  const { composite: diffs } = await seq.diffs();

  sequence(diffs);
})();

function sequence(diffs) {
  const used = {};
  const frameCount = Object.keys(diffs).length;
  const firstFrame = seq.args.start ?? Math.floor(Math.random() * frameCount) + 1;
  const sequence = [[firstFrame, 1 / seq.framerate]];

  for (const f in diffs) used[f] = false;
  used[firstFrame] = true;

  const requestedKey = seq.args.key ?? 1;
  if (!Number.isInteger(requestedKey) || requestedKey < 0 || requestedKey >= frameCount) {
    console.error(`Error: invalid key ${seq.args.key} (must be an integer 0..${frameCount - 1})`);
    process.exit(1);
  }

  for (let i = 1; i < frameCount; i++) {
    let key = requestedKey;
    const rankings = diffs[sequence[i - 1][0]];
    let frame = rankings[key][0];

    while (used[frame] && key + 1 < rankings.length) {
      key++;
      frame = rankings[key][0];
    }

    if (used[frame]) {
      // All remaining frames used (should not happen before i == frameCount),
      // fall back to the first unused frame.
      frame = Object.keys(used).find((f) => !used[f]);
      if (frame === undefined) break;
    }

    sequence.push([frame, 1 / seq.framerate]);
    used[frame] = true;
    console.log("frame:", frame);
    console.log("diff:", diffs[sequence[i - 1][0]][key][1]);
  }

  seq.export(sequence);
}
