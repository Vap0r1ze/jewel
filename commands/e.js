const request = require("request");

module.exports = {
	main: function(Bot, m, args) {
		var base = "http://emoji.getdango.com/api/emoji?q=";
		var query = args.replace(/ /g, "+");
		request.get({
			url: base+query,
			json: true
		}, function(error, res, data) {
			var emojis = [];
			data.results.forEach(function(result) {
				emojis.push(result.text);
			});
			emojis.splice(5, 5);
			Bot.createMessage(m.channel.id, emojis.join(" "));
		});
	},
	help: "Gives emoji-based response based on input"
}