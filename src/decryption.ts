import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { createSpinner } from 'nanospinner';
import fs from "fs";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const myKeysPath = __dirname + "/../src/keys/my-keys/private";
const _myKeysPath = myKeysPath.replace('dist/../', '') + '/';


export default async function decryptionHandler() {
  await inquirer.prompt({
    name: 'decrypt_what',
    type: 'list',
    message: '',
    choices: [
      'Decrypt File (outputs an decrypted file)',
      'Decrypt Message (ouputs an decrypted string)',
    ],
    filter: (val: string) => val.split(' (')[0].toLowerCase(),
  }).then(async (choice: object) => {
    let choiceMap = {
      'decrypt file': decryptFile,
      'decrypt message': decryptMessage,
    };

    return choiceMap[choice['decrypt_what']]();
  });
}

async function decryptFile() {
  inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

  await inquirer.prompt([
    {
      name: 'file_to_decrypt',
      type: 'file-tree-selection',
      message: 'Select A File To Decrypt:',
      transformer: (input) => input.replace(process.cwd(), ""),
    },
    {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Select Which Key To Decrypt With:',
      root: myKeysPath,
      transformer: (input) => input.replace(_myKeysPath, ''),
    },
    {
      name: 'key_passphrase',
      type: 'password',
      message: 'Password For The Key: (leave blank if no password)',
      mask: true,
    },
  ]).then(async (choices: object) => {
    const spinner = createSpinner('Encrypting File').start();
    const { createPrivateKey, privateDecrypt } = await import('node:crypto');

    // Set the data to decrypt
    let dataToDecrypt = fs.readFileSync(choices['file_to_decrypt'], 'utf8');

    // Set the private key to use for decryption
    let privKey = createPrivateKey({
      key: fs.readFileSync(choices['key_to_use']), 
      format: 'pem',
      passphrase: choices['key_passphrase'],
    });

    // Decrypt the data
    let decryptedData = privateDecrypt(privKey, Buffer.from(dataToDecrypt, 'hex'));
    fs.writeFileSync(
      choices['file_to_decrypt'].replace(".encrypted", ""), 
      decryptedData.toString('utf8'),
    );

    spinner.success();
    console.log(
      'Decrypted File Saved As:' + choices['file_to_decrypt'].replace('.encrypted', ''), 
      '\nContent: ' + decryptedData.toString('utf8'),
    );
  });
}

async function decryptMessage() {
  inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

  await inquirer.prompt([
    {
      name: 'msg_to_decrypt',
      type: 'editor',
      message: 'Press ENTER & Type Or Paste The Encrypted Text:',
    },
    {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Select Which Key To Decrypt With:',
      root: myKeysPath,
      transformer: (input) => input.replace(_myKeysPath, ''),
    },
    {
      name: 'key_passphrase',
      type: 'password',
      message: 'Password For The Key: (leave blank if no password)',
      mask: true,
    },
  ]).then(async (choices: object) => {
    const spinner = createSpinner('Decrypting Message').start();
    const { createPrivateKey, privateDecrypt } = await import('node:crypto');

    // Set the data to decrypt
    let privKey = createPrivateKey({
      key: fs.readFileSync(choices['key_to_use']), 
      format: 'pem',
      passphrase: choices['key_passphrase'],
    });

    // Decrypt the data
    let decryptedData = privateDecrypt(privKey, 
      Buffer.from(choices['msg_to_decrypt'], 'hex'),
    );

    spinner.success();
    console.log('Decrypted Message: ' + decryptedData.toString('utf8'));
  });
}
