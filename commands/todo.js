const _ = require("../data.js");

module.exports = {
	main: function(Bot, m, args) {
		var data = _.load();
		if (!(data[m.author.id].lists)) {
			data[m.author.id].lists = {};
		}
		if (args) {
			if (args.split(" ")[0] == "create" || args.split(" ")[0] == "new") {
				var name = args.split(" "); name.splice(0,1); name = name[0];
				if (data[m.author.id].lists[name]) {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** already exists");
				} else {
					data[m.author.id].lists[name] = [];
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** created");
				}
			} else if (args.split(" ")[0] == "remove" || args.split(" ")[0] == "delete") {
				var name = args.split(" "); name.splice(0,1); name = name[0];
				if (data[m.author.id].lists[name]) {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** removed");
					data[m.author.id].lists[name] = undefined;
				} else {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** doesn't exist");
				}
			} else if (args.split(" ")[0] == "add") {
				var name = args.split(" "); name.splice(0,1); name = name[0];
				if (data[m.author.id].lists[name]) {
					var item = args.split(" "); item.splice(0,2); item = item.join(" ");
				//	item = item.replace(/```|\*\*|~~|\n/g, "");
				//	if (!item == "") return;
 					data[m.author.id].lists[name].push(item);
					Bot.createMessage(m.channel.id, "Added item to todo list **"+name+"**");
				} else {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** doesn't exist");
				}
			} else if (args.split(" ")[0] == "finish") {
				var name = args.split(" "); name.splice(0,1); name = name[0];
				var place = args.split(" "); place.splice(0,1); place = place[1];
				var place_int = parseInt(place);
				if (data[m.author.id].lists[name]) {
					if (isNaN(place_int)) {
						Bot.createMessage(m.channel.id, "Item **"+place+"** from todo list **"+name+"** doesn't exist");
					} else {
						data[m.author.id].lists[name].splice(place_int-1, 1);
						Bot.createMessage(m.channel.id, "Finished item **#"+place+"** from todo list **"+name+"**");
					}
				} else {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** doesn't exist");
				}
			} else if (args.split(" ")[0] == "list") {
				var lists = Object.keys(data[m.author.id].lists);
				if (lists.length == 0) {
					Bot.createMessage(m.channel.id, "You have no todo lists");
				} else {
					lists = lists.join("\n")
					Bot.createMessage(m.channel.id, "Todo lists:\n**"+lists+"**");
				}
			} else {
				var name = args.split(" "); name = name[0];
				if (data[m.author.id].lists[name]) {
					var list = data[m.author.id].lists[name];
					var lines = ["\u200b\tDisplaying todo list **"+name+"**"];
					console.log(list);
					for (var i = 0; i < list.length; i++) {
						lines.push("**"+(i+1)+")** `"+list[i]+"`");
					}
					var message = lines.join("\n\t\t\t");
					if (list.length == 0) {
						Bot.createMessage(m.channel.id, "No items on the todo list **"+name+"** right now");
					} else {
						Bot.createMessage(m.channel.id, message);
					}
				} else {
					Bot.createMessage(m.channel.id, "Todo list **"+name+"** doesn't exist");
				}
			}
		} else {
			Bot.createMessage(m.channel.id, "`j!todo create <name>` to create a todo list.\n`j!todo remove <name>` to remove a todo list.\n`j!todo add <name> <item>` to add an item to a todo list.\n`j!todo finish <name> <item_number>` Finish an item from the todo list.\n`j!todo <name>` Display a todo list.\n`j!todo list` Lists all todo lists you have.")
		}
		_.save(data);
	},
	help: "A command for todo-lists"
}