const seq = require("../src/sequitur"),
  path = require("path");

var videoFiles = seq.args["v"],
  duration = 1 / seq.framerate,
  videos = {},
  videoName = "",
  frameCount = 0;

for (v in videoFiles) {
  videoName = path.basename(videoFiles[v]);
  frameCount = seq.frameCount(videoFiles[v]);
  videos[v] = {};
  videos[v].name = videoName;
  videos[v].frames = frameCount;
}

var sequenceLength = 0;
for (v in videos) sequenceLength += videos[v].frames;

var sequence = "",
  sequenceArr = [];

for (v in videos) {
  for (i = 0; i < videos[v].frames; i++) {
    let position = sequenceLength * (i / videos[v].frames);
    sequenceArr.push([position, videos[v].name, i + 1]);
  }
}

sequenceArr.sort(function (a, b) {
  return a[0] - b[0];
});

for (f in sequenceArr)
  sequence +=
    "file 'frames_" +
    sequenceArr[f][1] +
    "/" +
    sequenceArr[f][2] +
    ".bmp'\n" +
    "duration " +
    duration +
    "\n";

seq.export(sequence);
