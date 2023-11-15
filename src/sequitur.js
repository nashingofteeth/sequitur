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

function exists(files) {
    for ( f in files ) {
        if ( !files[f] || !fs.existsSync(files[f]) ) {
            console.log('files not provided or do not exist!');
            process.exit();
        }
    }
}

// data functions
exports.frameCount = function (v = args['v'], s = size) {
    exists([v]);
    return require("./components/extract-frames").frames(v, s);
}
exports.diffs = function (v = args['v'], s = size) { 
    exists([v]);
    const frameCount = require("./components/extract-frames").frames(v, s);
    return require('./components/compare-frames').diffs(v, frameCount);
}
exports.wave = function (a = args['a'], r = framerate) {
    exists([a]);
    return require('./components/sample-audio').wave(a, r);
}

exports.export = function (sequence, s = size, r = framerate, v = args['v'], a = args['a'], p = preview) {
    exists([v, a])
    require('./components/export-sequence').concat(sequence, s, r, v, a, p);
}