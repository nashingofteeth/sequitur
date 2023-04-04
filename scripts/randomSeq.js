const fs = require("mz/fs");
const { exec } = require("child_process");

console.clear();

var outputFrameRate = 60,
    frameRates = [], // divisors of 240
    targetDuration = 60, // seconds
    primaryFrameInterval = 6;

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
    sequence(1, files.length);
});

function sequence(primaryFrame, numOfFrames) {
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
        
        if ( Number.isInteger(i/primaryFrameInterval) ) selectedFrame = primaryFrame;

        frames.push([selectedFrame, frameDuration]);
    }

    out = '';
    for (f in frames) {
        out += "file 'frames/" + (frames[f][0]) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    fs.writeFile('temp/seq.txt', out, function (err) {
      if (err) throw err;
      console.log('sequence written');
    });

    // console.log(out);
    // console.log(frames);
    // console.log(totalDuration);
    // console.log(frames[0][0]);
    // console.log(frames[frames.length-1][1]);
}
