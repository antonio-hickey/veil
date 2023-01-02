#!/usr/bin/env node
import inquirer from 'inquirer';
import chalkAnimation from 'chalk-animation';

import { genNewKeyPair } from './generateKeyPair.js';
import { importKeysHandler } from './importKeys.js';
import signingHandler from './sign.js';
import encryptionHandler from './encryption.js';
import decryptionHandler from './decryption.js';
import { type UseCase } from './types/general.js';

const version = '1.0.0';
const welcomeMsg = chalkAnimation.radar(
  'Welcome to veil, a multipurpose cryptography tool.'
);

setTimeout(() => {
  // Handle the welcome message
  welcomeMsg.replace('');
  welcomeMsg.stop();

  // Print version and get the desired use
  console.log('Veil version: ' + version + '\n');

  // Start veil
  start();
}, 3000);

async function start() {
  /* Starts veil */

  console.log('\n')
  inquirer.prompt({
    name: 'desired_use',
    type: 'list',
    message: 'What do you want to do?',
    choices: [
      'Generate New keys',
      'Import Keys',
      'Encrypt Something',
      'Decrypt Something',
      'Sign Something',
    ],
    filter(val: string) {
      // make use case choice lowercase to reduce 
      // confusion throughout codebase.
      return val.toLowerCase();
    },
  }).then(async (useCase: UseCase) => {
    // Map the use case to functionality
    await handleUseCase(useCase.desired_use);

    // See if they want to exit or continue to new tasks
    await inquirer.prompt({
      name: 'exit_choice',
      type: 'list',
      message: '\n',
      choices: [
        'Return To Main Menu',
        'Exit',
      ],
      filter(val: string) {
        return val.toLowerCase();
      },
    }).then(async (result: object) => {
      if (result['exit_choice'] == "return to main menu") {
        start(); // Recurse
      }
    });
  });
}

async function handleUseCase(useCase: string) {
  /* Get relevant functionality to run */

  // Map of use cases (key) and functions (value)
  let useCaseMap = {
    'generate new keys': genNewKeyPair,
    'import keys': importKeysHandler,
    'encrypt something': encryptionHandler,
    'decrypt something': decryptionHandler,
    'sign something': signingHandler,
  }

  // Call the function based on the use case
  return await useCaseMap[useCase]();
}

