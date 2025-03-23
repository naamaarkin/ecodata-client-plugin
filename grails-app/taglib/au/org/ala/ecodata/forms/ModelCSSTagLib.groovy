package au.org.ala.ecodata.forms

class ModelCSSTagLib {
    static namespace = "md"

    private final static INDENT = "    "
    private final static operators = ['sum':'+', 'times':'*', 'divide':'/']
    private final static String QUOTE = "\"";
    private final static String SPACE = " ";
    private final static String EQUALS = "=";

    /*------------ STYLES for dynamic content -------------*/
    // adds a style block for the dynamic components
    def modelStyles = { attrs ->
        viewModelStyles(attrs, out, attrs.model?.viewModel)
    }

    def viewModelStyles(attrs, out, items) {
        items.each { mod ->
            switch (mod.type) {
                case 'grid':
                case 'table':
                case 'photoPoints':
                    tableStyle(attrs, mod, out)
                    break
                case 'section':
                case 'row':
                case 'col':
                case 'repeat':
                    viewModelStyles(attrs, out, mod.items)
                    break
            }
        }
    }

    def tableStyle(attrs, model, out ) {
        def edit = attrs.edit
        def tableClass = model.source

        out << '<style type="text/css">\n'
        if (!model.disableHeaderWrap || model.allowHeaderWrap || attrs.forceHeaderWrap) {
            out << INDENT*2 << "table.${tableClass} th {white-space:normal;}\n"
        }

        if (model.fixedWidth) {
            out << INDENT*2 << "table.${tableClass}  {table-layout:fixed;}\n"
        }

        model.columns.eachWithIndex { col, i ->

            def width = col.width ? "width:${col.width};" : ""
            def hide = col.hide ? "display:none;" : ""
            def textAlign = model.type == 'grid' ? '' : getTextAlign(attrs, col, model.source)
            if (width || textAlign) {
                if (model.fixedWidth) {
                    out << INDENT*2 << "table.${tableClass} thead th:nth-child(${i+1}) {${width}${hide}}\n"
                    out << INDENT*2 << "table.${tableClass} td:nth-child(${i+1}) {${textAlign}${hide}}\n"
                }
                else {
                    out << INDENT*2 << "table.${tableClass} thead th:nth-child(${i+1}) {${width}${hide}}\n"
                    out << INDENT*2 << "table.${tableClass} td:nth-child(${i+1}) {${width}${textAlign}${hide}}\n"
                }
            }
        }
        // add extra column for editing buttons
        if (edit) {
            if (model.editableRows) {
                // add extra column for editing buttons
                out << INDENT*2 << "table.${tableClass} td:last-child {width:5%;min-width:70px;text-align:center;}\n"
            } else {
                // add column for delete buttons
                out << INDENT*2 << "table.${tableClass} th:last-child {width:1em;text-align:center;}\n"
            }
        }

        out << INDENT << "</style>"
    }

    def getTextAlign(attrs, col, context) {

        if (col.textAlign)
            return "text-align:${col.textAlign};"
        if (col.type in ['boolean', 'number']) {
            return "text-align:center"
        }
        return ""
    }
}
