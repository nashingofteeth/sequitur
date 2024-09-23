const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.frames = (file, resolution) => {
  let frameCount = countFrames(file);

  if (!frameCount) {
    extractFrames(file, resolution);
    frameCount = countFrames(file);
  }

  return frameCount;
};

function countFrames(file) {
  const dir = `data/frames_${path.basename(file)}/`;
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length < 2) return false;
    const frames = files.filter((el) => path.extname(el) === ".bmp");
    return frames.length;
  }
  return false;
}

function extractFrames(file, res) {
  const dir = `data/frames_${path.basename(file)}/`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("extracting frames...");
  execSync(
    `ffmpeg -i ${file.replace(" ", "\\ ")} -vf scale=-1:${res} data/frames_${path.basename(file)}/%d.bmp -y`,
  );
}
