const fs = require("mz/fs"),
      path = require('path'),
      { execSync } = require("child_process"),
      cf = require('./compareFrames'),
      sa = require('./sampleAudio');

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
          numOfFrames = await loadFrames(),
          diffs = await cf.diffs(numOfFrames);

    // sequence and encode
    const seq = sequence(numOfFrames, wave, framerate, maxLevel, minOffset);
    encode(seq, resolution, framerate, audioFile, preview);
})()


async function loadFrames() {
    let numOfFrames = countFrames();

    if (!numOfFrames) {
        extractFrames(videoFile, resolution);
        numOfFrames = countFrames();
    }

    return numOfFrames;
}

function countFrames() {
    const dir = 'temp/frames/';
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir);
        if (files.length < 2) return false;
        else {
            const frames = files.filter(el => path.extname(el) === '.jpg');
            return frames.length;
        }
    }
    else return false;
}

function extractFrames(file, res) {
    const dir = 'temp/frames/';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir)

    execSync("ffmpeg -i " + file.replace(' ','\\ ') + " -vf scale=-1:" + res + " -qscale:v 2 temp/frames/%d.jpg -y");
}

function sequence(numOfFrames, wave, fps, max, min) {
    let seq = [],
        selectedFrame = Math.floor(numOfFrames * Math.random()),
        frameDuration = 1/fps,
        reverse = false;

    for (let i = 0; i < (wave.length-1); i++) {
        let level = wave[i],
            maxLevel = max || 1,
            minOffset = min || 0,
            maxOffset = Math.round(numOfFrames * (level * maxLevel));
        offset = maxOffset < minOffset ? 1 : maxOffset;

        if ( selectedFrame + offset > numOfFrames-1 ) reverse = true;
        else if ( selectedFrame - offset < 0 ) reverse = false;

        if (reverse) selectedFrame = selectedFrame - offset;
        else selectedFrame = selectedFrame + offset;

        if ( selectedFrame > numOfFrames-1 || selectedFrame < 0 ) {
            console.log('off the rails!');
            process.exit();
        }
        
        seq.push([selectedFrame, frameDuration]);
    }

    return seq;
}

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