const fs = require("fs");

module.exports = {
	main: function(Bot, m, args) {
		function getLogs(amount, messages, before, callback) {
			if (amount <= 100) {
				Bot.getMessages(m.channel.id, amount, before).then(function(marray) {
					marray.forEach(function(marrayitem) {
						messages.push(marrayitem);
					});
					callback(messages);
				}).catch(console.log)

			} else {
				amount = amount - 100;
				Bot.getMessages(m.channel.id, 100, before).then(function(marray) {
					marray.forEach(function(marrayitem) {
						messages.push(marrayitem);
					});
					getLogs(amount, messages, marray[99].id,callback);
				});
			}
		}
		if (m.mentions.length > 0) {
			var mention = new RegExp("<@!?"+m.mentions[0].id+"> ");
			args = args.replace(mention, "");
			var amount = parseInt(args);
			if (isNaN(amount) || amount > 1000 || amount < 1) {
				Bot.createMessage(m.channel.id, "Number must be within 1 and 1000");
			} else {
				getLogs(amount, [], m.id, function(messages) {
					var logs = [];
					var a = 0;
					messages.forEach(function(message) {
						if (message.author.id == m.mentions[0].id) {
							a++;
							logs.push(message.author.username + "#" + message.author.discriminator + ": " + message.content.replace(/\n/g, "\t\n"));
						}
					});
					if (logs.length > 0) {
						fs.writeFileSync("temp.txt", logs.join("\n"));
						Bot.createMessage(m.channel.id, "Last " + a + " messages by **" + m.mentions[0].username + "#" + m.mentions[0].discriminator + "**", {file: fs.readFileSync("temp.txt"), name: "logs.txt"});
					} else {
						Bot.createMessage(m.channel.id, "No messages by **" + m.mentions[0].username + "#" + m.mentions[0].discriminator + "** were found in the last " + args + " messages");
					}
				});
			}
		} else {
			getLogs(amount, [], m.id, function(messages) {
				var logs = messages;
				if (logs.length > 0) {
					fs.writeFileSync("temp.txt", logs.join("\n"));
					Bot.createMessage(m.channel.id, "Last " + a + " messages in <#*"+m.channel.id+">", {file: fs.readFileSync("temp.txt"), name: "logs.txt"});
				} else {
					Bot.createMessage(m.channel.id, "No messages by were found in the last " + args + " messages");
				}
			});
		}
	},
	help: "Gets last 1-1000 messages of a user or channel"
}