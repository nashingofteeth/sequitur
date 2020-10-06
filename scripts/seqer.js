const fs = require("mz/fs");
var out = '', obj = [], diffs = [], unsortedDiffs = [], usedKeys = [], levels = [], useTally = [], sortedLevels = [],
    previousDiff = 100, previousK = 0, frameCounter = 0, k = 0,
    defaultFrameRate = 60, sampleRate = 1/defaultFrameRate, skipLevels = Math.round(sampleRate/(1/120));

fs.writeFile('temp/seq.txt', '', function (err) {
  if (err) throw err;
  console.log('initiated!');
});

var offsetLengthRatio = 0.00111; // offset frames (120fps)/levelsArray.length (recorded numbers: 0.0012169221055048506, 0.0011149706248123848)

fs.readFile('temp/wave.txt',
    function(err, data) {
        if (err) throw err;

        var text = data.toString('utf8');

        var levelsReg = /(?<=\ ).*/g, levelsArray = text.match(levelsReg);

        var offset = Math.round(offsetLengthRatio*levelsArray.length);
        var offsetInterval = Math.round(levelsArray.length/offset);
        var offsetLocation = offsetInterval;

        // sync drift correction
        for (i in levelsArray) {
            levels.push(levelsArray[i]);
            sortedLevels.push(levelsArray[i]);

            if (i == offsetLocation) {
                levels.push(levelsArray[i]);
                offsetLocation = offsetLocation+offsetInterval;
            }
        }
});

fs.readFile('temp/diffs.txt',
    function(err, data) {
        if (err) throw err;

        var text = data.toString('utf8');
        text = text.substring(0, text.length - 2) + "]";
        var json = JSON.parse(text);
        for (i in json) obj.push(json[i]);

        setTimeout(function () {
            sort();
        }, 100);
});

function sort() {

// INITALIZED MISC VARIABLES
    // k = Math.floor((Math.random() * (obj.length-1)) + 0);

    sortedLevels.sort(function(a, b){return b-a});
    var levelsMax = sortedLevels[0];
    var boost = 1/levelsMax;

    for (i in obj) useTally.push([i, 0, 0]);

// SEQUENCING
    for (l=0;l<levels.length;l++) {

// OUTPUT FRAME
        frameCounter++;
        var progress = l/levels.length;
        console.log(Math.round(progress*100)+"%"+" ("+Math.round(frameCounter/defaultFrameRate)+"s, "+frameCounter+"f, "+sampleRate.toFixed(4)+"d)");

        out += "file 'frames/" + (k+1) + ".jpg'\n" +
                     "duration " + sampleRate + "\n";

         // k = Math.round((obj.length-1)*(l/levels.length));
         //
         // out += "file 'frames/" + (k+1) + ".jpg'\n" +
         //              "duration " + 0.03332 + "\n";  // d

// LOAD VALUES
        var objValues = obj[k];
        var poolSize = Object.keys(objValues).length;

        for (i in objValues) diffs.push([i, objValues[i]]);
        diffs.sort(function(a, b){return a[1]-b[1]});

        for (i in objValues) unsortedDiffs.push([i, objValues[i]]);

        var currentLevel = parseFloat(levels[l]);
        var nextLevel = parseFloat(levels[l+skipLevels]);
        var previousLevel = parseFloat(levels[l-skipLevels]);

        if (currentLevel > 1) currentLevel = 1;
        if (currentLevel == 0) currentLevel = 1/(poolSize-1);

// PARAMETERS
        if (levels.length > obj.length) {
            useMax = Math.ceil(((levels.length/skipLevels)/obj.length)*1.2);
            reuseSpacing = levels.length/Math.ceil(((levels.length/skipLevels)/obj.length));
        }
        else {
            useMax = 1;
            reuseSpacing = levels.length;
        }
        // useMax = levels.length; //number of loops
        reuseSpacing = 20; //length of loops

        diffRangeMax = 1.7;
        diffRangeMin = 0.0;
        diffRange = diffRangeMin+(((diffRangeMax-diffRangeMin)*(previousLevel)));
        // diffRange = diffRangeMin+((diffRangeMax-diffRangeMin)*(((levels.length/2)-Math.abs((levels.length/2)-l))/(levels.length/2))); // the higher the distance from center, the lower the percentage
        // diffRange=1;
        var diffIndex = Math.floor(((poolSize-1)*diffRange)*((currentLevel*boost).toFixed(1))); // .toFixed(1)

        changeThresholdMax = 0.0;
        changeThresholdMin = 0.01;
        changeThreshold = changeThresholdMin+(((changeThresholdMax-changeThresholdMin)*(previousLevel)));
        changeThreshold = -1;

        skipMax = 1;
        skipMin = 1;
        skipFrames = Math.round(skipMin+(((skipMax-skipMin)*(currentLevel*boost))));

        maxPlayAroundRange = poolSize;
        minPlayAroundRange = reuseSpacing*2;
        // minPlayAroundRange = poolSize;

        playAroundRange = Math.round(minPlayAroundRange+(((maxPlayAroundRange-minPlayAroundRange)*(currentLevel*boost))));
        // playAroundRange = 200;

        maxAhead = Math.round((obj.length-1)*(l/levels.length)) + Math.round(playAroundRange/2);
        maxBehind = Math.round((obj.length-1)*(l/levels.length)) - Math.round(playAroundRange/2);

// FIND NEXT FRAME
        simFrameKey = 0;
        tooFarAhead=false;
        function findNextUnusedFrame(a,b) {
            if (currentLevel-previousLevel > changeThreshold) { // || currentLevel > 0.7
                var nextFrame = diffs[b][0]-1;
                sampleRate = 1/defaultFrameRate;

                if (tooFarAhead) b--;
                else b++;

                if (b>poolSize-2) tooFarAhead=true;

                // console.log('NUD!!!!!!!!!!');
            }
            else {
                var nextChrono = a+skipFrames;

                var lastFrame = parseInt(Object.keys(objValues)[Object.keys(objValues).length-2]);
                var overflow = nextChrono-lastFrame;
                if (nextChrono >= lastFrame) nextChrono = parseInt(Object.keys(objValues)[overflow])-1;

                var nextSim = diffs[simFrameKey][0]-1;

                if (unsortedDiffs[nextChrono][1] - previousDiff[1] > 80) {
                    nextFrame = nextSim;
                    simFrameKey++;

                    // console.log('CUT!');
                }
                else {
                    nextFrame = nextChrono;
                    a++;
                }
            }

            if (
                (useTally[nextFrame][2] == 0 || l-useTally[nextFrame][2] > reuseSpacing)
                && useTally[nextFrame][1] < useMax
                // && (nextFrame > maxBehind && nextFrame < maxAhead)
            )
                nextUnusedFrame = nextFrame;

            else findNextUnusedFrame(a,b);
        }
        randomLevel = Math.floor(((poolSize-1)*diffRange)*((Math.floor(Math.random() * 10000) + 0)/10000));
        findNextUnusedFrame(k,diffIndex); //diffIndex
        k = nextUnusedFrame;

        // if (k-1 == previousK) {
        //     k = Math.round(obj.length*(l/levels.length));
        //     console.log('synced');
        // }

// LOGGING FRAME
        previousDiff = unsortedDiffs[k];
        previousK = k;

        useTally[k][1] = useTally[k][1]+1;
        useTally[k][2] = l;

// SET FRAME RATE

        // if (currentLevel > 0.15) sampleRate = 1/60;

        frameRates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60, 60, 60, 60, 60];
        var sampleRateMin = 11, sampleRateMax = frameRates.length-1; // values are indexes no frame rates!
        frameRateIndex=Math.round(sampleRateMin+((sampleRateMax-sampleRateMin)*(currentLevel*boost)));
        sampleRate = 1/parseInt(frameRates[frameRateIndex]);
        skipLevels = Math.round(sampleRate/(1/120));
        l=l+(skipLevels-1);

// RESET VARIABLES
        diffs = [];
        unsortedDiffs = [];

// STOP SEQUENCE EARLY
        // if (frameCounter>440) l = levels.length;
    }
// OUTPUT SEQUENCE AND INFO
    console.log(useTally);
    console.log(levels.length);
    output(out);
}

function output(a) {
    fs.appendFileSync('temp/seq.txt', a, function (err) {
      if (err) throw err;
      console.log('finished!');
    });
}
