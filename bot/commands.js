import { readdir } from "bun:fs/promises";
import { join, extname } from "bun:path";
import { fileURLToPath } from "bun:url";

async function importAllFromDir(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const modules = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			const nested = await importAllFromDir(fullPath);
			for (const command of nested) modules.push(command);
		} else if (entry.isFile() && entry.name.endsWith(".js")) {
			const command = await import(fullPath);
			modules.push(command.default);
		}
	}

	return modules;
}

export default async function loadCommands() {
	const path = join(fileURLToPath(new URL(".", import.meta.url)), "../commands");
	const commands = await importAllFromDir(path);
	console.log(`Loaded ${commands.length} commands`);
	return commands;
}