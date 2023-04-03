const fs = require("mz/fs");
const { exec } = require("child_process");

console.clear();

// exec('mkdir temp temp/frames exports');
// exec('ffmpeg -i input/video.mov -vf scale=-1:240 -qscale:v 2 temp/frames/%d.jpg', (error, stdout, stderr) => {
//     console.log(error, stdout, stderr);
//     console.log('DONE\n');
// }); 

const dir = 'temp/frames/';
fs.readdir(dir, (err, files) => {
    console.log(files.length);
});