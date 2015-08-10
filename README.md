# [enb](https://github.com/enb-make/enb)-sass [![npm version](https://img.shields.io/badge/npm-v1.0.1-blue.svg)](https://www.npmjs.com/package/enb-sass) [![node-sass supports version](https://img.shields.io/badge/node--sass-3.2.0-orange.svg)](https://github.com/sass/node-sass/tree/v2) [![Build Status](https://travis-ci.org/enb-make/enb-sass.svg?branch=master)](https://travis-ci.org/enb-make/enb-sass) [![Dependency Status](https://david-dm.org/enb-make/enb-sass.svg)](https://david-dm.org/enb-make/enb-sass)

Provides the `node-sass` features for project-builder `enb` (https://github.com/enb-make/enb).


## Installing

```
npm install enb-sass --save
```


## Options

* *String* **target** contains target file name. Default: `?.css`
* *String* **filesTarget** contains file masks, according to which a list of source files is created. Default: `?.files`.
* *Array* **sourceSuffixes** Files suffixes that will be used. Default: `css`
* *Object* **sass** `node-sass` options. Read more: https://github.com/sass/node-sass#options. Default: default `node-sass` options.


## Usage

#### Default use

```javascript
nodeConfig.addTech([
  require('enb-sass')
]);
```

#### Collecting only scss files

```javascript
nodeConfig.addTech([
  require('enb-sass'), {
    target: '?.css',
    sourceSuffixes: ['scss']
  }
]);
```

#### Use `node-sass` [compression](https://github.com/sass/node-sass#outputstyle) and [debug mode](https://github.com/sass/node-sass#sourcecomments)

```javascript
nodeConfig.addTech([
  require('enb-sass'), 
  {
    target: '?.css',
    sourceSuffixes: ['scss'],
    sass: {
      outputStyle: 'compressed',
      sourceComments: true
    }
  }
]);
```

#### Collecting ie and ie8 css/scss files with `node-sass` [compression](https://github.com/sass/node-sass#outputstyle) and [debug mode](https://github.com/sass/node-sass#sourcecomments)

```javascript
nodeConfig.addTech([
  require('enb-sass'), 
  {
    target: '?.css',
    sourceSuffixes: ['css', 'scss', 'ie.css', 'ie.scss', 'ie8.css', 'ie8.scss'],
    sass: {
      outputStyle: 'compressed',
      sourceComments: true
    }
  }
]);
```


## Used in
* Yandex TV https://tv.yandex.ru/
* Kinopoisk https://kinopoisk.ru/


## Thanks

* Abramov Andrew ([@blond](https://github.com/blond)). For the support and correct answers.
* Filatov Dmitry ([@dfilatov](https://github.com/dfilatov)). For `vow`, `vow-fs`, `inherit`.
* Georgy Krasulya ([@gkrasulya](https://github.com/gkrasulya)). For `rich error reporting`.
