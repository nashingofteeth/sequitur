const fs = require("mz/fs"),
      { execSync } = require("child_process"),
      ef = require("./extractFrames"),
      cf = require('./compareFrames'),
      sa = require('./sampleAudio'),
      skip = require('./skipSequencer');

console.clear();

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

const videoFile = ( args['vid'] && fs.existsSync(args['vid']) ) ? args['vid'] : false,
      audioFile = ( args['aud'] && fs.existsSync(args['aud']) ) ? args['aud'] : false,
      resolution = parseInt(args['res']),
      framerate = args['fps'] ? parseInt(args['fps']) : 24,
      preview = args['pre'],
      maxLevel = parseFloat(args['max']),
      minOffset = parseFloat(args['min']),
      initialize = args['init'];

// require some args
if ( !resolution || !videoFile || !audioFile ) {
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
    const wave = await sa.wave(audioFile, framerate),
          frames = await ef.frames(videoFile, resolution),
          diffs = await cf.diffs(frames);

    // sequence and encode
    const seq = skip.sequence(frames, wave, framerate, maxLevel, minOffset);
    encode(seq, resolution, framerate, audioFile, preview);
})()

function encode(seq, res, fps, aud, pre) {
    let seqStr = '';
    for (f in seq) {
        seqStr += "file 'frames/" + (seq[f][0]+1) + ".jpg'\n" +
                  "duration " + seq[f][1] + "\n";
    }
    fs.writeFileSync('temp/seq.txt', seqStr);

    let dir = 'exports';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mp4 -i " + aud.replace(' ','\\ '),
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mov -i " + aud.replace(' ','\\ ');

    const encodeCmd = pre ? preview : full;

    console.log('encoding...');
    execSync(encodeCmd);
    console.log('encoded');
}