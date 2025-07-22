import { exec } from "child_process";

function runScript(label, file) {
  return new Promise((resolve, reject) => {
    console.log(`➡️ Starting ${label}...`);
    exec(`node ${file}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ ${label} failed: ${stderr}`);
        reject(error);
      } else {
        console.log(`✅ ${label} done:\n${stdout}`);
        resolve();
      }
    });
  });
}

async function main() {
  try {
    await runScript("Holders", "./scripts/holders.cjs");
    await runScript("Airdrop", "./scripts/airdrop.cjs");
    await runScript("Burn", "./scripts/burn.cjs");
    await runScript("Bonus", "./scripts/bonus7.js");
    console.log("🎉 All tasks complete.");
  } catch (e) {
    console.error("🚨 One or more tasks failed.");
  }
}

main();

