import path from 'path';
import os from 'os';
import fs from 'graceful-fs';
import {xdgConfig} from 'xdg-basedir';
import {writeFileSync} from 'atomically';
import dotProp from 'dot-prop';

function getConfigDirectory(id, globalConfigPath) {
	const pathPrefix = globalConfigPath ?
		path.join(id, 'config.json') :
		path.join('configstore', `${id}.json`);

	const configDirectory = xdgConfig || fs.mkdtempSync(fs.realpathSync(os.tmpdir()) + path.sep);

	return path.join(configDirectory, pathPrefix);
}

const permissionError = 'You don\'t have access to this file.';
const mkdirOptions = {mode: 0o0700, recursive: true};
const writeFileOptions = {mode: 0o0600};

export default class Configstore {
	constructor(id, defaults, options = {}) {
		this._path = options.configPath ?? getConfigDirectory(id, options.globalConfigPath);

		if (defaults) {
			this.all = {
				...defaults,
				...this.all
			};
		}
	}

	get all() {
		try {
			return JSON.parse(fs.readFileSync(this._path, 'utf8'));
		} catch (error) {
			// Create directory if it doesn't exist
			if (error.code === 'ENOENT') {
				return {};
			}

			// Improve the message of permission errors
			if (error.code === 'EACCES') {
				error.message = `${error.message}\n${permissionError}\n`;
			}

			// Empty the file if it encounters invalid JSON
			if (error.name === 'SyntaxError') {
				writeFileSync(this._path, '', writeFileOptions);
				return {};
			}

			throw error;
		}
	}

	set all(value) {
		try {
			// Make sure the folder exists as it could have been deleted in the meantime
			fs.mkdirSync(path.dirname(this._path), mkdirOptions);

			writeFileSync(this._path, JSON.stringify(value, undefined, '\t'), writeFileOptions);
		} catch (error) {
			// Improve the message of permission errors
			if (error.code === 'EACCES') {
				error.message = `${error.message}\n${permissionError}\n`;
			}

			throw error;
		}
	}

	get size() {
		return Object.keys(this.all || {}).length;
	}

	get(key) {
		return dotProp.get(this.all, key);
	}

	set(key, value) {
		const config = this.all;

		if (arguments.length === 1) {
			for (const k of Object.keys(key)) {
				dotProp.set(config, k, key[k]);
			}
		} else {
			dotProp.set(config, key, value);
		}

		this.all = config;
	}

	has(key) {
		return dotProp.has(this.all, key);
	}

	delete(key) {
		const config = this.all;
		dotProp.delete(config, key);
		this.all = config;
	}

	clear() {
		this.all = {};
	}

	get path() {
		return this._path;
	}
}
