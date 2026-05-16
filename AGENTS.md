# AGENTS.md

## Build/Test Commands
- `sequitur <program-name>` - Run a specific program from /programs directory
- `node index.js <program-name>` - Alternative execution method
- No formal test suite - verify functionality by running individual programs
- No linting/formatting commands defined
- External dependency: `ffmpeg` must be installed for video/audio processing

## Code Style Guidelines

### Imports & Dependencies
- Use CommonJS `require()` syntax (not ES6 imports)
- Prefer `mz/fs` for async file operations over built-in `fs`
- External dependencies: sharp, node-wav, minimist, seedrandom

### Naming Conventions
- camelCase for variables and functions
- kebab-case for CLI arguments and cache directories
- Descriptive function names: `extractFrames()`, `resampleAudio()`, `countFrames()`

### Error Handling
- Use `requireFiles()` helper to validate file existence before processing
- Process `exit(1)` for missing programs, `exit()` for file validation errors
- Console.error for error messages, console.log for progress updates

### File Structure
- Components in `/components` export functions, no classes
- Programs in `/programs` are self-contained async IIFE scripts
- Cache all processed data in `/cache` with descriptive prefixes
- Use ffmpeg for video/audio processing via execSync

### CLI Arguments
- `-v` - Video file input (.mov recommended)
- `-a` - Audio file input (.wav required)
- `-r` - Framerate (default: 24fps)
- `-o` - Output filename
- `-p` - Preview with ffplay (no file written)
- `-i` - Clear cache
- `--no-audio` - Export without audio
