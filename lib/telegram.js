import { EventEmitter } from 'bun:events';
import { readFileSync } from 'bun:fs';
import { basename } from 'bun:path';

async function safeFetch(url, options) {
	// connections keep being aborted
	try {
		return await fetch(url, options);
	} catch (error) {
		console.warn("Failed to send image", error);
		await Bun.sleep(1000);
		return await safeFetch(url, options);
	}
}

export default class TelegramBot extends EventEmitter {
	#token;
	constructor(options) {
		super();
		if (typeof options !== "object")
			throw new TypeError("expected options to be object");
		if (typeof options.token !== "string")
			throw new TypeError("expected token to be string");

		this.#token = options.token;
		this.updateOffset = 0;
		this.pollingInterval = 2000;
	}

	async start() {
		while (true) {
			try {
				await this._polling();
			} catch (e) {
				console.error("Failure when polling, retrying in 5 seconds.", e);
				await Bun.sleep(5000);
			}
		}
	}

	/*
		api methods
	*/
	sendMessage(chat_id, text, options={}) {
		return this._request("sendMessage", {
			chat_id,
			text,
			...options
		});
	}
	sendPhoto(chat_id, filePath, caption, options={}) {
		const fileBuffer = readFileSync(filePath);
		const fileName = basename(filePath);
		const fileBlob = new Blob([fileBuffer]);
		return this._requestFormData("sendPhoto", {
			chat_id,
			photo: {isfile: true, blob: fileBlob, filename: fileName},
			caption,
			...options
		});
	}

	getFile(file_id, options={}) {
		return this._request("getFile", {
			file_id,
			...options
		});
	}
	deleteMessage(chat_id, message_id, options={}) {
		return this._request("deleteMessage", {
			chat_id, message_id,
			...options
		});
	}

	answerCallbackQuery(callback_query_id, options={}) {
		return this._request("answerCallbackQuery", {
			callback_query_id,
			...options
		});
	}
	
	/*
		internal methods
	*/
	buildUrl(path) {
		// this after /bot<token>/ we can also add test/
		// but not sure what its for
		return `https://api.telegram.org/bot${this.#token}/${path}`;
	}
	async _request(path, options) {
		const url = this.buildUrl(path);
		const body = JSON.stringify(options);

		const response = await safeFetch(url, {
			headers: { "Content-Type": "application/json" },
			method: "POST",
			body
		});
		return await response.json();
	}
	async _requestFormData(path, options) {
		const url = this.buildUrl(path);
		const formData = new FormData();
		for (const [key, value] of Object.entries(options)) {
			if (typeof value === "object" && value.isfile) {
				formData.append(key, value.blob, value.filename);
			} else {
				formData.append(key, value);
			}
		}

		const response = await safeFetch(url, {
			method: "POST",
			body: formData,
			// verbose: true
		});
		return await response.json();
	}

	_processUpdate(update) {
		if (this.updateOffset < update.update_id)
			this.updateOffset = update.update_id;

		if (update.message) this.emit("message", update.message);
		if (update.callback_query) this.emit("callback_query", update.callback_query);
		if (update.channel_post) this.emit("channel_post", update.channel_post);
	}
	async _polling() {
		const updates = await this._request("getUpdates", {
			offset: this.updateOffset + 1,
			limit: 30,
			timeout: 30
		});
		if (!updates.ok)
			throw new Error(`failed to get updates: ${JSON.stringify(updates)}`);

		for (const update of updates.result) {
			this._processUpdate(update);
		}
		// console.log("Polling done");
	}
}