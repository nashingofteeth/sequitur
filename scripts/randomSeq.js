const fs = require("mz/fs");
const { exec } = require("child_process");

console.clear();

var outputFrameRate = 60,
    frameRates = [], // divisors of 240
    targetDuration = 60; // seconds

// get divisors of frameRate
for (let i=0; i<outputFrameRate; i++) {
    if ( (60 % i) == 0) frameRates.push(i);
}
frameRates.push(outputFrameRate);

// exec('mkdir temp temp/frames exports');
// exec('ffmpeg -i input/video.mov -vf scale=-1:240 -qscale:v 2 temp/frames/%d.jpg', (error, stdout, stderr) => {
//     console.log(error, stdout, stderr);
//     console.log('DONE\n');
// }); 

const dir = 'temp/frames/';
fs.readdir(dir, (err, files) => {
    sequence(files.length);
});

function sequence(numOfFrames) {
    var frames = [],
        selectedFrame = 0,
        frameDuration = 0,
        totalDuration = 0,
        loops = targetDuration * frameRates[frameRates.length-1];

    for (let i = 0; i < loops; i++) {
        frameDuration = 1/frameRates[Math.floor(Math.random()*frameRates.length)];
        selectedFrame = Math.floor(Math.random()*numOfFrames);

        if (totalDuration + frameDuration > targetDuration) {
            i = loops-1;
            frameDuration = targetDuration - totalDuration;
        }
        totalDuration += frameDuration;
        
        frames.push([selectedFrame, frameDuration]);
    }

    console.log(frames);
}
