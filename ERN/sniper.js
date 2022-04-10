const bs58 = require("bs58");
const web3 = require("@solana/web3.js");
const fetch = require("node-fetch");
const fs = require("fs");
const chalk = require('chalk')
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const { Keypair, Message } = require("@solana/web3.js");
const SOLANA_CLIENT = new web3.Connection("https://api.mainnet-beta.solana.com");
var counter = 0;

var settings = fs.readFileSync(basePath+ "/settings.json", "utf-8");
settings = JSON.parse(settings)

var proxies = fs.readFileSync(basePath+ "/proxies.json", "utf-8");
proxies = JSON.parse(proxies)

var webhook = settings.webhook;
var monitorDelay = settings.monitor;
var retryDelay = settings.retry;

 class Instance {
  constructor(sniper) {

    this.sniper = sniper;

    var keys = fs.readFileSync(basePath+"/keys.json", "utf-8");
    keys = JSON.parse(keys);


    for (var i = 0; i < keys.length; i++) {
      if (keys[i].name === this.sniper.walletName) {
        this.PUBLIC_KEY = keys[i].walletAddress
      }
    }
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].name === this.sniper.walletName) {
        this.KEY= keys[i].privateKey
      }
    }

    this.SECRET_KEY = bs58.decode(this.KEY);
    this.PAYER = Keypair.fromSecretKey(this.SECRET_KEY);
    this.WISH_PRICE = this.sniper.price;
    this.MINT_ADDRESS = this.sniper.mintAddress;
    this.transaction =  new web3.Transaction({});
    this.TASK_ID = makeid(5);

    if (this.sniper.proxy === true){
      this.PROXY = proxies[counter].toString()
    }

    this.start();
  }

  async start() {
    counter++
    await this.get_nft_info(this.MINT_ADDRESS, this.WISH_PRICE);
  }
  async stop() {
    counter--;
    if (counter === 0){
      console.log(
        chalk.hex("46BOFE")("----------------------------------------------------------------------------------")
      );  
    }
   return;
  }

  async get_nft_info(mint_address, buyPrice) {
    try {
      if (this.sniper.proxy === true){
        var options = {
          "poptls-url":"https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/" + mint_address +"",
          "poptls-proxy":  this.PROXY,
          "accept": "application/json, text/plain, */*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
          "sec-ch-ua-mobile": "?0",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "Referer": "https://www.magiceden.io/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "origin": "magiceden.io",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
        }
      }
      else {
      var options = {
        "poptls-url":"https://api-mainnet.magiceden.io/rpc/getNFTByMintAddress/" + mint_address +"",
        "accept": "application/json, text/plain, */*",
        "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://www.magiceden.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "origin": "magiceden.io",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      }
    }
      let r = await fetch("http://127.0.0.1:8082", {
        headers: options,
        "referrer": "https://www.magiceden.io/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit",
      });

      let status = await r.status;
      if (status === 200) {
        let json = await r.json();
        //console.log(json);
        this.IMAGE = json.results.img;
        this.TITLE = json.results.title;
        this.ITEM_PRICE = json.results.price;
        let price = json.results.price;
        if (price === 0){
          var date = new Date;
          console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('NFT not listed')))
          this.stop()
        }
        
        let seller = json.results.owner;
        let auction_house = json.results.v2.auctionHouseKey;
        let tokenATA = json.results.id;
        let sellerReferral = json.results.v2.sellerReferral;

        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Getting NFT details')))
        //console.log(chalk.magenta(`[Task ID: ` +chalk.blue(taskGen)+ chalk.magenta(']')+'[Store: '+chalk.blue(storeName)+chalk.magenta(']')+`[Product: ` +chalk.blue(sku)+chalk.magenta(']')+`[Profile: `+chalk.blue(profile)+chalk.magenta(']')+`[`+chalk.blue(n)+ `] `)+ chalk.cyan('Getting Payment Token'))

        if (price <= buyPrice){
          this.buy_nft(seller, price, auction_house, mint_address, tokenATA, sellerReferral, this.PUBLIC_KEY);
        }

        else {
          var date = new Date;
          console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Waiting for desired price or lower')))
            await sleep(monitorDelay)
            await this.get_nft_info(mint_address, buyPrice)
        }


      } 
      else {
        console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Failed getting NFT details:', status)))
      }
    } catch (err) {
      if (err.toString().includes('reason: socket hang up')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Socket hang up')))
        await sleep(retryDelay)
        await this.get_nft_info(mint_address, buyPrice)
      }
      //console.log(err)
    }
  }


  async buy_nft(seller, price, auction_house, mint_token, tokenATA, sellerReferral, buyer) {
    try {
      if (this.sniper.proxy === true){
        var options = {
          "poptls-url": `https://api-mainnet.magiceden.io/v2/instructions/buy_now?buyer=${buyer}&seller=${seller}&auctionHouseAddress=${auction_house}&tokenMint=${mint_token}&tokenATA=${tokenATA}&price=${price}&sellerReferral=${sellerReferral}&sellerExpiry=-1`,
          "poptls-proxy":  this.PROXY,
          "accept": "application/json, text/plain, */*",
          "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
          "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
          "sec-ch-ua-mobile": "?0",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "Referer": "https://www.magiceden.io/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "origin": "magiceden.io",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
        }
      }
      else {
      var options = {
        "poptls-url": `https://api-mainnet.magiceden.io/v2/instructions/buy_now?buyer=${buyer}&seller=${seller}&auctionHouseAddress=${auction_house}&tokenMint=${mint_token}&tokenATA=${tokenATA}&price=${price}&sellerReferral=${sellerReferral}&sellerExpiry=-1`,
        "accept": "application/json, text/plain, */*",
        "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "Referer": "https://www.magiceden.io/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "origin": "magiceden.io",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36",
      }
    }
      let r = await fetch("http://127.0.0.1:8082", {
        "headers": options,
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "omit",
      });
      let json = await r.json();
      //console.log(json)
      var data = json.tx.data;
      var date = new Date;
      console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Constructing transaction')))
      this.get_and_send_tx(data);
    } catch (err) {
      if (err.toString().includes('reason: socket hang up')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Socket hang up')))
        await sleep(retryDelay)
        await this.buy_nft(seller, price, auction_house, mint_token, tokenATA, sellerReferral, buyer)
      }
    }
  }

  async get_and_send_tx(data) {
    try {
     // var date = new Date;
     // console.log(chalk.hex("13EAFD")(`[Task ID: ${this.TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Sniper]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.orange('Submitting transaction')))
      var message = Message.from(data);
      let recentBlockhash = await SOLANA_CLIENT.getRecentBlockhash("finalized");
      var tx = await web3.Transaction.populate(message, []);
      tx.recentBlockhash = recentBlockhash.blockhash;
      tx.sign(this.PAYER);
      var txn = tx.serialize();
      //var encodeTransction = txn.toJSON();
      //encodeTransction = Buffer.from(encodeTransction).toString('base64')

      //console.log(encodeTransction)

      var final_tx = await SOLANA_CLIENT.sendRawTransaction(txn)
      var date = new Date
      console.log(chalk.green(`[Task ID: ${this.TASK_ID}]`+'[Module: Magic Eden Sniper]',`[${date.toUTCString()}]`,'- '+ 'Successfully purchased NFT: ' + final_tx))
      const hook = new Webhook(webhook);
      const publicHook = new Webhook('https://discord.com/api/webhooks/961491283820572733/aDZzsAmEG8SigFKlKCzYPqf4jn2-V3zOPY7LG_MDKg_MpJllMWSEvveExBSnzZuR8BLP');
      const embed = new MessageBuilder()
      .setTitle('Successful Checkout')
      .addField('Module', 'Magic Eden Sniper')
      .addField('Product', this.TITLE.toString())
      .addField('Price', this.ITEM_PRICE.toString())
      .addField('Wallet', `||${this.sniper.walletName.toString()}||`)
      .setColor('#00FF00')
      .setThumbnail(this.IMAGE.toString())
      .setFooter('Arcane', 'https://pbs.twimg.com/profile_images/1494826127227080704/O_IswVJq_400x400.png')
      .setTimestamp();
      hook.send(embed);
      publicHook.send(embed)
      this.stop()
      //this.send = true;
      //console.log('Successfully purchased NFT: ' + final_tx)
    } catch (err) {
      if(err.toString().includes('Attempt to debit an account but found no record of a prior credit.') === true){
        var date = new Date
        console.log(chalk.red(`[Task ID: ${this.TASK_ID}]`+'[Module: Magic Eden Sniper]',`[${date.toUTCString()}]`,'- '+ "Insufficient wallet funds"))
        this.stop()
      }
      else if (err.toString().includes('0x1')){
        var clearLastLines = (count) => {
          process.stdout.moveCursor(0, -count)
          process.stdout.clearScreenDown()
        }
        clearLastLines(8)
        var date = new Date
        console.log(chalk.red(`[Task ID: ${this.TASK_ID}]`+'[Module: Magic Eden Sniper]',`[${date.toUTCString()}]`,'- '+ "Insufficient wallet funds"))
        this.stop()
      }
      else {
        //console.log(err)
        console.log(chalk.red(`[Task ID: ${this.TASK_ID}]`+'[Module: Magic Eden Sniper]',`[${date.toUTCString()}]`,'- '+ "Unexpected error"))
        await sleep(5000)
        await this.get_and_send_tx(data)
      }
      //buy_nft()
      //console.log(err)
    }
  }


}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function makeid(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 return result;
}
function getCounterSniper (){
  return counter;
}

// async.each(tasks.sniper, function (sniper) {
//   new Instance(sniper);
// });

module.exports.Instance = Instance;
module.exports.getCounterSniper = getCounterSniper;