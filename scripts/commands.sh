#!/bin/bash
# npm install resemblejs mz fs web-audio-api underscore;

# ffmpeg -i input/video.mp4 -qscale:v 2 temp/frames/%d.jpg;
# node scripts/selector.js;
# ffmpeg -f concat -i temp/seq.txt -c:v prores_ks -profile:v 2 -c:a pcm_s16le -r 24 input/video.mov -y;

# ffmpeg -i exports/invocation_xxxxxxxxxxxx.mov -an -filter "minterpolate='mi_mode=mci:fps=60:scd=none'" invocation_xxxxxxxxxxxx_interpolated.mov -y;
# ffmpeg -i invocation_xxxxxxxxxxxx.mov -vcodec libx264 -crf 15 -pix_fmt yuv420p invocation_xxxxxxxxxxxx.mp4;

# ssh nash@nash.video -p 2222 -R 8282:localhost:3000