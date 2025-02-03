const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.frames = (file) => {
  let frameCount = countFrames(file);

  if (!frameCount) {
    extractFrames(file);
    frameCount = countFrames(file);
  }

  return frameCount;
};

function countFrames(file) {
  const dir = `cache/frames_${path.basename(file)}/`;
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    if (files.length < 2) return false;
    const frames = files.filter((el) => path.extname(el) === ".jpg");
    return frames.length;
  }
  return false;
}

function extractFrames(file) {
  const dir = `cache/frames_${path.basename(file)}/`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("extracting frames...");
  execSync(
    `ffmpeg -i ${file.replace(" ", "\\ ")} -qscale:v 2 cache/frames_${path.basename(file)}/%d.jpg -y`,
  );
}
