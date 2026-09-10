const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

exports.frames = (file, preview = false) => {
  let frameCount = countFrames(file, preview);

  // Old preview caches were extracted full-res before downscaling was
  // (re)introduced; re-extract them so `-p` stays realtime-capable.
  if (preview && frameCount && previewCacheIsStale(file, preview)) {
    console.log("cached preview frames are full-resolution, re-extracting...");
    fs.rmSync(getFramesDir(file, preview), { recursive: true, force: true });
    frameCount = false;
  }

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

  // Downscale previews so the live `-p` pipe (PNG decode + MJPEG encode)
  // can sustain realtime; full-res frames are still used for exports.
  const args = ["-y", "-i", file];
  if (preview) args.push("-vf", "scale=-2:540");
  args.push(`${dir}%d.png`);

  try {
    execFileSync("ffmpeg", args, { stdio: "inherit" });
  } catch (error) {
    throw new Error(`ffmpeg frame extraction failed for ${file}: ${error.message}`);
  }
}

// Read PNG IHDR dimensions without extra dependencies to detect stale
// full-resolution preview caches.
function previewCacheIsStale(file, preview) {
  try {
    const dir = getFramesDir(file, preview);
    const first = fs.readdirSync(dir).filter((el) => path.extname(el) === ".png").sort()[0];
    if (!first) return false;
    const fd = fs.openSync(`${dir}${first}`, "r");
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.readUInt32BE(0) !== 0x89504e47) return false; // not a PNG
    const height = buf.readUInt32BE(20);
    return height > 600;
  } catch {
    return false;
  }
}
