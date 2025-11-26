package au.org.ala.ecodata.forms

import grails.converters.JSON


class ModelJSTagLib {

    class JSModelRenderContext {

        JSModelRenderContext parentContext

        /** Used to render the results */
        def out
        /**
         * The path to the field that will hold the value for the data model item
         * relative to the current view model code being rendered.  E.g top level properties are
         * held in a data object, so the path is "self.data".  Properties
         * in an object being rendered in a list are at the top level
         * so the path is "self"
         */
        String propertyPath
        /** The current data model item being rendered */
        Map dataModel

        /**
         * How the level view model object can be referenced.
         * For top level fields, the path is "self", for nested
         * fields, the path is "parent"
         */
        String viewModelPath

        String fieldName() {
            return dataModel.name
        }

        /** The view model definition that relates to the current data model item */
        Map viewModel() {
            findViewByName(attrs?.model?.viewModel, dataModel.name)
        }
        /** The attributes passed to the tag library */
        Map attrs

        JSModelRenderContext createChildContext() {
            new JSModelRenderContext(
                    out:out,
                    propertyPath: propertyPath,
                    dataModel: dataModel,
                    viewModelPath: viewModelPath,
                    attrs:attrs,
                    parentContext: this
            )
        }
    }

    static namespace = "md"

    private final static INDENT = "    "
    private final static operators = ['sum':'+', 'times':'*', 'divide':'/','difference':'-']
    private final static String QUOTE = "\"";
    private final static String SPACE = " ";
    private final static String EQUALS = "=";

    private ComputedValueRenderer computedValueRenderer = new ComputedValueRenderer()

    def modelService

    /*------------ JAVASCRIPT for dynamic content -------------*/

    def jsModelObjects = { attrs ->

        JSModelRenderContext ctx = new JSModelRenderContext(
                out:out, attrs:attrs, propertyPath:'self.data', viewModelPath:'self'
        )
        attrs.model?.dataModel?.each { model ->
            ctx.dataModel = model
            if (model.dataType in ['list', 'photoPoints', 'matrix'] && model.jsClass) {
                customDataModel(attrs, model, out, "jsClass")
            }
            else if (model.dataType == 'photoPoints') {
                repeatingModel(ctx)
                totalsModel attrs, model, out
            }
            else if (model.dataType == 'matrix') {
                matrixModel attrs, model, out
            }
        }

        insertControllerScripts(attrs, attrs.model?.viewModel)

    }

    def lookupTable(JSModelRenderContext context) {
        context.out << "var ${context.dataModel.name}Config = ${context.dataModel.config as JSON};\n"
        context.out << "${context.propertyPath}.${context.dataModel.name} = new ecodata.forms.LookupTable(context, _.extend({}, config, ${context.dataModel.name}Config));\n"
    }

    private insertControllerScripts(Map attrs, List viewModel) {
        viewModel?.each { view ->
            switch (view.type) {
                case "section":
                    insertControllerScripts(attrs, view.items)
                    break
            }
    }
}

    def jsViewModel = { attrs ->
        JSModelRenderContext ctx = new JSModelRenderContext(out:out, attrs:attrs, propertyPath:'self.data', viewModelPath: 'self')
        List items = attrs.model?.dataModel
        items?.each { modelItem ->

            // Can't render a matrix inside a matrix
            if (modelItem.jsMain) {
                customDataModel(attrs, modelItem, out, "jsMain")
            }
            else if (modelItem.dataType == 'matrix') {
                matrixViewModel(attrs, modelItem, out)
            }
            else {
                ctx.dataModel = modelItem
                renderDataModelItem(ctx)
            }
        }

        renderLoad(items, ctx)
    }

    /**
     * Renders JavaScript code to define the data model item in a form.
     */
    void renderDataModelItem(JSModelRenderContext ctx) {
        Map mod = ctx.dataModel
        if (mod.dataType == 'date') {
            dateViewModel(ctx)
        }
        else if (mod.dataType == 'time') {
            timeViewModel(ctx)
        }
        else if (mod.computed && !mod.computed.source) {
            computedModel(ctx)
        }
        else if (mod.dataType == 'text') {
            textViewModel(ctx)
        }
        else if (mod.dataType == 'number') {
            numberViewModel(ctx)
        }
        else if (mod.dataType == 'stringList') {
            stringListViewModel(ctx)
        }
        else if (mod.dataType == 'image') {
            imageModel(ctx)
        }
        else if (mod.dataType == 'audio') {
            audioModel(ctx)
        }
        else if (mod.dataType == 'species') {
            speciesModel(ctx)
        }
        else if (mod.dataType == 'document') {
            documentViewModel(ctx)
        }
        else if (mod.dataType == 'boolean') {
            booleanViewModel(ctx)
        }
        else if (mod.dataType == 'set') {
            setViewModel(ctx)
        }
        else if (mod.dataType  == 'list') {
            repeatingModel(ctx)
            listViewModel(ctx)
            columnTotalsModel out, ctx.attrs, mod
        }
        else if (mod.dataType == 'photoPoints') {
            photoPointModel(ctx)
        }
        else if (mod.dataType == "geoMap") {
            geoMapViewModel(mod, ctx.out, ctx.propertyPath, ctx.attrs.readonly?.toBoolean() ?: false, ctx.attrs.edit?.toBoolean() ?: false)
        }
        else if (mod.dataType == "feature") {
            featureModel(ctx)
        }
        else if (mod.dataType == 'lookupTable') {
            lookupTable(ctx)
        }
    }

    /**
     * This js is inserted into the 'loadData()' function of the view model.
     *
     * It loads the existing values (or default values) into the model.
     */
    def jsLoadModel = { attrs ->
        JSModelRenderContext ctx = new JSModelRenderContext(out:out, attrs:attrs, propertyPath:'self.data', viewModelPath:'self')

        renderLoad(attrs.model?.dataModel, ctx)
    }


    void renderLoad(List items, JSModelRenderContext ctx) {

        ctx.out << "self.loadData = function(data) {\n"
        out << INDENT * 1 << "var initialisers = [];\n"
        JSModelRenderContext child = ctx.createChildContext()

        Map attrs = ctx.attrs

        items?.each { mod ->
            child.dataModel = mod

            if (mod.dataType == 'list') {
                out << INDENT * 1 << "initialisers = initialisers.concat(self.load${mod.name}(data.${mod.name}));\n"
                loadColumnTotals out, attrs, mod
            } else if (mod.dataType == 'matrix') {
                out << INDENT * 1 << "self.load${mod.name.capitalize()}(data.${mod.name});\n"
            } else {
                renderInitialiser(child)
            }
        }
        out << INDENT * 1 << "return initialisers;\n"
        ctx.out << "};\n"
    }

    String getDefaultValueAsString(JSModelRenderContext ctx) {
        Map model = ctx.dataModel
        // Default values can be literals or a map of the form: [ expression:'' ]
        // If the default value is an expression, we want to return undefined here to avoid setting a
        // value to the observable which will prevent the default value expression from being evaluated.
        if (model.defaultValue instanceof Map && model.defaultValue.expression) {
            return 'undefined'
        }
        def defaultValue = modelService.evaluateDefaultDataForDataModel(model)
        if (defaultValue != null) {
            // An empty string will be rendered as nothing in JS which will cause script errors.
            return defaultValue  == "" ? 'undefined' : defaultValue
        }

        switch (model.dataType) {
            case 'number':
                return 'undefined'
            case 'stringList':
            case 'image':
                return '[]'
            case 'species':
                return '{}'
            case 'stringList':
                return '[]'

            default:
                return 'undefined'
        }
    }

    void renderInitialiser(JSModelRenderContext ctx) {
        Map mod = ctx.dataModel
        def attrs = ctx.attrs
        def out = ctx.out

        if (mod.computed) {
            return
        }
        String defaultValue = getDefaultValueAsString(ctx)
        String value = "ecodata.forms.orDefault(data['${mod.name}'], ${getDefaultValueAsString(ctx)})"
        if (mod.dataType in ['text', 'stringList', 'time', 'number', 'boolean']) {
            if (mod.name == 'recordedBy' && mod.dataType == 'text' && attrs.user?.displayName && !value) {
                out << INDENT*4 << "${ctx.propertyPath}['${mod.name}'](ecodata.forms.orDefault(data['${mod.name}'], '${attrs.user.displayName}'));\n"
            } else {
                if (requiresMetadataExtender(mod)) {
                    out << INDENT*4 << "initialisers.push(${ctx.propertyPath}['${mod.name}'].load(${value}));\n"
                }
                else {
                    out << INDENT*4 << "${ctx.propertyPath}['${mod.name}'](${value});\n"
                }

            }
        }
        else if (mod.dataType in ['image', 'photoPoints', 'audio', 'set']) {
            out << INDENT*4 << "self.load${mod.name}(${value});\n"
        }
        else if (mod.dataType == 'species') {
            out << INDENT*4 << "if (data['${mod.name}']) {\n"
            out << INDENT*4 << "${ctx.propertyPath}['${mod.name}'].loadData(${value});\n"
            out << INDENT*4 << "}\n"
        }
        else if (mod.dataType == 'document') {
            out << INDENT*4 << "var doc = _.find(context.documents || [], function(document) { if (data['${mod.name}']) \n return document.documentId == data['${mod.name}'] || document.documentId ==  data['${mod.name}'].documentId ;\n else \n return false });"
            out << INDENT*5 << "if (doc) {\n"
            out << INDENT*6 << "${ctx.propertyPath}['${mod.name}'](new DocumentViewModel(doc));\n"
            out << INDENT*4 << "}\n"
        }
        // The date is currently resetting to 1 Jan 1970 if any value is set after initialisation
        // (including undefined/null/'') so this block avoids updating the model if there is no date supplied.
        else if (mod.dataType == 'date') {
            out << INDENT*4 << "if (data['${mod.name}'] || \"${defaultValue}\") {\n"
            out << INDENT*5 << "${ctx.propertyPath}['${mod.name}'](${value});\n"
            out << INDENT*4 << "}\n"
        }
        else if (mod.dataType == "geoMap") {
            boolean readonly = attrs.readonly?.toBoolean() ?: false
            out << INDENT*4 << """
                    if (data.${mod.name} && typeof data.${mod.name} !== 'undefined') {
                        self.data.${mod.name}(data.${mod.name});
                    } else {
                        self.loadActivitySite({decimalLatitude: data.${mod.name}Latitude, decimalLongitude: data.${mod.name}Longitude});
                    }
                    
                    if (data.${mod.name}Accuracy){
                        if( typeof data.${mod.name}Accuracy !== 'undefined') {
                            self.data.${mod.name}Accuracy(data.${mod.name}Accuracy);
                        }
                    } else if((typeof ${mod.defaultAccuracy} !== 'undefined') && self.data.${mod.name}Accuracy) {
                        self.data.${mod.name}Accuracy(${mod.defaultAccuracy});
                    }
                        
                    if (data.${mod.name}Locality && typeof data.${mod.name}Locality !== 'undefined') {
                        self.data.${mod.name}Locality(data.${mod.name}Locality);
                    }
                    if (data.${mod.name}Source && typeof data.${mod.name}Source !== 'undefined') {
                        self.data.${mod.name}Source(data.${mod.name}Source);
                    }
                    if (data.${mod.name}Notes && typeof data.${mod.name}Notes !== 'undefined') {
                        self.data.${mod.name}Notes(data.${mod.name}Notes);
                    }
                """
            if (readonly) {
                out << INDENT * 4 << """
                        var site = ko.utils.arrayFirst(activityLevelData.pActivity.sites, function (site) {
                                return site.siteId == data.${mod.name};
                        });

                        if (typeof site !== 'undefined' && site) {
                            self.data.${mod.name}Name(ko.observable(site.name));
                        }
                    """
            }
        }
        else if (mod.dataType == 'feature') {
            out << INDENT*4 << "${ctx.propertyPath}['${mod.name}'].loadData(${value});\n"
        }
    }

    /**
     * This js is inserted into the 'reloadGeodata()' function of the view model.
     *
     * It re-loads the existing geo values (or default values) into the model in order to force a Map redraw.
     */
    def jsReloadGeoModel = { attrs ->
        List  geoFields = attrs.model?.dataModel?.findAll {it.dataType == "geoMap"}
        geoFields.each { fieldModel ->

            if (fieldModel.dataType == "geoMap") {
                out << INDENT*4 << """
                var old${fieldModel.name}Latitude = self.data.${fieldModel.name}Latitude()
                var old${fieldModel.name}Longitude = self.data.${fieldModel.name}Longitude()               

                if(old${fieldModel.name}Latitude) {
                    self.data.${fieldModel.name}Latitude(null)
                    self.data.${fieldModel.name}Latitude(old${fieldModel.name}Latitude)
                } 
                    
                if(old${fieldModel.name}Longitude) {
                    self.data.${fieldModel.name}Longitude(null)
                    self.data.${fieldModel.name}Longitude(old${fieldModel.name}Longitude)
                } 
                    
                """
            }
        }
    }


    def jsSaveModel = { attrs ->

        out << INDENT*4 << "self.modelForSaving = function() {\n"
        out << INDENT*8 << "var outputData = {};\n"
        out << INDENT*8 << "ko.utils.extend(outputData, ko.mapping.toJS(self, {'ignore':['transients']}));\n"

        out << INDENT*8 << "return self.removeBeforeSave(outputData);;\n"
        out << INDENT*4 << "}\n"

    }

    def jsDirtyFlag = { attrs ->
        out << "window[viewModelInstance].dirtyFlag = ko.dirtyFlag(window[viewModelInstance], false);"
    }

    def columnTotalsModel(out, attrs, model) {
        if (!model.columnTotals) { return }
        out << INDENT*3 << "self.data.${model.columnTotals.name} = ko.observable({});\n"
    }

    def loadColumnTotals(out, attrs, model) {
        if (!model.columnTotals) { return }
        def name = model.columnTotals.name
        def objectName = name.capitalize() + "Row"
        model.columns.each { col ->
            if (!col.noTotal) {
                out << INDENT*4 << "self.data.${name}().${col.name} = new ${objectName}('${col.name}', self);\n"
            }
        }
    }

    def jsRemoveBeforeSave = { attrs ->
        attrs.model?.viewModel?.each({
            if (it.dataType == 'tableWithEditableRows' || it.type == 'photoPoints' || it.type == 'table') {
                out << INDENT*4 << "delete jsData.selected${it.source}Row;\n"
                out << INDENT*4 << "delete jsData.${it.source}TableDataUploadOptions;\n"
                out << INDENT*4 << "delete jsData.${it.source}TableDataUploadVisible;\n"

            }


        })
        attrs.model?.dataModel?.each({
            if (it.dataType == 'document') {
                // Convert an embedded document into a document id.
                out << INDENT*4 << "if (jsData.data && jsData.data.${it.name}) { jsData.data.${it.name} = jsData.data.${it.name}.documentId; }"
            }
            else if (it.dataType == 'geoMap') {
                out << INDENT*4 << "delete jsData.data.${it.name}LatLonDisabled;\n"
                out << INDENT*4 << "delete jsData.data.${it.name}SitesArray;\n"
                out << INDENT*4 << "delete jsData.data.${it.name}Loading;\n"
                out << INDENT*4 << "delete jsData.data.${it.name}Map;\n"
            }
            else if (it.dataType == 'list') {
                out << INDENT*4 << "delete jsData.selected${it.name}Row;\n"
                out << INDENT*4 << "delete jsData.${it.name}TableDataUploadOptions\n"
                out << INDENT*4 << "delete jsData.${it.name}TableDataUploadVisible\n"
            }
        })
    }



    def makeRowModelName(String output, String name) {
        String outputName = output.replaceAll(/\W/, '')
        def rowModelName = "Output_${outputName}_${name}Row"
        return rowModelName
    }

    /**
     * Creates a js array that holds the row keys in the correct order, eg,
     * var <modelName>Rows = ['row1key','row2key']
     */
    def matrixModel(attrs, model, out) {
        out << INDENT*2 << "var ${model.name}Rows = [";
        def rows = []
        model.rows.each {
            rows << "'${it.name}'"
        }
        out << rows.join(',')
        out << "];\n"
        out << INDENT*2 << "var ${model.name}Columns = [";
        def cols = []
        model.columns.each {
            cols << "'${it.name}'"
        }
        out << cols.join(',')
        out << "];\n"
    }

    def matrixViewModel(attrs, model, out) {
        out << """
            self.data.${model.name} = [];//ko.observable([]);
            self.data.${model.name}.init = function (data, columns, rows) {
                var that = this, column;
                if (!data) data = [];
                \$.each(columns, function (i, col) {
                    column = {};
                    column.name = col;
"""
        model.rows.eachWithIndex { row, rowIdx ->
            if (!row.computed) {
                def value = "data[i] ? data[i].${row.name} : 0"
                switch (row.dataType) {
                    case 'number': value = "data[i] ? orZero(${value}) : '0'"; break
                    case 'text': value = "data[i] ? orBlank(${value}) : ''"; break
                    case 'boolean': value = "data[i] ? orFalse(${value}) : 'false'"; break
                }
                out << INDENT*5 << "column.${row.name} = ko.observable(${value});\n"
            }
        }
        // add observables to array before declaring the computed observables
        out << INDENT*5 << "that.push(column);\n"
        model.rows.eachWithIndex { row, rowIdx ->
            if (row.computed) {
                computedValueRenderer.computedObservable(row, 'column', 'that[i]', out)
            }
        }

        out << """
                });
            };
            self.data.${model.name}.get = function (row,col) {
                var value = this[col][${model.name}Rows[row]];
"""
        if (attrs.edit) {
            out << INDENT*4 << "return value;\n"
        } else {
            out << INDENT*4 << "return (value() == 0) ? '' : value;\n"
        }
        out << """
            };
            self.load${model.name.capitalize()} = function (data) {
                self.data.${model.name}.init(data, ${model.name}Columns, ${model.name}Rows);
            };
"""
    }

    def repeatingModel(JSModelRenderContext ctx) {
        def out = ctx.out
        Map attrs = ctx.attrs
        Map model = ctx.dataModel

        def edit = attrs.edit as boolean
        def editableRows = viewModelFor(attrs, model.name)?.editableRows
        if (edit && editableRows) {

        }
        out << INDENT*2 << "var ${makeRowModelName(attrs.model.modelName, model.name)} = function (data, dataModel, context, config) {\n"
        out << INDENT*4 << "var self = this;\n"
        out << INDENT*4 << "ecodata.forms.NestedModel.apply(self, [data, dataModel, context, config]);\n"
        out << INDENT*4 << "context = _.extend(context, {parent:self});"

        JSModelRenderContext childCtx = ctx.createChildContext()
        childCtx.propertyPath = 'self'
        childCtx.viewModelPath = 'self.$parent'
        model.columns.each { col ->
            childCtx.dataModel = col
            renderDataModelItem(childCtx)
        }
        renderLoad(ctx.dataModel.columns, childCtx)

        out << INDENT*2 << "};\n"
    }

    def totalsModel(attrs, model, out) {
        if (!model.columnTotals) { return }
        out << """
        var ${model.columnTotals.name.capitalize()}Row = function (name, context) {
            var self = this;
"""
        model.columnTotals.rows.each { row ->
            computedValueRenderer.computedViewModel(out, attrs, row, 'this', "context.data", model.columnTotals)
        }
        out << """
        };
"""
    }

    /**
     * Builds a string to render JavaScript to add knockout extenders to an observable / observableArray
     * @param ctx the rendering context
     * @param extenders any extenders required by the specific type being rendered.
     * @return String of the form .extend({name:value}).extend({name:value})...
     */
    String extenderJS(JSModelRenderContext ctx, List extenders = []) {
        extenders = extenders ?: []

        Map viewModel = ctx.viewModel()
        if (viewModel?.displayOptions) {
            ctx.dataModel.displayOptions = viewModel.displayOptions
        }
        String extenderJS = ''
        if (requiresWritableComputed(ctx.dataModel)) {
            String expression = ctx.dataModel.defaultValue.expression
            String decimalPlaces = ctx.dataModel.decimalPlaces ?: 'undefined'
            extenderJS += ".extend({writableComputed:{expression:'${expression}', context:${ctx.propertyPath}, decimalPlaces:${decimalPlaces}}})"
        }
        if (requiresMetadataExtender(ctx.dataModel)) {
            extenders.add("{metadata:{metadata:self.dataModel['${ctx.fieldName()}'], context:self.\$context, config:config}}")
        }
        if (ctx.dataModel.computed?.source) {
            extenders.add("{dataLoader:true}")
        }

        extenders.each {
            extenderJS += ".extend(${it})"
        }

        extenderJS
    }

    private boolean requiresMetadataExtender(Map dataModel) {
        dataModel.dataType == 'feature' || dataModel.behaviour || dataModel.warning || dataModel.constraints || dataModel.displayOptions || (dataModel.validate instanceof List) || dataModel.scores || dataModel.computed?.source

    }

    private boolean requiresWritableComputed(Map dataModel) {
        def defaultValue = dataModel.defaultValue
        defaultValue instanceof Map && defaultValue.expression != null
    }

    void observable(JSModelRenderContext ctx, List extenders = []) {
        String extenderJS = extenderJS(ctx, extenders)
        ctx.out << "\n" << INDENT*3 << "${ctx.propertyPath}.${ctx.fieldName()} = ko.observable()${extenderJS};\n"
        modelConstraints(ctx)
    }

    void observableArray(JSModelRenderContext ctx, List extenders = [], boolean renderLoadFunction = true) {
        String extenderJS = extenderJS(ctx, extenders)
        ctx.out << "\n" << INDENT*3 << "${ctx.propertyPath}.${ctx.fieldName()} = ko.observableArray()${extenderJS};\n"
        modelConstraints(ctx)
        if (renderLoadFunction) {
            populateList(ctx)
        }

    }


    def textViewModel(JSModelRenderContext ctx) {
        observable(ctx)
    }

    def timeViewModel(JSModelRenderContext ctx) {
        // see http://keith-wood.name/timeEntry.html for details

        String spinnerLocation = "${assetPath(src: '/jquery.timeentry.package-2.0.1/spinnerOrange.png')}"
        String spinnerBigLocation = "${assetPath(src: '/jquery.timeentry.package-2.0.1/spinnerOrangeBig.png')}"

        observable(ctx, [])
        out << "\n" << INDENT*3 << "\$('#${ctx.fieldName()}TimeField').timeEntry({ampmPrefix: ' ', spinnerImage: '${spinnerLocation}', spinnerBigImage: '${spinnerBigLocation}', spinnerSize: [20, 20, 8], spinnerBigSize: [40, 40, 16]});"
    }

    def numberViewModel(JSModelRenderContext ctx) {
        int decimalPlaces = ctx.dataModel.decimalPlaces ?: 2

        Map options = new HashMap(ctx.viewModel()?.displayOptions ?: [:])
        options.decimalPlaces = decimalPlaces
        String optionString = (options as JSON).toString()
        //observable(ctx, ["{numericString:${optionString}}"])
        ctx.out << INDENT*4 << "${ctx.propertyPath}.${ctx.dataModel.name} = new CounterViewModel({numericString:${optionString}},self.\$context);\n"

    }

    def dateViewModel(JSModelRenderContext ctx) {
        List extenders =  ["{simpleDate: {includeTime:false}}"]
        if (ctx.dataModel.computed) {
            extenders = ["{simpleDate: {includeTime:false, readOnly:true}}"]
            computedModel(ctx, extenders)
        }
        else {
            observable(ctx, extenders)
        }
    }

    def booleanViewModel(JSModelRenderContext ctx) {
        observable(ctx)
    }

    def documentViewModel(JSModelRenderContext ctx) {
        observable(ctx)
    }

    def geoMapViewModel(model, out, String container = "self.data", boolean readonly = false, boolean edit = false) {
        model.columns.each {
            if (it?.source != "locationLatitude" && it?.source != "locationLongitude") {
                out << "\n" << INDENT*3 << """
                    ${container}.${model.name + it.source} = ko.observable();
                """
            }
        }
        out << "\n" << INDENT*3 << """
            enmapify({
                  viewModel: self
                , container: ${container}
                , name: "${model.name}"
                , edit: ${!!edit}
                , readonly: ${!!readonly}
                , markerOrShapeNotBoth: ${model.options ? !model.options.allowMarkerAndRegion : true}
                , proxyFeatureUrl: '${createLink(controller: 'proxy', action: 'feature')}'
                , spatialGeoserverUrl: '${grailsApplication.config.getProperty("spatial.geoserverUrl")}'
                , updateSiteUrl: '${createLink(controller: 'site', action: 'ajaxUpdate')}'
                , listSitesUrl: '${createLink(controller: 'site', action: 'ajaxList' )}'
                , getSiteUrl: '${createLink(controller: 'site', action: 'index' )}'
                , checkPointUrl: '${createLink(controller: 'site', action: 'checkPointInsideProjectAreaAndAddress' )}'
                , uniqueNameUrl: '${createLink(controller: 'site', action: 'checkSiteName' )}'
                , activityLevelData: context
                , hideSiteSelection: ${model.hideSiteSelection}
                , hideMyLocation: ${model.hideMyLocation}
                , context: config
            });
        """
    }

    def featureModel(JSModelRenderContext ctx) {
        observable(ctx, ["{feature:config}"])
    }

    def computedModel(JSModelRenderContext ctx, List extenders = []) {

        // TODO computed values within tables are rendered differently to values outside tables for historical reasons
        // This should be tidied up.
        if (ctx.parentContext) {
            computedValueRenderer.computedObservable(ctx.dataModel, ctx.propertyPath, ctx.propertyPath, ctx.out)
        }
        else {
            computedValueRenderer.computedViewModel(ctx.out, ctx.attrs, ctx.dataModel, ctx.propertyPath, ctx.propertyPath)
        }

        if (extenders || requiresMetadataExtender(ctx.dataModel)) {
            ctx.out << INDENT*3 << "${ctx.propertyPath}.${ctx.dataModel.name} = ${ctx.propertyPath}.${ctx.dataModel.name}${extenderJS(ctx, extenders)};\n"
        }


    }

    def audioModel(JSModelRenderContext ctx) {

        out << INDENT*4 << "${ctx.propertyPath}.${ctx.dataModel.name} = new AudioViewModel({downloadUrl: '${grailsApplication.config.getProperty('grails.serverURL')}/download/file?filename='});\n"
        populateAudioList(ctx)
    }

    def photoPointModel(JSModelRenderContext ctx) {
        def attrs = ctx.attrs
        def model = ctx.dataModel
        def out = ctx.out
        listViewModel(attrs, model, out)

        out << g.render(template:"/output/photoPointTemplate", plugin:'fieldcapture-plugin', model:[model:model]);
    }

    def speciesModel(JSModelRenderContext ctx) {
        def attrs = ctx.attrs
        def model = ctx.dataModel
        String configVarName = ctx.dataModel.name+"Config"
        ctx.out << INDENT*3 << "var ${configVarName} = _.extend(config, {printable:'${ctx.attrs.printable?:''}', dataFieldName:'${model.name}', output: '${attrs.output}', surveyName: '${attrs.surveyName?:""}', metadata:self.dataModel['${model.name}']});\n"
        ctx.out << INDENT*3 << "${ctx.propertyPath}.${ctx.dataModel.name} = new SpeciesViewModel({}, ${configVarName}, self.\$context);\n"
    }

    def imageModel(JSModelRenderContext ctx) {
        out << INDENT*4 << "${ctx.propertyPath}.${ctx.dataModel.name} = ko.observableArray([]);\n"
        populateImageList(ctx)
    }

    def stringListViewModel(JSModelRenderContext ctx) {
        observableArray(ctx)
    }

    def setViewModel(JSModelRenderContext ctx) {
        observableArray(ctx, ["{set: null}"])
    }

    def listViewModel(JSModelRenderContext ctx) {
        Map attrs = ctx.attrs
        Map model = ctx.dataModel
        def out = ctx.out

        def rowModelName = makeRowModelName(attrs.model.modelName, model.name)
        Map viewModel = viewModelFor(attrs, model.name)
        def editableRows = viewModel?.editableRows
        boolean userAddedRows = Boolean.valueOf(viewModel?.userAddedRows)
        def defaultRows = []
        model.defaultRows?.eachWithIndex { row, i ->
            defaultRows << INDENT*5 + "rowInitialisers = rowInitialisers.concat(${ctx.propertyPath}.${model.name}.addRow(${row.toString()}));"
        }
        def insertDefaultModel = defaultRows.join('\n')

        // If there are no default rows, insert a single blank row and make it available for editing.
        if (attrs.edit && model.defaultRows == null) {
            insertDefaultModel = "rowInitialisers = rowInitialisers.concat(${ctx.propertyPath}.${model.name}.addRow());"
        }

        out << """var context = _.extend({}, context, {parent:self, listName:'${model.name}'});"""
        String extender = "{list:{metadata:self.dataModel, constructorFunction:${rowModelName}, context:context, userAddedRows:${userAddedRows}, config:config}}"
        observableArray(ctx, [extender], false)
        out << """    
            ${ctx.propertyPath}.${model.name}.loadDefaults = function() {
                var rowInitialisers = [];
                ${insertDefaultModel}
                return rowInitialisers;
            };
        """

        if (attrs.edit && editableRows) {

                out << """
            self.selected${model.name}Row = ko.observable();

            self.${model.name}templateToUse = function (row) {
                return self.selected${model.name}Row() === row ? '${model.name}editTmpl' : '${model.name}viewTmpl';
            };
            self.edit${model.name}Row = function (row) {
                self.selected${model.name}Row(row);
                row.isSelected(true);
            };
            self.accept${model.name} = function (row, event) {
            if(\$(event.currentTarget).closest('.validationEngineContainer').validationEngine('validate')) {
                // todo: validation
                row.commit();
                self.selected${model.name}Row(null);
                row.isSelected(false);
                row.isNew = false;
                };
            };
            self.cancel${model.name} = function (row) {
                if (row.isNew) {
                    self.remove${model.name}Row(row);
                } else {
                    row.reset();
                    self.selected${model.name}Row(null);
                    row.isSelected(false);
                }
            };
            self.${model.name}Editing = function() {
                return self.selected${model.name}Row() != null;
            };
"""

        }
    }

    def populateList(JSModelRenderContext ctx) {
        ctx.out << INDENT*4 << """
        self.load${ctx.dataModel.name} = function (data) {
            if (data !== undefined) {
                ${ctx.propertyPath}.${ctx.dataModel.name}(data);
        }};
        """
    }

    def populateImageList(JSModelRenderContext ctx) {
        ctx.out << INDENT*4 << """
        self.load${ctx.dataModel.name} = function (data) {
            if (data !== undefined) {
                \$.each(data, function (i, obj) {
                    ${ctx.propertyPath}.${ctx.dataModel.name}.push(new ImageViewModel(obj, false, context));
                });
        }};
        """
    }

    def populateAudioList(JSModelRenderContext ctx) {
        ctx.out << INDENT*4 << """
        self.load${ctx.dataModel.name} = function (data) {
            if (data !== undefined) {
                \$.each(data, function (i, obj) {
                    if (_.isUndefined(obj.url)) {
                        obj.url = ""${grailsApplication.config.getProperty('grails.serverURL')}"/download/file?filename=" + obj.filename;
                    }
                    ${ctx.propertyPath}.${ctx.dataModel.name}.files.push(new AudioItem(obj));
                });
            }
        };
        """
    }

    def modelConstraints(JSModelRenderContext ctx) {
        Map model = ctx.dataModel

        if (model.behaviour) {
            model.behaviour.each { constraint ->
                ConstraintType type = ConstraintType.valueOf(constraint.type.toUpperCase())
                if (type.isBoolean) {
                    out << INDENT * 3 << "${ctx.propertyPath}.${model.name}.${constraint.type}Constraint = ko.computed(function() {\n"
                    out << INDENT * 4 << "var condition = '${constraint.condition}';\n";
                    out << INDENT * 4 << "return ecodata.forms.expressionEvaluator.evaluateBoolean(condition, ${ctx.propertyPath});\n"
                    out << INDENT * 3 << "});\n"
                }
            }
        }
    }

    /*------------ methods to look up attributes in the view model -------------*/
    Map viewModelFor(Map attrs, String name) {
        List viewModel = attrs.model.viewModel

        return findViewByName(viewModel, name)
    }
    Map findViewByName(List viewModel, String name) {

        return viewModel.findResult { node ->

            if (node.source == name) {
                return node
            }
            else if (isNestedViewModelType(node)) {
                List nested = getNestedViewNodes(node)
                return findViewByName(nested, name)
            }
            return null
        }
    }

    List getNestedViewNodes(node) {
        return (node.type in ['table', 'photoPoints', 'grid'] ) ? node.columns: node.items
    }

    boolean isNestedViewModelType(node) {
        return (node.items != null || node.columns != null)
    }

    /**
     * Custom script to support complex calculations.
     * jsClass: Hook for javascript knockout classes: Example: > SightingsEvidenceRowTable.
     * jsMain:  Hook for knockout main function. Example: >  this[viewModelName] = function (config, outputNotCompleted)
     */
    def customDataModel(attrs, model, out, type) {
        def lines = []

        if(type == "jsClass") {
            out << INDENT*3 << "\n // jsClass ${model.name} custom script implementation >> START \n"
            model?.jsClass?.toURL()?.text?.eachLine{ lines << it }
        } else if(type == "jsMain") {
            out << INDENT*3 << "\n // jsMain ${model.name} custom script implementation >> START \n"
            model?.jsMain?.toURL()?.text?.eachLine{ lines << it }
        } else {
            out << INDENT*3 << "\n // Custom script not avaialble for ${model.name} \n"
        }
        lines.each {
            out << "\n" << INDENT*3 << "${it}"
        }
        out << INDENT*3 << "\n // << END \n"
    }

    def toSingleWord = { attrs, body ->
        def name = attrs.name ?: body()
        out << name.replaceAll(' ','_')
    }

}
