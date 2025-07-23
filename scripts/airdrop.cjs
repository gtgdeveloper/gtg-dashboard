const fs = require("fs");
const {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");

// ✅ Use REPAIR_SECRET from env
if (!process.env.REPAIR_SECRET) {
  console.error("❌ Missing REPAIR_SECRET env variable");
  process.exit(1);
}

let secretKey;
try {
  const decoded = Buffer.from(process.env.REPAIR_SECRET, "base64").toString("utf8");
  secretKey = Uint8Array.from(JSON.parse(decoded));
} catch (e) {
  console.error("❌ Failed to parse REPAIR_SECRET:", e.message);
  process.exit(1);
}

const fromWallet = Keypair.fromSecretKey(secretKey);

// ✅ Set up your custom Solana RPC
const connection = new Connection(
  "https://bold-powerful-film.solana-mainnet.quiknode.pro/3e3c22206acbd0918412343760560cbb96a4e9e4",
  "confirmed"
);

// ✅ Your GTG Token Mint
const GTG_MINT = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon");

(async () => {
  console.log("🚀 Starting GTG airdrop...");

  let holders;
  try {
    holders = JSON.parse(fs.readFileSync("./data/gtg-holders.json"));
  } catch (err) {
    console.error("❌ Failed to read holders file:", err.message);
    process.exit(1);
  }

  // ✅ Load sender token account
  const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    GTG_MINT,
    fromWallet.publicKey
  );

  for (const holder of holders) {
    try {
      const wallet = new PublicKey(holder.wallet);
      const amount = parseFloat(holder.amount);

      if (isNaN(amount) || amount <= 0) {
        console.log(`⚠️ Skipping invalid or zero amount for ${holder.wallet}`);
        continue;
      }

      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        GTG_MINT,
        wallet
      );

      const tx = new Transaction().add(
        createTransferInstruction(
          senderTokenAccount.address,
          recipientTokenAccount.address,
          fromWallet.publicKey,
          amount * 1_000_000, // GTG has 6 decimals
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const signature = await sendAndConfirmTransaction(connection, tx, [fromWallet]);
      console.log(`✅ Sent ${amount} GTG to ${holder.wallet} | Tx: https://solscan.io/tx/${signature}`);
    } catch (err) {
      console.error(`❌ Error sending to ${holder.wallet}: ${err.message}`);
    }
  }

  console.log("✅ Airdrop complete.");
})();
