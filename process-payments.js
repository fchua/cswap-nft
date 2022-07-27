import * as Blockfrost from '@blockfrost/blockfrost-js';
import { writeFile, readFile } from 'node:fs/promises';
import date from 'date-and-time';
import { randomUUID } from 'node:crypto';
import config from './config/config-mainnet.json' assert {type: 'json'};

console.log('projectId', config.projectId);
console.log('paymentAddress', config.paymentAddress);

const API = new Blockfrost.BlockFrostAPI({
	projectId: config.projectId
});

// TODO change this to the official wallet address
const teamWalletAddr = config.paymentAddress;

const walletDatabase = 'state/wallets.json';

const outputDir = 'output-payments';

const mintCost = 2500000; // lovelace or 2.5 ADA

const maxMintSize = 5; // If we receive 5 payments we will stop the processing

// Returns true if the address is already in the JSON database
async function addressExists(addr) {
	try {
		console.info('Checking if address already procesed...');
		const contents = JSON.parse(await readFile(walletDatabase, 'utf-8'));
		if (addr in contents) {
			return true;
		}
	} catch (err) {
		console.error('error', err);
	}
	return false;
}

// Saves the address in the JSON database
async function saveAddress(addr) {
	try {
		console.info('Saving address to prevent duplicate processing...');
		const contents = JSON.parse(await readFile(walletDatabase, 'utf-8'));
		contents[addr] = new Date().toISOString();
		await writeFile(walletDatabase, JSON.stringify(contents, null, '\t'));
		return true;
	} catch(err) {
		console.error('error', err);
	}
	return false;
}

// Process UTXOs of the team wallet
// This function is designed to be called at specific time to enable batch minting
async function processPayments() {
	try {
		// extract the UTXOs
		// assumptions:
		// 1. 1 UTXO represents a single payment of 2.5 ADA
		// 2. We can use the UTXO to determine the source wallet
		// 3. The UTXO inputs came from the same wallet
		// 4. We will send the NFT to the first input address
		const addr = await API.addresses(teamWalletAddr);
		console.log('walletAddress', addr);

		const utxos = await API.addressesUtxos(teamWalletAddr);
		const results = [];

		console.log('======================================');
		for (let i = 0; i < utxos.length; i++) {
			const txHash = utxos[i].tx_hash;
			const outputIdx = utxos[i].output_index;

			const details = await API.txsUtxos(txHash);
			const inputs = details.inputs;
			var isTeamWallet = false;
			for (let x = 0; x < inputs.length; x++) {
				// check if the sender is the team wallet
				if (inputs[x].address == teamWalletAddr) {
					isTeamWallet = true;
					break;
				}
			}
			if (isTeamWallet) {
				console.log(`Skipping UTXO from team wallet: ${teamWalletAddr}#${outputIdx}`);
				continue;
			}
			var userWallet = inputs[0].address; // just get the first address
			console.log('userWallet', userWallet);
			const outputs = details.outputs;
			var lovelace = 0;
			for (let x = 0; x < outputs.length; x++) {
				if (outputs[x].address == teamWalletAddr) {
					for (let y = 0; y < outputs[x].amount.length; y++) {
						console.log(outputs[x].amount[y]);
						if (outputs[x].amount[y].unit == 'lovelace') {
							lovelace += parseInt(outputs[x].amount[y].quantity);
						}
					}
				}
			}

			if (lovelace != mintCost) {
				console.log('Payment amount is incorrect:', lovelace);
				continue;
			}

			// pull metadata so we can validate the user wallet
			const metadata = await API.txsMetadata(txHash);
			console.log('metadata', metadata);
			// TODO call GraphQL API to validate user wallet and get no. of tokens

			if (metadata.length > 0) {
				// parse the metadata to get the desired wallet
			} else {
				// if no metadata is included in the transaction
				// we can try using the address which the payment originated from
			}

			const address = await API.addresses(userWallet);
			console.log('address', address);

			// check if wallet has been processed to prevent duplication
			const exists = await addressExists(userWallet);
			if (exists == true) {
				console.log('Wallet address already processed before', userWallet);
				continue;
			}

			const data = {
				user_wallet : userWallet,
				tx_hash : txHash,
				output_index : outputIdx,
				lovelace : lovelace,
				tokens: Math.random() * 1000000, // change this to the actual no. tokens
				stake_address: address.stake_address,
				user_id: randomUUID()
			};

			results.push(data);

			// save wallet to prevent duplicate minting
			const result = await saveAddress(userWallet);

			console.log('======================================');

			if (results.length == maxMintSize) {
				console.log('Target batch size reached');
				break;
			}
		}

		console.log('results', results);
		if (results.length > 0) {
			const now = new Date();
			const filename = date.format(now, 'YYYYMMDDHHmmss') + '.json';
			await writeFile(outputDir + '/' + filename, JSON.stringify(results, null, '\t'));
		} else {
			console.log('Nothing to process.');
		}
	} catch (err) {
		console.log('error', err);
	}
}

processPayments();

// async function testWalletValidation() {
// 	var exists = await addressExists('abc');
// 	console.log('abc', exists); // must be false
// 	var result = await saveAddress('abc'); // save wallet
// 	exists = await addressExists('abc');
// 	console.log('abc', exists); // must be true
// }
//testWalletValidation();
