const web3 =  require('@solana/web3.js');
const bs58 = require('bs58')

const fs = require("fs");
const chalk = require("chalk");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const keys = JSON.parse(fs.readFileSync(basePath+"/keys.json", "utf-8"));

module.exports.solanaWalletGen = async (name) => {
	var key = web3.Keypair.generate();
	var address = key.publicKey.toBase58();
	var privateKey = bs58.encode(key.secretKey);

    console.log(chalk.hex("6862F1")("Name:"), chalk.hex("13EAFD")(name));
    console.log(chalk.hex("6862F1")("Type:"), chalk.hex("13EAFD")("Solana"));
    console.log(
      chalk.hex("6862F1")("Wallet Address is:"),
      chalk.hex("13EAFD")(address)
    );
    console.log(
      chalk.hex("6862F1")("Private Key is:"),
      chalk.hex("13EAFD")(privateKey)
    );
    console.log(
      chalk.hex("46BOFE")("----------------------------------------------------------------------------------")
    );
    var array = {
      name: name,
      type: "Solana",
      walletAddress: address,
      privateKey: privateKey,
    };
    keys.push(array);
    fs.writeFileSync("keys.json", JSON.stringify(keys));
};