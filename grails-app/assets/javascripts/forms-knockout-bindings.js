/**
 * Custom knockout bindings used by the forms library
 */
(function() {

    /**
     * Exposes extra context to child bindings via the binding context.
     * Used as a mechanism to allow clients to pass configuration to
     * components rendered by this plugin.
     */
    ko.bindingHandlers.withContext = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            // Make a modified binding context, with a extra properties, and apply it to descendant elements
            var innerBindingContext = bindingContext.extend(valueAccessor);
            ko.applyBindingsToDescendants(innerBindingContext, element);

            // Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
            return { controlsDescendantBindings: true };
        }
    };

    var image = function(props) {

        var imageObj = {
            id:props.id,
            name:props.name,
            size:props.size,
            url: props.url,
            thumbnail_url: props.thumbnail_url,
            viewImage : function() {
                window['showImageInViewer'](this.id, this.url, this.name);
            }
        };
        return imageObj;
    };

    ko.bindingHandlers.photoPointUpload = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {

            var defaultConfig = {
                maxWidth: 300,
                minWidth:150,
                minHeight:150,
                maxHeight: 300,
                previewSelector: '.preview'
            };
            var size = ko.observable();
            var progress = ko.observable();
            var error = ko.observable();
            var complete = ko.observable(true);

            var uploadProperties = {

                size: size,
                progress: progress,
                error:error,
                complete:complete

            };
            var innerContext = bindingContext.createChildContext(bindingContext);
            ko.utils.extend(innerContext, uploadProperties);

            var config = valueAccessor();
            config = $.extend({}, config, defaultConfig);
            var dropzone = $(element);
            var target = config.target; // Expected to be a ko.observableArray
            $(element).fileupload({
                url:config.url,
                autoUpload:true,
                dataType:'json',
                dropZone: dropzone
            }).on('fileuploadadd', function(e, data) {
                complete(false);
                progress(1);
            }).on('fileuploadprocessalways', function(e, data) {
                if (data.files[0].preview) {
                    if (config.previewSelector !== undefined) {
                        var previewElem = $(element).parent().find(config.previewSelector);
                        previewElem.append(data.files[0].preview);
                    }
                }
            }).on('fileuploadprogressall', function(e, data) {
                progress(Math.floor(data.loaded / data.total * 100));
                size(data.total);
            }).on('fileuploaddone', function(e, data) {

//            var resultText = $('pre', data.result).text();
//            var result = $.parseJSON(resultText);


                var result = data.result;
                if (!result) {
                    result = {};
                    error('No response from server');
                }

                if (result.files[0]) {
                    target.push(result.files[0]);
                    complete(true);
                }
                else {
                    error(result.error);
                }

            }).on('fileuploadfail', function(e, data) {
                error(data.errorThrown);
            });

            ko.applyBindingsToDescendants(innerContext, element);

            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers.imageUpload = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var defaultConfig = {
                maxWidth: 300,
                minWidth:150,
                minHeight:150,
                maxHeight: 300,
                previewSelector: '.preview',
                viewModel: viewModel
            };
            var size = ko.observable();
            var progress = ko.observable();
            var error = ko.observable();
            var complete = ko.observable(true);

            var config = valueAccessor();
            config = $.extend({}, config, defaultConfig);

            var target = config.target,
                dropZone = $(element).find('.dropzone');

            var context = config.context;
            var uploadProperties = {
                size: size,
                progress: progress,
                error:error,
                complete:complete
            };

            var innerContext = bindingContext.createChildContext(bindingContext);
            ko.utils.extend(innerContext, uploadProperties);
            var previewElem = $(element).parent().find(config.previewSelector);

            // For a reason I can't determine, when forms are loaded via ajax the
            // fileupload widget gets a blank widgetEventPrefix. (normally it would be 'fileupload').
            // This checks for this condition and registers the correct event listeners.
            var eventPrefix = 'fileupload';
            if ($.blueimp && $.blueimp.fileupload) {
                eventPrefix =  $.blueimp.fileupload.prototype.widgetEventPrefix;
            }

            $(element).fileupload({
                url:config.url,
                autoUpload:true,
                dropZone: dropZone,
                pasteZone: null,
                dataType:'json'
            }).on(eventPrefix+'add', function(e, data) {
                previewElem.html('');
                complete(false);
                progress(1);
            }).on(eventPrefix+'processalways', function(e, data) {
                if (data.files[0].preview) {
                    if (config.previewSelector !== undefined) {
                        previewElem.append(data.files[0].preview);
                    }
                }
            }).on(eventPrefix+'progressall', function(e, data) {
                progress(Math.floor(data.loaded / data.total * 100));
                size(data.total);
            }).on(eventPrefix+'done', function(e, data) {
                var result = data.result;
                var $doc = $(document);
                if (!result) {
                    result = {};
                    error('No response from server');
                }

                if (result.files[0]) {
                    result.files.forEach(function( f ){
                        // flag to indicate the image is in biocollect and needs to be save to ecodata as a document
                        var data = {
                            thumbnailUrl: f.thumbnail_url,
                            url: f.url,
                            contentType: f.contentType,
                            filename: f.name,
                            name: f.name,
                            filesize: f.size,
                            dateTaken: f.isoDate,
                            staged: true,
                            attribution: f.attribution,
                            licence: f.licence
                        };

                        target.push(new ImageViewModel(data, true, context));

                        if(f.decimalLongitude && f.decimalLatitude){
                            $doc.trigger('imagelocation', {
                                decimalLongitude: f.decimalLongitude,
                                decimalLatitude: f.decimalLatitude
                            });
                        }

                        if(f.isoDate){
                            $doc.trigger('imagedatetime', {
                                date: f.isoDate
                            });
                        }

                    });

                    complete(true);
                }
                else {
                    error(result.error);
                }

            }).on(eventPrefix+'fail', function(e, data) {
                error(data.errorThrown);
            });

            ko.applyBindingsToDescendants(innerContext, element);

            return { controlsDescendantBindings: true };
        }
    };

    ko.bindingHandlers.editDocument = {
        init:function(element, valueAccessor) {
            if (ko.isObservable(valueAccessor())) {
                var document = ko.utils.unwrapObservable(valueAccessor());
                if (typeof document.status == 'function') {
                    document.status.subscribe(function(status) {
                        if (status == 'deleted') {
                            valueAccessor()(null);
                        }
                    });
                }
            }
            var options = {
                name:'documentEditTemplate',
                data:valueAccessor()
            };
            return ko.bindingHandlers['template'].init(element, function() {return options;});
        },
        update:function(element, valueAccessor, allBindings, viewModel, bindingContext) {
            var options = {
                name:'documentEditTemplate',
                data:valueAccessor()
            };
            ko.bindingHandlers['template'].update(element, function() {return options;}, allBindings, viewModel, bindingContext);
        }
    };

    ko.bindingHandlers.expression = {

        update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            var expressionString = ko.utils.unwrapObservable(valueAccessor());
            var result = ecodata.forms.expressionEvaluator.evaluate(expressionString, bindingContext);

            $(element).text(result);
        }

    };


    /*
     * Fused Autocomplete supports two versions of autocomplete (original autocomplete implementation by Jorn Zaefferer and jquery_ui)
     * Expects three parameters source, name and guid.
     * Ajax response lists needs name attribute.
     * Doco url: http://bassistance.de/jquery-plugins/jquery-plugin-autocomplete/
     * Note: Autocomplete implementation by Jorn Zaefferer is now been deprecated and its been migrated to jquery_ui.
     *
     */

    ko.bindingHandlers.fusedAutocomplete = {

        init: function (element, params) {
            var params = params();
            var options = {};
            var url = ko.utils.unwrapObservable(params.source);
            options.source = function(request, response) {
                $(element).addClass("ac_loading");
                $.ajax({
                    url: url,
                    dataType:'json',
                    data: {q:request.term},
                    success: function(data) {
                        var items = $.map(data.autoCompleteList, function(item) {
                            return {
                                label:item.name,
                                value: item.name,
                                source: item
                            }
                        });
                        response(items);

                    },
                    error: function() {
                        items = [{label:"Error during species lookup", value:request.term, source: {listId:'error-unmatched', name: request.term}}];
                        response(items);
                    },
                    complete: function() {
                        $(element).removeClass("ac_loading");
                    }
                });
            };
            options.select = function(event, ui) {
                var selectedItem = ui.item;
                params.name(selectedItem.source.name);
                params.guid(selectedItem.source.guid);
            };

            if(!$(element).autocomplete(options).data("ui-autocomplete")){
                // Fall back mechanism to handle deprecated version of autocomplete.
                var options = {};
                options.source = url;
                options.matchSubset = false;
                options.formatItem = function(row, i, n) {
                    return row.name;
                };
                options.highlight = false;
                options.parse = function(data) {
                    var rows = new Array();
                    data = data.autoCompleteList;
                    for(var i=0; i < data.length; i++) {
                        rows[i] = {
                            data: data[i],
                            value: data[i],
                            result: data[i].name
                        };
                    }
                    return rows;
                };

                $(element).autocomplete(options.source, options).result(function(event, data, formatted) {
                    if (data) {
                        params.name(data.name);
                        params.guid(data.guid);
                    }
                });
            }
        }
    };

    ko.bindingHandlers.speciesAutocomplete = {
        init: function (element, params, allBindings, viewModel, bindingContext) {
            var param = params();
            var url = ko.utils.unwrapObservable(param.url);
            var list = ko.utils.unwrapObservable(param.listId);
            var valueCallback = ko.utils.unwrapObservable(param.valueChangeCallback)
            var options = {};

            var lastHeader;

            function rowTitle(listId) {
                if (listId == 'unmatched' || listId == 'error-unmatched') {
                    return '';
                }
                if (!listId) {
                    return 'המרכז הישראלי למדע אזרחי';
                }
                return 'רשימת מינים';
            }
            var renderItem = function(row) {

                var result = '';
                var title = rowTitle(row.listId);
                if (title && lastHeader !== title) {
                    result+='<div style="background:grey;color:white; padding-left:5px;"> '+title+'</div>';
                }
                // We are keeping track of list headers so we only render each one once.
                lastHeader = title;
                result+='<a class="speciesAutocompleteRow">';
                if (row.listId && row.listId === 'unmatched') {
                    result += '<i>Unlisted or unknown species</i>';
                }
                else if (row.listId && row.listId === 'error-unmatched') {
                    result += '<i>Offline</i><div>Species:<b>'+row.name+'</b></div>';
                }
                else {

                    var commonNameMatches = row.commonNameMatches !== undefined ? row.commonNameMatches : "";

                    result += (row.scientificNameMatches && row.scientificNameMatches.length>0) ? row.scientificNameMatches[0] : commonNameMatches ;
                    if (row.name != result && row.rankString) {
                        result = result + "<div class='autoLine2'>" + row.rankString + ": " + row.name + "</div>";
                    } else if (row.rankString) {
                        result = result + "<div class='autoLine2'>" + row.rankString + "</div>";
                    } else {
                        result = result + "<div class='autoLine2'>" + row.name + "</div>";
                    }
                }
                result += '</a>';
                return result;
            };

            options.source = function(request, response) {
                $(element).addClass("ac_loading");

                if (valueCallback !== undefined) {
                    valueCallback(request.term);
                }
                var data = {q:request.term};
                if (list) {
                    $.extend(data, {listId: list});
                }
                $.ajax({
                    url: url,
                    dataType:'json',
                    data: data,
                    success: function(data) {
                        var items = $.map(data.autoCompleteList, function(item) {
                            return {
                                label:item.name,
                                value: item.name,
                                source: item
                            }
                        });
                        items = [{label:"Missing or unidentified species", value:request.term, source: {listId:'unmatched', name: request.term}}].concat(items);
                        response(items);

                    },
                    error: function() {
                        items = [{label:"Error during species lookup", value:request.term, source: {listId:'error-unmatched', name: request.term}}];
                        response(items);
                    },
                    complete: function() {
                        $(element).removeClass("ac_loading");
                    }
                });
            };
            options.select = function(event, ui) {
                ko.utils.unwrapObservable(param.result)(event, ui.item.source);
            };

            if ($(element).autocomplete(options).data("ui-autocomplete")) {

                $(element).autocomplete(options).data("ui-autocomplete")._renderItem = function(ul, item) {
                    var result = $('<li></li>').html(renderItem(item.source));
                    return result.appendTo(ul);

                };
            }
            else {
                $(element).autocomplete(options);
            }
        }
    };

    function forceSelect2ToRespectPercentageTableWidths(element, percentageWidth) {
        var $parentColumn = $(element).parent('td');
        var $parentTable = $parentColumn.closest('table');
        var resizeHandler = null;
        if ($parentColumn.length) {
            var select2 = $parentColumn.find('.select2-container');
            function calculateWidth() {
                var parentWidth = $parentTable.width();

                // If the table has overflowed due to long selections then we need to try and find a parent div
                // as the div won't have overflowed.
                var windowWidth = window.innerWidth;
                if (parentWidth > windowWidth) {
                    var parent = $parentTable.parent('div');
                    if (parent.length) {
                        parentWidth = parent.width();
                    }
                    else {
                        parentWidth = windowWidth;
                    }
                }
                var columnWidth = parentWidth*percentageWidth/100;

                if (columnWidth > 10) {
                    select2.css('max-width', columnWidth+'px');
                    $(element).validationEngine('updatePromptsPosition');
                }
                else {
                    // The table is not visible yet, so wait a bit and try again.
                    setTimeout(calculateWidth, 200);
                }
            }
            resizeHandler = function() {
                clearTimeout(calculateWidth);
                setTimeout(calculateWidth, 300);
            };
            $(window).on('resize', resizeHandler);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $(window).off('resize', resizeHandler);
            });
            calculateWidth();
        }

    }
    function applySelect2ValidationCompatibility(element) {
        var $element = $(element);
        var select2 = $element.next('.select2-container');
        $element.on('select2:close', function(e) {
            $element.validationEngine('validate');
        }).attr("data-prompt-position", "topRight:"+select2.width());
    }

    ko.bindingHandlers.speciesSelect2 = {
        select2AwareFormatter: function(data, container, delegate) {
            if (data.text) {
                return data.text;
            }
            return delegate(data);
        },
        init: function (element, valueAccessor) {

            var self = ko.bindingHandlers.speciesSelect2;
            var model = valueAccessor();

            $.fn.select2.amd.require(['select2/species'], function(SpeciesAdapter) {
                $(element).select2({
                    dataAdapter: SpeciesAdapter,
                    placeholder:{id:-1, text:'לחיפוש מינים נא להתחיל להקליד...'},
                    templateResult: function(data, container) { return self.select2AwareFormatter(data, container, model.formatSearchResult); },
                    templateSelection: function(data, container) { return self.select2AwareFormatter(data, container, model.formatSelectedSpecies); },
                    dropdownAutoWidth: true,
                    model:model,
                    escapeMarkup: function(markup) {
                        return markup; // We want to apply our own formatting so manually escape the user input.
                    },
                    ajax:{} // We want infinite scroll and this is how to get it.
                });
                applySelect2ValidationCompatibility(element);
            })
        },
        update: function (element, valueAccessor) {}
    };

    /**
     * Supports custom rendering of results in a Select2 dropdown.
     */
    function constraintIconRenderer(config) {
        return function(item) {

            var constraint = item.id;
            if (config[constraint]) {
                var icon = config[constraint];

                var iconElement;
                if (icon.url) {
                    iconElement = $("<img/>").addClass('constraint-image').css("src", icon.url);
                }
                else {
                    iconElement = $("<span/>").addClass('constraint-icon');
                    if (icon.class) {
                        if (_.isArray(icon.class)) {
                            _.each(icon.class, function(val) {
                                iconElement.addClass(val);
                            });
                        }
                        else {
                            _.each(icon.class.split(" "), function (val) {
                                iconElement.addClass(icon.class);
                            });
                        }
                    }
                    if (icon.style) {
                        _.each(icon.style, function(value, key) {
                           iconElement.css(key, value);
                        });
                    }
                }
                return $("<span/>").append(iconElement).append($("<span/>").addClass('constraint-text').text(constraint));
            }

            return item.text;
        };
    };

    /**
     * Provides support for applying https://select2.org for options selection.
     * The value supplied to this binding will be passed through as options to the select2
     * widget.  It is expected this binding will be used in conjunction with the value binding
     * so that updates to the view model will be reflected in the select 2 component.
     * @type {{init: ko.bindingHandlers.select2.init}}
     */
    ko.bindingHandlers.select2 = {
        init: function(element, valueAccessor, allBindings) {
            var defaults = {
                placeholder:'נא לבחור...',
                dropdownAutoWidth:true,
                allowClear:true
            };
            var options = _.defaults(valueAccessor() || {}, defaults);
            if (options.constraintIcons) {
                var renderer = constraintIconRenderer(options.constraintIcons);
                options.templateResult = renderer;
                options.templateSelection = renderer;

            }
            var $element = $(element);
            $element.select2(options);
            applySelect2ValidationCompatibility(element);

            // Listen for changes to the view model and ensure the select2 component is
            // updated to reflect the change.
            var valueBinding = allBindings.get('value');
            if (ko.isObservable(valueBinding)) {
                valueBinding.subscribe(function(newValue) {
                    // Depending on the order the bindings are declared (value before select2
                    // or vice versa), they can interfere with each other.
                    var currentValue = $element.val();
                    if (currentValue != newValue) {
                        // If the value is out of sync with the model, update the value.
                        $element.val(newValue);
                    }
                    // Make sure the select2 library is aware of the change.
                    $element.trigger('change');
                });
            }
            if (options.preserveColumnWidth) {
                forceSelect2ToRespectPercentageTableWidths(element, options.preserveColumnWidth);
            }
            else {
                applySelect2ValidationCompatibility(element);
            }
        }
    };

    ko.bindingHandlers.multiSelect2 = {
        init: function(element, valueAccessor, allBindings) {
            var defaults = {
                placeholder:'Select all that apply...',
                dropdownAutoWidth:true,
                allowClear:false,
                tags:true
            };
            var options = valueAccessor();
            var model = options.value;

            if (!ko.isObservable(model, ko.observableArray)) {
                throw "The options require a key with name 'value' with a value of type ko.observableArray";
            }

            var constraints;
            if (model.hasOwnProperty('constraints')) {
                constraints = model.constraints;
            }
            else {
                // Attempt to use the options binding to see if we can observe changes to the constraints
                constraints = allBindings.get('options');
            }

            // Because constraints can be initialised by an AJAX call, constraints can be added after initialisation
            // which can result in duplicate OPTIONS tags for pre-selected values, which confuses select2.
            // Here we watch for changes to the model constraints and make sure any  duplicates are removed.
            if (constraints && ko.isObservable(constraints)) {

                constraints.subscribe(function(val) {
                    var existing = {};
                    var duplicates = [];
                    var currentOptions = $(element).find("option").each(function() {
                        var val = $(this).val();
                        if (existing[val]) {
                            duplicates.push(this);
                        }
                        else {
                            existing[val] = true;
                        }
                    });
                    // Remove any duplicates
                    for (var i=0; i<duplicates.length; i++) {
                        element.removeChild(duplicates[i]);
                    }
                });

            }
            delete options.value;
            var options = _.defaults(valueAccessor() || {}, defaults);

            $(element).select2(options).change(function(e) {
                if (ko.isWritableObservable(model)) { // Don't try and write the value to a computed.
                    model($(element).val());
                }

            });

            if (options.preserveColumnWidth) {
                forceSelect2ToRespectPercentageTableWidths(element, options.preserveColumnWidth);
            }

            applySelect2ValidationCompatibility(element);
        },
        update: function(element, valueAccessor) {
            var $element = $(element);
            var data = valueAccessor().value();
            var currentOptions = $element.find("option").map(function() {return $(this).val();}).get();
            var extraOptions = _.difference(data, currentOptions);
            for (var i=0; i<extraOptions.length; i++) {
                $element.append($("<option>").val(extraOptions[i]).text(extraOptions[i]));
            }
            var elementValue = $element.val();
            if (!_.isEqual(elementValue, data)) {
                $element.val(valueAccessor().value()).trigger('change');
            }

        }
    };

    var popoverWarningOptions = {
        placement:'top',
        trigger:'manual',
        template: '<div class="popover warning"><h3 class="popover-header"></h3><div class="popover-body"></div><div class="arrow"></div></div>'
    };


    /**
     * This binding requires that the observable has used the metadata extender.  It is meant to work with the
     * form rendering code so isn't very useful as a stand alone binding.
     *
     * @type {{init: ko.bindingHandlers.warning.init, update: ko.bindingHandlers.warning.update}}
     */
    ko.bindingHandlers.warning = {
        init: function(element, valueAccessor) {
            var target = valueAccessor();
            if (typeof target.checkWarnings !== 'function') {
                throw "This binding requires the target observable to have used the \"metadata\" extender"
            }

            var $element = $(element);
            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                if (target.popoverInitialised) {
                    $element.popover("destroy");
                }
            });

            // We are implementing the validation routine by adding a subscriber to avoid triggering the validation
            // on initialisation.
            target.subscribe(function() {
                var valid = $element.validationEngine('validate');

                // Only check warnings if the validation passes to avoid showing two sets of popups.
                if (valid) {
                    var result = target.checkWarnings();

                    if (result) {
                        if (!target.popoverInitialised) {
                            $element.popover(_.extend({content:result.val[0]}, popoverWarningOptions));
                            var popover = $element.data('bs.popover').getTipElement();
                            $(popover).click(function() {
                                $element.popover('hide');
                            });
                            target.popoverInitialised = true;
                        }
                        $element.popover('show');
                    }
                    else {
                        if (target.popoverInitialised) {
                            $element.popover('hide');
                        }
                    }
                }
                else {
                    if (target.popoverInitialised) {
                        $element.popover('hide');
                    }
                }
            });

        },
        update: function() {}
    };

    ko.bindingHandlers.conditionalValidation = {
        init: function(element, valueAccessor) {
            var target = valueAccessor();
            if (typeof target.evaluateBehaviour !== 'function') {
                throw "This binding requires the target observable to have used the \"metadata\" extender"
            }
            var defaults = {
                validate:target.get('validate'),
                message:null
            };
            var validationAttributes = ko.computed(function() {
                return target.evaluateBehaviour("conditional_validation", defaults);
            });
            validationAttributes.subscribe(function(value) {
                updateJQueryValidationEngineAttributes(element, value.validate, value.message);
            });
        },
        update: function() {}
    };

    /**
     * Creates a validation string compatible with the jQueryValidationEngine plugin from data item validation
     * configuration.
     *
     * @param config an array containing an object describing each validation rule e.g
     * [
     *    {
     *        rule:"min",
     *        params: [
     *            {
     *                "type":"computed",
     *                "expression":"item2*0.01"
     *            }
     *        ]
     *    }
     * ]
     * @param expressionContext the context which any expressions should be evaluated against (normally the view model
     * or binding context)
     * @returns {string}
     */
    function createValidationString(config, expressionContext) {
        var validationString = '';
        _.each(config || [], function(ruleConfig) {
            if (validationString) {
                validationString += ',';
            }
            validationString += ruleConfig.rule;
            if (ruleConfig.param) {
                var paramString = ecodata.forms.evaluate(ruleConfig.param, expressionContext);
                validationString += '['+paramString+']';
            }
        });

        return validationString;
    };

    /**
     * Applies an attribute to the supplied element that controls the validation error displayed
     * if a particular validation rule triggers
     */
    function addJQueryValidationEngineErrorMessageForRule(rule, message, element){
         // This comes from the private _validityProp method in the validation engine.
         // The purpose of reproducing it here is to allow the correct error message attribute to
         // be applied to the element
         var validationEngineErrorMessageAttributeLookup = {
             "required": "value-missing",
             "custom": "custom-error",
             "groupRequired": "value-missing",
             "ajax": "custom-error",
             "minSize": "range-underflow",
             "maxSize": "range-overflow",
             "min": "range-underflow",
             "max": "range-overflow",
             "past": "type-mismatch",
             "future": "type-mismatch",
             "dateRange": "type-mismatch",
             "dateTimeRange": "type-mismatch",
             "maxCheckbox": "range-overflow",
             "minCheckbox": "range-underflow",
             "equals": "pattern-mismatch",
             "funcCall": "custom-error",
             "funcCallRequired": "custom-error",
             "creditCard": "pattern-mismatch",
             "condRequired": "value-missing"
         };

         var errorAttribute = 'data-errormessage';
         var errorAttributeSuffix = validationEngineErrorMessageAttributeLookup[rule];
         if (errorAttributeSuffix) {
             errorAttribute += '-' + errorAttributeSuffix;
         }
         $(element).attr(errorAttribute, message);
     };

    /**
     * Adds or removes the jqueryValidationEngine validation attributes 'data-validation-engine' and 'data-errormessage'
     * to/from the supplied element.
     * @param element the HTML element to modify.
     * @param validationString the validation string to use (minus the validate[])
     * @param messageString a string to use for data-errormessage
     */
    function updateJQueryValidationEngineAttributes(element, validationString, messageString) {
        var $element = $(element);
        if (validationString) {
            $element.attr('data-validation-engine', 'validate['+validationString+']');
        }
        else {
            $element.removeAttr('data-validation-engine');
        }

        if (messageString) {
            $element.attr('data-errormessage', messageString)
        }
        else {
            $element.removeAttr('data-errormessage');
        }

        // Trigger the validation after the knockout processing is complete - this prevents the validation
        // from firing before the page has been initialised on load.
        setTimeout(function() {
            if (messageString) {
                $element.validationEngine('validate');
            }
            else {
                $element.validationEngine('hide');
            }
        }, 100);
    }

    /**
     * Evaluates a validation configuration and populates the bound element with attributes used by the
     * jQueryValidationEngine.
     * @see createValidationString for the format of the configuration.
     * @type {{init: ko.bindingHandlers.computedValidation.init, update: ko.bindingHandlers.computedValidation.update}}
     */
    ko.bindingHandlers.computedValidation = {
        init: function(element, valueAccessor, allBindings, viewModel) {
            var modelItem = valueAccessor();

            var validationAttributes = ko.pureComputed(function() {
                var validationString = createValidationString(modelItem, viewModel);
                _.each(modelItem || [], function(ruleConfig) {
                    if (ruleConfig.message) {
                        addJQueryValidationEngineErrorMessageForRule(ruleConfig.rule, ruleConfig.message, element);
                    }
                });
                return validationString;
            });
            validationAttributes.subscribe(function(value) {
                updateJQueryValidationEngineAttributes(element, value);
            });
            updateJQueryValidationEngineAttributes(element, validationAttributes());

        },
        update: function() {}
    };

    /**
     * custom handler for fancybox plugin.
     * @type {{init: Function}}
     * config to fancybox plugin can be passed to custom binding using knockout syntax.
     * eg:
     * <a href="" data-bind="fancybox: {nextEffect:'fade', preload:0, 'prevEffect':'fade'}"></a>
     *
     * or
     *
     * <div data-bind="fancybox: {nextEffect:'fade', preload:0, 'prevEffect':'fade'}">
     *     <a href="..." target="fancybox">...</a>
     *     <a href="..." target="fancybox">...</a>
     * </div>
     */
    ko.bindingHandlers.fancybox = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext){
            var config = valueAccessor(),
                $elem = $(element);
            // suppress auto scroll on clicking image to view in fancybox
            config = $.extend({
                width: 700,
                height: 500,
                // fix for bringing the modal dialog to focus to make it accessible via keyboard.
                afterShow: function(){
                    $('.fancybox-wrap').focus();
                },
                helpers: {
                    title: {
                        type : 'inside',
                        position : 'bottom'
                    },
                    overlay: {
                        locked: false
                    }
                }
            }, config);

            if($elem.attr('target') == 'fancybox'){
                $elem.fancybox(config);
            }else{
                $elem.find('a[target=fancybox]').fancybox(config);
            }
        }
    };

    /**
     * A very simple binding to allow an element to toggle the visibility of another element.
     * Created for the featureMap because using bootstrap collapse was causing side effects with the modal.
     *
     * @type {{init: ko.bindingHandlers.toggleVisibility.init}}
     */
    ko.bindingHandlers.toggleVisibility = {
        init: function (element, valueAccessor) {
            var unwrapped = ko.utils.unwrapObservable(valueAccessor());
            var visibleClass = 'fa-angle-down';
            var hiddenClass = 'fa-angle-up';

            var $element = $(element);
            var $i = $('<i></i>').addClass('fa').addClass(visibleClass);
            if (unwrapped.collapsedByDefault != undefined && !unwrapped.collapsedByDefault) {
                $i = $('<i></i>').addClass('fa').addClass(hiddenClass);
            }
            $element.append($i);

            $element.click(function() {
                var selector = '';
                if (unwrapped.collapsedByDefault != undefined && unwrapped.blockId) {
                    selector = unwrapped.blockId;
                } else {
                    selector = unwrapped;
                }

               var $section = $(selector);
               if ($section.is(':visible')) {
                   $section.hide();
                   $i.removeClass(visibleClass);
                   $i.addClass(hiddenClass);
               }
               else {
                   $section.show();
                   $i.removeClass(hiddenClass);
                   $i.addClass(visibleClass);
               }
               return false;
            });

        }
    };

    /**
     * This binding will listen for the start of a validation event,
     * and expand a collapsed section so data in that section can be
     * validated.
     */
    ko.bindingHandlers.expandOnValidate = {
        init: function (element, valueAccessor) {
            var selector = valueAccessor() || ".validationEngineContainer";
            var event = "jqv.form.validating";
            var $section = $(element);
            var validationListener = function() {
                $section.show();
            };
            $section.closest(selector).on(event, validationListener);

            ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                $section.closest(selector).off(event, validationListener);
            });
        }
    };

    /**
     * Behaves as per the knockoutjs enable binding, but additionally clears the observable associated with the
     * value binding if it is also applied to the same element.
     * @type {{update: ko.bindingHandlers.enableAndClear.update}}
     */
    ko.bindingHandlers['enableAndClear'] = {
        'update': function (element, valueAccessor, allBindings) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value && element.disabled)
                element.removeAttribute("disabled");
            else if ((!value) && (!element.disabled)) {
                element.disabled = true;
                var possibleValueBindings = ['value', 'datepicker'];
                for (var i=0; i<possibleValueBindings.length; i++) {
                    var value = allBindings.get(possibleValueBindings[i]);
                    if (ko.isObservable(value)) {
                        value(undefined);
                    }
                }
            }

        }
    };

    /**
     * Because the jQueryValidationEngine triggers validation on blur, fields that don't accept focus
     * (in particular computed fields with validation rules attached) can use this binding to trigger validation
     * based on model value changes.
     * @type {{init: ko.bindingHandlers.validateOnChange.init}}
     */
    ko.bindingHandlers['validateOnChange'] = {
        'init': function (element, valueAccessor) {

            if (ko.isObservable(valueAccessor())) {
                var $element = $(element);
                valueAccessor().subscribe(function() {
                    setTimeout(function() {
                        $element.validationEngine('validate');
                    });
                })
            }
        }
    };

    /**
     * Passes the result of evaluating an expression to another binding.  This allows for the reuse of
     * standard bindings which evaluate expressions against the view model rather than binding directly
     * against the view model.
     * @param delegatee the binding to delegate to.
     * @returns {{init: (function(*=, *, *=, *=, *=): *)}}
     */
    function delegatingExpressionBinding(delegatee) {
        var result = {};

        // This handles a quirk of the output data model that stores the main data we bind against in a "data"
        // attribute. Nested data structures inside the model do not use the data prefix.
        var modelTransformer = function(viewModel) {
            if (viewModel && _.isObject(viewModel.data)) {
                return viewModel.data;
            }
            return viewModel;
        }

        var valueTransformer = function(valueAccessor, viewModel) {
            return function() {
                var result = ecodata.forms.expressionEvaluator.evaluateBoolean(valueAccessor(), modelTransformer(viewModel));
                return result;
            };
        }

        if (_.isFunction(delegatee.init)) {
            result['init'] = function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                return delegatee.init(element, valueTransformer(valueAccessor, viewModel), allBindings, viewModel, bindingContext);
            }
        }
        if (_.isFunction(delegatee.update)) {
            result['update'] = function (element, valueAccessor, allBindings, viewModel, bindingContext) {
                return delegatee.update(element, valueTransformer(valueAccessor, viewModel), allBindings, viewModel, bindingContext);
            }
        }
        return result;
    }

    ko.bindingHandlers['ifexpression'] = delegatingExpressionBinding(ko.bindingHandlers['if']);
    ko.virtualElements.allowedBindings.ifexpression = true;
    ko.bindingHandlers['visibleexpression'] = delegatingExpressionBinding(ko.bindingHandlers['visible']);
    ko.virtualElements.allowedBindings.visibleexpression = true;
    ko.bindingHandlers['enableexpression'] = delegatingExpressionBinding(ko.bindingHandlers['enable']);
    ko.bindingHandlers['disableexpression'] = delegatingExpressionBinding(ko.bindingHandlers['disable']);
    ko.bindingHandlers['enableAndClearExpression'] = delegatingExpressionBinding(ko.bindingHandlers['enableAndClear']);


    /**
     * Extends the target as a ecodata.forms.DataModelItem.  This is required to support many of the
     * dynamic behaviour features, including warnings and conditional validation rules.
     * @param target the observable to extend.
     * @param context the dataModel metadata as defined for the field in dataModel.json
     */
    ko.extenders.metadata = function(target, options) {
        ecodata.forms.DataModelItem.apply(target, [options.metadata, options.context, options.config]);
        return target;
    };

    ko.extenders.list = function(target, options) {
        ecodata.forms.OutputListSupport.apply(target, [options.metadata, options.constructorFunction, options.context, options.userAddedRows, options.config]);
    };

    /**
     * This is kind of a hack to make the closure config object available to the any components that use the model.
     */
    ko.extenders.configurationContainer = function(target, config) {
        target.globalConfig = config;
    };

    /**
     * The writableComputed extender will continuously update the value of an observable from a supplied expression
     * until such time as the value is explicitly set (for example by the user typing something into the field).
     * @param target
     * @param options {expression: , context:} expression is the expression to be evaluated, context is the context
     * in which the expression will be evaluated. (normally the parent model object of the target).
     * @returns {*}
     */
    ko.extenders.writableComputed = function(target, options) {

        var value = ko.observable();
        var ev = ecodata.forms.expressionEvaluator;
        var valueHolder = ko.pureComputed({
            read: function() {
                var val = value();
                return val ? val : ev.evaluate(options.expression, options.context, options.decimalPlaces);
            },
            write:function(newValue) {
                value(newValue);
            }
        });
        return valueHolder;
    };

    /**
     * Identifies that this field can contribute to reporting targets by attaching a class and
     * tooltip to the field.
     * This binding expects the bound value to be an array of scores (objects with a label property).
     */
    ko.bindingHandlers['score'] = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var scores = valueAccessor();

            if (!scores || !_.isArray(scores)) {
                console.log("Warning: scores binding applied but supplied value is not an array");
                return;
            }

            $(element).addClass("score");

            var message = 'This field can contribute to: <ul>';
            for (var i=0; i<scores.length; i++) {
                var target = scores[i].label;
                message += '<li>'+target+'</li>';
            }
            message += '</ul>';

            var options = {
                trigger:'hover',
                placement:'top',
                content: message,
                html: true
            }
            $(element).popover(options);

        }
    };

    ko.extenders.dataLoader = function(target, options) {

        var dataLoader = new ecodata.forms.dataLoader(target.context, target.config);
        var dataLoaderConfig = target.get('computed');
        if (!dataLoaderConfig) {
            throw "This extender can only be used with the metadata extender and expects a computed property to be defined";
        }
        var dependencyTracker = ko.computed(function () {
            return dataLoader.prepop(dataLoaderConfig).done( function(data) {
                target(data);
            });
        }); // This is a computed rather than a pureComputed as it has a side effect.
        return target;
    };

    ko.bindingHandlers['triggerPrePopulate'] = {
        'init': function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var dataModelItem = valueAccessor();
            var behaviours = dataModelItem.get('behaviour');
            for (var i = 0; i < behaviours.length; i++) {
                var behaviour = behaviours[i];

                if (behaviour.type == 'pre_populate') {
                    var config = behaviour.config;
                    var dataLoaderContext = dataModelItem.context;

                    var dataLoader = new ecodata.forms.dataLoader(dataLoaderContext, dataModelItem.config);

                    function doLoad(propTarget, value) {

                        if (_.isFunction(propTarget.loadData)) {
                            propTarget.loadData(value);
                        } else if (_.isFunction(propTarget.load)) {
                            propTarget.load(value);
                        } else if (ko.isObservable(propTarget)) {
                            propTarget(value);
                        } else {
                            console.log("Warning: target for pre-populate is invalid");
                        }
                    }
                    var dependencyTracker = ko.computed(function () {
                        var initialised = (dataModelItem.context.lifecycleState && dataModelItem.context.lifecycleState.state == 'initialised');

                        dataLoader.prepop(config).done(function (data) {

                            if (config.waitForInitialisation && !initialised) {
                                console.log("Not applying any updates during initialisation")
                                return;
                            }

                            data = data || {};
                            var configTarget = config.target;
                            var target;
                            if (!configTarget) {
                                target = viewModel;
                            }
                            else {
                                target = dataModelItem.findNearestByName(configTarget.name, bindingContext);
                            }
                            if (!target) {
                                throw "Unable to locate target for pre-population: "+target;
                            }
                            if (configTarget.type == "singleValue") {
                                // This needs to be done to load data into the feature data type due to the awkward
                                // way the loadData method uses the feature id from the reporting site and the
                                // direct observable accepts geojson.
                                target(data);
                            }
                            else if (configTarget.type == "singleLoad") {
                                doLoad(target, data);
                            }
                            else {
                                target = target.data || target;
                                for (var prop in data) {
                                    if (target.hasOwnProperty(prop)) {
                                        var propTarget = target[prop];
                                        doLoad(propTarget, data[prop]);
                                    }
                                }
                            }

                        }); // This is a computed rather than a pureComputed as it has a side effect.
                    });
                }
            }

        }
    };

    ko.bindingHandlers['disableClick'] = {
        'update': function (element, valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor());
            if (value) {
                this.eventHandler = $(element).on('mousedown.disableClick keydown.disableClick touchstart.disableClick', function(e) {
                    e.preventDefault();
                    return false;
                });
            }
            else {
                if (this.eventHandler) {
                    $(element).off('mousedown.disableClick keydown.disableClick touchstart.disableClick');
                }
            }

        }
    };

})();

