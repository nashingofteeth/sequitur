const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

exports.frames = (file, preview = false) => {
  let frameCount = countFrames(file, preview);

  if (!frameCount) {
    extractFrames(file, preview);
    frameCount = countFrames(file, preview);
  }

  if (!frameCount) {
    throw new Error(`Frame extraction produced no frames for: ${file}`);
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
  if (!file || !fs.existsSync(file)) {
    throw new Error(`Video file not found: ${file}`);
  }
  const dir = getFramesDir(file, preview);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const logMsg = preview ? "extracting preview frames..." : "extracting frames...";
  console.log(logMsg);

  try {
    execFileSync("ffmpeg", ["-y", "-i", file, `${dir}%d.png`], { stdio: "inherit" });
  } catch (error) {
    throw new Error(`ffmpeg frame extraction failed for ${file}: ${error.message}`);
  }
}
