/**
 * @constructor links.Timeline.ItemDot
 * @extends links.Timeline.Item
 * @param {Object} data       Object containing parameters start, end
 *                            content, group, type.
 * @param {Object} [options]  Options to set initial property values
 *                                {Number} top
 *                                {Number} left
 *                                {Number} width
 *                                {Number} height
 */
links.Timeline.ItemDot = function (data, options) {
    links.Timeline.Item.call(this, data, options);
};

links.Timeline.ItemDot.prototype = new links.Timeline.Item();

/**
 * Reflow the Item: retrieve its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
links.Timeline.ItemDot.prototype.reflow = function () {
    var dom = this.dom,
        dotHeight = dom.dot.offsetHeight,
        dotWidth = dom.dot.offsetWidth,
        contentHeight = dom.content.offsetHeight,
        resized = (
            (this.dotHeight != dotHeight) ||
                (this.dotWidth != dotWidth) ||
                (this.contentHeight != contentHeight)
            );

    this.dotHeight = dotHeight;
    this.dotWidth = dotWidth;
    this.contentHeight = contentHeight;

    return resized;
};

/**
 * Select the item
 * @override
 */
links.Timeline.ItemDot.prototype.select = function () {
    var dom = this.dom;
    links.Timeline.addClassName(dom, 'timeline-event-selected');
};

/**
 * Unselect the item
 * @override
 */
links.Timeline.ItemDot.prototype.unselect = function () {
    var dom = this.dom;
    links.Timeline.removeClassName(dom, 'timeline-event-selected');
};

/**
 * Creates the DOM for the item, depending on its type
 * @return {Element | undefined}
 * @override
 */
links.Timeline.ItemDot.prototype.createDOM = function () {
    // background box
    var divBox = document.createElement("DIV"), that = this;
    divBox.style.position = "absolute";

    // contents box, right from the dot
    var divContent = document.createElement("DIV"), dotLabel = this.title || "Evento";
    $(divContent).append(dotLabel).css({"font-size":"10px"});
    divContent.className = "timeline-event-content";
    divBox.appendChild(divContent);

    // dot at start
    var divDot = document.createElement("DIV");
    divDot.style.position = "absolute";
    divDot.style.width = "0px";
    divDot.style.height = "0px";
    divDot.style.borderColor = this.color.toString();

    //sier
    // Add an event for showing a pupop with info
    links.Timeline.addEventListener(divDot,"mouseover",
        function(){
            var divGtip = document.createElement("div"), 
                divTooltip = document.createElement("div"),
                divTriangule = document.createElement("div");

            divGtip.className = "timeline-event-tooltip";
            $(this).mouseover(function(){$(divGtip).css({opacity:0.8,display:"none"}).fadeIn(300);});

            divTooltip.className = "timeline-event-tooltip-content";
            divTooltip.textContent = that.label;
            divTooltip.style["border-color"] = that.color.toString();

            divTriangule.className = "timeline-event-tooltip-base";

            divGtip.appendChild(divTooltip);
            divGtip.appendChild(divTriangule);

            divBox.appendChild(divGtip);
            //divBox
        }
    );
    links.Timeline.addEventListener(divDot,"mouseout",
        function(){
            $(divBox).find(".timeline-event-tooltip")[0].remove();

        }
    );

    divBox.appendChild(divDot);
    divBox.content = divContent;
    divBox.dot = divDot;

    this.dom = divBox;
    this.updateDOM();

    return divBox;
};

/**
 * Append the items DOM to the given HTML container. If items DOM does not yet
 * exist, it will be created first.
 * @param {Element} container
 * @override
 */
links.Timeline.ItemDot.prototype.showDOM = function (container) {
    var dom = this.dom;
    if (!dom) {
        dom = this.createDOM();
    }

    if (dom.parentNode != container) {
        if (dom.parentNode) {
            // container changed. remove it from old container first
            this.hideDOM();
        }

        // append to container
        container.appendChild(dom);
        this.rendered = true;
    }
};

/**
 * Remove the items DOM from the current HTML container
 * @override
 */
links.Timeline.ItemDot.prototype.hideDOM = function () {
    var dom = this.dom;
    if (dom) {
        if (dom.parentNode) {
            dom.parentNode.removeChild(dom);
        }
        this.rendered = false;
    }
    
};

/**
 * Update the DOM of the item. This will update the content and the classes
 * of the item
 * @override
 */
links.Timeline.ItemDot.prototype.updateDOM = function () {
    if (this.dom) {
        var divBox = this.dom;
        var divDot = divBox.dot;

        // update contents
        //divBox.firstChild.innerHTML = this.content;

        // update class
        divDot.className  = "timeline-event timeline-event-dot";

        if (this.isCluster) {
            links.Timeline.addClassName(divBox, 'timeline-event-cluster');
            links.Timeline.addClassName(divDot, 'timeline-event-cluster');
        }

        // add item specific class name when provided
        if (this.className) {
            links.Timeline.addClassName(divBox, this.className);
            links.Timeline.addClassName(divDot, this.className);
        }

        // TODO: apply selected className?
    }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range of the timeline and the timeline options. *
 * @param {links.Timeline} timeline
 * @override
 */
links.Timeline.ItemDot.prototype.updatePosition = function (timeline) {
    var dom = this.dom;
    if (dom) {
        var left = timeline.timeToScreen(this.start);

        dom.style.top = this.top + "px";
        dom.style.left = (left - this.dotWidth / 2) + "px";

        dom.content.style.marginLeft = (1.5 * this.dotWidth) + "px";
        //dom.content.style.marginRight = (0.5 * this.dotWidth) + "px"; // TODO
        dom.dot.style.top = ((this.height - this.dotHeight) / 2) + "px";
    }
};

/**
 * Check if the item is visible in the timeline, and not part of a cluster.
 * @param {Date} start
 * @param {Date} end
 * @return {boolean} visible
 * @override
 */
links.Timeline.ItemDot.prototype.isVisible = function (start, end) {
    if (this.cluster) {
        return false;
    }

    return (this.start > start)
        && (this.start < end);
};

/**
 * Reposition the item
 * @param {Number} left
 * @param {Number} right
 * @override
 */
links.Timeline.ItemDot.prototype.setPosition = function (left, right) {
    var dom = this.dom;

    dom.style.left = (left - this.dotWidth / 2) + "px";

    if (this.group) {
        this.top = this.group.top;
        dom.style.top = this.top + 'px';
    }
};

/**
 * Calculate the right position of the item
 * @param {links.Timeline} timeline
 * @return {Number} right
 * @override
 */
links.Timeline.ItemDot.prototype.getRight = function (timeline) {
    return timeline.timeToScreen(this.start) + this.width;
};