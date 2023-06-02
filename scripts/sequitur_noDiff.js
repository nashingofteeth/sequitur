const fs = require("mz/fs");
const path = require('path');
const { exec } = require("child_process");

console.clear();

const validArgs = ['res', 'dur', 'fps', 'pre'];
var args = {}
for ( a in validArgs) {
    const index = process.argv.indexOf('--' + validArgs[a]);
    let value;
    if (index > -1) {
        value = parseInt(process.argv[index + 1]);
        args[validArgs[a]] = (value || true);
    }
    else args[validArgs[a]] = false;
}

// count frames
fs.readdir('temp/frames/', (err, files) => {
    // extract frames if none
    if ((!files || files.length < 2) && args['res']) {
        extractFrames();
    }
    // require some args
    else if ( !args['res'] || !args['dur'] || !args['fps'] ) {
        console.log('missing args!');
    }
    // initialize
    else {
        const frames = files.filter(el => path.extname(el) === '.jpg');
        sequence(frames.length)
    }
});

// separate video into individual frames
function extractFrames() {
    exec('mkdir temp temp/frames');

    const extractCmd = "ffmpeg -i input/video.mov -vf scale=-1:"+args['res']+" -qscale:v 2 temp/frames/%d.jpg -y";

    console.log('extracting frames...');
    exec(extractCmd, (error, stdout, stderr) => {
        console.clear();
        // console.log(error, stdout, stderr);
        console.log('frames extracted\nrun again');
    });
}

// create random sequence from frames
async function sequence(numOfFrames) {
    let frames = [],
        selectedFrame = 0,
        frameDuration = 1/args['fps'],
        totalDuration = 0,
        loops = args['dur'] * args['fps'];

    for (let i = 0; i < loops; i++) {
        selectedFrame = Math.floor(Math.random()*numOfFrames);

        // end sequencing if target duration is reached
        if (totalDuration + frameDuration > args['dur']) {
            i = loops-1;
            frameDuration = args['dur'] - totalDuration;
        }

        totalDuration += frameDuration;
        
        frames.push([selectedFrame, frameDuration]);
    }

    seq = '';
    for (f in frames) {
        seq += "file 'frames/" + (frames[f][0]+1) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    console.log('sequenced');

    await write(seq);
    await encode();
}

// write sequence to file
function write(seq) {
    return new Promise(function(resolve, reject){
        fs.writeFile('temp/seq.txt', seq, function (err) {
            if (err) reject(err);
            resolve();
            console.log('written');
        });
    })
}

// encode sequence
function encode() {
    exec('mkdir exports');

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+args['res']+" -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r "+args['fps']+" exports/sequitur_" + Date.now() + ".mp4 -y",
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+args['res']+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r "+args['fps']+" exports/sequitur_" + Date.now() + ".mov -y";

    const encodeCmd = args['pre'] ? preview : full;

    console.log('encoding...');
    return new Promise(function(resolve, reject){
        exec(encodeCmd, (err, stdout, stderr) => {
            console.clear();
            // console.log(stdout, stderr);
            if (err) reject(err);
            resolve();
            console.log("encoded");
        });
    })
}
