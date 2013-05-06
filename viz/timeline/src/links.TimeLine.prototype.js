/**
 * Main drawing logic. This is the function that needs to be called
 * in the html page, to draw the timeline.
 *
 * A data table with the events must be provided, and an options table.
 *
 * @param {google.visualization.DataTable}      data
 *                                 The data containing the events for the timeline.
 *                                 Object DataTable is defined in
 *                                 google.visualization.DataTable
 * @param {Object} options         A name/value map containing settings for the
 *                                 timeline. Optional.
 */
links.Timeline.prototype.draw = function(data, options) {
    this.setOptions(options);

    // read the data
    this.setData(data);

    // set timer range. this will also redraw the timeline
    if (options && (options.start || options.end)) {
        this.setVisibleChartRange(options.start, options.end);
    }
    else if (this.firstDraw) {
        this.setVisibleChartRangeAuto();
    }

    this.firstDraw = false;
};


/**
 * Set options for the timeline.
 * Timeline must be redrawn afterwards
 * @param {Object} options A name/value map containing settings for the
 *                                 timeline. Optional.
 */
links.Timeline.prototype.setOptions = function(options) {
    if (options) {
        // retrieve parameter values
        for (var i in options) {
            if (options.hasOwnProperty(i)) {
                this.options[i] = options[i];
            }
        }
        
        // prepare i18n dependent on set locale
        if (typeof links.locales !== 'undefined' && this.options.locale !== 'en') {
            var localeOpts = links.locales[this.options.locale];
            if(localeOpts) {
                for (var l in localeOpts) {
                    if (localeOpts.hasOwnProperty(l)) {
                        this.options[l] = localeOpts[l];
                    }
                }
            }
        }

        // check for deprecated options
        if (options.showButtonAdd != undefined) {
            this.options.showButtonNew = options.showButtonAdd;
            console.log('WARNING: Option showButtonAdd is deprecated. Use showButtonNew instead');
        }
        if (options.intervalMin != undefined) {
            this.options.zoomMin = options.intervalMin;
            console.log('WARNING: Option intervalMin is deprecated. Use zoomMin instead');
        }
        if (options.intervalMax != undefined) {
            this.options.zoomMax = options.intervalMax;
            console.log('WARNING: Option intervalMax is deprecated. Use zoomMax instead');
        }

        if (options.scale && options.step) {
            this.step.setScale(options.scale, options.step);
        }
    }

    // validate options
    this.options.autoHeight = (this.options.height === "auto");
};

/**
 * Add new type of items
 * @param {String} typeName  Name of new type
 * @param {links.Timeline.Item} typeFactory Constructor of items
 */
links.Timeline.prototype.addItemType = function (typeName, typeFactory) {
    this.itemTypes[typeName] = typeFactory;
};

/**
 * Set data for the timeline
 * @param {Array} data
 */
links.Timeline.prototype.setData = function(data) {
    // unselect any previously selected item
    this.unselectItem();

    if (!data) {
        data = [];
    }

    // clear all data
    this.stackCancelAnimation();
    this.clearItems();
    this.data = data;
    var l = data.length, items = this.items = new Array(l);
    this.deleteGroups();

    if (links.Timeline.isArray(data)) {
        // read JSON array
        for (;l--;) {
            items[l] = this.createItem(data[l]);
        }
    }
    else {
        throw "Unknown data type. DataTable or Array expected.";
    }

    // prepare data for clustering, by filtering and sorting by type
    if (this.options.cluster) {
        this.clusterGenerator.setData(this.items);
    }

    this.render({
        animate: false
    });
};

/**
 * Return the original data table.
 * @return {google.visualization.DataTable | Array} data
 */
links.Timeline.prototype.getData = function  () {
    return this.data;
};


/**
 * Update the original data with changed start, end or group.
 *
 * @param {Number} index
 * @param {Object} values   An object containing some of the following parameters:
 *                          {Date} start,
 *                          {Date} end,
 *                          {String} content,
 *                          {String} group
 */
links.Timeline.prototype.updateData = function  (index, values) {
    var data = this.data,
        prop;

    if (links.Timeline.isArray(data)) {
        // update the original JSON table
        var row = data[index];
        if (row == undefined) {
            row = {};
            data[index] = row;
        }

        // merge all fields from the provided data into the current data
        for (prop in values) {
            if (values.hasOwnProperty(prop)) {
                row[prop] = values[prop];

                // TODO: correctly serialize the start and end Date to the desired type (Date, String, or Number)
            }
        }
    }
    else {
        throw "Cannot update data, unknown type of data";
    }
};

/**
 * Find the item index from a given HTML element
 * If no item index is found, undefined is returned
 * @param {Element} element
 * @return {Number | undefined} index
 */
links.Timeline.prototype.getItemIndex = function(element) {
    var e = element,
        dom = this.dom,
        frame = dom.items.frame,
        items = this.items,
        index = undefined;

    // try to find the frame where the items are located in
    while (e.parentNode && e.parentNode !== frame) {
        e = e.parentNode;
    }

    if (e.parentNode === frame) {
        // yes! we have found the parent element of all items
        // retrieve its id from the array with items
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            if (items[i].dom === e) {
                index = i;
                break;
            }
        }
    }

    return index;
};

/**
 * Set a new size for the timeline
 * @param {string} width   Width in pixels or percentage (for example "800px"
 *                         or "50%")
 * @param {string} height  Height in pixels or percentage  (for example "400px"
 *                         or "30%")
 */
links.Timeline.prototype.setSize = function(width, height) {
    if (width) {
        this.options.width = width;
        this.dom.frame.style.width = width;
    }
    if (height) {
        this.options.height = height;
        this.options.autoHeight = (this.options.height === "auto");
        if (height !==  "auto" ) {
            this.dom.frame.style.height = height;
        }
    }

    this.render({
        animate: false
    });
};


/**
 * Set a new value for the visible range int the timeline.
 * Set start undefined to include everything from the earliest date to end.
 * Set end undefined to include everything from start to the last date.
 * Example usage:
 *    myTimeline.setVisibleChartRange(new Date("2010-08-22"),
 *                                    new Date("2010-09-13"));
 * @param {Date}   start     The start date for the timeline. optional
 * @param {Date}   end       The end date for the timeline. optional
 * @param {boolean} redraw   Optional. If true (default) the Timeline is
 *                           directly redrawn
 */
links.Timeline.prototype.setVisibleChartRange = function(start, end, redraw) {
    var range = {};
    if (!start || !end) {
        // retrieve the date range of the items
        range = this.getDataRange(true);
    }

    if (!start) {
        if (end) {
            if (range.min && range.min.valueOf() < end.valueOf()) {
                // start of the data
                start = range.min;
            }
            else {
                // 7 days before the end
                start = new Date(end.valueOf());
                start.setDate(start.getDate() - 7);
            }
        }
        else {
            // default of 3 days ago
            start = new Date();
            start.setDate(start.getDate() - 3);
        }
    }

    if (!end) {
        if (range.max) {
            // end of the data
            end = range.max;
        }
        else {
            // 7 days after start
            end = new Date(start.valueOf());
            end.setDate(end.getDate() + 7);
        }
    }

    // prevent start Date <= end Date
    if (end <= start) {
        end = new Date(start.valueOf());
        end.setDate(end.getDate() + 7);
    }

    // limit to the allowed range (don't let this do by applyRange,
    // because that method will try to maintain the interval (end-start)
    var min = this.options.min ? this.options.min : undefined; // date
    if (min != undefined && start.valueOf() < min.valueOf()) {
        start = new Date(min.valueOf()); // date
    }
    var max = this.options.max ? this.options.max : undefined; // date
    if (max != undefined && end.valueOf() > max.valueOf()) {
        end = new Date(max.valueOf()); // date
    }

    this.applyRange(start, end);

    if (redraw == undefined || redraw == true) {
        this.render({
            animate: false
        });  // TODO: optimize, no reflow needed
    }
    else {
        this.recalcConversion();
    }
};


/**
 * Change the visible chart range such that all items become visible
 */
links.Timeline.prototype.setVisibleChartRangeAuto = function() {
    var range = this.getDataRange(true);
    this.setVisibleChartRange(range.min, range.max);
};

/**
 * Adjust the visible range such that the current time is located in the center
 * of the timeline
 */
links.Timeline.prototype.setVisibleChartRangeNow = function() {
    var now = new Date();

    var diff = (this.end.valueOf() - this.start.valueOf());

    var startNew = new Date(now.valueOf() - diff/2);
    var endNew = new Date(startNew.valueOf() + diff);
    this.setVisibleChartRange(startNew, endNew);
};


/**
 * Retrieve the current visible range in the timeline.
 * @return {Object} An object with start and end properties
 */
links.Timeline.prototype.getVisibleChartRange = function() {
    return {
        'start': new Date(this.start.valueOf()),
        'end': new Date(this.end.valueOf())
    };
};

/**
 * Get the date range of the items.
 * @param {boolean} [withMargin]  If true, 5% of whitespace is added to the
 *                                left and right of the range. Default is false.
 * @return {Object} range    An object with parameters min and max.
 *                           - {Date} min is the lowest start date of the items
 *                           - {Date} max is the highest start or end date of the items
 *                           If no data is available, the values of min and max
 *                           will be undefined
 */
links.Timeline.prototype.getDataRange = function (withMargin) {
    var items = this.items,
        min = undefined, // number
        max = undefined; // number

    if (items) {
        for (var i = 0, iMax = items.length; i < iMax; i++) {
            var item = items[i],
                start = item.start != undefined ? item.start.valueOf() : undefined,
                end   = item.end != undefined   ? item.end.valueOf() : start;

            if (min != undefined && start != undefined) {
                min = Math.min(min.valueOf(), start.valueOf());
            }
            else {
                min = start;
            }

            if (max != undefined && end != undefined) {
                max = Math.max(max, end);
            }
            else {
                max = end;
            }
        }
    }

    if (min && max && withMargin) {
        // zoom out 5% such that you have a little white space on the left and right
        var diff = (max - min);
        min = min - diff * 0.05;
        max = max + diff * 0.05;
    }

    return {
        'min': min != undefined ? new Date(min) : undefined,
        'max': max != undefined ? new Date(max) : undefined
    };
};

/**
 * Re-render (reflow and repaint) all components of the Timeline: frame, axis,
 * items, ...
 * @param {Object} [options]  Available options:
 *                            {boolean} renderTimesLeft   Number of times the
 *                                                        render may be repeated
 *                                                        5 times by default.
 *                            {boolean} animate           takes options.animate
 *                                                        as default value
 */
links.Timeline.prototype.render = function(options) {
    var frameResized = this.reflowFrame();
    var axisResized = this.reflowAxis();
    var groupsResized = this.reflowGroups();
    var itemsResized = this.reflowItems();
    var resized = (frameResized || axisResized || groupsResized || itemsResized);

    // TODO: only stackEvents/filterItems when resized or changed. (gives a bootstrap issue).
    // if (resized) {
    var animate = this.options.animate;
    if (options && options.animate != undefined) {
        animate = options.animate;
    }

    this.recalcConversion();
    this.clusterItems();
    this.filterItems();
    this.stackItems(animate);

    this.recalcItems();

    // TODO: only repaint when resized or when filterItems or stackItems gave a change?
    var needsReflow = this.repaint();

    // re-render once when needed (prevent endless re-render loop)
    if (needsReflow) {
        var renderTimesLeft = options ? options.renderTimesLeft : undefined;
        if (renderTimesLeft == undefined) {
            renderTimesLeft = 5;
        }
        if (renderTimesLeft > 0) {
            this.render({
                'animate': options ? options.animate: undefined,
                'renderTimesLeft': (renderTimesLeft - 1)
            });
        }
    }
};

/**
 * Repaint all components of the Timeline
 * @return {boolean} needsReflow   Returns true if the DOM is changed such that
 *                                 a reflow is needed.
 */
links.Timeline.prototype.repaint = function() {
    var frameNeedsReflow = this.repaintFrame();
    var axisNeedsReflow  = this.repaintAxis();
    var groupsNeedsReflow  = this.repaintGroups();
    var itemsNeedsReflow = this.repaintItems();
    var fragment = document.createDocumentFragment();
    this.repaintCurrentTime();
    this.repaintCustomTime();

    this.dom.container.appendChild(fragment.appendChild(this.dom.frame));

    return (frameNeedsReflow || axisNeedsReflow || groupsNeedsReflow || itemsNeedsReflow);
};

/**
 * Reflow the timeline frame
 * @return {boolean} resized    Returns true if any of the frame elements
 *                              have been resized.
 */
links.Timeline.prototype.reflowFrame = function() {
    var dom = this.dom,
        options = this.options,
        size = this.size,
        resized = false;

    // Note: IE7 has issues with giving frame.clientWidth, therefore I use offsetWidth instead
    var frameWidth  = dom.frame ? dom.frame.offsetWidth : 0,
        frameHeight = dom.frame ? dom.frame.clientHeight : 0;

    resized = resized || (size.frameWidth !== frameWidth);
    resized = resized || (size.frameHeight !== frameHeight);
    size.frameWidth = frameWidth;
    size.frameHeight = frameHeight;

    return resized;
};

/**
 * repaint the Timeline frame
 * @return {boolean} needsReflow   Returns true if the DOM is changed such that
 *                                 a reflow is needed.
 */
links.Timeline.prototype.repaintFrame = function() {
    var needsReflow = false,
        dom = this.dom,
        options = this.options,
        size = this.size;

    // main frame
    if (!dom.frame) {
        dom.frame = document.createElement("DIV");
        dom.frame.className = "timeline-frame";
        dom.frame.style.position = "relative";
        dom.frame.style.overflow = "hidden";
        //dom.container.appendChild(dom.frame);
        needsReflow = true;
    }

    var height = options.autoHeight ?
        (size.actualHeight + "px") :
        (options.height || "100%");
    var width  = options.width || "100%";
    needsReflow = needsReflow || (dom.frame.style.height != height);
    needsReflow = needsReflow || (dom.frame.style.width != width);
    dom.frame.style.height = height;
    dom.frame.style.width = width;

    // contents
    if (!dom.content) {
        // create content box where the axis and items will be created
        dom.content = document.createElement("DIV");
        dom.content.style.position = "relative";
        dom.content.style.overflow = "hidden";
        dom.frame.appendChild(dom.content);

        var timelines = document.createElement("DIV");
        timelines.style.position = "absolute";
        timelines.style.left = "0px";
        timelines.style.top = "0px";
        timelines.style.height = "100%";
        timelines.style.width = "0px";
        dom.content.appendChild(timelines);
        dom.contentTimelines = timelines;

        var params = this.eventParams,
            me = this;
        if (!params.onMouseDown) {
            params.onMouseDown = function (event) {me.onMouseDown(event);};
            links.Timeline.addEventListener(dom.content, "mousedown", params.onMouseDown);
        }
        if (!params.onTouchStart) {
            params.onTouchStart = function (event) {me.onTouchStart(event);};
            links.Timeline.addEventListener(dom.content, "touchstart", params.onTouchStart);
        }
        if (!params.onMouseWheel) {
            params.onMouseWheel = function (event) {me.onMouseWheel(event);};
            links.Timeline.addEventListener(dom.content, "mousewheel", params.onMouseWheel);
        }
        if (!params.onDblClick) {
            params.onDblClick = function (event) {me.onDblClick(event);};
            links.Timeline.addEventListener(dom.content, "dblclick", params.onDblClick);
        }

        needsReflow = true;
    }
    dom.content.style.left = size.contentLeft + "px";
    dom.content.style.top = "0px";
    dom.content.style.width = size.contentWidth + "px";
    dom.content.style.height = size.frameHeight + "px";

    this.repaintNavigation();

    return needsReflow;
};

/**
 * Reflow the timeline axis. Calculate its height, width, positioning, etc...
 * @return {boolean} resized    returns true if the axis is resized
 */
links.Timeline.prototype.reflowAxis = function() {
    var resized = false,
        dom = this.dom,
        options = this.options,
        size = this.size,
        axisDom = dom.axis;

    var characterMinorWidth  = (axisDom && axisDom.characterMinor) ? axisDom.characterMinor.clientWidth : 0,
        characterMinorHeight = (axisDom && axisDom.characterMinor) ? axisDom.characterMinor.clientHeight : 0,
        characterMajorWidth  = (axisDom && axisDom.characterMajor) ? axisDom.characterMajor.clientWidth : 0,
        characterMajorHeight = (axisDom && axisDom.characterMajor) ? axisDom.characterMajor.clientHeight : 0,
        axisHeight = (options.showMinorLabels ? characterMinorHeight : 0) +
            (options.showMajorLabels ? characterMajorHeight : 0);

    var axisTop  = options.axisOnTop ? 0 : size.frameHeight - axisHeight,
        axisLine = options.axisOnTop ? axisHeight : axisTop;

    resized = resized || (size.axis.top !== axisTop);
    resized = resized || (size.axis.line !== axisLine);
    resized = resized || (size.axis.height !== axisHeight);
    size.axis.top = axisTop;
    size.axis.line = axisLine;
    size.axis.height = axisHeight;
    size.axis.labelMajorTop = options.axisOnTop ? 0 : axisLine +
        (options.showMinorLabels ? characterMinorHeight : 0);
    size.axis.labelMinorTop = options.axisOnTop ?
        (options.showMajorLabels ? characterMajorHeight : 0) :
        axisLine;
    size.axis.lineMinorTop = options.axisOnTop ? size.axis.labelMinorTop : 0;
    size.axis.lineMinorHeight = options.showMajorLabels ?
        size.frameHeight - characterMajorHeight:
        size.frameHeight;
    if (axisDom && axisDom.minorLines && axisDom.minorLines.length) {
        size.axis.lineMinorWidth = axisDom.minorLines[0].offsetWidth;
    }
    else {
        size.axis.lineMinorWidth = 1;
    }
    if (axisDom && axisDom.majorLines && axisDom.majorLines.length) {
        size.axis.lineMajorWidth = axisDom.majorLines[0].offsetWidth;
    }
    else {
        size.axis.lineMajorWidth = 1;
    }

    resized = resized || (size.axis.characterMinorWidth  !== characterMinorWidth);
    resized = resized || (size.axis.characterMinorHeight !== characterMinorHeight);
    resized = resized || (size.axis.characterMajorWidth  !== characterMajorWidth);
    resized = resized || (size.axis.characterMajorHeight !== characterMajorHeight);
    size.axis.characterMinorWidth  = characterMinorWidth;
    size.axis.characterMinorHeight = characterMinorHeight;
    size.axis.characterMajorWidth  = characterMajorWidth;
    size.axis.characterMajorHeight = characterMajorHeight;

    var contentHeight = Math.max(size.frameHeight - axisHeight, 0);
    size.contentLeft = options.groupsOnRight ? 0 : size.groupsWidth;
    size.contentWidth = Math.max(size.frameWidth - size.groupsWidth, 0);
    size.contentHeight = contentHeight;

    return resized;
};

/**
 * Redraw the timeline axis with minor and major labels
 * @return {boolean} needsReflow     Returns true if the DOM is changed such
 *                                   that a reflow is needed.
 */
links.Timeline.prototype.repaintAxis = function() {
    var needsReflow = false,
        dom = this.dom,
        options = this.options,
        size = this.size,
        step = this.step;

    var axis = dom.axis = dom.axis || {};

    if (!size.axis.properties) {
        size.axis.properties = {};
    }
    if (!axis.minorTexts) {
        axis.minorTexts = [];
    }
    if (!axis.minorLines) {
        axis.minorLines = [];
    }
    if (!axis.majorTexts) {
        axis.majorTexts = [];
    }
    if (!axis.majorLines) {
        axis.majorLines = [];
    }

    if (!axis.frame) {
        axis.frame = document.createElement("DIV");
        axis.frame.style.position = "absolute";
        axis.frame.style.left = "0px";
        axis.frame.style.top = "0px";
        dom.content.appendChild(axis.frame);
    }

    // take axis offline
    dom.content.removeChild(axis.frame);

    axis.frame.style.width = (size.contentWidth) + "px";
    axis.frame.style.height = (size.axis.height) + "px";

    // the drawn axis is wider than the actual visual part, such that
    // the axis can be dragged without having to redraw it each time again.
    var start = this.screenToTime(0);
    var end = this.screenToTime(size.contentWidth);

    // calculate minimum step (in milliseconds) based on character size
    if (size.axis.characterMinorWidth) {
        this.minimumStep = this.screenToTime(size.axis.characterMinorWidth * 6) -
            this.screenToTime(0);

        step.setRange(start, end, this.minimumStep);
    }

    var charsNeedsReflow = this.repaintAxisCharacters();
    needsReflow = needsReflow || charsNeedsReflow;

    // The current labels on the axis will be re-used (much better performance),
    // therefore, the repaintAxis method uses the mechanism with
    // repaintAxisStartOverwriting, repaintAxisEndOverwriting, and
    // this.size.axis.properties is used.
    this.repaintAxisStartOverwriting();

    step.start();
    var xFirstMajorLabel = undefined;
    var max = 0;
    while (!step.end() && max < 1000) {
        max++;
        var cur = step.getCurrent(),
            x = this.timeToScreen(cur),
            isMajor = step.isMajor();

        if (options.showMinorLabels) {
            this.repaintAxisMinorText(x, step.getLabelMinor(options));
        }

        if (isMajor && options.showMajorLabels) {
            if (x > 0) {
                if (xFirstMajorLabel == undefined) {
                    xFirstMajorLabel = x;
                }
                this.repaintAxisMajorText(x, step.getLabelMajor(options));
            }
            this.repaintAxisMajorLine(x);
        }
        else {
            this.repaintAxisMinorLine(x);
        }

        step.next();
    }

    // create a major label on the left when needed
    if (options.showMajorLabels) {
        var leftTime = this.screenToTime(0),
            leftText = this.step.getLabelMajor(options, leftTime),
            width = leftText.length * size.axis.characterMajorWidth + 10; // upper bound estimation

        if (xFirstMajorLabel == undefined || width < xFirstMajorLabel) {
            this.repaintAxisMajorText(0, leftText, leftTime);
        }
    }

    // cleanup left over labels
    this.repaintAxisEndOverwriting();

    this.repaintAxisHorizontal();

    // put axis online
    dom.content.insertBefore(axis.frame, dom.content.firstChild);

    return needsReflow;
};

/**
 * Create characters used to determine the size of text on the axis
 * @return {boolean} needsReflow   Returns true if the DOM is changed such that
 *                                 a reflow is needed.
 */
links.Timeline.prototype.repaintAxisCharacters = function () {
    // calculate the width and height of a single character
    // this is used to calculate the step size, and also the positioning of the
    // axis
    var needsReflow = false,
        dom = this.dom,
        axis = dom.axis,
        text;

    if (!axis.characterMinor) {
        text = document.createTextNode("0");
        var characterMinor = document.createElement("DIV");
        characterMinor.className = "timeline-axis-text timeline-axis-text-minor";
        characterMinor.appendChild(text);
        characterMinor.style.position = "absolute";
        characterMinor.style.visibility = "hidden";
        characterMinor.style.paddingLeft = "0px";
        characterMinor.style.paddingRight = "0px";
        axis.frame.appendChild(characterMinor);

        axis.characterMinor = characterMinor;
        needsReflow = true;
    }

    if (!axis.characterMajor) {
        text = document.createTextNode("0");
        var characterMajor = document.createElement("DIV");
        characterMajor.className = "timeline-axis-text timeline-axis-text-major";
        characterMajor.appendChild(text);
        characterMajor.style.position = "absolute";
        characterMajor.style.visibility = "hidden";
        characterMajor.style.paddingLeft = "0px";
        characterMajor.style.paddingRight = "0px";
        axis.frame.appendChild(characterMajor);

        axis.characterMajor = characterMajor;
        needsReflow = true;
    }

    return needsReflow;
};

/**
 * Initialize redraw of the axis. All existing labels and lines will be
 * overwritten and reused.
 */
links.Timeline.prototype.repaintAxisStartOverwriting = function () {
    var properties = this.size.axis.properties;

    properties.minorTextNum = 0;
    properties.minorLineNum = 0;
    properties.majorTextNum = 0;
    properties.majorLineNum = 0;
};

/**
 * End of overwriting HTML DOM elements of the axis.
 * remaining elements will be removed
 */
links.Timeline.prototype.repaintAxisEndOverwriting = function () {
    var dom = this.dom,
        props = this.size.axis.properties,
        frame = this.dom.axis.frame,
        num;

    // remove leftovers
    var minorTexts = dom.axis.minorTexts;
    num = props.minorTextNum;
    while (minorTexts.length > num) {
        var minorText = minorTexts[num];
        frame.removeChild(minorText);
        minorTexts.splice(num, 1);
    }

    var minorLines = dom.axis.minorLines;
    num = props.minorLineNum;
    while (minorLines.length > num) {
        var minorLine = minorLines[num];
        frame.removeChild(minorLine);
        minorLines.splice(num, 1);
    }

    var majorTexts = dom.axis.majorTexts;
    num = props.majorTextNum;
    while (majorTexts.length > num) {
        var majorText = majorTexts[num];
        frame.removeChild(majorText);
        majorTexts.splice(num, 1);
    }

    var majorLines = dom.axis.majorLines;
    num = props.majorLineNum;
    while (majorLines.length > num) {
        var majorLine = majorLines[num];
        frame.removeChild(majorLine);
        majorLines.splice(num, 1);
    }
};

/**
 * Repaint the horizontal line and background of the axis
 */
links.Timeline.prototype.repaintAxisHorizontal = function() {
    var axis = this.dom.axis,
        size = this.size,
        options = this.options;

    // line behind all axis elements (possibly having a background color)
    var hasAxis = (options.showMinorLabels || options.showMajorLabels);
    if (hasAxis) {
        if (!axis.backgroundLine) {
            // create the axis line background (for a background color or so)
            var backgroundLine = document.createElement("DIV");
            backgroundLine.className = "timeline-axis";
            backgroundLine.style.position = "absolute";
            backgroundLine.style.left = "0px";
            backgroundLine.style.width = "100%";
            backgroundLine.style.border = "none";
            axis.frame.insertBefore(backgroundLine, axis.frame.firstChild);

            axis.backgroundLine = backgroundLine;
        }

        if (axis.backgroundLine) {
            axis.backgroundLine.style.top = size.axis.top + "px";
            axis.backgroundLine.style.height = size.axis.height + "px";
        }
    }
    else {
        if (axis.backgroundLine) {
            axis.frame.removeChild(axis.backgroundLine);
            delete axis.backgroundLine;
        }
    }

    // line before all axis elements
    if (hasAxis) {
        if (axis.line) {
            // put this line at the end of all childs
            var line = axis.frame.removeChild(axis.line);
            axis.frame.appendChild(line);
        }
        else {
            // make the axis line
            var line = document.createElement("DIV");
            line.className = "timeline-axis";
            line.style.position = "absolute";
            line.style.left = "0px";
            line.style.width = "100%";
            line.style.height = "0px";
            axis.frame.appendChild(line);

            axis.line = line;
        }

        axis.line.style.top = size.axis.line + "px";
    }
    else {
        if (axis.line && axis.line.parentElement) {
            axis.frame.removeChild(axis.line);
            delete axis.line;
        }
    }
};

/**
 * Create a minor label for the axis at position x
 * @param {Number} x
 * @param {String} text
 */
links.Timeline.prototype.repaintAxisMinorText = function (x, text) {
    var size = this.size,
        dom = this.dom,
        props = size.axis.properties,
        frame = dom.axis.frame,
        minorTexts = dom.axis.minorTexts,
        index = props.minorTextNum,
        label;

    if (index < minorTexts.length) {
        label = minorTexts[index]
    }
    else {
        // create new label
        var content = document.createTextNode("");
        label = document.createElement("DIV");
        label.appendChild(content);
        label.className = "timeline-axis-text timeline-axis-text-minor";
        label.style.position = "absolute";

        frame.appendChild(label);

        minorTexts.push(label);
    }

    label.childNodes[0].nodeValue = text;
    label.style.left = x + "px";
    label.style.top  = size.axis.labelMinorTop + "px";
    //label.title = title;  // TODO: this is a heavy operation

    props.minorTextNum++;
};

/**
 * Create a minor line for the axis at position x
 * @param {Number} x
 */
links.Timeline.prototype.repaintAxisMinorLine = function (x) {
    var axis = this.size.axis,
        dom = this.dom,
        props = axis.properties,
        frame = dom.axis.frame,
        minorLines = dom.axis.minorLines,
        index = props.minorLineNum,
        line;

    if (index < minorLines.length) {
        line = minorLines[index];
    }
    else {
        // create vertical line
        line = document.createElement("DIV");
        line.className = "timeline-axis-grid timeline-axis-grid-minor";
        line.style.position = "absolute";
        line.style.width = "0px";

        frame.appendChild(line);
        minorLines.push(line);
    }

    line.style.top = axis.lineMinorTop + "px";
    line.style.height = axis.lineMinorHeight + "px";
    line.style.left = (x - axis.lineMinorWidth/2) + "px";

    props.minorLineNum++;
};

/**
 * Create a Major label for the axis at position x
 * @param {Number} x
 * @param {String} text
 */
links.Timeline.prototype.repaintAxisMajorText = function (x, text) {
    var size = this.size,
        props = size.axis.properties,
        frame = this.dom.axis.frame,
        majorTexts = this.dom.axis.majorTexts,
        index = props.majorTextNum,
        label;

    if (index < majorTexts.length) {
        label = majorTexts[index];
    }
    else {
        // create label
        var content = document.createTextNode(text);
        label = document.createElement("DIV");
        label.className = "timeline-axis-text timeline-axis-text-major";
        label.appendChild(content);
        label.style.position = "absolute";
        label.style.top = "0px";

        frame.appendChild(label);
        majorTexts.push(label);
    }

    label.childNodes[0].nodeValue = text;
    label.style.top = size.axis.labelMajorTop + "px";
    label.style.left = x + "px";
    //label.title = title; // TODO: this is a heavy operation

    props.majorTextNum ++;
};

/**
 * Create a Major line for the axis at position x
 * @param {Number} x
 */
links.Timeline.prototype.repaintAxisMajorLine = function (x) {
    var size = this.size,
        props = size.axis.properties,
        axis = this.size.axis,
        frame = this.dom.axis.frame,
        majorLines = this.dom.axis.majorLines,
        index = props.majorLineNum,
        line;

    if (index < majorLines.length) {
        line = majorLines[index];
    }
    else {
        // create vertical line
        line = document.createElement("DIV");
        line.className = "timeline-axis-grid timeline-axis-grid-major";
        line.style.position = "absolute";
        line.style.top = "0px";
        line.style.width = "0px";

        frame.appendChild(line);
        majorLines.push(line);
    }

    line.style.left = (x - axis.lineMajorWidth/2) + "px";
    line.style.height = size.frameHeight + "px";

    props.majorLineNum ++;
};

/**
 * Reflow all items, retrieve their actual size
 * @return {boolean} resized    returns true if any of the items is resized
 */
links.Timeline.prototype.reflowItems = function() {
    var resized = false,
        i,
        iMax,
        group,
        groups = this.groups,
        renderedItems = this.renderedItems;

    if (groups) { // TODO: need to check if labels exists?
        // loop through all groups to reset the items height
        groups.forEach(function (group) {
            group.itemsHeight = 0;
        });
    }

    // loop through the width and height of all visible items
    for (i = 0, iMax = renderedItems.length; i < iMax; i++) {
        var item = renderedItems[i],
            domItem = item.dom;
        group = item.group;

        if (domItem) {
            // TODO: move updating width and height into item.reflow
            var width = domItem ? domItem.clientWidth : 0;
            var height = domItem ? domItem.clientHeight : 0;
            resized = resized || (item.width != width);
            resized = resized || (item.height != height);
            item.width = width;
            item.height = height;
            //item.borderWidth = (domItem.offsetWidth - domItem.clientWidth - 2) / 2; // TODO: borderWidth
            item.reflow();
        }

        if (group) {
            group.itemsHeight = group.itemsHeight ?
                Math.max(group.itemsHeight, item.height) :
                item.height;
        }
    }

    return resized;
};

/**
 * Recalculate item properties:
 * - the height of each group.
 * - the actualHeight, from the stacked items or the sum of the group heights
 * @return {boolean} resized    returns true if any of the items properties is
 *                              changed
 */
links.Timeline.prototype.recalcItems = function () {
    var resized = false,
        i,
        iMax,
        item,
        finalItem,
        finalItems,
        group,
        groups = this.groups,
        size = this.size,
        options = this.options,
        renderedItems = this.renderedItems;

    var actualHeight = 0;
    if (groups.length == 0) {
        // calculate actual height of the timeline when there are no groups
        // but stacked items
        if (options.autoHeight || options.cluster) {
            var min = 0,
                max = 0;

            if (this.stack && this.stack.finalItems) {
                // adjust the offset of all finalItems when the actualHeight has been changed
                finalItems = this.stack.finalItems;
                finalItem = finalItems[0];
                if (finalItem && finalItem.top) {
                    min = finalItem.top;
                    max = finalItem.top + finalItem.height;
                }
                for (i = 1, iMax = finalItems.length; i < iMax; i++) {
                    finalItem = finalItems[i];
                    min = Math.min(min, finalItem.top);
                    max = Math.max(max, finalItem.top + finalItem.height);
                }
            }
            else {
                item = renderedItems[0];
                if (item && item.top) {
                    min = item.top;
                    max = item.top + item.height;
                }
                for (i = 1, iMax = renderedItems.length; i < iMax; i++) {
                    item = renderedItems[i];
                    if (item.top) {
                        min = Math.min(min, item.top);
                        max = Math.max(max, (item.top + item.height));
                    }
                }
            }

            actualHeight = (max - min) + 2 * options.eventMarginAxis + size.axis.height;
            if (actualHeight < options.minHeight) {
                actualHeight = options.minHeight;
            }

            if (size.actualHeight != actualHeight && options.autoHeight && !options.axisOnTop) {
                // adjust the offset of all items when the actualHeight has been changed
                var diff = actualHeight - size.actualHeight;
                if (this.stack && this.stack.finalItems) {
                    finalItems = this.stack.finalItems;
                    for (i = 0, iMax = finalItems.length; i < iMax; i++) {
                        finalItems[i].top += diff;
                        finalItems[i].item.top += diff;
                    }
                }
                else {
                    for (i = 0, iMax = renderedItems.length; i < iMax; i++) {
                        renderedItems[i].top += diff;
                    }
                }
            }
        }
    }
    else {
        // loop through all groups to get the height of each group, and the
        // total height
        actualHeight = size.axis.height + 2 * options.eventMarginAxis;
        for (i = 0, iMax = groups.length; i < iMax; i++) {
            group = groups[i];

            var groupHeight = Math.max(group.labelHeight || 0, group.itemsHeight || 0);
            resized = resized || (groupHeight != group.height);
            group.height = groupHeight;

            actualHeight += groups[i].height + options.eventMargin;
        }

        // calculate top positions of the group labels and lines
        var eventMargin = options.eventMargin,
            top = options.axisOnTop ?
                options.eventMarginAxis + eventMargin/2 :
                size.contentHeight - options.eventMarginAxis + eventMargin/ 2,
            axisHeight = size.axis.height;

        for (i = 0, iMax = groups.length; i < iMax; i++) {
            group = groups[i];
            if (options.axisOnTop) {
                group.top = top + axisHeight;
                group.labelTop = top + axisHeight + (group.height - group.labelHeight) / 2;
                group.lineTop = top + axisHeight + group.height + eventMargin/2;
                top += group.height + eventMargin;
            }
            else {
                top -= group.height + eventMargin;
                group.top = top;
                group.labelTop = top + (group.height - group.labelHeight) / 2;
                group.lineTop = top - eventMargin/2;
            }
        }

        // calculate top position of the visible items
        for (i = 0, iMax = renderedItems.length; i < iMax; i++) {
            item = renderedItems[i];
            group = item.group;

            if (group) {
                item.top = group.top;
            }
        }

        resized = true;
    }

    if (actualHeight < options.minHeight) {
        actualHeight = options.minHeight;
    }
    resized = resized || (actualHeight != size.actualHeight);
    size.actualHeight = actualHeight;

    return resized;
};

/**
 * This method clears the (internal) array this.items in a safe way: neatly
 * cleaning up the DOM, and accompanying arrays this.renderedItems and
 * the created clusters.
 */
links.Timeline.prototype.clearItems = function() {
    // add all visible items to the list to be hidden
    var hideItems = this.renderQueue.hide;
    this.renderedItems.forEach(function (item) {
        hideItems.push(item);
    });

    // clear the cluster generator
    this.clusterGenerator.clear();

    // actually clear the items
    this.items = [];
};

/**
 * Repaint all items
 * @return {boolean} needsReflow   Returns true if the DOM is changed such that
 *                                 a reflow is needed.
 */
links.Timeline.prototype.repaintItems = function() {
    var i, iMax, item, index;

    var needsReflow = false,
        dom = this.dom,
        size = this.size,
        timeline = this,
        renderedItems = this.renderedItems;

    if (!dom.items) {
        dom.items = {};
    }

    // draw the frame containing the items
    var frame = dom.items.frame;
    if (!frame) {
        frame = document.createElement("DIV");
        frame.style.position = "relative";
        dom.content.appendChild(frame);
        dom.items.frame = frame;
    }

    frame.style.left = "0px";
    frame.style.top = size.items.top + "px";
    frame.style.height = "0px";

    // Take frame offline (for faster manipulation of the DOM)
    dom.content.removeChild(frame);

    // process the render queue with changes
    var queue = this.renderQueue;
    var newImageUrls = [];
    needsReflow = needsReflow ||
        (queue.show.length > 0) ||
        (queue.update.length > 0) ||
        (queue.hide.length > 0);   // TODO: reflow needed on hide of items?

    while (item = queue.show.shift()) {
        item.showDOM(frame,this.contentGenerator);
        item.getImageUrls(newImageUrls);
        renderedItems.push(item);
    }
    while (item = queue.update.shift()) {
        item.updateDOM(frame);
        item.getImageUrls(newImageUrls);
        index = this.renderedItems.indexOf(item);
        if (index == -1) {
            renderedItems.push(item);
        }
    }
    while (item = queue.hide.shift()) {
        item.hideDOM(frame);
        index = this.renderedItems.indexOf(item);
        if (index != -1) {
            renderedItems.splice(index, 1);
        }
    }

    // reposition all visible items
    renderedItems.forEach(function (item) {
        item.updatePosition(timeline);
    });

    // redraw the delete button and dragareas of the selected item (if any)
    this.repaintDeleteButton();
    this.repaintDragAreas();

    // put frame online again
    dom.content.appendChild(frame);

    if (newImageUrls.length) {
        // retrieve all image sources from the items, and set a callback once
        // all images are retrieved
        var callback = function () {
            timeline.render();
        };
        var sendCallbackWhenAlreadyLoaded = false;
        links.imageloader.loadAll(newImageUrls, callback, sendCallbackWhenAlreadyLoaded);
    }

    return needsReflow;
};

/**
 * Reflow the size of the groups
 * @return {boolean} resized    Returns true if any of the frame elements
 *                              have been resized.
 */
links.Timeline.prototype.reflowGroups = function() {
    var resized = false,
        options = this.options,
        size = this.size,
        dom = this.dom;

    // calculate the groups width and height
    // TODO: only update when data is changed! -> use an updateSeq
    var groupsWidth = 0;

    // loop through all groups to get the labels width and height
    var groups = this.groups;
    var labels = this.dom.groups ? this.dom.groups.labels : [];
    for (var i = 0, iMax = groups.length; i < iMax; i++) {
        var group = groups[i];
        var label = labels[i];
        group.labelWidth  = label ? label.clientWidth : 0;
        group.labelHeight = label ? label.clientHeight : 0;
        group.width = group.labelWidth;  // TODO: group.width is redundant with labelWidth

        groupsWidth = Math.max(groupsWidth, group.width);
    }

    // limit groupsWidth to the groups width in the options
    if (options.groupsWidth !== undefined) {
        groupsWidth = dom.groups.frame ? dom.groups.frame.clientWidth : 0;
    }

    // compensate for the border width. TODO: calculate the real border width
    groupsWidth += 1;

    var groupsLeft = options.groupsOnRight ? size.frameWidth - groupsWidth : 0;
    resized = resized || (size.groupsWidth !== groupsWidth);
    resized = resized || (size.groupsLeft !== groupsLeft);
    size.groupsWidth = groupsWidth;
    size.groupsLeft = groupsLeft;

    return resized;
};

/**
 * Redraw the group labels
 */
links.Timeline.prototype.repaintGroups = function() {
    var dom = this.dom,
        timeline = this,
        options = this.options,
        size = this.size,
        groups = this.groups;

    if (dom.groups === undefined) {
        dom.groups = {};
    }

    var labels = dom.groups.labels;
    if (!labels) {
        labels = [];
        dom.groups.labels = labels;
    }
    var labelLines = dom.groups.labelLines;
    if (!labelLines) {
        labelLines = [];
        dom.groups.labelLines = labelLines;
    }
    var itemLines = dom.groups.itemLines;
    if (!itemLines) {
        itemLines = [];
        dom.groups.itemLines = itemLines;
    }

    // create the frame for holding the groups
    var frame = dom.groups.frame;
    if (!frame) {
        frame =  document.createElement("DIV");
        frame.className = "timeline-groups-axis";
        frame.style.position = "absolute";
        frame.style.overflow = "hidden";
        frame.style.top = "0px";
        frame.style.height = "100%";

        dom.frame.appendChild(frame);
        dom.groups.frame = frame;
    }

    frame.style.left = size.groupsLeft + "px";
    frame.style.width = (options.groupsWidth !== undefined) ?
        options.groupsWidth :
        size.groupsWidth + "px";

    // hide groups axis when there are no groups
    if (groups.length == 0) {
        frame.style.display = 'none';
    }
    else {
        frame.style.display = '';
    }

    // TODO: only create/update groups when data is changed.

    // create the items
    var current = labels.length,
        needed = groups.length;

    // overwrite existing group labels
    for (var i = 0, iMax = Math.min(current, needed); i < iMax; i++) {
        var group = groups[i];
        var label = labels[i];
        label.innerHTML = this.getGroupName(group);
        label.style.display = '';
    }

    // append new items when needed
    for (var i = current; i < needed; i++) {
        var group = groups[i];

        // create text label
        var label = document.createElement("DIV");
        label.className = "timeline-groups-text";
        label.style.position = "absolute";
        if (options.groupsWidth === undefined) {
            label.style.whiteSpace = "nowrap";
        }
        label.innerHTML = this.getGroupName(group);
        frame.appendChild(label);
        labels[i] = label;

        // create the grid line between the group labels
        var labelLine = document.createElement("DIV");
        labelLine.className = "timeline-axis-grid timeline-axis-grid-minor";
        labelLine.style.position = "absolute";
        labelLine.style.left = "0px";
        labelLine.style.width = "100%";
        labelLine.style.height = "0px";
        labelLine.style.borderTopStyle = "solid";
        frame.appendChild(labelLine);
        labelLines[i] = labelLine;

        // create the grid line between the items
        var itemLine = document.createElement("DIV");
        itemLine.className = "timeline-axis-grid timeline-axis-grid-minor";
        itemLine.style.position = "absolute";
        itemLine.style.left = "0px";
        itemLine.style.width = "100%";
        itemLine.style.height = "0px";
        itemLine.style.borderTopStyle = "solid";
        dom.content.insertBefore(itemLine, dom.content.firstChild);
        itemLines[i] = itemLine;
    }

    // remove redundant items from the DOM when needed
    for (var i = needed; i < current; i++) {
        var label = labels[i],
            labelLine = labelLines[i],
            itemLine = itemLines[i];

        frame.removeChild(label);
        frame.removeChild(labelLine);
        dom.content.removeChild(itemLine);
    }
    labels.splice(needed, current - needed);
    labelLines.splice(needed, current - needed);
    itemLines.splice(needed, current - needed);

    frame.style.borderStyle = options.groupsOnRight ?
        "none none none solid" :
        "none solid none none";

    // position the groups
    for (var i = 0, iMax = groups.length; i < iMax; i++) {
        var group = groups[i],
            label = labels[i],
            labelLine = labelLines[i],
            itemLine = itemLines[i];

        label.style.top = group.labelTop + "px";
        labelLine.style.top = group.lineTop + "px";
        itemLine.style.top = group.lineTop + "px";
        itemLine.style.width = size.contentWidth + "px";
    }

    if (!dom.groups.background) {
        // create the axis grid line background
        var background = document.createElement("DIV");
        background.className = "timeline-axis";
        background.style.position = "absolute";
        background.style.left = "0px";
        background.style.width = "100%";
        background.style.border = "none";

        frame.appendChild(background);
        dom.groups.background = background;
    }
    dom.groups.background.style.top = size.axis.top + 'px';
    dom.groups.background.style.height = size.axis.height + 'px';

    if (!dom.groups.line) {
        // create the axis grid line
        var line = document.createElement("DIV");
        line.className = "timeline-axis";
        line.style.position = "absolute";
        line.style.left = "0px";
        line.style.width = "100%";
        line.style.height = "0px";

        frame.appendChild(line);
        dom.groups.line = line;
    }
    dom.groups.line.style.top = size.axis.line + 'px';

    // create a callback when there are images which are not yet loaded
    // TODO: more efficiently load images in the groups
    if (dom.groups.frame && groups.length) {
        var imageUrls = [];
        links.imageloader.filterImageUrls(dom.groups.frame, imageUrls);
        if (imageUrls.length) {
            // retrieve all image sources from the items, and set a callback once
            // all images are retrieved
            var callback = function () {
                timeline.render();
            };
            var sendCallbackWhenAlreadyLoaded = false;
            links.imageloader.loadAll(imageUrls, callback, sendCallbackWhenAlreadyLoaded);
        }
    }
};


/**
 * Redraw the current time bar
 */
links.Timeline.prototype.repaintCurrentTime = function() {
    var options = this.options,
        dom = this.dom,
        size = this.size;

    if (!options.showCurrentTime) {
        if (dom.currentTime) {
            dom.contentTimelines.removeChild(dom.currentTime);
            delete dom.currentTime;
        }

        return;
    }

    if (!dom.currentTime) {
        // create the current time bar
        var currentTime = document.createElement("DIV");
        currentTime.className = "timeline-currenttime";
        currentTime.style.position = "absolute";
        currentTime.style.top = "0px";
        currentTime.style.height = "100%";

        dom.contentTimelines.appendChild(currentTime);
        dom.currentTime = currentTime;
    }

    var now = new Date();
    var nowOffset = new Date(now.valueOf() + this.clientTimeOffset);
    var x = this.timeToScreen(nowOffset);

    var visible = (x > -size.contentWidth && x < 2 * size.contentWidth);
    dom.currentTime.style.display = visible ? '' : 'none';
    dom.currentTime.style.left = x + "px";
    dom.currentTime.title = "Current time: " + nowOffset;

    // start a timer to adjust for the new time
    if (this.currentTimeTimer != undefined) {
        clearTimeout(this.currentTimeTimer);
        delete this.currentTimeTimer;
    }
    var timeline = this;
    var onTimeout = function() {
        timeline.repaintCurrentTime();
    };
    // the time equal to the width of one pixel, divided by 2 for more smoothness
    var interval = 1 / this.conversion.factor / 2;
    if (interval < 30) interval = 30;
    this.currentTimeTimer = setTimeout(onTimeout, interval);
};

/**
 * Redraw the custom time bar
 */
links.Timeline.prototype.repaintCustomTime = function() {
    var options = this.options,
        dom = this.dom,
        size = this.size;

    if (!options.showCustomTime) {
        if (dom.customTime) {
            dom.contentTimelines.removeChild(dom.customTime);
            delete dom.customTime;
        }

        return;
    }

    if (!dom.customTime) {
        var customTime = document.createElement("DIV");
        customTime.className = "timeline-customtime";
        customTime.style.position = "absolute";
        customTime.style.top = "0px";
        customTime.style.height = "100%";

        var drag = document.createElement("DIV");
        drag.style.position = "relative";
        drag.style.top = "0px";
        drag.style.left = "-10px";
        drag.style.height = "100%";
        drag.style.width = "20px";
        customTime.appendChild(drag);

        dom.contentTimelines.appendChild(customTime);
        dom.customTime = customTime;

        // initialize parameter
        this.customTime = new Date();
    }

    var x = this.timeToScreen(this.customTime),
        visible = (x > -size.contentWidth && x < 2 * size.contentWidth);
    dom.customTime.style.display = visible ? '' : 'none';
    dom.customTime.style.left = x + "px";
    dom.customTime.title = "Time: " + this.customTime;
};


/**
 * Redraw the delete button, on the top right of the currently selected item
 * if there is no item selected, the button is hidden.
 */
links.Timeline.prototype.repaintDeleteButton = function () {
    var timeline = this,
        dom = this.dom,
        frame = dom.items.frame;

    var deleteButton = dom.items.deleteButton;
    if (!deleteButton) {
        // create a delete button
        deleteButton = document.createElement("DIV");
        deleteButton.className = "timeline-navigation-delete";
        deleteButton.style.position = "absolute";

        frame.appendChild(deleteButton);
        dom.items.deleteButton = deleteButton;
    }

    var index = this.selection ? this.selection.index : -1,
        item = this.selection ? this.items[index] : undefined;
    if (item && item.rendered && this.isEditable(item)) {
        var right = item.getRight(this),
            top = item.top;

        deleteButton.style.left = right + 'px';
        deleteButton.style.top = top + 'px';
        deleteButton.style.display = '';
        frame.removeChild(deleteButton);
        frame.appendChild(deleteButton);
    }
    else {
        deleteButton.style.display = 'none';
    }
};


/**
 * Redraw the drag areas. When an item (ranges only) is selected,
 * it gets a drag area on the left and right side, to change its width
 */
links.Timeline.prototype.repaintDragAreas = function () {
    var timeline = this,
        options = this.options,
        dom = this.dom,
        frame = this.dom.items.frame;

    // create left drag area
    var dragLeft = dom.items.dragLeft;
    if (!dragLeft) {
        dragLeft = document.createElement("DIV");
        dragLeft.className="timeline-event-range-drag-left";
        dragLeft.style.position = "absolute";

        frame.appendChild(dragLeft);
        dom.items.dragLeft = dragLeft;
    }

    // create right drag area
    var dragRight = dom.items.dragRight;
    if (!dragRight) {
        dragRight = document.createElement("DIV");
        dragRight.className="timeline-event-range-drag-right";
        dragRight.style.position = "absolute";

        frame.appendChild(dragRight);
        dom.items.dragRight = dragRight;
    }

    // reposition left and right drag area
    var index = this.selection ? this.selection.index : -1,
        item = this.selection ? this.items[index] : undefined;
    if (item && item.rendered && this.isEditable(item) &&
        (item instanceof links.Timeline.ItemRange)) {
        var left = this.timeToScreen(item.start),
            right = this.timeToScreen(item.end),
            top = item.top,
            height = item.height;

        dragLeft.style.left = left + 'px';
        dragLeft.style.top = top + 'px';
        dragLeft.style.width = options.dragAreaWidth + "px";
        dragLeft.style.height = height + 'px';
        dragLeft.style.display = '';
        frame.removeChild(dragLeft);
        frame.appendChild(dragLeft);

        dragRight.style.left = (right - options.dragAreaWidth) + 'px';
        dragRight.style.top = top + 'px';
        dragRight.style.width = options.dragAreaWidth + "px";
        dragRight.style.height = height + 'px';
        dragRight.style.display = '';
        frame.removeChild(dragRight);
        frame.appendChild(dragRight);
    }
    else {
        dragLeft.style.display = 'none';
        dragRight.style.display = 'none';
    }
};

/**
 * Create the navigation buttons for zooming and moving
 */
links.Timeline.prototype.repaintNavigation = function () {
    var timeline = this,
        options = this.options,
        dom = this.dom,
        frame = dom.frame,
        navBar = dom.navBar;

    if (!navBar) {
        var showButtonNew = options.showButtonNew && options.editable;
        var showNavigation = options.showNavigation && (options.zoomable || options.moveable);
        if (showNavigation || showButtonNew) {
            // create a navigation bar containing the navigation buttons
            navBar = document.createElement("DIV");
            navBar.style.position = "absolute";
            navBar.className = "timeline-navigation";
            if (options.groupsOnRight) {
                navBar.style.left = '10px';
            }
            else {
                navBar.style.right = '10px';
            }
            if (options.axisOnTop) {
                navBar.style.bottom = '10px';
            }
            else {
                navBar.style.top = '10px';
            }
            dom.navBar = navBar;
            frame.appendChild(navBar);
        }

        if (showButtonNew) {
            // create a new in button
            navBar.addButton = document.createElement("DIV");
            navBar.addButton.className = "timeline-navigation-new";

            navBar.addButton.title = options.CREATE_NEW_EVENT;
            var onAdd = function(event) {
                links.Timeline.preventDefault(event);
                links.Timeline.stopPropagation(event);

                // create a new event at the center of the frame
                var w = timeline.size.contentWidth;
                var x = w / 2;
                var xstart = timeline.screenToTime(x - w / 10); // subtract 10% of timeline width
                var xend = timeline.screenToTime(x + w / 10);   // add 10% of timeline width
                if (options.snapEvents) {
                    timeline.step.snap(xstart);
                    timeline.step.snap(xend);
                }

                var content = options.NEW;
                var group = timeline.groups.length ? timeline.groups[0].content : undefined;
                var preventRender = true;
                timeline.addItem({
                    'start': xstart,
                    'end': xend,
                    'content': content,
                    'group': group
                }, preventRender);
                var index = (timeline.items.length - 1);
                timeline.selectItem(index);

                timeline.applyAdd = true;

                // fire an add event.
                // Note that the change can be canceled from within an event listener if
                // this listener calls the method cancelAdd().
                timeline.trigger('add');

                if (timeline.applyAdd) {
                    // render and select the item
                    timeline.render({animate: false});
                    timeline.selectItem(index);
                }
                else {
                    // undo an add
                    timeline.deleteItem(index);
                }
            };
            links.Timeline.addEventListener(navBar.addButton, "mousedown", onAdd);
            navBar.appendChild(navBar.addButton);
        }

        if (showButtonNew && showNavigation) {
            // create a separator line
            navBar.addButton.style.borderRightWidth = "1px";
            navBar.addButton.style.borderRightStyle = "solid";
        }

        if (showNavigation) {
            if (options.zoomable) {
                // create a zoom in button
                navBar.zoomInButton = document.createElement("DIV");
                navBar.zoomInButton.className = "timeline-navigation-zoom-in";
                navBar.zoomInButton.title = this.options.ZOOM_IN;
                var onZoomIn = function(event) {
                    links.Timeline.preventDefault(event);
                    links.Timeline.stopPropagation(event);
                    timeline.zoom(0.4);
                    timeline.trigger("rangechange");
                    timeline.trigger("rangechanged");
                };
                links.Timeline.addEventListener(navBar.zoomInButton, "mousedown", onZoomIn);
                navBar.appendChild(navBar.zoomInButton);

                // create a zoom out button
                navBar.zoomOutButton = document.createElement("DIV");
                navBar.zoomOutButton.className = "timeline-navigation-zoom-out";
                navBar.zoomOutButton.title = this.options.ZOOM_OUT;
                var onZoomOut = function(event) {
                    links.Timeline.preventDefault(event);
                    links.Timeline.stopPropagation(event);
                    timeline.zoom(-0.4);
                    timeline.trigger("rangechange");
                    timeline.trigger("rangechanged");
                };
                links.Timeline.addEventListener(navBar.zoomOutButton, "mousedown", onZoomOut);
                navBar.appendChild(navBar.zoomOutButton);
            }

            if (options.moveable) {
                // create a move left button
                navBar.moveLeftButton = document.createElement("DIV");
                navBar.moveLeftButton.className = "timeline-navigation-move-left";
                navBar.moveLeftButton.title = this.options.MOVE_LEFT;
                var onMoveLeft = function(event) {
                    links.Timeline.preventDefault(event);
                    links.Timeline.stopPropagation(event);
                    timeline.move(-0.2);
                    timeline.trigger("rangechange");
                    timeline.trigger("rangechanged");
                };
                links.Timeline.addEventListener(navBar.moveLeftButton, "mousedown", onMoveLeft);
                navBar.appendChild(navBar.moveLeftButton);

                // create a move right button
                navBar.moveRightButton = document.createElement("DIV");
                navBar.moveRightButton.className = "timeline-navigation-move-right";
                navBar.moveRightButton.title = this.options.MOVE_RIGHT;
                var onMoveRight = function(event) {
                    links.Timeline.preventDefault(event);
                    links.Timeline.stopPropagation(event);
                    timeline.move(0.2);
                    timeline.trigger("rangechange");
                    timeline.trigger("rangechanged");
                };
                links.Timeline.addEventListener(navBar.moveRightButton, "mousedown", onMoveRight);
                navBar.appendChild(navBar.moveRightButton);
            }
        }
    }
};


/**
 * Set current time. This function can be used to set the time in the client
 * timeline equal with the time on a server.
 * @param {Date} time
 */
links.Timeline.prototype.setCurrentTime = function(time) {
    var now = new Date();
    this.clientTimeOffset = (time.valueOf() - now.valueOf());

    this.repaintCurrentTime();
};

/**
 * Get current time. The time can have an offset from the real time, when
 * the current time has been changed via the method setCurrentTime.
 * @return {Date} time
 */
links.Timeline.prototype.getCurrentTime = function() {
    var now = new Date();
    return new Date(now.valueOf() + this.clientTimeOffset);
};


/**
 * Set custom time.
 * The custom time bar can be used to display events in past or future.
 * @param {Date} time
 */
links.Timeline.prototype.setCustomTime = function(time) {
    this.customTime = new Date(time.valueOf());
    this.repaintCustomTime();
};

/**
 * Retrieve the current custom time.
 * @return {Date} customTime
 */
links.Timeline.prototype.getCustomTime = function() {
    return new Date(this.customTime.valueOf());
};

/**
 * Set a custom scale. Autoscaling will be disabled.
 * For example setScale(SCALE.MINUTES, 5) will result
 * in minor steps of 5 minutes, and major steps of an hour.
 *
 * @param {links.Timeline.StepDate.SCALE} scale
 *                               A scale. Choose from SCALE.MILLISECOND,
 *                               SCALE.SECOND, SCALE.MINUTE, SCALE.HOUR,
 *                               SCALE.WEEKDAY, SCALE.DAY, SCALE.MONTH,
 *                               SCALE.YEAR.
 * @param {int}        step   A step size, by default 1. Choose for
 *                               example 1, 2, 5, or 10.
 */
links.Timeline.prototype.setScale = function(scale, step) {
    this.step.setScale(scale, step);
    this.render(); // TODO: optimize: only reflow/repaint axis
};

/**
 * Enable or disable autoscaling
 * @param {boolean} enable  If true or not defined, autoscaling is enabled.
 *                          If false, autoscaling is disabled.
 */
links.Timeline.prototype.setAutoScale = function(enable) {
    this.step.setAutoScale(enable);
    this.render(); // TODO: optimize: only reflow/repaint axis
};

/**
 * Redraw the timeline
 * Reloads the (linked) data table and redraws the timeline when resized.
 * See also the method checkResize
 */
links.Timeline.prototype.redraw = function() {
    this.setData(this.data);
};


/**
 * Check if the timeline is resized, and if so, redraw the timeline.
 * Useful when the webpage is resized.
 */
links.Timeline.prototype.checkResize = function() {
    // TODO: re-implement the method checkResize, or better, make it redundant as this.render will be smarter
    this.render();
};

/**
 * Check whether a given item is editable
 * @param {links.Timeline.Item} item
 * @return {boolean} editable
 */
links.Timeline.prototype.isEditable = function (item) {
    if (item) {
        if (item.editable != undefined) {
            return item.editable;
        }
        else {
            return this.options.editable;
        }
    }
    return false;
};

/**
 * Calculate the factor and offset to convert a position on screen to the
 * corresponding date and vice versa.
 * After the method calcConversionFactor is executed once, the methods screenToTime and
 * timeToScreen can be used.
 */
links.Timeline.prototype.recalcConversion = function() {
    this.conversion.offset = this.start.valueOf();
    this.conversion.factor = this.size.contentWidth /
        (this.end.valueOf() - this.start.valueOf());
};


/**
 * Convert a position on screen (pixels) to a datetime
 * Before this method can be used, the method calcConversionFactor must be
 * executed once.
 * @param {int}     x    Position on the screen in pixels
 * @return {Date}   time The datetime the corresponds with given position x
 */
links.Timeline.prototype.screenToTime = function(x) {
    var conversion = this.conversion;
    return new Date(x / conversion.factor + conversion.offset);
};

/**
 * Convert a datetime (Date object) into a position on the screen
 * Before this method can be used, the method calcConversionFactor must be
 * executed once.
 * @param {Date}   time A date
 * @return {int}   x    The position on the screen in pixels which corresponds
 *                      with the given date.
 */
links.Timeline.prototype.timeToScreen = function(time) {
    var conversion = this.conversion;
    return (time.valueOf() - conversion.offset) * conversion.factor;
};



/**
 * Event handler for touchstart event on mobile devices
 */
links.Timeline.prototype.onTouchStart = function(event) {
    var params = this.eventParams,
        me = this;

    if (params.touchDown) {
        // if already moving, return
        return;
    }

    params.touchDown = true;
    params.zoomed = false;

    this.onMouseDown(event);

    if (!params.onTouchMove) {
        params.onTouchMove = function (event) {me.onTouchMove(event);};
        links.Timeline.addEventListener(document, "touchmove", params.onTouchMove);
    }
    if (!params.onTouchEnd) {
        params.onTouchEnd  = function (event) {me.onTouchEnd(event);};
        links.Timeline.addEventListener(document, "touchend",  params.onTouchEnd);
    }

    /* TODO
     // check for double tap event
     var delta = 500; // ms
     var doubleTapStart = (new Date()).valueOf();
     var target = links.Timeline.getTarget(event);
     var doubleTapItem = this.getItemIndex(target);
     if (params.doubleTapStart &&
     (doubleTapStart - params.doubleTapStart) < delta &&
     doubleTapItem == params.doubleTapItem) {
     delete params.doubleTapStart;
     delete params.doubleTapItem;
     me.onDblClick(event);
     params.touchDown = false;
     }
     params.doubleTapStart = doubleTapStart;
     params.doubleTapItem = doubleTapItem;
     */
    // store timing for double taps
    var target = links.Timeline.getTarget(event);
    var item = this.getItemIndex(target);
    params.doubleTapStartPrev = params.doubleTapStart;
    params.doubleTapStart = (new Date()).valueOf();
    params.doubleTapItemPrev = params.doubleTapItem;
    params.doubleTapItem = item;

    links.Timeline.preventDefault(event);
};

/**
 * Event handler for touchmove event on mobile devices
 */
links.Timeline.prototype.onTouchMove = function(event) {
    var params = this.eventParams;

    if (event.scale && event.scale !== 1) {
        params.zoomed = true;
    }

    if (!params.zoomed) {
        // move 
        this.onMouseMove(event);
    }
    else {
        if (this.options.zoomable) {
            // pinch
            // TODO: pinch only supported on iPhone/iPad. Create something manually for Android?
            params.zoomed = true;

            var scale = event.scale,
                oldWidth = (params.end.valueOf() - params.start.valueOf()),
                newWidth = oldWidth / scale,
                diff = newWidth - oldWidth,
                start = new Date(parseInt(params.start.valueOf() - diff/2)),
                end = new Date(parseInt(params.end.valueOf() + diff/2));

            // TODO: determine zoom-around-date from touch positions?

            this.setVisibleChartRange(start, end);
            this.trigger("rangechange");
        }
    }

    links.Timeline.preventDefault(event);
};

/**
 * Event handler for touchend event on mobile devices
 */
links.Timeline.prototype.onTouchEnd = function(event) {
    var params = this.eventParams;
    var me = this;
    params.touchDown = false;

    if (params.zoomed) {
        this.trigger("rangechanged");
    }

    if (params.onTouchMove) {
        links.Timeline.removeEventListener(document, "touchmove", params.onTouchMove);
        delete params.onTouchMove;

    }
    if (params.onTouchEnd) {
        links.Timeline.removeEventListener(document, "touchend",  params.onTouchEnd);
        delete params.onTouchEnd;
    }

    this.onMouseUp(event);

    // check for double tap event
    var delta = 500; // ms
    var doubleTapEnd = (new Date()).valueOf();
    var target = links.Timeline.getTarget(event);
    var doubleTapItem = this.getItemIndex(target);
    if (params.doubleTapStartPrev &&
        (doubleTapEnd - params.doubleTapStartPrev) < delta &&
        params.doubleTapItem == params.doubleTapItemPrev) {
        params.touchDown = true;
        me.onDblClick(event);
        params.touchDown = false;
    }

    links.Timeline.preventDefault(event);
};


/**
 * Start a moving operation inside the provided parent element
 * @param {Event} event       The event that occurred (required for
 *                             retrieving the  mouse position)
 */
links.Timeline.prototype.onMouseDown = function(event) {
    event = event || window.event;

    var params = this.eventParams,
        options = this.options,
        dom = this.dom;

    // only react on left mouse button down
    var leftButtonDown = event.which ? (event.which == 1) : (event.button == 1);
    if (!leftButtonDown && !params.touchDown) {
        return;
    }

    // get mouse position
    params.mouseX = links.Timeline.getPageX(event);
    params.mouseY = links.Timeline.getPageY(event);
    params.frameLeft = links.Timeline.getAbsoluteLeft(this.dom.content);
    params.frameTop = links.Timeline.getAbsoluteTop(this.dom.content);
    params.previousLeft = 0;
    params.previousOffset = 0;

    params.moved = false;
    params.start = new Date(this.start.valueOf());
    params.end = new Date(this.end.valueOf());

    params.target = links.Timeline.getTarget(event);
    var dragLeft = (dom.items && dom.items.dragLeft) ? dom.items.dragLeft : undefined;
    var dragRight = (dom.items && dom.items.dragRight) ? dom.items.dragRight : undefined;
    params.itemDragLeft = (params.target === dragLeft);
    params.itemDragRight = (params.target === dragRight);

    if (params.itemDragLeft || params.itemDragRight) {
        params.itemIndex = this.selection ? this.selection.index : undefined;
    }
    else {
        params.itemIndex = this.getItemIndex(params.target);
    }

    params.customTime = (params.target === dom.customTime ||
        params.target.parentNode === dom.customTime) ?
        this.customTime :
        undefined;

    params.addItem = (options.editable && event.ctrlKey);
    if (params.addItem) {
        // create a new event at the current mouse position
        var x = params.mouseX - params.frameLeft;
        var y = params.mouseY - params.frameTop;

        var xstart = this.screenToTime(x);
        if (options.snapEvents) {
            this.step.snap(xstart);
        }
        var xend = new Date(xstart.valueOf());
        var content = options.NEW;
        var group = this.getGroupFromHeight(y);
        this.addItem({
            'start': xstart,
            'end': xend,
            'content': content,
            'group': this.getGroupName(group)
        });
        params.itemIndex = (this.items.length - 1);
        this.selectItem(params.itemIndex);
        params.itemDragRight = true;
    }

    var item = this.items[params.itemIndex];
    var isSelected = this.isSelected(params.itemIndex);
    params.editItem = isSelected && this.isEditable(item);
    if (params.editItem) {
        params.itemStart = item.start;
        params.itemEnd = item.end;
        params.itemGroup = item.group;
        params.itemLeft = item.start ? this.timeToScreen(item.start) : undefined;
        params.itemRight = item.end ? this.timeToScreen(item.end) : undefined;
    }
    else {
        this.dom.frame.style.cursor = 'move';
    }
    if (!params.touchDown) {
        // add event listeners to handle moving the contents
        // we store the function onmousemove and onmouseup in the timeline, so we can
        // remove the eventlisteners lateron in the function mouseUp()
        var me = this;
        if (!params.onMouseMove) {
            params.onMouseMove = function (event) {me.onMouseMove(event);};
            links.Timeline.addEventListener(document, "mousemove", params.onMouseMove);
        }
        if (!params.onMouseUp) {
            params.onMouseUp = function (event) {me.onMouseUp(event);};
            links.Timeline.addEventListener(document, "mouseup", params.onMouseUp);
        }

        links.Timeline.preventDefault(event);
    }
};


/**
 * Perform moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown().
 * @param {Event}   event  Well, eehh, the event
 */
links.Timeline.prototype.onMouseMove = function (event) {
    event = event || window.event;

    var params = this.eventParams,
        size = this.size,
        dom = this.dom,
        options = this.options;

    // calculate change in mouse position
    var mouseX = links.Timeline.getPageX(event);
    var mouseY = links.Timeline.getPageY(event);

    if (params.mouseX == undefined) {
        params.mouseX = mouseX;
    }
    if (params.mouseY == undefined) {
        params.mouseY = mouseY;
    }

    var diffX = mouseX - params.mouseX;
    var diffY = mouseY - params.mouseY;

    // if mouse movement is big enough, register it as a "moved" event
    if (Math.abs(diffX) >= 1) {
        params.moved = true;
    }

    if (params.customTime) {
        var x = this.timeToScreen(params.customTime);
        var xnew = x + diffX;
        this.customTime = this.screenToTime(xnew);
        this.repaintCustomTime();

        // fire a timechange event
        this.trigger('timechange');
    }
    else if (params.editItem) {
        var item = this.items[params.itemIndex],
            left,
            right;

        if (params.itemDragLeft) {
            // move the start of the item
            left = params.itemLeft + diffX;
            right = params.itemRight;

            item.start = this.screenToTime(left);
            if (options.snapEvents) {
                this.step.snap(item.start);
                left = this.timeToScreen(item.start);
            }

            if (left > right) {
                left = right;
                item.start = this.screenToTime(left);
            }
        }
        else if (params.itemDragRight) {
            // move the end of the item
            left = params.itemLeft;
            right = params.itemRight + diffX;

            item.end = this.screenToTime(right);
            if (options.snapEvents) {
                this.step.snap(item.end);
                right = this.timeToScreen(item.end);
            }

            if (right < left) {
                right = left;
                item.end = this.screenToTime(right);
            }
        }
        else {
            // move the item
            left = params.itemLeft + diffX;
            item.start = this.screenToTime(left);
            if (options.snapEvents) {
                this.step.snap(item.start);
                left = this.timeToScreen(item.start);
            }

            if (item.end) {
                right = left + (params.itemRight - params.itemLeft);
                item.end = this.screenToTime(right);
            }
        }

        item.setPosition(left, right);

        var dragging = params.itemDragLeft || params.itemDragRight;
        if (this.groups.length && !dragging) {
            // move item from one group to another when needed
            var y = mouseY - params.frameTop;
            var group = this.getGroupFromHeight(y);
            if (options.groupsChangeable && item.group !== group) {
                // move item to the other group
                var index = this.items.indexOf(item);
                this.changeItem(index, {'group': this.getGroupName(group)});
            }
            else {
                this.repaintDeleteButton();
                this.repaintDragAreas();
            }
        }
        else {
            // TODO: does not work well in FF, forces redraw with every mouse move it seems
            this.render(); // TODO: optimize, only redraw the items?
            // Note: when animate==true, no redraw is needed here, its done by stackItems animation
        }
    }
    else if (options.moveable) {
        var interval = (params.end.valueOf() - params.start.valueOf());
        var diffMillisecs = Math.round((-diffX) / size.contentWidth * interval);
        var newStart = new Date(params.start.valueOf() + diffMillisecs);
        var newEnd = new Date(params.end.valueOf() + diffMillisecs);
        this.applyRange(newStart, newEnd);
        // if the applied range is moved due to a fixed min or max,
        // change the diffMillisecs accordingly
        var appliedDiff = (this.start.valueOf() - newStart.valueOf());
        if (appliedDiff) {
            diffMillisecs += appliedDiff;
        }

        this.recalcConversion();

        // move the items by changing the left position of their frame.
        // this is much faster than repositioning all elements individually via the 
        // repaintFrame() function (which is done once at mouseup)
        // note that we round diffX to prevent wrong positioning on millisecond scale
        var previousLeft = params.previousLeft || 0;
        var currentLeft = parseFloat(dom.items.frame.style.left) || 0;
        var previousOffset = params.previousOffset || 0;
        var frameOffset = previousOffset + (currentLeft - previousLeft);
        var frameLeft = -diffMillisecs / interval * size.contentWidth + frameOffset;

        dom.items.frame.style.left = (frameLeft) + "px";

        // read the left again from DOM (IE8- rounds the value)
        params.previousOffset = frameOffset;
        params.previousLeft = parseFloat(dom.items.frame.style.left) || frameLeft;

        this.repaintCurrentTime();
        this.repaintCustomTime();
        this.repaintAxis();

        // fire a rangechange event
        this.trigger('rangechange');
    }

    links.Timeline.preventDefault(event);
};


/**
 * Stop moving operating.
 * This function activated from within the funcion links.Timeline.onMouseDown().
 * @param {event}  event   The event
 */
links.Timeline.prototype.onMouseUp = function (event) {
    var params = this.eventParams,
        options = this.options;

    event = event || window.event;

    this.dom.frame.style.cursor = 'auto';

    // remove event listeners here, important for Safari
    if (params.onMouseMove) {
        links.Timeline.removeEventListener(document, "mousemove", params.onMouseMove);
        delete params.onMouseMove;
    }
    if (params.onMouseUp) {
        links.Timeline.removeEventListener(document, "mouseup",   params.onMouseUp);
        delete params.onMouseUp;
    }
    //links.Timeline.preventDefault(event);

    if (params.customTime) {
        // fire a timechanged event
        this.trigger('timechanged');
    }
    else if (params.editItem) {
        var item = this.items[params.itemIndex];

        if (params.moved || params.addItem) {
            this.applyChange = true;
            this.applyAdd = true;

            this.updateData(params.itemIndex, {
                'start': item.start,
                'end': item.end
            });

            // fire an add or change event. 
            // Note that the change can be canceled from within an event listener if 
            // this listener calls the method cancelChange().
            this.trigger(params.addItem ? 'add' : 'change');

            if (params.addItem) {
                if (this.applyAdd) {
                    this.updateData(params.itemIndex, {
                        'start': item.start,
                        'end': item.end,
                        'content': item.content,
                        'group': this.getGroupName(item.group)
                    });
                }
                else {
                    // undo an add
                    this.deleteItem(params.itemIndex);
                }
            }
            else {
                if (this.applyChange) {
                    this.updateData(params.itemIndex, {
                        'start': item.start,
                        'end': item.end
                    });
                }
                else {
                    // undo a change
                    delete this.applyChange;
                    delete this.applyAdd;

                    var item = this.items[params.itemIndex],
                        domItem = item.dom;

                    item.start = params.itemStart;
                    item.end = params.itemEnd;
                    item.group = params.itemGroup;
                    // TODO: original group should be restored too
                    item.setPosition(params.itemLeft, params.itemRight);
                }
            }

            // prepare data for clustering, by filtering and sorting by type
            if (this.options.cluster) {
                this.clusterGenerator.updateData();
            }

            this.render();
        }
    }
    else {
        if (!params.moved && !params.zoomed) {
            // mouse did not move -> user has selected an item

            if (params.target === this.dom.items.deleteButton) {
                // delete item
                if (this.selection) {
                    this.confirmDeleteItem(this.selection.index);
                }
            }
            else if (options.selectable) {
                // select/unselect item
                if (params.itemIndex != undefined) {
                    if (!this.isSelected(params.itemIndex)) {
                        this.selectItem(params.itemIndex);
                        this.trigger('select',params);       
                    } else {
                        this.unselectItem(params.itemIndex);
                    }
                } 
            }
        }
        else {
            // timeline is moved
            // TODO: optimize: no need to reflow and cluster again?
            this.render();

            if ((params.moved && options.moveable) || (params.zoomed && options.zoomable) ) {
                // fire a rangechanged event
                this.trigger('rangechanged');
            }
        }
    }
};

/**
 * Double click event occurred for an item
 * @param {Event}  event
 */
links.Timeline.prototype.onDblClick = function (event) {
    var params = this.eventParams,
        options = this.options,
        dom = this.dom,
        size = this.size;
    event = event || window.event;

    if (params.itemIndex != undefined) {
        var item = this.items[params.itemIndex];
        if (item && this.isEditable(item)) {
            // fire the edit event
            this.trigger('edit');
        }
    }
    else {
        if (options.editable) {
            // create a new item

            // get mouse position
            params.mouseX = links.Timeline.getPageX(event);
            params.mouseY = links.Timeline.getPageY(event);
            var x = params.mouseX - links.Timeline.getAbsoluteLeft(dom.content);
            var y = params.mouseY - links.Timeline.getAbsoluteTop(dom.content);

            // create a new event at the current mouse position
            var xstart = this.screenToTime(x);
            var xend = this.screenToTime(x  + size.frameWidth / 10); // add 10% of timeline width
            if (options.snapEvents) {
                this.step.snap(xstart);
                this.step.snap(xend);
            }

            var content = options.NEW;
            var group = this.getGroupFromHeight(y);   // (group may be undefined)
            var preventRender = true;
            this.addItem({
                'start': xstart,
                'end': xend,
                'content': content,
                'group': this.getGroupName(group)
            }, preventRender);
            params.itemIndex = (this.items.length - 1);
            this.selectItem(params.itemIndex);

            this.applyAdd = true;

            // fire an add event.
            // Note that the change can be canceled from within an event listener if
            // this listener calls the method cancelAdd().
            this.trigger('add');

            if (this.applyAdd) {
                // render and select the item
                this.render({animate: false});
                this.selectItem(params.itemIndex);
            }
            else {
                // undo an add
                this.deleteItem(params.itemIndex);
            }
        }
    }

    links.Timeline.preventDefault(event);
};


/**
 * Event handler for mouse wheel event, used to zoom the timeline
 * Code from http://adomas.org/javascript-mouse-wheel/
 * @param {Event}  event   The event
 */
links.Timeline.prototype.onMouseWheel = function(event) {
    if (!this.options.zoomable)
        return;

    if (!event) { /* For IE. */
        event = window.event;
    }

    // retrieve delta    
    var delta = 0;
    if (event.wheelDelta) { /* IE/Opera. */
        delta = event.wheelDelta/120;
    } else if (event.detail) { /* Mozilla case. */
        // In Mozilla, sign of delta is different than in IE.
        // Also, delta is multiple of 3.
        delta = -event.detail/3;
    }

    // If delta is nonzero, handle it.
    // Basically, delta is now positive if wheel was scrolled up,
    // and negative, if wheel was scrolled down.
    if (delta) {
        // TODO: on FireFox, the window is not redrawn within repeated scroll-events 
        // -> use a delayed redraw? Make a zoom queue?

        var timeline = this;
        var zoom = function () {
            // perform the zoom action. Delta is normally 1 or -1
            var zoomFactor = delta / 5.0;
            var frameLeft = links.Timeline.getAbsoluteLeft(timeline.dom.content);
            var mouseX = links.Timeline.getPageX(event);
            var zoomAroundDate =
                (mouseX != undefined && frameLeft != undefined) ?
                    timeline.screenToTime(mouseX - frameLeft) :
                    undefined;

            timeline.zoom(zoomFactor, zoomAroundDate);

            // fire a rangechange and a rangechanged event
            timeline.trigger("rangechange");
            timeline.trigger("rangechanged");
        };

        zoom();
    }

    // Prevent default actions caused by mouse wheel.
    // That might be ugly, but we handle scrolls somehow
    // anyway, so don't bother here...
    links.Timeline.preventDefault(event);
};


/**
 * Zoom the timeline the given zoomfactor in or out. Start and end date will
 * be adjusted, and the timeline will be redrawn. You can optionally give a
 * date around which to zoom.
 * For example, try zoomfactor = 0.1 or -0.1
 * @param {Number} zoomFactor      Zooming amount. Positive value will zoom in,
 *                                 negative value will zoom out
 * @param {Date}   zoomAroundDate  Date around which will be zoomed. Optional
 */
links.Timeline.prototype.zoom = function(zoomFactor, zoomAroundDate) {
    // if zoomAroundDate is not provided, take it half between start Date and end Date
    if (zoomAroundDate == undefined) {
        zoomAroundDate = new Date((this.start.valueOf() + this.end.valueOf()) / 2);
    }

    // prevent zoom factor larger than 1 or smaller than -1 (larger than 1 will
    // result in a start>=end )
    if (zoomFactor >= 1) {
        zoomFactor = 0.9;
    }
    if (zoomFactor <= -1) {
        zoomFactor = -0.9;
    }

    // adjust a negative factor such that zooming in with 0.1 equals zooming
    // out with a factor -0.1
    if (zoomFactor < 0) {
        zoomFactor = zoomFactor / (1 + zoomFactor);
    }

    // zoom start Date and end Date relative to the zoomAroundDate
    var startDiff = (this.start.valueOf() - zoomAroundDate);
    var endDiff = (this.end.valueOf() - zoomAroundDate);

    // calculate new dates
    var newStart = new Date(this.start.valueOf() - startDiff * zoomFactor);
    var newEnd   = new Date(this.end.valueOf() - endDiff * zoomFactor);

    // only zoom in when interval is larger than minimum interval (to prevent
    // sliding to left/right when having reached the minimum zoom level)
    var interval = (newEnd.valueOf() - newStart.valueOf());
    var zoomMin = Number(this.options.zoomMin) || 10;
    if (zoomMin < 10) {
        zoomMin = 10;
    }
    if (interval >= zoomMin) {
        this.applyRange(newStart, newEnd, zoomAroundDate);
        this.render({
            animate: this.options.animate && this.options.animateZoom
        });
    }
};

/**
 * Move the timeline the given movefactor to the left or right. Start and end
 * date will be adjusted, and the timeline will be redrawn.
 * For example, try moveFactor = 0.1 or -0.1
 * @param {Number}  moveFactor      Moving amount. Positive value will move right,
 *                                 negative value will move left
 */
links.Timeline.prototype.move = function(moveFactor) {
    // zoom start Date and end Date relative to the zoomAroundDate
    var diff = (this.end.valueOf() - this.start.valueOf());

    // apply new dates
    var newStart = new Date(this.start.valueOf() + diff * moveFactor);
    var newEnd   = new Date(this.end.valueOf() + diff * moveFactor);
    this.applyRange(newStart, newEnd);

    this.render(); // TODO: optimize, no need to reflow, only to recalc conversion and repaint
};

/**
 * Apply a visible range. The range is limited to feasible maximum and minimum
 * range.
 * @param {Date} start
 * @param {Date} end
 * @param {Date}   zoomAroundDate  Optional. Date around which will be zoomed.
 */
links.Timeline.prototype.applyRange = function (start, end, zoomAroundDate) {
    // calculate new start and end value
    var startValue = start.valueOf(); // number
    var endValue = end.valueOf();     // number
    var interval = (endValue - startValue);

    // determine maximum and minimum interval
    var options = this.options;
    var year = 1000 * 60 * 60 * 24 * 365;
    var zoomMin = Number(options.zoomMin) || 10;
    if (zoomMin < 10) {
        zoomMin = 10;
    }
    var zoomMax = Number(options.zoomMax) || 10000 * year;
    if (zoomMax > 10000 * year) {
        zoomMax = 10000 * year;
    }
    if (zoomMax < zoomMin) {
        zoomMax = zoomMin;
    }

    // determine min and max date value
    var min = options.min ? options.min.valueOf() : undefined; // number
    var max = options.max ? options.max.valueOf() : undefined; // number
    if (min != undefined && max != undefined) {
        if (min >= max) {
            // empty range
            var day = 1000 * 60 * 60 * 24;
            max = min + day;
        }
        if (zoomMax > (max - min)) {
            zoomMax = (max - min);
        }
        if (zoomMin > (max - min)) {
            zoomMin = (max - min);
        }
    }

    // prevent empty interval
    if (startValue >= endValue) {
        endValue += 1000 * 60 * 60 * 24;
    }

    // prevent too small scale
    // TODO: IE has problems with milliseconds
    if (interval < zoomMin) {
        var diff = (zoomMin - interval);
        var f = zoomAroundDate ? (zoomAroundDate.valueOf() - startValue) / interval : 0.5;
        startValue -= Math.round(diff * f);
        endValue   += Math.round(diff * (1 - f));
    }

    // prevent too large scale
    if (interval > zoomMax) {
        var diff = (interval - zoomMax);
        var f = zoomAroundDate ? (zoomAroundDate.valueOf() - startValue) / interval : 0.5;
        startValue += Math.round(diff * f);
        endValue   -= Math.round(diff * (1 - f));
    }

    // prevent to small start date
    if (min != undefined) {
        var diff = (startValue - min);
        if (diff < 0) {
            startValue -= diff;
            endValue -= diff;
        }
    }

    // prevent to large end date
    if (max != undefined) {
        var diff = (max - endValue);
        if (diff < 0) {
            startValue += diff;
            endValue += diff;
        }
    }

    // apply new dates
    this.start = new Date(startValue);
    this.end = new Date(endValue);
};

/**
 * Delete an item after a confirmation.
 * The deletion can be cancelled by executing .cancelDelete() during the
 * triggered event 'delete'.
 * @param {int} index   Index of the item to be deleted
 */
links.Timeline.prototype.confirmDeleteItem = function(index) {
    this.applyDelete = true;

    // select the event to be deleted
    if (!this.isSelected(index)) {
        this.selectItem(index);
    }

    // fire a delete event trigger. 
    // Note that the delete event can be canceled from within an event listener if 
    // this listener calls the method cancelChange().
    this.trigger('delete');

    if (this.applyDelete) {
        this.deleteItem(index);
    }

    delete this.applyDelete;
};

/**
 * Delete an item
 * @param {int} index   Index of the item to be deleted
 * @param {boolean} [preventRender=false]   Do not re-render timeline if true
 *                                          (optimization for multiple delete)
 */
links.Timeline.prototype.deleteItem = function(index, preventRender) {
    if (index >= this.items.length) {
        throw "Cannot delete row, index out of range";
    }

    if (this.selection) {
        // adjust the selection
        if (this.selection.index == index) {
            // item to be deleted is selected
            this.unselectItem(index);
        }
        else if (this.selection.index > index) {
            // update selection index
            this.selection.index--;
        }
    }

    // actually delete the item and remove it from the DOM
    var item = this.items.splice(index, 1)[0];
    this.renderQueue.hide.push(item);

    // delete the row in the original data table
    if (this.data) {
        if (links.Timeline.isArray(this.data)) {
            this.data.splice(index, 1);
        }
        else {
            throw "Cannot delete row from data, unknown data type";
        }
    }

    // prepare data for clustering, by filtering and sorting by type
    if (this.options.cluster) {
        this.clusterGenerator.updateData();
    }

    if (!preventRender) {
        this.render();
    }
};


/**
 * Delete all items
 */
links.Timeline.prototype.deleteAllItems = function() {
    this.unselectItem();

    // delete the loaded items
    this.clearItems();

    // delete the groups
    this.deleteGroups();

    // empty original data table
    if (this.data) {
        if (links.Timeline.isArray(this.data)) {
            this.data.splice(0, this.data.length);
        }
        else {
            throw "Cannot delete row from data, unknown data type";
        }
    }

    // prepare data for clustering, by filtering and sorting by type
    if (this.options.cluster) {
        this.clusterGenerator.updateData();
    }

    this.render();
};


/**
 * Find the group from a given height in the timeline
 * @param {Number} height   Height in the timeline
 * @return {Object | undefined} group   The group object, or undefined if out
 *                                      of range
 */
links.Timeline.prototype.getGroupFromHeight = function(height) {
    var i,
        group,
        groups = this.groups;

    if (groups.length) {
        if (this.options.axisOnTop) {
            for (i = groups.length - 1; i >= 0; i--) {
                group = groups[i];
                if (height > group.top) {
                    return group;
                }
            }
        }
        else {
            for (i = 0; i < groups.length; i++) {
                group = groups[i];
                if (height > group.top) {
                    return group;
                }
            }
        }

        return group; // return the last group
    }

    return undefined;
};

/**
 * Retrieve the properties of an item.
 * @param {Number} index
 * @return {Object} properties   Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional),
 *                              {String} className (optional)
 *                              {boolean} editable (optional)
 */
links.Timeline.prototype.getItem = function (index) {
    if (index >= this.items.length) {
        throw "Cannot get item, index out of range";
    }

    var item = this.items[index];

    var properties = {};
    properties.start = new Date(item.start.valueOf());
    if (item.end) {
        properties.end = new Date(item.end.valueOf());
    }
    properties.content = item.content;
    if (item.group) {
        properties.group = this.getGroupName(item.group);
    }
    if ('className' in item) {
        properties.className = this.getGroupName(item.className);
    }
    if (item.hasOwnProperty('editable') && (typeof item.editable != 'undefined')) {
        properties.editable = item.editable;
    }

    return properties;
};

/**
 * Add a new item.
 * @param {Object} itemData     Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional)
 * @param {boolean} [preventRender=false]   Do not re-render timeline if true
 */
links.Timeline.prototype.addItem = function (itemData, preventRender) {
    var itemsData = [
        itemData
    ];

    this.addItems(itemsData, preventRender);
};

/**
 * Add new items.
 * @param {Array} itemsData An array containing Objects.
 *                          The objects must have the following parameters:
 *                            {Date} start,
 *                            {Date} end,
 *                            {String} content with text or HTML code,
 *                            {String} group
 * @param {boolean} [preventRender=false]   Do not re-render timeline if true
 */
links.Timeline.prototype.addItems = function (itemsData, preventRender) {
    var timeline = this,
        items = this.items;

    // append the items
    itemsData.forEach(function (itemData) {
        var index = items.length;
        items.push(timeline.createItem(itemData));
        timeline.updateData(index, itemData);

        // note: there is no need to add the item to the renderQueue, that
        // will be done when this.render() is executed and all items are
        // filtered again.
    });

    // prepare data for clustering, by filtering and sorting by type
    if (this.options.cluster) {
        this.clusterGenerator.updateData();
    }

    if (!preventRender) {
        this.render({
            animate: false
        });
    }
};

/**
 * Create an item object, containing all needed parameters
 * @param {Object} itemData  Object containing parameters start, end
 *                           content, group.
 * @return {Object} item
 */
links.Timeline.prototype.createItem = function(itemData, type) {
    type = type || (itemData.end ? 'range' : this.options.style);
    var data = {
        start: itemData.start,
        end: itemData.end,
        content: itemData.content,
        className: itemData.className,
        editable: itemData.editable,
        group: this.getGroup(itemData.group),
        color: itemData.color
    };
    // TODO: optimize this, when creating an item, all data is copied twice...

    // TODO: is initialTop needed?
    var initialTop, options = this.options;
    if (options.axisOnTop) {
        initialTop = this.size.axis.height + options.eventMarginAxis + options.eventMargin / 2;
    }
    else {
        initialTop = this.size.contentHeight - options.eventMarginAxis - options.eventMargin / 2;
    }

    if (type in this.itemTypes) {
        return new this.itemTypes[type](data, {'top': initialTop})
    }

    console.log('ERROR: Unknown event style "' + type + '"');
    return new links.Timeline.Item(data, {
        'top': initialTop
    });
};

/**
 * Edit an item
 * @param {Number} index
 * @param {Object} itemData     Object containing item properties:<br>
 *                              {Date} start (required),
 *                              {Date} end (optional),
 *                              {String} content (required),
 *                              {String} group (optional)
 * @param {boolean} [preventRender=false]   Do not re-render timeline if true
 */
links.Timeline.prototype.changeItem = function (index, itemData, preventRender, type) {
    var oldItem = this.items[index];
    if (!oldItem) {
        throw "Cannot change item, index out of range";
    }

    // replace item, merge the changes
    var newItem = this.createItem({
        'start':   itemData.hasOwnProperty('start') ?   itemData.start :   oldItem.start,
        'end':     itemData.hasOwnProperty('end') ?     itemData.end :     oldItem.end,
        'content': itemData.hasOwnProperty('content') ? itemData.content : oldItem.content,
        'group':   itemData.hasOwnProperty('group') ?   itemData.group :   this.getGroupName(oldItem.group),
        'className': itemData.hasOwnProperty('className') ? itemData.className : oldItem.className,
        'editable': itemData.hasOwnProperty('editable') ? itemData.editable : oldItem.editable,
        'color': itemData.hasOwnProperty('color') ? itemData.color : oldItem.color
    }, type);
    this.items[index] = newItem;

    // append the changes to the render queue
    this.renderQueue.hide.push(oldItem);
    this.renderQueue.show.push(newItem);

    // update the original data table
    this.updateData(index, itemData);

    // prepare data for clustering, by filtering and sorting by type
    if (this.options.cluster) {
        this.clusterGenerator.updateData();
    }

    if (!preventRender) {
        // redraw timeline
        this.render({
            animate: false
        });

        type === 'box' && newItem.select();
    }
};

/**
 * Delete all groups
 */
links.Timeline.prototype.deleteGroups = function () {
    this.groups = [];
    this.groupIndexes = {};
};


/**
 * Get a group by the group name. When the group does not exist,
 * it will be created.
 * @param {String} groupName   the name of the group
 * @return {Object} groupObject
 */
links.Timeline.prototype.getGroup = function (groupName) {
    var groups = this.groups,
        groupIndexes = this.groupIndexes,
        groupObj = undefined;

    var groupIndex = groupIndexes[groupName];
    if (groupIndex == undefined && groupName != undefined) { // not null or undefined
        groupObj = {
            'content': groupName,
            'labelTop': 0,
            'lineTop': 0
            // note: this object will lateron get addition information, 
            //       such as height and width of the group         
        };
        groups.push(groupObj);
        // sort the groups
        groups = groups.sort(function (a, b) {
            if (a.content > b.content) {
                return 1;
            }
            if (a.content < b.content) {
                return -1;
            }
            return 0;
        });

        // rebuilt the groupIndexes
        for (var i = 0, iMax = groups.length; i < iMax; i++) {
            groupIndexes[groups[i].content] = i;
        }
    }
    else {
        groupObj = groups[groupIndex];
    }

    return groupObj;
};

/**
 * Get the group name from a group object.
 * @param {Object} groupObj
 * @return {String} groupName   the name of the group, or undefined when group
 *                              was not provided
 */
links.Timeline.prototype.getGroupName = function (groupObj) {
    return groupObj ? groupObj.content : undefined;
};

/**
 * Cancel a change item
 * This method can be called insed an event listener which catches the "change"
 * event. The changed event position will be undone.
 */
links.Timeline.prototype.cancelChange = function () {
    this.applyChange = false;
};

/**
 * Cancel deletion of an item
 * This method can be called insed an event listener which catches the "delete"
 * event. Deletion of the event will be undone.
 */
links.Timeline.prototype.cancelDelete = function () {
    this.applyDelete = false;
};


/**
 * Cancel creation of a new item
 * This method can be called insed an event listener which catches the "new"
 * event. Creation of the new the event will be undone.
 */
links.Timeline.prototype.cancelAdd = function () {
    this.applyAdd = false;
};


/**
 * Select an event. The visible chart range will be moved such that the selected
 * event is placed in the middle.
 * For example selection = [{row: 5}];
 * @param {Array} selection   An array with a column row, containing the row
 *                           number (the id) of the event to be selected.
 * @return {boolean}         true if selection is succesfully set, else false.
 */
links.Timeline.prototype.setSelection = function(selection) {
    if (selection != undefined && selection.length > 0) {
        if (selection[0].row != undefined) {
            var index = selection[0].row;
            if (this.items[index]) {
                var item = this.items[index];
                this.selectItem(index);

                // move the visible chart range to the selected event.
                var start = item.start;
                var end = item.end;
                var middle; // number
                if (end != undefined) {
                    middle = (end.valueOf() + start.valueOf()) / 2;
                } else {
                    middle = start.valueOf();
                }
                var diff = (this.end.valueOf() - this.start.valueOf()),
                    newStart = new Date(middle - diff/2),
                    newEnd = new Date(middle + diff/2);

                this.setVisibleChartRange(newStart, newEnd);

                return true;
            }
        }
    } /*else {
        // unselect current selection
        this.unselectItem();
    }*/
    return false;
};

/**
 * Retrieve the currently selected event
 * @return {Array} sel  An array with a column row, containing the row number
 *                      of the selected event. If there is no selection, an
 *                      empty array is returned.
 */
links.Timeline.prototype.getSelection = function() {
    var sel = [];
    if (this.selection) {
        sel.push({"row": this.selection.index});
    }
    return sel;
};


/**
 * Select an item by its index
 * @param {Number} index
 */
links.Timeline.prototype.selectItem = function(index) {
    //this.unselectItem();

    if (index >= 0 && this.selection.indexOf(index) < 0 && this.items[index] != undefined) {
        var item = this.items[index],
            domItem = item.dom;

        this.selection.push(index);

        if (item && item.dom) {
            // TODO: move adjusting the domItem to the item itself
            if (this.isEditable(item)) {
                item.dom.style.cursor = 'move';
            }
            item.select();
        }
        this.repaintDeleteButton();
        this.repaintDragAreas();

        this.changeItem(index, {}, false, 'box');
    }
};

/**
 * Check if an item is currently selected
 * @param {Number} index
 * @return {boolean} true if row is selected, else false
 */
links.Timeline.prototype.isSelected = function (index) {
    return this.selection.indexOf(index) >= 0;
};

/**
 * Unselect the currently selected event (if any)
 */
links.Timeline.prototype.unselectItem = function unselectItem(index) {
    var position;
    if(arguments.length === 1) {
        if (index >= 0 && this.selection.length > 0 && (position = this.selection.indexOf(index)) >= 0) {
            var item = this.items[index];

            if (item && item.dom) {
                var domItem = item.dom;
                domItem.style.cursor = '';
                item.unselect();
            }
            this.changeItem(index, {}, false, item.end?'range':'dot');

            this.selection.splice(position,1);
            this.repaintDeleteButton();
            this.repaintDragAreas();
        }
    } else {
        for(var l = this.selection.length; l--;){
            this.unselectItem(this.selection[l]);  
        }   
    }
};

/**
 * Stack the items such that they don't overlap. The items will have a minimal
 * distance equal to options.eventMargin.
 * @param {boolean | undefined} animate    if animate is true, the items are
 *                                         moved to their new position animated
 *                                         defaults to false.
 */
links.Timeline.prototype.stackItems = function(animate) {
    if (this.groups.length > 0) {
        // under this conditions we refuse to stack the events
        // TODO: implement support for stacking items per group
        return;
    }

    if (animate == undefined) {
        animate = false;
    }

    // calculate the order and final stack position of the items
    var stack = this.stack;
    if (!stack) {
        stack = {};
        this.stack = stack;
    }
    stack.sortedItems = this.stackOrder(this.renderedItems);
    stack.finalItems = this.stackCalculateFinal(stack.sortedItems);

    if (animate || stack.timer) {
        // move animated to the final positions
        var timeline = this;
        var step = function () {
            var arrived = timeline.stackMoveOneStep(stack.sortedItems,
                stack.finalItems);

            timeline.repaint();

            if (!arrived) {
                stack.timer = setTimeout(step, 30);
            }
            else {
                delete stack.timer;
            }
        };

        if (!stack.timer) {
            stack.timer = setTimeout(step, 30);
        }
    }
    else {
        // move immediately to the final positions
        this.stackMoveToFinal(stack.sortedItems, stack.finalItems);
    }
};

/**
 * Cancel any running animation
 */
links.Timeline.prototype.stackCancelAnimation = function() {
    if (this.stack && this.stack.timer) {
        clearTimeout(this.stack.timer);
        delete this.stack.timer;
    }
};


/**
 * Order the items in the array this.items. The default order is determined via:
 * - Ranges go before boxes and dots.
 * - The item with the oldest start time goes first
 * If a custom function has been provided via the stackorder option, then this will be used.
 * @param {Array} items        Array with items
 * @return {Array} sortedItems Array with sorted items
 */
links.Timeline.prototype.stackOrder = function(items) {
    // TODO: store the sorted items, to have less work later on
    var sortedItems = items.concat([]);

    //if a customer stack order function exists, use it. 
    var f = this.options.customStackOrder && (typeof this.options.customStackOrder === 'function') ? this.options.customStackOrder : function (a, b)
    {
        if ((a instanceof links.Timeline.ItemRange) &&
            !(b instanceof links.Timeline.ItemRange)) {
            return -1;
        }

        if (!(a instanceof links.Timeline.ItemRange) &&
            (b instanceof links.Timeline.ItemRange)) {
            return 1;
        }

        return (a.left - b.left);
    };

    sortedItems.sort(f);

    return sortedItems;
};

/**
 * Adjust vertical positions of the events such that they don't overlap each
 * other.
 * @param {timeline.Item[]} items
 * @return {Object[]} finalItems
 */
links.Timeline.prototype.stackCalculateFinal = function(items) {
    var i,
        iMax,
        size = this.size,
        axisTop = size.axis.top,
        axisHeight = size.axis.height,
        options = this.options,
        axisOnTop = options.axisOnTop,
        eventMargin = options.eventMargin,
        eventMarginAxis = options.eventMarginAxis,
        finalItems = [];

    // initialize final positions
    for (i = 0, iMax = items.length; i < iMax; i++) {
        var item = items[i],
            top,
            bottom,
            height = item.height,
            width = item.getWidth(this),
            right = item.getRight(this),
            left = right - width;

        if (axisOnTop) {
            top = axisHeight + eventMarginAxis + eventMargin / 2;
        }
        else {
            top = axisTop - height - eventMarginAxis - eventMargin / 2;
        }
        bottom = top + height;

        finalItems[i] = {
            'left': left,
            'top': top,
            'right': right,
            'bottom': bottom,
            'height': height,
            'item': item
        };
    }

    if (this.options.stackEvents) {
        // calculate new, non-overlapping positions
        //var items = sortedItems;
        for (i = 0, iMax = finalItems.length; i < iMax; i++) {
            //for (var i = finalItems.length - 1; i >= 0; i--) {
            var finalItem = finalItems[i];
            var collidingItem = null;
            do {
                // TODO: optimize checking for overlap. when there is a gap without items,
                //  you only need to check for items from the next item on, not from zero
                collidingItem = this.stackItemsCheckOverlap(finalItems, i, 0, i-1);
                if (collidingItem != null) {
                    // There is a collision. Reposition the event above the colliding element
                    if (axisOnTop) {
                        finalItem.top = collidingItem.top + collidingItem.height + eventMargin;
                    }
                    else {
                        finalItem.top = collidingItem.top - finalItem.height - eventMargin;
                    }
                    finalItem.bottom = finalItem.top + finalItem.height;
                }
            } while (collidingItem);
        }
    }

    return finalItems;
};


/**
 * Move the events one step in the direction of their final positions
 * @param {Array} currentItems   Array with the real items and their current
 *                               positions
 * @param {Array} finalItems     Array with objects containing the final
 *                               positions of the items
 * @return {boolean} arrived     True if all items have reached their final
 *                               location, else false
 */
links.Timeline.prototype.stackMoveOneStep = function(currentItems, finalItems) {
    var arrived = true;

    // apply new positions animated
    for (i = 0, iMax = finalItems.length; i < iMax; i++) {
        var finalItem = finalItems[i],
            item = finalItem.item;

        var topNow = parseInt(item.top);
        var topFinal = parseInt(finalItem.top);
        var diff = (topFinal - topNow);
        if (diff) {
            var step = (topFinal == topNow) ? 0 : ((topFinal > topNow) ? 1 : -1);
            if (Math.abs(diff) > 4) step = diff / 4;
            var topNew = parseInt(topNow + step);

            if (topNew != topFinal) {
                arrived = false;
            }

            item.top = topNew;
            item.bottom = item.top + item.height;
        }
        else {
            item.top = finalItem.top;
            item.bottom = finalItem.bottom;
        }

        item.left = finalItem.left;
        item.right = finalItem.right;
    }

    return arrived;
};



/**
 * Move the events from their current position to the final position
 * @param {Array} currentItems   Array with the real items and their current
 *                               positions
 * @param {Array} finalItems     Array with objects containing the final
 *                               positions of the items
 */
links.Timeline.prototype.stackMoveToFinal = function(currentItems, finalItems) {
    // Put the events directly at there final position
    for (i = 0, iMax = finalItems.length; i < iMax; i++) {
        var finalItem = finalItems[i],
            current = finalItem.item;

        current.left = finalItem.left;
        current.top = finalItem.top;
        current.right = finalItem.right;
        current.bottom = finalItem.bottom;
    }
};



/**
 * Check if the destiny position of given item overlaps with any
 * of the other items from index itemStart to itemEnd.
 * @param {Array} items      Array with items
 * @param {int}  itemIndex   Number of the item to be checked for overlap
 * @param {int}  itemStart   First item to be checked.
 * @param {int}  itemEnd     Last item to be checked.
 * @return {Object}          colliding item, or undefined when no collisions
 */
links.Timeline.prototype.stackItemsCheckOverlap = function(items, itemIndex,
                                                           itemStart, itemEnd) {
    var eventMargin = this.options.eventMargin,
        collision = this.collision;

    // we loop from end to start, as we suppose that the chance of a 
    // collision is larger for items at the end, so check these first.
    var item1 = items[itemIndex];
    for (var i = itemEnd; i >= itemStart; i--) {
        var item2 = items[i];
        if (collision(item1, item2, eventMargin)) {
            if (i != itemIndex) {
                return item2;
            }
        }
    }

    return undefined;
};

/**
 * Test if the two provided items collide
 * The items must have parameters left, right, top, and bottom.
 * @param {Element} item1       The first item
 * @param {Element} item2       The second item
 * @param {Number}              margin  A minimum required margin. Optional.
 *                              If margin is provided, the two items will be
 *                              marked colliding when they overlap or
 *                              when the margin between the two is smaller than
 *                              the requested margin.
 * @return {boolean}            true if item1 and item2 collide, else false
 */
links.Timeline.prototype.collision = function(item1, item2, margin) {
    // set margin if not specified 
    if (margin == undefined) {
        margin = 0;
    }

    // calculate if there is overlap (collision)
    return (item1.left - margin < item2.right &&
        item1.right + margin > item2.left &&
        item1.top - margin < item2.bottom &&
        item1.bottom + margin > item2.top);
};


/**
 * fire an event
 * @param {String} event   The name of an event, for example "rangechange" or "edit"
 */
links.Timeline.prototype.trigger = function (event, DOMEvent) {
    // built up properties
    var properties = null;
    switch (event) {
        case 'rangechange':
        case 'rangechanged':
            properties = {
                'start': new Date(this.start.valueOf()),
                'end': new Date(this.end.valueOf())
            };
            break;

        case 'timechange':
        case 'timechanged':
            properties = {
                'time': new Date(this.customTime.valueOf())
            };
            break;
        case 'select':
            properties = {
                'event':DOMEvent,
                'selection': this.selection,
                'item': this.selection && this.items[this.selection.index]
            };
    }

    // trigger the links event bus
    links.events.trigger(this, event, properties);
};


/**
 * Cluster the events
 */
links.Timeline.prototype.clusterItems = function () {
    if (!this.options.cluster) {
        return;
    }

    var clusters = this.clusterGenerator.getClusters(this.conversion.factor);
    if (this.clusters != clusters) {
        // cluster level changed
        var queue = this.renderQueue;

        // remove the old clusters from the scene
        if (this.clusters) {
            this.clusters.forEach(function (cluster) {
                queue.hide.push(cluster);

                // unlink the items
                cluster.items.forEach(function (item) {
                    item.cluster = undefined;
                });
            });
        }

        // append the new clusters
        clusters.forEach(function (cluster) {
            // don't add to the queue.show here, will be done in .filterItems()

            // link all items to the cluster
            cluster.items.forEach(function (item) {
                item.cluster = cluster;
            });
        });

        this.clusters = clusters;
    }
};

/**
 * Filter the visible events
 */
links.Timeline.prototype.filterItems = function () {
    var queue = this.renderQueue,
        window = (this.end - this.start),
        start = new Date(this.start.valueOf() - window),
        end = new Date(this.end.valueOf() + window);

    function filter (arr) {
        arr.forEach(function (item) {
            var rendered = item.rendered;
            var visible = item.isVisible(start, end);
            if (rendered != visible) {
                if (rendered) {
                    queue.hide.push(item); // item is rendered but no longer visible
                }
                if (visible && (queue.show.indexOf(item) == -1)) {
                    queue.show.push(item); // item is visible but neither rendered nor queued up to be rendered
                }
            }
        });
    }

    // filter all items and all clusters
    filter(this.items);
    if (this.clusters) {
        filter(this.clusters);
    }
};