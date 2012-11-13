'use strict';
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var mkdirp = require('mkdirp');
var YAML = require('yamljs');

var homeDir = process.env.XDG_CONFIG_HOME ||
	process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'];


function readFile(filePath) {
	try {
		return fs.readFileSync(filePath, 'utf8');
	} catch (err) {
		// Create dir if it doesn't exist
		if (err.errno === 34) {
			mkdirp.sync(path.dirname(filePath));
			return '';
		}
	}
}

function Configstore(id, defaults) {
	this.path = path.join(homeDir, '.config', 'configstore', id + '.yml');
	this.all = _.extend({}, defaults, this.all);
}

Configstore.prototype = Object.create(Object.prototype, {
	all: {
		get: function() {
			return YAML.parse(readFile(this.path)) || {};
		},
		set: function(val) {
			fs.writeFileSync(this.path, YAML.stringify(val));
		}
	},
	size: {
		get: function() {
			return _.size(this.all);
		}
	}
});

Configstore.prototype.get = function(key) {
	return this.all[key];
};

Configstore.prototype.set = function(key, val) {
	var config = this.all;
	config[key] = val;
	this.all = config;
};

Configstore.prototype.del = function(key) {
	var config = this.all;
	delete config[key];
	this.all = config;
};

module.exports = Configstore;
