
const fs = require("fs");
const { Connection, PublicKey } = require("@solana/web3.js");

const RPC_ENDPOINT = "https://bold-powerful-film.solana-mainnet.quiknode.pro/3e3c22206acbd0918412343760560cbb96a4e9e4";
const MINT_ADDRESS = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon");
const HOLDERS_FILE = "./data/gtg-holders.json";

async function findGTGHolders(mintAddress) {
  const connection = new Connection(RPC_ENDPOINT, "confirmed");
  const largestAccounts = await connection.getTokenLargestAccounts(mintAddress);
  const value = largestAccounts.value;

  const result = [];
  for (const acct of value) {
    const parsed = await connection.getParsedAccountInfo(new PublicKey(acct.address));
    const amount = parseInt(parsed.value.data.parsed.info.tokenAmount.amount);
    const decimals = parsed.value.data.parsed.info.tokenAmount.decimals;
    const wallet = parsed.value.data.parsed.info.owner;
    result.push({ wallet, amount: amount / Math.pow(10, decimals) });
  }

  return result;
}

(async () => {
  try {
    const results = await findGTGHolders(MINT_ADDRESS);
    fs.writeFileSync(HOLDERS_FILE, JSON.stringify(results, null, 2));
    console.log("✅ Saved to gtg-holders.json");
  } catch (err) {
    console.error("❌ Error in holders script:", err);
  }
})();
