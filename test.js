import fs from 'fs';
import path from 'path';
import os from 'os';
import test from 'ava';
import Configstore from './index.js';

const configstorePath = new Configstore('configstore-test').path;

const cleanUpFile = () => {
	if (fs.existsSync(configstorePath)) {
		fs.unlinkSync(configstorePath);
	}
};

test.beforeEach(t => {
	cleanUpFile();
	t.context.config = new Configstore('configstore-test');
});

test('.set() and .get()', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	config.set('baz.boo', true);
	t.is(config.get('foo'), 'bar');
	t.is(config.get('baz.boo'), true);
});

test('.set() with object and .get()', t => {
	const {config} = t.context;
	config.set({
		foo1: 'bar1',
		foo2: 'bar2',
		baz: {
			boo: 'foo',
			foo: {
				bar: 'baz'
			}
		}
	});
	t.is(config.get('foo1'), 'bar1');
	t.is(config.get('foo2'), 'bar2');
	t.deepEqual(config.get('baz'), {
		boo: 'foo',
		foo: {
			bar: 'baz'
		}
	});
	t.is(config.get('baz.boo'), 'foo');
	t.deepEqual(config.get('baz.foo'), {bar: 'baz'});
	t.is(config.get('baz.foo.bar'), 'baz');
});

test('.has()', t => {
	const {config} = t.context;
	config.set('foo', '🦄');
	config.set('baz.boo', '🦄');
	t.true(config.has('foo'));
	t.true(config.has('baz.boo'));
	t.false(config.has('missing'));
});

test('.delete()', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	config.set('baz.boo', true);
	config.set('baz.foo.bar', 'baz');
	config.delete('foo');
	t.not(config.get('foo'), 'bar');
	config.delete('baz.boo');
	t.not(config.get('baz.boo'), true);
	config.delete('baz.foo');
	t.not(config.get('baz.foo'), {bar: 'baz'});
	config.set('foo.bar.baz', {awesome: 'icecream'});
	config.set('foo.bar.zoo', {awesome: 'redpanda'});
	config.delete('foo.bar.baz');
	t.is(config.get('foo.bar.zoo.awesome'), 'redpanda');
});

test('.clear()', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	config.set('foo1', 'bar1');
	config.set('baz.boo', true);
	config.clear();
	t.is(config.size, 0);
});

test('.all', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	config.set('baz.boo', true);
	t.is(config.all.foo, 'bar');
	t.deepEqual(config.all.baz, {boo: true});
});

test('.size', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	t.is(config.size, 1);
});

test('.path', t => {
	const {config} = t.context;
	config.set('foo', 'bar');
	t.true(fs.existsSync(config.path));
});

test('use default value', t => {
	const config = new Configstore('configstore-test', {foo: 'bar'});
	t.is(config.get('foo'), 'bar');
});

test('support `globalConfigPath` option', t => {
	const config = new Configstore('configstore-test', {}, {globalConfigPath: true});
	t.regex(config.path, /configstore-test(\/|\\)config.json$/);
});

test('support `configPath` option', t => {
	const customPath = path.join(os.tmpdir(), 'configstore-custom-path', 'foo.json');
	const config = new Configstore('ignored-namespace', {}, {
		globalConfigPath: true,
		configPath: customPath
	});
	t.regex(config.path, /configstore-custom-path(\/|\\)foo.json$/);
});

test('ensure `.all` is always an object', t => {
	cleanUpFile();

	t.notThrows(() => {
		t.context.config.get('foo');
	});
});

test('the store is NOT created until write', t => {
	cleanUpFile();
	const config = new Configstore('configstore-test');
	t.false(fs.existsSync(config.path));
	config.set('foo', 'bar');
	t.true(fs.existsSync(config.path));
});

test('ensure necessary sub-directories are created', t => {
	const customPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'configstore-recursive-')), 'foo', 'bar', 'baz.json');
	const config = new Configstore('ignored-namespace', undefined, {
		globalConfigPath: true,
		configPath: customPath
	});
	t.false(fs.existsSync(config.path));
	config.set('foo', 'bar');
	t.true(fs.existsSync(config.path));
});
