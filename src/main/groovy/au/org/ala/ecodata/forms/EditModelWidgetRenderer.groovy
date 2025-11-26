package au.org.ala.ecodata.forms

import grails.converters.JSON

public class EditModelWidgetRenderer implements ModelWidgetRenderer {

    @Override
    void renderLiteral(WidgetRenderContext context) {
        context.writer << "<span ${context.attributes.toString()}>${context.model.source}</span>"
    }

    @Override
    void renderReadonlyText(WidgetRenderContext context) {
        context.databindAttrs.add 'text', context.source
        context.writer << "<span ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'></span>"
    }

    @Override
    void renderText(WidgetRenderContext context) {
        context.attributes.addClass context.getInputWidth()
        context.databindAttrs.add 'value', context.source

        handleMaxSizeAndPlaceholder(context)
        context.writer << "<input ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}' ${context.validationAttr} type='text' class='form-control form-control-sm'/>"
    }

    @Override
    void renderNumber(WidgetRenderContext context) {
        context.attributes.addClass context.getInputWidth()
        context.databindAttrs.add 'with', context.source
        String modelElementText = """<div data-bind='${context.databindAttrs.toString()}' class='input-group'>
                                           <div class='input-group-prepend'>
                                              <button class='input-group-text' data-bind='click: increase'> + </button>
                                           </div>
                                           <input ${context.attributes.toString()} style='display:inline;' data-bind='value: count'${context.validationAttr} type='number' step='any'/>
                                           <div class='input-group-append'>
                                               <button class='input-group-text' data-bind='click: decrease'> - </button>
                                           </div>
                                        </div>"""

        String units = context.unitsToRender()
        if (units) {
            renderWithAddon(units, modelElementText, context.writer)
        }
        else {
            context.writer << modelElementText
        }
    }

    private void renderWithAddon(String addOnText, String modelElementText, writer) {
        writer << "<div class=\"input-group\">"
        writer << modelElementText
        writer << "<div class=\"input-group-append\">"
        writer << "<span class=\"add-on input-group-text\">${addOnText}</span>"
        writer << "</div>"
        writer << "</div>"
    }

    @Override
    void renderBoolean(WidgetRenderContext context) {
        context.databindAttrs.add 'checked', context.source
        context.writer << "<input${context.attributes.toString()} name='${context.source}' data-bind='${context.databindAttrs.toString()}'${context.validationAttr} type='checkbox' class='checkbox'/>"
    }

    @Override
    void renderTextArea(WidgetRenderContext context) {
        context.databindAttrs.add 'value', context.source
        context.attributes.addClass("form-control form-control-sm")
        if (context.model.rows) {
            context.attributes.add("rows", context.model.rows)
        }
        if (context.model.cols) {
            context.attributes.add("cols", context.model.cols)
        }
        handleMaxSizeAndPlaceholder(context)
        context.writer << "<textarea ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></textarea>"
    }

    /**
     * Adds a maxlength attribute to the context attributes if a maxSize validation is present.
     * Also adds any placeholder text, appending a note about the maxSize if it is present.
     * @param context the current rendering context.
     */
    private void handleMaxSizeAndPlaceholder(WidgetRenderContext context) {
       Map maxSizeRule = context.getValidationRule(ValidationHelper.MAX_SIZE)

        if (maxSizeRule) {
            String maxSize = maxSizeRule.param
            context.attributes.add("maxlength", maxSize)
            String placeholderAddition = "(maximum "+maxSize+" characters)"
            context.attributes.add("placeholder", placeholderAddition) // This will append to existing placeholder text
        }
    }

    @Override
    void renderSimpleDate(WidgetRenderContext context) {
        context.databindAttrs.add 'datepicker', context.source + '.date'
        context.writer << "<input${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}'${context.validationAttr} type='text' autocomplete='off' class='form-control form-control-sm input-small'/>"
    }

    @Override
    void renderTime(WidgetRenderContext context) {
        context.attributes.addClass context.getInputWidth()
        context.attributes.add 'style','text-align:center'
        context.databindAttrs.add 'value', context.source

        Map model = [:]
        model.source = context.model.source
        model.attr = context.attributes
        model.databindAttrs = context.databindAttrs
        model.validationAttr = context.validationAttr

        context.writer << context.g.render(template: '/output/timeDataTypeEditModelTemplate', plugin: 'ecodata-client-plugin', model: model)

    }

    @Override
    void renderSelectOne(WidgetRenderContext context) {
        context.databindAttrs.add 'value', context.source
        // Select one or many view types require that the data model has defined a set of valid options
        // to select from.
        context.databindAttrs.add 'options', context.source + '.constraints'
        context.databindAttrs.add 'optionsValue', context.source + '.constraints.value'
        context.databindAttrs.add 'optionsText', context.source + '.constraints.text'

        context.databindAttrs.add 'optionsCaption', '"Please select"'
        context.attributes.addSpan("form-control form-control-sm")
        if (isReadOnly(context)) { // HTML Select elements don't support the readonly attribute so we add disabled.  This will break validation though.
            context.databindAttrs.add('disableClick', 'true')
        }

        context.writer <<  "<select${context.attributes.toString()} class=\"select form-control form-control-sm\" data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></select>"
    }

    @Override
    void renderSelect2(WidgetRenderContext context) {
        context.databindAttrs.add 'value', context.source
        // Select one or many view types require that the data model has defined a set of valid options
        // to select from.
        context.databindAttrs.add 'options', context.source + '.constraints'
        context.databindAttrs.add 'optionsCaption', '""'
        context.databindAttrs.add 'optionsValue', context.source + '.constraints.value'
        context.databindAttrs.add 'optionsText', context.source + '.constraints.text'

        context.databindAttrs.add 'select2', context.source + '.displayOptions'
        context.writer <<  "<div${context.attributes.toString()}><select class=\"select form-control form-control-sm\" data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></select></div>"
    }

    private static boolean isReadOnly(WidgetRenderContext context) {
        context.model.readonly || context.dataModel.computed
    }
    @Override
    void renderSelectMany(WidgetRenderContext context) {

        if (isReadOnly(context)) {
            renderSelectManyAsString(context)
        }
        else {
            renderSelectManyAsCheckboxes(context)
        }
    }

    @Override
    void renderSelect2Many(WidgetRenderContext context) {

        if (isReadOnly(context)) {
            renderSelectManyAsString(context)
        }
        else {
            context.databindAttrs.add 'options', context.source + '.constraints'
            context.databindAttrs.add 'optionsValue', context.source + '.constraints.value'
            context.databindAttrs.add 'optionsText', context.source + '.constraints.text'

            String options = "{value: ${context.source}, tags:true, allowClear:false}"
            if (context.model.displayOptions) {
                options = "_.extend({value:${context.source}}, ${context.source}.displayOptions)"
            }
            context.databindAttrs.add 'multiSelect2', options
            context.writer <<  "<div${context.attributes.toString()}><select multiple=\"multiple\" class=\"select form-control form-control-sm\" data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></select></div>"
        }

    }

    @Override
    void renderMultiInput(WidgetRenderContext context) {
        context.writer << """<multi-input params="values: ${context.model.source}, template:'${context.model.source}InputTemplate'">
                              <input type="text" ${context.attributes.toString()} ${context.validationAttr} data-bind="value:val" class="form-control form-control-sm input-small">
                           </multi-input>"""
    }

    private void renderSelectManyAsCheckboxes(WidgetRenderContext context) {
        context.labelAttributes.addClass 'checkbox-list-label '
        def constraints = context.source + '.constraints'

        def nameBinding = "\"${context.model.source}-\"+(\$parentContext.\$index?\$parentContext.\$index():\"\")"

        context.databindAttrs.add 'value', '\$data'
        context.databindAttrs.add 'checked', "${context.source}"
        context.databindAttrs.add 'attr', "{\"name\": ${nameBinding}}"
        context.attributes.addClass('checkbox-list')
        context.attributes.addClass('list-unstyled')

        context.writer << """
                <ul${context.attributes.toString()} data-bind="foreach: ${constraints}">
                    <li>
                        <label class="checkbox">
                            <!-- ko with:_.extend({}, \$parent, {\$data:\$data, \$parentContext:\$parentContext}) -->
                            <input type="checkbox" name="${context.source}" data-bind='${context.databindAttrs.toString()}' ${context.validationAttr}/><span data-bind="text:\$data"/></span>
                            <!-- /ko -->
                        </label>
                    </li>
                </ul>
            """
    }

    private void renderSelectManyAsString(WidgetRenderContext context) {
        context.attributes.addClass context.getInputWidth()
        context.databindAttrs.add 'value', '('+context.source+'() || []).join(", ")'
        context.writer << "<input ${context.attributes.toString()} data-bind='${context.databindAttrs.toString()}' ${context.validationAttr} type='text' class='form-control form-control-sm input-small'/>"
    }

    @Override
    void renderSelectManyCombo(WidgetRenderContext context) {
        context.databindAttrs.add 'options', 'transients.' + context.model.source + 'Constraints'
        context.databindAttrs.add 'optionsCaption', '"Please select"'
        context.databindAttrs.add 'event', '{ change: selectManyCombo}'

        context.writer <<  "<select${context.attributes.toString()} comboList='${context.source}' data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></select>"

        def tagsBlock = "<div id='tagsBlock' data-bind='foreach: ${context.source}'>" +
                "<span class='tag label label-default' comboList='${context.source}'>" +
                '<input type="hidden" data-bind="value: $data" name="tags" class="tags group">' +
                '<span data-bind="text: $data"></span>' +
                '<a href="#" class="remove removeTag" title="remove this item" data-bind="event: { click: $parent.removeTag }" >' +
                '<i class="remove fa fa-close fa-inverse"></i></a></span> ' +
                '</div>'
        context.writer << tagsBlock
    }

    @Override
    void renderWordCloud(WidgetRenderContext context) {
        context.databindAttrs.add 'options', "${context.source}.constraints"
        context.databindAttrs.add 'optionsCaption', '"Please select"'
        context.databindAttrs.add 'value', "${context.source}.addWord"

        context.writer <<  "<div class='row'><div class='col-sm-6'><select${context.attributes.toString()} class='form-control' comboList='${context.source}' data-bind='${context.databindAttrs.toString()}'${context.validationAttr}></select></div>"

        def tagsBlock = "<div class='col-sm-6'><div id='tagsBlock' data-bind='foreach: ${context.source}'>" +
                " <span class='tag label label-default'>" +
                '<span data-bind="text: $data"></span>' +
                '<a href="#" class="remove removeTag" title="remove this item">' +
                " <i class=\"remove fa fa-close fa-inverse\" data-bind=\"click: function(data){ \$parent.${context.source}.removeWord(data) }\"></i></a>" +
                '</span>' +
                '</div></div>' +
                '</div>'
        context.writer << tagsBlock
    }


    @Override
    void renderAudio(WidgetRenderContext context) {
        context.databindAttrs.add 'fileUploadWithProgress', "{target:${context.source}.files, config:{}}"
        context.writer << context.g.render(template: '/output/audioDataTypeEditModelTemplate', plugin: 'ecodata-client-plugin', model: [databindAttrs:context.databindAttrs.toString(), name: context.source])
    }

    @Override
    void renderImage(WidgetRenderContext context) {
        context.databindAttrs.add 'imageUpload', "{target:${context.source}, context:\$context, config:{}}"
        def showImgMetadata = (context.model.showMetadata == null ||  context.model.showMetadata == true) ? "block" :"none"
        def allowImageAdd = (context.model.allowImageAdd == null ||  context.model.allowImageAdd == true) ? "block" :"none"
        context.writer << context.g.render(template: '/output/imageDataTypeEditModelTemplate', plugin:'ecodata-client-plugin', model: [databindAttrs:context.databindAttrs.toString(), showImgMetadata: showImgMetadata, allowImageAdd: allowImageAdd, name: context.source, validationAttrs:context.validationAttr, options: context.model.displayOptions])
    }

    @Override
    void renderImageDialog(WidgetRenderContext context) {
        context.databindAttrs.add 'imageUpload', "{target:${context.source}, config:{}}"
        context.writer << context.g.render(template: '/output/imageDialogDataTypeEditModelTemplate', plugin:'ecodata-client-plugin', model: [databindAttrs:context.databindAttrs.toString(), name: context.source])
    }

    @Override
    void renderEmbeddedImage(WidgetRenderContext context) {
        context.addDeferredTemplate('/output/fileUploadTemplate', plugin:'ecodata-client-plugin')
        context.databindAttrs.add 'imageUpload', "{target:${context.source}, config:{}}"
        context.writer << context.g.render(template: '/output/imageDataTypeTemplate', plugin:'ecodata-client-plugin', model: [databindAttrs: context.databindAttrs.toString(), options: context.model.displayOptions, source: context.source])
    }

    @Override
    void renderEmbeddedImages(WidgetRenderContext context) {
        // The file upload template has support for muliple images.
        renderEmbeddedImage(context)
    }

    @Override
    void renderAutocomplete(WidgetRenderContext context) {
        def newAttrs = new Databindings()

        newAttrs.add "value", "transients.textFieldValue"
        newAttrs.add "disable", "transients.speciesFieldIsReadOnly"
        newAttrs.add "event", "{focusout:focusLost}"
        newAttrs.add "speciesAutocomplete", "{url:transients.speciesSearchUrl, result:speciesSelected, valueChangeCallback:textFieldChanged}"

        context.writer << context.g.render(template: '/output/speciesTemplate', plugin:'ecodata-client-plugin', model:[css: context?.attributes?.map?.class, source: context.source, databindAttrs: newAttrs.toString(), validationAttrs:context.validationAttr])
    }

    @Override
    void renderFusedAutocomplete(WidgetRenderContext context) {
        def newAttrs = new Databindings()
        def source = context.g.createLink(controller: 'search', action:'species', absolute:'true')
        newAttrs.add "value", "name"
        newAttrs.add "disable", "transients.speciesFieldIsReadOnly"
        newAttrs.add "event", "{focusout:focusLost}"
        newAttrs.add "fusedAutocomplete", "{source:transients.source, name:transients.name, guid:transients.guid, scientificName:transients.scientificName, commonName:transients.commonName, matchUnknown: true}"
        context.writer << context.g.render(template: '/output/speciesFusedAutocompleteTemplate', plugin:'ecodata-client-plugin', model:[source: context.source, databindAttrs: newAttrs.toString(), validationAttrs:context.validationAttr, attrs: context.attributes.toString()])
    }

    @Override
    void renderSpeciesSearchWithImagePreview(WidgetRenderContext context) {
        def newAttrs = new Databindings()
        def source = context.g.createLink(controller: 'search', action:'species', absolute:'true')
        newAttrs.add "value", "name"
        newAttrs.add "disable", "transients.speciesFieldIsReadOnly"
        newAttrs.add "event", "{focusout:focusLost}"
//        newAttrs.add "speciesAutocomplete", "{source:transients.source, name:transients.name, guid:transients.guid, scientificName:transients.scientificName, commonName:transients.commonName, matchUnknown: true, url:transients.speciesSearchUrl, result:speciesSelected, valueChangeCallback:textFieldChanged}"
        newAttrs.add "speciesAutocomplete", "{url:transients.speciesSearchUrl, result:speciesSelected, valueChangeCallback:textFieldChanged}"
        context.writer << context.g.render(template: '/output/speciesSearchWithImagePreviewTemplate', plugin:'ecodata-client-plugin', model:[source: context.source, databindAttrs: newAttrs.toString(), validationAttrs:context.validationAttr, attrs: context.attributes.toString()])
    }

    @Override
    void renderPhotoPoint(WidgetRenderContext context) {
        context.writer << """
        <div><b><span data-bind="text:name"/></b></div>
        <div>Lat:<span data-bind="text:lat"/></div>
        <div>Lon:<span data-bind="text:lon"/></div>
        <div>Bearing:<span data-bind="text:bearing"/></div>
        """
    }

    @Override
    void renderLink(WidgetRenderContext context) {
        context.writer << "<a href=\"" + context.g.createLink(context.specialProperties(context.model.properties)) + "\">${context.model.source}</a>"
    }

    @Override
    void renderButtonGroup(WidgetRenderContext context) {
        context.model.buttons.each {
            context.writer << """
            <a href="#" data-bind="${it.dataBind}" class="${it.class}" title="${it.title}"><span class="${it.iconClass}">&nbsp;</span>${it.title}</a>
        """
        }

    }

    @Override
    void renderDate(WidgetRenderContext context) {
        context.databindAttrs.add 'datepicker', context.source + '.date'
        if (context.model.displayOptions) {
            context.databindAttrs.add "datepickerOptions", (context.model.displayOptions as JSON).toString().replaceAll("\"", "'")
        }

        context.writer << context.g.render(template: '/output/dateDataTypeEditModelTemplate', plugin: 'ecodata-client-plugin', model: [context: context])
    }


    @Override
    void renderDocument(WidgetRenderContext context) {
        context.writer << """<div data-bind="if:(${context.source}())">"""
        context.writer << """    <div data-bind="editDocument:${context.source}"></div>"""
        context.writer << """</div>"""
        context.writer << """<div data-bind="ifnot:${context.source}()">"""
        context.writer << """    <button class="btn" id="doAttach" data-bind="click:function(target) {\$root.attachDocument(${context.source})}">Attach Document</button>"""
        context.writer << """</div>"""


    }

    @Override
    void renderSpeciesSelect(WidgetRenderContext context) {

        context.attributes.addClass("species-select2")
        context.writer << """<div${context.attributes.toString()}>
                                <div data-bind="with:${context.source}" class="input-group"">
                                <select class="form-control form-control-sm" data-bind="speciesSelect2:\$data" ${context.validationAttr}></select>
                                <div class="input-group-append">
                                    <span class="input-group-text" data-bind="visible:name(), popover: {title: transients.speciesTitle, content: transients.speciesInformation}"><i class="fa fa-info-circle"></i></span>
                                </div>
                             </div></div>"""
    }

    @Override
    void renderCurrency(WidgetRenderContext context) {
        context.attributes.addClass context.getInputWidth()
        context.databindAttrs.add('value', context.source)
        context.writer << """<div class="input-group currency-input">
            <div class="input-group-prepend customAddOn">
            <span class="input-group-text">\$</span>
            </div>
            <input type="number" ${context.attributes.toString()} class="form-control form-control-sm" data-bind='${context.databindAttrs.toString()}'${context.validationAttr}'>
            <div class="input-group-append customAddOn">
            <span class="input-group-text">.00</span>
            </div>
           </div>"""
    }

    @Override
    void renderGeoMap(WidgetRenderContext context) {
        Map model = [:]
        model.putAll(context.model)
        model.readonly = false
        model.validation = context.validationAttr
        context.writer << context.g.render(template: '/output/dataEntryMap', plugin: 'ecodata-client-plugin', model: model)
    }

    @Override
    void renderFeature(WidgetRenderContext context) {
        context.writer << """<feature${context.attributes.toString()} params="feature:${context.source}, config:\$config.getConfig('feature', ${context.source})"></feature>"""
    }
}
