const https = require("https");

module.exports = function(Bot, m, config) {
	var attributes = {
		"prefix": "prefix",
		"lib": "library",
		"invite": "invite_url",
		"invite link": "invite_url",
		"website": "website",
		"website link": "website"
	}
	var a = 0;
	var type = "";
	Object.keys(attributes).forEach(function(attr) {
		if (m.content.startsWith("what "+attr) || m.content.startsWith(attr+" for") || m.content.startsWith(attr+" to") || m.content.startsWith("what is the "+attr+" for") || m.content.startsWith("what is the "+attr+" to")) {
			a++;
			type = attr;
		}
	});
	if (a > 0) {
		console.log(1);
		if (m.mentions.length > 0) {
			console.log(1);
			if (m.member.guild.members.get(m.mentions[0].id).roles.indexOf("110374777914417152") > -1) {
				console.log(1);
				var lpath = "/api/bots/" + m.mentions[0].id;
				var options = {
					host: "bots.discord.pw",
					path: lpath,
					headers: {
						'Authorization': config.tokens.dbots
					}
				}
				var req = https.request(options, function(result){
					var body = "";
					result.on('data', function (chunk) {
						body += chunk;
					});
					result.on('end', function(){
						var data = JSON.parse(body);
						if (data[attributes[type]] != undefined || data[attributes[type]] != "") {
							var answer = "`"+data[attributes[type]]+"`";
							var n = "";
							if (type.startsWith("invite")) n = "n";
							Bot.createMessage(m.channel.id, "**"+m.mentions[0].username+"#"+m.mentions[0].discriminator+"** uses "+answer+" as a"+n+" "+type);
						} else {
							Bot.createMessage(m.channel.id, "An error has occured");
						}
					});
				});
				req.end();
			}
		}
	}
}