# SEQUITUR
frame-by-frame video sequencer.
## dependencies
- [FFMPEG](https://ffmpeg.org/)
- [sharp](https://sharp.pixelplumbing.com/)
- [node-wav](https://github.com/andreasgal/node-wav)
- [minimist](https://github.com/minimistjs/minimist)
## arguments
- `-v` video file (.mov recommended)
- `-a` audio file (.wav required)
- `-r` frames per second (24fps default)
- `-o` set output file name
- `-p` export lossy preview file
- `-i` clear cache
- `--no-audio` export video without audio
- `--dry-run` don't export sequence
