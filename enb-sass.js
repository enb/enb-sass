var path = require('path');
var sass = require('node-sass');
var colors = require('colors');
var Vow = require('vow');
var fs = require('fs');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});


/**
 * Collect all scss files and compile them
 * @require node-sass https://github.com/andrew/node-sass
 * @author Viacheslav Glushko mail@ixax.me
 * @type {Tech}
 */
module.exports = require('enb/techs/css').buildFlow()
    .name('css-sass')
    .defineOption('prependedFiles')
    .useFileList(['css', 'scss'])
    .target('target', '?.css')
    .builder(function (sourceFiles) {
        var _this = this;
        var deferred = Vow.defer();
        var settings = {
            outputStyle: 'normal',
            sourceComments: 'none',
            includePaths: []
        };

        if (this._prependedFiles) {
            sourceFiles = this._prependedFiles.concat(sourceFiles);
        }

        var cssSource = sourceFiles
            .filter(function (file) {
                return path.basename(file.name).indexOf('_') !== 0;
            })
            .map(function (file) {
                var fileDir = path.dirname(file.name);
                if (settings.includePaths.indexOf(fileDir) === -1) {
                    settings.includePaths.push(fileDir);
                }

                var fileContent = fs.readFileSync(file.fullname, {'encoding': 'utf-8'});
                fileContent = _this._processUrls(fileContent, file.fullname)
                return [
                        '/* ' + file.fullname + ' start */',
                    fileContent,
                        '/* ' + file.fullname + ' end */'
                ].join('\n');
            }).join('\n');


        settings.data = cssSource;
        settings.success = function (cssResult) {
            deferred.resolve(cssResult);
        };
        settings.error = function (err) {
            console.log('SASS failed:'.error, err.debug);
            deferred.reject('');
        };

        sass.render(settings);
        return deferred.promise();
    })
    .methods({
        _processUrls: function (data, filename) {
            return this._getCssPreprocessor()._processUrls(data, filename);
        }
    })
    .createTech();