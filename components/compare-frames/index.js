const { readCache, writeCache } = require('./cache-handler');
const { createProgressMessage } = require('./utils');
const { getDiff } = require('./image-processor');

async function diffs(file, frameCount, sort = true) {
  const diffs = await readCache(file) || await compareFrames(file, frameCount);
  const { composite, channels } = diffs;
  return sort ?
    {
      composite: sortedDiffs(composite),
      channels: channels ? sortedChannelDiffs(channels) : null
    } :
    { composite, channels };
}

async function compareFrames(file, frameCount) {
  const compositeDiffs = {};
  const channelDiffs = { r: {}, g: {}, b: {} };
  const timecode = [];

  // Initialize matrices with self-comparison set to zero
  for (let frame = 1; frame <= frameCount; frame++) {
    compositeDiffs[frame] = { [frame]: 0 };
    ['r', 'g', 'b'].forEach(channel => {
      channelDiffs[channel][frame] = { [frame]: 0 };
    });
  }

  for (let frameA = 1; frameA <= frameCount; frameA++) {
    timecode.push(Date.now());
    const processingTime = timecode.length > 1 ? timecode[timecode.length - 1] - timecode[timecode.length - 2] : 0;
    console.log(createProgressMessage(frameA, frameCount, processingTime));

    const comparePromises = [];

    // Only compare with frames that haven't been compared yet
    // This means only comparing frameA with frameB where frameB > frameA
    for (let frameB = frameA + 1; frameB <= frameCount; frameB++) {
      comparePromises.push(
        getDiff(file, frameA, frameB)
          .then(result => ({ frameA, frameB, ...result }))
          .catch(error => {
            console.error(`Error comparing frames ${frameA} and ${frameB}:`, error);
            return {
              frameA,
              frameB,
              composite: 0,
              channels: { r: 0, g: 0, b: 0 }
            };
          })
      );
    }

    const results = await Promise.all(comparePromises);

    for (const { frameA, frameB, composite, channels } of results) {
      // Store overall difference (both directions)
      compositeDiffs[frameA][frameB] = compositeDiffs[frameB][frameA] = composite;

      // Store all channel differences (both directions)
      for (const channel of ['r', 'g', 'b']) {
        channelDiffs[channel][frameA][frameB] =
          channelDiffs[channel][frameB][frameA] = channels[channel];
      }
    }
  }

  await writeCache(file, compositeDiffs, channelDiffs);

  return { composite: compositeDiffs, channels: channelDiffs };
}

function sortedDiffs(compositeDiffs) {
  const sortedDiffs = {};
  for (const f in compositeDiffs) {
    const sorted = Object.entries(compositeDiffs[f])
      .sort((a, b) => a[1] - b[1]);
    sortedDiffs[f] = sorted;
  }
  return sortedDiffs;
}

function sortedChannelDiffs(channelDiffs) {
  const sorted = {};
  for (const channel of ['r', 'g', 'b']) {
    sorted[channel] = {};
    for (const f in channelDiffs[channel]) {
      sorted[channel][f] = Object.entries(channelDiffs[channel][f])
        .sort((a, b) => a[1] - b[1]);
    }
  }
  return sorted;
}

exports.diffs = diffs;
