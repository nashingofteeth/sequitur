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
    diffStr = '"' + b + '"' + ':' + '"' + data.misMatchPercentage + '"';
    await diffs.push('"' + b + '"' + ':' + '"' + data.misMatchPercentage + '"');
    await console.log(a + " - " + diffStr);
}

var diffs = {}, diffsInOrder = [], totalFrames = [], diffs = [], diffSet = '';

function init(n) {
    // fs.writeFile('outputList.txt', '');

    for (i = 1; i <= n; i++) totalFrames.push(i);

    getDiffs(1);

}

async function getDiffs(a) {

    if (parseInt(a) > totalFrames.length) output("[" + diffSet.substring(0, diffSet.length - 1) + "]");
    else {
        console.log(a);

        diffs = [];

        for (i in totalFrames) {
            await getDiff(a, totalFrames[i]);
        }
        diffsStr = "{";
        for (i in diffs) diffsStr += diffs[i] + ",";
        diffsStr = diffsStr.substring(0, diffsStr.length - 1) + "},";
        diffSet += diffsStr;

        await getDiffs(a+1);
    }
}

function output(a) {
    console.log(a);
    fs.writeFile('comparisons_old2.txt', a, function (err) {
      if (err) throw err;
      console.log('written!');
    });
}

const dir = './frames/';
fs.readdir(dir, (err, files) => {
      // init(files.length);
      console.log(files.length);
      init(12);
});
