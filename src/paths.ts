import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const myPubKeysPath = __dirname + '/../src/keys/my-keys/public';
const myPrivKeysPath = __dirname + '/../src/keys/my-keys/private';
const peersKeysPath = __dirname + '/../src/keys/peers-pub-keys';


async function getRealPath(path: string): Promise<string> {
	return path.replace('dist/../', '') + '/';
}

 
export {
	__filename, __dirname, myPubKeysPath,
	myPrivKeysPath, peersKeysPath, getRealPath,
};
