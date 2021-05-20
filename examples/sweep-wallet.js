const yargs = require('yargs');
const NearPaperWallet = require('../lib');
const { getKeyStore } = require('./utils');
require('dotenv').config();

if (
  !process.env.NETWORK ||
  !['testnet', 'mainnet'].includes(process.env.NETWORK)
)
  throw new Error('Please define NETWORK in .env');
if (!process.env.SENDER || process.env.SENDER === '')
  throw new Error('Please define SENDER in .env');

const argv = yargs
  .option('receiver', {
    alias: 'r',
    description: 'Account to get sweeped tokens',
    type: 'string',
  })
  .option('wallet', {
    alias: 'w',
    description: 'Paper wallet name',
    type: 'string',
  })
  .help()
  .alias('help', 'h').argv;

if (!argv.receiver) {
  console.error('[Error] Please provide receiver account');
  process.exit(99);
}

if (!argv.wallet) {
  console.error('[Error] Please provide wallet name');
  process.exit(99);
}

const walletName = argv.wallet.split('.')[0];

async function sweepWallet(name, sender, receiver) {
  try {
    const wallet = new NearPaperWallet(sender, getKeyStore());
    wallet.load(walletName, '../');
    // console.log(JSON.stringify(wallet, null, 2));
    const result = await wallet.sweep(receiver);
    console.log('Transaction Results: ', result.transaction);
    console.log(
      `https://explorer.${process.env.NETWORK}.near.org/transactions/${result.transaction.hash}`
    );
  } catch (error) {
    console.error('error in sweepWallet: ', error);
  }
}

sweepWallet(walletName, process.env.SENDER, argv.receiver);
