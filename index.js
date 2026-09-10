#!/usr/bin/env node

const fs = require('fs');
const minimist = require('minimist');
const args = minimist(process.argv.slice(2));

if (args.h || args.help) {
  console.log('Usage: sequitur <program-name> [-v video] [-a audio] [-r fps] [-o output] [-p] [-i] [--no-audio] [--dry-run]');
  console.log('Programs live in ./programs/. Run with --dry-run to skip export.');
  process.exit(0);
}

const program = args._[0];
if (!program) {
  console.error('Error: No program provided');
  process.exit(1);
}

// Check if the specified program file exists
const programPath = `${__dirname}/programs/${program}.js`;

if (!fs.existsSync(programPath)) {
  console.error(`Error: Program file "${programPath}" does not exist`);
  process.exit(1);
}

// Program file exists, continue with execution
console.log(`Running program: ${program}`);

// Run the program
require(programPath);
