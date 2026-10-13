const messageAwaits = new Map();

export function createMessagePromise(author) {
	const { promise, resolve, reject } = Promise.withResolvers();
	// duplicate
	if (messageAwaits.get(author)) {
		messageAwaits.get(author).reject("cancelled");
	}
	messageAwaits.set(author, { promise, resolve, reject });
	// expire
	setTimeout(() => {
		if (messageAwaits.get(author).promise == promise) {
			messageAwaits.delete(author);
			reject("expired");
		}
	}, 30000);
	return promise;
}

export function onMessage(message) {
	if (messageAwaits.get(message.from.id)) {
		messageAwaits.get(message.from.id).resolve(message);
	}
}