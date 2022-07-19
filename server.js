import * as fs from 'fs';
import cmd from 'node-cmd';
import * as Blockfrost from '@blockfrost/blockfrost-js';
import { writeFile } from 'node:fs/promises';
import date from 'date-and-time';

const API = new Blockfrost.BlockFrostAPI({
	projectId: 'mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn', // see: https://blockfrost.io
});

const walletAddress = 'addr1vxdnhre2kxhh3n63lgjg2qttq79gwkwzj9chxwaarfr8qus9sgg7w';
var stakeAddress = '';

const CARDANO_CLI_PATH = "cardano-cli";
const CARDANO_KEYS_DIR = "/cardano/frank-nft/keys";
const TOTAL_EXPECTED_LOVELACE = 2500000;

/*
const walletAddress = fs.readFileSync(`${CARDANO_KEYS_DIR}/payment.addr`).toString();

const rawUtxoTable = cmd.runSync([
	CARDANO_CLI_PATH,
	"query", "utxo",
	"--mainnet",
	"--address", walletAddress
].join(" "));

console.log('rawUtxoTable',rawUtxoTable);

const utxoTableRows = rawUtxoTable.data.trim().split('\n');
let totalLovelaceRecv = 0;
let isPaymentComplete = false;

console.log('utxoTableRows',utxoTableRows);

for (let x = 2; x < utxoTableRows.length; x++) {
	const cells = utxoTableRows[x].split(" ").filter(i => i);
	console.log('cells',cells);
	totalLovelaceRecv += parseInt(cells[2]);
}

isPaymentComplete = totalLovelaceRecv >= TOTAL_EXPECTED_LOVELACE;

console.log(`Total Received: ${totalLovelaceRecv} LOVELACE`);
console.log(`Expected Payment: ${TOTAL_EXPECTED_LOVELACE} LOVELACE`);
console.log(`Payment Complete: ${(isPaymentComplete ? "✅" : "❌")}`);
*/

async function runMint() {
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

			const details = await API.txsUtxos(utxos[i].tx_hash);
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

			const data = {
				user_wallet : userWallet,
				tx_hash : txHash,
				output_index : outputIdx,
				lovelace : lovelace
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

runMint();
