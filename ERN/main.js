const figlet = require("figlet");
const chalk = require("chalk");
const setTitle = require("console-title");
const { Select, Input, List } = require("enquirer");
const fs = require("fs");
const async = require('async');
const CSVToJSON = require('csvtojson');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const {Instance, getCounterSniper} = require('./sniper')
const {Launchpad, getCounterLaunchpad} = require('./launchpad')

const bit = require('os').arch()
const system = process.platform
const { execFile } = require('child_process');

const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);

var tasks;

var settingsPath = basePath + "/settings.json";
var keysPath = basePath + "/keys.json";
var tasksPath = basePath + "/tasks.json";
var proxyPath = basePath+'/proxies.json'

var myscript;

if (bit === 'x64' && system === "darwin"){
  myscript = execFile(basePath + '/tls/app-amd64-darwin')
}
else if (bit === 'x64' && system == 'win32'){
  myscript = execFile(basePath + '/tls/windows64bit.exe')
}
else if (bit === 'x32' && system == 'win32'){
  myscript = execFile(basePath + '/tls/windows32bit.exe')
}




if (!fs.existsSync(settingsPath)) {
  var setting = {
    key: "",
    monitor: 1000,
    retry: 1000,
    ethereumRPC: "",
    solanaRPC: "",
    webhook: "",
  };
  settings = JSON.stringify(setting);
  fs.writeFileSync(settingsPath, settings);
}

if (!fs.existsSync(proxyPath)) {
m}

if (!fs.existsSync(keysPath)) {
  fs.writeFileSync(keysPath, "[]");
}

const { solanaWalletGen } = require("./solanaWalletGen");
const { etherWalletGen } = require("./etherWalletGen");

var solanaWalletCount = 0;
var etherWalletCount = 0;
var sniperCount = 0;
var launchpadCount = 0;
if (!fs.existsSync(tasksPath)) {
  var taskFormat = {
    "sniper": [],
    "launchpad":[]
  }
  fs.writeFileSync(tasksPath, JSON.stringify(taskFormat));
  tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
  sniperCount = 0;
  launchpadCount = 0;
  }
else{
  tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
  sniperCount = tasks.sniper.length
  launchpadCount = tasks.launchpad.length
}
if (JSON.parse(fs.readFileSync(keysPath, "utf-8")).length === 0) {
  solanaWalletCount = 0;
} else {
  for (
    var i = 0;
    i < JSON.parse(fs.readFileSync(keysPath, "utf-8")).length;
    i++
  ) {
    if (
      JSON.parse(fs.readFileSync(keysPath, "utf-8"))[i]["type"] === "Solana"
    ) {
      solanaWalletCount++;
    }
  }
}

if (JSON.parse(fs.readFileSync(keysPath, "utf-8")).length === 0) {
  etherWalletCount = 0;
} else {
  for (
    var i = 0;
    i < JSON.parse(fs.readFileSync(keysPath, "utf-8")).length;
    i++
  ) {
    if (
      JSON.parse(fs.readFileSync(keysPath, "utf-8"))[i]["type"] === "Ethereum"
    ) {
      etherWalletCount++;
    }
  }
}
console.clear();
setTitle("Arcane v.0.0.1");
console.log(chalk.hex("46BOFE")(figlet.textSync("\t\tARCANE")));
console.log(
  chalk.hex("46BOFE")("------------------------------------------------")
);
console.log(
  chalk.hex("6862F1")("Magical NFT automation curated for excellence")
);
console.log(
  chalk.hex("46BOFE")("-------------------------------------------------\n")
);

function cli () {
  const prompt = new Select({
    name: "module",
    message: chalk.hex("AC3BFF")("Choose a module:\n"),
    choices: [
      chalk.hex("13EAFD")("Ethereum"),
      chalk.hex("13EAFD")("Solana"),
      chalk.hex("13EAFD")("Settings"),
    ],
  });

  prompt.run().then((answer) => {
    if (answer === chalk.hex("13EAFD")("Solana")) {
      solana();
    }
    if (answer === chalk.hex("13EAFD")("Ethereum")) {
      ethereum();
    }
    if (answer === chalk.hex("13EAFD")("Settings")) {
      settingsPrompt();
    }
  });
}

cli();

function solana() {
  const Solana = new Select({
    //name: 'Solana',
    message: chalk.hex("AC3BFF")("Choose a Solana module:\n"),
    choices: [
      chalk.hex("13EAFD")(`Magic Eden Sniper (${sniperCount} task(s) loaded)`),
      chalk.hex("13EAFD")(`Magic Eden Launchpad (${launchpadCount} task(s) loaded)`),
      chalk.hex("13EAFD")("Wallet Generator (" + solanaWalletCount + " total)"),
      chalk.hex("13EAFD")("\nReturn to menu"),
    ],
  });
  Solana.run()
    .then((answer) => {
      console.log(
        chalk.hex("46BOFE")("-------------------------------------------------")
      );
      if (answer.includes("Wallet Generator")) {
        const walletGen = new List({
          name: "number",
          message: chalk.hex("AC3BFF")(
            "Please enter name(s) of wallet seperated by comma:"
          ),
        });

        walletGen
          .run()
          .then((answer) => {
            for (var i = 0; i < answer.length; i++) {
              solanaWalletGen(answer[i]);
            }
            cli()
          })
          .catch(console.error);
      }
      if (answer.includes("Sniper")) {
        const sniper = new Select({
          name: "Solana Modules",
          message: chalk.hex("AC3BFF")("Choose an option below:\n"),
          choices: [
            chalk.hex("13EAFD")("Import Tasks"),
            chalk.hex("13EAFD")("Create Tasks"),
            chalk.hex("13EAFD")("Start Tasks"),
            chalk.hex("13EAFD")("List Tasks"),
            chalk.hex("13EAFD")("Delete Tasks"),
            chalk.hex("13EAFD")("\nReturn to menu")
          ],
        });


      
        sniper.run().then(async (answer)  => {
          if (answer === chalk.hex("13EAFD")("Start Tasks")) {
            console.log(
              chalk.hex("46BOFE")("-------------------------------------------------")
            );
             tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
             async.each(tasks.sniper, function (sniper) {
              new Instance(sniper);
            })
            sniperStop()
           
          }
          if (answer === chalk.hex("13EAFD")("List Tasks")) {
            //ethereum();
          }
          if (answer === chalk.hex("13EAFD")("Import Tasks")) {
            var type = "sniper";
            importTasks(type)
            tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
            sniperCount = tasks.sniper.length
          }
           if (answer.includes("Return to menu")) {
        cli()
        }
        });
      }

      if (answer.includes("Launchpad")) {
        const launchpad = new Select({
          name: "Solana Modules",
          message: chalk.hex("AC3BFF")("Choose an option below:\n"),
          choices: [
            chalk.hex("13EAFD")("Import Tasks"),
            chalk.hex("13EAFD")("Create Tasks"),
            chalk.hex("13EAFD")("Start Tasks"),
            chalk.hex("13EAFD")("List Tasks"),
            chalk.hex("13EAFD")("Delete Tasks"),
            chalk.hex("13EAFD")("\nReturn to menu")
          ],
        });


      
        launchpad.run().then(async (answer)  => {
          if (answer === chalk.hex("13EAFD")("Start Tasks")) {
            console.log(
              chalk.hex("46BOFE")("-------------------------------------------------")
            );
             tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
             async.each(tasks.launchpad, function (launchpad) {
              new Launchpad(launchpad);
            })
            launchpadStop()
          }
          if (answer === chalk.hex("13EAFD")("List Tasks")) {
            //ethereum();
          }
          if (answer === chalk.hex("13EAFD")("Import Tasks")) {
            var type = "launchpad";
            importTasks(type)
            tasks = JSON.parse(fs.readFileSync(basePath + "/tasks.json", "utf-8"));
            launchpadCount = tasks.launchpad.length
          }

          if (answer.includes("Return to menu")) {
            cli()
            }
        });

      }

      if (answer.includes("Return to menu")) {
        cli()
        }

    })
    .catch(console.error);
}

function ethereum() {
  const Ethereum = new Select({
    //name: 'Solana',
    message: chalk.hex("AC3BFF")("Choose a Ethereum module:\n"),
    choices: [
      chalk.hex("13EAFD")("Wallet Generator (" + etherWalletCount + " total)"),
      chalk.hex("13EAFD")("Contract Minter (0 tasks loaded)"),
      chalk.hex("13EAFD")("\nReturn to menu"),
    ],p
  });
  Ethereum.run()
    .then((answer) => {
      console.log(
        chalk.hex("46BOFE")("-------------------------------------------------")
      );

      if (answer.includes("Return to menu")) {
        cli()
        }

      if (answer.includes("Wallet Generator")) {
        const walletGen2 = new List({
          name: "number",
          message: chalk.hex("AC3BFF")(
            "Please enter name(s) of wallet seperated by comma:"
          ),
        });

        walletGen2
          .run()
          .then((answer) => {
            for (var i = 0; i < answer.length; i++) {
              etherWalletGen(answer[i]);
            }
            cli()
          })
          .catch(console.error);
      }
    })
    .catch(console.error);
}

function settingsPrompt() {
  const Settings = new Select({
    //name: 'Solana',
    message: chalk.hex("AC3BFF")("Choose an option below:\n"),
    choices: [
      chalk.hex("13EAFD")("Set Discord webhook"),
      chalk.hex("13EAFD")("Set monitor delay"),
      chalk.hex("13EAFD")("Set retry delay"),
      chalk.hex("13EAFD")("Set Ethereum RPC"),
      chalk.hex("13EAFD")("Set Solana RPC"),
      chalk.hex("13EAFD")("\nReturn to menu"),
    ],
  });
  Settings.run()
    .then((answer) => {
      console.log(
        chalk.hex("46BOFE")("-------------------------------------------------")
      );

      if (answer.includes("Return to menu")) {
        cli()
        }

      if (answer.includes('webhook')){
        var setHook = new Input({
          message: chalk.hex("AC3BFF")('Enter webhook')});

        setHook.run()
          .then(async (answer) => {
           var settings =  fs.readFileSync(settingsPath, 'utf-8')
           settings = JSON.parse(settings)
           settings.webhook = answer;
           await fs.writeFileSync(settingsPath, JSON.stringify(settings))
           await sleep(500)
           await cli()
           var hook = new Webhook(answer);
           const embed = new MessageBuilder()
           .setTitle('Successful Checkout')
           .addField('Module', 'Test Hook')
           .addField('Product', 'Best Buds #2360')
           .addField('Price', '420')
           .addField('Wallet', '||Max 1||')
           .setColor('#AC3BFF')
           .setThumbnail('https://img-cdn.magiceden.dev/rs:fill:640:640:0:0/plain/https://bafybeic26iswsk4pvvacltfafbnsijni7nvx5zvhkctieede6qb77i4et4.ipfs.dweb.link/2360.png?ext=png')
           .setFooter('Arcane', 'https://pbs.twimg.com/profile_images/1494826127227080704/O_IswVJq_400x400.png')
           .setTimestamp();
            
           hook.send(embed);
          })
          .catch(console.error);
      }

      if (answer.includes('monitor')){
        var setMonitor = new Input({
          message: chalk.hex("AC3BFF")('Enter monitor delay')});
          
        setMonitor.run()
          .then(async (answer) => {
           var settings =  fs.readFileSync(settingsPath, 'utf-8')
           settings = JSON.parse(settings)
           settings.monitor = answer;
           await fs.writeFileSync(settingsPath, JSON.stringify(settings))
           await sleep(500)
           await cli()
          })
          .catch(console.error);
      }

      if (answer.includes('retry')){
        var setRetry = new Input({
          message: chalk.hex("AC3BFF")('Enter retry delay')});
          
        setRetry.run()
          .then(async (answer) => {
           var settings =  fs.readFileSync(settingsPath, 'utf-8')
           settings = JSON.parse(settings)
           settings.retry = answer;
           await fs.writeFileSync(settingsPath, JSON.stringify(settings))
           await sleep(500)
           await cli()
          })
          .catch(console.error);
      }

      if (answer.includes('Ethereum')){
        var setEth = new Input({
          message: chalk.hex("AC3BFF")('Enter Ethereum RPC')});
          
        setEth.run()
          .then(async (answer) => {
           var settings =  fs.readFileSync(settingsPath, 'utf-8')
           settings = JSON.parse(settings)
           settings.ethereumRPC = answer;
           await fs.writeFileSync(settingsPath, JSON.stringify(settings))
           await sleep(500)
           await cli()
          })
          .catch(console.error);
      }

      if (answer.includes('Solana')){
        var setSol = new Input({
          message: chalk.hex("AC3BFF")('Enter Solana RPC')});
          
        setSol.run()
          .then(async (answer) => {
           var settings =  fs.readFileSync(settingsPath, 'utf-8')
           settings = JSON.parse(settings)
           settings.solanaRPC = answer;
           await fs.writeFileSync(settingsPath, JSON.stringify(settings))
           await sleep(500)
           await cli()
          })
          .catch(console.error);
      }

    })
    .catch(console.error);
}




function sniperStop (){
  var sniperTime = setTimeout(sniperStop,1000)
 if(getCounterSniper().toString() === '0'){
   clearTimeout(sniperTime)
   cli()
 }
}

function launchpadStop (){
  var launchpadTime = setTimeout(launchpadStop,1000)
 if(getCounterLaunchpad().toString() === '0'){
   clearTimeout(launchpadTime)
   cli()
 }
}



function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}




process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) myscript.kill('SIGINT');
    if (exitCode || exitCode === 0) myscript.kill('SIGINT');
    if (options.exit) myscript.kill('SIGINT')
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


async function importTasks (type){

  if (type === "sniper"){
    var sniperTasks = new Input({
      message: chalk.hex("AC3BFF")('Enter file path')});
      
    sniperTasks.run()
      .then(async (answer) => {
       var tasks1 =  fs.readFileSync(tasksPath, 'utf-8')
       tasks1 = JSON.parse(tasks1)
       await CSVToJSON().fromFile(answer.replace(/"/g,'').replace(/'/g,''))
       .then((jsonObj)=>{
         var arr = tasks1.sniper.concat(jsonObj)
         tasks1.sniper = arr
         fs.writeFile(tasksPath, JSON.stringify(tasks1, null, 2), (err) => {
           if (err) {
             console.log('')
             console.log(chalk.red('Error importing file.'))
             console.log('')
           }
           console.log('')
           console.log(chalk.green('Successfully imported ' + jsonObj.length + ' tasks!'));
           console.log('')
       })
       })
        await sleep(500)
        await cli()
      })
      .catch(console.error);
  }
  else if (type === "launchpad"){
    var launchpadTasks = new Input({
      message: chalk.hex("AC3BFF")('Enter file path')});
      
      launchpadTasks.run()
      .then(async (answer) => {
       var tasks1 =  fs.readFileSync(tasksPath, 'utf-8')
       tasks1 = JSON.parse(tasks1)
       await CSVToJSON().fromFile(answer.replace(/"/g,'').replace(/'/g,''))
       .then((jsonObj)=>{
         var arr = tasks1.launchpad.concat(jsonObj)
         tasks1.launchpad = arr
         fs.writeFile(tasksPath, JSON.stringify(tasks1, null, 2), (err) => {
           if (err) {
             console.log('')
             console.log(chalk.red('Error importing file.'))
             console.log('')
           }
           console.log('')
           console.log(chalk.green('Successfully imported ' + jsonObj.length + ' tasks!'));
           console.log('')
       })
       })
        await sleep(500)
        await cli()
      })
      .catch(console.error);
  }
  
};
//importPath = answer.split('task-import ')[1].replace(/"/g,'')