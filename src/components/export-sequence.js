const fs = require("mz/fs"),
      path = require('path'),
      { execSync } = require("child_process");
      
exports.concat = function(seq, res, fps, vid, aud, pre) {
    let seqStr = '';
    if (Array.isArray(seq)) {
        for (f in seq) {
            seqStr += "file 'frames_" + path.basename(vid) + "/" + seq[f][0] + ".bmp'\n" +
                      "duration " + seq[f][1] + "\n";
        }
    }
    else seqStr = seq;

    fs.writeFileSync('data/seq.txt', seqStr);

    let dir = 'exports';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    const preview = "ffmpeg -f concat -i data/seq.txt -vf scale=-1:" + res + " -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mp4",
          full = "ffmpeg -f concat -i data/seq.txt -vf scale=-1:" + res + " -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mov";

    var encodeCmd = pre ? preview : full;

    if (aud) encodeCmd += ' -i ' + aud.replace(' ','\\ ');

    console.log('exporting...');
    execSync(encodeCmd);
    console.log('exported');
}