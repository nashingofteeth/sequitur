const fs = require('mz/fs');
const path = require('node:path');

async function readCache(file) {
  const outputFile = getCachePath(file);

  if (await fs.exists(outputFile)) {
    const data = await fs.readFile(outputFile);
    return JSON.parse(data);
  }
  return null;
}

async function writeCache(file, data) {
  const outputFile = getCachePath(file);
  await fs.writeFile(outputFile, JSON.stringify(data));
}

function getCachePath(file) {
  return `cache/diffs_${path.basename(file)}.json`;
}

exports.readCache = readCache;
exports.writeCache = writeCache;
