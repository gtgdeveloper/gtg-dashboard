
const fs = require("fs");
const { Connection, Keypair, PublicKey } = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  transfer,
  TOKEN_PROGRAM_ID
} = require("@solana/spl-token");

const GTG_MINT = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon");

const DISTRIBUTION_LOG = "./data/distribution.json";
const HOLDERS_FILE = "./data/gtg-holders.json";
const AMOUNT_TOTAL = 1667000000000; // 1667 GTG with 9 decimals

const RPC_ENDPOINT = "https://bold-powerful-film.solana-mainnet.quiknode.pro/3e3c22206acbd0918412343760560cbb96a4e9e4";

const secretKey = Uint8Array.from(JSON.parse(
  Buffer.from(process.env.REPAIR_KEY, 'base64').toString('utf-8')
));
const payer = Keypair.fromSecretKey(secretKey);

(async () => {
  if (!fs.existsSync(HOLDERS_FILE)) {
    console.error("❌ Missing holders file. Run holders.cjs first.");
    process.exit(1);
  }

  const holders = JSON.parse(fs.readFileSync(HOLDERS_FILE, "utf-8"));
  let distributed = [];

  const eligible = holders
console.log(`👥 Eligible wallets: ${eligible.length}`);
    .filter((h) => h.amount > 20000)
    .sort((a, b) => b.amount - a.amount)
    .slice(3); // Skip top 3

  const totalEligible = eligible.reduce((sum, h) => sum + h.amount, 0);

  for (const h of eligible) {
    const share = h.amount / totalEligible;
    const amount = Math.floor(AMOUNT_TOTAL * share);

    try {
      let recipient;
      try {
        recipient = new PublicKey(h.wallet);
      } catch (e) {
        console.error(`❌ Skipping invalid wallet address: ${h.wallet}`);
        continue;
      }

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        MINT,
        recipient
      );

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        MINT,
        payer.publicKey
      );

      const sig = await transfer(
        connection,
        payer,
        fromTokenAccount.address,
        toTokenAccount.address,
        payer.publicKey,
        amount
      );

      console.log(`✅ Sent ${amount / 1e9} GTG to ${h.wallet} — tx: ${sig}`);
      distributed.push({ wallet: h.wallet, amount, tx: sig });

    } catch (err) {
      console.error(`❌ Failed to send to ${h.wallet}:`, err.message);
    }
  }

  fs.writeFileSync(DISTRIBUTION_LOG, JSON.stringify(distributed, null, 2));
})();