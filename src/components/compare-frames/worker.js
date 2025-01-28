const { isMainThread, parentPort, workerData } = require('node:worker_threads');
const { getDiff } = require('./image-processor');

if (!isMainThread) {
  const { file, currentFrame, start, end } = workerData;

  async function compareFrameChunk() {
    const results = {};

    for (let b = start; b <= end; b++) {
      if (b === currentFrame) {
        results[b] = 0;
        continue;
      }

      try {
        const diff = await getDiff(file, currentFrame, b);
        results[b] = diff;
      } catch (error) {
        console.error(`Error comparing frames ${currentFrame} and ${b}:`, error);
        results[b] = 0;
      }
    }

    parentPort.postMessage(results);
  }

  compareFrameChunk();
}
