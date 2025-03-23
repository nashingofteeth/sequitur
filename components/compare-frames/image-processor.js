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

  const image = await sharp(`cache/frames_${path.basename(file)}/${frame}.png`)
    .resize({ height: 240 })
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
  let diffSumR = 0, diffSumG = 0, diffSumB = 0;

  // For color change calculation
  let sumR_A = 0, sumG_A = 0, sumB_A = 0;
  let sumR_B = 0, sumG_B = 0, sumB_B = 0;

  for (let i = 0; i < imgA.data.length; i += 3) {
    const diffR = Math.abs(imgA.data[i] - imgB.data[i]);
    const diffG = Math.abs(imgA.data[i + 1] - imgB.data[i + 1]);
    const diffB = Math.abs(imgA.data[i + 2] - imgB.data[i + 2]);

    diffSumR += diffR / 255;
    diffSumG += diffG / 255;
    diffSumB += diffB / 255;

    const pixelDiff = (diffR + diffG + diffB) / (255 * 3);
    diffSum += pixelDiff;

    // Calculate sum of values for each channel
    sumR_A += imgA.data[i];
    sumG_A += imgA.data[i + 1];
    sumB_A += imgA.data[i + 2];

    sumR_B += imgB.data[i];
    sumG_B += imgB.data[i + 1];
    sumB_B += imgB.data[i + 2];
  }

  const avgDiff = Number.parseFloat(((diffSum / totalPixels) * 100).toFixed(2));
  const avgDiffR = Number.parseFloat(((diffSumR / totalPixels) * 100).toFixed(2));
  const avgDiffG = Number.parseFloat(((diffSumG / totalPixels) * 100).toFixed(2));
  const avgDiffB = Number.parseFloat(((diffSumB / totalPixels) * 100).toFixed(2));

  // Calculate average colors
  const avgR_A = sumR_A / totalPixels;
  const avgG_A = sumG_A / totalPixels;
  const avgB_A = sumB_A / totalPixels;

  const avgR_B = sumR_B / totalPixels;
  const avgG_B = sumG_B / totalPixels;
  const avgB_B = sumB_B / totalPixels;

  // Calculate color vector distance (normalized)
  const colorVectorDistance = Math.sqrt(
    Math.pow((avgR_A - avgR_B) / 255, 2) +
    Math.pow((avgG_A - avgG_B) / 255, 2) +
    Math.pow((avgB_A - avgB_B) / 255, 2)
  );

  // Scale to percentage (0-100)
  const colorDiff = Number.parseFloat((colorVectorDistance * 100).toFixed(2));

  return {
    composite: avgDiff,
    color: colorDiff,
    channels: {
      r: avgDiffR,
      g: avgDiffG,
      b: avgDiffB
    },
  };
}

exports.getDiff = getDiff;
