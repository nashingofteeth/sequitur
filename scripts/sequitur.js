const fs = require("mz/fs");

console.clear();

// get args
var args = require('minimist')(process.argv.slice(2)),
    video = ( args['v'] && fs.existsSync(args['v']) ) ? args['v'] : false,
    audio = ( args['a'] && fs.existsSync(args['a']) ) ? args['a'] : false,
    framerate = args['r'] ? parseInt(args['r']) : 24,
    size = args['s'] ? parseInt(args['s']) : 240,
    preview = args['p'],
    initialize = args['i'];

exports.framerate = framerate;
exports.args = args;

// require some args
if ( !video || !audio ) {
    console.log('missing/invalid args!');
    return;
}

// make or remove temp folder
const dir = 'temp';
if (initialize && fs.existsSync(dir))
    fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir))
    fs.mkdirSync(dir);

// load data
exports.frameCount = function () { return require("./extractFrames").frames(video, size); }
exports.diffs = function () { 
        const frameCount = require("./extractFrames").frames(video, size);
        return require('./compareFrames').diffs(frameCount);
}
exports.wave = function () { return require('./sampleAudio').wave(audio, framerate); }
exports.export = function (sequence) { require('./exportSequence').concat(sequence, size, framerate, audio, preview); }