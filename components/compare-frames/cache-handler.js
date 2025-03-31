const fs = require('node:fs').promises;
const path = require('node:path');

// Helper function to create buffer for difference matrices
function createDiffBuffer(frameCount, diffs, channels = null) {
  const triangleSize = (frameCount * (frameCount - 1) / 2);
  const channelCount = channels ? channels.length : 1;
  const buffer = Buffer.alloc(4 + channelCount * triangleSize * 4);
  buffer.writeUInt32LE(frameCount, 0);

  let offset = 4;

  if (channels) {
    // Multi-channel data (like r,g,b or l,a,b)
    for (let channel of channels) {
      for (let i = 1; i <= frameCount; i++) {
        for (let j = i + 1; j <= frameCount; j++) {
          buffer.writeFloatLE(diffs[channel][i][j], offset);
          offset += 4;
        }
      }
    }
  } else {
    // Single matrix data
    for (let i = 1; i <= frameCount; i++) {
      for (let j = i + 1; j <= frameCount; j++) {
        buffer.writeFloatLE(diffs[i][j], offset);
        offset += 4;
      }
    }
  }

  return buffer;
}

// Helper function to read difference matrices from buffer
function readDiffBuffer(buffer, channels = null) {
  const frameCount = buffer.readUInt32LE(0);
  let diffs;

  if (channels) {
    // Initialize multi-channel structure
    diffs = {};
    for (let channel of channels) {
      diffs[channel] = {};
      for (let i = 1; i <= frameCount; i++) {
        diffs[channel][i] = { [i]: 0 };
      }
    }

    let offset = 4;
    for (let channel of channels) {
      for (let i = 1; i <= frameCount; i++) {
        for (let j = i + 1; j <= frameCount; j++) {
          const diff = buffer.readFloatLE(offset);
          diffs[channel][i][j] = diffs[channel][j][i] = diff;
          offset += 4;
        }
      }
    }
  } else {
    // Initialize single matrix structure
    diffs = {};
    for (let i = 1; i <= frameCount; i++) {
      diffs[i] = { [i]: 0 };
    }

    let offset = 4;
    for (let i = 1; i <= frameCount; i++) {
      for (let j = i + 1; j <= frameCount; j++) {
        const diff = buffer.readFloatLE(offset);
        diffs[i][j] = diffs[j][i] = diff;
        offset += 4;
      }
    }
  }

  return diffs;
}

async function writeCache(file, compositeDiffs, colorDiffs, channelDiffs) {
  const frameCount = Object.keys(compositeDiffs).length;
  const basePath = `cache/diffs_${path.basename(file)}`;
  const channels = ['l', 'a', 'b'];

  // Write composite diffs
  const compositeBuffer = createDiffBuffer(frameCount, compositeDiffs);
  await fs.writeFile(`${basePath}_composite.bin`, compositeBuffer);

  // Write color diffs
  const colorBuffer = createDiffBuffer(frameCount, colorDiffs);
  await fs.writeFile(`${basePath}_color.bin`, colorBuffer);

  // Write channel diffs
  const channelBuffer = createDiffBuffer(frameCount, channelDiffs, channels);
  await fs.writeFile(`${basePath}_channels.bin`, channelBuffer);
}

async function readCache(file) {
  const basePath = `cache/diffs_${path.basename(file)}`;
  const channels = ['l', 'a', 'b'];

  try {
    // Read all files in parallel, assuming they all exist
    const [compositeBuffer, colorBuffer, channelBuffer] = await Promise.all([
      fs.readFile(`${basePath}_composite.bin`),
      fs.readFile(`${basePath}_color.bin`),
      fs.readFile(`${basePath}_channels.bin`)
    ]);

    return {
      composite: readDiffBuffer(compositeBuffer),
      color: readDiffBuffer(colorBuffer),
      channels: readDiffBuffer(channelBuffer, channels)
    };
  } catch (e) {
    // This will only trigger if any file read fails
    return null;
  }
}

exports.readCache = readCache;
exports.writeCache = writeCache;
