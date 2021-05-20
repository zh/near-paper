const path = require('path');
const homedir = require('os').homedir();
const nearAPI = require('near-api-js');
const { keyStores } = nearAPI;

const CREDENTIALS_DIR = '.near-credentials';

function getKeyStore() {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  return new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
}

module.exports = {
  getKeyStore,
};
