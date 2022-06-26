const Blockfrost = require('@blockfrost/blockfrost-js');
const fs = require('node:fs/promises');

const API = new Blockfrost.BlockFrostAPI({
  projectId: 'testnetZSXv3ENISObi2NkCLJnc1wcmQFOmEXJ0',
});

const depositAddr = 'addr_test1qpkx7u9ky4e44v7d2nsh4d2c47c5n7fq5pf7zlezajcc9gdreal5amympzhpp2ckuysn85vmggmctlfk6tcz6pc6s0lq4tztrf';

const configFile = 'config.json';

async function runWalletProcessing() {
  try {
    console.log('Reading from config file...');
    const contents = await fs.readFile(configFile, "utf-8");
    const config = JSON.parse(contents);

    const latestBlock = await API.blocksLatest();
    const address = await API.addresses(
      'addr_test1qpkx7u9ky4e44v7d2nsh4d2c47c5n7fq5pf7zlezajcc9gdreal5amympzhpp2ckuysn85vmggmctlfk6tcz6pc6s0lq4tztrf',
    );
    const transactions = await API.addressesTransactionsAll(depositAddr);

    console.log('address', address);
    console.log('latestBlock', latestBlock);
    console.log('transactions', transactions);

    for (let tx of transactions) {
        console.log('tx', tx);
        const utxos = await API.txsUtxos(tx.tx_hash);
        console.log('utxos', utxos);

        for (let output of utxos.outputs) {
            console.log('output', output);
        }
    }

    console.log('Writing to config file...');
    const result = await fs.writeFile(configFile, JSON.stringify({ latestBlock : latestBlock.height }), "utf-8");
    console.log('Config file updated.');

} catch (err) {
    console.log('error', err);
  }
}

runWalletProcessing();

// we need to identify the source wallet
// there could be more than 1 wallet address
// { addresses : [ 'addr_test1qpkx7u9ky4e44v7d2nsh4d2c47c5n7fq5pf7zlezajcc9gdreal5amympzhpp2ckuysn85vmggmctlfk6tcz6pc6s0lq4tztrf' ], amount }

// if we have multiple input address which one is the main address?
// we need to keep track of all the payments
