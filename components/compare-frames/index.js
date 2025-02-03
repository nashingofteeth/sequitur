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

  for (let frameA = 1; frameA <= frameCount; frameA++) {
    timecode.push(Date.now());
    const processingTime = timecode[timecode.length - 1] - timecode[timecode.length - 2];
    console.log(createProgressMessage(frameA, frameCount, processingTime));

    diffs[frameA] = {};

    // Create array of promises for all frame comparisons
    const comparePromises = [];

    for (let frameB = 1; frameB <= frameCount; frameB++) {
      if (frameB === frameA) {
        diffs[frameA][frameB] = 0;
        continue;
      }

      comparePromises.push(
        getDiff(file, frameA, frameB)
          .then(diff => ({ frameB, diff }))
          .catch(error => {
            console.error(`Error comparing frames ${frameA} and ${frameB}:`, error);
            return { frameB, diff: 0 };
          })
      );
    }

    // Wait for all comparisons to complete
    const results = await Promise.all(comparePromises);

    // Process results
    for (const { frameB, diff } of results) {
      diffs[frameA][frameB] = diff;
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
