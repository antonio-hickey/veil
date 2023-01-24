import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

import { createSpinner } from 'nanospinner';
import fs from 'fs';

import { contactsPath, realContactsPath } from './paths.js';
import { start } from './index.js';


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
			'View Contacts': viewContact,
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
		]).then(async (choicesTwo: object) => {
			const spinner = createSpinner('Creating Contact ...').start();

			const contactPath = realContactsPath + choices['contact_name'] + '.json'; 
			const contactAlreadyExists = fs.existsSync(contactPath);

			if (contactAlreadyExists){
				// eslint-disable-next-line no-return-assign, no-param-reassign
				console.log(`A Contact For ${choices['key_pair_name']} Already Exists, Please Try Again.`);
				await addContact(); // Recurse
			} else {
				const contactData = JSON.stringify({
					'publicKey': choicesTwo['pub_key'].trim(),
					'sharedKey': choicesTwo['shared_key'].trim(),
				});

				fs.writeFileSync(contactPath, contactData);
			}

			spinner.success({text: 'Created Contact'});
		});
	});
}

async function updateContact() {
	await  inquirer.prompt([
		{
			name: 'contact_selection',
			type: 'file-tree-selection',
			message: 'Which Contact Do You Want To Update:',
			root: contactsPath,
			transformer: (input: string) => {
				return input.replace(realContactsPath, '').replace('.json', '').replaceAll('_', ' ');
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
		const spinner = createSpinner('Updating Contact ...').start();

		const contactData = JSON.parse(fs.readFileSync(choices['contact_selection'], 'utf8'));

		for (const x of choices['update_what']) {
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
	});
}

async function removeContact() {
	await inquirer.prompt([
		{
			name: 'contact_selection',
			type: 'file-tree-selection',
			message: 'Which Contact Do You Want To Remove:',
			root: contactsPath,
			transformer: (input: string) => {
				return input.replace(realContactsPath, '').replace('.json', '').replaceAll('_', ' ');
			}
		},
		{
			name: 'is_sure',
			type: 'confirm',
			message: 'Are You Sure You Want To Remove This Contact ?	 (Y/n)',
		}
	]).then(async (choices: object) => {
		if (!choices['is_sure']) return;

		if (choices['contact_selection'].includes('contacts/src/contacts/me.json')) {
			console.log('You Can NOT Remove Your Own Contact, Try Again');
			await removeContact(); // recurse
		}

		fs.rmSync(choices['contact_selection']);
	});
}

async function viewContact() {
	await inquirer.prompt([
		{
			name: 'contact_selection',
			type: 'file-tree-selection',
			message: 'Which Contact Do You Want To View:',
			root: contactsPath,
			transformer: (input: string) => {
				return input.replace(realContactsPath, '').replace('.json', '').replaceAll('_', ' ');
			}
		},
	]).then(async (choices: object) => {
		const contact = JSON.parse(fs.readFileSync(choices['contact_selection'], 'utf8'));
		console.log('\n', contact, '\n');

		await inquirer.prompt({
			name: 'what_next',
			type: 'list',
			message: 'What Would You Like To Do Next:',
			choices: [
				'Return To Contact Management',
				'Return To Main Menu',
				'Exit',
			]
		}).then(async (choices: object) => {
			if (choices['what_next'] == 'Exit') process.exit(0);

			if (choices['what_next'] == 'Return To Contact Management') {
				await contactsHandler();
			} else {
				await start();
			}
		});
	});
}

