# SEQUITUR
frame-by-frame video sequencer. requires FFMPEG.

## to do
- create script to record file data without sequencing

## arguments
- `-v` video file (.mov recommended)
- `-a` audio file (.wav required)
- `-r` frames per second (24fps default)
- `-s` export height (240p default, input ratio maintained)
- `-p` preview switch: exports lossy file, increasing encoding speed
- `-i` initialize: reload data