const path = require('path');
const homedir = require('os').homedir();
const qrcode = require('qrcode-terminal');
const nearAPI = require('near-api-js');
const { keyStores } = nearAPI;

const CREDENTIALS_DIR = '.near-credentials';

function getKeyStore() {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  return new keyStores.UnencryptedFileSystemKeyStore(credentialsPath);
}

function showQrCode(walletId, networkId) {
  const walletURL = `https://wallet.${networkId}.near.org/send-money/${walletId}`;
  qrcode.generate(walletURL, { small: true }, function (qr) {
    console.log(qr);
  });
}

module.exports = {
  getKeyStore,
  showQrCode,
};
