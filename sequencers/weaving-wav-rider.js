const seq = require(".."),
  path = require("path");

var videoFiles = seq.args["v"],
  wave = seq.wave(),
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

sequence = "";
sequenceLength = wave.length;
for (i = 1; i <= sequenceLength; i++) {
  for (v in videos) {
    if (v != 0 && parseFloat(wave[i]) < 0.01) continue;
    if (v != 0) i++;
    frame = Math.ceil(i * (videos[v].frames / sequenceLength));

    sequence +=
      "file 'frames_" +
      videos[v].name +
      "/" +
      frame +
      ".png'\n" +
      "duration " +
      duration +
      "\n";
  }
}

seq.export(sequence);
