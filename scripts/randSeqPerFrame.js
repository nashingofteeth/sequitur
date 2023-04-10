const fs = require("mz/fs");
const path = require('path');
const { exec } = require("child_process");

console.clear();

// global settings
const maxFrameRate = 60,
      targetDuration = 60, // seconds
      primaryFrameInterval = 3,
      inputResolution = 2160,
      outputResolution = 108;

// get divisors of frame rate
var frameRates = [];
for (let i=0; i<maxFrameRate; i++) {
    if ( (60 % i) == 0) frameRates.push(i);
}
frameRates.push(maxFrameRate);
frameRates.splice(0, 2); // remove longer durations


// count frames, initiate
fs.readdir('temp/frames/', (err, files) => {
    const frames = files.filter(el => path.extname(el) === '.jpg');

    if (!frames || frames.length < 2) {
        extractFrames();
    }
    else {
        generateVideos(frames.length);
    }
});

// separate video into individual frames
function extractFrames() {
    exec('mkdir temp temp/frames exports');

    const previewFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+outputResolution+" -qscale:v 2 temp/frames/%d.jpg -y",
          fullFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+inputResolution+" -qscale:v 2 temp/frames/%d.jpg -y";

    exec(fullFrames, (error, stdout, stderr) => {
        // console.log(error, stdout, stderr);
        console.log('frames extracted\nrun again');
    });
}

// generate video for each frame 
async function generateVideos(numOfFrames) {
    for (i = 0; i < numOfFrames; i++) {
        await sequence(i, numOfFrames);
    }
}

// create random sequence from frames
async function sequence(primaryFrame, numOfFrames) {
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
        
        // insert primary frame at set interval
        if ( Number.isInteger(i/primaryFrameInterval) ) selectedFrame = primaryFrame;

        frames.push([selectedFrame, frameDuration]);
    }

    seq = '';
    for (f in frames) {
        seq += "file 'frames/" + (frames[f][0]+1) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    console.log((primaryFrame+1) + ' sequenced');

    await write(seq, primaryFrame);
    await encode(primaryFrame);
}

// write sequence to file
function write(seq, primaryFrame) {
    return new Promise(function(resolve, reject){
        fs.writeFile('temp/seq.txt', seq, function (err) {
            if (err) reject(err);
            resolve();
            console.log((primaryFrame+1) + ' written');
        });
    })
}

// encode sequence
function encode(primaryFrame) {
    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+outputResolution+" -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r "+maxFrameRate+" exports/v_"+(primaryFrame+1)+".mp4 -y",
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+outputResolution+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r "+maxFrameRate+" exports/v_"+(primaryFrame+1)+".mov -y";

    return new Promise(function(resolve, reject){
        exec(preview, (err, stdout, stderr) => {
            // console.log(stdout, stderr);
            if (err) reject(err);
            resolve();
            console.log((primaryFrame+1) + " encoded");
        });
    })
}
