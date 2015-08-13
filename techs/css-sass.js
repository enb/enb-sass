var sass = require('node-sass');
var Vow = require('vow');
var inherit = require('inherit');
var CssPreprocessor = require('enb/lib/preprocess/css-preprocessor');
var vowFs = require('enb/lib/fs/async-fs');
var path = require('path');
var util = require('util');

module.exports = require('enb/lib/build-flow').create()
    .name('enb-sass')
    .target('target', '?.css')
    .defineOption('sass', {}) // https://github.com/sass/node-sass#options
    .useFileList(['css', 'scss'])
    .builder(function (sourceFiles) {
        var _this = this;
        var deferred = Vow.defer();
        var sassSettings = inherit({
            includePaths: [],
            data: ''
        }, this._sass);
        var errorLogging = {
            enabled: true,
            offsetLines: 5
        };

        // Prevent user mistakes
        sassSettings.includePaths = sassSettings.includePaths instanceof Array ? sassSettings.includePaths : [];
        sassSettings.data = sassSettings.data instanceof String ? sassSettings.data : '';

        var promises = sourceFiles.map(function (file) {
            var filename = file.fullname;
            var fileDir = path.dirname(filename);

            if (sassSettings.includePaths.indexOf(fileDir) === -1) {
                sassSettings.includePaths.push(fileDir);
            }

            return vowFs.read(filename, 'utf8')
                .then(function (data) {
                    data = _this._processUrls(data, filename);
                    data = _this._resolveImports(data, filename);

                    return data;
                });
        });

        Vow.all(promises)
            .then(function () {
                // Collect the contents of all files into one big string
                sassSettings.data += Array.prototype.slice.call(arguments[0], 0).join("\n");

                var successCb = sassSettings.success instanceof Function ? sassSettings.success : function () {};

                // In some cases `renderSync` does not give the data in the handler, so we use a try...catch
                try {
                    var cssResult = sass.renderSync(sassSettings).css;
                    successCb(cssResult);
                    deferred.resolve(cssResult);
                } catch (ex) {
                    ex = ex instanceof Error ? ex : JSON.parse(ex);

                    var lines = sassSettings.data.split('\n');
                    var errorCtx = lines.slice(ex.line - errorLogging.offsetLines, ex.line).concat(
                        '^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^',
                        lines.slice(ex.line + 1, ex.line + errorLogging.offsetLines + 1)
                    ).join('\n');
                    var formattedError;

                    // Finding filename
                    var i = ex.line;
                    var filename;
                    var searchString = ': begin */';
                    while (!filename) {
                        if (lines[i].indexOf(searchString, lines[i] - searchString.length) !== -1) {
                            filename = lines[i].match(/^\/\*\s+(.*):\s+begin\s+\*\/$/);
                        }
                        i--;
                    }

                    formattedError = util.format(
                        'File:%s\nMessage: %s\nContext:\n%s',
                        filename[1] + ':' + (ex.line - i - 2),
                        ex.message,
                        errorCtx
                    );

                    if (errorLogging.enabled) {
                        console.error(formattedError);
                    }

                    deferred.reject(formattedError);
                }
            }.bind(this))
            .fail(function (ex) {
                ex = err instanceof Error ? ex : JSON.parse(ex);
                deferred.reject(ex);
            });

        return deferred.promise();
    })
    .methods({
        /**
         * Resolve static files urls
         * @param {String} data sass code
         * @param {String} filename current file path
         * @return {String}
         */
        _processUrls: function (data, filename) {
            return this._getCssPreprocessor()._processUrls(data, filename);
        },

        /**
         * Resolve imported files and include it's content
         * @param {String} data sass code
         * @param {String} filename current file path
         * @return {String}
         */
        _processIncludes: function (data, filename) {
            var fileRelativeUrl = this._resolveCssUrl(filename, filename);

            return this._getCssPreprocessor()._processIncludes(data, filename).then(function (data) {
                return [
                    '/* ' + fileRelativeUrl + ': begin */',
                    data,
                    '/* ' + fileRelativeUrl + ': end */'
                ].join("\n");
            });
        },

        /**
         * Resolve `@import` files paths
         * @param {String} data sass code
         * @param {String} filename current file path
         * @return {String}
         */
        _resolveImports: function (data, filename) {
            var that = this;
            var fileRelativeUrl = this._resolveCssUrl(filename, filename);

            data = data.replace(/@import\s*(?:url\()?["']?([^"'\)]+)["']?(?:\))?\s*;/g, function (s, url) {
                var firstChar = url.charAt(0);
                if (firstChar === '\'' || firstChar === '"') {
                    url = url.substr(1, url.length - 2);
                }

                return '@import "' + that._resolveCssUrl(url, filename) + '";';
            });

            return data;
        },

        /**
         * Resolve file path for url
         * @param {String} url resolve this path
         * @param {String} filename resolve from this filepath
         * @return {String}
         * @private
         */
        _resolveCssUrl: function (url, filename) {
            return this._getCssPreprocessor()._resolveCssUrl(url, filename);
        },

        /**
         * Getting CSSPreprocessor from `css` tech`
         * @returns {Object}
         * @private
         */
        _getCssPreprocessor: function () {
            var _this = this;
            var preprocessCss = new CssPreprocessor();

            // In css-preprocessor used `hash-url` so `url(#{$var})` won't work correctly
            // Will return current css/scss file url
            preprocessCss._resolveCssUrl = function (url, filename) {
                if (url.substr(0, 5) === 'data:' ||
                    url.substr(0, 2) === '//' ||
                    ~url.indexOf('http://') ||
                    ~url.indexOf('https://')
                ) {
                    return url;
                } else {
                    return this._buildCssRelativeUrl(url, filename);
                }
            };

            preprocessCss.setCssRelativeUrlBuilder(function (url, filename) {
                var urlFilename = path.resolve(path.dirname(filename), url);
                return _this.node.relativePath(urlFilename);
            });

            return preprocessCss;
        }
    })
    .createTech();
