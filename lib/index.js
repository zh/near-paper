const path = require('path');
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

  async sweep(receiver) {
    try {
      const { networkId, accountId, onBlockchain, keyStore } = this;
      if (!onBlockchain)
        throw new Error(`[ ${accountId} ] is not on the blockchain`);
      const config = getConfig(networkId);
      const near = await connect({ ...config, keyStore });
      const senderAccount = await near.account(accountId);
      const balance = await senderAccount.getAccountBalance();
      console.log(`balance: ${JSON.stringify(balance.available, null, 2)}`);
      return senderAccount.sendMoney(receiver, balance.available);
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

  save(filePath = __dirname) {
    try {
      const { accountId, privateKey, onBlockchain } = this;
      const outObj = {
        accountId,
        privateKey,
        onBlockchain,
      };
      const walletPath = path.join(filePath, `${accountId}.json`);
      fs.writeFile(walletPath, JSON.stringify(outObj, null, 2), function (err) {
        if (err) return console.error(err);
        console.log(`wallet ${accountId} saved successfully.`);
      });
    } catch (err) {
      console.error('Error in save(): ', err);
      throw err;
    }
  }

  load(wallet, filePath = __dirname) {
    try {
      const walletPath = path.join(filePath, `${wallet}.${this.sender}.json`);
      const walletInfo = require(walletPath);
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
