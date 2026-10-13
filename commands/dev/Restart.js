export default class {
	static trigger = /^-рестарт$/i;

	static async execute(ctx) {
		if (!ctx.superadmin) return;
		await ctx.reply("Бот перезагружается...");
		await Bun.sleep(1000);
		process.exit();
	}
}