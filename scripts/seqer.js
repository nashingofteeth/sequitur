const fs = require("mz/fs");
const { exec } = require("child_process");

isFinalRender = false;

previewResolution = 240;
finalResolution = 720;
exportFPS = 60; 
const previewFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+previewResolution+" -qscale:v 2 temp/frames/%d.jpg",
      finalFrames = "ffmpeg -i input/video.mov -vf scale=-1:"+finalResolution+" -qscale:v 2 temp/frames/%d.jpg";


var out = '', obj = [], diffs = [], unsortedDiffs = [], usedKeys = [], fpsTally = [], levels = [], frameTally = [], sortedLevels = [],
    previousDiff = 100,  frameCounter = 0, totalDuration = 0, previousK = 0, k = 0,
    frameRate = 30, programFrameRate = 240, duration = 1/frameRate, skipLevels = Math.round(duration/(1/programFrameRate)),
    frameRates = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 20, 24, 30, 40, 48, 60], // divisors of 240
    durationMin = frameRates.indexOf(frameRate), frameRatesWeighted = 7,
    offsetLengthRatio = 0.001374085826124; // offset at end of video (240fps)/levelsArray.length


function sort() {

// INITALIZE MISC VARIABLES
    k = Math.floor((Math.random() * (obj.length-1)) + 0);
    // k = 200;
    firstFrame = k;

    sortedLevels.sort(function(a, b){return b-a});
    var levelsMax = sortedLevels[0];
    var boost = 1/levelsMax;

    for (i=0; i<frameRatesWeighted; i++) frameRates.push(frameRates[frameRates.length-1]);
    var durationMax = frameRates.length-1;

    for (i in obj) frameTally.push([i, 0, 0]);
    for (f in frameRates) fpsTally.push([frameRates[f], 0]);

// SEQUENCING
    for (l=0;l<levels.length;l++) {

// OUTPUT FRAME
        frameCounter++;
        var progress = l/levels.length;
        volIndicator = "";
        for (i=0;i<Math.round(currentLevel*100);i++) volIndicator = volIndicator+"|";

        console.clear();
        console.log("SEQUENCING / " + Math.round(progress*100)+"%"+" - "+(k+1)+".jpg, "+frameRate+"fps "+volIndicator);

        out += "file 'frames/" + (k+1) + ".jpg'\n" +
                     "duration " + duration + "\n";

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

        var currentLevel = parseFloat(levels[l])*boost;
        var nextLevel = parseFloat(levels[l+skipLevels])*boost;
        var previousLevel = parseFloat(levels[l-skipLevels])*boost;

        if (currentLevel > 1) currentLevel = 1;
        if (currentLevel == 0) currentLevel = 1/(poolSize-1);

// PARAMETERS
        if (levels.length > obj.length) {
            useMax = Math.ceil(((levels.length/skipLevels)/obj.length)*1);
            reuseSpacing = levels.length/Math.ceil(((levels.length/skipLevels)/obj.length))/2;
        }
        else {
            useMax = 1;
            reuseSpacing = levels.length;
        }
        useMax = levels.length; //number of loops
        reuseSpacing = 1; //length of loops

        diffRangeMax = 1.0;
        diffRangeMin = 0.3;
        diffRange = diffRangeMin+(((diffRangeMax-diffRangeMin)*(previousLevel)));
        // diffRange = diffRangeMin+((diffRangeMax-diffRangeMin)*(((levels.length/2)-Math.abs((levels.length/2)-l))/(levels.length/2))); // the higher the distance from center, the lower the percentage
        // diffRange=0.9;
        var diffIndex = Math.floor(((poolSize-1)*diffRange)*currentLevel); // .toFixed(1)

        changeThresholdMax = 0.0;
        changeThresholdMin = 0.01;
        changeThreshold = changeThresholdMin+(((changeThresholdMax-changeThresholdMin)*(previousLevel)));
        changeThreshold = -1;

        skipMax = 1;
        skipMin = 1;
        skipFrames = Math.round(skipMin+(((skipMax-skipMin)*currentLevel)));

        maxPlayAroundRange = poolSize;
        minPlayAroundRange = reuseSpacing*2;
        // minPlayAroundRange = poolSize;

        playAroundRange = Math.round(minPlayAroundRange+(((maxPlayAroundRange-minPlayAroundRange)*currentLevel)));
        // playAroundRange = 200;

        maxAhead = Math.round((obj.length-1)*(l/levels.length)) + Math.round(playAroundRange/2);
        maxBehind = Math.round((obj.length-1)*(l/levels.length)) - Math.round(playAroundRange/2);

        if (currentLevel < 0.3) { // 0.0015
            maxAhead = poolSize;
            maxBehind = 0;
        }
// FIND NEXT FRAME
        simFrameKey = 0;
        tooFar=false;
        function findNextUnusedFrame(a,b) {
            if (currentLevel-previousLevel > changeThreshold) { // || currentLevel > 0.7

                if (diffs[b] != undefined) var nextFrame = diffs[b][0]-1;
                else {
                    console.log('\nINVALID FRAME!!! EXITING...\n');
                    process.exit();
                }

                if (tooFar) b--;
                else b++;

                if (b>poolSize-2) tooFar=true;

            }
            else {
                var nextChrono = a+skipFrames;

                var lastFrame = parseInt(Object.keys(objValues)[Object.keys(objValues).length-2]);
                var overflow = nextChrono-lastFrame;
                if (nextChrono >= lastFrame) nextChrono = parseInt(Object.keys(objValues)[overflow])-1;

                var nextSim = diffs[simFrameKey][0]-1;

                if (unsortedDiffs[nextChrono][1] - previousDiff[1] > 10) {
                    nextFrame = nextSim;
                    simFrameKey++;

                    console.log('SOFTENED CUT!');
                }
                else {
                    nextFrame = nextChrono;
                    a++;
                }
            }

            if (
                (frameTally[nextFrame][2] == 0 || l-frameTally[nextFrame][2] > reuseSpacing)
                && frameTally[nextFrame][1] < useMax
                && (nextFrame > maxBehind && nextFrame < maxAhead) // cannot be enabled with useMax = levels.length
            )
                nextUnusedFrame = nextFrame;

            else findNextUnusedFrame(a,b);
        }

        // randomLevel = Math.floor(((poolSize-1)*diffRange)*((Math.floor(Math.random() * 10000) + 0)/10000));
        
        findNextUnusedFrame(k,diffIndex);
        k = nextUnusedFrame;

// LOGGING FRAME
        previousDiff = unsortedDiffs[k];
        previousK = k;

        frameTally[k][1] = frameTally[k][1]+1;
        frameTally[k][2] = l;

        fpsTally[frameRates.indexOf(frameRate)][1] = fpsTally[frameRates.indexOf(frameRate)][1]+1;

        totalDuration = totalDuration+duration;

// SET FRAME RATE
        frameRateIndex=Math.round(durationMin+((durationMax-durationMin)*currentLevel));
        frameRate = frameRates[frameRateIndex];
        // if (currentLevel > 0.15) frameRate = 60;
        duration = 1/frameRate, skipLevels = Math.round(duration/(1/programFrameRate));
        l=l+(skipLevels-1);

// RESET VARIABLES
        diffs = [];
        unsortedDiffs = [];

// STOP SEQUENCE EARLY
        // if (frameCounter>440) l = levels.length;
    }
// SEND OUTPUT AND CONSOLE MESSAGES
    console.clear();
    console.log('A PATH HAS BEEN FOUND\n');

    numberOfFramesUsed = 0;
    for (i in frameTally)
        if (frameTally[i][1] != 0)
            numberOfFramesUsed++;

    console.log("source audio frames: " + levels.length);
    console.log("source video frames: " + obj.length + "\n");
    console.log("video frames used: " + ((numberOfFramesUsed/obj.length)*100).toFixed(2) + "%\n");


    console.log("first frame: " + (firstFrame+1) + ".jpg");
    console.log("last frame: " + (k+1) + ".jpg\n");
    
    console.log("length: "+Math.round(totalDuration)+" seconds, "+frameCounter+" frames\n");

    console.log("FPS distribution:");
    for (t in fpsTally)
        if (fpsTally[t][1] > 0)
            console.log(fpsTally[t][0]+" - "+((fpsTally[t][1]/frameCounter)*100).toFixed(2)+"%");
    console.log("\n");

    outputEncode(out);
}

// fs.writeFile('temp/diffs.txt', '');

// INITIALIZING
fs.stat('scripts/seqer_versions/seqer_xxxxxxxxxxxx.js', function(err, stat) {
    if(err == null) {
        // file exists
        console.log('INITIALIZING...\n');
        exec('rm -r temp/frames/ exports/ temp/diffs.txt temp/seq.txt temp/wave.txt temp/seq_versions/seq_xxxxxxxxxxxx.txt scripts/seqer_versions/seqer_xxxxxxxxxxxx.js;' +
             'mkdir temp/frames temp/seq_versions exports scripts/seqer_versions' +
             'touch temp/diffs.txt temp/seq.txt temp/wave.txt;');

        console.log('CREATING PREVIEW FRAMES...');
        exec(previewFrames);
        
        console.log('FINISHED\n')
    } else {
        // file does not exist
        console.log('INITIALIZED');
        wave();
    }
});



function outputEncode(a) {
    fs.writeFile('temp/seq.txt', a, function (err) {
      if (err) throw err;
    });

    let current = new Date();
    let cYear = current.getFullYear();
    let cMonth = ('0'+(current.getMonth() + 1)).slice(-2);
    let cDay = ('0'+current.getDate()).slice(-2);
    let cHour = ('0'+current.getHours()).slice(-2);
    let cMinute = ('0'+current.getMinutes()).slice(-2);
    let cSecond = ('0'+current.getSeconds()).slice(-2);
    let cDate = cYear + '' + cMonth + '' + cDay;
    let cTime = cHour + '' + cMinute + '' + cSecond;
    let dateTime = cDate + '' + cTime;

    const previewRender = "ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf scale=-"+previewResolution+" -vcodec libx264 -crf 5 -r "+exportFPS+" -pix_fmt yuv420p exports/invocation_"+dateTime+".mp4 -y",
          finalRender = "ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf subtitles=input/text.ass,scale=-1:"+finalResolution+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r "+exportFPS+" exports/invocation_"+dateTime+".mov -y";
    
    setTimeout(function () {
        exec("cp scripts/seqer.js scripts/seqer_versions/seqer_"+dateTime+".js; cp temp/seq.txt temp/seq_versions/seq_"+dateTime+".txt");
    }, 100);

    if (isFinalRender == true) {
        renderType = finalRender;
        console.log('CREATING FINAL FRAMES...');
        exec(finalFrames);
        console.log('FINISHED\n')
    }
    else renderType = previewRender;

    // console.log('ENCODING...');
    // exec(renderType, (error, stdout, stderr) => {
    //     if (error) {
    //         console.log(`error: ${error.message}`);
    //         return;
    //     }
    //     if (stderr) {
    //         console.log(`stderr: ${stderr}`);
    //         return;
    //     }
    //     // console.log(`stdout: ${stdout}`);
    // });

    exec("afplay /System/Library/PrivateFrameworks/ScreenReader.framework/Versions/A/Resources/Sounds/DrillOut.aiff");
}


function wave() {
    fs.readFile('temp/wave.txt',
        function(err, data) {
            if (err || data.toString('utf8') == '') {
                exec('touch temp/wave.txt');

// WAVE.JS -------------------------------------------------------------------------------------------------
var AudioContext = require('web-audio-api').AudioContext
context = new AudioContext;
var _ = require('underscore');

var pcmdata = [] ;

//Note: I have no rights to these sound files and they are not created by me.
//You may downlaod and use your own sound file to further test this.
//
var soundfile = "input/music.mp3"
decodeSoundFile(soundfile);

/**
 * [decodeSoundFile Use web-audio-api to convert audio file to a buffer of pcm data]
 * @return {[type]} [description]
 */
function decodeSoundFile(soundfile){
  // console.log("decoding mp3 file ", soundfile, " ..... ")
  fs.readFile(soundfile, function(err, buf) {
    if (err) throw err
    context.decodeAudioData(buf, function(audioBuffer) {
      // console.log(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate, audioBuffer.duration);
      pcmdata = (audioBuffer.getChannelData(0)) ;
      samplerate = audioBuffer.sampleRate;
      maxvals = [] ; max = 0 ;
      // playsound(soundfile)
      findPeaks(pcmdata, samplerate)
    }, function(err) { throw err })
  })
}


/**
 * [findPeaks Naive algo to identify peaks in the audio data, and wave]
 * @param  {[type]} pcmdata    [description]
 * @param  {[type]} samplerate [description]
 * @return {[type]}            [description]
 */
function findPeaks(pcmdata, samplerate){
  var interval = (1/programFrameRate) * 1000 ; index = 0 ;
  // 120fps = 0.00834, 60fps = 0.01668, 24fps = 0.0417
  var step = Math.round( samplerate * (interval/1000) );
  var max = 0 ;
  var prevmax = 0 ;
  var prevdiffthreshold = 0.3 ;

  //loop through song in time with sample rate
  var samplesound = setInterval(function() {
    if (index >= pcmdata.length) {
      clearInterval(samplesound);
      // console.log("finished sampling sound")
      
        setTimeout(function () {
            openWave();
        }, 100);
      openWave();
      return;
    }

    for(var i = index; i < index + step ; i++){
      max = pcmdata[i] > max ? pcmdata[i].toFixed(4)  : max ;
    }

    // Spot a significant increase? Potential peak
    bars = getbars(max) ;
    if(max-prevmax >= prevdiffthreshold){
      // bars = bars + " == peak == "
    }

    // Print out mini equalizer on commandline
    console.clear();
    console.log("ANALYZING AUDIO / " + bars, max );
    fs.appendFileSync('temp/wave.txt', String(max+"\n"), function (err) {
      if (err) throw err;
    });
    prevmax = max ; max = 0 ; index += step ;
  }, interval,pcmdata);
}

function getbars(val){
  bars = ""
  for (var i = 0 ; i < val*50 + 2 ; i++){
    bars= bars + "|";
  }
  return bars ;
}


// END WAVE.JS ----------------------------------------------------------------------------------------------
            }
            else openWave();
        }
    );
}

function diff() {
    fs.readFile('temp/diffs.txt',
        function(err, data) {
            if (err || data.toString('utf8') == '') {
                exec('touch temp/diffs.txt');
// DIFFER.JS -----------------------------------------------------------------------------------------------
const compareImages = require("resemblejs/compareImages");

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
      // console.log('INITIATED!');
    });

    timecode.push(new Date().getTime());

    output("[");

    for (i = 1; i <= n; i++) totalFrames.push(i);

    getDiffs(1);

}

async function getDiffs(a) {

    if (parseInt(a) > totalFrames.length) {
        output("]");
        // console.log("FINISHED!");
        setTimeout(function () {
            openDiffs();
        }, 100);
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

    if (!isNaN(percentCompleted)) {
        console.clear();
        console.log("COMPARING FRAMES / " + percentCompleted + "% - " + timeLeft + " @ " + Math.round((diffsPerMilsec*1000)) + " diffs/second");
    }

    // console.log(a);
    fs.appendFile('temp/diffs.txt', a, function (err) {
      if (err) throw err;
    });
}

const dir = 'temp/frames/';
fs.readdir(dir, (err, files) => {
      init(files.length);
      // console.log(files.length);
      // init(20);
});
// END DIFFER.JS -------------------------------------------------------------------------------------------
            }
            else openDiffs();
        }
    );
}

function openWave() {
    fs.readFile('temp/wave.txt',
        function(err, data) {
            if (err) throw err;

            var text = data.toString('utf8');

            // var levelsReg = /(?<=\ ).*/g, levelsArray = text.match(levelsReg);
            levelsArray = text.split('\n');

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
            // console.log(levels);
            diff();
        }
    );
}

function openDiffs() {
    fs.readFile('temp/diffs.txt',
        function(err, data) {
            if (err) throw err;

            var text = data.toString('utf8');
            text = text.substring(0, text.length - 2) + "]";
            var json = JSON.parse(text);
            for (i in json) obj.push(json[i]);

            setTimeout(function () {
                sort();
            }, 500);
        }
    );
}