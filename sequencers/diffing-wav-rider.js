const seq = require('../src/sequitur');

(async() => {
	const wave = seq.wave(),
		  diffs = await seq.diffs();
	
	sequence(wave, diffs);
})()

function sequence(wave, diffs) {
	var sequence = [],
		frameCount = Object.keys(diffs).length,
		frame = '1',
		nextFrame = frame,
		occurance = [],
		diffLimit = seq.args['dl'] || 1, // set between 0 and 1
		marginThreshold = seq.args['mt'] || 0; // set between 0 and 1

	for (f in diffs) {
		occurance[f] = {
			count: 0,
			position: 0
		}
	}

	// to do: add playhead option for sequencial frames below threshold
	for (a in wave) {
		let amplitude = parseFloat(wave[a]),
			currentDiffsSorted = sortDiffs(diffs[frame]),
			nextFrameIndex = Math.floor( (frameCount - 1) * (amplitude * diffLimit) ), // use amplitude as diffs index
			nextFrame = currentDiffsSorted.array[String(nextFrameIndex)][0]
			margin = 0;
			
		// amplitude threshold for frame reuse margin
		if ( amplitude < marginThreshold )
			margin = frameCount - 1;

		// restrict frame reuse
		let forward = true,
			distanceFoward = 0,
			distanceBack = 0,
			targetIndex = nextFrameIndex;
		while (
			occurance[nextFrame].count > 0 &&
			Math.abs( occurance[nextFrame].position - Number(a) ) < margin
	  	) {
			if (
				forward &&
				targetIndex + distanceFoward + 1 < frameCount - 1
			) {
				nextFrameIndex = targetIndex + ++distanceFoward;
			}
			else if ( targetIndex - distanceBack + 1 > 0 ) {
				nextFrameIndex = targetIndex - ++distanceBack;
			}

			foward = forward ? false : true;

			nextFrame = currentDiffsSorted.array[String(nextFrameIndex)][0];
		}

		// record occurence
		occurance[nextFrame].count++;
		occurance[nextFrame].position = Number(a);

		sequence.push([nextFrame, 1/seq.framerate]);

		frame = nextFrame;
	}

	seq.export(sequence);
}

// to do: place inside compare-frames module
function sortDiffs(o) {
	var sorted = [];

	for (d in o)
		sorted.push([d, o[d]]);

	sorted.sort(function(a, b) {
		return a[1] - b[1];
	});

	return {
		array: sorted,
		closest: sorted[1][0],
		furthest: sorted[sorted.length-1][0]
	}
}