const fs = require("mz/fs");
const { exec } = require("child_process");

exec('mkdir temp/cframes; ffmpeg -i input/clips.mov -qscale:v 2 temp/cframes/%d.jpg;', (error, stdout, stderr) => {
    const dir = 'temp/cframes/';
    fs.readdir(dir, (err, files) => {
          // console.log(files.length);
          select(files.length);
          // init(72);
    });
});

var out = '', lengthInSecs = 10, frameRate=30, frameNum=1, frameKey=0, sequence=false, sequenceStart=1, sequenceLength=0, minSequenceLength=30, maxSequenceLength=90, frames = [];

fs.writeFile('temp/seq.txt', '', function (err) {
  if (err) throw err;
  console.log('init!');
});

function select(numOfFiles) {
    length = (lengthInSecs)*frameRate;

    for(f=1;f<=numOfFiles;f++) frames.push(f);

    exclude = [0,0];
    excludeLength = parseInt(exclude[1])-parseInt(exclude[0]);
    for (f=0;f<excludeLength;f++) frames.splice(frames.indexOf(exclude[0]+f), 1);

    // console.log(frames);

    for (f=0;f<length;f++) {
        // var progress = f/length;
        // console.log(Math.round(progress*100)+"%");

        if (f > sequenceStart+sequenceLength) sequence = false;

        if (sequence == true &&
            frameNum < numOfFiles &&
            frames.indexOf(frameNum+1) != -1) frameNum++;
        else {
            frameKey = Math.floor((Math.random() * frames.length-1) + 1);
            frameNum = frames[frameKey];
            sequenceStart = f;
            sequenceLength = Math.floor((Math.random() * maxSequenceLength) + minSequenceLength);
            sequence = true;
        }

        out += "file 'cframes/" + frameNum + ".jpg'\n" +
                     "duration " + (1/frameRate) + "\n";

        frames.splice(frames.indexOf(frameNum), 1);
        console.log(frameNum);
    }
    console.log(numOfFiles);
    output(out);
}

function output(a) {
    // console.log(a);
    fs.writeFile('temp/seq.txt', a, function (err) {
        if (err) throw err;
        console.log('written!');
        exec('ffmpeg -f concat -i temp/seq.txt -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r '+frameRate+' input/video0.mov -y;', (error, stdout, stderr) => {
            console.log('encoded!');
        });
        console
    });
}

