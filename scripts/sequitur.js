const fs = require("mz/fs"),
      extractFrames = require("./extractFrames"),
      compareFrames = require('./compareFrames'),
      sampleAudio = require('./sampleAudio'),
      exportSequence = require('./exportSequence'),
      skipSequencer = require('./skipSequencer');

console.clear();

// get args
const validArgs = ['vid', 'aud', 'res', 'fps', 'pre', 'max', 'min', 'init'];
let args = {}
for ( a in validArgs) {
    const index = process.argv.indexOf('--' + validArgs[a]);
    let value;
    if (index > -1) {
        value = process.argv[index + 1];
        args[validArgs[a]] = (value || true);
    }
    else args[validArgs[a]] = false;
}

const video = ( args['vid'] && fs.existsSync(args['vid']) ) ? args['vid'] : false,
      audio = ( args['aud'] && fs.existsSync(args['aud']) ) ? args['aud'] : false,
      resolution = parseInt(args['res']),
      framerate = args['fps'] ? parseInt(args['fps']) : 24,
      preview = args['pre'],
      maxLevel = parseFloat(args['max']),
      minOffset = parseFloat(args['min']),
      initialize = args['init'];

// require some args
if ( !resolution || !video || !audio ) {
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
    const wave = await sampleAudio.wave(audio, framerate),
          frames = await extractFrames.frames(video, resolution),
          diffs = await compareFrames.diffs(frames);

    // sequence and encode
    const sequence = skipSequencer.sequence(frames, wave, framerate, maxLevel, minOffset);
    exportSequence.concat(sequence, resolution, framerate, audio, preview);
})()