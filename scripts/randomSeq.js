const fs = require("mz/fs");
const { exec } = require("child_process");

console.clear();

var outputFrameRate = 60,
    frameRates = [], // divisors of 240
    targetDuration = 60, // seconds
    primaryFrameInterval = 3,
    previewResolution = 240,
    finalResolution = 2160;

// encoding
const previewFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+previewResolution+" -qscale:v 2 temp/frames/%d.jpg -y",
      finalFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+finalResolution+" -qscale:v 2 temp/frames/%d.jpg -y";

// get divisors of frame rate
for (let i=0; i<outputFrameRate; i++) {
    if ( (60 % i) == 0) frameRates.push(i);
}
frameRates.push(outputFrameRate);
frameRates.splice(0, 2);

// exec('mkdir temp temp/frames exports');

// exec(previewFrames, (error, stdout, stderr) => {
//     console.log(error, stdout, stderr);
//     console.log('frames extracted');
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

    out = '';
    for (f in frames) {
        out += "file 'frames/" + (frames[f][0]+1) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    const previewRender = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+previewResolution+" -vcodec libx264 -pix_fmt yuv420p -fps_mode vfr -r "+outputFrameRate+" exports/v_"+primaryFrame+".mp4 -y",
    finalRender = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+finalResolution+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -vsync vfr -r "+outputFrameRate+" exports/v_"+primaryFrame+".mov -y";

    // write sequence and encode
    fs.writeFile('temp/seq.txt', out, function (err) {
        if (err) throw err;
        console.log('sequence written');

        exec(previewRender, (error, stdout, stderr) => {
            // console.log(error, stdout, stderr);
            console.log("encoded");
        });
    });

    // console.log(frames);
    console.log(totalDuration);
    // console.log(frames[0][0]);
    // console.log(frames[frames.length-1][1]);
}
