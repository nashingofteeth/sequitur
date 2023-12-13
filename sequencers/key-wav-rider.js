const seq = require('../src/sequitur'),
      frameCount = seq.frameCount(),
      wave = seq.wave(),
      frameDuration = 1/seq.framerate;

var sequence = [];

for (let i = 0; i < (wave.length-1); i++) {
    let level = parseFloat(wave[i]),
        selectedFrame = Math.ceil((frameCount - 1) * level);
    
    sequence.push([selectedFrame+1, frameDuration]);
}

seq.export(sequence);