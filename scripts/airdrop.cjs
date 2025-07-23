const fs = require("fs");
const { Connection, PublicKey, Keypair, Transaction, SystemProgram } = require("@solana/web3.js");

// Constants
const RPC_URL = "https://bold-powerful-film.solana-mainnet.quiknode.pro/3e3c22206acbd0918412343760560cbb96a4e9e4";
const connection = new Connection(RPC_URL, "confirmed");
const TOKEN_MINT = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon"); // GTG Mint

// Load secret key
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync("repair.json")));
const sender = Keypair.fromSecretKey(secretKey);

// Load and validate holders file
const holdersPath = "./data/gtg-holders.json";
if (!fs.existsSync(holdersPath)) {
  console.error("❌ Missing holders file at", holdersPath);
  process.exit(1);
}

let holders;
try {
  holders = JSON.parse(fs.readFileSync(holdersPath, "utf8"));
  if (!Array.isArray(holders)) throw new Error("Holders data is not an array.");
} catch (err) {
  console.error("❌ Failed to parse gtg-holders.json:", err.message);
  process.exit(1);
}

const eligible = holders.filter(h => h.amount >= 20000);
console.log(`👥 Eligible wallets: ${eligible.length}`);

// Dummy transfer function (replace with actual SPL token logic if needed)
async function transferGTG(recipient, amount) {
  console.log(`🚀 Would send ${amount} GTG to ${recipient.toBase58()}`);
}

(async () => {
  for (const h of eligible) {
    try {
      const recipient = new PublicKey(h.wallet);
      const amount = 1; // You can calculate based on rules
      await transferGTG(recipient, amount);
    } catch (err) {
      console.error(`❌ Failed on ${h.wallet}:`, err.message);
    }
  }
  console.log("✅ Airdrop process complete.");
})();