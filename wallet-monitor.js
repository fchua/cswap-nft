import axios from 'axios';
const teamWallet = 'addr1vxdnhre2kxhh3n63lgjg2qttq79gwkwzj9chxwaarfr8qus9sgg7w';

axios.defaults.baseURL = 'https://cardano-mainnet.blockfrost.io/api/v0';
axios.defaults.headers.common['project_id'] = 'mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn';

const blockNumber = 7434813;

async function getWalletTransactions() {
    try {
      const { data } = await axios.get('/addresses/' + teamWallet + '/transactions?from=' + blockNumber);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
}

getWalletTransactions();
