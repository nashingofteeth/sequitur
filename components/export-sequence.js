const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.concat = (sequence, fps, videoFile, audioFile, outFileName, preview, noaudio) => {
  let encodeCmd = `ffmpeg -f concat -i cache/seq.txt -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le -qscale:v 11 -vendor apl0 -r ${fps}`;

  if (preview) encodeCmd += " -vf scale=-1:240";

  const dir = "exports";
  const filename = outFileName || `sequitur_${Date.now()}`;
  const filepath = `${dir}/${filename}.mov`;
  encodeCmd += ` ${filepath} -y`;

  if (audioFile && !noaudio) encodeCmd += ` -c:a pcm_s16le -i ${audioFile.replace(" ", "\\ ")}`;

  let seqStr = "";
  if (Array.isArray(sequence)) {
    for (f in sequence) {
      seqStr += `file 'frames_${path.basename(videoFile)}/${sequence[f][0]}.png'\nduration ${sequence[f][1]}\n`;
    }
  } else seqStr = sequence;
  fs.writeFileSync("cache/seq.txt", seqStr);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("exporting...");
  execSync(encodeCmd);
  console.log("exported");

  console.log("playing...");
  execSync(`ffplay ${filepath}`);
};
