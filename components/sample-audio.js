const fs = require("mz/fs");
const path = require("node:path");
const wav = require("node-wav");

exports.wave = (file, framerate) => {
  const appRoot = path.join(__dirname, "..");
  const outputFile = `${appRoot}/cache/wave_${path.basename(file)}.json`;

  let wave;
  if (fs.existsSync(outputFile)) {
    wave = JSON.parse(fs.readFileSync(outputFile));
  } else {
    wave = resampleAudio(file, framerate);
    fs.writeFileSync(outputFile, JSON.stringify(wave));
  }

  return wave;
};

function sampleAudio(file) {
  console.log("sampling audio...");

  const buffer = fs.readFileSync(file);
  const data = wav.decode(buffer);

  return data;
}

function resampleAudio(file, fps) {
  let sample = sampleAudio(file);
  const data = sample.channelData[0];
  const step = Math.round(sample.sampleRate / fps);
  let count = 0;
  const resampled = [];
  const conformed = [];
  let min = 0;
  let max = 0;

  for (s in data) {
    min = data[s] > min ? data[s] : min;
    count++;
    if (count === step) {
      count = 0;
      sample = min;
      resampled.push(sample);

      max = sample > max ? sample : max;
      min = 0;
    }
  }

  for (s in resampled) {
    conformed.push((resampled[s] * (1 / max)).toFixed(4));
  }

  return conformed;
}
