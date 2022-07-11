import axios from 'axios';
const teamWallet = 'addr1vxdnhre2kxhh3n63lgjg2qttq79gwkwzj9chxwaarfr8qus9sgg7w';

axios.defaults.baseURL = 'https://cardano-mainnet.blockfrost.io/api/v0';
axios.defaults.headers.common['project_id'] = 'mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn';

var blockNumber = 7439000;

async function getWalletTransactions() {
    try {
        var response = await axios.get('/blocks/latest');
        console.log('latest', response.data.height);
        if (blockNumber < response.data.height) {
            // do processing
            response = await axios.get('/addresses/' + teamWallet + '/transactions?from=' + blockNumber);
            console.log('blockNumber: ' + blockNumber);
            console.log('transactions', response.data);
            console.log('*******************');
            blockNumber++;
        } else {
            console.log('Latest block already processed');
            return;
        }
        // console.log(new Date());
        // console.log('blockNumber: ' + blockNumber);
        // const { data } = await axios.get('/addresses/' + teamWallet + '/transactions?from=' + blockNumber);
        // console.log(data);
        // blockNumber++;
    } catch (error) {
        console.error(error);
    }
}

setInterval(getWalletTransactions, 5000);
