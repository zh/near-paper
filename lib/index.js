const fs = require('fs');
const nearAPI = require('near-api-js');
const { connect, utils, KeyPair } = nearAPI;
const getConfig = require('./config');

class NearPaperWallet {
  constructor(sender, keyStore) {
    if (!keyStore) throw new Error('Please provide key store');
    let networkId = sender.split('.').pop();
    if (!['mainnet', 'testnet'].includes(networkId)) {
      networkId = 'testnet';
      sender = `${sender}.testnet`;
    }
    this.sender = sender;
    this.networkId = networkId;
    this.accountId = '--empty--';
    this.privateKey = '--empty--';
    this.onBlockchain = false;
    this.keyStore = keyStore;
  }

  async create(amount) {
    try {
      const { sender, networkId, keyStore } = this;
      const keyPair = KeyPair.fromRandom('ed25519');
      const accountId = `paper-${Date.now()}.${this.sender}`;
      this.accountId = accountId;
      this.privateKey = keyPair.secretKey.toString();
      const publicKey = keyPair.publicKey.toString();
      const config = getConfig(networkId);
      await keyStore.setKey(networkId, accountId, keyPair);
      const near = await connect({ ...config, keyStore });
      const creatorAccount = await near.account(sender);
      const chargeAmount = utils.format.parseNearAmount(amount);
      await creatorAccount.createAccount(accountId, publicKey, chargeAmount);
      this.onBlockchain = true;
      return accountId;
    } catch (err) {
      console.error('Error in create(): ', err);
      throw err;
    }
  }

  async sweep(receiver, keyStore) {
    try {
      const { networkId, accountId, onBlockchain, keyStore } = this;
      if (!onBlockchain)
        throw new Error(`[ ${accountId} ] is not on the blockchain`);
      const config = getConfig(networkId);
      const near = await connect({ ...config, keyStore });
      console.log(JSON.stringify(near, null, 2));
      const senderAccount = await near.account(accountId);
      console.log(JSON.stringify(senderAccount, null, 2));
      const balance = await senderAccount.getAccountBalance();
      const amount = balance.available;
      console.log(`balance: ${JSON.stringify(amount, null, 2)}`);
      return senderAccount.sendMoney(receiver, amount);
    } catch (err) {
      console.error('Error in sweep(): ', err);
      throw err;
    }
  }

  async delete() {
    try {
      const { sender, networkId, accountId, keyStore } = this;
      const config = getConfig(networkId);
      const near = await connect({ ...config, keyStore });
      const paperAccount = await near.account(accountId);
      await paperAccount.deleteAccount(sender);
      this.onBlockchain = false;
    } catch (err) {
      console.error('Error in delete(): ', err);
      throw err;
    }
  }

  save(filePath = './') {
    try {
      const { accountId, privateKey, onBlockchain } = this;
      const outObj = {
        accountId,
        privateKey,
        onBlockchain,
      };
      fs.writeFile(
        `${filePath}${accountId}.json`,
        JSON.stringify(outObj, null, 2),
        function (err) {
          if (err) return console.error(err);
          console.log(`wallet ${accountId} saved successfully.`);
        }
      );
    } catch (err) {
      console.error('Error in save(): ', err);
      throw err;
    }
  }

  load(wallet, filePath = './') {
    try {
      const walletInfo = require(`${filePath}${wallet}.${this.sender}.json`);
      this.accountId = walletInfo.accountId;
      this.privateKey = walletInfo.privateKey;
      this.onBlockchain = walletInfo.onBlockchain;
    } catch (err) {
      console.error('Error in load(): ', err);
      throw err;
    }
  }
}

module.exports = NearPaperWallet;
