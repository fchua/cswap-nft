
import * as fs from 'fs';
import cmd from 'node-cmd';

const CARDANO_CLI_PATH="/cardano/cardano-node-1.35.0-linux/cardano-cli"

const txHash = "fac7d76bc7fea7ccc7285c6765b77b0af0510af75e5f3dbc91d2d4cb2ca836e0";
const txIx = "0";
const targetAddr = "addr1q9y5a8ea64dz7p28hxzdwq7fltrghgant84j6gw3asam5hvx23v86j6cdz5fps95xxxhdtdprd45sfx0ta6sa4ykmsvslwmz69";

const targetOutput = "1400000"; // lovelace
const tokenAmount = 1; // NFT
const tokenName = "";
const policyId = "21df6057e2e7b73fb07caebd544c532e55ebabd845180e5de209f714";
const changeAddr = "addr1q9kh78a7eeuhlywaadnu872mwm248c9lqqj9f6mz20htggrfy0n7d5pjvfkjh32q9tr3m4nmnfxnuhqwadxy0uwe9cdqm6xdj6";
const script = "state/policy.script";
const outFile = "matx.raw";

const tokenNameHex = Buffer.from(tokenName).toString('hex');


console.log('tokenNameHex', tokenNameHex);

const buildResult = cmd.runSync([
	CARDANO_CLI_PATH,
	"transaction", "build", "--mainnet", "--alonzo-era", 
    "--tx-in", `${txHash}#${txIx}`,
    "--tx-out", `${targetAddr}+${targetOutput}+"${tokenAmount} ${policyId}.${tokenNameHex}"`,
    "--change-address", `${changeAddr}`,
    "--mint", `"${tokenAmount} ${policyId}.${tokenNameHex}"`,
    "--minting-script-file", `${script}`,
    "--metadata-json-file", "metadata.json",
    "--witness-override", "2",
    "--out-file", `${outFile}`
].join(" "));

console.log('buildResult', buildResult);

// const utxoTableRows = rawUtxoTable.data.trim().split('\n');
// let totalLovelaceRecv = 0;
// let isPaymentComplete = false;

// console.log('utxoTableRows',utxoTableRows);

// for (let x = 2; x < utxoTableRows.length; x++) {
// 	const cells = utxoTableRows[x].split(" ").filter(i => i);
// 	console.log('cells',cells);
// 	totalLovelaceRecv += parseInt(cells[2]);
// }

// isPaymentComplete = totalLovelaceRecv >= TOTAL_EXPECTED_LOVELACE;

// console.log(`Total Received: ${totalLovelaceRecv} LOVELACE`);
// console.log(`Expected Payment: ${TOTAL_EXPECTED_LOVELACE} LOVELACE`);
// console.log(`Payment Complete: ${(isPaymentComplete ? "✅" : "❌")}`);
