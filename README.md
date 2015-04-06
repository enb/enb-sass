enb-sass
========

[![node-sass supports version](https://img.shields.io/badge/node--sass-2.0.0-orange.svg)](https://github.com/sass/node-sass/tree/v2) [![Build Status](https://travis-ci.org/ixax/enb-sass.svg?branch=master)](https://travis-ci.org/ixax/enb-sass) [![Dependency Status](http://img.shields.io/david/ixax/enb-sass.svg?style=flat)](https://david-dm.org/ixax/enb-sass)

Предоставляет технологию `sass` для сборщика ENB (https://github.com/enb-make).

Советую внимательно ознакомьться с README репозитория `node-sass` (https://github.com/sass/node-sass), чтобы понять детали работы технологии.


Установка
=========

Прописываем зависимость в `dependencies` package.json проекта:

```javascript
"enb-sass": "git@github.yandex-team.ru:ixax/enb-sass.git#master"
```

Устанавливаем командой:

```
npm install --registry=http://npm.yandex-team.ru/
```


Параметры
=========

    String  target      Маска файла, в который будут слиты результаты преобразований.    [default: '?.css']
                        Например reset.css.
    Object  sass        Пробрасываются все настройки node-sass.                          [default: {outputStyle: 'normal', sourceComments: 'normal'}]
                        Подробнее тут https://github.com/sass/node-sass#options


Пример использования
====================

```javascript
nodeConfig.addTech([
  require('enb-sass'), {
    target: '?.css',
    sassSettings: {
      outputStyle: 'compressed',
      debug: true
    }
  }
]);
```
