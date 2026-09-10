const seq = require("../sequitur");
const { loadVideos, interleave, normalizeVideoFiles } = require("../components/weave");

const videoFiles = seq.args["v"];
const duration = 1 / seq.framerate;
const videos = loadVideos(videoFiles, (f) => seq.frameCount(f));

if (videos.length === 0) {
  console.error("No video files provided (-v)");
  process.exit(1);
}

// Preserve the legacy `overwrite` flag: it advanced the outer index once
// per non-longest video, i.e. a stride of videos.length. `--stride N`
// sets the step explicitly.
const stride = seq.args["stride"]
  ? Number.parseInt(seq.args["stride"], 10)
  : seq.args["overwrite"] ? normalizeVideoFiles(videoFiles).length : 1;

const sequence = interleave(videos, duration, {
  stretch: Boolean(seq.args["stretch"]),
  stride,
});

seq.export(sequence);
