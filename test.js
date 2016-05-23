import fs from 'fs';
import {serial as test} from 'ava';
import pathExists from 'path-exists';
import Configstore from './';

const configstorePath = new Configstore('configstore-test').path;

test.beforeEach(t => {
	fs.unlinkSync(configstorePath);
	t.context.conf = new Configstore('configstore-test');
});

test('.set() and .get()', t => {
	t.context.conf.set('foo', 'bar');
	t.context.conf.set('baz.boo', true);
	t.is(t.context.conf.get('foo'), 'bar');
	t.is(t.context.conf.get('baz.boo'), true);
});

test('.set() with object and .get()', t => {
	t.context.conf.set({
		foo1: 'bar1',
		foo2: 'bar2',
		baz: {
			boo: 'foo',
			foo: {
				bar: 'baz'
			}
		}
	});
	t.is(t.context.conf.get('foo1'), 'bar1');
	t.is(t.context.conf.get('foo2'), 'bar2');
	t.deepEqual(t.context.conf.get('baz'), {boo: 'foo', foo: {bar: 'baz'}});
	t.is(t.context.conf.get('baz.boo'), 'foo');
	t.deepEqual(t.context.conf.get('baz.foo'), {bar: 'baz'});
	t.is(t.context.conf.get('baz.foo.bar'), 'baz');
});

test('.has()', t => {
	t.context.conf.set('foo', '🦄');
	t.context.conf.set('baz.boo', '🦄');
	t.true(t.context.conf.has('foo'));
	t.true(t.context.conf.has('baz.boo'));
	t.false(t.context.conf.has('missing'));
});

test('.del()', t => {
	t.context.conf.set('foo', 'bar');
	t.context.conf.set('baz.boo', true);
	t.context.conf.set('baz.foo.bar', 'baz');
	t.context.conf.del('foo');
	t.not(t.context.conf.get('foo'), 'bar');
	t.context.conf.del('baz.boo');
	t.not(t.context.conf.get('baz.boo'), true);
	t.context.conf.del('baz.foo');
	t.not(t.context.conf.get('baz.foo'), {bar: 'baz'});
	t.context.conf.set('foo.bar.baz', {awesome: 'icecream'});
	t.context.conf.set('foo.bar.zoo', {awesome: 'redpanda'});
	t.context.conf.del('foo.bar.baz');
	t.is(t.context.conf.get('foo.bar.zoo.awesome'), 'redpanda');
});

test('.clear()', t => {
	t.context.conf.set('foo', 'bar');
	t.context.conf.set('foo1', 'bar1');
	t.context.conf.set('baz.boo', true);
	t.context.conf.clear();
	t.is(t.context.conf.size, 0);
});

test('.all', t => {
	t.context.conf.set('foo', 'bar');
	t.context.conf.set('baz.boo', true);
	t.is(t.context.conf.all.foo, 'bar');
	t.deepEqual(t.context.conf.all.baz, {boo: true});
});

test('.size', t => {
	t.context.conf.set('foo', 'bar');
	t.is(t.context.conf.size, 1);
});

test('.path', t => {
	t.context.conf.set('foo', 'bar');
	t.true(pathExists.sync(t.context.conf.path));
});

test('use default value', t => {
	const conf = new Configstore('configstore-test', {foo: 'bar'});
	t.is(conf.get('foo'), 'bar');
});

test('support global namespace path option', t => {
	const conf = new Configstore('configstore-test', {}, {globalConfigPath: true});
	const regex = /configstore-test(\/|\\)config.json$/;
	t.true(regex.test(conf.path));
});

test('ensure `.all` is always an object', t => {
	fs.unlinkSync(configstorePath);
	t.notThrows(() => t.context.conf.get('foo'));
});
