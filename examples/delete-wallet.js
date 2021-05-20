const yargs = require('yargs');
const NearPaperWallet = require('../lib');
const { getKeyStore } = require('./utils');
require('dotenv').config();

if (!process.env.SENDER || process.env.SENDER === '')
  throw new Error('Please define SENDER in .env');

const argv = yargs
  .option('wallet', {
    alias: 'w',
    description: 'Paper wallet name',
    type: 'string',
  })
  .help()
  .alias('help', 'h').argv;

if (!argv.wallet) {
  console.error('[Error] Please provide wallet name');
  process.exit(99);
}

const walletName = argv.wallet.split('.')[0];

async function deleteWallet(name, sender) {
  try {
    const wallet = new NearPaperWallet(sender, getKeyStore());
    wallet.load(name, '../');
    // console.log(JSON.stringify(wallet, null, 2));
    await wallet.delete();
    wallet.save();
  } catch (error) {
    console.error('error in deleteWallet: ', error);
  }
}

deleteWallet(walletName, process.env.SENDER);
