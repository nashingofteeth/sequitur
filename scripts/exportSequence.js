const fs = require("mz/fs"),
      { execSync } = require("child_process");
      
exports.concat = function(seq, res, fps, aud, pre) {
    let seqStr = '';
    for (f in seq) {
        seqStr += "file 'frames/" + (seq[f][0]+1) + ".jpg'\n" +
                  "duration " + seq[f][1] + "\n";
    }
    fs.writeFileSync('temp/seq.txt', seqStr);

    let dir = 'exports';
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mp4 -i " + aud.replace(' ','\\ '),
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mov -i " + aud.replace(' ','\\ ');

    const encodeCmd = pre ? preview : full;

    console.log('exporting...');
    execSync(encodeCmd);
    console.log('exported');
}