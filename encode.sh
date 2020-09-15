#!/bin/bash
npm install resemblejs mz fs web-audio-api underscore;

# ffmpeg -i input/1928EtudessurParis.avi -qscale:v 2 temp/frames/%d.jpg;
# node scripts/selector.js;
# ffmpeg -f concat -i temp/seq.txt -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r 24 input/video.mov -y;

# rm -r temp/frames/; mkdir temp/frames/;
# ffmpeg -i input/video.mov -vf scale=-1:240 -qscale:v 2 temp/frames/%d.jpg;
# ffmpeg -i input/video.mov -vf scale=-1:720 -qscale:v 2 temp/frames/%d.jpg;

# node scripts/differ.js;
# node scripts/wave.js > temp/wave.txt;
# node scripts/seqer.js;

# ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf scale=320x240 -vcodec libx264 -crf 5 -r 60 -pix_fmt yuv420p exports/"invocation_$(date +%Y%m%d%H%M)".mp4 -y;
# ffmpeg -f concat -i temp/seq.txt -i input/music.mp3 -vsync 1 -vf subtitles=input/text.ass,scale=-1:720 -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r 60 exports/"invocation_$(date +%Y%m%d%H%M)".mov -y;

# ffmpeg -y -i exports/gad.mov -vf subtitles=input/text.ass exports/gad_subs.mp4 -y;

# ffmpeg -i exports/gad.mp4 -an -filter "minterpolate='mi_mode=mci:fps=60:scd=none'" gad_60fps.mp4 -y;
# ffmpeg -i gad.mov -vcodec libx264 -crf 25 -pix_fmt yuv420p gad.mp4;

osascript -e 'display notification "encoding finished!" with title "GAD"';
