import fs from 'fs';

import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import { createSpinner } from 'nanospinner';

import { 
	myPubKeysPath, _myPubKeysPath, 
	peersKeysPath, _peersKeysPath
} from './paths.js';


export default async function encryptionHandler() {
	await inquirer.prompt({
		name: 'encrypt_what',
		type: 'list',
		message: '',
		choices: [
			'Encrypt File (outputs an encrypted file)',
			'Encrypt Message (ouputs an encrypted string)',
		],
		filter(val: string) {
			return val.split(' (')[0].toLowerCase();
		}
	}).then(async (choice: object) => {
		let choiceMap = {
			'encrypt file': encryptFile,
			'encrypt message': encryptMessage,
		};

		return choiceMap[choice['encrypt_what']]();
	});
}

async function encryptFile() {
	await inquirer.prompt([
		{
			name: 'reader_target',
			type: 'list',
			message: 'Target Reader:',
			choices: [
				'Myself (encrypt with my public key)',
				'Someone (encrypt with someones public key)',
			],
			filter: (val: string) => val.split(' (')[0].toLowerCase(),
		},
	]).then(async (choice: object) => {
		await inquirer.prompt([choice['reader_target'] == 'myself' ? {
			name: 'key_to_use',
			type: 'file-tree-selection',
			message: 'Select Which Key To Encrypt With:',
			root: myPubKeysPath,
			transformer: (input: string) => input.replace(_myPubKeysPath, ''),
		}: {
			name: 'key_to_use',
			type: 'file-tree-selection',
			message: 'Select Whose Key To Encrypt With:',
			root: peersKeysPath,
			transformer: (input: string) => input.replace(_peersKeysPath, ''),
		},
		{
			name: 'file_to_encrypt',
			type: 'file-tree-selection',
			message: 'Select A File To Encrypt',
			transformer: (input) => input.replace(process.cwd(), ''),
		}]).then(async (choiceTwo: object) => {
			const spinner = createSpinner('Encrypting File').start();
			const { publicEncrypt } = await import('node:crypto');

			let pubKey = fs.readFileSync(choiceTwo['key_to_use'], 'utf8');
			let dataToEncrypt = fs.readFileSync(choiceTwo['file_to_encrypt'], 'utf8');

			// Encrypt and save the encrypted file
			let encryptedData = publicEncrypt(pubKey, Buffer.from(dataToEncrypt, 'utf-8'));
			fs.writeFileSync(
				choice['file_to_encrypt'] + '.encrypted', 
				encryptedData.toString('hex'),
			);

			spinner.success();
		});
	});
}

async function encryptMessage() {
	await inquirer.prompt({
		name: 'reader_target',
		type: 'list',
		message: 'Target Reader:',
		choices: [
			'Myself (encrypt with my public key)',
			'Someone (encrypt with someones public key)',
		],
		filter: (val: string) => val.split(' (')[0].toLowerCase(),
	}).then(async (choice: object) => { 
		await inquirer.prompt([choice['reader_target'] == 'myself' ? {
			name: 'pub_key_to_use',
			type: 'file-tree-selection',
			message: 'Select Which Key To Encrypt With:',
			root: myPubKeysPath,
			transformer: (input: string) => input.replace(_myPubKeysPath, ''),
		}: {
			name: 'pub_key_to_use',
			type: 'file-tree-selection',
			message: 'Select Whose Key To Encrypt With:',
			root: peersKeysPath,
			transformer: (input: string) => input.replace(_peersKeysPath, ''),
		},
		{
			name: 'secret_message',
			type: 'editor',
			message: 'Press ENTER & Type Your Secret Message:',
		}]).then(async (choiceTwo: object) => {
			const spinner = createSpinner('Encrypting Message').start();
			const { publicEncrypt } = await import('node:crypto');

			// Encrypt the message
			let encryptedData = publicEncrypt(
				fs.readFileSync(choiceTwo['pub_key_to_use'], 'utf8'),
				Buffer.from(choiceTwo['secret_message'], 'utf8')
			);

			spinner.success();
			console.log('Encrypted Message: ' + encryptedData.toString('hex'));
		});
	});
}
