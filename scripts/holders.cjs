
const fs = require("fs");
const { Connection, PublicKey } = require("@solana/web3.js");

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const MINT_ADDRESS = new PublicKey("YOUR_GTG_TOKEN_MINT_ADDRESS");
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
  const results = await findGTGHolders(MINT_ADDRESS);
  fs.writeFileSync(HOLDERS_FILE, JSON.stringify(results, null, 2));
  console.log("✅ Saved to gtg-holders.json");
})();
