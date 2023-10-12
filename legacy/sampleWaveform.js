const fs = require('fs'),
	  wav = require('node-wav'),
	  AudioContext = require('web-audio-api').AudioContext;

function write(waveform) {
	fs.writeFile('temp/waveform.txt', waveform, function (err) {
		if (err) reject(err);
		console.log('written');
	});
}

function readWav(file, fps) {
	let buffer = fs.readFileSync(file),
		result = wav.decode(buffer),
		data = result.channelData[0],
		step = result.sampleRate / fps,
		resampled = [],
		conformed = [],
		min = 0,
		max = 0;

	for (s in data) {
		min = data[s] > min ? data[s] : min;
		if (Number.isInteger(s / step)) {
			sample = min;
			resampled.push(sample);

			max = sample > max ? sample : max;
			min = 0;
		}
	}

	for (s in resampled) {
		conformed.push( (resampled[s] * (1 / max)).toFixed(4) );
	}

	return conformed.join('\n');
}

function decodeSoundFile(file, fps){
	var context = new AudioContext;

	fs.readFile(file, function(err, buf) {
		if (err) throw err
		context.decodeAudioData(buf, function(audioBuffer) {
			// console.log(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate, audioBuffer.duration);
			let data = (audioBuffer.getChannelData(0)),
				  step = audioBuffer.sampleRate / fps,
				  resampled = [],
				  max = 0,
				  min = 1;

			for (s in data) {
				if (Number.isInteger(s / step)) {
					sample = data[s];
					min = sample < min ? sample : min;
					max = sample > max ? sample : max;
					resampled.push(sample);
				}
			}
			console.log(min);
			console.log(max);
			write(resampled.join('\n'));
		}, function(err) { throw err })
	})
}

// decodeSoundFile('input/test.mp3', 15);
write(readWav('input/test.wav', 15));