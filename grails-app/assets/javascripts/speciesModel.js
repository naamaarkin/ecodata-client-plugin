

var speciesFormatters = function() {

    var singleLineSpeciesFormatter = function(species) {
        if (species.scientificName && species.commonName) {
            return $('<span/>').append($('<span class="scientific-name"/>').text(scientificName(species))).append($('<span class="common-name"/>').text(' (' + commonName(species)+ ')'));
        }
        else if (species.scientificName) {
            return $('<span class="scientific-name"/>').text(scientificName(species));
        }
        else {
            return $('<span class="common-name"/>').html(commonName(species)); // Html is used to avoid double escaping user entered data.
        }
    };

    function image(species, config) {

        var imageUrl = config.noImageUrl;
        if (species.guid || species.lsid) {
            imageUrl = config.speciesImageUrl + '?id=' + encodeURIComponent(species.guid || species.lsid);
        }
        return $('<div class="species-image-holder"/>').css('background-image', 'url('+imageUrl+')').append();
    }

    function scientificName(species, config) {
        var scientificName;
        if ( config && config.scientificNameField) {
            var scientificNameField = config.scientificNameField == 'rawScientificName' ? 'name' : config.scientificNameField == 'matchedName' ? 'scientificName' : config.scientificNameField;
            scientificName = species[scientificNameField];
            if (!scientificName ){
                scientificName = getValueForKey(species.kvpValues, scientificNameField);
                scientificName = scientificName && scientificName.value;
            }

            species.scientificName = scientificName;
        } else {
            scientificName = species.scientificNameMatches && species.scientificNameMatches.length > 0 ? species.scientificNameMatches[0] : species.scientificName;
        }

        return scientificName || '';
    }

    function getValueForKey(kvpValues, key) {
        key = key.toLowerCase();
        return _.find(kvpValues, function (kvp) {
            if (kvp && kvp.key) {
                return kvp.key.toLowerCase() == key;
            }
        });
    };

    function commonName(species, config) {
        var commonName = null;
        if( config && config.commonNameField){
            var commonNameField = config.commonNameField == 'rawScientificName' ? 'name' : config.commonNameField == 'matchedName' ? 'scientificName' : config.commonNameField;
            commonName = species[commonNameField];
            if (!commonName ) {
                commonName = getValueForKey(species.kvpValues, config.commonNameField);
                commonName = commonName && commonName.value;
            }

            species.commonName =  commonName;
        } else if (species.commonNameMatches && species.commonNameMatches.length > 0) {
            commonName = species.commonNameMatches[0];
        }
        else if (species.kvpValues) {
            var usableCommonName = null;
            var commonNameKeys = ['preferred common name', 'common name', 'vernacular name'];
            for (var i=0; i<commonNameKeys.length; i++) {
                usableCommonName = getValueForKey(species.kvpValues, commonNameKeys[i]);
                if (usableCommonName) {
                    break;
                }
            }
            commonName = usableCommonName && usableCommonName.value;
        }
        return commonName || species.commonName || species.name;
    }
    var multiLineSpeciesFormatter = function(species, queryTerm, config) {

        if (!species) return '';

        var result = $("<div class='species-result'/>");;
        if (config.showImages) {
            result.append(image(species, config));
        }
        result.append($('<div class="name-holder"/>').append($('<div class="scientific-name"/>').html(scientificName(species, config))).append($('<div class="common-name"/>').html(commonName(species, config))));

        return result;
    };


    return {
        singleLineSpeciesFormatter:singleLineSpeciesFormatter,
        multiLineSpeciesFormatter:multiLineSpeciesFormatter
    }
}();



var speciesSearchEngines = function() {

    var speciesId = function (species) {
        if (species.guid || species.lsid) {
            return species.guid || species.lsid;
        }
        return species.name;
    };

    var speciesTokenizer = function (species) {
        var result = [];
        if (species.scientificName) {
            result = result.concat(species.scientificName.split(/\W+/));
        }
        if (species.commonName) {
            result = result.concat(species.commonName.split(/\W+/));
        }
        if (species.name) {
            result = result.concat(species.name.split(/\W+/));
        }
        if (species.kvpValues) {
            for (var i in species.kvpValues) {
                if (species.kvpValues[i].key.indexOf('name') >= 0) {
                    result = result.concat(species.kvpValues[i].value.split(/\W+/));
                }
            }
        }
        return result;
    };

    var select2ListTransformer = function (speciesArray) {
        if (!speciesArray) {
            return [];
        }
        for (var i in speciesArray) {
            speciesArray[i].id = speciesId(speciesArray[i]);
        }
        return speciesArray;
    };

    var select2AlaTransformer = function(alaResults) {
        // We are handling results from either the autocomplete or regular json search here.
        var speciesArray = alaResults.autoCompleteList || alaResults.searchSearchResults && ala.searchResults.results;
        if (!speciesArray) {
            return [];
        }
        for (var i in speciesArray) {
            speciesArray[i].id = speciesArray[i].guid;
            if (!speciesArray[i].scientificName) {
                speciesArray[i].scientificName = speciesArray[i].name;
            }

        }
        return speciesArray;

    };

    var engines = {};

    function engineKey(listId, alaFallback) {
        return listId || '' + alaFallback;
    }

    function get(config) {
        var key = engineKey(config.listId, config.useAla);
        var engine = engines[key];
        if (!engine) {
            engine = define(config);
            engines[key] = engine;
        }
        return engine;
    };

    function define(config) {
        var options = {
            datumTokenizer: speciesTokenizer,
            queryTokenizer: Bloodhound.tokenizers.nonword,
            identify: speciesId
        };
        if (config.listId) {
            options.prefetch = {
                url: config.speciesListUrl + '?druid='+config.listIds.join(',')+'&includeKvp=true',
                transform: select2ListTransformer
            };
        }
        if (config.useAla) {
            var params = 'type=search&q=%';
            if (config.alaFq) {
                params+='&fq='+encodeURIComponent(config.alaFq);
            }

            // Biocollect has a proxy function which needs dataFieldName and output.
            if (config.dataFieldName && (config.searchBieUrl.indexOf('dataFieldName') == -1)) {
                params += '&dataFieldName=' + config.dataFieldName;
            }

            if (config.output && (config.searchBieUrl.indexOf('output') == -1)) {
                params += '&output=' + config.output;
            }

            var questionMarkOrAmpersand = config.searchBieUrl.indexOf('?') > -1 ? '&' : '?';
            options.remote = {
                url: config.searchBieUrl + questionMarkOrAmpersand + params,
                wildcard: '%',
                transform: select2AlaTransformer
            };
        }

        return new Bloodhound(options);
    };

    return {
        get:get,
        speciesId:speciesId
    };
}();


/**
 * Manages the species data type in the output model.
 * Allows species information to be searched for and displayed.
 */
var SpeciesViewModel = function(data, options, context) {

    var self = this;
    ecodata.forms.DataModelItem.apply(self, [options.metadata || {}, context, options]);

    var params = [];
    var species = data;
    var populate = options.populate || false;
    var output = options.output || "";
    var dataFieldName = options.dataFieldName || "";
    var surveyName = options.surveyName || "";

    self.guid = ko.observable();
    self.name = ko.observable();
    self.scientificName = ko.observable();
    self.commonName = ko.observable();

    // Reference to output species uuid - for uniqueness retrieved from ecodata server
    self.outputSpeciesId = ko.observable();
    self.listId = ko.observable();

    self.transients = {};
    self.transients.name = ko.observable(species.name);
    self.transients.guid = ko.observable(species.guid);
    self.transients.scientificName = ko.observable(species.scientificName);
    self.transients.speciesFieldIsReadOnly = ko.observable(false);
    self.transients.commonName = ko.observable(species.commonName);
    self.transients.image = ko.observable(species.image || '');
    self.transients.source = ko.observable(options.speciesSearchUrl +
        '&output=' + output+ '&dataFieldName=' + dataFieldName + '&surveyName=' + surveyName);
    self.transients.bieUrl = ko.observable();
    self.transients.speciesInformation = ko.observable();
    self.transients.speciesTitle = ko.observable();
    self.transients.editing = ko.observable(false);
    self.transients.textFieldValue = ko.observable();
    self.transients.bioProfileUrl =  ko.computed(function (){
        return options.bieUrl + '/species/' + self.guid();
    });
    self.transients.image = ko.observable(data.image || '');

    options.dataFieldName ? params.push('dataFieldName=' + options.dataFieldName) : null;
    options.surveyName ? params.push('surveyName=' + options.surveyName) : null;
    options.output ? params.push('output=' + options.output) : null;
    self.transients.speciesSearchUrl = options.speciesSearchUrl + '&' + params.join('&');

    self.speciesSelected = function(event, data) {
        self.loadData(data);
        self.transients.editing(!data.name);
    };

    self.textFieldChanged = function(newValue) {
        if (newValue != self.name()) {
            self.transients.editing(true);
        }
    };

    self.toJS = function() {
        return {
            guid:self.guid(),
            name:self.name(),
            scientificName:self.scientificName(),
            commonName:self.commonName(),
            listId:self.listId
        }
    };

    self.toJSON = function() {
        return self.toJS();
    }

    self.loadData = function(data) {
        if (!data) data = {};

        self.guid(orBlank(data.guid || data.lsid));
        self.name(orBlank(data.name));
        self.listId(orBlank(data.listId));
        self.scientificName(orBlank(data.scientificName));

        if (!data.commonName) {
            if (data.kvpValues) {
                var usableCommonName = null;
                var commonNameKeys = ['preferred common name', 'common name', 'vernacular name'];
                for (var i=0; i<commonNameKeys.length; i++) {
                    usableCommonName = _.find(data.kvpValues, function(kvp) {
                        if (kvp && kvp.key) {
                            return kvp.key.toLowerCase() == commonNameKeys[i];
                        }
                    });
                    if (usableCommonName) {
                        break;
                    }
                }

                data.commonName = usableCommonName && usableCommonName.value;
            }
        }
        self.commonName(orBlank(data.commonName));
        speciesConfig.showImage = false;
        self.transients.speciesTitle = speciesFormatters.multiLineSpeciesFormatter(self.toJS(), '', speciesConfig);
        self.transients.textFieldValue(self.name());

        // Species Translation
        var kvpInfo = "";
        var languages = ["Waramungu", "Warlpiri name"];
        var listsId = 'dr8016';
        if(self.listId() == listsId || output == 'CLC 2Ha Track Plot') {
            $.ajax({
                url: options.serverUrl + '/search/getSpeciesTranslation?id='+self.guid()+'&listId='+listsId,
                dataType: 'json',
                success: function (data) {
                    kvpInfo += "<table>";
                    $.each(data, function( index, value ) {
                        if( languages.indexOf(value.key) != -1) {
                            kvpInfo += "<tr><td><b>"+value.key+":</b><br>"+value.value +"</td></tr>";
                        }
                    });
                    kvpInfo += "</table>";
                },
                async: false,
                error: function(request, status, error) {
                    console.log(error);
                }
            });
        }

        if (self.guid() && !options.printable) {

            var profileUrl = options.bieUrl + '/species/' + encodeURIComponent(self.guid());
            $.ajax({
                url: options.speciesProfileUrl+'?id=' + encodeURIComponent(self.guid()),
                dataType: 'json',
                success: function (data) {
                    var profileInfo = '<a href="'+profileUrl+'" target="_blank">';
                    var imageUrl = data.thumbnail || (data.taxonConcept && data.taxonConcept.smallImageUrl);

                    if (imageUrl) {
                        profileInfo += "<img title='Click to show profile' class='taxon-image ui-corner-all' src='"+imageUrl+"'>";
                    }
                    else {
                        profileInfo += "No profile image available";
                    }
                    profileInfo += "</a>";
                    profileInfo += kvpInfo;
                    self.transients.speciesInformation(profileInfo);
                },
                error: function(request, status, error) {
                    console.log(error);
                }
            });

        }
        else {
            self.transients.speciesInformation("No profile information is available.");
        }

    };

    self.focusLost = function(event) {
        self.transients.editing(false);
        if (self.name()) {
            self.transients.textFieldValue(self.name());
        }
        else {
            self.transients.textFieldValue('');
        }
    };


    self.findSpeciesConfig = function(options) {
        var speciesConfig;
        if (options.speciesConfig) {
            if (options.speciesConfig.surveyConfig) {
                speciesConfig = _.find(options.speciesConfig.surveyConfig.speciesFields || [], function (conf) {
                    return conf.output == options.outputName && conf.dataFieldName == options.dataFieldName;
                });
                if (speciesConfig) {
                    speciesConfig = speciesConfig.config;
                }

                if (!speciesConfig) {
                    speciesConfig = options.speciesConfig.defaultSpeciesConfig;
                }
            }
        }
        if (!speciesConfig) {
            speciesConfig = {};
        }
        speciesConfig.listId = speciesConfig && speciesConfig.speciesLists && speciesConfig.speciesLists.length > 0 ? speciesConfig.speciesLists[0].dataResourceUid : '';
        if(speciesConfig.listId) {
            speciesConfig.listIds = [];
            for (var i in speciesConfig.speciesLists) {
                speciesConfig.listIds.push(speciesConfig.speciesLists[i].dataResourceUid);
            }
        }

        var defaults = {
            showImages: true,
            useAla:true,
            allowUnmatched: true,
            unmatchedTermlength: 5
        };

        _.defaults(speciesConfig, defaults);
        _.defaults(speciesConfig, options);
        return speciesConfig;
    };

    var speciesConfig = self.findSpeciesConfig(options);

    self.formatSearchResult = function(species) {
        return speciesFormatters.multiLineSpeciesFormatter(species, self.transients.currentSearchTerm || '', speciesConfig);
    };
    self.formatSelectedSpecies = speciesFormatters.singleLineSpeciesFormatter;

    self.transients.engine = speciesSearchEngines.get(speciesConfig);
    self.id = function() {
        return speciesSearchEngines.speciesId({guid:self.guid(), name:self.name()});
    };

    function markMatch (text, term) {
        if (!text) {
            return {match:false, text:''};
        }
        // Find where the match is
        var match = text.toUpperCase().indexOf(term.toUpperCase());

        // If there is no match, move on
        if (match < 0) {
            return {match:false, text:text};
        }

        // Put in whatever text is before the match
        var result = text.substring(0, match);

        // Mark the match
        result += '<b>' + text.substring(match, match + term.length) + '</b>';

        // Put in whatever is after the match
        result += text.substring(match + term.length);

        return {match:true, text:result};
    }


    self.search = function(params, callback, noResultsCallback) {
        var term = params.term;
        self.transients.currentSearchTerm = term;
        var suppliedResults = false;
        if (term) {
            self.transients.engine.search(term,
                function (resultArr) {
                    var results = [];
                    if (resultArr.length > 0) {

                        for (var i in resultArr) {
                            resultArr[i].scientificNameMatches = [markMatch(resultArr[i].scientificName, term).text];
                            var match = markMatch(resultArr[i].commonName || resultArr[i].name, term);

                            if (resultArr[i].kvpValues && resultArr[i].kvpValues.length > 0) {
                                var j = 0;
                                while (!match.match && j<resultArr[i].kvpValues.length) {
                                    if (resultArr[i].kvpValues[j].key.indexOf('name') >= 0) {
                                        match = markMatch(resultArr[i].kvpValues[j].value, term);
                                    }
                                    j++;
                                }

                            }
                            resultArr[i].commonNameMatches = [match.text];

                        }
                        results.push({text: "רשימת מינים", children: resultArr});
                        suppliedResults = true;
                    }
                    if (!speciesConfig.useAla && speciesConfig.allowUnmatched && term.length >= speciesConfig.unmatchedTermlength) {
                        results.push({text: "מינים חסרים או לא מזוהים", children: [{id:name, name: _.escape(term), listId:"unmatched"}]});
                    }
                    callback({results: results}, false);
                },
                function (resultArr) {
                    var results = [];
                    if (resultArr.length > 0) {
                        results.push({text: "המרכז הישראלי למדע אזרחי", children: resultArr});
                    }
                    if (speciesConfig.allowUnmatched && term.length >= speciesConfig.unmatchedTermlength) {
                        results.push({text: "מינים חסרים או לא מזוהים", children: [{id:name, name:_.escape(term), listId:"unmatched"}]});
                    }
                    callback({results:results}, suppliedResults);
                });
        }
        else {
            var list = self.transients.engine.all();
            if (list.length > 0) {
                var pageNum = params.page || 1;
                var pageLength = 10;
                var offset = (pageNum-1) * pageLength;
                var end = Math.min(offset+pageLength, list.length);
                var page = list.slice(offset, end);
                var results = offset > 0 ? page : [{text: "Species List", children: page}];
            }
            callback({results: results, pagination: {more: end < list.length , page: params.page}});
        }
    }

    self.transients.guid.subscribe(function (newValue) {
        self.name(self.transients.name());
        self.guid(self.transients.guid());
        self.scientificName(self.transients.scientificName());
        self.commonName(self.transients.commonName());
        self.transients.bieUrl(options.bieUrl + '/species/' + self.guid());
    });

    self.name.subscribe(function (newName) {
        if (!self.outputSpeciesId() && newName != species.name) {
            self.assignOutputSpeciesId();
        }
    });

    self.populateSingleSpecies = function () {
        if (speciesConfig && (speciesConfig.type === 'SINGLE_SPECIES') && speciesConfig.singleSpecies) {
            var data = speciesConfig.singleSpecies;
            self.transients.textFieldValue(data.name);
            self.transients.name(data.name);
            self.transients.scientificName(data.scientificName);
            self.transients.commonName(data.commonName);
            self.transients.speciesFieldIsReadOnly(true);
            self.transients.guid(data.guid); // This will update the non-transient data.
        }
    };

    self.reset = function () {
        self.name("");
        self.guid("");
        self.scientificName("");
        self.commonName("");
        self.transients.name("");
        self.transients.guid("");
        self.transients.scientificName("");
        self.transients.commonName("");
    };

    self.guidFromOutputSpeciesId = function(species) {
        if (species.outputSpeciesId) {
            self.outputSpeciesId(species.outputSpeciesId);
            $.ajax({
                url: options.getGuidForOutputSpeciesUrl+ "/" + species.outputSpeciesId,
                type: 'GET',
                contentType: 'application/json',
                success: function (data) {
                    self.transients.bieUrl(data.guid ? options.bieUrl + '/species/' + data.guid : options.bieUrl);
                },
                error: function (data) {
                    bootbox.alert("Error retrieving species data, please try again later.");
                }
            });

        }
    };

    /**
     * Obtain a unique id for this species to correlate the form data with occurance
     * records produced for export to the ALA
     */
    self.assignOutputSpeciesId = function() {
        var idRequired = options.getOutputSpeciesIdUrl;
        if (idRequired && !self.outputSpeciesId() && self.guid()) {
            self.transients.bieUrl(options.bieUrl + '/species/' + self.guid());
            $.ajax({
                url: options.getOutputSpeciesIdUrl,
                type: 'GET',
                contentType: 'application/json',
                success: function (data) {
                    if (data.outputSpeciesId) {
                        self.outputSpeciesId(data.outputSpeciesId);
                    }
                },
                error: function (data) {
                    bootbox.alert("Error retrieving species data, please try again later.");
                }
            });
        }
    };

    self.guidFromOutputSpeciesId(species);
    setTimeout(self.populateSingleSpecies, 0);

    if (data) {
        self.loadData(data);
    }

    if (species.name && !self.outputSpeciesId()) {
        self.assignOutputSpeciesId(); // This will result in the data being marked as dirty.
    }
};

$.fn.select2.amd.define('select2/species', [
    'select2/data/ajax',
    'select2/utils'
], function (AjaxAdapter, Utils) {
    function SpeciesAdapter($element, options) {
        this.model = options.get("model");
        this.minimumInputLength = options.get("minimumInputLength") || 3;
        this.$element = $element;
        SpeciesAdapter.__super__.constructor.call(this, $element, options);

        var id = this.model.id();

        if (id) {
            this.addOptions(this.option({id:id, text:this.model.name()}));
        }
        else {
            this.addOptions(this.option({text:options.placeholder}));
        }

    }

    Utils.Extend(SpeciesAdapter, AjaxAdapter);

    SpeciesAdapter.prototype.query = function (params, callback) {
        var self = this;

        self.model.search(
            params, function (results, append) {

                if (results.results && results.results.length > 0) {
                    if (!append) {
                        callback(results);
                    }
                    else {
                        self.trigger("results:append", {data: results, query: params});
                    }
                }
                else {
                    if (!results.pagination || results.pagination.page == 0) {
                        params.term = params.term || '';
                        if (params.term.length < self.minimumInputLength) {
                            self.trigger('results:message', {
                                message: 'inputTooShort',
                                args: {
                                    minimum: self.minimumInputLength,
                                    input: params.term,
                                    params: params
                                }
                            });
                        }
                    }

                }

            }
        );

    };

    SpeciesAdapter.prototype.current = function (callback) {
        var data = this.model.toJS();
        data.id = speciesSearchEngines.speciesId(data);
        if (!data.id) {
            data = {id: -1, text: "Please select..."}
        }
        callback([data]);
    };

    SpeciesAdapter.prototype.select = function(data) {
        this.model.loadData(data);
        AjaxAdapter.__super__.select.call(this, data);
    };

    return SpeciesAdapter;
});
