/**
 * @constructor links.Timeline.Item
 * @param {Object} data       Object containing parameters start, end
 *                            content, group. type, group.
 * @param {Object} [options]  Options to set initial property values
 *                                {Number} top
 *                                {Number} left
 *                                {Number} width
 *                                {Number} height
 */
links.Timeline.Item = function (data, options) {
    if (data) {
        /* TODO: use parseJSONDate as soon as it is tested and working (in two directions)
         this.start = links.Timeline.parseJSONDate(data.start);
         this.end = links.Timeline.parseJSONDate(data.end);
         */
        this.start = data.start;
        this.end = data.end;
        this.content = data.content;
        this.className = data.className;
        this.editable = data.editable;
        this.group = data.group;
        this.color = d3.rgb(data.color);
    }
    this.top = 0;
    this.left = 0;
    this.width = 0;
    this.height = 0;
    this.lineWidth = 0;
    this.dotWidth = 0;
    this.dotHeight = 0;

    this.rendered = false; // true when the item is draw in the Timeline DOM

    if (options) {
        // override the default properties
        for (var option in options) {
            if (options.hasOwnProperty(option)) {
                this[option] = options[option];
            }
        }
    }

};



/**
 * Reflow the Item: retrieve its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 */
links.Timeline.Item.prototype.reflow = function () {
    // Should be implemented by sub-prototype
    return false;
};

/**
 * Append all image urls present in the items DOM to the provided array
 * @param {String[]} imageUrls
 */
links.Timeline.Item.prototype.getImageUrls = function (imageUrls) {
    if (this.dom) {
        links.imageloader.filterImageUrls(this.dom, imageUrls);
    }
};

/**
 * Select the item
 */
links.Timeline.Item.prototype.select = function () {
    // Should be implemented by sub-prototype
};

/**
 * Unselect the item
 */
links.Timeline.Item.prototype.unselect = function () {
    // Should be implemented by sub-prototype
};

/**
 * Creates the DOM for the item, depending on its type
 * @return {Element | undefined}
 */
links.Timeline.Item.prototype.createDOM = function () {
    // Should be implemented by sub-prototype
};

/**
 * Append the items DOM to the given HTML container. If items DOM does not yet
 * exist, it will be created first.
 * @param {Element} container
 */
links.Timeline.Item.prototype.showDOM = function (container) {
    // Should be implemented by sub-prototype
};

/**
 * Remove the items DOM from the current HTML container
 * @param {Element} container
 */
links.Timeline.Item.prototype.hideDOM = function (container) {
    // Should be implemented by sub-prototype
};

/**
 * Update the DOM of the item. This will update the content and the classes
 * of the item
 */
links.Timeline.Item.prototype.updateDOM = function () {
    // Should be implemented by sub-prototype
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range of the timeline and the timeline options.
 * @param {links.Timeline} timeline
 */
links.Timeline.Item.prototype.updatePosition = function (timeline) {
    // Should be implemented by sub-prototype
};

/**
 * Check if the item is drawn in the timeline (i.e. the DOM of the item is
 * attached to the frame. You may also just request the parameter item.rendered
 * @return {boolean} rendered
 */
links.Timeline.Item.prototype.isRendered = function () {
    return this.rendered;
};

/**
 * Check if the item is located in the visible area of the timeline, and
 * not part of a cluster
 * @param {Date} start
 * @param {Date} end
 * @return {boolean} visible
 */
links.Timeline.Item.prototype.isVisible = function (start, end) {
    // Should be implemented by sub-prototype
    return false;
};

/**
 * Reposition the item
 * @param {Number} left
 * @param {Number} right
 */
links.Timeline.Item.prototype.setPosition = function (left, right) {
    // Should be implemented by sub-prototype
};

/**
 * Calculate the right position of the item
 * @param {links.Timeline} timeline
 * @return {Number} right
 */
links.Timeline.Item.prototype.getRight = function (timeline) {
    // Should be implemented by sub-prototype
    return 0;
};

/**
 * Calculate the width of the item
 * @param {links.Timeline} timeline
 * @return {Number} width
 */
links.Timeline.Item.prototype.getWidth = function (timeline) {
    // Should be implemented by sub-prototype
    return this.width || 0; // last rendered width
};