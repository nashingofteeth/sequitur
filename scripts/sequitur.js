const fs = require("mz/fs"),
      path = require('path'),
      { exec } = require("child_process"),
      wav = require('node-wav');

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

async function init() {
    const numOfFrames = await countFrames();
    const waveform = await readWaveform();

    // require some args
    if ( !resolution || !framerate || !videoFile || !audioFile ) console.log('missing/invalid args!');
    // extract frames and record waveform if none
    else if ( !waveform || !numOfFrames || initialize ) {
        let dir = 'temp';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        await extractFrames(videoFile, resolution);
        written = await writeWaveform(sampleWaveform(audioFile, framerate));

        if (written) console.log('run again');
    }
    // sequence and encode
    else {
        const seq = sequence(numOfFrames, waveform, framerate, maxLevel, minOffset);
        const written = await write(seq);
        await encode(written, resolution, framerate, audioFile, preview);
    }
}

function countFrames() {
    return new Promise(function(resolve, reject) {
        fs.readdir('temp/frames/', (err, files) => {
            if (!files || files.length < 2 || err) resolve(false);
            else {
                const frames = files.filter(el => path.extname(el) === '.jpg');
                resolve(frames.length);
            }
        });
    });
}

function extractFrames(file, res) {
    let dir = 'temp/frames/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const extractCmd = "ffmpeg -i " + file.replace(' ','\\ ') + " -vf scale=-1:" + res + " -qscale:v 2 temp/frames/%d.jpg -y";

    console.log('extracting frames...');
    return new Promise(function(resolve, reject) {
        exec(extractCmd, (err, stdout, stderr) => {
            if (err) reject(err);
            // console.log(error, stdout, stderr);
            console.log('frames extracted');
            resolve(true);
        });
    });
}

function sequence(numOfFrames, waveform, fps, max, min) {
    let frames = [],
        selectedFrame = Math.floor(numOfFrames * Math.random()),
        frameDuration = 1/fps,
        reverse = false;

    for (let i = 0; i < (waveform.length-1); i++) {
        let level = waveform[i],
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
        
        frames.push([selectedFrame, frameDuration]);
    }

    let seq = '';
    for (f in frames) {
        seq += "file 'frames/" + (frames[f][0]+1) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    console.log('sequenced');
    return seq;
}

function write(seq) {
    return new Promise(function(resolve, reject){
        fs.writeFile('temp/seq.txt', seq, function (err) {
            if (err) reject(err);
            console.log('written');
            resolve(true);
        });
    })
}

function encode(written, res, fps, aud, pre) {
    if (!written) process.exit();

    let dir = 'exports';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mp4 -i " + aud.replace(' ','\\ '),
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mov -i " + aud.replace(' ','\\ ');

    const encodeCmd = pre ? preview : full;

    console.log('encoding...');
    return new Promise(function(resolve, reject){
        exec(encodeCmd, (err, stdout, stderr) => {
            // console.log(stdout, stderr);
            if (err) reject(err);
            console.log('encoded');
            resolve(true);
        });
    })
}


function readWaveform() {
    return new Promise(function(resolve, reject) {
        fs.readFile('temp/wave.txt', function(err, data) {
            if (err) resolve(false);
            else {
                let text = data.toString('utf8');
                const levels = text.split('\n');
                resolve(levels);
            }
        });   
    });
}

function writeWaveform(waveform) {
    return new Promise(function(resolve, reject) {
        fs.writeFile('temp/wave.txt', waveform, function (err) {
            if (err) resolve(err);
            else {
                console.log('waveform written');
                resolve(true);
            }
        });   
    });
}

function sampleWaveform(file, fps) {
    let buffer = fs.readFileSync(file),
        result = wav.decode(buffer),
        data = result.channelData[0],
        step = result.sampleRate / fps,
        resampled = [],
        conformed = [],
        min = 0,
        max = 0;

    for (s in data) {
        min = data[s] > min ? data[s] : min;
        if (Number.isInteger(s / step)) {
            sample = min;
            resampled.push(sample);

            max = sample > max ? sample : max;
            min = 0;
        }
    }

    for (s in resampled) {
        conformed.push( (resampled[s] * (1 / max)).toFixed(4) );
    }

    console.log('waveform sampled');
    return conformed.join('\n');
}

init();