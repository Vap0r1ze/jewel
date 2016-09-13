const fs = require("fs");
const reload = require("require-reload")(require);
const _ = require("../../data.js");

module.exports = {
	main: function(Bot, m, config) {
		reload("../../etc/bot_info.js")(Bot, m, config);
		var data = _.load();
		if (data.logs == undefined) data.logs = {channels: {}, users: {}};
		if (data.logs.channels[m.channel.id] == undefined) data.logs.channels[m.channel.id] = [];
		if (data.logs.users[m.author.id] == undefined) data.logs.users[m.author.id] = [];
		var log = {
			author: m.author.id,
			content: m.content,
			clientContent: m.cleanContent,
			attachments: m.attachments || [],
			channel: m.channel.id,
			guild: m.channel.guild.id,
			id: m.id,
			timestamp: m.timestamp,
			mentions: m.mentions || [],
			roleMentions: m.roleMentions || [],
			channelMentions: m.channelMentions || []
		}
		data.logs.users[m.author.id].push(log);
		data.logs.channels[m.channel.id].push(log);
		_.save(data);
	}
}
