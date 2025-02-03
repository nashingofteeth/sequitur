const fs = require("mz/fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const seq = require("../sequitur");

exports.concat = (sequence, res, fps, vid, aud, out) => {
  let seqStr = "";
  const dir = "exports";
  const filename = out || `sequitur_${Date.now()}`;
  const filepath = `${dir}/${filename}.mov`;
  let encodeCmd = `ffmpeg -f concat -i cache/seq.txt -vf scale=-1:${res} -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le -qscale:v 11 -vendor apl0 -r ${fps} ${filepath}`;

  const useAud = !seq.args?.noaudio ?? true;
  if (aud && useAud) encodeCmd += ` -c:a pcm_s16le -i ${aud.replace(" ", "\\ ")}`;

  if (Array.isArray(sequence)) {
    for (f in sequence) {
      seqStr += `file 'frames_${path.basename(vid)}/${sequence[f][0]}.jpg'\nduration ${sequence[f][1]}\n`;
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
