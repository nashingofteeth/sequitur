const fs = require("mz/fs");
var out = '', lengthInMinutes = 1, frameRate=24, frameNum=1, frameKey=0, sequence=false, sequenceStart=1, sequenceLength=0, minSequenceLength=24, maxSequenceLength=72, frames = [];

fs.writeFile('temp/seq.txt', '', function (err) {
  if (err) throw err;
  console.log('written!');
});

function select(numOfFiles) {
    length = (lengthInMinutes*60)*frameRate;

    for(f=1;f<=numOfFiles;f++) frames.push(f);

    exclude = [1,7940];
    excludeLength = parseInt(exclude[1])-parseInt(exclude[0]);
    for (f=0;f<excludeLength;f++) frames.splice(frames.indexOf(exclude[0]+f), 1);

    exclude = [22100,212886];
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

        out += "file 'frames/" + frameNum + ".jpg'\n" +
                     "duration " + (1/frameRate) + "\n";

        frames.splice(frames.indexOf(frameNum), 1);
        console.log(frameNum);
    }
    console.log(numOfFiles);
    output(out);
}

const dir = 'temp/frames/';
fs.readdir(dir, (err, files) => {
      // console.log(files.length);
      select(files.length);
      // init(72);
});

function output(a) {
    // console.log(a);
    fs.appendFileSync('temp/seq.txt', a, function (err) {
      if (err) throw err;
      console.log('written!');
    });
}
