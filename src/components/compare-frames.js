const fs = require('mz/fs');
const path = require('node:path');
const sharp = require('sharp');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const os = require('node:os');

async function diffs(file, frameCount, sort = false) {
  const outputFile = `data/diffs_${path.basename(file)}.json`;
  let diffs = null;

  if (fs.existsSync(outputFile))
    diffs = JSON.parse(fs.readFileSync(outputFile));
  else {
    diffs = await compareFrames(file, frameCount);
    fs.writeFileSync(outputFile, JSON.stringify(diffs));
  }

  if (sort) diffs = sortedDiffs(diffs);

  return diffs;
}

async function compareFrames(file, frameCount) {
  const diffs = {};
  const timecode = [];
  let threshold = 100;

  for (let a = 1; a <= frameCount; a++) {
    timecode.push(Date.now());
    const processingTime = timecode[timecode.length - 1] - timecode[timecode.length - 2];
    const diffsPerSec = frameCount / (processingTime / 1000);
    const diffsLeft = (frameCount - a) * frameCount;
    const secsLeft = Math.round(diffsLeft / diffsPerSec);
    const timeLeft = secsLeft > 60 ? `${Math.round(secsLeft / 60)}m` : `${secsLeft}s`;
    const progress = Math.round((a / frameCount) * 100);

    const message = a < 2 || a > frameCount - 1
      ? "comparing frames..."
      : `comparing frames - ${progress}%, ${timeLeft} left @ ${Math.round(diffsPerSec)}/s`;
    console.log(message);

    diffs[a] = {};
    let max = 0;

    // Use worker threads for parallel processing
    const workers = [];
    const numOfCPUs = os.cpus().length;
    const chunkSize = Math.ceil(frameCount / numOfCPUs);

    for (let i = 0; i < numOfCPUs; i++) {
      const start = i * chunkSize + 1;
      const end = Math.min((i + 1) * chunkSize, frameCount);

      if (start > frameCount) break;

      workers.push(
        new Promise((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: {
              file,
              currentFrame: a,
              start,
              end,
              threshold
            }
          });
          worker.on('message', resolve);
          worker.on('error', reject);
        })
      );
    }

    const results = await Promise.all(workers);

    // Combine results from all workers
    for (const result of results) {
      for (const [frame, diff] of Object.entries(result)) {
        diffs[a][frame] = diff;
        max = diff > max ? diff : max;
      }
    }

    threshold = Math.ceil(max) + 5;
  }

  return diffs;
}

// Worker thread code
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

async function getDiff(f, a, b) {
  try {
    const [img1, img2] = await Promise.all([
      sharp(`data/frames_${path.basename(f)}/${a}.jpg`)
        .raw()
        .toBuffer({ resolveWithObject: true }),
      sharp(`data/frames_${path.basename(f)}/${b}.jpg`)
        .raw()
        .toBuffer({ resolveWithObject: true })
    ]);

    if (img1.info.width !== img2.info.width || img1.info.height !== img2.info.height) {
      throw new Error('Images have different dimensions');
    }

    const totalPixels = img1.info.width * img1.info.height;
    let diffSum = 0;

    // Compare pixels with weighted differences
    for (let i = 0; i < img1.data.length; i += 4) {
      const diffR = Math.abs(img1.data[i] - img2.data[i]);
      const diffG = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
      const diffB = Math.abs(img1.data[i + 2] - img2.data[i + 2]);

      // Calculate weighted difference for this pixel (0-1 range)
      const pixelDiff = (diffR + diffG + diffB) / (255 * 3);
      diffSum += pixelDiff;
    }

    // Calculate average difference (0-100 range)
    const avgDiff = (diffSum / totalPixels) * 100;

    // Apply a non-linear scaling to spread out the values
    // You can adjust these parameters to fine-tune the sensitivity
    const sensitivity = 2.5; // Increase for more sensitivity to small changes
    const scaledDiff = avgDiff ** (1 / sensitivity);

    return Number.parseFloat(scaledDiff.toFixed(2));
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}

function sortedDiffs(o) {
  const sortedDiffs = {};
  for (const f in o) {
    const sorted = [];

    for (const d in o[f]) sorted.push([d, o[f][d]]);

    sorted.sort((a, b) => a[1] - b[1]);

    sortedDiffs[f] = sorted;
  }

  return sortedDiffs;
}

exports.diffs = diffs;
