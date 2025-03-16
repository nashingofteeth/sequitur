const fs = require('node:fs').promises;
const path = require('node:path');

async function writeCache(file, compositeDiffs, channelDiffs = null) {
  const frameCount = Object.keys(compositeDiffs).length;
  const outputPath = `cache/diffs_${path.basename(file)}.bin`;
  const triangleSize = (frameCount * (frameCount - 1) / 2);

  const buffer = Buffer.alloc(4 + triangleSize * 4);
  buffer.writeUInt32LE(frameCount, 0);

  let offset = 4;
  for (let i = 1; i <= frameCount; i++) {
    for (let j = i + 1; j <= frameCount; j++) {
      buffer.writeFloatLE(compositeDiffs[i][j], offset);
      offset += 4;
    }
  }
  await fs.writeFile(outputPath, buffer);

  if (channelDiffs) {
    const channelBuffer = Buffer.alloc(4 + 3 * triangleSize * 4);
    channelBuffer.writeUInt32LE(frameCount, 0);

    offset = 4;
    for (let channel of ['r', 'g', 'b']) {
      for (let i = 1; i <= frameCount; i++) {
        for (let j = i + 1; j <= frameCount; j++) {
          channelBuffer.writeFloatLE(channelDiffs[channel][i][j], offset);
          offset += 4;
        }
      }
    }
    await fs.writeFile(`cache/diffs_${path.basename(file)}_channels.bin`, channelBuffer);
  }
}

async function readCache(file) {
  try {
    const filePath = `cache/diffs_${path.basename(file)}.bin`;
    const buffer = await fs.readFile(filePath);
    const frameCount = buffer.readUInt32LE(0);
    const compositeDiffs = {};

    for (let i = 1; i <= frameCount; i++) {
      compositeDiffs[i] = { [i]: 0 };
    }

    let offset = 4;
    for (let i = 1; i <= frameCount; i++) {
      for (let j = i + 1; j <= frameCount; j++) {
        const diff = buffer.readFloatLE(offset);
        compositeDiffs[i][j] = compositeDiffs[j][i] = diff;
        offset += 4;
      }
    }

    try {
      const channelPath = `cache/diffs_${path.basename(file)}_channels.bin`;
      const channelBuffer = await fs.readFile(channelPath);

      if (channelBuffer.readUInt32LE(0) !== frameCount) {
        throw new Error('Channel frame count mismatch');
      }

      const channelDiffs = { r: {}, g: {}, b: {} };
      for (let channel of ['r', 'g', 'b']) {
        for (let i = 1; i <= frameCount; i++) {
          channelDiffs[channel][i] = { [i]: 0 };
        }
      }

      offset = 4;
      for (let channel of ['r', 'g', 'b']) {
        for (let i = 1; i <= frameCount; i++) {
          for (let j = i + 1; j <= frameCount; j++) {
            const diff = channelBuffer.readFloatLE(offset);
            channelDiffs[channel][i][j] = channelDiffs[channel][j][i] = diff;
            offset += 4;
          }
        }
      }

      return { composite: compositeDiffs, channels: channelDiffs };
    } catch (e) {
      return { composite: compositeDiffs };
    }
  } catch (e) {
    return null;
  }
}

exports.readCache = readCache;
exports.writeCache = writeCache;
