const seq = require('../sequitur'),
      frameCount = seq.frameCount(),
      wave = seq.wave(),
      frameDuration = 1/seq.framerate,
      maxLevel = seq.args['max'] ? parseFloat(seq.args['max']) : 1,
      minOffset = seq.args['min'] ? parseFloat(seq.args['min']) : 0;

(async() => {
    console.log(await seq.diffs());
})()

var sequence = [],
    selectedFrame = Math.floor(frameCount * Math.random()),
    reverse = false;

for (let i = 0; i < (wave.length-1); i++) {
    let level = wave[i],
        maxOffset = Math.round(frameCount * (level * maxLevel));
        offset = maxOffset < minOffset ? 1 : maxOffset;

    if ( selectedFrame + offset > frameCount-1 ) reverse = true;
    else if ( selectedFrame - offset < 0 ) reverse = false;

    if (reverse) selectedFrame = selectedFrame - offset;
    else selectedFrame = selectedFrame + offset;

    if ( selectedFrame > frameCount-1 || selectedFrame < 0 ) {
        console.log('off the rails!');
        process.exit();
    }
    
    sequence.push([selectedFrame, frameDuration]);
}

seq.export(sequence);