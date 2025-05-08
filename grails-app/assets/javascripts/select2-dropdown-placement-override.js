/**
 * This file overrides the default dropdown placement for select2 to support opening the dropdown on the right side
 * of the select2 element.  This is useful for select2 elements that are placed on the right side of the page.
 * To use the right alignment, add the dropdown-right class to the select element with select2 binding applied.
 */
$.fn.select2.amd.require(["select2/utils",'select2/dropdown/attachBody'], function(Utils, AttachBody) {

    AttachBody.prototype._positionDropdown = function () {
        var $window = $(window);

        var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
        var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');

        var newDirection = null;

        var offset = this.$container.offset();

        offset.bottom = offset.top + this.$container.outerHeight(false);

        var container = {
            height: this.$container.outerHeight(false)
        };

        container.top = offset.top;
        container.bottom = offset.top + container.height;

        var dropdown = {
            height: this.$dropdown.outerHeight(false)
        };

        var viewport = {
            top: $window.scrollTop(),
            bottom: $window.scrollTop() + $window.height()
        };

        var enoughRoomAbove = viewport.top < (offset.top - dropdown.height);
        var enoughRoomBelow = viewport.bottom > (offset.bottom + dropdown.height);

        var containerWidth = this.$container.outerWidth()
        var right = ($("body").outerWidth() - (offset.left + containerWidth));

        if (this.$element.hasClass("dropdown-right")) {
            var css = {
                left: right,
                top: container.bottom
            };
        } else {
            var css = {
                right: offset.left,
                top: container.bottom
            };
        }

        // Determine what the parent element is to use for calciulating the offset
        var $offsetParent = this.$dropdownParent;

        // For statically positoned elements, we need to get the element
        // that is determining the offset
        if ($offsetParent.css('position') === 'static') {
            $offsetParent = $offsetParent.offsetParent();
        }

        var parentOffset = $offsetParent.offset();

        css.top -= parentOffset.top;
        css.right -= parentOffset.left;

        if (!isCurrentlyAbove && !isCurrentlyBelow) {
            newDirection = 'below';
        }

        if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
            newDirection = 'above';
        } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
            newDirection = 'below';
        }

        if (newDirection == 'above' ||
            (isCurrentlyAbove && newDirection !== 'below')) {
            css.top = container.top - parentOffset.top - dropdown.height;
        }

        if (newDirection != null) {
            this.$dropdown
                .removeClass('select2-dropdown--below select2-dropdown--above')
                .addClass('select2-dropdown--' + newDirection);
            this.$container
                .removeClass('select2-container--below select2-container--above')
                .addClass('select2-container--' + newDirection);
        }

        this.$dropdownContainer.css(css);
    };
});