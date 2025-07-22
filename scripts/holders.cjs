
// holders.js — lists all GTG holders with > 20,000 GTG

const { Connection, PublicKey } = require("@solana/web3.js");
const { getParsedTokenAccountsByOwner } = require("@solana/spl-token");
const fs = require("fs");

const RPC = "https://bold-powerful-film.solana-mainnet.quiknode.pro/3e3c22206acbd0918412343760560cbb96a4e9e4";

const connection = new Connection(RPC, "confirmed");

const GTG_MINT = new PublicKey("4nm1ksSbynirCJoZcisGTzQ7c3XBEdxQUpN9EPpemoon");
const MIN_THRESHOLD = 20_000 * 1e9;

async function findGTGHolders() {
  const allAccounts = await connection.getProgramAccounts(
    new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    {
      filters: [
        { dataSize: 165 },
        {
          memcmp: {
            offset: 0,
            bytes: GTG_MINT.toBase58(),
          },
        },
      ],
    }
  );

  let qualifying = [];

  for (const acc of allAccounts) {
    const data = acc.account.data;
    const amount = data.readBigUInt64LE(64);
    if (amount >= BigInt(MIN_THRESHOLD)) {
      const owner = new PublicKey(data.slice(32, 64)).toBase58();
      qualifying.push({ owner, amount: Number(amount) / 1e9 });
    }
  }

  qualifying.sort((a, b) => b.amount - a.amount);
  console.log(`✅ Found ${qualifying.length} GTG holders with ≥ 20,000 GTG`);
for (const holder of qualifying) {
  console.log(`${holder.owner}: ${holder.amount.toLocaleString()} GTG`);
}

  fs.writeFileSync("data/gtg-holders.json", JSON.stringify(qualifying, null, 2));
  console.log("💾 Saved to gtg-holders.json");
}

findGTGHolders();
