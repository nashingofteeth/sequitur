exports.sequence = function(frameCount, wave, fps, args) {
    const max = parseFloat(args['max']),
          min = parseFloat(args['min']);

    let seq = [],
        selectedFrame = Math.floor(frameCount * Math.random()),
        frameDuration = 1/fps,
        reverse = false;

    for (let i = 0; i < (wave.length-1); i++) {
        let level = wave[i],
            maxLevel = max || 1,
            minOffset = min || 0,
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
        
        seq.push([selectedFrame, frameDuration]);
    }

    return seq;
}