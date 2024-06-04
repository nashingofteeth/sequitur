const seq = require('../src/sequitur'),
	  frameCount = seq.frameCount(),
	  frameDuration = 1/seq.framerate;

var sequence = [],
	sections = {},
	divisor = seq.args['divisor'],
	sectionLength = Math.floor(frameCount / divisor);

var s = 0;
while (s<frameCount) {
	let index = Math.floor(s / sectionLength)
	sections[index] = [];
	s += sectionLength;
}

for (f=0;f<frameCount;f++) {
	let placement = Math.floor(f / sectionLength);
	sections[placement].push(f);
}
if (!frameCount / divisor % 1 === 0) {
	delete sections[Object.keys(sections)[Object.keys(sections).length - 1]];
}

Object.keys(sections).forEach( (key) => {
for (i=0;i<sectionLength;i++) {
	sequence.push([sections[key][getRandomInt(0, sectionLength)]+1, frameDuration]);
}
})
// console.log(sections);
seq.export(sequence);

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
