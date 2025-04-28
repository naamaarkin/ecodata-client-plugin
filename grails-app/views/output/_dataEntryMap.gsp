<g:set var="orientation" value="${orientation ?: 'horizontal'}"/>
<g:set var="isHorizontal" value="${orientation == 'horizontal'}"/>
<g:set var="orientationClass" value="${isHorizontal ? 'col-md-6' : 'row'}"/>
<g:set var="latValidation" value="data-validation-engine='validate[min[-90],max[90]]'"/>
<g:set var="lngValidation" value="data-validation-engine='validate[min[-180],max[180]]'"/>
<g:set var="orientationMainClass" value="${isHorizontal ? 'row mx-1' : ''}"/>

<h4 data-validation-engine="validate[funcCall[validator_site_check]" data-prompt-position="inline" data-position-type="inline" data-prompt-target="error-info">
    <g:message code="geomap.heading" default="Location"/>
    <g:if test="${!readonly}">
        <span class="req-field"></span>
    </g:if>
</h4>
<div class="${orientationMainClass}">
    <g:if test="${isHorizontal}">
        <div class="col-md-6">
            <!-- ko template: 'site-selector-dropdown-template' -->
            <!-- /ko -->
            <span id="error-info" class="mb-2"></span>
            <m:map id="${source}Map" width="100%"/>
        </div>
    </g:if>

    <g:if test="${!isHorizontal}">
        <!-- ko template: 'site-selector-dropdown-template' -->
        <!-- /ko -->

        <div class="row mb-2 mx-1">
            <span id="error-info" class="mb-2"></span>
            <m:map id="${source}Map" width="100%"/>
        </div>
    </g:if>

    <div class="${orientationClass}">
        <div class="${isHorizontal ? '' : 'col-12'}" data-bind="visible: transients.showDataEntryFields">
            <!-- ko if: transients.showCentroid() -->

            <div class="form-group row" data-bind="if: data.${source}CentroidLatitude">
                <div class="col-sm-3">
                    <label for="${source}CentroidLatitude">Centroid Latitude
                        <a href="#" class="helphover" data-bind="popover: {title:'<g:message code="record.edit.map.centroidLatLon"/>', content:'<g:message code="record.edit.map.centroidLatLon.content"/>'}">
                            <i class="fa fa-question-circle"></i>
                        </a>
                    </label>
                </div>

                <div class="col-sm-9">
                    <g:if test="${readonly}">
                        <span data-bind="text: data.${source}CentroidLatitude"></span>
                    </g:if>
                    <g:else>
                        <input id="${source}CentroidLatitude" type="number" data-bind="value: data.${source}CentroidLatitude"
                            ${validation} disabled class="form-control full-width-input">
                    </g:else>
                </div>
            </div>

            <div class="form-group row" data-bind="if: data.${source}CentroidLongitude">
                <div class="col-sm-3">
                    <label for="${source}CentroidLongitude">Centroid Longitude</label>
                </div>

                <div class="col-sm-9">
                    <g:if test="${readonly}">
                        <span data-bind="text: data.${source}CentroidLongitude"></span>
                    </g:if>
                    <g:else>
                        <input id="${source}CentroidLongitude" type="number" data-bind="value: data.${source}CentroidLongitude"
                            ${validation} disabled class="form-control full-width-input">
                    </g:else>
                </div>
            </div>

            <!-- /ko -->

            <!-- ko if: transients.showPointLatLon() -->

            <div class="form-group row" data-bind="slideVisible: !transients.editCoordinates()">
                <div class="col-sm-3">
                    <label for="${source}Latitude">Latitude
                        <a href="#" class="helphover" data-bind="popover: {title:'<g:message code="record.edit.map.latLon"/>', content:'<g:message code="record.edit.map.latLon.content"/>'}">
                            <i class=fa fa-question-circle></i>
                        </a>
                    </label>
                </div>

                <div class="col-sm-9">
                    <g:if test="${readonly}">
                        <span data-bind="text: data.${source}Latitude"></span>
                    </g:if>
                    <g:else>
                        <input placeholder="Use map tools to get coordinates" id="${source}Latitude" type="number" min="-90" max="90" data-bind="value: data.${source}Latitude" disabled
                            ${latValidation} class="form-control full-width-input">
                    </g:else>
                </div>
            </div>

            <div class="form-group row" data-bind="slideVisible: !transients.editCoordinates()">
                <div class="col-sm-3">
                    <label for="${source}Longitude">Longitude</label>
                </div>

                <div class="col-sm-9">
                    <g:if test="${readonly}">
                        <span data-bind="text: data.${source}Longitude"></span>
                    </g:if>
                    <g:else>
                        <input placeholder="Use map tools to get coordinates" id="${source}Longitude" type="number" min="-180" max="180" data-bind="value: data.${source}Longitude" disabled
                            ${lngValidation} class="form-control full-width-input">
                    </g:else>
                </div>
            </div>

            <!-- /ko -->

            <!-- ko if: transients.showManualCoordinateForm -->
            <g:if test="${!readonly}">
                <div class="form-group row" data-bind="slideVisible: transients.editCoordinates">
                    <div class="col-sm-3">
                        <label for="${source}Latitude">Enter latitude
                            <a href="#" class="helphover" data-bind="popover: {title:'<g:message code="record.edit.map.latLon"/>', content:'<g:message code="record.edit.map.latLon.content"/>'}">
                                <i class=fa fa-question-circle></i>
                            </a>
                        </label>
                    </div>

                    <div class="col-sm-9">
                        <input placeholder="Decimal latitude" id="${source}LatitudeStaged" type="number" min="-90" max="90" data-bind="value: transients.${source}LatitudeStaged"
                            ${latValidation} class="form-control full-width-input manual-point-lat-input">
                    </div>
                </div>

                <div class="form-group row" data-bind="slideVisible: transients.editCoordinates">
                    <div class="col-sm-3">
                        <label for="${source}Longitude">Enter longitude</label>
                    </div>

                    <div class="col-sm-9">
                        <input placeholder="Decimal longitude" id="${source}LongitudeStaged" type="number" min="-180" max="180" data-bind="value: transients.${source}LongitudeStaged"
                                ${lngValidation} class="form-control full-width-input manual-point-lng-input">
                    </div>
                </div>

                <div class="form-group row mb-2">
                    <div class="col-sm-3">
                    </div>
                    <div class="col-sm-9">
                        <!-- ko if: !transients.editCoordinates() -->
                        <button class="btn btn-primary-dark manual-point-add-btn" data-bind="click: transients.showCoordinateFields"><i class="fa fa-plus"></i> Add coordinates manually</button>
                        <!-- /ko -->
                        <!-- ko if: transients.editCoordinates() -->
                        <button class="btn btn-primary-dark manual-point-save-btn" data-bind="click: transients.saveCoordinates"><i class="fa fa-hdd" data-bind="visible: !transients.showLoadingOnCoordinateCheck()"></i><span class="fa fa-spin fa-spinner" data-bind="visible: transients.showLoadingOnCoordinateCheck"></span> Save coordinates</button>
                        <button class="btn btn-dark manual-point-cancel-btn" data-bind="click: transients.hideCoordinateFields"><i class="far fa-times-circle"></i> Cancel</button>
                        <!-- /ko -->
                    </div>
                </div>
            </g:if>
            <!-- /ko -->
        <!-- Try to pass geo info of map to ko -->
            <input id = "${source}geoInfo" hidden="true">

            <g:if test="${includeAccuracy}">
                <div class="form-group row">
                    <div class="col-sm-3">
                        <label for="${source}Accuracy">Accuracy (metres)</label>
                    </div>

                    <div class="col-sm-9">
                        <g:if test="${readonly}">
                            <span data-bind="text: data.${source}Accuracy"></span>
                        </g:if>
                        <g:else>
                            <select data-bind="options: [0, 10, 50, 100, 500, 1000, 5000, 10000]
                           optionsCaption: 'Choose one...',
                           value: data.${source}Accuracy,
                           valueAllowUnset: true" class="form-control full-width">
                            </select>
                        </g:else>
                    </div>
                </div>
            </g:if>
            <g:if test="${includeSource}">
                <div class="form-group row">
                    <div class="col-sm-3">
                        <label for="${source}Source">Source of coordinates</label>
                    </div>

                    <div class="col-sm-9">
                        <g:if test="${readonly}">
                            <span data-bind="text: data.${source}Source"></span>
                        </g:if>
                        <g:else>
                            <select data-bind="options: ['', 'Google maps', 'Google earth', 'GPS device', 'camera/phone', 'physical maps', 'other']
                           optionsCaption: 'Choose one...',
                           value: data.${source}Source,
                           valueAllowUnset: true" class="form-control full-width"></select>
                        </g:else>
                    </div>
                </div>
            </g:if>
            <g:if test="${includeNotes}">
                <div class="form-group row">
                    <div class="col-sm-3">
                        <label for="${source}Notes">Location notes</label>
                    </div>

                    <div class="col-sm-9">
                        <div class="row">
                            <div class="col-sm-12">
                                <g:if test="${readonly}">
                                    <textarea id="${source}Notes" type="text" data-bind="text: data.${source}Notes" readonly class="form-control form-control-sm"></textarea>
                                </g:if>
                                <g:else>
                                    <textarea id="${source}Notes" type="text" data-bind="value: data.${source}Notes" class="form-control form-control-sm full-width"></textarea>
                                </g:else>
                            </div>
                        </div>
                    </div>
                </div>
            </g:if>
            <g:if test="${includeLocality}">
                <div class="form-group row">
                    <g:if test="${!readonly}">
                        <div class="col-sm-3">
                            <label for="bookmarkedLocations">Saved locations</label>
                        </div>
                        <div class="col-sm-9">
                            <form class="">
                                <select name="bookmarkedLocations" id="bookmarkedLocations" class="form-control full-width">
                                    <option value="">-- saved locations --</option>
                                </select>
                            </form>
                        </div>
                    </g:if>
                </div>
            </g:if>
            <g:if test="${includeLocality}">
                <div class="form-group row" data-bind="slideVisible: data.${source}Latitude() && data.${source}Latitude()">
                    <div class="col-sm-3">
                        <label for="${source}Locality">Matched locality</label>
                    </div>

                    <div class=" col-sm-9">
                        <div class="row">
                            <div class="col-sm-12">
                                <g:if test="${readonly}">
                                    <textarea id="${source}Locality" type="text" data-bind="value: data.${source}Locality" readonly class="form-control form-control-sm full-width"></textarea>
                                </g:if>
                                <g:else>
                                    <form>
                                        <textarea id="${source}Locality" type="text" data-bind="value: data.${source}Locality" class="form-control form-control-sm full-width"></textarea>
                                        <g:if test="${!autoLocalitySearch}">
                                            <button id="reverseGeocodeLocality" class="btn btn-primary-dark margin-top-1">Search for locality match</button>
                                        </g:if>
                                        <button id="saveBookmarkLocation" class="btn btn-primary-dark margin-top-1">Save this location</button>
                                    </form>
                                </g:else>
                            </div>
                        </div>
                    </div>
                </div>
            </g:if>
        </div>
    </div>
</div>

<script type="text/html" id="AddSiteModal">
<div class="modal hide fade" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add Site</h3>
                <button type="button" class="close" data-bind="click: cancel" aria-hidden="true">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <form action="#" data-bind="submit: add">
                    <div class="control-group" data-bind="css: { warning: nameStatus() == 'conflict' }">
                        <label for="site-name" class="control-label">Site Name</label>
                        <div class="controls">
                            <input id="site-name" type="text" class="input-xlarge form-control" data-bind="value: name, valueUpdate: 'afterkeydown'">
                            <i class="fa fa-spin fa-spinner" data-bind="visible: nameStatus() == 'checking' "></i>
                            <span class="help-block" data-bind="visible: nameStatus() == 'conflict' ">This name is already being used for a site</span>
                        </div>
                    </div>

                </form>
                <p class="muted"><small>Cancel this dialog to edit your area.</small></p>
            </div>
            <div class="modal-footer">
        <button type="button" class="btn btn-dark" data-bind="click: cancel"><i class="far fa-times-circle"></i> Cancel</button>
        <button type="button" class="btn btn-primary-dark" data-bind="click: add, enable: nameStatus() == 'ok' "><i class="fa fa-hdd"></i> Save</button>
    </div>
        </div>
    </div>
</div>
</script>

<script id="site-selector-dropdown-template" type="text/html">
<div data-bind="visible: transients.hideSiteSelection">
    <div>
        <g:set var="textOnSiteLocation" value="יצירה או בחירת אתר"/>
        <g:set var="textOnSiteLocation" value="בחירת אתר"/>

        <div class="form-group row">
            <div class="col-sm-12">
                <div class="row">
                    <span class="col-sm-4 preLabel">
                        <label>${readonly ? 'Location:' : "${textOnSiteLocation}"}</label>
                    </span>
                    <div class="col-sm-8">
                        <g:if test="${readonly}">
                            <span class="output-text" data-bind="text: data.${source}Name() "></span>
                        </g:if>
                        <g:else>
                            <select id="siteLocation"
                                    data-bind='options: data.${source}SitesArray, optionsText: "name", optionsValue: "siteId", value: data.${source},
                                    optionsCaption: "${textOnSiteLocation}", disable: ${readonly} || data.${source}Loading,
                                    select2:{dropdownParent: $(document.getElementById("siteLocation").parentElement)}' class="form-control input-xlarge full-width"></select>
                        </g:else>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</script>
<asset:script type="text/javascript">
    if (typeof fcConfig == 'undefined')
        fcConfig = {};

    fcConfig.saveBookmarkLocationURL = fcConfig.saveBookmarkLocationURL || "${createLink(controller:"ajax", action:"saveBookmarkLocation")}";
    fcConfig.getBookmarkLocationsURL = fcConfig.getBookmarkLocationsURL || "${createLink(controller:"ajax", action:"getBookmarkLocations")}";

    $(function () {
        var prevLat, prevLng;
        loadBookmarks();

        // automatically update map location if image uploaded had location data
        $(document).on('imagelocation', function(event, data) {
            addPoint(data);
        });

        // listen to marker movement. update source information and look up locality
        $(document).on('markerupdated', function(){
        <g:if test="${autoLocalitySearch}">
            // call locality search functionality when map marker is updated
            reverseGeocode();
        </g:if>

            var el = document.getElementById("${source}Map"),
                viewModel = ko.dataFor(el);

            if(isGeoMapPresentInViewModel(viewModel)){
                var source = viewModel.data.${source}Source;
                source && source('Google maps');
            }

        });

        // Save current location
        $('#koActivityMainBlock').on('click', '#reverseGeocodeLocality', function (e) {
            e.preventDefault();
            reverseGeocode()
        });

        // Save current location
         $('#koActivityMainBlock').on('click', '#saveBookmarkLocation', function (e) {
            e.preventDefault();
            var bookmark = {
                locality: $('#${source}Locality').val(),
                decimalLatitude: Number($('#${source}Latitude').val()),
                decimalLongitude: Number($('#${source}Longitude').val())
            };

            $.ajax({
                url: fcConfig.saveBookmarkLocationURL,
                dataType: 'json',
                type: 'POST',
                data: JSON.stringify(bookmark),
                contentType: 'application/json; charset=utf-8'
            }).done(function (data) {
                if (data.error) {
                    bootbox.alert("Location could not be saved - " + data.error, 'Error');
                } else {
                    // reload bookmarks
                    bootbox.alert("Location was saved");
                    loadBookmarks();
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                bootbox.alert("Error: " + textStatus + " - " + errorThrown);
            });
        });

        // Trigger loading of bookmark on select change
        $('#bookmarkedLocations').change(function (e) {
            e.preventDefault();
            var location;
            var id = $(this).find("option:selected").val();

            if (id && id != 'error') {
                $.each(bookmarks, function (i, el) {
                    if (id == el.locationId) {
                        location = el;
                    }
                });

                if (location) {
                    addPoint({decimalLatitude: location.decimalLatitude, decimalLongitude: location.decimalLongitude});
                } else {
                    bootbox.alert("Error: bookmark could not be loaded.");
                }
            } else if (id == 'error') {
                loadBookmarks();
            }
        });

        function loadBookmarks() {
            $.ajax({
                url: fcConfig.getBookmarkLocationsURL,
                dataType: 'json',
            }).done(function (data) {
                if (data.error) {
                    bootbox.alert("Bookmark could not be loaded - " + data.error, 'Error');
                } else {
                    // reload bookmarks
                    bookmarks = data; // cache json
                    // inject values into select widget
                    $('#bookmarkedLocations option[value != ""]').remove(); // clear list if already loaded
                    $.each(data, function(i, el) {
                        var name = el.locality ? el.locality : 'Location '+ (i+1);
                        $('#bookmarkedLocations').append('<option value="' + el.locationId + '">' + name + '</option>');
                    });
                }
            }).fail(function( jqXHR, textStatus, errorThrown ) {
                //alert("Error: " + textStatus + " - " + errorThrown);
                bootbox.alert("Error: bookmarks could not be loaded at this time. " + textStatus + " - " + errorThrown);
                $('#bookmarkedLocations').append('<option value="error">Error: bookmarks could not be loaded at this time. Select to retry.</option>');
            });
        }

        function addPoint (data) {
            var el = document.getElementById("${source}Map"),
                viewModel = ko.dataFor(el);

            if (isGeoMapPresentInViewModel(viewModel)) {
                viewModel.addMarker(data);
            }
        }

        function isGeoMapPresentInViewModel (viewModel) {
            return viewModel && viewModel.data && viewModel.data.${source}Longitude && viewModel.data.${source}Latitude;
        }

        /**
         * Get address for a given lat/lng using openstreetmap
         */
        function reverseGeocode() {
            var el = document.getElementById("${source}Map"),
                viewModel = ko.dataFor(el);

            if(isGeoMapPresentInViewModel(viewModel)){
                var lng = viewModel.data.${source}Longitude(),
                    lat = viewModel.data.${source}Latitude();
                if((prevLat != lat) && (prevLng != lng)){
                    $.ajax({
                        url: 'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1' + '&lat=' + lat + '&lon=' + lng,
                        dataType: 'json',
                        xhrFields: {
                            withCredentials: false
                        },
                        beforeSend: function(xhr){
                            xhr.setRequestHeader('authKey', '');
                            xhr.setRequestHeader('userName', '');
                        }
                    }).done(function (data) {
                        console.log(data)
                        if (!data.error) {
                            $('#${source}Locality').val(data.display_name)
                            $('#${source}Locality').change()
                        }

                        prevLat = lat;
                        prevLng = lng;
                    });
                }
            }
        }
    })
</asset:script>
