import bot from '@bot/bot.js';

export default class {
	static trigger = /^-пинг$/i;

	static async execute(ctx) {
		const start = performance.now();
		const message = await ctx.reply("Загрузка...");
		const end = performance.now();
		await bot.editMessageText(
			message.result.chat.id,
			message.result.message_id,
			`Пинг: <b>${Math.round(end - start)} мс.</b>`,
			{ parse_mode: "html" }
		);
	}
}