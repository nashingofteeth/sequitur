const fs = require("mz/fs"),
      path = require('path'),
      { exec } = require("child_process");

console.clear();

const validArgs = ['vid', 'aud', 'res', 'fps', 'pre', 'max', 'min', 'init'];
let args = {}
for ( a in validArgs) {
    const index = process.argv.indexOf('--' + validArgs[a]);
    let value;
    if (index > -1) {
        value = process.argv[index + 1];
        args[validArgs[a]] = (value || true);
    }
    else args[validArgs[a]] = false;
}

const videoFile = ( args['vid'] && fs.existsSync(args['vid']) ) ? args['vid'] : false,
      audioFile = ( args['aud'] && fs.existsSync(args['aud']) ) ? args['aud'] : false,
      resolution = parseInt(args['res']),
      framerate = args['fps'] ? parseInt(args['fps']) : 24,
      preview = args['pre'],
      maxLevel = parseFloat(args['max']),
      minOffset = parseFloat(args['min']),
      initalize = args['init'];

async function init() {
    const numOfFrames = await countFrames();
    const waveform = await loadWaveform();

    // require some args
    if ( !resolution || !framerate || !videoFile || !audioFile ) console.log('missing/invalid args!');
    // extract frames and record waveform if none
    else if ( !waveform || !numOfFrames || initalize ) {
        let dir = 'temp';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        await extractFrames(videoFile, resolution);
        analyzeAudio(audioFile, framerate);
    }
    // sequence and encode
    else {
        const seq = sequence(numOfFrames, waveform, framerate, maxLevel, minOffset);
        const written = await write(seq);
        await encode(written, resolution, framerate, audioFile, preview);
    }
}

function countFrames() {
    return new Promise(function(resolve, reject) {
        fs.readdir('temp/frames/', (err, files) => {
            if (!files || files.length < 2 || err) resolve(false);
            else {
                const frames = files.filter(el => path.extname(el) === '.jpg');
                resolve(frames.length);
            }
        });
    });
}

// separate video into individual frames
function extractFrames(file, res) {
    let dir = 'temp/frames/';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const extractCmd = "ffmpeg -i " + file.replace(' ','\\ ') + " -vf scale=-1:" + res + " -qscale:v 2 temp/frames/%d.jpg -y";

    console.log('extracting frames...');
    return new Promise(function(resolve, reject) {
        exec(extractCmd, (err, stdout, stderr) => {
            if (err) reject(err);
            // console.log(error, stdout, stderr);
            console.log('frames extracted');
            resolve(true);
        });
    });
}

// create random sequence from frames
function sequence(numOfFrames, waveform, fps, max, min) {
    let frames = [],
        selectedFrame = Math.floor(numOfFrames * Math.random()),
        frameDuration = 1/fps,
        reverse = false;

    for (let i = 0; i < (waveform.length-1); i++) {
        let level = waveform[i],
            maxLevel = max || 1,
            minOffset = min || 0,
            maxOffset = Math.round(numOfFrames * (level * maxLevel));
        offset = maxOffset < minOffset ? 1 : maxOffset;

        if ( selectedFrame + offset > numOfFrames-1 ) reverse = true;
        else if ( selectedFrame - offset < 0 ) reverse = false;

        if (reverse) selectedFrame = selectedFrame - offset;
        else selectedFrame = selectedFrame + offset

        if ( selectedFrame > numOfFrames-1 || selectedFrame < 0 ) {
            console.log('off the rails!');
            process.exit();
        }
        
        frames.push([selectedFrame, frameDuration]);
    }

    let seq = '';
    for (f in frames) {
        seq += "file 'frames/" + (frames[f][0]+1) + ".jpg'\n" +
               "duration " + frames[f][1] + "\n";
    }

    console.log('sequenced');
    return seq;
}

// write sequence to file
function write(seq) {
    return new Promise(function(resolve, reject){
        fs.writeFile('temp/seq.txt', seq, function (err) {
            if (err) reject(err);
            console.log('written');
            resolve(true);
        });
    })
}

// encode sequence
function encode(written, res, fps, aud, pre) {
    if (!written) process.exit();

    let dir = 'exports';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mp4 -i " + aud.replace(' ','\\ '),
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:" + res + " -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r " + fps + " exports/sequitur_" + Date.now() + ".mov -i " + aud.replace(' ','\\ ');

    const encodeCmd = pre ? preview : full;

    console.log('encoding...');
    return new Promise(function(resolve, reject){
        exec(encodeCmd, (err, stdout, stderr) => {
            // console.log(stdout, stderr);
            if (err) reject(err);
            console.log('encoded');
            resolve(true);
        });
    })
}


function loadWaveform() {
    return new Promise(function(resolve, reject) {
        fs.readFile('temp/wave.txt', function(err, data) {
            if (err) resolve(false);
            else {
                let text = data.toString('utf8');
                const levels = text.split('\n');
                resolve(levels);
            }
        });   
    });
}

function analyzeAudio(soundfile, fps) {
    fs.writeFile('temp/wave.txt', '');

    // beats.js https://github.com/victordibia/beats
    var AudioContext = require('web-audio-api').AudioContext
    context = new AudioContext;

    var pcmdata = [] ;

    //Note: I have no rights to these sound files and they are not created by me.
    //You may downlaod and use your own sound file to further test this.
    //
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
      var interval = (1/fps) * 1000 ; index = 0 ;
      // 120fps = 0.00834, 60fps = 0.01668, 24fps = 0.0417
      var step = Math.round( samplerate * (interval/1000) );
      var max = 0 ;
      var prevmax = 0 ;
      var prevdiffthreshold = 0.3 ;

      //loop through song in time with sample rate
      var samplesound = setInterval(function() {
        if (index >= pcmdata.length) { // pcmdata.length
          clearInterval(samplesound);
          // console.log("finished sampling sound")
          console.clear();
          console.log('waveform recorded\nrun again');
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
        console.log("ANALYZING AUDIO / " +((index/pcmdata.length)*100).toFixed(2)+"% - "+ max, bars  );
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
}

init();