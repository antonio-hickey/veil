import { generateKey, publicEncrypt } from "node:crypto";
import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import fs from "fs";
import { createSpinner } from 'nanospinner';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const myKeysPath = __dirname + '/../src/keys/my-keys/public';
const _myKeysPath = myKeysPath.replace('dist/../', '') + '/';
const peersKeysPath = __dirname + '/../src/keys/peers-pub-keys';
const _peersKeysPath = peersKeysPath.replace('dist/../', '') + '/';
const sharedKeysPath = __dirname + '/../src/keys/shared-priv-keys';
const _sharedKeysPath = sharedKeysPath.replace('dist/../', '') + '/';


export async function genNewKeyPair() {
  await inquirer.prompt({
    name: 'key_type',
    type: 'list',
    message: 'What Kind Of Key ?',
    choices: [
      'Asymmetric (RSA)',
      'Symmetric (AES)',
    ],
    filter: (val: string) => val.toLowerCase(),
  }).then(async (choice: object) => {
    if (choice['key_type'] == "asymmetric (rsa)") {
      generateRsaKeys();
    } else {
      generateAesKey();
    };
  });
}

async function generateRsaKeys() {
  await inquirer.prompt([
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'Key pair name: ',
    },
    {
      name: 'key_pair_passphrase',
      type: 'input',
      message: 'Key pair password: ',
    },
    {
      name: 'key_pair_bits',
      type: 'list',
      message: 'Bit length:',
      choices: [
        '512 bits  | Weak, but very fast',
        '1024 bits | Normal, and fast',
        '2048 bits | Secure, but slow',
        '4096 bits | Ultra secure, but very slow',
      ],
      filter(val: string) {
        return +val.split(" bits")[0];  // Parsed to number
      },
    },
  ]).then(async (keyPairOpts: object) => {
    const spinner = createSpinner('Creating keys').start();
    const { generateKeyPair } = await import('node:crypto');

    let keyOpts = {
      modulusLength: keyPairOpts['key_pair_bits'],
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: keyPairOpts['key_pair_passphrase'],
      },
    }

    generateKeyPair('rsa', keyOpts, (err, pubKey, privKey) => {
      if (err) throw err;

      let filename = 'src/keys/my-keys/{PUB/PRIV}/' + keyPairOpts['key_pair_name'] + '.pem'
      let keyPair = [
        { filename: filename.replace('{PUB/PRIV}', 'private'), content: privKey.toString() },
        { filename: filename.replace('{PUB/PRIV}', 'public'), content: pubKey.toString() },
      ];

      for (let key of keyPair) {
        fs.writeFile(key.filename, key.content, (err) => { if (err) throw err });
      }
    });

    spinner.success();
  });
}

async function generateAesKey() {
  await inquirer.prompt([
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'Key Pair Name:',
    },
    {
      name: 'for_who',
      type: 'list',
      message: 'Who Is The Key For:',
      choices: ['Myself', 'Someone Else'],
      filter: (val: string) => val.toLowerCase(),
    },
  ]).then(async (choice: object) => {
    await inquirer.prompt(choice['for_who'] == 'myself' ? {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Select Which Key To Encrypt With:',
      root: myKeysPath,
      transformer: (input: string) => input.replace(_myKeysPath, ''),
    } : {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Select Which Key To Encrypt With:',
      root: peersKeysPath,
      transformer: (input: string) => input.replace(_peersKeysPath, ''),  
    }).then((choiceTwo: object) => {
      const spinner = createSpinner('Creating Key').start();
      let filePath = _sharedKeysPath + choice['key_pair_name'] + ".encrypted";
      let aesKey: string;

      generateKey('aes', { length: 256 }, (err, key) => {
        if (err) throw err;
        aesKey = key.export().toString('hex');
      });

      let pubKey = fs.readFileSync(choiceTwo['key_to_use'], 'utf8');
      let encryptedAesKey = publicEncrypt(pubKey, Buffer.from(aesKey, 'hex'));

      fs.writeFileSync(filePath, encryptedAesKey.toString('hex'));

      spinner.success({ text: 'Created Key' });
    });
  });
}
