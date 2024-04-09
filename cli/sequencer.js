const { SEQ_URL } = require("./constants");

const defaultAxios = require("axios");
const axios = defaultAxios.create({
  timeout: 50000,
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function sendTxToSeq(txid, type) {
  try {
    await sleep(3000);
    let url;
    if (type === "transaction") {
      url = `${SEQ_URL}/transactions`;
    } else {
      url = `${SEQ_URL}/deploy`;
    }
    let response = await axios({
      method: "POST",
      url: url,
      data: {
        txid: txid,
      },
    });
    if (response.data.error) {
      console.log("Response Error:", response.data.error);
      return null;
    }
    return response.data.result;
  } catch (error) {
    console.log("send error", error);
    return null;
  }
}

module.exports = { sendTxToSeq };
