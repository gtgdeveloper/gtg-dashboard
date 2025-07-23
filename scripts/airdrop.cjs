// airdrop.js — distribute 1,667 GTG proportionally to holders > 20k GTG (excluding top 3 holders)

const { Connection, Keypair, PublicKey } = require("@solana/web3.js");

const { getOrCreateAssociatedTokenAccount, transfer } = require("@solana/spl-token");
const fs = require("fs");
const path = require("path");

const RPC = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC, "confirmed");

const MINT = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon");
const AMOUNT_TOTAL = 1_667 * 1e9;
const HOLDERS_FILE = "./data/gtg-holders.json";

const DISTRIBUTION_LOG = path.join(__dirname, "distribution.json");

const repairBase64 = process.env.REPAIR_KEY;

if (!repairBase64) {
  throw new Error("REPAIR_KEY environment variable is missing");
}

const secretKey = Uint8Array.from(JSON.parse(
  Buffer.from(repairBase64, 'base64').toString('utf-8')
));
const wallet = Keypair.fromSecretKey(secretKey);

// Load existing distribution log (if any)
let distributionLog = [];
if (fs.existsSync(DISTRIBUTION_LOG)) {
  distributionLog = JSON.parse(fs.readFileSync(DISTRIBUTION_LOG));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync(HOLDERS_FILE)) {
    console.error("❌ Missing holders file. Run holders.js first.");
    return;
  }

  const holders = JSON.parse(fs.readFileSync(HOLDERS_FILE)).slice(3); // skip top 3
  const totalEligible = holders.reduce((sum, h) => sum + h.amount, 0);

  for (const holder of holders) {
    const share = holder.amount / totalEligible;
    const payout = Math.floor(AMOUNT_TOTAL * share);

    try {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        MINT,
        new PublicKey(holder.owner)
      );

      const sig = await transfer(
        connection,
        wallet,
        (await getOrCreateAssociatedTokenAccount(connection, wallet, MINT, wallet.publicKey)).address,
        ata.address,
        wallet,
        payout
      );

      const record = {
        owner: holder.owner,
        amount: payout / 1e9,
        tx: sig,
        timestamp: new Date().toISOString()
      };

      distributionLog.push(record);
      fs.writeFileSync(DISTRIBUTION_LOG, JSON.stringify(distributionLog, null, 2));
      console.log(`✅ Sent ${record.amount} GTG to ${record.owner} → tx: ${record.tx}`);

      await sleep(1000); // delay 1 second to avoid hitting rate limits

    } catch (err) {
      console.error(`❌ Failed to send to ${holder.owner}:`, err.message);
    }
  }
}

main();



(async () => {
  const holders = JSON.parse(fs.readFileSync(HOLDERS_FILE, "utf-8"));
  let distributed = [];

  let total = 0;
  const eligible = holders
    .filter((h) => h.amount > 20_000)
    .sort((a, b) => b.amount - a.amount)
    .slice(3); // remove top 3

  const totalEligible = eligible.reduce((sum, h) => sum + h.amount, 0);

  for (const h of eligible) {
    const share = h.amount / totalEligible;
    const amount = Math.floor(AMOUNT_TOTAL * share); // in lamports

    try {
      const recipient = new PublicKey(h.wallet);

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        MINT,
        recipient
      );

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        MINT,
        wallet.publicKey
      );

      const sig = await transfer(
        connection,
        wallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        wallet.publicKey,
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
