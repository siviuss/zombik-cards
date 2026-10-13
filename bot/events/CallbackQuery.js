const callbackAwaits = new Map();
const callbackBinds = new Array();

export function createCallbackPromise(author) {
	const { promise, resolve, reject } = Promise.withResolvers();
	// duplicate
	if (callbackAwaits.get(author)) {
		callbackAwaits.get(author).reject("cancelled");
	}
	callbackAwaits.set(author, { promise, resolve, reject });
	// expire
	setTimeout(() => {
		if (callbackAwaits.get(author).promise == promise) {
			callbackAwaits.delete(author);
			reject("expired");
		}
	}, 300000);
	return promise;
}

export function bindCallbackQuery(callback) {
	callbackBinds.push(callback);
}

export function onCallbackQuery(query) {
	if (callbackAwaits.get(query.from.id)) {
		callbackAwaits.get(query.from.id).resolve(query);
	}
	for (const callback of callbackBinds) {
		callback(query);
	}
}