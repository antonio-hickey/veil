import inquirer from "inquirer";
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import fs from "fs";

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { verify, createPublicKey } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const peersKeysPath = __dirname + '/../src/keys/peers-pub-keys';
const _peersKeysPath = peersKeysPath.replace('dist/../', '') + '/';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

export default async function verifingHandler() {
  await inquirer.prompt([
    {
      name: 'content',
      type: 'editor',
      message: 'Press ENTER & Paste The Content They Signed: ',
    },
    {
      name: 'signature',
      type: 'editor',
      message: 'Press ENTER & Paste Their Signature: ',
    },
    {
      name: 'key_to_use',
      type: 'file-tree-selection',
      message: 'Choose Whose Key To Verify Signature With: ',
      root: peersKeysPath,
      transformer: (input: string) => input.replace(_peersKeysPath, ''),
    },
  ]).then(async (choice: object) => {
    let theirKey = createPublicKey({key: fs.readFileSync(choice['key_to_use'], 'utf8'), format: 'pem'});
    let isVerified = verify(null, choice['content'].trim(), theirKey, Buffer.from(choice['signature'], 'hex'));

    console.log(isVerified ? '!!! Signature Is NOT Valid !!!' : 'Signature Is Valid');
  });
}
