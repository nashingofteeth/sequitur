const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.concat = (sequence, fps, videoFile, audioFile, outFileName, preview, noaudio, play) => {
  const appRoot = path.join(__dirname, "..");
  const date = Date.now();

  const framesDirSuffix = preview ? '_preview' : '';
  let seqStr = "";
  if (Array.isArray(sequence)) {
    for (f in sequence) {
      seqStr += `file 'frames_${path.basename(videoFile)}${framesDirSuffix}/${sequence[f][0]}.png'\nduration ${sequence[f][1]}\n`;
    }
  } else seqStr = sequence;
  const seqPath = `${appRoot}/cache/sequence_${date}.txt`;
  fs.writeFileSync(seqPath, seqStr);

  if (preview) {
    let cmd;
    if (audioFile && !noaudio) {
      cmd = `ffmpeg -f concat -i ${seqPath} -i ${audioFile.replace(" ", "\\ ")} -c:v mjpeg -f matroska - | ffplay -`;
    } else {
      cmd = `ffplay -f concat -i ${seqPath}`;
    }
    console.log("previewing...");
    execSync(cmd);
    return;
  }

  let encodeCmd = `ffmpeg -f concat -i ${seqPath} -c:v prores_ks -profile:v 3 -pix_fmt yuv444p10le -qscale:v 8 -vendor apl0 -r ${fps}`;

  const filename = outFileName || `sequitur_${date}`;
  const filepath = `${filename}.mov`;
  encodeCmd += ` ${filepath} -y`;

  if (audioFile && !noaudio) encodeCmd += ` -c:a pcm_s16le -i ${audioFile.replace(" ", "\\ ")}`;

  console.log("exporting...");
  execSync(encodeCmd);
  console.log("exported");

  if (play) {
    console.log("playing...");
    execSync(`ffplay ${filepath}`);
  }
};
