import User from '@bot/user.js';
import { createMessagePromise } from '@bot/events/Message.js';
import permissions from '../data/Permissions.json';


export default class Context {
	constructor(bot, message) {
		this.bot = bot;
		this.message = message;
	}

	get superadmin() { return permissions.superadmin.indexOf(this.author.id) != -1 }

	async getUser() {
		if (this.user) return this.user;
		const user = await User.fromTelegram(this.author);
		this.user = user;
		return user;
	}

	// utility
	async getUserFromHandle(handle) {
		if (handle == null) return await this.getUser();
		const user = await User.fromHandle(handle);
		return user;
	}
	async getUserFromReply() {
		const replyUser = this.message.reply_to_message?.from;
		if (replyUser == null) return;
		return await User.fromTelegram(replyUser);
	}

	// get user from arguments optional
	async getArgumentsUser(args) {
		if (args[0] != null && args[0].startsWith("@")) {
			return await this.getUserFromHandle(args.shift());
		} else {
			return await this.getUserFromReply();
		}
	}
	async getArgumentsUserOrSelf(args) {
		if (args[0] != null && args[0].startsWith("@")) {
			return await this.getUserFromHandle(args.shift());
		} else {
			return await this.getUserFromReply() ?? await this.getUser();
		}
	}

	// await messages
	awaitMessage() {
		return createMessagePromise(this.author.id);
	}

	// telegram methods
	get body() { return this.message.text }
	get arguments() { return this.body.split(" ") }
	get author() { return this.message.from }

	reply(text, options={}) {
		return this.bot.sendMessage(this.message.chat.id, text, {
			parse_mode: "HTML",
			reply_parameters: {message_id: this.message.message_id},
			link_preview_options: {is_disabled: true},
			...options
		});
	}
	replyImage(text, fileName, fileBuffer, options={}) {
		return this.bot.sendPhoto(this.message.chat.id, fileName, fileBuffer, text, {
			parse_mode: "HTML",
			reply_parameters: JSON.stringify({message_id: this.message.message_id}),
			link_preview_options: JSON.stringify({is_disabled: true}),
			...options
		});
	}
	sendMessage(text, options={}) {
		return this.bot.sendMessage(this.message.chat.id, text, {
			parse_mode: "HTML",
			link_preview_options: {is_disabled: true},
			...options
		});
	}
}