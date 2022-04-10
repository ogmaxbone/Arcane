const { Webhook, MessageBuilder } = require('discord-webhook-node');
const hook = new Webhook("https://discord.com/api/webhooks/954892240227016744/4e4JMXbFC_QNAbvnQDH3wrJ7BWseXhVyJGYiTpOXgR8C2sIECJcw506VmktwEBGKQ7-i");
 
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