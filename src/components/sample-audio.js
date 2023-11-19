const fs = require("mz/fs"),
      path = require('path'),
      wav = require('node-wav');

exports.wave = function (file, framerate) {
    const outputFile = 'data/wave_' + path.basename(file) + '.json';

    if (fs.existsSync(outputFile)) 
        wave = JSON.parse(fs.readFileSync(outputFile));
    else {
        wave = resampleAudio(file, framerate);
        fs.writeFileSync(outputFile, JSON.stringify(wave));
    }

    return wave;
}

function sampleAudio(file) {
    console.log('sampling audio...');

    let buffer = fs.readFileSync(file),
        data = wav.decode(buffer);

    return data;
}

function resampleAudio(file, fps) {
    let sample = sampleAudio(file),
        data = sample.channelData[0],
        step = Math.round(sample.sampleRate / fps),
        count = 0,
        resampled = [],
        conformed = [],
        min = 0,
        max = 0;

    for (s in data) {
        min = data[s] > min ? data[s] : min;
        count++;
        if (count == step) {
            count = 0;
            sample = min;
            resampled.push(sample);

            max = sample > max ? sample : max;
            min = 0;
        }
    }

    for (s in resampled) {
        conformed.push( (resampled[s] * (1 / max)).toFixed(4) );
    }

    return conformed;
}