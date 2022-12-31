import inquirer from "inquirer";
import { createSpinner } from 'nanospinner';
import fs from "fs";



export async function genNewKeyPair() {
  // TODO: allow for the user to specify type
  //       instead of hardcoding rsa.
  let keyPairOptions = {}

  await inquirer.prompt([

    // Filename for the keys
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'Key pair name: ',
    },

    // Passphrase
    {
      name: 'key_pair_passphrase',
      type: 'input',
      message: 'Key pair password: ',
    },

    // Bit lenghth
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
        // Parse to number
        return +val.split(" bits")[0];
      },
    }
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

      fs.writeFile(
        "src/keys/my-keys/private/" + keyPairOpts['key_pair_name'] + ".pem", 
        privKey.toString(), (err) => { if (err) throw err },
      );

      fs.writeFile(
        "src/keys/my-keys/public/" + keyPairOpts['key_pair_name'] + ".pem", 
        pubKey.toString(), (err) => { if (err) throw err },
      );
    });

    spinner.success();
  });

  return keyPairOptions;
}
