import db from '@services/database.js';
import { sanitize } from '@services/util.js';
import permissions from '../data/Permissions.json';

const _pendingCreations = new Map();

export default class User {
	constructor(id, data) {
		this.id = Number(id);
		this.data = data;
	}

	static async get(options, create) {
		if (options.id == null && options.uid == null)
			throw new TypeError("Failed to query user, expected either 'id' or 'uid' field in options.");

		let data;
		if (options.id != null) {
			// deduplicate promises
			if (_pendingCreations.has(options.id)) {
				console.warn("Found duplicate creation promise");
				await _pendingCreations.get(options.id);
			}
			// continue as normal
			data = (await db`SELECT * FROM users WHERE telegramid=${Number(options.id)}`)[0];
		} else if (options.uid != null) {
			data = (await db`SELECT * FROM users WHERE id=${Number(options.uid)}`)[0]
		}

		if (data == null) {
			if (!create) return;
			if (options.id == null) return; // only create by id

			const createPromise = User._createUser(options).finally(() => {
				_pendingCreations.delete(options.id);
			});
			_pendingCreations.set(options.id, createPromise);
			data = await createPromise;
		}
		
		// // normalize bigints
		// data.coins = Number(data.coins);
		// data.points = Number(data.points);
		// data.money = Number(data.money);
		// can't save null as array
		if (data.cards == null) data.cards = [];

		return data;
	}
	static async fromID(id, create=false) {
		const data = await User.get({ id }, create);
		if (data == null) return;
		return new User(id, data);
	}
	static async fromUID(uid) {
		const data = await User.get({ uid }, false);
		if (data == null) return;
		return new User(data.telegramid, data);
	}
	static async fromTelegram(author, create=true) {
		const data = await User.get({
			id: author.id,
			username: author.username,
			nickname: author.first_name
		}, create);
		if (data == null) return;
		return new User(author.id, data);
	}
	static async fromHandle(handle) {
		// FIXME: sql injection? i can't find a way to NOT get an sql injection because of this stupid bun sql lib
		const data = (await db`SELECT * FROM users WHERE username=${handle.substring(1)}`)[0];
		if (data == null) return null;
		return new User(data.telegramid, data);
	}

	// private methods
	static async _createUser(options) {
		let params;
		if (options.nickname == null) { // create by id
			params = {
				telegramid: options.id
			};
		} else { // create by tg object
			params = {
				telegramid: options.id,
				username: options.username,
				nickname: options.nickname
			};
		}
		return (await db`INSERT INTO users ${db(params)} RETURNING *`)[0];
	}

	// data getters
	get username() { return this.data.username }
	get nickname() { return this.data.nickname }
	get uid() { return this.data.id }
	get cards() { return this.data.cards }
	// +setters
	get coins() { return this.data.coins } set coins(v) { this.data.coins = v }
	get points() { return this.data.points } set points(v) { this.data.points = v }
	get cardcooldown() { return this.data.cardcooldown } set cardcooldown(v) { this.data.cardcooldown = v }
	get goldenbean() { return this.data.goldenbean } set goldenbean(v) { this.data.goldenbean = v }
	get feed() { return this.data.feed } set feed(v) { this.data.feed = v }
	get drinkcooldown() { return this.data.drinkcooldown } set drinkcooldown(v) { this.data.drinkcooldown = v }
	get drops() { return this.data.drops } set drops(v) { this.data.drops = v }
	get favoritecard() { return this.data.favoritecard } set favoritecard(v) { this.data.favoritecard = v }

	get superadmin() { return permissions.superadmin.indexOf(this.id) != -1 }
	
	// public methods
	async save() {
		if (this.locked)
			throw new Error("User object is locked");
		this.locked = true;
		const data = {...this.data};
		data.cards = db.array(data.cards);
		await db`UPDATE users SET ${db(data)} WHERE telegramid=${this.id}`;
	}

	get link() {
		if (this.username == null) {
			// con: not clickable on desktop
			return `<a href="tg://openmessage?user_id=${this.id}">${sanitize(this.nickname)}</a>`;
		} else {
			return `<a href="https://t.me/${this.username}">${sanitize(this.nickname)}</a>`;
		}
	}
	get mention() {
		return `<a href="tg://user?id=${this.id}">${sanitize(this.nickname)}</a>`;
	}
}