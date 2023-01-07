import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const myPubKeysPath = __dirname + '/../src/keys/my-keys/public';
const _myPubKeysPath = myPubKeysPath.replace('dist/../', '') + '/';
const myPrivKeysPath = __dirname + '/../src/keys/my-keys/private';
const _myPrivKeysPath = myPrivKeysPath.replace('dist/../', '') + '/';
const peersKeysPath = __dirname + '/../src/keys/peers-pub-keys';
const _peersKeysPath = peersKeysPath.replace('dist/../', '') + '/';


export {
	__filename, __dirname, myPubKeysPath, _myPubKeysPath,
	myPrivKeysPath, _myPrivKeysPath, peersKeysPath, _peersKeysPath,
};
