import * as Blockfrost from '@blockfrost/blockfrost-js';
import { readFile, writeFile } from 'node:fs/promises';
import cmd from 'node-cmd';

const CARDANO_CLI="/cardano/cardano-node/cardano-cli"

const interval = 5 * 60 * 1000;
const mode = process.argv[2];

console.log('mode =', mode);
console.log('now =', new Date());
console.log('interval =', `${interval} millseconds`);

const testConfig = getConfig('testnet', 'testnetnmsi0TC4IOKsCQ0rgFYB7CTGcfOdL60p', 'addr_test1vpkh78a7eeuhlywaadnu872mwm248c9lqqj9f6mz20htggq56wqm7');
const mainConfig = getConfig('mainnet', '', '');

const config = (mode == 'main') ? mainConfig : testConfig;
var state;

console.log('activeConfig = ', config);

const API = new Blockfrost.BlockFrostAPI({
	projectId: config.projectId
});

async function loadState() {
    console.log('Loading state...');
    const text = await readFile('state/state.json', 'utf-8');
    state = JSON.parse(text);
}

async function saveState() {
    console.log('Saving state...');
    const text = JSON.stringify(state, null, '\t');
    await writeFile('state/state.json', text, 'utf-8');
}

function getFilenameFromId(id) {
    return `${id}`.padStart(6, '0').slice(-5);
}

async function generateMetadata(id, tokens) {
    console.log('Creating metadata');
    const assetName = `${config.assetName} #${id}`;
    const metadata = {
        "721" : {
            [state.policyId] : {
                [assetName] : {
                    "name" : assetName,
                    "id" : id,
                    "image" : "ipfs://QmRhTTbUrPYEw3mJGGhQqQST9k86v1DPBiTTWJGKDJsVFw",
                    "cswapTokens" : `${tokens}`,
                    "rarity" : "Common",
                    "background" : "White"    
                }
            }
        }
    }
    const text = JSON.stringify(metadata, null, '\t');
    const filename = getFilenameFromId(id);
    await writeFile(`metadata/${filename}.json`, text, 'utf-8');
}

function buildTx(txHash, txIx, targetAddr, id) {
    console.log('tx-in', `${txHash}#${txIx}`);

    const assetName = `Asset #${id}`;
    const assetNameHex = Buffer.from(assetName).toString('hex');
    const filename = getFilenameFromId(id);
    const metadata = `metadata/${filename}.json`;
    const policyId = state.policyId;
    const policyScript = `state/${state.policyScript}`;
    const outFile = `txs/${filename}.raw`;

    const command = [
        CARDANO_CLI,
        "transaction", "build", "--testnet-magic", "1097911063", "--babbage-era", 
        "--tx-in", `${txHash}#${txIx}`,
        "--tx-out", `${targetAddr}+${state.targetOutput}+"1 ${policyId}.${assetNameHex}"`,
        "--change-address", config.paymentAddr,
        "--mint", `"1 ${policyId}.${assetNameHex}"`,
        "--minting-script-file", policyScript,
        "--metadata-json-file", metadata,
        "--invalid-hereafter", state.slotNumber,
        "--witness-override", "2",
        "--out-file", outFile
    ].join(" ");

    console.log('command', command);

    const buildResult = cmd.runSync(command);
    console.log('buildResult', buildResult);
    return buildResult;
}

function signTx(id) {
    const filename = getFilenameFromId(id);
    const bodyFile = `txs/${filename}.raw`;
    const outFile = `txs/${filename}.signed`;

    const command = [
        CARDANO_CLI,
        "transaction", "sign", "--testnet-magic", "1097911063",
        "--signing-key-file", "../cswap-keys/payment.skey",
        "--signing-key-file", "../cswap-keys/policy.skey",
        "--tx-body-file", bodyFile,
        "--out-file", outFile
    ].join(" ");

    console.log('command', command);

    const signResult = cmd.runSync(command);
    console.log('signResult', signResult);
    return signResult;
}

function submitTx(id) {
    const filename = getFilenameFromId(id);
    const txFile = `txs/${filename}.signed`;

    const command = [
        CARDANO_CLI,
        "transaction", "submit", "--testnet-magic", "1097911063",
        "--tx-file", txFile
    ].join(" ");

    console.log('command', command);

    const submitResult = cmd.runSync(command);
    console.log('submitResult', submitResult);
    return submitResult;
}

async function processPayments() {
    await loadState();
    console.log('Processing...', new Date());

    console.log('state =', state);

    try {
        const payments = await getUtxos();
        console.log('payments =', payments);
        var id = state.lastId;
        for (let i = 0; i < payments.length; i++) {
            const payment = payments[i];
            id++;
            await generateMetadata(id, 1000000); // testing only
            const buildResult = buildTx(payment.tx_hash, payment.output_index, payment.user_wallet, id);
            if (buildResult.err) {
                id--; // minting failed, rollback
                throw buildResult.err;
            }
            
            const signResult = signTx(id);
            if (signResult.err) {
                id--; // minting failed, rollback
                throw signResult.err;
            }

            const submitResult = submitTx(id);
            if (submitResult.err) {
                id--; // minting failed, rollback
                throw submitResult.err;
            }
        }
    } catch (err) {
        console.error(err);
    }

    state.lastId = id;
    console.log('state =', state);

    await saveState();

    console.log('Complete');
}

function getConfig(name, projectId, paymentAddr) {
    return {
        name: name,
        projectId: projectId,
        paymentAddr: paymentAddr,
        changeAddr: paymentAddr,
        mintFee: 2500000,
        assetName: "CSWAP NFT"
    };
}

async function getUtxos() {
    const utxos = await API.addressesUtxos(config.paymentAddr);
    const results = [];
    for (let i = 0; i < utxos.length; i++) {
        const txHash = utxos[i].tx_hash;
        const outputIdx = utxos[i].output_index;

        const details = await API.txsUtxos(txHash);
        const inputs = details.inputs;

        var isTeamWallet = false;
        for (let x = 0; x < inputs.length; x++) {
            // check if the sender is the payment address
            if (inputs[x].address == config.paymentAddr) {
                isTeamWallet = true;
                break;
            }
        }
        if (isTeamWallet) {
            console.log(`Skipping UTXO from team wallet: ${config.paymentAddr}#${outputIdx}`);
            continue;
        }

        var userWallet = inputs[0].address; // just get the first address
        console.log('userWallet =', userWallet);
        const outputs = details.outputs;
        var lovelace = 0;
        for (let x = 0; x < outputs.length; x++) {
            if (outputs[x].address == config.paymentAddr) {
                for (let y = 0; y < outputs[x].amount.length; y++) {
                    console.log(outputs[x].amount[y]);
                    if (outputs[x].amount[y].unit == 'lovelace') {
                        lovelace += parseInt(outputs[x].amount[y].quantity);
                    }
                }
            }
        }

        if (lovelace != config.mintFee) {
            console.log(`Payment amount is incorrect, expected ${config.mintFee}, received: ${lovelace}`);
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

        // // check if wallet has been processed to prevent duplication
        // const exists = await addressExists(userWallet);
        // if (exists == true) {
        //     console.log('Wallet address already processed before', userWallet);
        //     continue;
        // }

        const data = {
            user_wallet : userWallet,
            tx_hash : txHash,
            output_index : outputIdx,
            lovelace : lovelace,
            tokens: Math.random() * 1000000, // change this to the actual no. tokens
            stake_address: address.stake_address
        };

        results.push(data);
        // // save wallet to prevent duplicate minting
        // const result = await saveAddress(userWallet);

        // console.log('======================================');

        // if (results.length == maxMintSize) {
        //     console.log('Target batch size reached');
        //     break;
        // }
    }
    return results;
}

processPayments();

setInterval(processPayments, interval);
