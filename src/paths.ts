import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const contactsPath = __dirname + '/../src/contacts'


function getRealPath(path: string): string {
	return path.replace('dist/../', '') + '/';
}

 
export {
	__filename, __dirname, contactsPath,
	getRealPath,
};
