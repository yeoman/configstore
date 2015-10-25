# configstore [![Build Status](https://secure.travis-ci.org/yeoman/configstore.svg?branch=master)](http://travis-ci.org/yeoman/configstore)

> Easily load and persist config without having to think about where and how

Config is stored in a JSON file located in `$XDG_CONFIG_HOME` or `~/.config`. Eg: `~/.config/configstore/some-id.json`


## Usage

```js
var Configstore = require('configstore');
var pkg = require('./package.json');

// Init a Configstore instance with an unique ID eg. package name
// and optionally some default values
var conf = new Configstore(pkg.name, {foo: 'bar'});

conf.set('awesome', true);
console.log(conf.get('awesome'));  // true
console.log(conf.get('foo'));      // bar

conf.del('awesome');
console.log(conf.get('awesome'));  // undefined
```


## API

```js
var Configstore = require('configstore');
```

### var config = new Configstore(pkg, defaults={}, opts={})

Create a new configstore instance `config`.

`pkg` is the name of your Node package. `defaults` is a map with default values
of keys that do not yet exist in the configuration file.

`opts` is a map of creation-time options. When the boolean `globalConfigPath` is
set, the configuration JSON file will be stored at `$CONFIG/pkg/config.json` as
opposed to the default `$CONFIG/configstore/pkg.json`.

### config.set(key, value)

Set an item.

### config.get(key)

Get an item.

### config.del(key)

Delete an item.

### config.clear()

Delete all items.

### config.all

Get all items as an object or replace the current config with an object:

```js
conf.all = {
	hello: 'world'
};
```

### config.size

Get the item count.

### config.path

Get the path to the config file. Can be used to show the user where the config file is located or even better open it for them.


## License

[BSD license](http://opensource.org/licenses/bsd-license.php)  
Copyright Google
