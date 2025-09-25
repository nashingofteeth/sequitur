const seq = require("../sequitur");
const fs = require("mz/fs");
const path = require("node:path");
const sharp = require("sharp");
const seedrandom = require("seedrandom");

class ShapeGenerator {
  constructor(rng, numShapes = 10, amplitudeMultiplier = 1.0) {
    this.rng = rng;
    this.numShapes = numShapes;

    // Adjust shape sizes based on number of shapes and amplitude
    // 1 shape = very large (almost fills frame), 30 shapes = small
    const shapeSizeMultiplier = Math.max(0.1, (31 - numShapes) / 30);
    const amplitudeMultiplier2 = (1.5 - amplitudeMultiplier); // Inverse relationship with amplitude

    this.minSize = Math.floor(80 * shapeSizeMultiplier * amplitudeMultiplier2);
    this.maxSize = Math.floor(1400 * shapeSizeMultiplier * amplitudeMultiplier2); // Much larger max size
  }

  generateShape() {
    const size = this.minSize + this.rng() * (this.maxSize - this.minSize);

    // For very large shapes, center them more towards the middle of the frame
    const margin = Math.max(size * 0.8, 100);
    const centerX = this.rng() * (1920 - 2 * margin) + margin;
    const centerY = this.rng() * (1080 - 2 * margin) + margin;

    const numPoints = 6 + Math.floor(this.rng() * 6);
    const points = this.generateControlPoints(centerX, centerY, size, numPoints);

    return {
      points,
      centerX,
      centerY,
      size
    };
  }

  generateControlPoints(centerX, centerY, size, numPoints) {
    const points = [];
    const angleStep = (2 * Math.PI) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const baseAngle = i * angleStep;
      const angleVariation = (this.rng() - 0.5) * 0.4;
      const angle = baseAngle + angleVariation;

      const baseRadius = size * 0.3;
      const radiusVariation = this.rng() * size * 0.4;
      const radius = baseRadius + radiusVariation;

      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      points.push([Math.round(x), Math.round(y)]);
    }

    return points;
  }
}

class PositionManager {
  constructor() {
    this.canvasWidth = 1920;
    this.canvasHeight = 1080;
    this.margin = 30;
    this.occupiedAreas = [];
  }

  calculateBounds(points) {
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);

    const margin = 20;

    return {
      minX: Math.min(...xs) - margin,
      maxX: Math.max(...xs) + margin,
      minY: Math.min(...ys) - margin,
      maxY: Math.max(...ys) + margin
    };
  }

  isValidPosition(shape) {
    const bounds = this.calculateBounds(shape.points);

    if (bounds.minX < this.margin ||
        bounds.maxX > this.canvasWidth - this.margin ||
        bounds.minY < this.margin ||
        bounds.maxY > this.canvasHeight - this.margin) {
      return false;
    }

    for (const occupiedBounds of this.occupiedAreas) {
      if (this.boundsOverlap(bounds, occupiedBounds)) {
        return false;
      }
    }

    return true;
  }

  boundsOverlap(bounds1, bounds2) {
    return !(bounds1.maxX < bounds2.minX ||
             bounds2.maxX < bounds1.minX ||
             bounds1.maxY < bounds2.minY ||
             bounds2.maxY < bounds1.minY);
  }

  findValidPosition(shapeGenerator, maxAttempts = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shape = shapeGenerator.generateShape();
      if (this.isValidPosition(shape)) {
        this.occupiedAreas.push(this.calculateBounds(shape.points));
        return shape;
      }
    }
    return null;
  }

  reset() {
    this.occupiedAreas = [];
  }
}

async function generateMaskFrame(frameIndex, amplitude, baseSeed) {
  // Create deterministic seed for this frame
  const frameSeed = `${baseSeed}_frame_${frameIndex}`;
  const rng = seedrandom(frameSeed);

  // Calculate number of shapes based on amplitude
  // Range: 1 large shape (quiet) to 30 small shapes (loud)
  const minShapes = 1;
  const maxShapes = 10;
  const numShapes = minShapes + Math.floor(amplitude * (maxShapes - minShapes));

  // Create generators
  const shapeGenerator = new ShapeGenerator(rng, numShapes, amplitude);
  const positionManager = new PositionManager();

  // Generate shapes
  const shapes = [];
  for (let i = 0; i < numShapes; i++) {
    const shape = positionManager.findValidPosition(shapeGenerator);
    if (shape) {
      shapes.push(shape);
    } else {
      break; // No more valid positions
    }
  }

  // Create mask image using Sharp
  const svg = createSVG(shapes);
  const pngBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return pngBuffer;
}

function createSVG(shapes) {
  let svg = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1920" height="1080" fill="white"/>`;

  shapes.forEach((shape) => {
    // Create filled black shapes for mask
    const pathData = createPolygonPath(shape.points);
    svg += `<path d="${pathData}" fill="black"/>`;
  });

  svg += `</svg>`;
  return svg;
}

function createPolygonPath(points) {
  if (points.length < 3) return '';

  let path = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i][0]} ${points[i][1]}`;
  }

  path += ' Z';
  return path;
}

(async () => {
  try {
    const wave = seq.wave();
    const appRoot = path.join(__dirname, "..");
    const cacheDir = path.join(appRoot, "cache");

    // Create output directory for mask frames (using sequitur's expected naming convention)
    const maskFramesDir = path.join(cacheDir, "frames_matisse_mask");
    if (!fs.existsSync(maskFramesDir)) {
      fs.mkdirSync(maskFramesDir, { recursive: true });
    }

    // Check if we should reuse existing frames
    const useExisting = seq.args['use-existing'] || seq.args.u;
    const expectedFrameCount = wave.length;
    let hasExistingFrames = false;

    if (useExisting && fs.existsSync(maskFramesDir)) {
      const existingFrames = fs.readdirSync(maskFramesDir)
        .filter(f => f.endsWith('.png'))
        .length;

      if (existingFrames === expectedFrameCount) {
        hasExistingFrames = true;
        console.log(`Using existing ${existingFrames} mask frames from cache`);
      } else if (existingFrames > 0) {
        console.log(`Found ${existingFrames} existing frames but need ${expectedFrameCount}, regenerating...`);
      }
    }

    // Generate mask frame sequence
    const sequence = [];

    if (!hasExistingFrames) {
      console.log(`Generating ${wave.length} mask frames...`);

      // Generate base seed for consistent results
      const baseSeed = seq.args.seed || Date.now().toString();

      for (let i = 0; i < wave.length; i++) {
        const amplitude = parseFloat(wave[i]);
        const frameBuffer = await generateMaskFrame(i, amplitude, baseSeed);

        // Save frame as PNG
        const framePath = path.join(maskFramesDir, `${String(i).padStart(6, '0')}.png`);
        fs.writeFileSync(framePath, frameBuffer);

        if ((i + 1) % 100 === 0 || i === wave.length - 1) {
          console.log(`Generated ${i + 1}/${wave.length} frames`);
        }
      }
    }

    // Build sequence array regardless of whether frames were generated or reused
    for (let i = 0; i < wave.length; i++) {
      sequence.push([String(i).padStart(6, '0'), 1 / seq.framerate]);
    }

    console.log(`Mask generation complete. Generated ${sequence.length} frames.`);

    // Create dummy video file for sequitur's file validation
    const fakeVideoFile = "input/matisse_mask";
    if (!fs.existsSync(fakeVideoFile)) {
      fs.writeFileSync(fakeVideoFile, "");
    }

    // Use sequitur's export interface with "matisse_mask" as fake video file
    // This will make it look for frames in cache/frames_matisse_mask/ directory
    seq.export(
      sequence,
      undefined,
      fakeVideoFile, // fake video file for frame directory naming
    );

  } catch (error) {
    console.error("Error generating mask sequence:", error);
    process.exit(1);
  }
})();
