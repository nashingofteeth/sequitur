const fs = require("mz/fs"),
  path = require("path"),
  { execSync } = require("child_process");

exports.frames = function (file, resolution) {
  let frameCount = countFrames(file);

  if (!frameCount) {
    extractFrames(file, resolution);
    frameCount = countFrames(file);
  }

  return frameCount;
};

function countFrames(file) {
  const dir = "data/frames_" + path.basename(file) + "/";
  if (fs.existsSync(dir)) {
    files = fs.readdirSync(dir);
    if (files.length < 2) return false;
    else {
      const frames = files.filter((el) => path.extname(el) === ".bmp");
      return frames.length;
    }
  } else return false;
}

function extractFrames(file, res) {
  const dir = "data/frames_" + path.basename(file) + "/";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("extracting frames...");
  execSync(
    "ffmpeg -i " +
      file.replace(" ", "\\ ") +
      " -vf scale=-1:" +
      res +
      " data/frames_" +
      path.basename(file) +
      "/%d.bmp -y",
  );
}
