const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.frames = (file, preview = false) => {
  let frameCount = countFrames(file, preview);

  if (!frameCount) {
    extractFrames(file, preview);
    frameCount = countFrames(file, preview);
  }

  return frameCount;
};

function getFramesDir(file, preview = false) {
  const appRoot = path.join(__dirname, '..');
  const suffix = preview ? '_preview' : '';
  return `${appRoot}/cache/frames_${path.basename(file)}${suffix}/`;
}

function countFrames(file, preview = false) {
  const dir = getFramesDir(file, preview);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length < 2) return false;
    const frames = files.filter((el) => path.extname(el) === ".png");
    return frames.length;
  }
  return false;
}

function extractFrames(file, preview = false) {
  const dir = getFramesDir(file, preview);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const logMsg = preview ? "extracting preview frames..." : "extracting frames...";
  console.log(logMsg);
  
  let ffmpegCmd = `ffmpeg -i ${file.replace(" ", "\\ ")}`;
  if (preview) {
    ffmpegCmd += ` -vf scale=-1:240`;
  }
  ffmpegCmd += ` ${dir}%d.png -y`;
  
  execSync(ffmpegCmd);
}
