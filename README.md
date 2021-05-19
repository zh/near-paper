# NEAR Paper Wallet

Based on [proposal in NEAR forums](https://gov.near.org/t/1843).

Paper Wallets are great way to onboard new users.
They are also a great way to save funds off-chain (cold storage).

Technically it is not a difficult task - just two QR codes with public and private key. However some sweeping functionality need to be added to the real wallets.

In case of NEAR wallet **account name** also need to be provided. Something as *paper-xxx.somebody.testnet*, where *somebody.testnet* is the parent account, which will create and initially fund the wallet.

## Used libraries and services

- [near-api-js](https://github.com/near/near-api-js) - A JavaScript/TypeScript library for development of DApps on the NEAR platform
- [bn.js](https://github.com/indutny/bn.js/) - BigNum in pure javascript
- [js-sha256](https://github.com/emn178/js-sha256) - A simple SHA-256 / SHA-224 hash function for JavaScript supports UTF-8 encoding

## Installation

```sh
git clone https://github.com/zh/near-paper
cd near-paper
npm install
```

* [TODO] for browser

```html
<script src="https://unpkg.com/near-paper"></script>
```

## Usage

All provided examples are requiring parent account name (**sender** - the account, which will create the wallet) and network (**testnet** or **mainnet**). The easiest place to set them is in the `.env` file in the same directory. File format:

```
NETWORK=testnet
SENDER=somebody.testnet
```

Also there is need from **access keys** (created for example with [near login](https://github.com/near/near-cli#near-login)). For more information see also [access keys NEAR documentation](https://github.com/near/near-cli#near-login).

```js
const NearPaperWallet = require('near-paper');
const AMOUNT = '1.5'
const RECEIVER = 'somebody.testnet'

async function paperWalletTests(sender, amount) {
  try {
    const wallet = new NearPaperWallet(process.env.SENDER);

    // create wallet with 1.5 NEAR initial amount
    await wallet.create(AMOUNT);
    wallet.save();
    console.log(JSON.stringify(wallet, null, 2));

    // sweep all funds
    // wallet.load('--put-correct-name-here--')
    const result = await wallet.sweep(RECEIVER);
    console.log('Transaction Results: ', result.transaction);

    // delete the wallet
    await wallet.delete();

  } catch (error) {
    console.error('error in paperWalletTests: ', error);
  }
}

paperWalletTests();
```

You can see more usage examples in the [examples directory](examples/).

## Example session

### Create wallet

```
$ node ./examples/create-wallet.js -h
Options:
  -a, --amount   Amount of NEAR to put in the wallet                    [number]
```

Create NEAR paper wallet with 2 NEAR initial amount

```
$ node ./examples/create-wallet.js -a 2
{
  "sender": "devops.testnet",
  "networkId": "testnet",
  "accountId": "paper-1621445075752.devops.testnet",
  "privateKey": "41AsYv...",
  "onBlockchain": true,
  "keyStore": {
    "keyDir": "/Users/stoyan/.near-credentials"
  }
}
wallet paper-1621445075752.devops.testnet saved successfully.
```

This will also create JSON file in the root directory with name *paper-1621445075752.devops.testnet.json* and content:

```json
{
  "accountId": "paper-1621445075752.devops.testnet",
  "privateKey": "41AsYv...",
  "onBlockchain": true
}
```

> TODO: Create QR code with a link to fund this wallet. Something like `https://wallet.testnet.near.org/send-money/{paper_wallet_name}`

### Sweep all funds from the paper wallet

**receiver** is the account name to receive the funds.

```
$ node ./examples/sweep-wallet.js -h
Options:
  -r, --receiver  Account to get sweeped tokens                         [string]
  -w, --wallet    Paper wallet name                                     [string]
```

```
$ node ./examples/sweep-wallet.js -r devops.testnet -w paper-1621445075752.devops.testnet
balance: "1981800000000000000000000"
Transaction Results:  {
  signer_id: 'paper-1621445075752.devops.testnet',
  public_key: 'ed25519:F6ENP...',
  nonce: 48275784000001,
  receiver_id: 'devops.testnet',
  actions: [ { Transfer: [Object] } ],
  signature: 'ed25519:3qEP...',
  hash: 'a8Vt43dU78HjPKbuF6F6XAQ7JBNS5KMNDc5CE98f3ya'
}
https://explorer.testnet.near.org/transactions/a8Vt43dU78HjPKbuF6F6XAQ7JBNS5KMNDc5CE98f3ya
```

> TODO: This need to be added to some real wallet. Not sure also what to contain the QR code: maybe something like `{paper_wallet_name}:{private_key}`: read the QR code; parse it to get name and key and sweep the funds

### Delete the paper wallet

Paper wallets can be reused as many times as needed or can be deleted.

```
$ node ./examples/delete-wallet.js -h
Options:
  -w, --wallet   Paper wallet name                                      [string]
```

```
$ node ./examples/delete-wallet.js -w paper-1621445075752
```

This will modify the wallet JSON file with `"onBlockchain": false`.

## TODO

* More flexible credentials handling
* Create JS npm package
* Create QR codes in addition to JSON file
* Sweep module for some wallet
