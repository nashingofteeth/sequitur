const { readCache, writeCache } = require('./cache-handler');
const { createProgressMessage } = require('./utils');
const { getDiff } = require('./image-processor');

async function diffs(file, frameCount, sort = true) {
  const diffs = await readCache(file) || await compareFrames(file, frameCount);
  return sort ? sortedDiffs(diffs) : diffs;
}

async function compareFrames(file, frameCount) {
  const diffs = {};
  const timecode = [];

  for (let frame = 1; frame <= frameCount; frame++) {
    diffs[frame] = {};
    // Every frame has zero difference with itself
    diffs[frame][frame] = 0;
  }

  for (let frameA = 1; frameA <= frameCount; frameA++) {
    timecode.push(Date.now());
    const processingTime = timecode[timecode.length - 1] - timecode[timecode.length - 2];
    console.log(createProgressMessage(frameA, frameCount, processingTime));

    const comparePromises = [];

    // Only compare with frames that haven't been compared yet
    // This means only comparing frameA with frameB where frameB > frameA
    for (let frameB = frameA + 1; frameB <= frameCount; frameB++) {
      comparePromises.push(
        getDiff(file, frameA, frameB)
          .then(diff => ({ frameA, frameB, diff }))
          .catch(error => {
            console.error(`Error comparing frames ${frameA} and ${frameB}:`, error);
            return { frameA, frameB, diff: 0 };
          })
      );
    }

    const results = await Promise.all(comparePromises);

    for (const { frameA, frameB, diff } of results) {
      diffs[frameA][frameB] = diff;
      diffs[frameB][frameA] = diff; // Store the same value for the reverse comparison
    }
  }

  await writeCache(file, diffs);
  return diffs;
}

function sortedDiffs(o) {
  const sortedDiffs = {};
  for (const f in o) {
    const sorted = Object.entries(o[f])
      .sort((a, b) => a[1] - b[1]);
    sortedDiffs[f] = sorted;
  }
  return sortedDiffs;
}

exports.diffs = diffs;
