import { SQL } from 'bun';
import config from '@config';

const database = new SQL({
	adapter: config.database.adapter,
	hostname: config.database.hostname,
	port: config.database.port,
	database: config.database.database,
	username: config.database.username,
	password: config.database.password
});

export default database;