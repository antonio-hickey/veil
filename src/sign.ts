import fs from "fs";
import { createPrivateKey, KeyObject, sign } from 'node:crypto';

import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import { myPrivKeysPath, _myPrivKeysPath } from "./paths.js";


export default async function signingHandler() {
  await inquirer.prompt([
    {
      name: 'sign_what',
      type: 'list',
      message: '',
      choices: [
        'Sign File',
        'Sign Message',
      ],
      filter: (val: string) => val.split(' (')[0].toLowerCase(),
    },
    {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Choose A Key To Sign With:',
      root: myPrivKeysPath,
      transformer: (input: string) => input.replace(_myPrivKeysPath, ''),
    },
    {
      name: 'key_passphrase',
      type: 'password',
      message: 'Password For The Key: (leave blank if no password)',
      mask: true,
    },
  ]).then(async (choice: object) => {
    const privKey = createPrivateKey({
      key: fs.readFileSync(choice['key_to_use']), 
      format: 'pem',
      passphrase: choice['key_passphrase'],
    });

    let choiceMap = {
      'sign file': signFile,
      'sign message': signMessage,
    };

    // Run the functionality
    return choiceMap[choice['sign_what']](privKey);
  });
}

async function signFile(privKey: KeyObject) {
  await inquirer.prompt({
    name: 'file_to_sign',
    type: 'file-tree-selection',
    message: 'Choose A File To Sign:',
    transformer: (input: string) => input.replace(process.cwd(), ''),
  }).then(async (choice: object) => {
    let fileContent = fs.readFileSync(choice['file_to_sign'], 'utf8');
    let signature = sign(null, Buffer.from(fileContent, 'utf8'), privKey);
    console.log('Signature: ' + signature.toString('hex'));
  });
}

async function signMessage(privKey: KeyObject) {
  await inquirer.prompt({
    name: 'msg_to_sign',
    type: 'editor',
    message: 'Press ENTER & Type/Paste The Message To Sign:',
  }).then(async (choice: object) => {
    let signature = sign(null, Buffer.from(choice['msg_to_sign'], 'utf8'), privKey);
    console.log('Signature: ' + signature.toString('hex'));
  });
}
