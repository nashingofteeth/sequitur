const seq = require("../sequitur");
const frameCount = seq.frameCount();
const wave = seq.wave();
const frameDuration = 1 / seq.framerate;

const sequence = [];

for (let i = 0; i < wave.length - 1; i++) {
	const level = Number.parseFloat(wave[i]);
	const selectedFrame = Math.ceil((frameCount - 1) * level);

	sequence.push([selectedFrame + 1, frameDuration]);
}

seq.export(sequence);
