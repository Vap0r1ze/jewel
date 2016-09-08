const util = require("util");

module.exports = {
	main: function(Bot, m, args) {
		if (m.author.id == "140912052657979392") {
			var u;
			if (args.indexOf("--util") > -1) {
				u = true;
				args = args.replace("--util", "");
			} else {
				u = false;
			}
			var ev = eval(args);
			if (u) {
				ev = util.inspect(ev)
			}
			Bot.createMessage(m.channel.id, ev);
		}
	},
	help: "Evaluates javascript code, Owner Only"
};