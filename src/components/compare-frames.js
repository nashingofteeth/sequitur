const fs = require("mz/fs"),
  path = require("path"),
  compareImages = require("resemblejs/compareImages");

async function diffs(file, frameCount, sort = false) {
  const outputFile = "data/diffs_" + path.basename(file) + ".json";
  let diffs = null;

  if (fs.existsSync(outputFile))
    diffs = JSON.parse(fs.readFileSync(outputFile));
  else {
    diffs = await compareFrames(file, frameCount);
    fs.writeFileSync(outputFile, JSON.stringify(diffs));
  }

  if (sort) diffs = sortedDiffs(diffs);

  return diffs;
}

async function compareFrames(file, frameCount) {
  let diffs = {},
    timecode = [],
    threshold = 100;

  for (a = 1; a <= frameCount; a++) {
    timecode.push(Date.now());
    processingTime =
      timecode[timecode.length - 1] - timecode[timecode.length - 2];
    diffsPerSec = frameCount / (processingTime / 1000);
    diffsLeft = (frameCount - a) * frameCount;
    secsLeft = Math.round(diffsLeft / diffsPerSec);
    timeLeft = secsLeft > 60 ? Math.round(secsLeft / 60) + "m" : secsLeft + "s";
    progress = Math.round((a / frameCount) * 100);

    message =
      a < 2 || a > frameCount - 1
        ? "comparing frames..."
        : "comparing frames - " +
          progress +
          "%, " +
          timeLeft +
          " left @ " +
          Math.round(diffsPerSec) +
          "/s";
    console.log(message);

    diffs[a] = {};
    max = 0;
    for (b = 1; b <= frameCount; b++) {
      if (b == a) diff = 0;
      else if (b == a - 1) diff = diffs[a - 1][b + 1];
      else diff = await getDiff(file, a, b, threshold);

      diffs[a][b] = parseFloat(diff);
      max = diff > max ? diff : max;
    }

    threshold = Math.ceil(max) + 5;
  }

  return diffs;
}

async function getDiff(f, a, b, t) {
  const options = {
    returnEarlyThreshold: t,
    ignore: "colors",
  };

  const data = await compareImages(
    await fs.readFile("data/frames_" + path.basename(f) + "/" + a + ".bmp"),
    await fs.readFile("data/frames_" + path.basename(f) + "/" + b + ".bmp"),
    options,
  );

  return parseFloat(data.misMatchPercentage);
}

function sortedDiffs(o) {
  var sortedDiffs = {};
  for (f in o) {
    var sorted = [];

    for (d in o[f]) sorted.push([d, o[f][d]]);

    sorted.sort(function (a, b) {
      return a[1] - b[1];
    });

    sortedDiffs[f] = sorted;
  }

  return sortedDiffs;
}

exports.diffs = diffs;
