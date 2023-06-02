const fs = require("mz/fs");
const path = require('path');
const { exec } = require("child_process");

// global settings
const maxFrameRate = 60,
      targetDuration = 60, // seconds
      inputResolution = 3840,
      outputResolution = 480;

// get divisors of frame rate
var frameRates = [];
for (let i=0; i<maxFrameRate; i++) {
    if ( (60 % i) == 0) frameRates.push(i);
}
frameRates.push(maxFrameRate);
frameRates.splice(0, 1); // remove longer durations

console.clear();

// count frames, initiate or create frames
fs.readdir('temp/frames/', (err, files) => {
    if (!files || files.length < 2) {
        extractFrames();
    }
    
    else {
        const frames = files.filter(el => path.extname(el) === '.jpg');
        sequence(frames.length)
    }
});

// separate video into individual frames
function extractFrames() {
    exec('mkdir temp temp/frames');

    const previewFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+outputResolution+" -qscale:v 2 temp/frames/%d.jpg -y",
          fullFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+inputResolution+" -qscale:v 2 temp/frames/%d.jpg -y";

    console.log('extracting frames...');
    exec(fullFrames, (error, stdout, stderr) => {
        console.clear();
        // console.log(error, stdout, stderr);
        console.log('frames extracted\nrun again');
    });
}

// create random sequence from frames
async function sequence(numOfFrames) {
    let frames = [],
        selectedFrame = 0,
        frameDuration = 0,
        totalDuration = 0,
        loops = targetDuration * frameRates[frameRates.length-1];

    for (let i = 0; i < loops; i++) {
        frameDuration = 1/frameRates[Math.floor(Math.random()*frameRates.length)];
        selectedFrame = Math.floor(Math.random()*numOfFrames);

        // end sequencing if target duration is reached
        if (totalDuration + frameDuration > targetDuration) {
            i = loops-1;
            frameDuration = targetDuration - totalDuration;
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

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+outputResolution+" -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r "+maxFrameRate+" exports/sequitur_" + Date.now() + ".mp4 -y",
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+outputResolution+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r "+maxFrameRate+" exports/sequitur_" + Date.now() + ".mov -y";

    console.log('encoding...');
    return new Promise(function(resolve, reject){
        exec(preview, (err, stdout, stderr) => {
            console.clear();
            // console.log(stdout, stderr);
            if (err) reject(err);
            resolve();
            console.log("encoded");
        });
    })
}
