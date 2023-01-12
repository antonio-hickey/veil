import fs from 'fs';
import { verify, createPublicKey } from 'node:crypto';

import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import { contactsPath, realContactsPath } from './paths.js';


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
			root: contactsPath,
			transformer: (input: string) => input.replace(realContactsPath, ''),
		},
	]).then((choice: object) => {
		const theirKey = createPublicKey({key: fs.readFileSync(choice['key_to_use'], 'utf8'), format: 'pem'});
		const isVerified = verify(null, choice['content'].trim(), theirKey, Buffer.from(choice['signature'], 'hex'));

		console.log(isVerified ? '!!! Signature Is NOT Valid !!!' : 'Signature Is Valid');
	});
}
