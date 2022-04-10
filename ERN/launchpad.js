/// <reference no-default-lib="true"/>
const anchor = require("@project-serum/anchor");
const async = require('async');
const fs = require('fs');
const chalk = require('chalk')
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);

var counter = 0;

var tasks = JSON.parse(fs.readFileSync(basePath+'/tasks.json', 'utf-8'));

var settings = fs.readFileSync(basePath+ "/settings.json", "utf-8");
settings = JSON.parse(settings)

var proxies = fs.readFileSync(basePath+ "/proxies.json", "utf-8");
proxies = JSON.parse(proxies)

var webhook = settings.Webhook;
var monitorDelay = settings.Monitor;
var retryDelay = settings.Retry;

const {
    Program,
    Provider,
    BN,
    Wallet
} =  require('@project-serum/anchor');

const { MintLayout, Token } = require('@solana/spl-token');
const bs58 = require("bs58");
const fetch = require("node-fetch");

const {
    getAtaForMint,
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
} = require('./utils.js');

const { Transaction } = require("@solana/web3.js");


const { Connection, PublicKey, Keypair } = require("@solana/web3.js");

//const CANDY_MACHINE_PROGRAM = new PublicKey('6yW1eQcwu1vWrWfGd1Jjtx2yNTZLhFCkCztkB1g8synQ');

const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const MAGIC_EDEN_CANDY_MACHINE = new PublicKey("CMZYPASGWeTz7RNGHaRJfCq2XQ5pYK6nDvVQxzkH51zb");
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
const ME_NOTARY = new PublicKey('71R43w8efa2H6T3pQR7Hif8nj5A3ow2bnx6dAzYJBffP')
const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111')
const SYSTEM_RENT_PROGRAM = new PublicKey('SysvarRent111111111111111111111111111111111')
const TOKEN_METADATA_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const SLT_HASH = new PublicKey("SysvarS1otHashes111111111111111111111111111")

const connection = new Connection("https://api.mainnet-beta.solana.com");

const SECRET_KEY = '4nPYDNBq72wyuRm7rHsn4T2b2ApJPDm5hGZfj98HH9ACR63QDZjzS7oztBXZLa1ckqmSycwSCaxag8ocoY1MGEkX'

class Launchpad {
    constructor(launchpad) {
  
      this.launchpad = launchpad;

      var keys = fs.readFileSync(basePath+"/keys.json", "utf-8");
      keys = JSON.parse(keys);
  
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].name === this.launchpad.walletName) {
          this.KEY= keys[i].privateKey
        }
      }
  
      this.SECRET_KEY = this.KEY;

     this.payerWallet = Keypair.fromSecretKey(bs58.decode(this.SECRET_KEY));
     this.anchorPayerWallet = {
        publicKey: this.payerWallet.publicKey,
        signAllTransactions: this.payerWallet.signAllTransactions,
        signTransaction: this.payerWallet.signTransaction,
        };
     this.CANDY_MACHINE_PROGRAM = new PublicKey(this.launchpad.mintAddress);
     this.TASK_ID = makeid(5);
    //  if (this.launchpad.proxy === true){
    //     this.PROXY = proxies[counter].toString()
    //   }


      start(this.anchorPayerWallet, this.TASK_ID, this.launchpad.proxy, this.CANDY_MACHINE_PROGRAM, this.payerWallet, this.launchpad.walletName)

    }
}

const createAssociatedTokenAccountInstruction = (associatedTokenAddress, payer, walletAddress, splTokenMintAddress) => {
    const keys = [
        { pubkey: payer, isSigner: true, isWritable: true },
        { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
        { pubkey: walletAddress, isSigner: false, isWritable: false },
        { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
            pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        },
    ];
    return new anchor.web3.TransactionInstruction({
        keys,
        programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
        data: Buffer.from([]),
    });
};

const getMasterEdition = async (mint) => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
                Buffer.from('edition'),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

const getMetadata = async (mint) => {
    return (
        await anchor.web3.PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

const getWalletLimitInfo = async (candyMachine, payer) => {
    //console.log(`getWalletLimitInfo ${candyMachine}`)

    return await anchor.web3.PublicKey.findProgramAddress(
        [
            Buffer.from("wallet_limit"), 
            candyMachine.toBuffer(), 
            payer.toBuffer()
        ], 
        MAGIC_EDEN_CANDY_MACHINE
        );
};

const getLaunchStages = async (candyMachine) => {
    //console.log(`getLaunchStages ${candyMachine}`)

    return await anchor.web3.PublicKey.findProgramAddress(
        [
            Buffer.from("candy_machine"), 
            Buffer.from("launch_stages"), 
            candyMachine.toBuffer()
        ], 
        MAGIC_EDEN_CANDY_MACHINE
    );
};

const getCandyMachineState = async (anchorWallet, candyMachineId, connection, launchpad) => {
    const provider = new anchor.Provider(connection, anchorWallet, {
        preflightCommitment: "recent"
    });
    
    let programID = candyMachineId;
    //console.log(programID)
    if (launchpad) programID = MAGIC_EDEN_CANDY_MACHINE;
    const idl = await anchor.Program.fetchIdl(programID, provider);
    const program = new anchor.Program(idl, programID, provider);
    const state = await program.account.candyMachine.fetch(candyMachineId);

    const newState =
        {
            ...state,
            id: candyMachineId,
            program,
        }

    //console.log(newState)

    return newState;
};

const mintOneTokenME = async (payer, candyMachine, TASK_ID, usesProxy, payerWallet, image, mintName, wallet) => {
    const mint = anchor.web3.Keypair.generate();
 
    const connection = candyMachine.program.provider.connection;
    const program = candyMachine.program;
    const candyMachineAddress = candyMachine.id;

    const secret = bs58.encode(Buffer.from("we live to fight another day"));
    const secret2 = bs58.decode("CsHBKCFPzwvvST");

    // CsHBKCFPzwvvWs
    // CsHBKCFPzwvvDD
    // CsHBKCFPzwvvST
    // CsHBKCFPzwvvHd

    const launchStages = await getLaunchStages(candyMachineAddress);
    const userTokenAccountAddress = (await getAtaForMint(mint.publicKey, payer))[0];
    const metadataAddress = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);
    const [walletLimitInfo] = await getWalletLimitInfo(candyMachineAddress, payer);

    //console.log(walletLimitInfo)
    //console.log(launchStages)

    //console.log(candyMachine.orderInfo)

    const instructions =
        [
            anchor.web3.SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: mint.publicKey,
                space: MintLayout.span,
                lamports: await candyMachine.program.provider.connection.getMinimumBalanceForRentExemption(MintLayout.span),
                programId: TOKEN_PROGRAM_ID
            }),

            new anchor.web3.TransactionInstruction({
                programId: MEMO_PROGRAM_ID,
                keys: [],
                data: Buffer.from(secret)
            }),

            Token.createInitMintInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                0,
                payer,
                payer
            ),

            createAssociatedTokenAccountInstruction(
                userTokenAccountAddress,
                payer,
                payer,
                mint.publicKey
            ),

            Token.createMintToInstruction(
                TOKEN_PROGRAM_ID,
                mint.publicKey,
                userTokenAccountAddress,
                payer,
                [],
                1
            ),

            

            new anchor.web3.TransactionInstruction({
                programId: MAGIC_EDEN_CANDY_MACHINE,
                keys: [
                    {
                        pubkey: candyMachine.config,
                        isSigner: false,
                        isWritable: false,
                    },
                    {       
                        pubkey: candyMachineAddress,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: payer,
                        isSigner: true,
                        isWritable: false,
                    },
                    {
                        pubkey: launchStages[0],
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: candyMachine.wallet,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: metadataAddress,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: mint.publicKey,
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: userTokenAccountAddress,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: payer,
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: payer,
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: masterEdition,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: walletLimitInfo,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: candyMachine.orderInfo,
                        isSigner: false,
                        isWritable: true,
                    },
                    {
                        pubkey: SLT_HASH,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: TOKEN_METADATA_ID,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: TOKEN_PROGRAM_ID,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: SYSTEM_PROGRAM_ID,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: SYSTEM_RENT_PROGRAM,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: SYSTEM_PROGRAM_ID,
                        isSigner: false,
                        isWritable: false,
                    },
                    {
                        pubkey: payer,
                        isSigner: true,
                        isWritable: true,
                    },
                    {
                        pubkey: ME_NOTARY,
                        isSigner: true,
                        isWritable: false,
                    },
                ],
                data: Buffer.from(secret2)
            }),
        ];

    let g = new Transaction()
    g.instructions = instructions;

    const recentHash = await connection.getRecentBlockhash("finalized");
    g.recentBlockhash = recentHash.blockhash;
    g.feePayer = program.provider.wallet.publicKey;
    const h = bs58.encode(g.serializeMessage());
    var date = new Date;
    console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Constructing mint instructions')))

    //console.log(h)
    //console.log(g.serializeMessage().toString("base64"));
try {
    if (usesProxy=== true){
        var PROXY = proxies[counter].toString();
        var options = {
          "poptls-url":"https://wk-notary-prod.magiceden.io/sign",
          "poptls-proxy":  PROXY,
          'authority': 'wk-notary-prod.magiceden.io',
          'ar_session_token':'stub-until-arkose-is-fixed',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'accept-language': 'en-US,en;q=0.9',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
          'content-type': 'application/json',
          'accept': 'application/json, text/plain, */*',
          'sec-ch-ua-platform': '"Windows"',
          'origin': 'https://magiceden.io',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://magiceden.io/',
        }
      }
      else {
      var options = {
        "poptls-url":"https://wk-notary-prod.magiceden.io/sign",
        'authority': 'wk-notary-prod.magiceden.io',
        'ar_session_token':'stub-until-arkose-is-fixed',
        'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'accept-language': 'en-US,en;q=0.9',
        'sec-ch-ua-mobile': '?0',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36',
        'content-type': 'application/json',
        'accept': 'application/json, text/plain, */*',
        'sec-ch-ua-platform': '"Windows"',
        'origin': 'https://magiceden.io',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://magiceden.io/',
      }
   }
    let r = await fetch("http://127.0.0.1:8082", {
        "headers": options,
        "body": "{\"response\":\"\",\"message\":\""+h+"\"}",
        "method": "POST"
    })
    

    let json = await r.json()
    //console.log(json, r.status)
    //status 401 and response === no active stage (ended)
    const signature = json.signature
    //console.log(signature)
    console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Signing transaction')))

    //console.log("Notary signature")
    //console.log(signature)

        g.sign(payerWallet);
        g.partialSign(mint);
        g.addSignature(ME_NOTARY, bs58.decode(signature));

        for(const instruction of instructions){
            //console.log("Program:")
            //console.log(instruction.programId.toBase58());
            //console.log("Keys:")
            for(const key of instruction.keys){
                //console.log(key.pubkey.toBase58());
            }
            //console.log("Data:")
            //console.log(instruction.data.toString())
            //console.log()
        }
        //console.log("Signatures")
        for(const signature of g.signatures){
            //console.log(signature.publicKey.toBase58());
        }
        //console.log()

        //console.log(g.serializeMessage().toString("base64"))

        const ltx = g.serialize({
            verifySignatures: false
        });



        const txid = await connection.sendRawTransaction(ltx, {skipPreflight:false});
        const hook = new Webhook("https://discord.com/api/webhooks/954892240227016744/4e4JMXbFC_QNAbvnQDH3wrJ7BWseXhVyJGYiTpOXgR8C2sIECJcw506VmktwEBGKQ7-i");
 
        const embed = new MessageBuilder()
        .setTitle('Successful Mint')
        .addField('Module', 'Magic Eden Launchpad')
        .addField('Product', mintName)
        .addField('Wallet', `||${wallet}||`)
        .setColor('#AC3BFF')
        .setThumbnail(image)
        .setFooter('Arcane', 'https://pbs.twimg.com/profile_images/1494826127227080704/O_IswVJq_400x400.png')
        .setTimestamp();
        
        hook.send(embed);
        return [txid];
    } catch (err) {
            //console.log(err)
    if (err.toString().includes('invalid json response body')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Mint ended or not whitelisted')))
        stop()
    }
    else if (err.toString().includes('reason: socket hang up')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Socket hang up')))
        await sleep(5000)
        await mintOneTokenME (payer, candyMachine, TASK_ID, usesProxy, payerWallet)
        //await this.buy_nft(seller, price, auction_house, mint_token, tokenATA, sellerReferral, buyer)
      }
    else {
        //console.log(err)
        if (err.toString().includes("Transaction simulation failed: Error processing Instruction 5: custom program error: 0xbc2")){
            var clearLastLines = (count) => {
                process.stdout.moveCursor(0, -count)
                process.stdout.clearScreenDown()
              }
              clearLastLines(37)
              var date = new Date
              console.log(chalk.red(`[Task ID: ${TASK_ID}]`+'[Module: Magic Eden Sniper]',`[${date.toUTCString()}]`,'- '+ "Transaction failed"))
        }
        stop()
    }
    }

    return [];
};




async function nftDetails(usesProxy, TASK_ID){
    try {
        if (usesProxy=== true){
            var PROXY = proxies[counter].toString();
            var options = {
                "poptls-url": "https://api-mainnet.magiceden.io/launchpads/parcl",
                "poptls-proxy":  PROXY,
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
        else{
        var options = {
            "poptls-url": "https://api-mainnet.magiceden.io/launchpads/parcl",
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
        })

        var json = await r.json()
        var image = json.image
        var mintName = json.name
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.yellow('Getting mint details')))
        return [image, mintName]    
        }
        catch (err) {
            //console.log(err)
    if (err.toString().includes('invalid json response body')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Mint nonexistent')))
        stop()
    }
    else if (err.toString().includes('reason: socket hang up')){
        var date = new Date;
        console.log(chalk.hex("13EAFD")(`[Task ID: ${TASK_ID}]`) +chalk.hex("13EAFD")('[Module: Magic Eden Launchpad]' + chalk.hex("13EAFD")(`[${date.toUTCString()}]`),chalk.white('- ') + chalk.red('Socket hang up')))
        await sleep(5000)
        await nftDetails(usesProxy, TASK_ID)
      }
    else {
        console.log(err)
        stop()
    }
    }
    }


const start = async (anchorPayerWallet, id, usesProxy, CANDY_MACHINE_PROGRAM, payerWallet, wallet) => {

    counter++

    var details = await nftDetails(usesProxy,id);

    const state = await getCandyMachineState(anchorPayerWallet, new PublicKey(CANDY_MACHINE_PROGRAM), connection, true)
    //console.log(state)
    const tx = await mintOneTokenME(anchorPayerWallet.publicKey, state, id, usesProxy, payerWallet, details[0], details[1], wallet)
    //console.log(tx)
    //if (tx.toString() === '[]'){
       // console.log("Transaction Failed")
   // }

}

async function stop() {
    counter--;
    if (counter === 0){
      console.log(
        chalk.hex("46BOFE")("----------------------------------------------------------------------------------")
      );  
    }
   return;
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
  function getCounterLaunchpad (){
    return counter;
  }

module.exports.Launchpad = Launchpad;
module.exports.getCounterLaunchpad = getCounterLaunchpad;

// async.each(tasks.launchpad, function (launchpad) {
//     new Launchpad(launchpad);
//   })