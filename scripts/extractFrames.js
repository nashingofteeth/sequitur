const fs = require("mz/fs"),
      path = require('path'),
      { execSync } = require("child_process");

exports.frames = async function(videoFile, resolution) {
    let numOfFrames = countFrames();

    if (!numOfFrames) {
        extractFrames(videoFile, resolution);
        numOfFrames = countFrames();
    }

    return numOfFrames;
}

function countFrames() {
    const dir = 'temp/frames/';
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir);
        if (files.length < 2) return false;
        else {
            const frames = files.filter(el => path.extname(el) === '.jpg');
            return frames.length;
        }
    }
    else return false;
}

function extractFrames(file, res) {
    const dir = 'temp/frames/';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir)

    console.clear();
    console.log('extracting frames...');
    execSync("ffmpeg -i " + file.replace(' ','\\ ') + " -vf scale=-1:" + res + " -qscale:v 2 temp/frames/%d.jpg -y");
}