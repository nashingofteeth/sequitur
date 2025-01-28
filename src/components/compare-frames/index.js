const { Worker } = require('node:worker_threads');
const os = require('node:os');
const path = require('node:path');
const { readCache, writeCache } = require('./cache-handler');
const { createProgressMessage } = require('./utils');

async function diffs(file, frameCount, sort = false) {
  const diffs = await readCache(file) || await compareFrames(file, frameCount);
  return sort ? sortedDiffs(diffs) : diffs;
}

async function compareFrames(file, frameCount) {
  const diffs = {};
  const timecode = [];
  let threshold = 100;

  for (let a = 1; a <= frameCount; a++) {
    timecode.push(Date.now());
    const processingTime = timecode[timecode.length - 1] - timecode[timecode.length - 2];
    console.log(createProgressMessage(a, frameCount, processingTime));

    diffs[a] = {};
    let max = 0;

    const workers = [];
    const numOfCPUs = os.cpus().length;
    const chunkSize = Math.ceil(frameCount / numOfCPUs);

    for (let i = 0; i < numOfCPUs; i++) {
      const start = i * chunkSize + 1;
      const end = Math.min((i + 1) * chunkSize, frameCount);

      if (start > frameCount) break;

      workers.push(createWorker(file, a, start, end, threshold));
    }

    const results = await Promise.all(workers);

    for (const result of results) {
      for (const [frame, diff] of Object.entries(result)) {
        diffs[a][frame] = diff;
        max = diff > max ? diff : max;
      }
    }

    threshold = Math.ceil(max) + 5;
  }

  await writeCache(file, diffs);
  return diffs;
}

function createWorker(file, currentFrame, start, end, threshold) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: { file, currentFrame, start, end, threshold }
    });
    worker.on('message', resolve);
    worker.on('error', reject);
  });
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
