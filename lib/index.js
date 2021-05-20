const fs = require('fs');
const nearAPI = require('near-api-js');
const { connect, utils, keyStores, KeyPair } = nearAPI;
const sha256 = require('js-sha256');
const path = require('path');
const homedir = require('os').homedir();

const configForNetwork = (networkId) => ({
  networkId: networkId,
  nodeUrl: `https://rpc.${networkId}.near.org`,
  walletUrl: `https://wallet.${networkId}.near.org`,
  helperUrl: `https://helper.${networkId}.near.org`,
});

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
      const config = configForNetwork(networkId);
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
      const { networkId, accountId, privateKey, onBlockchain, keyStore } = this;
      if (!onBlockchain)
        throw new Error(`[ ${accountId} ] is not on the blockchain`);
      const keyPair = await KeyPair.fromString(privateKey);
      const config = configForNetwork(networkId);
      const near = await connect({ ...config, keyStore });
      const senderAccount = await near.account(accountId);
      const balance = await senderAccount.getAccountBalance();
      const amount = balance.available;
      console.log(`balance: ${JSON.stringify(amount, null, 2)}`);
      const publicKey = keyPair.getPublicKey();
      const provider = new nearAPI.providers.JsonRpcProvider(
        `https://rpc.${networkId}.near.org`
      );
      const accessKey = await provider.query(
        `access_key/${accountId}/${publicKey.toString()}`,
        ''
      );
      if (accessKey.permission !== 'FullAccess') {
        throw new Error(
          `[ ${accountId} ] does not have permission to send tokens`
        );
      }

      const nonce = ++accessKey.nonce;
      const actions = [nearAPI.transactions.transfer(amount)];
      const recentBlockHash = nearAPI.utils.serialize.base_decode(
        accessKey.block_hash
      );
      // build tx
      const transaction = nearAPI.transactions.createTransaction(
        accountId,
        publicKey,
        receiver,
        nonce,
        actions,
        recentBlockHash
      );
      const serializedTx = nearAPI.utils.serialize.serialize(
        nearAPI.transactions.SCHEMA,
        transaction
      );
      const serializedTxHash = new Uint8Array(
        sha256.sha256.array(serializedTx)
      );
      // sign tx
      const signature = keyPair.sign(serializedTxHash);
      const signedTransaction = new nearAPI.transactions.SignedTransaction({
        transaction,
        signature: new nearAPI.transactions.Signature({
          keyType: transaction.publicKey.keyType,
          data: signature.signature,
        }),
      });
      // send tx
      const signedSerializedTx = signedTransaction.encode();
      return provider.sendJsonRpc('broadcast_tx_commit', [
        Buffer.from(signedSerializedTx).toString('base64'),
      ]);
    } catch (err) {
      console.error('Error in sweep(): ', err);
      throw err;
    }
  }

  async delete() {
    try {
      const { sender, networkId, accountId, keyStore } = this;
      const config = configForNetwork(networkId);
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
