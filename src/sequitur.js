const fs = require("mz/fs"),
      args = require('minimist')(process.argv.slice(2)),
      framerate = args['r'] ? parseInt(args['r']) : 24,
      size = args['s'] ? parseInt(args['s']) : 240,
      preview = args['p'],
      initialize = args['i'];

exports.framerate = framerate;
exports.args = args;

// make or remove data folder
const dir = 'data';
if (initialize && fs.existsSync(dir))
    fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir))
    fs.mkdirSync(dir);

function exists(f) {
    if ( !f || !fs.existsSync(f) ) {
        console.log('file not provided or does not exist!');
        process.exit();
    }
}

// data functions
exports.frameCount = function (v = args['v'], s = size) {
    exists(v);
    return require("./components/extract-frames").frames(v, s);
}
exports.diffs = function (v = args['v'], s = size) { 
    exists(v);
    const frameCount = require("./components/extract-frames").frames(v, s);
    return require('./components/compare-frames').diffs(frameCount);
}
exports.wave = function (a = args['a'], r = framerate) {
    exists(a);
    return require('./components/sample-audio').wave(a, r);
}

exports.export = function (sequence, s = size, r = framerate, a = audio, p = preview) {
    require('./components/export-sequence').concat(sequence, s, r, a, p);
}