const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

function runScript(name, file) {
  return new Promise((resolve) => {
    console.log(`➡️ Starting {name}...`);
    exec(`node {file}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ {name} failed:`, stderr.trim());
      } else {
        console.log(`✅ {name} done:`);
        console.log(stdout.trim());
      }
      resolve();
    });
  });
}

function shouldRun(scriptName, hoursInterval) {
  const timestampFile = path.join(__dirname, `./.last-run-{scriptName}.txt`);
  const now = new Date();

  if (!fs.existsSync(timestampFile)) return true;

  const lastRun = new Date(fs.readFileSync(timestampFile, "utf8"));
  const diffHours = (now - lastRun) / (1000 * 60 * 60);
  return diffHours >= hoursInterval;
}

function markRun(scriptName) {
  const timestampFile = path.join(__dirname, `./.last-run-{scriptName}.txt`);
  fs.writeFileSync(timestampFile, new Date().toISOString());
}

(async () => {
  if (shouldRun("holders", 1)) {
    await runScript("Holders", "./scripts/holders.cjs");
    markRun("holders");
  } else {
    console.log("⏭️ Holders skipped (already run within 1 hour)");
  }

  if (shouldRun("airdrop", 4)) {
    await runScript("Airdrop", "./scripts/airdrop.cjs");
    markRun("airdrop");
  } else {
    console.log("⏭️ Airdrop skipped (already run within 4 hours)");
  }

  if (shouldRun("burn", 4)) {
    await runScript("Burn", "./scripts/burn.cjs");
    markRun("burn");
  } else {
    console.log("⏭️ Burn skipped (already run within 4 hours)");
  }

  if (shouldRun("bonus7", 24)) {
    await runScript("Bonus7", "./scripts/bonus7.cjs");
    markRun("bonus7");
  } else {
    console.log("⏭️ Bonus7 skipped (already run today)");
  }
})();
