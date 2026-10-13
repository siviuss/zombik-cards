const storage = {};

export function setValue(key, value) {
	storage[key] = value;
}
export function getValue(key) {
	return storage[key];
}