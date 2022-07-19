import { readdir, readFile, writeFile } from 'node:fs/promises';
import * as Blockfrost from '@blockfrost/blockfrost-js';

const API = new Blockfrost.BlockFrostAPI({
	projectId: 'mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn', // see: https://blockfrost.io
});

// The second is rate limiting. We limit an end user, distinguished by IP address, to 10 requests per second.

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function loadWallets() {
    var data = await readFile('cswap_wallets.csv', 'utf-8');
    var records = data.split("\r\n");
    const addresses = new Set();
    const goodWallets = {};
    const badWallets = {};
    var bad = 0;
    var good = 0;
    var count = 0;

    for (let record of records) {
        var fields = record.split(",");
        if (fields.length > 4) {
            if (fields[4].startsWith("addr1")) {
                count++;
                const addr = fields[4].split(" ")[0];
                console.log('wallet', addr);
                addresses.add(addr);
                try {
                    const addressDetails = await API.addresses(addr);
                    goodWallets[addr] = addressDetails;
                    good++;
                } catch (err) {
                    bad++;
                    console.log('error', err.status_code);
                    badWallets[addr] = err;
                }
                delay(100);
            }
        }
        // checking the 1st 200 wallets
        if (count > 200) {
             break;
        }
    }

    console.log('Unique wallets:', addresses.size);
    console.log('Good wallets:', good);
    console.log('Bad wallets:', bad);

    for (let address in goodWallets) {
        const o = goodWallets[address];
        console.log(address, o.stake_address + "," + o.type + "," + o.script);
    }
}

loadWallets();
