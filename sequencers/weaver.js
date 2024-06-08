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

var longest = "0";
for (v in videos) if (videos[v].frames > videos[longest].frames) longest = v;

sequence = "";
for (i = 1; i <= videos[longest].frames; i++) {
  for (v in videos) {
    if (i > videos[v].frames && !seq.args["stretch"]) continue;

    if (seq.args["stretch"] && videos[v] != videos[longest])
      frame = Math.ceil((i / videos[longest].frames) * videos[v].frames);
    else frame = i;

    sequence +=
      "file 'frames_" +
      videos[v].name +
      "/" +
      frame +
      ".bmp'\n" +
      "duration " +
      duration +
      "\n";

    if (
      seq.args["overwrite"] &&
      videos[v] != videos[longest] &&
      i < videos[v].frames
    )
      i++;
  }
}

seq.export(sequence);
