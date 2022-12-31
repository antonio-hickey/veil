import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { createSpinner } from 'nanospinner';
import fs from 'fs';


export async function importKeysHandler() {
  await inquirer.prompt(
    // Whose key
    {
      name: 'whose_key',
      type: 'list',
      message: 'Whose key ?',
      choices: [
        'My Key(s)',
        'Someone\'s Public Key',
        'A Shared Private Key',
      ],
      filter(val: string) {
        return val.toLowerCase();
      },
    }
  ).then(async (choice: object) => {
    const whoseKeyMap = {
      'my key(s)': importMyKeys,
      'someone\'s public key': importPeersKey,
      'a shared private key': importSharedKey,
    }

    return whoseKeyMap[choice['whose_key']]()
  });
} 

async function importMyKeys() {
  await inquirer.prompt([
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'What do you want to call this key pair ?',
    },
    {
      name: 'public_key',
      type: 'editor',
      message: 'Press ENTER & Paste Your Public Key:',
    },
    {
      name: 'private_key',
      type: 'editor',
      message: 'Press ENTER & Paste Your Private Key:',
    },
  ]).then(async (choices: object) => {
    const spinner = createSpinner('Importing Keys...').start();

    fs.writeFile(
      'src/keys/my-keys/public/' + choices['key_pair_name'] + '.pem',
      choices['public_key'].trim(),
      (err) => { 
        if (err) { 
          spinner.error(); 
          throw err; 
        }
      },
    );

    fs.writeFile(
      'src/keys/my-keys/private/' + choices['key_pair_name'] + '.pem',
      choices['private_key'].trim(),
      (err) => { 
        if (err) {
          spinner.error();
          throw err;
        } 
      }
    );

    spinner.success();
  });
}

async function importPeersKey() {
  await inquirer.prompt([
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'Name This Key (`.pem` will be added to the end):',
    },
    {
      name: 'public_key',
      type: 'editor',
      message: 'Press ENTER & Paste Their Public Key:',
    },
  ]).then(async (choices: object) => {
    const spinner = createSpinner('Importing Keys...').start();

    fs.writeFile(
      'src/keys/peers-pub-keys/' + choices['key_pair_name'] + '.pem',
      choices['public_key'].trim(),
      (err) => { 
        if (err) {
          spinner.error();
          throw err;
        }
      },
    );

    spinner.success();
  });
}

async function importSharedKey() {
  await inquirer.prompt([
    {
      name: 'key_pair_name',
      type: 'input',
      message: 'Name This Key (`.pem` will be added to the end):',
    },
    {
      name: 'is_it_already_encrypted',
      type: 'confirm',
      message: 'Is The Shared Key Already Encrypted ?   (Y/n)',
    },
    {
      name: 'private_key',
      type: 'editor',
      message: 'Press ENTER & Paste The Shared Key:',
    },
  ]).then(async (choices: object) => {
    const spinner = createSpinner('Importing Keys...').start();

    if (choices['is_it_already_encrypted']) {
      fs.writeFile(
        'src/keys/shared-priv-keys/' + choices['key_pair_name'] + '.pem',
        choices['private_key'].trim(),
        (err) => { 
          if (err) {
            spinner.error();
            throw err;
          }
        },
      );
    } else {
      const public_keys_path = process.cwd() + '/src/keys/my-keys/public/';

      inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);
      inquirer.prompt([{
        type: 'file-tree-selection',
        name: 'key_to_encrypt_with',
        root: public_keys_path,
        message: 'Choose A Key To Encrypt It With:',
        transformer: (input) => {
          return input.replace(public_keys_path, "");
        }
      }]).then(async(choice: object) => {
        const {
          publicEncrypt,
        } = await import('node:crypto');
        let pubKey = "";

        fs.readFile(choice['key_to_encrypt_with'], 'utf8', (err, data) => {
          if (err) throw err;
          pubKey = data;

          let encrypted_priv_key = publicEncrypt(pubKey, choices['private_key'])
            
          fs.writeFile(
            'src/keys/shared-priv-keys/' + choices['key_pair_name'] + '.pem',
            encrypted_priv_key,
            (err) => { 
              if (err) {
                spinner.error();
                throw err;
              } 
            },
          );
        });
      });
    }

    spinner.success();
  });
}
