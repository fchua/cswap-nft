import * as fs from 'fs';
import cmd from 'node-cmd';

const CARDANO_CLI_PATH = "cardano-cli";
const CARDANO_KEYS_DIR = "/cardano/frank-nft/keys";
const TOTAL_EXPECTED_LOVELACE = 2500000;

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


