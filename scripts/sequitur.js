const fs = require("mz/fs"),
      path = require('path'),
      { exec } = require("child_process"),
      compareImages = require('resemblejs/compareImages'),
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
    // require some args
    if ( !resolution || !framerate || !videoFile || !audioFile ) {
        console.log('missing/invalid args!');
        return;
    }

    // make or remove temp folder
    const dir = 'temp';
    if (initialize && fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    // load data
    const numOfFrames = await loadFrames(),
          waveform = await readWaveform(),
          diffs = await loadDiffs(numOfFrames);

    // sequence and encode
    const seq = sequence(numOfFrames, waveform, framerate, maxLevel, minOffset);
    const written = await write('temp/seq.txt', seq);
    await encode(written, resolution, framerate, audioFile, preview);
}


function write(file, data) {
    return new Promise(function(resolve, reject){
        fs.writeFile(file, data, function (err) {
            if (err) reject(error);
            console.log(file + ' written');
            resolve(true);
        });
    })
}
function read(file) {
    return new Promise(function(resolve, reject) {
        fs.readFile(file, function(err, data) {
            if (err) resolve(false);
            else {
                console.log(file + ' read');
                resolve(data);
            }
        });   
    });
}

async function loadFrames() {
    const dir = 'temp';
    let numOfFrames = await countFrames();

    

    if (!numOfFrames) {
        await extractFrames(videoFile, resolution);
        numOfFrames = await countFrames();
    }

    return numOfFrames;
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
    const dir = 'temp/frames/';
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

async function readWaveform() {
    const file = 'temp/wave.json',
          data = await read(file);

    if (data) waveform = JSON.parse(data);
    else {
        waveform = await sampleWaveform(audioFile, framerate);
        await write(file, JSON.stringify(waveform));
    }

    return waveform;
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
    return conformed;
}

async function loadDiffs(numOfFrames) {
    const file = 'temp/diffs.json';
    let data = await read(file),
    diffs = JSON.parse(data);

    if (!data || Object.keys(diffs).length != numOfFrames) {
        diffs = await compareFrames(numOfFrames);
        await write(file, JSON.stringify(diffs));
    }

    return diffs;
}

async function getDiff(a, b, t) {
    const options = {
        returnEarlyThreshold: t,
        ignore: "colors"
    };

    const data = await compareImages(
        await fs.readFile("temp/frames/" + a + ".jpg"),
        await fs.readFile("temp/frames/" + b + ".jpg"),
        options
    );

    return parseFloat(data.misMatchPercentage);
}

async function compareFrames(numOfFrames) {
    let diffs = {},
        timecode = [],
        threshold = 100;

    for (a = 1; a <= numOfFrames; a++) {
        timecode.push(Date.now());
        processingTime = timecode[timecode.length-1]-timecode[timecode.length-2];
        diffsPerSec = (numOfFrames / (processingTime / 1000));
        diffsLeft = (numOfFrames - a) * numOfFrames;
        secsLeft = Math.round(diffsLeft / diffsPerSec);
        timeLeft = secsLeft > 60 ? Math.round(secsLeft / 60) + 'm' : secsLeft + 's';
        progress = Math.round((a/numOfFrames)*100);

        message = (a < 2 || a > numOfFrames-1) ? 'comparing frames...' : 'comparing frames - ' + progress + '%, ' + timeLeft + ' left @ ' + Math.round(diffsPerSec) + '/s';
        console.clear();
        console.log(message);
        
        diffs[a] = {};
        max = 0;
        for (b = 1; b <= numOfFrames; b++) {
            if ( b == a ) diff = 0;
            else if ( b == a-1) diff = diffs[a-1][b];
            else diff = await getDiff(a, b, threshold);

            diffs[a][b] = parseFloat(diff);
            max = diff > max ? diff : max; 
        }

        threshold = Math.ceil(max)+5;
    }
    console.clear();
    return diffs;
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

init();