import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import fs from 'fs';

import { contactsPath, realContactsPath } from './paths.js';


export async function genNewKeyPair() {
	// TODO: allow for the user to specify type
	//			 instead of hardcoding rsa.
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
				'512 bits	| Weak, but very fast',
				'1024 bits | Normal, and fast',
				'2048 bits | Secure, but slow',
				'4096 bits | Ultra secure, but very slow',
			],
			filter(val: string) {
				return +val.split(' bits')[0];	// Parsed to number
			},
		}
	]).then(async (keyPairOpts: object) => {
		const spinner = createSpinner('Creating keys').start();
		const { generateKeyPair } = await import('node:crypto');

		const keyOpts = {
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
		};

		generateKeyPair('rsa', keyOpts, (err, pubKey, privKey) => {
			if (err) throw err;

			const keyName = keyPairOpts['key_pair_name'];
			const myContactPath = realContactsPath + '/me.json';
			const myContact = JSON.parse(
				fs.readFileSync(myContactPath, 'utf8'),
			);
			
			myContact['publicKeys'] = {...myContact['public'], [keyName]: pubKey.toString()},
			myContact['privateKeys'] = {...myContact['private'], [keyName]: privKey.toString()},

			fs.writeFileSync(myContactPath, JSON.stringify(myContact));

			spinner.success();
		});
	});
}
