const seq = require("../sequitur"),
  frameCount = seq.frameCount(),
  frameDuration = 1 / seq.framerate;

var sequence = [],
  sections = {},
  divisor = seq.args["divisor"] ? Number(seq.args["divisor"]) : 8;

if (!Number.isFinite(divisor) || divisor < 1) {
  console.error(`Error: invalid divisor: ${seq.args["divisor"]}`);
  process.exit(1);
}

var sectionLength = Math.max(1, Math.floor(frameCount / divisor));

var s = 0;
while (s < frameCount) {
  let index = Math.floor(s / sectionLength);
  sections[index] = [];
  s += sectionLength;
}

for (let f = 0; f < frameCount; f++) {
  let placement = Math.floor(f / sectionLength);
  sections[placement].push(f);
}

Object.keys(sections).forEach((key) => {
  for (let i = 0; i < sections[key].length; i++) {
    sequence.push([
      sections[key][getRandomInt(0, sections[key].length)] + 1,
      frameDuration,
    ]);
  }
});
// console.log(sections);
seq.export(sequence);

function getRandomInt(min, max) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}
