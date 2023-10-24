const fs = require("mz/fs"),
	  compareImages = require('resemblejs/compareImages');

exports.diffs = async function (frameCount) {
    const file = 'data/diffs.json';

    if (fs.existsSync(file))
        diffs = JSON.parse(fs.readFileSync(file));
    else {
        diffs = await compareFrames(frameCount);
        fs.writeFileSync(file, JSON.stringify(diffs));
    }

    return diffs;
}

async function compareFrames(frameCount) {
    let diffs = {},
        timecode = [],
        threshold = 100;

    for (a = 1; a <= frameCount; a++) {
        timecode.push(Date.now());
        processingTime = timecode[timecode.length-1]-timecode[timecode.length-2];
        diffsPerSec = (frameCount / (processingTime / 1000));
        diffsLeft = (frameCount - a) * frameCount;
        secsLeft = Math.round(diffsLeft / diffsPerSec);
        timeLeft = secsLeft > 60 ? Math.round(secsLeft / 60) + 'm' : secsLeft + 's';
        progress = Math.round((a/frameCount)*100);

        message = (a < 2 || a > frameCount-1) ? 'comparing frames...' : 'comparing frames - ' + progress + '%, ' + timeLeft + ' left @ ' + Math.round(diffsPerSec) + '/s';
        console.clear();
        console.log(message);
        
        diffs[a] = {};
        max = 0;
        for (b = 1; b <= frameCount; b++) {
            if ( b == a ) diff = 0;
			else if ( b == a-1 ) diff = diffs[a-1][b+1];
            else diff = await getDiff(a, b, threshold);

            diffs[a][b] = parseFloat(diff);
            max = diff > max ? diff : max;;
        }

        threshold = Math.ceil(max)+5;
    }

    console.clear();
    return diffs;
}

async function getDiff(a, b, t) {
    const options = {
        returnEarlyThreshold: t,
        ignore: "colors"
    };

    const data = await compareImages(
        await fs.readFile("data/frames/" + a + ".bmp"),
        await fs.readFile("data/frames/" + b + ".bmp"),
        options
    );

    return parseFloat(data.misMatchPercentage);
}