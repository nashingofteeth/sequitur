const fs = require("mz/fs");
const { exec } = require("child_process");

exec('mkdir temp/frames1 temp/frames2');
var decode = "ffmpeg -i input/video1.mp4 -qscale:v 2 temp/frames1/%d.jpg; ffmpeg -i input/video2.mp4 -qscale:v 2 temp/frames2/%d.jpg"

console.log('DECODING...');
exec(decode, (error, stdout, stderr) => {
    // if (error) {
    //     console.log(`error: ${error.message}`);
    //     return;
    // }
    // if (stderr) {
    //     console.log(`stderr: ${stderr}`);
    //     return;
    // }
    // console.log(`stdout: ${stdout}`);

    
    fs.readdir('temp/frames1/', (err, files) => {
        videoALength = files.length;

        fs.readdir('temp/frames2/', (err, files) => {
            videoBLength = files.length;

            if (videoALength > videoBLength) sequence(videoBLength);
            else sequence(videoALength);
        });
    });
});


var out = '', frameRate = 60;


function sequence(f) {

    for (l=1;l<f+1;l++) {

// OUTPUT FRAME
        var progress = l/f;

        function isEven(n) {
           return n % 2 == 0;
        }

        if (isEven(l)) folder = 2;
        else folder = 1;

        console.clear();
        console.log("SEQUENCING / " + (progress*100).toFixed(2) +"%");

        // console.log(l + " / " + levels.length);

        out += "file 'frames" + folder + "/" + l + ".jpg'\n" +
                     "duration " + 1/frameRate + "\n";

    }


    fs.writeFile('temp/seq.txt', out, function (err) {
        if (err) throw err;

        encode();
    });

    
}

function encode(a) {
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

    const encode = "ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r "+frameRate+" exports/interposition_"+dateTime+".mov -y;";

    console.log('ENCODING...');

    exec(encode, (error, stdout, stderr) => {
        // if (error) {
        //     console.log(`error: ${error.message}`);
        //     return;
        // }
        // if (stderr) {
        //     console.log(`stderr: ${stderr}`);
        //     return;
        // }
        // console.log(`stdout: ${stdout}`);

        console.log("DONE");
        exec("afplay /System/Library/PrivateFrameworks/ScreenReader.framework/Versions/A/Resources/Sounds/DrillOut.aiff");
    });
}