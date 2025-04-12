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
  const appRoot = path.join(__dirname, '../..');
  const framePath = `${appRoot}/cache/frames_${path.basename(file)}/${frame}.png`;
  const image = await sharp(framePath)
    .resize({ height: 240 })
    .toColourspace('lab')
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

// Helper function to scale a value to percentage and format it
function scaleToPercentage(value, decimal = 2) {
  return Number.parseFloat((value * 100).toFixed(decimal));
}

function calculateDifference(imgA, imgB) {
  const totalPixels = imgA.info.width * imgA.info.height;
  let diffSum = 0;
  let diffSumL = 0, diffSumA = 0, diffSumB = 0;

  // For color change calculation
  let sumL_A = 0, sumA_A = 0, sumB_A = 0;
  let sumL_B = 0, sumA_B = 0, sumB_B = 0;

  for (let i = 0; i < imgA.data.length; i += 3) {
    // LAB components
    // L ranges from 0 to 100
    // a and b range from -128 to 127
    const diffL = Math.abs(imgA.data[i] - imgB.data[i]);
    const diffA = Math.abs(imgA.data[i + 1] - imgB.data[i + 1]);
    const diffB = Math.abs(imgA.data[i + 2] - imgB.data[i + 2]);

    // Normalize differences
    diffSumL += diffL / 100; // L channel is 0-100
    diffSumA += diffA / 255; // a channel is -128 to 127, but normalized for simplicity
    diffSumB += diffB / 255; // b channel is -128 to 127, but normalized for simplicity

    // Weighted difference to account for human perception
    // L (luminance) is weighted more heavily than a and b (color)
    const pixelDiff = (0.7 * diffL / 100) + (0.15 * diffA / 255) + (0.15 * diffB / 255);
    diffSum += pixelDiff;

    // Calculate sum of values for each channel
    sumL_A += imgA.data[i];
    sumA_A += imgA.data[i + 1];
    sumB_A += imgA.data[i + 2];

    sumL_B += imgB.data[i];
    sumA_B += imgB.data[i + 1];
    sumB_B += imgB.data[i + 2];
  }

  const avgDiff = scaleToPercentage(diffSum / totalPixels);
  const avgDiffL = scaleToPercentage(diffSumL / totalPixels);
  const avgDiffA = scaleToPercentage(diffSumA / totalPixels);
  const avgDiffB = scaleToPercentage(diffSumB / totalPixels);

  // Calculate average colors
  const avgL_A = sumL_A / totalPixels;
  const avgA_A = sumA_A / totalPixels;
  const avgB_A = sumB_A / totalPixels;

  const avgL_B = sumL_B / totalPixels;
  const avgA_B = sumA_B / totalPixels;
  const avgB_B = sumB_B / totalPixels;

  // Calculate color vector distance in LAB space
  const colorVectorDistance = Math.sqrt(
    Math.pow((avgL_A - avgL_B) / 100, 2) +
    Math.pow((avgA_A - avgA_B) / 255, 2) +
    Math.pow((avgB_A - avgB_B) / 255, 2)
  );

  // Scale to percentage (0-100)
  const colorDiff = scaleToPercentage(colorVectorDistance);

  return {
    composite: avgDiff,
    color: colorDiff,
    channels: {
      l: avgDiffL,
      a: avgDiffA,
      b: avgDiffB
    },
  };
}

exports.getDiff = getDiff;
