export const now = () => Math.floor(Date.now() / 1000);
export const choose = array => array[Math.floor(Math.random() * array.length)];

export function sanitize(text) {
	return text.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll("'", "&apos;")
		.replaceAll('"', "&quot;");
}

export function formatTime(diff) {
	// 1ч. 5мин. 14сек.
	const seconds = Math.floor(diff % 60);
	const minutes = Math.floor((diff / 60) % 60);
	const hours = Math.floor((diff / 3600) % 24);
	const days = Math.floor(diff / 86400);
	if (days > 1000) {
		return `никогда`;
	} else if (days > 0) {
		return `${days}д. ${hours}ч. ${minutes}мин. ${seconds}сек.`;
	} else if (hours > 0) {
		return `${hours}ч. ${minutes}мин. ${seconds}сек.`;
	} else if (minutes > 0) {
		return `${minutes}мин. ${seconds}сек.`;
	} else if (seconds > 0) {
		return `${seconds}сек.`;
	} else {
		return "сейчас";
	}
}

export function link(user) {
	if (user.username != null) {
		return `<a href="https://t.me/${user.username}">${sanitize(user.nickname)}</a>`;
	} else {
		return `<a href="tg://openmessage?user_id=${user.telegramid}">${sanitize(user.nickname)}</a>`;
	}
}