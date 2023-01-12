import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import { createSpinner } from 'nanospinner';
import fs from 'fs';

import { contactsPath, getRealPath } from './paths.js';


const _contactsPath = getRealPath(contactsPath);

export default async function contactsHandler() {
	await inquirer.prompt([
		{
			name: 'whose_key',
			type: 'list',
			message: 'Whose key ?',
			choices: [
				'Add New Contact',
				'Update Contact',
				'Remove Contact',
				'View Contacts',
			],
		}, 

	]).then((choice: object) => {
		const whoseKeyMap = {
			'Add New Contact': addContact,
			'Update Contact': updateContact,
			'Remove Contact': removeContact,
			'View Contacts': () => {},
		};

		return whoseKeyMap[choice['whose_key']]();
	});
} 


async function addContact() {
	await  inquirer.prompt([
		{
			name: 'contact_name',
			type: 'input',
			message: 'Type A Name Or Pseudonym For The Contact (! IS STORED IN PLAINTEXT !)',
		},
		{
			name: 'keys_ready',
			type: 'confirm',
			message: 'Do You Have Their Keys Ready ?	 (Y/n)',
		},
	]).then(async (choices: object) => {
		if (!choices['keys_ready']) {
			console.log('Come Back And Update This Contact When You Have Their Keys Ready');
			return;
		}
	
		await inquirer.prompt([
			{
				name: 'pub_key',
				type: 'editor',
				message: 'Press ENTER & Paste Their Public Key OR Leave Blank And Update Later:',
			}, 
			{
				name: 'shared_key',
				type: 'editor',
				message: 'Press ENTER & Paste Their Public Key OR Leave Blank And Update Later:',
			}
		]).then((choicesTwo: object) => {
			const spinner = createSpinner(`Creating Contact ...`).start();

			const contactPath = _contactsPath + choices['contact_name'] + '.json'; 
			const contactAlreadyExists = fs.existsSync(contactPath);

			if (contactAlreadyExists){
				console.log(`A Contact For ${choices['key_pair_name']} Already Exists, Please Try Again.`)
				addContact() // Recurse
			} else {
				let contactData = JSON.stringify({
					"publicKey": choicesTwo['pub_key'].trim(),
					"sharedKey": choicesTwo['shared_key'].trim(),
				});

				fs.writeFileSync(contactPath, contactData);
			}

			spinner.success({text: 'Created Contact'});
		});
	})
}

async function updateContact() {
	await  inquirer.prompt([
		{
			name: 'contact_selection',
			type: 'file-tree-selection',
			message: 'Which Contact Do You Want To Update:',
			root: contactsPath,
			transformer: (input: string) => {
				return input.replace(getRealPath(contactsPath), '').replace('.json', '').replaceAll('_', ' ');
			}
		},
		{
			name: 'update_what',
			type: 'checkbox',
			message: 'Select What You Want To Update & Press Enter:',
			choices: [
				'Public Key',
				'Shared Key',
			],
		},
	]).then(async (choices: object) => {
		const spinner = createSpinner(`Updating Contact ...`).start();

		const contactData = JSON.parse(fs.readFileSync(choices['contact_selection'], 'utf8'));

		for (let x of choices['update_what']) {
			const keyType = x == 'Public Key' ? 'publicKey' : 'sharedKey';
			await inquirer.prompt({
				name: 'key',
				type: 'editor',
				message: `Press ENTER & Paste Their ${x}:`,
			}).then((choice: object) => {
				contactData[keyType] = choice['key'].trim();
			});
		}

		spinner.success({text: 'Updated Contact'});
	})
}

async function removeContact() {
	await inquirer.prompt([
		{
			name: 'contact_selection',
			type: 'file-tree-selection',
			message: 'Which Contact Do You Want To Remove:',
			root: contactsPath,
			transformer: (input: string) => {
				return input.replace(getRealPath(contactsPath), '').replace('.json', '').replaceAll('_', ' ');
			}
		},
		{
			name: 'is_sure',
			type: 'confirm',
			message: 'Are You Sure You Want To Remove This Contact ?	 (Y/n)',
		}
	]).then((choices: object) => {
		if (!choices['is_sure']) return;

		if (choices['contact_selection'].includes('contacts/src/contacts/me.json')) {
			console.log('You Can NOT Remove Your Own Contact, Try Again');
			removeContact(); // recurse
		}

		fs.rmSync(choices['contact_selection']);
	});
}

