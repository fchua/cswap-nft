import { AnyArray } from "immer/dist/internal"
import { API, graphqlOperation } from 'aws-amplify';
import {GraphQLResult} from '@aws-amplify/api-graphql';
import { updateWalletData} from '../../graphql/mutations';
import { getWalletData, walletDataByCardanoAddress } from '../../graphql/queries';





var stub = [
    {id: "",
    ethereumAddress: "",
    cardanoAddress: "",
    cswapEthBalance: "",
    cswapCardanoBalance: "",
    isActive: false,
    containsNft: false,
    error: null
}];

interface walletDataObject {
    id: string,
    ethereumAddress: string,
    cardanoAddress: string,
    cswapEthBalance: string,
    cswapCardanoBalance: string,
    isActive: boolean,
    containsNft: boolean
}
  // 
/**
 * Find and returns object with data for a cardanoWalletData object that contains arrays of used and unused Addresses
 * Returns an object with the wallet data for that user.
 * @returns {Promise}
 */
export const getWalletDataFromCardanoWalletAddressArray = async (cardanoWalletData:any): Promise<walletDataObject[]> => {
    console.log("cardanoWalletData - " + JSON.stringify(cardanoWalletData));
    const usedAddressArray:any[] = cardanoWalletData.usedAddressArray;
    const unusedAddressArray:any[] = cardanoWalletData.unusedAddressArray;
    const combinedAddressArray:any[] = [...usedAddressArray, ...unusedAddressArray];

    console.log('combinedAddressArrray: ')
    console.log(combinedAddressArray);
    //array for results
    
    var resultArray: walletDataObject[];
    resultArray = [];

    console.log('resultArrayA: ' + resultArray);

    for (const cardanoWalletAddressString of combinedAddressArray) {
        const returnData = await runQuery(cardanoWalletAddressString);
        console.log('returnData: ');
        console.log(JSON.stringify(returnData));

        if(returnData && returnData?.data && returnData.data.walletDataByCardanoAddress && returnData.data.walletDataByCardanoAddress.items){
            resultArray = [...resultArray,...returnData.data.walletDataByCardanoAddress.items];
        }
    }
    
    console.log('resultArrayB: ' + resultArray);

    return  resultArray;
}

export const runQuery = async (cardanoWalletAddressString:String) => {
    try {
        const returnData:GraphQLResult<any> = await API.graphql(graphqlOperation(walletDataByCardanoAddress,{cardanoAddress:cardanoWalletAddressString}));//{ cardanoAddress: "addr1qygq7zvf03nyznvedu6za7tqy30sc6r7zk7e4z85h5e0c7mtv2edte4x5rrr8nws7d9zqzc5tfxa9w6m4c9a5a3l977s4zcqy0-url"}));
       
        return returnData;
    } catch (error) {
        console.log(error);
        alert('Cardano wallet address error.');
        return null;
    }
}

/**
 * Marks the user associated with a Wallet Address as having logged in.
 * Stores the address the user connected with in case it's different from the Cardano Wallet Address used for the Original Mapping
 * @returns {boolean}
 */
 export const updateWalletDataFromWalletData = (walletData:object) => {
  
}

/**
 * Find and returns cswapTokens from a cardano Address
 * @returns {string}
 */
export const getCswapTokensFromCardanoWalletAddress = (cardanoWalletAddress:string) => {
    
}

