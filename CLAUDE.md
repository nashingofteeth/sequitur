# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sequitur is a frame-by-frame video sequencing tool that creates algorithmic video sequences by analyzing video frame differences and audio waveforms. It extracts frames from video files, calculates inter-frame differences, and uses audio amplitude data to drive frame selection algorithms for artistic video generation.

## Core Architecture

### Entry Points
- `index.js` - CLI entry point that runs programs from the `/programs` directory
- `sequitur.js` - Main library module that exports core functions and handles argument parsing

### Component System
The `/components` directory contains the core processing modules:

- `extract-frames.js` - Extracts video frames using ffmpeg, caches them as PNG files
- `sample-audio.js` - Processes WAV audio files, resamples to match video framerate
- `export-sequence.js` - Concatenates frame sequences using ffmpeg to create final video output
- `compare-frames.js` - Calculates frame differences (referenced but not examined)

### Program Architecture
The `/programs` directory contains algorithmic video generation programs that combine audio analysis with frame difference data:

- Programs follow a pattern of loading audio wave data and frame difference data
- They implement different sequencing algorithms (wav-rider, weaver, dancer, etc.)
- Each program outputs a frame sequence that gets exported to video

### Data Flow
1. Video input → frame extraction → cached PNG frames
2. Audio input → resampling → amplitude array matched to video framerate  
3. Frame analysis → difference calculations → sorted difference arrays
4. Algorithm execution → frame sequence generation
5. Sequence export → ffmpeg concatenation → final video output

## Development Commands

The project uses Node.js with direct script execution. No build scripts are defined in package.json.

### Running Programs
```bash
# Run a specific program
sequitur <program-name>

# Example programs
sequitur diff-wav-rider
sequitur key-wav-rider
sequitur pathfinder
```

### Core Dependencies
- `ffmpeg` (external) - Required for video/audio processing
- `sharp` - Image processing
- `node-wav` - WAV audio file parsing
- `minimist` - Command line argument parsing

## Key Features

### Caching System
- All processed data is cached in `/cache` directory
- Frame extraction cached as PNG sequences
- Audio resampling cached as JSON files
- Difference calculations cached as binary files

### Command Line Arguments
- `-v` - Video file input (.mov recommended)
- `-a` - Audio file input (.wav required) 
- `-r` - Framerate (default: 24fps)
- `-o` - Output filename
- `-p` - Export lossy preview
- `-i` - Clear cache
- `--no-audio` - Export without audio

### Algorithm Parameters
Programs accept additional parameters:
- `--limit` - Constrains difference-based frame selection range (0-1)
- `--margin` - Prevents recent frame reuse 
- `--threshold` - Sets minimum difference threshold
- `--playhead` - Constrains frame selection distance from current playhead position