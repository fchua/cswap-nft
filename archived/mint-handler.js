import CardanoWasm from "@emurgo/cardano-serialization-lib-nodejs";
import axios from "axios";
import cbor from "cbor";

import paymentKey from "../payment.json" assert { type : 'json' }
import policyKey from "../policy.json" assert { type : 'json' }
import publicKey1 from "../public.json" assert { type : 'json' }

console.log("payment", paymentKey);
console.log("policy", policyKey);
console.log("public", publicKey1);

const headers = {
    project_id: "mainnetj5LbyeKdRfm7wy4NW1XLUWHPa2WP9Kzn"
}

const walletAddr = "addr1vxdnhre2kxhh3n63lgjg2qttq79gwkwzj9chxwaarfr8qus9sgg7w";

const mintNft = async (
  privateKey,
  policy,
  assetName,
  description,
  imageUrl,
  mediaType
) => {
  const FEE = 300000;

  const publicKey = privateKey.to_public();

  const policyPubKey = policy.privateKey.to_public();

  const policyAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(policyPubKey.hash()),
    CardanoWasm.StakeCredential.from_keyhash(policyPubKey.hash())
  ).to_address();

  console.log(`ADDR: ${walletAddr}`);

  // get utxos for our address and select one that is probably big enough to pay the tx fee
  const utxoRes = await axios.get("https://cardano-mainnet.blockfrost.io/api/v0/addresses/" + walletAddr + "/utxos", { headers : headers });

  let utxo = null;

  if (utxoRes.data) {
    for (const utxoEntry of utxoRes.data) {
      for (const utxoAmount of utxoEntry.amount) {
        if (utxoAmount.unit == "lovelace" && utxoAmount.quantity > FEE) {
            utxo = utxoEntry;
            console.log("UTXO: " + utxoEntry);
        }
      }
    }
  }

  if (utxo === null) {
    throw new Error("no utxo found with sufficient ADA.");
  }

  console.log(`UTXO: ${JSON.stringify(utxo, null, 4)}`);

  // get current global slot from yoroi backend
  const { data: slotData } = await axios.get("https://cardano-mainnet.blockfrost.io/api/v0/blocks/latest", { headers : headers });
  console.log('slotData', slotData);

  const ttl = slotData.slot + 60 * 60 * 2;  // two hours from now

  const txBuilder = CardanoWasm.TransactionBuilder.new(
    CardanoWasm.TransactionBuilderConfigBuilder.new()
      .fee_algo(
        CardanoWasm.LinearFee.new(
          CardanoWasm.BigNum.from_str("44"),
          CardanoWasm.BigNum.from_str("155381")
        )
      )
      .coins_per_utxo_word(CardanoWasm.BigNum.from_str("34482"))
      .pool_deposit(CardanoWasm.BigNum.from_str("500000000"))
      .key_deposit(CardanoWasm.BigNum.from_str("2000000"))
      .max_value_size(5000)
      .max_tx_size(16384)
      .build()
  );

  const scripts = CardanoWasm.NativeScripts.new();

  const policyKeyHash = CardanoWasm.BaseAddress.from_address(policyAddr)
    .payment_cred()
    .to_keyhash();

  console.log(
    `POLICY_KEYHASH: ${Buffer.from(policyKeyHash.to_bytes()).toString("hex")}`
  );

  // add key hash script so only people with policy key can mint assets using this policyId
  const keyHashScript = CardanoWasm.NativeScript.new_script_pubkey(
    CardanoWasm.ScriptPubkey.new(policyKeyHash)
  );
  scripts.add(keyHashScript);

  const policyTtl = policy.ttl || ttl;

  console.log(`POLICY_TTL: ${policyTtl}`);

  // add timelock so policy is locked after this slot
  const timelock = CardanoWasm.TimelockExpiry.new(policyTtl);
  const timelockScript = CardanoWasm.NativeScript.new_timelock_expiry(timelock);
  scripts.add(timelockScript);

  const mintScript = CardanoWasm.NativeScript.new_script_all(
    CardanoWasm.ScriptAll.new(scripts)
  );

  const privKeyHash = CardanoWasm.BaseAddress.from_address(addr)
    .payment_cred()
    .to_keyhash();
  txBuilder.add_key_input(
    privKeyHash,
    CardanoWasm.TransactionInput.new(
      CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, "hex")),
      utxo.tx_index
    ),
    CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(utxo.amount))
  );

  txBuilder.add_mint_asset_and_output_min_required_coin(
    mintScript,
    CardanoWasm.AssetName.new(Buffer.from(assetName)),
    CardanoWasm.Int.new_i32(1),
    CardanoWasm.TransactionOutputBuilder.new().with_address(addr).next()
  );

  const policyId = Buffer.from(mintScript.hash().to_bytes()).toString("hex");

  console.log(`POLICY_ID: ${policyId}`);

  const metadata = {
    [policyId]: {
      [assetName]: {
        name: assetName,
        description,
        image: imageUrl,
        mediaType,
      },
    },
  };

  console.log(`METADATA: ${JSON.stringify(metadata, null, 4)}`);

  // transaction ttl can't be later than policy ttl
  const txTtl = ttl > policyTtl ? policyTtl : ttl;

  console.log(`TX_TTL: ${txTtl}`);

  txBuilder.set_ttl(txTtl);
  txBuilder.add_json_metadatum(
    CardanoWasm.BigNum.from_str("721"),
    JSON.stringify(metadata)
  );

  txBuilder.add_change_if_needed(addr);

  const txBody = txBuilder.build();
  const txHash = CardanoWasm.hash_transaction(txBody);

  console.log(`TX_HASH: ${Buffer.from(txHash.to_bytes()).toString("hex")}`);

  // sign the tx using the policy key and main key
  const witnesses = CardanoWasm.TransactionWitnessSet.new();
  const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
  vkeyWitnesses.add(CardanoWasm.make_vkey_witness(txHash, policy.privateKey));
  vkeyWitnesses.add(CardanoWasm.make_vkey_witness(txHash, privateKey));
  witnesses.set_vkeys(vkeyWitnesses);
  witnesses.set_native_scripts;
  const witnessScripts = CardanoWasm.NativeScripts.new();
  witnessScripts.add(mintScript);
  witnesses.set_native_scripts(witnessScripts);

  const unsignedTx = txBuilder.build_tx();

  // create signed transaction
  const tx = CardanoWasm.Transaction.new(
    unsignedTx.body(),
    witnesses,
    unsignedTx.auxiliary_data()
  );

  const signedTx = Buffer.from(tx.to_bytes()).toString("base64");

  // submit the transaction using Blockfrost backend
  try {
    var headersTx = {
        "Content-Type" : "application/cbor",
        "project_id" :  headers["project_id"]
    }
    const { data } = await axios.post("https://cardano-mainnet.blockfrost.io/api/v0/tx/submit", signedTx , headersTx);

    console.log(`SUBMIT_RESULT: ${JSON.stringify(data, null, 4)}`);
  } catch (error) {
    console.error(
      `failed to submit tx via Blockfrost backend: ${error.toString()}. error details: ${JSON.stringify(
        error.response?.data
      )}`
    );
  }
};

try {
  const privateKey = CardanoWasm.PrivateKey.from_normal_bytes(cbor.decodeFirstSync(paymentKey.cborHex));
  const publicKey = CardanoWasm.PublicKey.from_bytes(cbor.decodeFirstSync(publicKey1.cborHex));
  console.log(`PRIVATE KEY: ${privateKey.to_bech32()}`);
  console.log(`PUBLIC KEY A: ${publicKey.to_bech32()}`);

  // import policy key from a .skey file
  const policyPrivateKey = CardanoWasm.PrivateKey.from_normal_bytes(cbor.decodeFirstSync(policyKey.cborHex));
  console.log(`POLICY_PRIV_KEY: ${policyPrivateKey.to_bech32()}`);

  await mintNft(
    privateKey, // main key
    {
      privateKey: policyPrivateKey, // policy key
      // pass null here to get automatic ttl for policy
      // and paste the POLICY_TTL output you get in console to here to mint with same policy
      ttl: null, // policy ttl
    },
    "ChaChaChua", // assetName
    "Cha Cha's NFT Collection", // description
    "ipfs://QmcS6QEdCKAAuUewQvNepg1oiXKawaRMV7JB7EAFXMMgiT", // image url
    "image/jpeg" // mediaType
  );
} catch (err) {
  console.error(`failed to mint nft: ${err.toString()}`);
}
