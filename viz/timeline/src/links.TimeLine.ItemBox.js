/**
 * @constructor links.Timeline.ItemBox
 * @extends links.Timeline.Item
 * @param {Object} data       Object containing parameters start, end
 *                            content, group. type, group.
 * @param {Object} [options]  Options to set initial property values
 *                                {Number} top
 *                                {Number} left
 *                                {Number} width
 *                                {Number} height
 */
links.Timeline.ItemBox = function (data, options) {
    links.Timeline.Item.call(this, data, options);
};

links.Timeline.ItemBox.prototype = new links.Timeline.Item();

/**
 * Reflow the Item: retrieve its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
links.Timeline.ItemBox.prototype.reflow = function () {
    var dom = this.dom,
        dotHeight = dom.dot.offsetHeight,
        dotWidth = dom.dot.offsetWidth,
        //dotEndHeight = dom.dotEnd.offsetHeight,
        //dotEndWidth = dom.dotEnd.offsetWidth,
        lineWidth = dom.line.offsetWidth,
        resized = (
            (this.dotHeight != dotHeight) ||
                (this.dotWidth != dotWidth) ||
                (this.lineWidth != lineWidth) //||
                //(this.dotEndHeight != dotEndHeight) ||
                //(this.dotEndWidth != dotEndWidth)
            );

    //this.dotHeight = dotHeight;
    //this.dotWidth = dotWidth;

    this.dotHeight = dotHeight;
    this.dotWidth = dotWidth;
    
    this.lineWidth = lineWidth;

    return resized;
};

/**
 * Select the item
 * @override
 */
links.Timeline.ItemBox.prototype.select = function () {
    var dom = this.dom;
    links.Timeline.addClassName(dom, 'timeline-event-selected');
    links.Timeline.addClassName(dom.line, 'timeline-event-selected');
    links.Timeline.addClassName(dom.dot, 'timeline-event-selected');

    dom.dotEnd && links.Timeline.addClassName(dom.dotEnd, 'timeline-event-selected');
    dom.lineRange && links.Timeline.addClassName(dom.lineRange, 'timeline-event-selected');
};

/**
 * Unselect the item
 * @override
 */
links.Timeline.ItemBox.prototype.unselect = function () {
    var dom = this.dom;
    links.Timeline.removeClassName(dom, 'timeline-event-selected');
    links.Timeline.removeClassName(dom.line, 'timeline-event-selected');
    links.Timeline.removeClassName(dom.dot, 'timeline-event-selected');

    dom.dotEnd && links.Timeline.removeClassName(dom.dotEnd, 'timeline-event-selected');
    dom.lineRange && links.Timeline.removeClassName(dom.lineRange, 'timeline-event-selected');
};

/**
 * Creates the DOM for the item, depending on its type
 * @return {Element | undefined}
 * @override
 */
links.Timeline.ItemBox.prototype.createDOM = function () {
    // background box
    var divBox = document.createElement("DIV"), divBoxStyle = divBox.style,
        divLine = document.createElement("DIV"), divLineStyle = divLine.style,
        divDot = document.createElement("DIV"), divDotStyle = divDot.style,
        color = this.color.toString(), 
        borderColor = this.color.darker().toString(), 
        bgColor = this.color.brighter().toString();
    //console.log(arguments.callee.caller);
    divBoxStyle.left = this.left + "px";
    divBoxStyle.top = this.top + "px";

    // contents box (inside the background box). used for making margins
    var divContent = document.createElement("DIV");
    divContent.className = "timeline-event-content";
  
    //divContent.appendChild({content:timeline.contentGenerator.generate({desc:'that',title:'Los marcianos',img:'photo.png'})});
    //divContent.innerHTML += timeline.contentGenerator.generate({desc:'that',title:'Los marcianos',img:'photo.png'}).textContent;

    divBox.appendChild(divContent);

    divBoxStyle.position = divDotStyle.position = divLineStyle.position = "absolute";
    divDotStyle.width = divDotStyle.height = divLineStyle.width = "0px";
    divBoxStyle.backgroundColor = divLineStyle.borderColor = bgColor;
    divBoxStyle.borderColor = divDotStyle.borderColor = color;
    // important: the vertical line is added at the front of the list of elements,
    // so it will be drawn behind all boxes and ranges
    divBox.line = divLine;
    divBox.dot = divDot;

    if(this.end) {
        var divDotEnd = document.createElement("DIV"),
            divDotEndStyle = divDotEnd.style,
            divLineRange = document.createElement("DIV"),
            divLineRangeStyle = divLineRange.style;
        
        divDotEndStyle.borderColor = color;
        divLineRangeStyle.borderColor = bgColor;

        divDotEndStyle.position = divLineRangeStyle.position = "absolute";
        divDotEndStyle.height = divDotEndStyle.width = divLineRangeStyle.height = "0px";

        divLineRangeStyle.borderStyle = "solid";

        divBox.dotEnd = divDotEnd;
        divBox.lineRange = divLineRange;   
    }

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
links.Timeline.ItemBox.prototype.showDOM = function (container) {
    var fragment = document.createDocumentFragment(), dom = this.dom;

    if (!dom) {
        dom = this.createDOM();
    }

    if (dom.parentNode != container) {
        if (dom.parentNode) {
            // container is changed. remove from old container
            this.hideDOM();
        }

        // append to this container
        fragment.appendChild(dom);
        fragment.insertBefore(dom.line, fragment.firstChild);
        dom.lineRange && fragment.insertBefore(dom.lineRange, fragment.firstChild);
        // Note: line must be added in front of the this,
        //       such that it stays below all this
        fragment.appendChild(dom.dot);
        dom.dotEnd && fragment.appendChild(dom.dotEnd);

        container.appendChild(fragment);

        this.rendered = true;
    }
};

/**
 * Remove the items DOM from the current HTML container, but keep the DOM in
 * memory
 * @override
 */
links.Timeline.ItemBox.prototype.hideDOM = function () {
    var dom = this.dom;
    if (dom) {
        if (dom.parentNode) {
            dom.parentNode.removeChild(dom);
        }
        if (dom.line && dom.line.parentNode) {
            dom.line.parentNode.removeChild(dom.line);
        }
        if (dom.dot && dom.dot.parentNode) {
            dom.dot.parentNode.removeChild(dom.dot);
        }
        if (dom.dotEnd && dom.dotEnd.parentNode) {
            dom.dotEnd.parentNode.removeChild(dom.dotEnd);
        }

        if (dom.lineRange && dom.lineRange.parentNode) {
            dom.lineRange.parentNode.removeChild(dom.lineRange);
        }
        this.rendered = false;
    }
};

/**
 * Update the DOM of the item. This will update the content and the classes
 * of the item
 * @override
 */
links.Timeline.ItemBox.prototype.updateDOM = function () {
    var divBox = this.dom;
    if (divBox) {
        var divLine = divBox.line;
        var divDot = divBox.dot;
        var divDotEnd = divBox.dotEnd;
        var divLineRange = divBox.lineRange;

        // update contents
        /*
         *  This should be changed, becuase we don't know the actual structure of the data
         *  in the other hand we need to have the data on the this.
         */
        //divBox.firstChild.innerHTML = this.content;

        divBox.firstChild.appendChild(timeline.contentGenerator.generate({desc:'Descripcion Descrita',title:'Titulo Descriptivo',img:'photo.png'}));

        // update class
        divBox.className = "timeline-event timeline-event-box";
        divLine.className = "timeline-event timeline-event-line";
        divDot.className  = "timeline-event timeline-event-dot";

        if(this.end){
            divDotEnd.className  = "timeline-event timeline-event-dot";
            divLineRange.className  = "timeline-event"
        }

        if (this.isCluster) {
            links.Timeline.addClassName(divBox, 'timeline-event-cluster');
            links.Timeline.addClassName(divLine, 'timeline-event-cluster');
            links.Timeline.addClassName(divDot, 'timeline-event-cluster');
        }

        // add item specific class name when provided
        if (this.className) {
            links.Timeline.addClassName(divBox, this.className);
            links.Timeline.addClassName(divLine, this.className);
            links.Timeline.addClassName(divDot, this.className);
            divDotEnd && links.Timeline.addClassName(divDotEnd, this.className);
            divLineRange && links.Timeline.addClassName(divLineRange, this.className); 
        }

        // TODO: apply selected className?
    }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range of the timeline and the timeline options.
 * @param {links.Timeline} timeline
 * @override
 */
links.Timeline.ItemBox.prototype.updatePosition = function (timeline) {
    var dom = this.dom;
    if (dom) {
        var right, left = timeline.timeToScreen(this.start),
            axisOnTop = timeline.options.axisOnTop,
            axisTop = timeline.size.axis.top,
            axisHeight = timeline.size.axis.height,
            boxAlign = (timeline.options.box && timeline.options.box.align) ?
                timeline.options.box.align : undefined;

        dom.style.top = this.top + "px";
        if (boxAlign == 'right') {
            dom.style.left = (left - this.width) + "px";
        }
        else if (boxAlign == 'left') {
            dom.style.left = (left) + "px";
        }
        else { // default or 'center'
            dom.style.left = (left - this.width/2) + "px";
        }

        var line = dom.line;
        var dot = dom.dot;
        var dotEnd = dom.dotEnd;
        var lineRange = dom.lineRange;
        
        line.style.left = (left - this.lineWidth/2) + "px";
        dot.style.left = (left - this.dotWidth/2) + "px";

        if(this.end){
            right = timeline.timeToScreen(this.end);
            dotEnd.style.left = (right - this.dotWidth/2) + "px";

            lineRange.style.left = (left - this.dotWidth/2) + "px";
            lineRange.style.width = Math.max(right - left, 1) + "px";
            lineRange.style.borderWidth = "1px 0 0 0";
        }


        if (axisOnTop) {
            line.style.top = axisHeight + "px";
            line.style.height = Math.max(this.top - axisHeight, 0) + "px";
            dot.style.top = (axisHeight - this.dotHeight/2) + "px";
            dotEnd && (dotEnd.style.top = (axisHeight - this.dotHeight/2) + "px");
            lineRange && (lineRange.style.top = axisHeight + "px");
        }
        else {
            line.style.top = (this.top + this.height) + "px";
            line.style.height = Math.max(axisTop - this.top - this.height, 0) + "px";
            dot.style.top = (axisTop - this.dotHeight/2) + "px";
            dotEnd && (dotEnd.style.top = (axisTop - this.dotHeight/2) + "px");
            lineRange && (lineRange.style.top = axisTop + "px");
        }
    }
};

/**
 * Check if the item is visible in the timeline, and not part of a cluster
 * @param {Date} start
 * @param {Date} end
 * @return {Boolean} visible
 * @override
 */
links.Timeline.ItemBox.prototype.isVisible = function (start, end) {
    if (this.cluster) {
        return false;
    }

    return (this.start > start) && (this.start < end);
};

/**
 * Reposition the item
 * @param {Number} left
 * @param {Number} right
 * @override
 */
links.Timeline.ItemBox.prototype.setPosition = function (left, right) {
    var dom = this.dom;

    dom.style.left = (left - this.width / 2) + "px";
    dom.line.style.left = (left - this.lineWidth / 2) + "px";
    dom.dot.style.left = (left - this.dotWidth / 2) + "px";

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
links.Timeline.ItemBox.prototype.getRight = function (timeline) {
    var boxAlign = (timeline.options.box && timeline.options.box.align) ?
        timeline.options.box.align : undefined;

    var left = timeline.timeToScreen(this.start);
    var right;
    if (boxAlign == 'right') {
        right = left;
    }
    else if (boxAlign == 'left') {
        right = (left + this.width);
    }
    else { // default or 'center'
        right = (left + this.width / 2);
    }

    return right;
};