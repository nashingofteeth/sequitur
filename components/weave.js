const path = require("node:path");

// Normalize -v input (single path string or array of paths) to an array.
function normalizeVideoFiles(videoFiles) {
  if (!videoFiles) return [];
  return Array.isArray(videoFiles) ? videoFiles : [videoFiles];
}

// Resolve [{ file, name, frames }] using the caller's frame counter.
function loadVideos(videoFiles, frameCounter) {
  return normalizeVideoFiles(videoFiles).map((file) => ({
    file,
    name: path.basename(file),
    frames: frameCounter(file),
  }));
}

function clampFrame(frame, frameCount) {
  if (!Number.isFinite(frame)) return 1;
  return Math.min(Math.max(Math.round(frame), 1), Math.max(frameCount, 1));
}

function longestVideo(videos) {
  let longest = videos[0];
  for (const v of videos) {
    if (v.frames > longest.frames) longest = v;
  }
  return longest;
}

// Interleave frames up to the longest video.
// stretch: scale each video's position to its own length.
// stride: outer-loop step (replaces the old `overwrite` i++ hack:
//   overwrite advanced the outer index once per non-longest video,
//   i.e. a step of videos.length).
function interleave(videos, frameDuration, { stretch = false, stride = 1 } = {}) {
  const sequence = [];
  if (videos.length === 0) return sequence;
  const longest = longestVideo(videos);
  const step = Math.max(1, stride);

  for (let i = 1; i <= longest.frames; i += step) {
    for (const video of videos) {
      if (i > video.frames && !stretch) continue;
      const frame = stretch && video !== longest
        ? clampFrame((i / longest.frames) * video.frames, video.frames)
        : i;
      sequence.push([frame, frameDuration, video.file]);
    }
  }
  return sequence;
}

// Map each wave sample to a frame of each video (0-indexed wave,
// 1-indexed frames, no index mutation).
function weaveWave(videos, wave, frameDuration, { quietThreshold = 0.01 } = {}) {
  const sequence = [];
  for (let idx = 0; idx < wave.length; idx++) {
    const level = Number(wave[idx]);
    for (let vi = 0; vi < videos.length; vi++) {
      if (vi !== 0 && level < quietThreshold) continue;
      const frame = clampFrame(
        Math.ceil(((idx + 1) / wave.length) * videos[vi].frames),
        videos[vi].frames,
      );
      sequence.push([frame, frameDuration, videos[vi].file]);
    }
  }
  return sequence;
}

// Spread every frame of every video across a shared timeline and sort.
function spaceByLength(videos, frameDuration) {
  const total = videos.reduce((sum, v) => sum + v.frames, 0);
  const items = [];
  for (const video of videos) {
    for (let i = 0; i < video.frames; i++) {
      items.push({ position: total * (i / video.frames), video, frame: i + 1 });
    }
  }
  items.sort((a, b) => a.position - b.position);
  return items.map((item) => [item.frame, frameDuration, item.video.file]);
}

exports.normalizeVideoFiles = normalizeVideoFiles;
exports.loadVideos = loadVideos;
exports.clampFrame = clampFrame;
exports.longestVideo = longestVideo;
exports.interleave = interleave;
exports.weaveWave = weaveWave;
exports.spaceByLength = spaceByLength;
