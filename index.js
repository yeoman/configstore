'use strict';
var path = require('path');
var os = require('os');
var fs = require('graceful-fs');
var osenv = require('osenv');
var userHome = require('user-home');
var assign = require('object-assign');
var mkdirp = require('mkdirp');
var uuid = require('uuid');
var xdgBasedir = require('xdg-basedir');

var user = (osenv.user() || uuid.v4()).replace(/\\/g, '');
var configDir = xdgBasedir.config || path.join(os.tmpdir(), user, '.config');
var permissionError = 'You don\'t have access to this file.';
var defaultPathMode = parseInt('0700', 8);
var writeFileOptions = {mode: parseInt('0600', 8)};

function Configstore(id, defaults) {
	this.path = path.join(configDir, 'configstore', id + '.json');
	this.all = assign({}, defaults || {}, this.all || {});
}

Configstore.prototype = Object.create(Object.prototype, {
	all: {
		get: function () {
			try {
				return JSON.parse(fs.readFileSync(this.path, 'utf8'));
			} catch (err) {
				// create dir if it doesn't exist
				if (err.code === 'ENOENT') {
					mkdirp.sync(path.dirname(this.path), defaultPathMode);
					return {};
				}

				// improve the message of permission errors
				if (err.code === 'EACCES') {
					err.message = err.message + '\n' + permissionError + '\n';
				}

				// empty the file if it encounters invalid JSON
				if (err.name === 'SyntaxError') {
					fs.writeFileSync(this.path, '', writeFileOptions);
					return {};
				}

				throw err;
			}
		},
		set: function (val) {
			try {
				// make sure the folder exists as it
				// could have been deleted in the meantime
				mkdirp.sync(path.dirname(this.path), defaultPathMode);

				fs.writeFileSync(this.path, JSON.stringify(val, null, '\t'), writeFileOptions);
			} catch (err) {
				// improve the message of permission errors
				if (err.code === 'EACCES') {
					err.message = err.message + '\n' + permissionError + '\n';
				}

				throw err;
			}
		}
	},
	size: {
		get: function () {
			return Object.keys(this.all || {}).length;
		}
	}
});

Configstore.prototype.get = function (key) {
	return this.all[key];
};

Configstore.prototype.set = function (key, val) {
	var config = this.all;
	config[key] = val;
	this.all = config;
};

Configstore.prototype.del = function (key) {
	var config = this.all;
	delete config[key];
	this.all = config;
};

module.exports = Configstore;
