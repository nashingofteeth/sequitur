const compareImages = require("resemblejs/compareImages");
const fs = require("mz/fs");

async function getDiff(a, b) {
    const options = {
        // returnEarlyThreshold: 50,
        ignore: "colors"
    };

    // The parameters can be Node Buffers
    // data is the same as usual with an additional getBuffer() function
    const data = await compareImages(
        await fs.readFile("./frames/" + a + ".jpg"),
        await fs.readFile("./frames/" + b + ".jpg"),
        options
    );

    await sortDiffs(data.misMatchPercentage,b)
}

var diffs = {}, diffsInOrder = [], unusedFrames = [], levels = [];

function init(n) {
    // fs.writeFile('outputList.txt', '');

    for (i = 1; i <= n; i++) unusedFrames.push(i);
    fs.readFile('beatsLog.txt',
        function(err, data) {
            if (err) throw err;

            var text = data.toString('utf8');

            var levelsReg = /\d\..*[^\n]/g, levelsArray = text.match(levelsReg);
            for (i = 1; i <= levelsArray.length; i++) levels.push(levelsArray[i]);
    });

    fs.readFile('outputList.txt',
        function(err, data) {
            if (err) throw err;

            var text = data.toString('utf8');

            var reg = /(?<=\/)(.*?)(?=\.)/g, imgNums = text.match(reg);

            for (f in imgNums) {
                var imgNum = imgNums[f];
                // unusedFrames.splice(unusedFrames.indexOf(parseInt(imgNum)), 1);
            }

            //set start point
            if (imgNums) var lastOutput = imgNums[imgNums.length-1].replace(/[^\w\s]/gi, '');
            else var lastOutput = 1;

            getDiffs(1);
    });

}

async function getDiffs(a) {

    console.log(unusedFrames);
    console.log(levels);
    if (!levels.length) console.log('done!');
    else {
        outputFrame(a,diffs[diffsInOrder[Math.floor((unusedFrames.length-1)*(parseFloat(levels[0])/4))]]);
        unusedFrames.splice(unusedFrames.indexOf(parseInt(a)), 1);
        levels.splice(0, 1);
        diffs = {};
        diffsInOrder = [];

        for (i in unusedFrames) {
            await getDiff(a, unusedFrames[i]);
        }
        await getDiffs(diffsInOrder[Math.floor((unusedFrames.length-1)*(parseFloat(levels[0])/4))]);
    }
}

function sortDiffs(a,b) {
    diffs[b] = a;
    // console.log(diffs);
    console.log(b + ' - ' + a);

    //get ETA
    var numOfUnused = unusedFrames.length, total = 0;
    for (loop = 0; loop <= numOfUnused; loop++) {
        for (l=0;l<=loop;l++) total++;
    }
    var hours = (total-unusedFrames.indexOf(b))/3600*0.45;
    // console.log(Math.round(100*hours)/100+" hours remaining");

    var keys = [];
    for (var key in diffs) keys.push(key);
    diffsInOrder = keys.sort(function (c, d) {return diffs[c] - diffs[d];});
}

function outputFrame (a,b) {
    if (b == undefined) b=100;
    // getting duration numbers
    var min = 0.0167, max = 0.125, range = 100; //range is range of input 0-100% difference
    b=min+(b*(max - min)/range);
    //target normal range 0.0416
    // (duration - min)*range/(max - min) = difference

    var output = "file 'frames/" + a  + ".jpg'\n" +
                 "duration " + '0.5' + "\n"; // b
    fs.appendFile('outputList.txt', output, function (err) {
      if (err) throw err;
      console.log('img' + a + ' written!');
    });
}

// fs.writeFile("outputList.txt", "", function(err) { if(err) return console.log(err); });

const dir = './frames';
fs.readdir(dir, (err, files) => {
      init(files.length);
});
