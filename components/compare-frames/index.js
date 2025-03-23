const { readCache, writeCache } = require('./cache-handler');
const { createProgressMessage } = require('./utils');
const { getDiff } = require('./image-processor');

async function diffs(file, frameCount, sort = true) {
  const diffs = await readCache(file) || await compareFrames(file, frameCount);
  const { composite, color, channels } = diffs;

  if (sort) {
    return {
      composite: sortedDiffs(composite),
      channels: channels ? sortedChannelDiffs(channels) : null,
      color: color ? sortedDiffs(color) : null
    };
  } else {
    return { composite, channels, color };
  }
}

async function compareFrames(file, frameCount) {
  const compositeDiffs = {};
  const channelDiffs = { r: {}, g: {}, b: {} };
  const colorDiffs = {};
  const timecode = [];

  // Initialize matrices with self-comparison set to zero
  for (let frame = 1; frame <= frameCount; frame++) {
    compositeDiffs[frame] = { [frame]: 0 };
    colorDiffs[frame] = { [frame]: 0 };
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
              channels: { r: 0, g: 0, b: 0 },
              color: 0
            };
          })
      );
    }

    const results = await Promise.all(comparePromises);

    for (const { frameA, frameB, composite, channels, color } of results) {
      // Store composite difference (both directions)
      compositeDiffs[frameA][frameB] = compositeDiffs[frameB][frameA] = composite;

      // Store color change difference (both directions)
      colorDiffs[frameA][frameB] = colorDiffs[frameB][frameA] = color;

      // Store all channel differences (both directions)
      for (const channel of ['r', 'g', 'b']) {
        channelDiffs[channel][frameA][frameB] =
          channelDiffs[channel][frameB][frameA] = channels[channel];
      }
    }
  }

  await writeCache(file, compositeDiffs, colorDiffs, channelDiffs);

  return {
    composite: compositeDiffs,
    channels: channelDiffs,
    color: colorDiffs
  };
}

function sortedDiffs(diffs) {
  const sortedDiffs = {};
  for (const f in diffs) {
    const sorted = Object.entries(diffs[f])
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
