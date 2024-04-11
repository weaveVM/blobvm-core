<p align="center">
  <a href="https://wvm.dev">
    <img src="https://raw.githubusercontent.com/weaveVM/.github/main/profile/bg.png">
  </a>
</p>

## About
BlobVM is a computing protocol that implements the [MEM compute protocol](https://docs.mem.tech) on top of EVM networks supporting [EIP-4844](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-4844.md). It leverages blobs for short-lived data availability (DA), [3EM](https://github.com/three-em/3em/) for execution, and [Arweave](https://arweave.org) for permanent data archiving.

## Build locally

```bash
git clone https://github.com/weavevm/blobvm-core.git

cd blobvm-core

npm install . && npm link
```

## Install the CLI

```bash
npm i -g blobvm
```

##  CLI Commands

### Deploy a contract

```bash
blobvm deploy --pk YOUR_WALLET_PK --src $PATH_TO_CONTRACT_SRC --state $PATH_TO_INIT_STATE_JSON
```

### Post an interaction

```bash
blobvm write --pk YOUR_WALLET_PK --contract CONTRACT_ADDRESS --input INPUT_JSON_STRINGIFIED
```


## blobVM Architecture

### Protocol design

The design of the blobVM protocol is both simple and straightforward ***computation protocol***. State transitions (transactions) are posted as EIP-4844 transactions by the user on the EVM network and then submitted by the user or DApp to the sequencer. The sequencer captures the EVM on-chain transaction, decodes the transaction data, performs the corresponding off-chain execution, and then indexes the state changes in the cloud (cache) after transmitting the blob data to Arweave.

### blobVM transactions

On the protocol level, blobVM distinguishes between 2 types of transactions:

- `type 1` : contract deployments
- `type 2` : contract calls

Transactions data structure should be as follow:

```json
// contract deployment
{
  "type": 1,
  "sc": [],
  "state":[]
}
```

```json
// contract call
{
  "type": 2,
  "inputs": [],
}
```

**Data encoding**

The properties `sc`, `state`, and `inputs` are initialized as listed below. They are then encoded according to the function encodeBvmData()

- `sc` : UTF-8 representation of the source code
- `state` : initial state as stringified JSON 
- `inputs` : stringified JSON of the contract's function call object

```ts
function encodeBvmData(data: string): number[] {
  const encodedData = data.split("").map((char) => char.charCodeAt(0));
  return encodeBvmData;
}
```

**Additional information about Transactions:**
- Regardless of the type, the transaction ***total size** should be less than or equal to 128 KiB.
- The EIP-4844 transaction (on-chain) should contain strictly one operation only.
- blobVM transaction fees are outlined in the section below.

### Data Archiving Transactions

This section outlines the format used by the blobVM sequencer to push data to Arweave. The sequencer interfaces with Arweave using [Irys](https://irys.xyz). When indexing blob data from blobVM into Arweave, the following JSON format is utilized to construct the tx data:

```json
{
  "TxId": "L1_txid",
  "Type": "1 or 2",
  "Caller": "tx_caller",
  "VersionedHash": "blob_id",
  "Proof": "blob_proof",
  "Commitments": "blob_kzg_commitment",
  "Data": "blob_data"
}
```

Transactions are posted to Arweave with the following tags:

- `Content-Type`: `application/json`
- `Protocol`: `blobvm-testnet`
- `Type`: `1` or `2`


## blobVM gaseconomics

A blobVM transaction consists of two factors affecting the gas calculation: gas paid for the EVM layer 1 (L1) and gas paid to the blobVM sequencer (Sequencer):

- **Gas Paid for L1**: This is the gas paid by a transaction that implements [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) and [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) standards.

- **Gas Paid to the Sequencer**: This occurs within the same transaction. It involves transferring a sufficient amount of gas fee to the sequencer's address under the `to` (destination) field.

The gas cost of a blobVM transaction (types `1` and `2`) is calculated as follows:

```plaintext
tx_gas = l1_gas_fees + (262604 * winston_byte_price * 1e-12 * ar_usd_price / eth_usd_price) * bvm_multiplier
```

### Equation Terms Breakdown:

- `l1_gas_fees`: The gas paid to post the transaction to the EVM network.
- `262604`: The total byte size of an EIP-4844 transaction when archiving on Arweave. This includes data, KZG commitments, and proof. [Example](https://arweave.net/P8cN1AK78zRKQytgy3NPsopcNVWgUk_rD93ypk_pOWM)
- `winston_byte_price`: The cost price per byte on Arweave. This is dynamic and can be checked at `https://arweave.net/price/262604`.
- `1e-12 * ar_usd_price`: The conversion of `winston_byte_price` from winstons to AR and then to USD.
- `bvm_multiplier` (>= 1): The total Arweave cost, converted to ETH, is then multiplied by the sequencer premium multiplier.


## License
This repository is licensed under the [MIT License](./LICENSE)