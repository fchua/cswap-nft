import * as Blockfrost from '@blockfrost/blockfrost-js';
import { writeFile } from 'node:fs/promises';
import date from 'date-and-time';
import { randomUUID } from 'node:crypto';

const API = new Blockfrost.BlockFrostAPI({
	projectId: 'mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn', // see: https://blockfrost.io
});

// TODO change this to the official wallet address
const walletAddress = 'addr1vxdnhre2kxhh3n63lgjg2qttq79gwkwzj9chxwaarfr8qus9sgg7w';

async function processPayments() {
	try {
		// extract the UTXOs
		// assumptions:
		// 1. 1 UTXO represents a single payment of 2.5 ADA
		// 2. We can use the UTXO to determine the source wallet
		// 3. The UTXO inputs came from the same wallet
		// 4. We will send the NFT to the first input address
		const addr = await API.addresses(walletAddress);
		console.log('walletAddress', addr);

		const utxos = await API.addressesUtxos(walletAddress);
		const results = [];

		console.log('======================================');
		for (let i = 0; i < utxos.length; i++) {
			const txHash = utxos[i].tx_hash;
			const outputIdx = utxos[i].output_index;

			const details = await API.txsUtxos(txHash);
			const inputs = details.inputs;
			var isTeamWallet = false;
			for (let x = 0; x < inputs.length; x++) {
				if (inputs[x].address == walletAddress) {
					console.log('Skipping UTXO from team wallet');
					isTeamWallet = true;
					break;
				}
			}
			if (isTeamWallet) {
				continue;
			}
			var userWallet = inputs[0].address; // just get the first address
			console.log('userWallet', userWallet);
			const outputs = details.outputs;
			var lovelace = 0;
			for (let x = 0; x < outputs.length; x++) {
				if (outputs[x].address == walletAddress) {
					for (let y = 0; y < outputs[x].amount.length; y++) {
						console.log(outputs[x].amount[y]);
						if (outputs[x].amount[y].unit == 'lovelace') {
							lovelace += parseInt(outputs[x].amount[y].quantity);
						}
					}
				}
			}

			// pull metadata so we can validate the user wallet
			const metadata = await API.txsMetadata(txHash);
			console.log('metadata', metadata);
			// TODO call GraphQL API to validate user wallet and get no. of tokens

			const address = await API.addresses(userWallet);
			console.log('address', address);

			const data = {
				user_wallet : userWallet,
				tx_hash : txHash,
				output_index : outputIdx,
				lovelace : lovelace,
				tokens: Math.random() * 1000000,
				stake_address: address.stake_address,
				user_id: randomUUID()
			};

			results.push(data);
			console.log('======================================');
		}
		console.log('results', results);
		const now = new Date();
		const filename = date.format(now, 'YYYYMMDDHHmmss') + '.json';
		await writeFile('./output-payments/' + filename, JSON.stringify(results, null, '\t'));
	} catch (err) {
		console.log('error', err);
	}
}

processPayments();
