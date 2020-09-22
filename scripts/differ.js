const compareImages = require("resemblejs/compareImages");
const fs = require("mz/fs");

var timecode = [], diffedFrames = [], minutes = 1000 * 60, hours = minutes * 60, timeLeft = "";

async function getDiff(a, b) {
    const options = {
        // returnEarlyThreshold: 50,
        ignore: "colors"
    };

    // The parameters can be Node Buffers
    // data is the same as usual with an additional getBuffer() function
    const data = await compareImages(
        await fs.readFile("temp/frames/" + a + ".jpg"),
        await fs.readFile("temp/frames/" + b + ".jpg"),
        options
    );
    diffStr = '"' + b + '"' + ':' + '"' + data.misMatchPercentage + '"';
    await diffs.push('"' + b + '"' + ':' + '"' + data.misMatchPercentage + '"');
    // await console.log(a + " - " + diffStr);
}

var diffs = {}, diffsInOrder = [], totalFrames = [], diffs = [], diffSet = '';

function init(n) {
    // fs.writeFile('outputList.txt', '');

    fs.writeFile('temp/diffs.txt', '', function (err) {
      if (err) throw err;
      console.log('INITIATED!');
    });

    timecode.push(new Date().getTime());

    output("[");

    for (i = 1; i <= n; i++) totalFrames.push(i);

    getDiffs(1);

}

async function getDiffs(a) {

    if (parseInt(a) > totalFrames.length) {
        output("]");
        console.log("FINISHED!")
    }

    else {
        // console.log(a);
        diffedFrames.push(a);

        diffs = [];

        for (i in totalFrames) {
            await getDiff(a, totalFrames[i]);
        }
        diffsStr = "{";
        for (i in diffs) diffsStr += diffs[i] + ",";
        diffsStr = diffsStr.substring(0, diffsStr.length - 1) + "},";
        output(diffsStr);

        await getDiffs(a+1);
    }
}

function output(a) {
    timecode.push(new Date().getTime());
    processingTime = timecode[timecode.length-1]-timecode[timecode.length-2];
    diffsPerMilsec = (totalFrames.length / (processingTime));

    framesLeft = totalFrames.length - diffedFrames[diffedFrames.length-1]
    diffsLeft = framesLeft * totalFrames.length;
    milsecsLeft = diffsLeft / diffsPerMilsec;

    percentCompleted = Math.round((diffedFrames[diffedFrames.length-1]/totalFrames.length)*100);

    var s = milsecsLeft / 1000;
    var m = milsecsLeft / minutes;
    var h = milsecsLeft / hours;

    if (h >= 1) timeLeft = Math.round(h) + " hours left";
    else if (m >=1 && h < 1) timeLeft = Math.round(m) + " minutes left";
    else if (m < 1 && h < 1) timeLeft = Math.round(s) + " seconds left";

    if (!isNaN(percentCompleted)) console.log(percentCompleted + "% (" + timeLeft + " @ " + Math.round((diffsPerMilsec*1000)) + " diffs/second)");

    // console.log(a);
    fs.appendFile('temp/diffs.txt', a, function (err) {
      if (err) throw err;
      // console.log('FINISHED!');
    });
}

const dir = 'temp/frames/';
fs.readdir(dir, (err, files) => {
      init(files.length);
      // console.log(files.length);
      // init(72);
});
