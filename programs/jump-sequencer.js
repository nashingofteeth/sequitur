const seq = require("../sequitur");

(async () => {
  const wave = seq.wave();
  const { composite: diffs } = await seq.diffs();

  sequence(wave, diffs);
})();

function sequence(wave, diffs) {
  const sequence = [];
  const frameCount = Object.keys(diffs).length;
  let currentFrame = "1";
  
  // Command line options
  const jumpThreshold = seq.args["jump-threshold"] || 0.1; // minimum audio jump to trigger cut
  const maxDifference = seq.args["max-difference"] || 1.0; // max frame difference proportion (0-1)
  const volumeThreshold = seq.args["volume-threshold"] || 0.0; // minimum volume to consider
  
  console.log(`Jump threshold: ${jumpThreshold}, Max difference: ${maxDifference}, Volume threshold: ${volumeThreshold}`);
  
  let previousAmplitude = 0;
  
  for (const a in wave) {
    const amplitude = Number.parseFloat(wave[a]);
    const audioJump = Math.abs(amplitude - previousAmplitude);
    
    // Check if we have a significant audio jump and volume is above threshold
    if (audioJump > jumpThreshold && amplitude > volumeThreshold) {
      // Calculate proportional frame difference based on audio jump
      // Normalize jump to 0-1 range, then apply max difference limit
      const normalizedJump = Math.min(audioJump, 1.0);
      const targetDifferenceLevel = normalizedJump * maxDifference;
      
      // Get current frame's difference rankings
      const currentDiffs = diffs[currentFrame];
      
      // Select frame based on proportional difference
      const diffIndex = Math.floor((frameCount - 1) * targetDifferenceLevel);
      const nextFrame = currentDiffs[String(diffIndex)][0];
      
      sequence.push([nextFrame, 1 / seq.framerate]);
      currentFrame = nextFrame;
      
      console.log(`Audio jump: ${audioJump.toFixed(3)} -> Diff level: ${targetDifferenceLevel.toFixed(3)} -> Frame: ${nextFrame}`);
    } else {
      // No significant jump or volume too low - stay on current frame
      sequence.push([currentFrame, 1 / seq.framerate]);
    }
    
    previousAmplitude = amplitude;
  }
  
  const uniqueFrames = new Set(sequence.map(s => s[0])).size;
  const percentageUsed = (uniqueFrames / frameCount * 100).toFixed(2);
  console.log(`Unique frames used: ${uniqueFrames}/${frameCount} (${percentageUsed}%)`);
  
  seq.export(sequence);
}