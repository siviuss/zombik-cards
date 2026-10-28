import TelegramBot from '@lib/telegram.js';
import { sanitize, now } from '@services/util.js';
import { getValue } from '@services/localstorage.js';
import db from '@services/database.js';
import config from '@config';

import loadCommands from './commands.js';
import Context from './context.js';
import { onMessage } from '@bot/events/Message.js';
import { onCallbackQuery, bindCallbackQuery } from '@bot/events/CallbackQuery.js';

const commands = await loadCommands();

const bot = new TelegramBot({
	token: process.env.TOKEN
});
bot.start();


// command handling
bot.on("message", async (message) => {
	if (message.from.id == 777000) return;
	if (message.from.is_bot) return; // group anonymous bot or something else
	if (message.text == null) return;
	if (message.date + 60 < now()) return; // if bot experienced downtime

	if (message.chat.type != "private" && message.chat.id != config.chat)
		return;
		
	let context;
	try {
		context = new Context(bot, message);
	} catch (e) {
		console.error(`Failed to create context: ${e}`);
		return;
	}

	if (getValue("maintenance") && !context.superadmin) return;

	for (const command of commands) {
		if (!message.text.match(command.trigger)) continue;
		// protected commands are unable to be executed if the message is not explicitly sent by the user (e.g. not scheduled)
		if (message.is_from_offline && command.is_protected) continue;

		try {
			await command.execute(context);
		} catch (e) {
			console.error(e);
			if (command.is_silent) continue; // for example: chat events, chat rp commands
			await context.reply("При выполнении данной команды произошла ошибка.");
		}
	}
});

bot.on("message", onMessage);
bot.on("callback_query", onCallbackQuery);
bindCallbackQuery(async (query) => {
	if (query.data == "disabled") {
		bot._request("answerCallbackQuery", {
			callback_query_id: query.id
		});
	}
});

export default bot;