const seq = require("../sequitur");
const { loadVideos, spaceByLength } = require("../components/weave");

const videoFiles = seq.args["v"];
const duration = 1 / seq.framerate;
const videos = loadVideos(videoFiles, (f) => seq.frameCount(f));

if (videos.length === 0) {
  console.error("No video files provided (-v)");
  process.exit(1);
}

const sequence = spaceByLength(videos, duration);

seq.export(sequence);
