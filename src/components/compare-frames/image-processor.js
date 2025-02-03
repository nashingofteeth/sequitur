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

const imageCache = new Map();
async function loadImage(file, frame) {
  const key = `${file}_${frame}`;
  if (imageCache.has(key)) {
    return imageCache.get(key);
  }

  const image = await sharp(`cache/frames_${path.basename(file)}/${frame}.jpg`)
    .raw()
    .toBuffer({ resolveWithObject: true });

  imageCache.set(key, image);
  return image;
}

function validateImages(imgA, imgB) {
  if (imgA.info.width !== imgB.info.width || imgA.info.height !== imgB.info.height) {
    throw new Error('Images have different dimensions');
  }
}

function calculateDifference(imgA, imgB) {
  const totalPixels = imgA.info.width * imgA.info.height;
  let diffSum = 0;

  for (let i = 0; i < imgA.data.length; i += 3) {
    const diffR = Math.abs(imgA.data[i] - imgB.data[i]);
    const diffG = Math.abs(imgA.data[i + 1] - imgB.data[i + 1]);
    const diffB = Math.abs(imgA.data[i + 2] - imgB.data[i + 2]);

    const pixelDiff = (diffR + diffG + diffB) / (255 * 3);
    diffSum += pixelDiff;
  }

  const avgDiff = (diffSum / totalPixels) * 100;

  return Number.parseFloat(avgDiff.toFixed(2));
}

exports.getDiff = getDiff;
