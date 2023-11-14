const fs = require("mz/fs"),
      args = require('minimist')(process.argv.slice(2)),
      video = ( args['v'] && fs.existsSync(args['v']) ) ? args['v'] : false,
      audio = ( args['a'] && fs.existsSync(args['a']) ) ? args['a'] : false,
      framerate = args['r'] ? parseInt(args['r']) : 24,
      size = args['s'] ? parseInt(args['s']) : 240,
      preview = args['p'],
      initialize = args['i'];

// require some args
if ( !video || !audio ) {
    console.log('missing/invalid args!');
    return;
}

// make or remove data folder
const dir = 'data';
if (initialize && fs.existsSync(dir))
    fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir))
    fs.mkdirSync(dir);

exports.framerate = framerate;
exports.args = args;

// data functions
exports.frameCount = function (v = video, s = size) {
    return require("./components/extract-frames").frames(v, s);
}
exports.diffs = function (v = video, s = size) { 
        const frameCount = require("./components/extract-frames").frames(v, s);
        return require('./components/compare-frames').diffs(frameCount);
}
exports.wave = function (a = audio, r = framerate) {
    return require('./components/sample-audio').wave(a, r);
}

exports.export = function (sequence, s = size, r = framerate, a = audio, p = preview) {
    require('./components/export-sequence').concat(sequence, s, r, a, p);
}