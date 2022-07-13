import { readdir, readFile, writeFile } from 'node:fs/promises';
import date from 'date-and-time';

const paymentsDir = 'output-payments';
const metadataConfig = 'config-metadata.json';

async function handlePayments(paymentsList) {
    var seqNo = await loadLastSequenceNo();

    var assets = { };

    const assetName = await loadAssetName();
    const desc = await loadDescription();

    for (const payment of paymentsList) {
        console.log('payment', payment);
    
        seqNo++;
        
        const name = assetName + seqNo.toString().padStart(4, "0");
        const tokens = payment.tokens;
        
        console.log('name', name);
        console.log('tokens', tokens);

        assets[name] = createSingleMetadata(desc, name, seqNo, "ipfs://something", tokens, "Common");
    }
    
    console.log('assets', assets);
    const now = new Date();
    const filename = date.format(now, 'YYYYMMDDHHmmss') + '.json';
    await writeFile('./output-metadata/' + filename, JSON.stringify(assets, null, '\t'));
    await saveLastSequenceNo(seqNo);
}

// Load last sequence no. from config file
async function loadLastSequenceNo() {
    const contents = await readFile(metadataConfig, 'utf-8');
    const obj = JSON.parse(contents);
    return obj.lastSeqNo;
}

// Load asset name from config file
async function loadAssetName() {
    const contents = await readFile(metadataConfig, 'utf-8');
    const obj = JSON.parse(contents);
    return obj.assetName;
}

// Load description from config file
async function loadDescription() {
    const contents = await readFile(metadataConfig, 'utf-8');
    const obj = JSON.parse(contents);
    return obj.description;
}

// Save last sequence no to config file
async function saveLastSequenceNo(seqNo) {
    const contents = await readFile(metadataConfig, 'utf-8');
    var obj = JSON.parse(contents);
    obj.lastSeqNo = seqNo;
    await writeFile(metadataConfig, JSON.stringify(obj, null, '\t'));
}

function createSingleMetadata(desc, name, id, imageUrl, tokens, rarity) {
    var obj = {
        name : name,
        description : desc,
        id : id,
        image : imageUrl,
        tokens : tokens,
        rarity : rarity
    };
    return obj;
}

async function runMetadata() {
    try {
        const files = await readdir(paymentsDir);
        if (files.length == 0) {
            console.log('No payment objects found.');
            return;
        }

        for (const file of files) {
            console.log('file', file);
            var contents = await readFile(paymentsDir + '/' + file, 'utf-8');
            //console.log('contents', contents);
            var objects = JSON.parse(contents);
            //console.log('objects', objects);
            await handlePayments(objects);
        }
    } catch (err) {
        console.log('error', err);
    }
}

runMetadata();
