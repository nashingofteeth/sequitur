const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

exports.concat = (seq, res, fps, vid, aud) => {
  let seqStr = "";
  const dir = "exports";
  const filepath = `${dir}/sequitur_${Date.now()}.mov`;
  let encodeCmd = `ffmpeg -f concat -i data/seq.txt -vf scale=-1:${res} -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le -qscale:v 11 -vendor apl0 -r ${fps} ${filepath}`;

  if (aud) encodeCmd += ` -c:a pcm_s16le -i ${aud.replace(" ", "\\ ")}`;

  if (Array.isArray(seq)) {
    for (f in seq) {
      seqStr += `file 'frames_${path.basename(vid)}/${seq[f][0]}.bmp'\nduration ${seq[f][1]}\n`;
    }
  } else seqStr = seq;
  fs.writeFileSync("data/seq.txt", seqStr);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  console.log("exporting...");
  execSync(encodeCmd);
  console.log("exported");

  // console.log("playing...");
  // execSync(`ffplay ${filepath}`);
};
