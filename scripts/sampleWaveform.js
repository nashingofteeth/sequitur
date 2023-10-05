const fs = require('fs'),
	  wav = require('node-wav');

function readWav(file, fps) {
	let buffer = fs.readFileSync(file),
		result = wav.decode(buffer),
		data = result.channelData[0],
		step = result.sampleRate / fps,
		resampled = [],
		minPush = [],
		maxPush = [],
		max = 0,
		min = 1;

	for (s in result.channelData[1]) {
		if (Number.isInteger(s / step)) {
			min = data[s] < min ? data[s] : min;
			resampled.push(data[s]);
		}
	}
	for (s in resampled) {
		minPushValue = resampled[s] + Math.abs(min);
		minPush.push(minPushValue);
		max = minPushValue > max ? minPushValue : max;
	}
	for (s in minPush) {
		maxPush.push( minPush[s] * (1 / max) );
	}

	dataStr = maxPush.join('\n')
	return dataStr;
}

let waveform = readWav('input/test.wav', 60);

fs.writeFile('temp/waveform.txt', waveform, function (err) {
	if (err) reject(err);
	console.log('written');
});