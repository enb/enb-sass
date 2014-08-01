var sass = require('node-sass');
var Vow = require('vow');
var vowFs = require('enb/lib/fs/async-fs');
var path = require('path');
var logger = new (require('enb/lib/logger'))();

var fileList = ['css', 'scss'];

module.exports = require('enb/techs/css').buildFlow()
    .name('enb-sass')
    .defineOption('target')
    .defineOption('sass')
    .useFileList(fileList)
    .target('target', this._target || '?.css')
    .builder(function (sourceFiles) {
        var that = this;
        var target = this._target;
        var deferred = Vow.defer();
        var externalSettings = this._sass || {};
        var settings = {
            outputStyle: 'normal',
            sourceComments: 'normal',
            includePaths: []
        };
        var promises = [];

        Object
            .keys(externalSettings)
            .forEach(function (key) {
                settings[key] = externalSettings[key];
            });

        sourceFiles.forEach(function (file) {
            var fileDir = path.dirname(file.fullname);
            if (settings.includePaths.indexOf(fileDir) === -1) {
                settings.includePaths.push(fileDir);
            }
        });

        sourceFiles.forEach(function (file) {
            promises.push(vowFs.read(file.fullname, 'utf8')
                .then(function (data) {
                    data = that._processUrls(data, file.fullname);
                    return Vow.when(that._processIncludes(data, file.fullname))
                        .then(function (data) {
                            return data;
                        });
                }));
        });

        Vow.all(promises)
            .spread(function () {
                // Concat all promises results into one huge array → huge css string
                settings.data = Array.prototype.slice.call(arguments, 0).join("\n");

                settings.success = function (cssResult) {
                    logger.logAction('rebuild', target, 'sass');
                    deferred.resolve(cssResult);
                };

                settings.error = function (err) {
                    err = err.trim();
                    logger.logErrorAction('sass', target, err);
                    deferred.reject(err);
                };

                sass.render(settings);
            });

        return deferred.promise();
    })
    .methods({
        _processUrls: function (data, filename) {
            return this._getCssPreprocessor()._processUrls(data, filename);
        }
    })
    .createTech();
