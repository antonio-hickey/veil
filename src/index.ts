#!/usr/bin/env node
import inquirer from 'inquirer';
import chalkAnimation from 'chalk-animation';

import { genNewKeyPair } from './generateKeyPair.js';
import { type UseCase } from './types/general.js';

const version = '1.0.0';
const welcomeMsg = chalkAnimation.radar(
  'Welcome to veil, a multipurpose cryptography tool.'
);

// Handle the welcome message
setTimeout(() => {
  welcomeMsg.replace('');
  welcomeMsg.stop();

  // Start veil
  start()
}, 3000);

async function start() {
  /* Starts veil */

  // Print version and get the desired use
  console.log('Veil version: ' + version + '\n');
  inquirer.prompt({
    name: 'desired_use',
    type: 'list',
    message: 'What do you want to do?',
    choices: [
      'Generate new keys',
      'Encrypt something (NOT IMPLEMENTED YET)',
    ],
    filter(val: string) {
      // make use case choice lowercase to reduce 
      // confusion throughout codebase.
      return val.toLowerCase();
    },
  }).then(async (useCase: UseCase) => {
    // Map the use case to functionality
    await handleUseCase(useCase.desired_use);
  });
}

async function handleUseCase(useCase: string) {
  /* Get relevant functionality to run */

  // Map of use cases (key) and functions (value)
  let useCaseMap = {
    'generate new keys': genNewKeyPair,
  }

  // Call the function based on the use case
  return await useCaseMap[useCase]();
}

