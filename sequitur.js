const fs = require("node:fs");
const args = require("minimist")(process.argv.slice(2));

let framerate = args.r ? Number.parseFloat(args.r) : 24;
if (!Number.isFinite(framerate) || framerate <= 0) {
  console.error(`Error: invalid framerate: ${args.r}`);
  process.exit(1);
}
const initialize = args.i;

// make or remove data folder
const dir = `${__dirname}/cache`;
if (initialize && fs.existsSync(dir))
  fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// validate files (accepts a single path or an array of paths)
function requireFiles(files) {
  const list = Array.isArray(files) ? files : [files];

  let valid = true;
  for (const f of list) {
    if (Array.isArray(f)) {
      for (const sub of f) {
        if (!sub || !fs.existsSync(sub)) valid = false;
      }
    } else if (!f || !fs.existsSync(f)) {
      valid = false;
    }
  }

  if (!valid) {
    console.error("files not provided or do not exist!");
    process.exit(1);
  }
}

// property exports
exports.framerate = framerate;
exports.args = args;

// data function exports
exports.frameCount = (v = args.v) => {
  requireFiles([v]);
  return require("./components/extract-frames").frames(v);
};
exports.diffs = (v = args.v, sorted = true) => {
  requireFiles([v]);
  const frameCount = require("./components/extract-frames").frames(v);
  return require("./components/compare-frames").diffs(v, frameCount, sorted);
};
exports.wave = (a = args.a, r = framerate) => {
  requireFiles([a]);
  return require("./components/sample-audio").wave(a, r);
};

exports.export = (
  sequence,
  r = framerate,
  v = args.v,
  a = args.a,
  o = args.o,
  p = args.p,
  n = args.noaudio,
  pl = args.play,
) => {
  if (args['dry-run']) {
    const length = Array.isArray(sequence) ? sequence.length : sequence;
    console.log(`Dry run - sequence not exported (${length} entries)`);
    return;
  }

  requireFiles([v]);

  // Extract preview frames if preview option is enabled
  if (p) {
    require("./components/extract-frames").frames(v, true);
  }

  require("./components/export-sequence").concat(sequence, r, v, a, o, p, n, pl);
};
