const path = require('node:path');
const sharp = require('sharp');

async function getDiff(f, a, b) {
  try {
    const [img1, img2] = await Promise.all([
      loadImage(f, a),
      loadImage(f, b)
    ]);

    validateImages(img1, img2);

    return calculateDifference(img1, img2);
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

function validateImages(img1, img2) {
  if (img1.info.width !== img2.info.width || img1.info.height !== img2.info.height) {
    throw new Error('Images have different dimensions');
  }
}

function calculateDifference(img1, img2) {
  const totalPixels = img1.info.width * img1.info.height;
  let diffSum = 0;

  for (let i = 0; i < img1.data.length; i += 4) {
    const diffR = Math.abs(img1.data[i] - img2.data[i]);
    const diffG = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
    const diffB = Math.abs(img1.data[i + 2] - img2.data[i + 2]);

    const pixelDiff = (diffR + diffG + diffB) / (255 * 3);
    diffSum += pixelDiff;
  }

  const avgDiff = (diffSum / totalPixels) * 100;
  const sensitivity = 2.5;
  const scaledDiff = avgDiff ** (1 / sensitivity);

  return Number.parseFloat(scaledDiff.toFixed(2));
}

exports.getDiff = getDiff;