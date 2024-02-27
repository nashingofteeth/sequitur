const seq = require('../src/sequitur');

(async() => {
	const diffs = await seq.diffs(undefined, undefined, true);

	sequence(diffs);
})()

function sequence(diffs) {
	var sequence = [],
		used = [],
		frameCount = Object.keys(diffs).length,
		firstFrame = '6';
		sequence = [[firstFrame, 1/seq.framerate]];

	for (f in diffs)
		used[f] = false;
	used[firstFrame] = true;

	for (i = 1; i < frameCount; i++) {

		let key = 1,
			frame = diffs[sequence[i-1][0]][key][0];

		while (used[frame]) {
			frame = diffs[sequence[i-1][0]][key][0];
			key++;
		}

		sequence.push([frame, 1/seq.framerate]);
		used[frame] = true;
		console.log(frame);
	}

	seq.export(sequence);
}