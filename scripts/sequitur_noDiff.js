const fs = require("mz/fs");
const path = require('path');
const { exec } = require("child_process");

console.clear();

const validArgs = ['res', 'fps', 'pre'];
let args = {}
for ( a in validArgs) {
    const index = process.argv.indexOf('--' + validArgs[a]);
    let value;
    if (index > -1) {
        value = parseInt(process.argv[index + 1]);
        args[validArgs[a]] = (value || true);
    }
    else args[validArgs[a]] = false;
}


async function init() {
    const numOfFrames = await countFrames();
    const waveform = await loadWaveform();

    // record waveform if none
    if ( !waveform && args['fps'] ) analyzeAudio();
    // extract frames if none
    else if (!numOfFrames && args['res']) extractFrames();
    // require some args
    else if ( !args['res'] || !args['fps'] ) console.log('missing args!');
    // initialize
    else {
        const seq = sequence(numOfFrames, waveform);
        const written = await write(seq);
        const encoded = await encode(written);
    }
}

function countFrames() {
    return new Promise(function(resolve, reject){
        fs.readdir('temp/frames/', (err, files) => {
            if (!files || files.length < 2) {
                resolve(false);
            }
            else {
                const frames = files.filter(el => path.extname(el) === '.jpg');
                resolve(frames.length);
            }
        });    
    })
}

// separate video into individual frames
function extractFrames() {
    let dir = 'temp/frames';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const extractCmd = "ffmpeg -i input/video.mov -vf scale=-1:"+args['res']+" -qscale:v 2 temp/frames/%d.jpg -y";

    console.log('extracting frames...');
    exec(extractCmd, (error, stdout, stderr) => {
        console.clear();
        // console.log(error, stdout, stderr);
        console.log('frames extracted\nrun again');
    });
}

// create random sequence from frames
function sequence(numOfFrames, waveform) {
    let frames = [],
        selectedFrame = Math.floor(numOfFrames * Math.random()),
        frameDuration = 1/args['fps'],
        reverse = false;

    for (let i = 0; i < (waveform.length-1); i++) {
        let level = waveform[i],
            maxOffset = 1,
            minOffset = 0.5,
            offset = Math.round(numOfFrames * (level * maxOffset));
        if (offset < (level * minOffset)) offset = 1;

        if ( selectedFrame + offset > numOfFrames-1 ) reverse = true;
        else if ( selectedFrame - offset < 0 ) reverse = false;

        if (reverse) selectedFrame = selectedFrame - offset;
        else selectedFrame = selectedFrame + offset
        
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
            if (err) reject(false);
            console.log('written');
            resolve(true);
        });
    })
}

// encode sequence
function encode(written) {
    if (!written) process.exit();

    let dir = 'exports';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const preview = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+args['res']+" -vcodec libx264 -crf 30 -pix_fmt yuv420p -fps_mode vfr -r "+args['fps']+" exports/sequitur_" + Date.now() + ".mp4 -i input/audio.mp3",
          full = "ffmpeg -f concat -i temp/seq.txt -vf scale=-1:"+args['res']+" -c:v prores_ks -profile:v 2 -c:a pcm_s16le -fps_mode vfr -r "+args['fps']+" exports/sequitur_" + Date.now() + ".mov -i input/audio.mp3";

    const encodeCmd = args['pre'] ? preview : full;

    console.log('encoding...');
    return new Promise(function(resolve, reject){
        exec(encodeCmd, (err, stdout, stderr) => {
            // console.log(stdout, stderr);
            if (err) reject(false);
            console.clear();
            console.log('encoded');
            resolve(true);
        });
    })
}


function loadWaveform() {
    return new Promise(function(resolve, reject){
        fs.readFile('temp/wave.txt', function(err, data) {
            if (err) resolve(false);
            else {
                let text = data.toString('utf8');
                const levels = text.split('\n');
                resolve(levels);
            }
        });   
    })
}

function analyzeAudio() {
    let dir = 'temp';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    fs.writeFile('temp/wave.txt', '');

    // beats.js https://github.com/victordibia/beats
    var AudioContext = require('web-audio-api').AudioContext
    context = new AudioContext;
    var _ = require('underscore');

    var pcmdata = [] ;

    //Note: I have no rights to these sound files and they are not created by me.
    //You may downlaod and use your own sound file to further test this.
    //
    var soundfile = "input/audio.mp3"
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
      var interval = (1/args['fps']) * 1000 ; index = 0 ;
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

if (fs.existsSync('input/video.mov') && fs.existsSync('input/audio.mp3')) init();
else console.log('place "video.mov" and "audio.mp3" in "/input"');