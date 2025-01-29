const path = require('node:path');
const sharp = require('sharp');

async function getDiff(file, frameA, frameB) {
  try {
    const [imgA, imgB] = await Promise.all([
      loadImage(file, frameA),
      loadImage(file, frameB)
    ]);

    validateImages(imgA, imgB);

    return calculateDifference(imgA, imgB);
  } catch (error) {
    console.error('Error processing images:', error);
    throw error;
  }
}

async function loadImage(file, frame) {
  return sharp(`data/frames_${path.basename(file)}/${frame}.jpg`)
    .raw()
    .toBuffer({ resolveWithObject: true });
}

function validateImages(imgA, imgB) {
  if (imgA.info.width !== imgB.info.width || imgA.info.height !== imgB.info.height) {
    throw new Error('Images have different dimensions');
  }
}

function calculateDifference(imgA, imgB) {
  const totalPixels = imgA.info.width * imgA.info.height;
  let diffSum = 0;

  for (let i = 0; i < imgA.data.length; i += 4) {
    const diffR = Math.abs(imgA.data[i] - imgB.data[i]);
    const diffG = Math.abs(imgA.data[i + 1] - imgB.data[i + 1]);
    const diffB = Math.abs(imgA.data[i + 2] - imgB.data[i + 2]);

    const pixelDiff = (diffR + diffG + diffB) / (255 * 3);
    diffSum += pixelDiff;
  }

  const avgDiff = (diffSum / totalPixels) * 100;
  const sensitivity = 2.5;
  const scaledDiff = avgDiff ** (1 / sensitivity);

  return Number.parseFloat(scaledDiff.toFixed(2));
}

exports.getDiff = getDiff;
