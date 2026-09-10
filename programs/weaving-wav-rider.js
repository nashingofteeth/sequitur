const seq = require("../sequitur");
const { loadVideos, weaveWave } = require("../components/weave");

const videoFiles = seq.args["v"];
const wave = seq.wave();
const duration = 1 / seq.framerate;
const videos = loadVideos(videoFiles, (f) => seq.frameCount(f));

if (videos.length === 0) {
  console.error("No video files provided (-v)");
  process.exit(1);
}

const sequence = weaveWave(videos, wave, duration);

seq.export(sequence);
