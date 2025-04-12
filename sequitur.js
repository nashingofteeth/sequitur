const fs = require("mz/fs");
const args = require("minimist")(process.argv.slice(2));
const framerate = args.r ? Number.parseFloat(args.r) : 24;
const initialize = args.i;

exports.framerate = framerate;
exports.args = args;

// make or remove data folder
const dir = `${__dirname}/cache`;
if (initialize && fs.existsSync(dir))
  fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

function requireFiles(args) {
  let valid = true;

  for (a in args) {
    if (Array.isArray(args[a])) {
      for (f in args[a]) if (!fs.existsSync(args[a][f])) valid = false;
    } else if (!args[a] || !fs.existsSync(args[a])) valid = false;
  }

  if (!valid) {
    console.log("files not provided or do not exist!");
    process.exit();
  }
}

// data functions
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
) => {
  requireFiles([v]);
  require("./components/export-sequence").concat(sequence, r, v, a, o, p, n);
};
