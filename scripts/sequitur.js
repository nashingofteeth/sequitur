const fs = require("mz/fs"),
      extractFrames = require("./extractFrames"),
      compareFrames = require('./compareFrames'),
      sampleAudio = require('./sampleAudio'),
      exportSequence = require('./exportSequence'),
      skipSequencer = require('./skipSequencer');

console.clear();

// get args
var args = require('minimist')(process.argv.slice(2));

const video = ( args['v'] && fs.existsSync(args['v']) ) ? args['v'] : false,
      audio = ( args['a'] && fs.existsSync(args['a']) ) ? args['a'] : false,
      framerate = args['fps'] ? parseInt(args['r']) : 24,
      size = args['s'] ? parseInt(args['s']) : 240,
      preview = args['p'],
      initialize = args['i'];

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

(async() => {
    // load data
    const frames = await extractFrames.frames(video, size),
          diffs = await compareFrames.diffs(frames),
          wave = await sampleAudio.wave(audio, framerate);

    // sequence and encode
    const sequence = skipSequencer.sequence(frames, wave, framerate, args);
    exportSequence.concat(sequence, size, framerate, audio, preview);
})()