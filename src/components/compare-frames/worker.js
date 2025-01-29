const { isMainThread, parentPort, workerData } = require('node:worker_threads');
const { getDiff } = require('./image-processor');

if (!isMainThread) {
  const { file, frameA, start, end } = workerData;

  async function compareFrameChunk() {
    const results = {};

    for (let frameB = start; frameB <= end; frameB++) {
      if (frameB === frameA) {
        results[frameB] = 0;
        continue;
      }

      try {
        const diff = await getDiff(file, frameA, frameB);
        results[frameB] = diff;
      } catch (error) {
        console.error(`Error comparing frames ${frameA} and ${frameB}:`, error);
        results[frameB] = 0;
      }
    }

    parentPort.postMessage(results);
  }

  compareFrameChunk();
}
