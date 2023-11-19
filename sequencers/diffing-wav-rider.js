const seq = require('../src/sequitur');

(async() => {
	const wave = seq.wave(),
		  diffs = await seq.diffs();
	
	sequence(wave, diffs);
})()

function sequence(wave, diffs) {
	var sequence = [],
		frameCount = Object.keys(diffs).length,
		frame = String(1),
		nextFrame = frame,
		occurances = [],
		maxOccurances = 20;

	for (a in wave) {
		let amplitude = parseFloat(wave[a]),
			sorted = [],
			closest, furthest;

		for (d in diffs[frame])
	    	sorted.push([d, diffs[frame][d]]);
		
		sorted.sort(function(a, b) {
	    	return a[1] - b[1];
		});

		closest = sorted[1][0];
		furthest = sorted[sorted.length-1][0];

		targetDiff = diffs[frame][furthest] * amplitude;
		
		for (d in diffs[frame]) {
			if ( 
				Math.abs(diffs[frame][d] - targetDiff) < Math.abs(diffs[frame][nextFrame] - targetDiff) &&
				(occurances[d] < maxOccurances || !occurances[d])
			) {
				nextFrame = d;
			}
		}

		occurances[nextFrame] = occurances[nextFrame] ? occurances[nextFrame] + 1 : 1;
		sequence.push([nextFrame, 1/seq.framerate]);

		frame = nextFrame;
	}

	seq.export(sequence);
}