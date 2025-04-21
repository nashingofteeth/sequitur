const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.concat = (sequence, fps, videoFile, audioFile, outFileName, preview, noaudio, play) => {
  const appRoot = path.join(__dirname, "..");
  const date = Date.now();

  let encodeCmd = `ffmpeg -f concat -i ${appRoot}/cache/sequence_${date}.txt -c:v prores_ks -profile:v 3 -pix_fmt yuv444p10le -qscale:v 8 -vendor apl0 -r ${fps}`;

  if (preview) encodeCmd += " -vf scale=-1:240";

  const filename = outFileName || `sequitur_${date}`;
  const filepath = `${filename}.mov`;
  encodeCmd += ` ${filepath} -y`;

  if (audioFile && !noaudio) encodeCmd += ` -c:a pcm_s16le -i ${audioFile.replace(" ", "\\ ")}`;

  let seqStr = "";
  if (Array.isArray(sequence)) {
    for (f in sequence) {
      seqStr += `file 'frames_${path.basename(videoFile)}/${sequence[f][0]}.png'\nduration ${sequence[f][1]}\n`;
    }
  } else seqStr = sequence;
  fs.writeFileSync(`${appRoot}/cache/sequence_${date}.txt`, seqStr);

  console.log("exporting...");
  execSync(encodeCmd);
  console.log("exported");

  if (play) {
    console.log("playing...");
    execSync(`ffplay ${filepath}`);
  }
};
