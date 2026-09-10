const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, execSync } = require("node:child_process");

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function framesDirFor(videoFile, preview) {
  const suffix = preview ? "_preview" : "";
  return `frames_${path.basename(videoFile)}${suffix}`;
}

function entryToLine(entry, videoFile, preview) {
  // entry: [frame, duration] or [frame, duration, videoFileOverride]
  const frame = Number(entry[0]);
  const duration = Number(entry[1]);
  if (!Number.isFinite(frame) || !Number.isFinite(duration) || frame < 1 || duration <= 0) {
    throw new Error(`Invalid sequence entry: ${JSON.stringify(entry)}`);
  }
  const fileForEntry = entry.length >= 3 && entry[2] ? entry[2] : videoFile;
  if (!fileForEntry) throw new Error("Sequence entry is missing its video file");
  return `file '${framesDirFor(fileForEntry, preview)}/${Math.round(frame)}.png'\nduration ${duration}\n`;
}

exports.concat = (sequence, fps, videoFile, audioFile, outFileName, preview, noaudio, play) => {
  const appRoot = path.join(__dirname, "..");
  const date = Date.now();
  const cacheDir = `${appRoot}/cache`;
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  let seqStr = "";
  if (Array.isArray(sequence)) {
    for (const entry of sequence) {
      seqStr += entryToLine(entry, videoFile, preview);
    }
  } else {
    seqStr = sequence;
  }
  const seqPath = `${appRoot}/cache/sequence_${date}.txt`;
  fs.writeFileSync(seqPath, seqStr);

  if (preview) {
    console.log("previewing...");
    if (audioFile && !noaudio) {
      // Pipe ffmpeg output to ffplay. Quoted to prevent shell injection.
      const cmd =
        `ffmpeg -f concat -i ${shellQuote(seqPath)} -i ${shellQuote(audioFile)}` +
        ` -c:v mjpeg -f matroska - | ffplay -`;
      execSync(cmd);
    } else {
      execFileSync("ffplay", ["-f", "concat", "-i", seqPath], { stdio: "inherit" });
    }
    return;
  }

  const filename = outFileName || `sequitur_${date}`;
  const filepath = `${filename}.mov`;

  // NOTE: inputs must precede the output file.
  const encodeArgs = ["-y", "-f", "concat", "-i", seqPath];
  if (audioFile && !noaudio) {
    encodeArgs.push("-i", audioFile);
  }
  encodeArgs.push(
    "-c:v", "prores_ks", "-profile:v", "3",
    "-pix_fmt", "yuv444p10le", "-qscale:v", "8",
    "-vendor", "apl0", "-r", String(fps),
  );
  if (audioFile && !noaudio) {
    encodeArgs.push("-map", "0:v", "-map", "1:a", "-c:a", "pcm_s16le", "-shortest");
  }
  encodeArgs.push(filepath);

  console.log("exporting...");
  execFileSync("ffmpeg", encodeArgs, { stdio: "inherit" });
  console.log("exported");

  if (play) {
    console.log("playing...");
    execFileSync("ffplay", [filepath], { stdio: "inherit" });
  }
};
