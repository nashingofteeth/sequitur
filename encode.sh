#!/bin/bash
# npm install resemblejs mz fs web-audio-api underscore;
# rm -r temp/frames/ exports/ temp/diffs.txt temp/seq.txt temp/wave.txt
# touch temp/diffs.txt temp/seq.txt temp/wave.txt;
# mkdir temp/frames/ exports/;

# ffmpeg -i input/video.mp4 -qscale:v 2 temp/frames/%d.jpg;
# node scripts/selector.js;
# ffmpeg -f concat -i temp/seq.txt -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r 24 input/video.mov -y;

# ffmpeg -i input/video.mov -vf scale=-1:240 -qscale:v 2 temp/frames/%d.jpg;
# ffmpeg -i input/video.mov -vf scale=-1:720 -qscale:v 2 temp/frames/%d.jpg;

# node scripts/differ.js;
# node scripts/wave.js > temp/wave.txt;
node scripts/seqer.js;

ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf scale=320x240 -vcodec libx264 -crf 5 -r 60 -pix_fmt yuv420p exports/"invocation_$(date +%Y%m%d%H%M)".mp4 -y;
# ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf subtitles=input/text.ass,scale=-1:720 -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r 60 exports/"invocation_$(date +%Y%m%d%H%M)".mov -y;

# ffmpeg -i exports/invocation_xxxxxxxxxxxx.mov -an -filter "minterpolate='mi_mode=mci:fps=60:scd=none'" invocation_xxxxxxxxxxxx_interpolated.mov -y;
# ffmpeg -i gad.mov -vcodec libx264 -crf 15 -pix_fmt yuv420p gad.mp4;

# git add encode.sh scripts _old;
# git commit -m "PROJECT NAME";
# git push origin master;

osascript -e 'display notification "encoding finished!" with title "GAD"';
