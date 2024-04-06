const { BlobUploader, EncodeBlobs } = require("../lib/index");
const { ethers } = require("ethers");
const fs = require("fs");
const {
  MAX_BLOB_COUNT,
  DEFAULT_COUNT,
  SEQ_ADDR,
  RPC_URL,
} = require("./constants");

async function isContract(rpc, to) {
  const provider = new ethers.JsonRpcProvider(rpc);
  try {
    const code = await provider.getCode(to);
    return code.length > 5;
  } catch (e) {
    return false;
  }
}

const postBlobOnchain = async (
  privateKey,
  filePath1,
  filePath2,
  rpc = RPC_URL,
  toAddress = SEQ_ADDR,
  data = "0x",
  value = 0n,
  count = DEFAULT_COUNT,
) => {
  const sc = fs.readFileSync(filePath1, "utf-8");
  const initState = fs.readFileSync(filePath2, "utf8");

  const scCharCodes = sc.split("").map((char) => char.charCodeAt(0));
  const initStateCharCodes = initState.split("").map((char) => char.charCodeAt(0));
  const contractData = JSON.stringify({type: 1, sc: scCharCodes, state: initStateCharCodes});

  const txid = await send(privateKey, Buffer.from(contractData));
  console.log(`contract address: ${txid}`);
  // TODO: add a function that call the sequencer
  // and add the contract data to the DB
};

async function send(
  privateKey,
  content,
  rpc = RPC_URL,
  toAddress = SEQ_ADDR,
  data = "0x",
  value = 1n,
  count = DEFAULT_COUNT,
) {
  try {
    if (!ethers.isHexString(data)) {
      console.log("Invalid data");
      return;
    }
    if (await isContract(rpc, toAddress)) {
      if (data === "0x") {
        console.log("Contract calls must include the data parameter");
        return;
      }
    }

    count = Number(count);
    if (count <= 0 || count > MAX_BLOB_COUNT) {
      count = DEFAULT_COUNT;
    }

    const blobs = EncodeBlobs(content);
    const blobLength = blobs.length;

    const uploader = new BlobUploader(rpc, privateKey);
    let currentIndex = 0;
    for (let i = 0; i < blobLength; i += count) {
      let max = i + count;
      if (max > blobLength) {
        max = blobLength;
      }
      const indexArr = [];
      const blobArr = [];
      for (let j = i; j < max; j++) {
        indexArr.push(j);
        blobArr.push(blobs[j]);
      }

      const tx = {
        to: toAddress,
        data: data,
        value: BigInt(value),
      };

      let isSuccess = true;
      try {
        const hash = await uploader.sendTx(tx, blobArr);
        const txReceipt = await uploader.getTxReceipt(hash);
        if (txReceipt.status) {
          currentIndex += blobArr.length;
          return hash;
        } else {
          isSuccess = false;
        }
      } catch (e) {
        isSuccess = false;
      }

      if (!isSuccess) {
        return null;
      }
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}
module.exports.postBlobOnchain = postBlobOnchain;
