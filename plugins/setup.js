let e = module.exports = {};

const asink = require('async');

e.dependencies = ['discordjs'];

e.init = function(Bot) {
	Bot.client.on('guildCreate', guild => {
		guild.createRole({ name: 'Bot Commander' })
			.then(role => {})
			.catch(err => {
				if (err)
					return Bot.util.logger.error('error', err);
			});
		guild.createChannel('mod-log', 'text')
			.then(channel => {})
			.catch(err => {
				Bot.util.logger.error('error', err);
			});
	});
};
