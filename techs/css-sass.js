var sass = require('node-sass');
var Vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var path = require('path');
var util = require('util');

module.exports = require('enb/techs/css').buildFlow()
    .name('enb-sass')
    .defineOption('sass')
    .useFileList(['css', 'scss'])
    .builder(function (sourceFiles) {
        var _this = this;
        var target = this._target;
        var deferred = Vow.defer();
        var externalSassSettings = this._sass || {};
        var sassSettings = {
            outputStyle: 'normal',
            sourceComments: 'normal',
            includePaths: [],
            debug: true
        };

        Object
            .keys(externalSassSettings)
            .forEach(function (key) {
                sassSettings[key] = externalSassSettings[key];
            });

        var promises = sourceFiles.map(function (file) {
            var fileDir = path.dirname(file.fullname);
            if (sassSettings.includePaths.indexOf(fileDir) === -1) {
                sassSettings.includePaths.push(fileDir);
            }

            return vowFs.read(file.fullname, 'utf8')
                .then(function (data) {
                    data = _this._processUrls(data, file.fullname);
                    return _this._processIncludes(data, file.fullname);
                });
        });

        Vow.all(promises)
            .then(function () {
                // Собираем содержимое всех файлов в одну большую строку
                sassSettings.data = Array.prototype.slice.call(arguments[0], 0).join("\n");

                // В некоторых случаях renderSync не отдает данные в обработчик, так что используем try…catch
                try {
                    var cssResult = sass.renderSync(sassSettings);
                    deferred.resolve(cssResult.css);
                } catch (err) {
                    err = JSON.parse(err);
                    var message = util.format('On: %s:%d:%d. Message: `%s`', err.file, err.line, err.column, err.message);
                    deferred.reject(message);
                }
            }.bind(this))
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise();
    })
    .methods({
        _processUrls: function (data, filename) {
            return this._getCssPreprocessor()._processUrls(data, filename);
        }
    })
    .createTech();
