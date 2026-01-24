import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
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
				bar: 'baz',
			},
		},
	});
	t.is(config.get('foo1'), 'bar1');
	t.is(config.get('foo2'), 'bar2');
	t.deepEqual(config.get('baz'), {
		boo: 'foo',
		foo: {
			bar: 'baz',
		},
	});
	t.is(config.get('baz.boo'), 'foo');
	t.deepEqual(config.get('baz.foo'), {bar: 'baz'});
	t.is(config.get('baz.foo.bar'), 'baz');
});

test('.set() handles undefined values correctly', t => {
	const {config} = t.context;
	// Undefined values are stripped during JSON serialization, so they don't persist
	config.set('undefinedValue', undefined);
	t.is(config.get('undefinedValue'), undefined);
	t.false(config.has('undefinedValue')); // JSON.stringify strips undefined values

	// Null values persist correctly
	config.set('nullValue', null);
	t.is(config.get('nullValue'), null);
	t.true(config.has('nullValue'));
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
	t.is(config.get('foo'), undefined);
	config.delete('baz.boo');
	t.is(config.get('baz.boo'), undefined);
	config.delete('baz.foo');
	t.is(config.get('baz.foo'), undefined);
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
		configPath: customPath,
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
		configPath: customPath,
	});
	t.false(fs.existsSync(config.path));
	config.set('foo', 'bar');
	t.true(fs.existsSync(config.path));
});

test('clearInvalidConfig: true (default) clears corrupted JSON', t => {
	const {config} = t.context;

	// Set some data then corrupt the file
	config.set('test', 'data');
	fs.writeFileSync(config.path, '{"corrupted": json}', 'utf8');

	// Should clear the file and return empty object (default behavior)
	const configWithCorruptedFile = new Configstore('configstore-test');
	t.deepEqual(configWithCorruptedFile.all, {});

	// File should be cleared
	const clearedContent = fs.readFileSync(config.path, 'utf8');
	t.is(clearedContent, '');
});

test('clearInvalidConfig: false preserves corrupted JSON and throws', t => {
	// Create config, set data, then corrupt the file
	const config = new Configstore('configstore-test-preserve');
	config.set('test', 'data');

	const corruptedContent = '{"corrupted": json}';
	fs.writeFileSync(config.path, corruptedContent, 'utf8');

	// Should throw SyntaxError and preserve file
	const configWithCorruptedFile = new Configstore('configstore-test-preserve', undefined, {clearInvalidConfig: false});
	t.throws(() => configWithCorruptedFile.all, {name: 'SyntaxError'});

	// File should be preserved
	const preservedContent = fs.readFileSync(config.path, 'utf8');
	t.is(preservedContent, corruptedContent);
});

test('validate id', t => {
	const fixtures = [
		'',
		'.',
		'..',
		'../escape',
		'foo/../bar',
		'foo/bar',
		String.raw`foo\bar`,
		'foo\0bar',
	];

	for (const id of fixtures) {
		t.throws(() => new Configstore(id), {message: /`id` must be a safe filename/});
	}
});
