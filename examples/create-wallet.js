const path = require('path');
const yargs = require('yargs');
const NearPaperWallet = require('../lib');
const { getKeyStore, showQrCode } = require('./utils');
require('dotenv').config();

if (
  !process.env.NETWORK ||
  !['testnet', 'mainnet'].includes(process.env.NETWORK)
)
  throw new Error('Please define NETWORK in .env');
if (!process.env.SENDER || process.env.SENDER === '')
  throw new Error('Please define SENDER in .env');

const argv = yargs
  .option('amount', {
    alias: 'a',
    description: 'Amount of NEAR to put in the wallet',
    type: 'number',
  })
  .help()
  .alias('help', 'h').argv;

const AMOUNT = argv.amount || '1.5';

async function createWallet(sender, amount) {
  try {
    const wallet = new NearPaperWallet(sender, getKeyStore());
    await wallet.create(amount.toString());
    wallet.save(path.join(__dirname, '..'));
    showQrCode(wallet.accountId, process.env.NETWORK);
    console.log(JSON.stringify(wallet, null, 2));
  } catch (error) {
    console.error('error in createWallet: ', error);
  }
}

createWallet(process.env.SENDER, AMOUNT);
