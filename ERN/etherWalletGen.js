const Web3 = require("web3");
const fs = require("fs");
var provider =
  "https://eth.getblock.io/dedicated/mainnet/233b3849-8a76-4a58-a518-ba58f07ff649/";
var web3Provider = new Web3.providers.HttpProvider(provider);
var web3 = new Web3(web3Provider);
var chalk = require("chalk");

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const keys = JSON.parse(fs.readFileSync(basePath + "/keys.json", "utf-8"));


module.exports.etherWalletGen = function (name) {
    createWallet = (cb) => {
      cb(web3.eth.accounts.create());
    };

    createWallet((result) => {
      console.log(chalk.hex("6862F1")("Name:"), chalk.hex("13EAFD")(name));
      console.log(
        chalk.hex("6862F1")("Type:"),
        chalk.hex("13EAFD")("Ethereum")
      );
      console.log(
        chalk.hex("6862F1")("Wallet Address is:"),
        chalk.hex("13EAFD")(result.address)
      );
      console.log(
        chalk.hex("6862F1")("Private Key is:"),
        chalk.hex("13EAFD")(result.privateKey)
      );

      console.log(
        chalk.hex("46BOFE")("----------------------------------------------------------------------------------")
      );

      var array = {
        name: name,
        type: "Ethereum",
        walletAddress: result.address,
        privateKey: result.privateKey,
      };
      keys.push(array);
      fs.writeFileSync("keys.json", JSON.stringify(keys));
    });
};
