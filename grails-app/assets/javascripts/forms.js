//= require emitter/emitter
//= require validatejs/0.11.1/validate.js
//= require expr-eval/2.0.2/bundle
//= require forms-knockout-bindings.js
//= require ecodata-components.js
//= require speciesModel.js
//= require images.js
//= require image-gallery.js
//= require counter.js
//= require viewModels.js

// returns blank string if the property is undefined, else the value
function orBlank(v) {
    return v === undefined ? '' : v;
}
function orFalse(v) {
    return v === undefined ? false : v;
}
function orZero(v) {
    return v === undefined ? 0 : v;
}
function orEmptyArray(v) {
    return v === undefined ? [] : v;
}
/**
 * Support functions for the ecodata forms rendering feature.
 */
(function () {

    $.fn.select2.defaults.set( "width", "100%" );

    // base namespace for the forms library
    if (!window.ecodata) {
        ecodata = {forms: {}};
    }

    ecodata.forms.utils = {

        /**
         * fired when logo image is loaded. fn used to stretch small image to height or width of parent container.
         * @param imageElement the img element
         * givenWidth - (optional) width of the bounding box containing the image. If nothing is passed parent width is used.
         * givenHeight - (optional) height of the bounding box containing the image. If nothing is passed parent height is used.
         */
        findLogoScalingClass: function (imageElement, givenWidth, givenHeight) {
            var $elem = $(imageElement);
            var parentHeight = givenHeight || $elem.parent().height();
            var parentWidth = givenWidth || $elem.parent().width();
            var height = imageElement.height;
            var width = imageElement.width;

            var ratio = parentWidth/parentHeight;
            if( ratio * height > width){
                $elem.addClass('tall')
            } else {
                $elem.addClass('wide')
            }
        },
        neat_number: function (number, decimals) {
            var str = ecodata.forms.utils.number_format(number, decimals);
            if (str.indexOf('.') === -1) {
                return str;
            }
            // trim trailing zeros beyond the decimal point
            while (str[str.length - 1] === '0') {
                str = str.substr(0, str.length - 1);
            }
            if (str[str.length - 1] === '.') {
                str = str.substr(0, str.length - 1);
            }
            return str;
        },

        number_format: function (number, decimals, dec_point, thousands_sep) {
            // http://kevin.vanzonneveld.net
            // +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // +     bugfix by: Michael White (http://getsprink.com)
            // +     bugfix by: Benjamin Lupton
            // +     bugfix by: Allan Jensen (http://www.winternet.no)
            // +    revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
            // +     bugfix by: Howard Yeend
            // +    revised by: Luke Smith (http://lucassmith.name)
            // +     bugfix by: Diogo Resende
            // +     bugfix by: Rival
            // +      input by: Kheang Hok Chin (http://www.distantia.ca/)
            // +   improved by: davook
            // +   improved by: Brett Zamir (http://brett-zamir.me)
            // +      input by: Jay Klehr
            // +   improved by: Brett Zamir (http://brett-zamir.me)
            // +      input by: Amir Habibi (http://www.residence-mixte.com/)
            // +     bugfix by: Brett Zamir (http://brett-zamir.me)
            // +   improved by: Theriault
            // +      input by: Amirouche
            // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            // *     example 1: number_format(1234.56);
            // *     returns 1: '1,235'
            // *     example 2: number_format(1234.56, 2, ',', ' ');
            // *     returns 2: '1 234,56'
            // *     example 3: number_format(1234.5678, 2, '.', '');
            // *     returns 3: '1234.57'
            // *     example 4: number_format(67, 2, ',', '.');
            // *     returns 4: '67,00'
            // *     example 5: number_format(1000);
            // *     returns 5: '1,000'
            // *     example 6: number_format(67.311, 2);
            // *     returns 6: '67.31'
            // *     example 7: number_format(1000.55, 1);
            // *     returns 7: '1,000.6'
            // *     example 8: number_format(67000, 5, ',', '.');
            // *     returns 8: '67.000,00000'
            // *     example 9: number_format(0.9, 0);
            // *     returns 9: '1'
            // *    example 10: number_format('1.20', 2);
            // *    returns 10: '1.20'
            // *    example 11: number_format('1.20', 4);
            // *    returns 11: '1.2000'
            // *    example 12: number_format('1.2000', 3);
            // *    returns 12: '1.200'
            // *    example 13: number_format('1 000,50', 2, '.', ' ');
            // *    returns 13: '100 050.00'
            // Strip all characters but numerical ones.
            number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
            var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function (n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + Math.round(n * k) / k;
                };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        },
        lengthKm: function (geoJSON, linesOnly) {
            if (_.isUndefined(linesOnly)) {
                linesOnly = true;
            }
            if (linesOnly) {
                var linesOnly = _.filter(geoJSON.features, function (feature) {
                    return feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString';
                });
                geoJSON = {
                    type: 'FeatureCollection',
                    features: linesOnly
                };
            }

            return turf.length(geoJSON, {units: 'kilometers'});
        },
        areaHa: function (geoJSON) {
            var SQUARE_METERS_IN_HECTARE = 10000;
            function m2ToHa(areaM2) {
                return areaM2 / SQUARE_METERS_IN_HECTARE;
            }
            return m2ToHa(turf.area(geoJSON))
        },
        getInstanceForOutputName: function (outputName) {
            var instanceNames = ecodata.forms.utils.getViewModelInstanceNames();
            var instance;
            for (var i = 0; i < instanceNames.length; i++) {
                if (ecodata.forms[instanceNames[i]].name == outputName)
                    instance = ecodata.forms[instanceNames[i]];
            }

            return instance
        },
        getViewModelInstanceNames: function () {
            var keys = Object.keys(ecodata.forms);
            return  keys.filter (key => key.endsWith('ViewModelInstance'));
        }
    };

    /**
     * Traverses the model or binding context starting from a nested context and
     * working backwards towards the root until a property with the supplied name
     * is matched.  That property is then passed to the supplied callback.
     * Traversing backwards is simpler than forwards as we don't need to take into
     * account repeating model values (e.g. for repeating sections and table rows)
     * @param targetName the name of the model variable / property to find.
     * @param context the starting context
     * @param callback a function to invoke when the target variable is found.
     */
    ecodata.forms.navigateModel = function(targetName, context, callback) {
        if (!context) {
            return;
        }
        if (!_.isUndefined(context[targetName])) {
            callback(context[targetName]);
        }
        // If the context is a knockout binding context, $data will be the current object
        // being bound to the view.
        else if (context['$data']) {
            ecodata.forms.navigateModel(targetName, context['$data'], callback);
        }
        // The root data model is constructed with fields inside a nested "data" object.
        else if (_.isObject(context['data'])) {
            ecodata.forms.navigateModel(targetName, context['data'], callback);
        }
        // Try to evaluate against the parent - the bindingContext uses $parent and the
        // ecodata.forms.DataModelItem uses parent
        else if (context['$parent']) {
            ecodata.forms.navigateModel(targetName, context['$parent'], callback);
        }
        else if (context['parent']) {
            ecodata.forms.navigateModel(targetName, context['parent'], callback);
        }
        // Try to evaluate against the context - this is setup as a model / binding context
        // variable and refers to data external to the form - e.g. the project or activity the
        // form is related to.
        else if (context['$context']) {
            ecodata.forms.navigateModel(targetName, context['$context'], callback);
        }

    }

    /**
     * Helper function for evaluating expressions defined in the metadata.  These may be used to compute values
     * or make decisions on which constraints to apply to individual data model items.
     * The expressions are parsed and evaluated using: https://github.com/silentmatt/expr-eval
     *
     * @type {{evaluate, evaluateBoolean, evaluateString}}
     */
    ecodata.forms.expressionEvaluator = function () {

        var parser = new exprEval.Parser(
            {
                operators: {
                    'in': true
                }
            }
        );
        function any(val1, val2) {
            return val1 || val2;
        }
        parser.functions.sum = function(list, expression) {
            function add(val1, val2) {
                return Number(val1)+Number(val2);
            }
            return arrayFunction(list, expression, add, 0);
        };

        parser.functions.count = function(list, expression) {
            function count(val1, val2) {
                return val1+1;
            }
            return arrayFunction(list, expression, count, 0);
        };

        parser.functions.any = function(list, expression) {

            return arrayFunction(list, expression, any, false);
        };

        parser.functions.all = function(list, expression) {
            function all(val1, val2) {
                return val1 && val2;
            }
            return arrayFunction(list, expression, all, true);
        };

        parser.functions.none = function(list, expression) {
            return !arrayFunction(list, expression, any, false);
        };

        /**
         * Returns true if the number value1 is within tolerance*value2 of value2.
         */
        parser.functions.within = function(value1, value2, tolerance) {

            var val1 = Number(value1);
            var val2 = Number(value2);
            if (isNaN(val1) || isNaN(val2)) {
                return false;
            }
            if (val1 == 0 && val2 == 0) {
                return true;
            }
            var result = (val1 * (1-tolerance) < val2) && (val1 * (1+tolerance) > val2);

            return result;
        };

        /** Finds an object in an array by matching the value of a single property */
        parser.functions.find = function(list, property, value) {
            var obj = {};
            obj[property] = value;
            return _.findWhere(list, obj);
        };

        parser.functions.deepEquals = function(value1, value2) {
            return _.isEqual(value1, value2);
        };

        parser.functions.formatDateForValidation = function(value) {
            if (!value) {
                return '';
            }

            return moment(value).format('DD-MM-YYYY');
        };

        parser.functions.findAll = function(list, property, value) {
            var obj = {};
            obj[property] = value;
            return _.where(list, obj);
        };

        parser.functions.pluck = function(list, property, defaultValue) {
            var result = _.pluck(list, property);
            if (!result || result.length == 0) {
                result = [defaultValue];
            }
            return result;
        };

        var specialBindings = function() {

            return {
                $geom: {
                    lengthKm: ecodata.forms.utils.lengthKm,
                    areaHa: ecodata.forms.utils.areaHa
                }

            };
        }();

        function arrayFunction(array, expression, reducer, memo) {
            var parsedExpression = exprEval.Parser.parse(expression);
            var variables = parsedExpression.variables();

            return _.reduce(array, function(memo, val) {
                var result = bindVariables(variables, val);
                var value = parsedExpression.evaluate(result);
                return reducer(memo, value);
            }, memo);

        }


        var preprocessBindings = function(variable) {
            var specialVariables = {
                'index':'$index',
                'parent':'$parent'
            };
            return specialVariables[variable] ? specialVariables[variable] : variable;
        };

        function bindVariable(variable, context) {
            if (!context) {
                return;
            }
            var result = null;

            var contextVariable = preprocessBindings(variable);
            if (specialBindings[contextVariable]) {
                result = specialBindings[contextVariable];
            }
            else {
                ecodata.forms.navigateModel(contextVariable, context, function(target) {
                    result = ko.utils.unwrapObservable(target);
                });
            }
            return _.isUndefined(result) ? null : result;
        }

        function bindVariables(variables, context) {

            // Currently any expression literals have to be strings which means numeric values aren't well supported.
            var boundVariables = {};
            for (var i = 0; i < variables.length; i++) {
                boundVariables[variables[i]] = bindVariable(variables[i], context);
            }
            return boundVariables;
        }

        var expressionCache = {};

        function evaluateInternal(expression, context) {
            var parsedExpression = expressionCache[expression];
            if (!parsedExpression) {
                parsedExpression = parser.parse(expression);
                expressionCache[expression] = parsedExpression;
            }

            var variables = parsedExpression.variables();
            var boundVariables = bindVariables(variables, context);

            var result;
            try {
                result = parsedExpression.evaluate(boundVariables);
            }
            catch (e) { // undefined dependencies cause an exception to be thrown.
                result = ''; // Ignore as this is will happen when the computed is first evaluated against the model before load has been called.
            }

            return result;
        }

        function evaluateNumber(expression, context, numberOfDecimalPlaces) {

            var result = evaluateInternal(expression, context);
            var numericResult = Number(result);
            if (!isNaN(numericResult)) {
                if (numberOfDecimalPlaces == undefined) {
                    numberOfDecimalPlaces = 2;
                }

                if (_.isFunction(numericResult.toFixed)) {
                    result = numericResult.toFixed(numberOfDecimalPlaces);
                }
                else {
                    result = ecodata.forms.utils.neat_number(numericResult, numberOfDecimalPlaces);
                }

            }

            return result;
        }

        function evaluateBoolean(expression, context) {
            var result = evaluateInternal(expression, context);
            return result ? true : false;
        }

        function evaluateString(expression, context) {
            var result = evaluateInternal(expression, context);
            return ''.concat(result);
        }

        function evaluateUntyped(expression, context) {
            var result = evaluateInternal(expression, context);
            return result;
        }

        function evaluateArray(expression, context) {
            var result = evaluateInternal(expression, context);
            if (!_.isArray(result))  {
                result = [result];
            }
            return result;
        }

        return {
            evaluate: evaluateNumber,
            evaluateBoolean: evaluateBoolean,
            evaluateString: evaluateString,
            evaluateUntyped: evaluateUntyped,
            evaluateArray: evaluateArray
        }

    }();

    /**
     * evaluates a string literal value or computed expression and returns the results.
     *
     * @param value the item to evaluate.  If thing is a string it will be returned directly, otherwise it
     * is expected to be of the form:
     * {
     *     type:"computed",
     *     expression:"expressionToEvalulate"
     * }
     * @param context the context to evaluate the expression against if required.
     * @returns {*}
     */
    ecodata.forms.evaluate = function(value, context) {
        if (_.isObject(value)) {
            if (value.type == 'literal') {
                return value.value;
            }
            else if (value.expression) {
                return ecodata.forms.expressionEvaluator.evaluate(value.expression, context, value.decimalPlaces);
            }
        }
        else {
            return value;
        }
    };

    /**
     * Creates an instance of the view model identified by the supplied name.
     */
    ecodata.forms.initialiseOutputViewModel = function(outputViewModelName, dataModel, output, config, context) {

        var defaults = {
            constructorFunction : ecodata.forms[outputViewModelName + 'ViewModel'],
            dirtyFlag: ko.simpleDirtyFlag,
            viewRootElementId: 'ko'+outputViewModelName,
            recoveryDataStorageKey: output && output.outputId ? 'output-'+output.outputId : 'output-'+outputViewModelName
        };

        config = _.defaults(config, defaults);
        var viewModel = new config.constructorFunction(output, dataModel, context, config);

        viewModel.initialise(output.data).done(function() {
            // dirtyFlag must be defined after data is initialised
            // this resets the baseline for detecting changes to the model
            // - shouldn't be required if everything behaves itself but acts as a backup for
            //   any binding side-effects
            // - note that it is not foolproof as applying the bindings happens asynchronously and there
            //   is no easy way to detect its completion
            viewModel.dirtyFlag.reset();

            // Check for locally saved data for this output - this will happen in the event of a session timeout
            // for example.
            var savedData = amplify.store(config.recoveryDataStorageKey);
            var savedOutput = null;
            if (savedData) {
                savedData = $.parseJSON(savedData);

                var savedOutput;
                if (savedData.name && savedData.name == output.name) {
                    savedOutput = savedData.data;
                }
                else if (savedData.outputs) {
                    $.each(savedData.outputs, function (i, tmpOutput) {
                        if (tmpOutput.name === output.name) {
                            if (tmpOutput.data) {
                                savedOutput = tmpOutput.data;
                            }
                        }
                    });
                }
            }
            if (savedOutput) {
                viewModel.loadData(savedOutput);
            }
        });

        viewModel.dirtyFlag = config.dirtyFlag(viewModel, false);
        ko.applyBindings(viewModel, document.getElementById(config.viewRootElementId));

        return viewModel;
    };


    ecodata.forms.orDefault = function (value, defaultValue) {
        return value === undefined ? defaultValue : value;
    };

    ecodata.forms.dataLoader = function (context, config) {
        var self = this;
        self.getNestedValue = function (data, path) {

            var paths = path.split('.')
                , current = data
                , i;

            for (i = 0; i < paths.length; ++i) {

                if (current[paths[i]] == undefined) {
                    return undefined;
                } else {
                    current = current[paths[i]];
                }
            }
            return current;
        };

        /** Merge properties from obj2 into obj1 recursively, favouring obj1 unless undefined / missing. */
        self.merge = function (obj1, obj2, result, rules) {

            var keys = _.union(_.keys(obj1), _.keys(obj2));
            result = result || {};

            for (var i = 0; i < keys.length; i++) {

                var key = keys[i];
                if (obj2[key] === undefined) {
                    result[key] = obj1[key];
                }
                else if (obj1[key] === undefined && config.replaceUndefined) {
                    result[key] = obj2[key];
                }
                else if (!obj1.hasOwnProperty(key)) {
                    result[key] = obj2[key];
                }
                else if (_.isArray(obj1[key]) && _.isArray(obj2[key])) {
                    result[key] = mergeArrays(obj1[key], obj2[key], rules && rules[key]);
                }
                else if (_.isObject(obj1[key]) && _.isObject(obj2[key])) {
                    result[key] = self.merge(obj1[key], obj2[key], rules && rules[key]);
                }
                else {
                    if (rules && rules[key] && rules[key].replaceExisting) {
                        result[key] = obj2[key];
                    }
                    else {
                        result[key] = obj1[key];
                    }
                }
            }
            return result;
        };

        /**
         * Checks if the list of properties identified by name in the keys array match in both obj1 and obj2.
         */
        function matches(obj1, obj2, keys) {
            for (var i=0; i<keys.length; i++) {
                if (obj1[keys[i]] != obj2[keys[i]]) {
                    return false;
                }
            }
            return true;
        }

        function mergeArrays(array1, array2, rules) {
            if (rules) {
                var result = [];

                // Align each row of array2 with array1.
                for (var i=0; i<array1.length; i++) {

                    // Find the entry in row 2 that matches the row 1 key
                    var matchingItemFromArray2 = _.find(array2 || [], function(obj2) {
                        return matches(array1[i], obj2, rules.keys);
                    });

                    // If there is no row in the pre-pop data matching an existing saved row, check the rules
                    // to see if we keep the existing saved row or discard it.
                    if (matchingItemFromArray2 || !rules.deleteUnmatchedExistingRows) {
                        result.push(self.merge(array1[i], matchingItemFromArray2 || {}, {}, rules));
                    }
                }

                // Deal with extra items from array 2 if we should add new rows from the pre-pop data
                if (rules.addUnmatchedNewRows) {
                    for (var i=0; i<array2.length; i++) {
                        // Find the entry in row 1 that matches the row 2 key
                        var matchingItemFromArray1 = _.find(array1 || [], function(obj1) {
                            return matches(array2[i], obj1, rules.keys);
                        });

                        if (!matchingItemFromArray1) {
                            result.push(array2[i]);
                        }
                    }
                }
                if (rules.keys && rules.sort) {
                    result = _.sortBy(result, function(value) {
                        var sortKey = '';
                        for (var i=0; i<rules.keys.length; i++) {
                            sortKey += value[rules.keys[i]];
                        }
                        return sortKey;
                    });
                }
                return result;
            }
            else {
                // Do the merge based on the row index.
                if (array2.length > array1.length) {
                    array2.splice(array1.length, array2.length - array1.length); // Delete extra array elements from obj2.
                }
                return self.merge(array1, array2, []);
            }
        }

        self.prepop = function (conf) {
            return self.getPrepopData(conf).then(function (prepopData) {
                if (prepopData) {
                    var result = prepopData;
                    var mapping = conf.mapping;

                    function postProcessPrepopData(processingFunction, processingConfig, data) {
                        if (!_.isArray(data)) {
                            throw "Filter/find is only supported for array typed prepop data."
                        }
                        if (!processingConfig.expression) {
                            throw "Missing expression attribute in configuration"
                        }
                        return processingFunction(data, function(item) {
                            var expression = processingConfig.expression;
                            var namespace = processingConfig['namespace'] || 'item';
                            var evalContext = {};
                            evalContext[namespace] = item;

                            var evalContext = _.extend(evalContext, {$context:context, $config:config});
                            return ecodata.forms.expressionEvaluator.evaluateBoolean(expression, evalContext);
                        });
                    }

                    if (conf.filter) {
                        result = postProcessPrepopData(_.filter, conf.filter, result);
                    }
                    else if (conf.find) {
                        result = postProcessPrepopData(_.find, conf.find, result);
                    }

                    if (mapping) {
                        result = self.map(mapping, result);
                    }
                    return result;
                }
            });
        };

        self.map = function (mappingList, data) {
            var result;
            if (_.isArray(data)) {
                result = [];
                _.each(data, function (d) {
                    result.push(self.mapObject(mappingList, d));
                });
            }
            else {
                result = self.mapObject(mappingList, data);
            }

            return result;
        };

        self.mapObject = function (mappingList, data) {
            var result = {};

            _.each(mappingList, function (mapping) {

                // Presence of a nested mapping element indicates a list.
                if (_.has(mapping, 'mapping')) {
                    result[mapping.target] = [];
                    var selectedData = self.getNestedValue(data, mapping['source-path']);
                    _.each(selectedData, function (d) {
                        var nestedResult = self.map(mapping.mapping, d);
                        if (nestedResult) {
                            result[mapping.target].push(nestedResult);
                        }

                    });
                }
                else {
                    result[mapping.target] = self.getNestedValue(data, mapping['source-path']);
                }
            });
            return result;
        };

        self.getPrepopData = function (conf) {
            var source = conf.source;
            if (source.url) {
                var failedValidation = false;
                var url = (config.prepopUrlPrefix || window.location.href) + source.url;
                var params = [];
                _.each(source.params || [], function(param) {
                    var value;
                    if (param.type && param.type == 'computed') {
                        // evaluate the expression against the context.
                        value = ecodata.forms.expressionEvaluator.evaluateUntyped(param.expression, context);
                        if (param.required && !value) {
                            failedValidation = true;
                        }
                    }
                    else {
                        // Treat it as a literal
                        value = param.value;
                    }

                    // Unroll the array to prevent jQuery appending [] to the array typed parameter name.
                    if (_.isArray(value)) {
                        for (var i=0; i<value.length; i++) {
                            params.push({name:param.name, value: value[i]});
                        }
                    }
                    else {
                        params.push({name:param.name, value: value});
                    }
                });
                if (failedValidation) {
                    return $.Deferred().resolve(source.defaultValue || null);
                }
                return $.ajax(url, {data:params, dataType:source.dataType || 'json'});
            }
            var deferred = $.Deferred();
            var data = null;
            if (source && source.hasOwnProperty('context-path')) {
                data = context;
                if (source['context-path']) {
                    data = self.getNestedValue(context, source['context-path']);
                }
            }
            else if (source && source.hasOwnProperty('literal')) {
                data = source['literal'];
            }

            // Support for converting array typed values to lookup tables.
            // e.g. MERIT has a list of data sets that we want to be selectable from a list then
            // the full data set to be available for lookup by id (using the lookupTable data type)
            if (source['index-by']) {
                data = _.indexBy(data, source['index-by'])
            }

            deferred.resolve(data);
            return deferred;
        };

        return {
            getPrepopData: self.getPrepopData,
            prepop: self.prepop,
            merge: self.merge
        };

    };
    function applyIncludeExclude(metadata, outputModel, dataModelItem, initialConstraints) {
        var path = metadata.constraints.excludePath || metadata.constraints.includePath;

        var currentValue = dataModelItem();
        var selectedSoFar = outputModel.getModelValuesForPath(path);

        if (metadata.constraints.excludePath) {
            var filteredConstraints = _.filter(initialConstraints, function (value) {
                // Handle object valued constraints - however the functions are attached after the first call to
                // the computed observable, so we need to guard against that.
                value = _.isFunction(dataModelItem.constraintValue) ? dataModelItem.constraintValue(value) : value;
                var isCurrentSelection = _.isArray(currentValue) ? currentValue.indexOf(value) >= 0 : value == currentValue;
                var include = (isCurrentSelection || selectedSoFar.indexOf(value) < 0);
                return include;
            });
            return filteredConstraints;
        } else {
            // Note that the "includePath" option does not support object (key/value) typed constraints as
            // it needs to collect values from other form selections which won't be object typed.
            var constraints = initialConstraints.concat(selectedSoFar);
            var currentSelection = _.isArray(currentValue) ? currentValue : [currentValue];
            for (var i = 0; i < currentSelection.length; i++) {

                if (currentSelection[i] != null && constraints.indexOf(currentSelection[i]) < 0) {
                    constraints.push(currentSelection[i]);
                }
            }

            return constraints;
        }
    }
    /**
     * Implements the constraints specified on a single data model item using the "constraints" attribute in the metadata.
     * Also provides access to global configuration and context for components that need it.
     *
     * @param metadata the metadata definition for the data model item.
     * @param parent the container (e.g. OutputModel or NestedModel) in which this data model item is defined.  Used to make
     * the parent data available for expression evaluation or constraint evaluation.  Also used for id building.
     * @param context global context in which the form is being rendered.  For MERIT/BioCollect this will include
     * project/site/activity/survey type information.  Also contains the parent object and index for nested data items.
     * @param config other configuration items, such as URLs for species searching etc.
     */
    ecodata.forms.DataModelItem = function (metadata, context, config) {
        var self = this;

        self.context = context;
        self.config = config;

        // This context is created for use by the expression evaluator.  It contains the data model item itself
        // as well as the parent data model item and the output model.
        var dataContext = (context && context.parent) ? context.parent : context;
        var constraintsInititaliser = null;
        function buildPrepopConstraints(constraintsConfig, constraintsDeferred) {
            var defaultConstraints = constraintsConfig.defaults || [];
            var constraintsObservable = ko.observableArray(defaultConstraints);
            var dataLoaderContext = _.extend({}, context);
            var dataLoader = ecodata.forms.dataLoader(dataLoaderContext, config);

            ko.computed(function() {
                var prepopConf = constraintsConfig.config;
                // If the prepop needs to post process the data, we need to execute the post processing
                // in the context of the computed so as to register any dependencies on values used in
                // the post-processing expressions.
                // The dataloader won't execute post processing synchronously as retrieving the data can be done
                // via a remote call.
                if (prepopConf.filter) {
                    ecodata.forms.expressionEvaluator.evaluate(prepopConf.filter.expression, dataLoaderContext);
                }
                if (prepopConf.find) {
                    ecodata.forms.expressionEvaluator.evaluate(prepopConf.find.expression, dataLoaderContext);
                }
                dataLoader.prepop(prepopConf).done(function (data) {
                    constraintsObservable(data);
                    constraintsDeferred.resolve();
                });
            });

            return constraintsObservable;
        }

        /**
         * Finds the model attribute with the specified name searching from the context of this
         * DataModelItem if no context is supplied.
         * This is so that for nested items we can find the nearest neighbour with the specified name. (e.g.
         * when the model represents a repeating section or table row)
         */
        self.findNearestByName = function(targetName, context) {
            if (!context) {
                context = self.context;
            }
            var result = null;
            ecodata.forms.navigateModel(targetName, context, function(target) {
                result = target;
            })
            return result;
        }

        function attachIncludeExclude(constraints) {
            return ko.computed(function() {
                return applyIncludeExclude(metadata, context.outputModel, self, ko.utils.unwrapObservable(constraints));
            });
        }

        /**
         * Returns the value of the specified metadata property (e.g. validate, constraints etc)
         * @param property the name of the proprety to get.
         * @returns {*}
         */
        self.get = function (property) {
            return metadata[property];
        };

        self.getName = function() {
            return metadata.name;
        };

        var cachedId;
        /**
         * Produces a unique id for this item based on the parent, item name and index (for nested items).
         * @returns {*}
         */
        self.getId = function() {
            // Lazily calculate the id.
            if (cachedId) {
                return cachedId;
            }
            cachedId = config.outputName +'-'+self.getName();
            if (!_.isUndefined(context.index)) {
                cachedId += "-"+context.index;
            }
            return cachedId;

        };

        self.checkWarnings = function () {
            //var rules = str.split(/\[|,|\]/);
            var warningRule = metadata.warning;

            var constraints = {
                val: warningRule
            };
            var data = ko.utils.unwrapObservable(self); // The SpeciesViewModel is a DataModelItem but not a knockout observable
            return validate({val: data}, constraints, {fullMessages: false});
        };

        self.evaluateBehaviour = function (type, defaultValue) {
            var rule = _.find(metadata.behaviour, function (rule) {
                return rule.type === type && ecodata.forms.expressionEvaluator.evaluateBoolean(rule.condition, dataContext);
            });

            return rule && rule.value || defaultValue;
        };

        if (metadata.constraints) {
            var valueProperty = 'id'; // For compatibility with select2 defaults
            var textProperty = 'text'; // For compatibility with select2 defaults
            if (_.isObject(metadata.constraints)) {
                valueProperty = metadata.constraints.valueProperty || valueProperty;
                textProperty = metadata.constraints.textProperty || textProperty;
            }
            // These need to be defined before the computed constraint is defined to support correct evaluation
            // of the excludePath function.
            self.constraintValue = function (constraint) {
                if (_.isObject(constraint)) {
                    return constraint[valueProperty];
                }
                return constraint;
            };
            self.constraintText = function(constraint) {
                if (_.isObject(constraint)) {
                    return constraint[textProperty];
                }
                return constraint;
            };
            self.constraints = [];
            var includeExcludeDefined = metadata.constraints.excludePath || metadata.constraints.includePath;
            // Support existing configuration style.
            if (_.isArray(metadata.constraints)) {
                self.constraints = [].concat(metadata.constraints);
            }
            else if (_.isObject(metadata.constraints)) {
                if (metadata.constraints.type == 'computed') {
                    if (_.isArray(metadata.constraints.options)) {
                        self.constraints = ko.computed(function () {
                            var rule = _.find(metadata.constraints.options, function (option) {
                                return ecodata.forms.expressionEvaluator.evaluateBoolean(option.condition, context);
                            });
                            var evaluatedConstraints = rule ? rule.value : metadata.constraints.default;
                            return evaluatedConstraints || metadata.constraints.default || [];
                        });
                    } else if (includeExcludeDefined) {
                        self.constraints = metadata.constraints.default || [];
                    }
                }
                else if (metadata.constraints.type == 'pre-populated') {
                    constraintsInititaliser = $.Deferred();
                    self.constraints = buildPrepopConstraints(metadata.constraints, constraintsInititaliser);
                }
                else if (metadata.constraints.type == 'literal' || metadata.constraints.literal) {
                    self.constraints = [].concat(metadata.constraints.literal);
                }

                if (includeExcludeDefined) {
                    self.constraints = attachIncludeExclude(self.constraints);
                }
            }

            self.constraints.value = self.constraintValue;
            self.constraints.text = self.constraintText;
            self.constraints.label = function(value) {

                if (!value && ko.isObservable(self))  {
                    value = self();
                }
                var constraints = ko.utils.unwrapObservable(self.constraints);

                var match = _.find(constraints, function(constraint) {
                    return self.constraints.value(constraint) == value;
                });
                if (match) {
                    return self.constraints.text(match);
                }
                return '';
            }
        }

        if (metadata.displayOptions) {
            self.displayOptions = metadata.displayOptions;
        }
        self.load = function(data) {
            if (constraintsInititaliser) {
                constraintsInititaliser.always(function() {
                    self(data);
                })
            }
            else {
                self(data);
            }
            return constraintsInititaliser;
        }
    };

    ecodata.forms.configManager = function(config, context) {
        if (!config) {
            config = {}
        }

        function getConfig(key, dataModelItem) {
            var clientConfig = config[key] || config;
            return _.defaults(clientConfig, dataModelItem.config);
        };

        return {
            getConfig: getConfig
        }

    };

    /**
     * Provides helper functionality for "list" data types.
     * @param dataModel the dataModel definition for the list from the form metadata (dataModel.json)  This is the
     * nested dataModel items found in the columns attribute of data model items with dataType = "list"
     * @param ListItemType the constructor function to call when creating data to store in the list.
     * @param context the context in which the view model is being rendered.
     * @param userAddedRows flag indicating if new values can be added to the list by the user at runtime.
     * @param config configuration for the view model, mostly URLs.
     * @constructor
     */
    ecodata.forms.OutputListSupport = function (dataModel, ListItemType, context, userAddedRows, config) {
        var self = this;

        var toIgnore = {ignore: ['transients', '$parent', '$index', '$context', 'dataModel']};
        var parent = context.parent;
        var listName = context.listName;
        var modelName = context.outputModel.name;

        self.listName = listName;
        self.addRow = function (data) {
            var newItem = self.newItem(data, self.rowCount());
            self.push(newItem);
            return newItem.loadData(data || {});
        };
        self.newItem = function (data, index) {
            var itemDataModel = _.indexBy(dataModel[listName].columns, 'name');
            var itemContext = _.extend({}, context, {index: index, parent: context.parent});
            return new ListItemType(data, itemDataModel, itemContext, config);
        };
        self.removeRow = function (item) {
            self.remove(item);
        };
        self.rowCount = function () {
            return self().length;
        };
        self.appendTableRows = ko.observable(userAddedRows);
        self.tableDataUploadVisible = ko.observable(false);
        self.showTableDataUpload = function () {
            self.tableDataUploadVisible(!self.tableDataUploadVisible());
        };

        self.downloadTemplate = function () {
            // Download a blank template if we are appending, otherwise download a template containing the existing data.
            if (self.appendTableRows()) {
                var url = config.excelOutputTemplateUrl + '?listName=' + listName + '&type=' + modelName;
                $.fileDownload(url)
                    .fail(function (error){
                            bootbox.alert('File download failed! ' + error);
                     });
            }
            else {
                self.downloadTemplateWithData(true, userAddedRows)
                    .fail(function (error){
                        bootbox.alert('File download failed! ' + error);
                     });
            }
        };

        self.downloadTableData = function() {
            self.downloadTemplateWithData(false, false);
        };
        self.downloadTemplateWithData = function (editMode, userAddedRows) {
            var data = ko.mapping.toJS(self(), toIgnore);
            var params = {
                listName: listName,
                type: modelName,
                editMode: editMode || false,
                allowExtraRows: userAddedRows || false,
                data: JSON.stringify(data)
            };
            var url = config.excelOutputTemplateUrl;
            $.fileDownload(url, {
                httpMethod: 'POST',
                data: params
            });
        };
        self.tableDataUploadOptions = {
            url: config.excelDataUploadUrl,
            done: function (e, data) {
                if (data.result.error) {
                    self.uploadFailed(data.result.error);
                }
                else {
                    parent['load' + listName](data.result.data, self.appendTableRows());
                }
            },
            fail: function (e, data) {
                self.uploadFailed(data);
            },
            dataType: 'json',
            uploadTemplateId: listName + "template-upload",
            downloadTemplateId: listName + "template-download",
            formData: {type: context.outputModel.name, listName: listName}

        };
        self.uploadFailed = function (message) {
            var text = "<span class='label label-important'>Important</span><h4>There was an error uploading your data.</h4>";
            if (message.jqXHR){
                var resp = message.jqXHR.responseJSON
                text += "<p>" + resp.error + "</p>";
            }else{
                text += "<p>" + message + "</p>";
            }
            bootbox.alert(text)

        };
        self.allowUserAddedRows = userAddedRows;
        self.findDocumentInContext = function (documentId) {
            return context.outputModel.findDocumentInContext(documentId);
        };

        parent['load' + listName] = function (data, append) {
            var initialisers = [];
            if (!append) {
                self([]);
            }
            if (data === undefined) {
                initialisers = initialisers.concat(self.loadDefaults());
            }
            else {
                _.each(data, function (row, i) {
                    initialisers = initialisers.concat(self.addRow(row));
                });
            }
            return initialisers;
        };
    };

    /**
     * The lookup table can take two main forms - a direct map / dictionary style lookup
     * to generally produce one string value from another, or a numeric range based lookup to
     * generally produce one string value from a number based on what range the number
     * falls into.
     * @param context used for data loading or evaluating expressions
     * @param config defines the format of the lookup table.  The general format is an array
     * with each element of the form: {input:<>, output:<>} for the dictionary style lookup
     * or {inputMin:<>, inputMax:<>, output:<>>} for the numeric style lookup.
     * A dictionary style lookup table can also be configured as a javascript object
     * where the attributes will be used as the input keys and the values of the attribute
     * the associated output.
     * @constructor
     */
    ecodata.forms.LookupTable = function(context, config) {
        var self = this;

        self.table = {};
        var dataLoader = ecodata.forms.dataLoader(context, config);

        // We support both object key/value mapping and an array of objects with input / output keys.
        // This is both to keep compatibility with the previous syntax and to allow keys with '.' characters
        // in them, which is not supported by mongo so the object method cannot be used for lookup tables
        // with '.''s in the keys.
        self.initialization = dataLoader.prepop(config).done(function (data) {
            if (!_.isArray(data)) {
                self.table = [];
                _.each(data, function(value, key) {
                    self.table.push({input:key, output:value});
                });
            }
            else {
                self.table = data;
            }
        });

        self.lookupRange = function(value) {
            var input = Number(value);
            for (var i=0; i<self.table.length; i++) {
                if (input < self.table[i].inputMin) {
                    return
                }
                else if (input <= self.table[i].inputMax) {
                    return  self.table[i].output;
                }
            }
            return undefined;
        }

        self.lookupValue = function(key) {
            var value = null;
            var match = _.find(self.table, function(entry) {
                return key == entry.input;
            });

            if (match) {
                value = match.output;
            }
            return value;
        }
    }

    ecodata.forms.NestedModel = function (data, dataModel, context, config) {
        var self = this;

        // Expose the context as properties to make it available to formula bindings
        self.$parent = context.parent;
        self.$index = context.index;
        self.$context = _.extend({}, context, {$parent:self});
        self.dataModel = dataModel;
        if (!data) {
            data = {};
        }
        self.transients = {};

        if (config.edit && config.editableRows) {
            self.isSelected = ko.obserable(false);
            this.commit = function () {
                self.doAction('commit');
            };
            this.reset = function () {
                self.doAction('reset');
            };
            this.doAction = function (action) {
                var prop, item;
                for (prop in self) {
                    if (self.hasOwnProperty(prop)) {
                        item = self[prop];
                        if (ko.isObservable(item) && item[action]) {
                            item[action]();
                        }
                    }
                }
            };
            this.isNew = false;
            this.toJSON = function () {
                return ko.mapping.toJS(this, {'ignore': ['transients', 'isNew', 'isSelected']});
            };

        }

    };

    /**
     * All view models rendered by the forms rendering subsystem will extend an instance of OutputModel.
     *
     * @param output the Output instance to be rendered as a form.
     * @param dataModel the dataModel definition from the form metadata (dataModel.json)
     * @param context any context in which this output is being rendered (project / activity / site etc).  Used for pre-population.
     * @param config configuration for the view model, mostly URLs.
     * @constructor
     */
    ecodata.forms.OutputModel = function (output, dataModel, context, config) {

        var self = this;
        context.outputModel = self;

        var dataLoader = ecodata.forms.dataLoader(context, config);
        if (!output) {
            output = {};
        }
        self.dataModel = _.indexBy(dataModel, 'name');

        // Make this properties available to the binding context for use by components.
        self.$context = _.extend({output:output, root:self, $parent:self}, context);

        self.$config = ecodata.forms.configManager(config, context);

        var activityId = output.activityId || config.activityId;
        self.name = output.name;
        self.outputId = output.outputId || '';

        self.data = {};
        self.transients = {};
        var notCompleted = output.outputNotCompleted;

        if (notCompleted === undefined) {
            notCompleted = config.collapsedByDefault;
        }

        var toIgnore = {ignore: ['transients', '$parent', '$index', '$context', '$config', 'dataModel']};
        self.outputNotCompleted = ko.observable(notCompleted);

        self.outputNotCompleted.subscribe(function (newValue) {

            if (newValue && self.dirtyFlag && self.dirtyFlag.isDirty()) {
                bootbox.confirm("Any data you have entered into this section will be deleted when you save the form.  Continue?", function (result) {
                    if (!result) {
                        self.outputNotCompleted(false);
                    }
                });
            }
        });
        self.transients.optional = config.optional || false;
        self.transients.questionText = config.optionalQuestionText || 'Not applicable';
        self.transients.description = config.outputDescription;
        self.transients.collapsedByDefault = config.collapsedByDefault || false;
        self.transients.collapsibleHeading = config.collapsibleHeading;
        self.transients.dummy = ko.observable();

        self.downloadTemplate = function (listName) {
            var url = config.excelOutputTemplateUrl + '?listName=' + listName + '&type=' + output.name;
            $.fileDownload(url);
        };

        self.downloadDataTemplate = function (listName, editMode, userAddedRows) {
            var data = ko.mapping.toJS(self.data[listName](), toIgnore);
            var params = {
                listName: listName,
                type: self.name,
                editMode: editMode,
                allowExtraRows: userAddedRows,
                data: JSON.stringify(data)
            };
            var url = config.excelOutputTemplateUrl;
            $.fileDownload(url, {
                httpMethod: 'POST',
                data: params
            });

        };
        // this will be called when generating a savable model to remove transient properties
        self.removeTransients = function (jsData) {
            delete jsData.activityType;
            delete jsData.transients;
            delete jsData.data.locationSitesArray;
            return jsData;
        };

        // this returns a JS object ready for saving
        self.modelForSaving = function () {
            // get model as a plain javascript object
            var jsData = ko.mapping.toJS(self, toIgnore);
            if (self.outputNotCompleted()) {
                jsData.data = {};
            }

            // get rid of any transient observables
            return self.removeBeforeSave(jsData);
        };

        // this is a version of toJSON that just returns the model as it will be saved
        // it is used for detecting when the model is modified (in a way that should invoke a save)
        // the ko.toJSON conversion is preserved so we can use it to view the active model for debugging
        self.modelAsJSON = function () {
            return JSON.stringify(self.modelForSaving());
        };

        self.loadOrPrepop = function (data) {

            var result = data || {};

            var deferred = $.Deferred();
            var waitingOn = [];

            if (config && !config.disablePrepop && config.model) {
                var conf = config.model['pre-populate'];

                if (conf) {
                    _.each(conf, function (item) {
                        if (item.merge || !data) {
                            waitingOn.push(dataLoader.prepop(item).done(function (prepopData) {
                                if (prepopData) {
                                    _.extend(result, dataLoader.merge(result, prepopData, result, item.merge));
                                }
                            }));
                        }
                    });
                }
            }
            // Wait for all configured pre-pop to complete, then resolve our deferred.
            $.when.apply($, waitingOn).then(function () {
                deferred.resolve(result);
            });

            return deferred;
        };

        /**
         * Invokes the callback function for each value of the specified path in this model.
         * The path must treat array/list valued items as a simple property name (without
         * an index) - each array in the path will be iterated over so the callback may be
         * invoked more than once.
         * @param path a string specifying the path to the item of interest e.g. 'list1.list2.property'
         * @param callback a function taking a single argument which will be the value of the property
         * specified by path.
         */
        self.eachValueForPath = function(path, callback) {
            var pathAsArray = path.split('.');
            self.iterateOverPath(pathAsArray, callback, self.data);
        }

        /**
         * Iterates over every instance of the DataModelItem defined by path and returns an array containing
         * the values found at each item.
         * @param path the path to the data model item of interest (e.g. list.nestedList.textValue1)
         * @returns {*[]}
         */
        self.getModelValuesForPath = function(path) {
            var values = [];
            self.eachValueForPath(path, function (val) {
                if (_.isArray(val)) {
                    values = values.concat(val);
                } else if (val != null) {
                    values.push(val);
                }
            });
            return values;
        }

        /**
         * Recursively iterates over each element in the supplied pathAsArray, taking into
         * account when values are lists.
         * @param pathAsArray
         * @param callback
         * @param dataModel
         */
        self.iterateOverPath = function(pathAsArray, callback, dataModel) {
            var modelItem = ko.utils.unwrapObservable(dataModel[pathAsArray[0]]);

            function nextPath(model) {
                var nextPath = pathAsArray.slice(1);
                self.iterateOverPath(nextPath, callback, model);
            }
            // If the current model is an array, iterate over all elements in the array.
            if (_.isArray(modelItem)) {
                for (var i=0; i<modelItem.length; i++) {
                    nextPath(modelItem[i]);
                }
            }
            // Otherwise, just move deeper into the object hierarchy
            else if (pathAsArray.length > 1) {
               nextPath(modelItem);
            }
            // If we are at the final element of the path, we have reached the value we are after, so
            // invoke the callback with this value.
            else if (pathAsArray.length == 1) {
                callback(modelItem);
            }
        }

        self.attachDocument = function (target) {
            var url = config.documentUpdateUrl || fcConfig.documentUpdateUrl;
            var documentOwner = config.documentOwner || {activityId: activityId, projectId: config.projectId};
            showDocumentAttachInModal(url, new DocumentViewModel({
                role: 'information',
                stage: config.stage
            }, documentOwner), '#attachDocument')
                .done(function (result) {
                    // checking documentid to void adding empty document into the attachment table
                    // documentid only return true if document is successfully save
                    if (result.documentId != undefined) {
                        target(new DocumentViewModel(result))
                    }
                });
        };
        self.editDocumentMetadata = function (document) {
            var url = (config.documentUpdateUrl || fcConfig.documentUpdateUrl) + "/" + document.documentId;
            showDocumentAttachInModal(url, document, '#attachDocument');
        };
        self.deleteDocument = function (document) {
            document.status('deleted');
            var url = (config.documentDeleteUrl || fcConfig.documentDeleteUrl) + '/' + document.documentId;
            $.post(url, {}, function () {
            });

        };

        self.uploadFailed = function (message) {
            var text = "<span class='label label-important'>Important</span><h4>There was an error uploading your data.</h4>";
            text += "<p>" + message + "</p>";
            bootbox.alert(text)
        };

        self.buildTableOptions = function (list) {

            var listName = list.listName;
            return {
                url: config.excelDataUploadUrl,
                done: function (e, data) {
                    if (data.result.error) {
                        self.uploadFailed(data.result.error);
                    }
                    else {
                        self['load' + listName](data.result.data, list.appendTableRows());
                    }
                },
                fail: function (e, data) {
                    self.uploadFailed(data);
                },
                dataType: 'json',
                uploadTemplateId: listName + "template-upload",
                downloadTemplateId: listName + "template-download",
                formData: {type: output.name, listName: listName}
            };
        };
        self.findDocumentInContext = function (documentId) {
            return _.find(context.documents || [], function (document) {
                return document.documentId === documentId;
            })
        };

        function checkWarningsInObject(items, obj) {
            var warnings = []
            _.each(items, function (item) {
                var dataModelItem = obj[item.name];
                if (item.dataType == 'list') {
                    _.each(obj[item.name](), function (listItem) {
                        warnings = warnings.concat(checkWarningsInObject(item.columns, listItem));
                    });
                }
                else if (dataModelItem && typeof dataModelItem.checkWarnings == 'function') {
                    var warning = dataModelItem.checkWarnings();
                    if (warning) {
                        warnings.push(warning);
                    }
                }
            });

            return warnings;
        }

        self.checkWarnings = function () {
            return checkWarningsInObject(dataModel, self.data);
        };

        self.isMapPresent = function () {
            return !!self.mapElementId
        };

        self.initialise = function (outputData) {
            var deferred = $.Deferred();
            self.loadOrPrepop(outputData).done(function (data) {
                var initialisers = self.loadData(data);

                $.when.apply($, initialisers).then(function () {
                    deferred.resolve();
                    self.transients.dummy.notifySubscribers();
                });
            });
            return deferred;
        };

        self.clearDataIfOutputMarkedAsNotCompleted = function() {
            if (self.outputNotCompleted() && self.dirtyFlag && self.dirtyFlag.isDirty()) {
                self.loadData({});
            }
        }

    };
}());
