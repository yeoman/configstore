/* eslint-env mocha */
'use strict';
var assert = require('assert');
var fs = require('fs');
var pathExists = require('path-exists');
var Configstore = require('./');
var configstorePath = new Configstore('configstore-test').path;

beforeEach(function () {
	fs.unlinkSync(configstorePath);
	this.conf = new Configstore('configstore-test');
});

it('.set() and .get()', function () {
	this.conf.set('foo', 'bar');
	assert.equal(this.conf.get('foo'), 'bar');
});

it('.del()', function () {
	this.conf.set('foo', 'bar');
	this.conf.del('foo');
	assert.notEqual(this.conf.get('foo'), 'bar');
});

it('.clear()', function () {
	this.conf.set('foo', 'bar');
	this.conf.set('foo1', 'bar1');
	this.conf.clear();
	assert.equal(this.conf.size, 0);
});

it('.all', function () {
	this.conf.set('foo', 'bar');
	assert.equal(this.conf.all.foo, 'bar');
});

it('.size', function () {
	this.conf.set('foo', 'bar');
	assert.equal(this.conf.size, 1);
});

it('.path', function () {
	this.conf.set('foo', 'bar');
	assert(pathExists.sync(this.conf.path));
});

it('should use default value', function () {
	var conf = new Configstore('configstore-test', {foo: 'bar'});
	assert.equal(conf.get('foo'), 'bar');
});

it('support global namespace path option', function () {
	var conf = new Configstore('configstore-test', {}, {globalConfigPath: true});
	var regex = /configstore-test(\/|\\)config.json$/;
	assert(regex.test(conf.path));
});

it('make sure `.all` is always an object', function () {
	fs.unlinkSync(configstorePath);
	assert.doesNotThrow(function () {
		this.conf.get('foo');
	}.bind(this));
});
