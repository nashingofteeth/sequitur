const fs = require("mz/fs");
const { exec } = require("child_process");

console.clear();

// global settings
var outputFrameRate = 60,
    frameRates = [], // divisors of 240
    targetDuration = 60, // seconds
    primaryFrameInterval = 3,
    previewResolution = 240,
    finalResolution = 2160;

// get divisors of frame rate
for (let i=0; i<outputFrameRate; i++) {
    if ( (60 % i) == 0) frameRates.push(i);
}
frameRates.push(outputFrameRate);
frameRates.splice(0, 2); // remove longer durations


// count frames, initiate
fs.readdir('temp/frames/', (err, files) => {
    if (!files || files.length < 2) {
        extractFrames();
    }
    else {
        generate(files.length);
    }
});

// separate video into individual frames
function extractFrames() {
    exec('mkdir temp temp/frames exports');

    const previewFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+previewResolution+" -qscale:v 2 temp/frames/%d.jpg -y",
          fullFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+finalResolution+" -qscale:v 2 temp/frames/%d.jpg -y";

    exec(previewFrames, (error, stdout, stderr) => {
        // console.log(error, stdout, stderr);
        console.log('frames extracted\nrun again');
    });
}

// generate video for each frame 
async function generate(numOfFrames) {
    for (i = 0; i < numOfFrames; i++) {
        await sequence(i, numOfFrames);
    }
}

// create random sequence from frames
async function sequence(primaryFrame, numOfFrames) {
    var frames = [],
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
    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+previewResolution+" -vcodec libx264 -pix_fmt yuv420p -fps_mode vfr -r "+outputFrameRate+" exports/v_"+(primaryFrame+1)+".mp4 -y",
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+finalResolution+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r "+outputFrameRate+" exports/v_"+(primaryFrame+1)+".mov -y";

    return new Promise(function(resolve, reject){
        exec(preview, (err, stdout, stderr) => {
            // console.log(stdout, stderr);
            if (err) reject(err);
            resolve();
            console.log((primaryFrame+1) + " encoded");
        });
    })
}
