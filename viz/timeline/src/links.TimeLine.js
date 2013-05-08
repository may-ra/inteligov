/**
 * @file timeline.js
 *
 * @brief
 * The Timeline is an interactive visualization chart to visualize events in
 * time, having a start and end date.
 * You can freely move and zoom in the timeline by dragging
 * and scrolling in the Timeline. Items are optionally dragable. The time
 * scale on the axis is adjusted automatically, and supports scales ranging
 * from milliseconds to years.
 *
 * Timeline is part of the CHAP Links library.
 *
 * Timeline is tested on Firefox 3.6, Safari 5.0, Chrome 6.0, Opera 10.6, and
 * Internet Explorer 6+.
 *
 * @license
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy
 * of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * Copyright (c) 2011-2013 Almende B.V.
 *
 * @author     Jos de Jong, <jos@almende.org>
 * @date    2013-04-18
 * @version 2.4.2
 */

/*
 * i18n mods by github user iktuz (https://gist.github.com/iktuz/3749287/)
 * added to v2.4.1 with da_DK language by @bjarkebech
 */

/*
 * TODO
 *
 * Add zooming with pinching on Android
 * 
 * Bug: when an item contains a javascript onclick or a link, this does not work
 *      when the item is not selected (when the item is being selected,
 *      it is redrawn, which cancels any onclick or link action)
 * Bug: when an item contains an image without size, or a css max-width, it is not sized correctly
 * Bug: neglect items when they have no valid start/end, instead of throwing an error
 * Bug: Pinching on ipad does not work very well, sometimes the page will zoom when pinching vertically
 * Bug: cannot set max width for an item, like div.timeline-event-content {white-space: normal; max-width: 100px;}
 * Bug on IE in Quirks mode. When you have groups, and delete an item, the groups become invisible
 */

/**
 * Declare a unique namespace for CHAP's Common Hybrid Visualisation Library,
 * "links"
 */
if (typeof links === 'undefined') {
    links = {};
    // important: do not use var, as "var links = {};" will overwrite 
    //            the existing links variable value with undefined in IE8, IE7.  
}

// Internet Explorer 8 and older does not support Array.indexOf,
// so we define it here in that case
// http://soledadpenades.com/2007/05/17/arrayindexof-in-internet-explorer/
if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj){
        for(var i = this.length; i--;){
            if(this[i] == obj){
                return i;
            }
        }
        return -1;
    }
}

// Internet Explorer 8 and older does not support Array.forEach,
// so we define it here in that case
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope || this, this[i], i, this);
        }
    }
}


/**
 * @constructor links.Timeline
 * The timeline is a visualization chart to visualize events in time.
 *
 * The timeline is developed in javascript as a Google Visualization Chart.
 *
 * @param {Element} container   The DOM element in which the Timeline will
 *                                  be created. Normally a div element.
 */
links.Timeline = function(container) {
    if (!container) {
        // this call was probably only for inheritance, no constructor-code is required
        return;
    }

    // create variables and set default values
    this.dom = {};
    this.conversion = {};
    this.eventParams = {}; // stores parameters for mouse events
    this.groups = [];
    this.groupIndexes = {};
    this.items = [];
    this.renderQueue = {
        show: [],   // Items made visible but not yet added to DOM
        hide: [],   // Items currently visible but not yet removed from DOM
        update: []  // Items with changed data but not yet adjusted DOM
    };
    this.renderedItems = [];  // Items currently rendered in the DOM
    this.clusterGenerator = new links.Timeline.ClusterGenerator(this);
    this.currentClusters = [];
    this.selection = []; // stores index and item which is currently selected

    this.contentGenerator = new links.Timeline.ContentGenerator(new links.Timeline.TableContentFactory());

    this.listeners = {}; // event listener callbacks

    // Initialize sizes. 
    // Needed for IE (which gives an error when you try to set an undefined
    // value in a style)
    this.size = {
        'actualHeight': 0,
        'axis': {
            'characterMajorHeight': 0,
            'characterMajorWidth': 0,
            'characterMinorHeight': 0,
            'characterMinorWidth': 0,
            'height': 0,
            'labelMajorTop': 0,
            'labelMinorTop': 0,
            'line': 0,
            'lineMajorWidth': 0,
            'lineMinorHeight': 0,
            'lineMinorTop': 0,
            'lineMinorWidth': 0,
            'top': 0
        },
        'contentHeight': 0,
        'contentLeft': 0,
        'contentWidth': 0,
        'frameHeight': 0,
        'frameWidth': 0,
        'groupsLeft': 0,
        'groupsWidth': 0,
        'items': {
            'top': 0
        }
    };

    this.dom.container = container;

    this.options = {
        'width': "100%",
        'height': "auto",
        'minHeight': 0,        // minimal height in pixels
        'autoHeight': true,

        'eventMargin': 10,     // minimal margin between events
        'eventMarginAxis': 20, // minimal margin between events and the axis
        'dragAreaWidth': 10,   // pixels

        'min': undefined,
        'max': undefined,
        'zoomMin': 10,     // milliseconds
        'zoomMax': 1000 * 60 * 60 * 24 * 365 * 10000, // milliseconds

        'moveable': true,
        'zoomable': true,
        'selectable': true,
        'editable': false,
        'snapEvents': true,
        'groupChangeable': true,

        'showCurrentTime': true, // show a red bar displaying the current time
        'showCustomTime': false, // show a blue, draggable bar displaying a custom time    
        'showMajorLabels': true,
        'showMinorLabels': true,
        'showNavigation': false,
        'showButtonNew': false,
        'groupsOnRight': false,
        'axisOnTop': false,
        'stackEvents': true,
        'animate': true,
        'animateZoom': true,
        'cluster': false,
        'style': 'box',
        'customStackOrder': false, //a function(a,b) for determining stackorder amongst a group of items. Essentially a comparator, -ve value for "a before b" and vice versa
        
        // i18n: Timeline only has built-in English text per default. Include timeline-locales.js to support more localized text.
        'locale': 'en',
        'MONTHS': new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
        'MONTHS_SHORT': new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
        'DAYS': new Array("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"),
        'DAYS_SHORT': new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"),
        'ZOOM_IN': "Zoom in",
        'ZOOM_OUT': "Zoom out",
        'MOVE_LEFT': "Move left",
        'MOVE_RIGHT': "Move right",
        'NEW': "New",
        'CREATE_NEW_EVENT': "Create new event"
    };

    this.clientTimeOffset = 0;    // difference between client time and the time
    // set via Timeline.setCurrentTime()
    var dom = this.dom;

    // remove all elements from the container element.
    while (dom.container.hasChildNodes()) {
        dom.container.removeChild(dom.container.firstChild);
    }

    // create a step for drawing the axis
    this.step = new links.Timeline.StepDate();

    // add standard item types
    this.itemTypes = {
        box:   links.Timeline.ItemBox,
        range: links.Timeline.ItemRange,
        dot:   links.Timeline.ItemDot
    };

    // initialize data
    this.data = [];
    this.firstDraw = true;

    // date interval must be initialized 
    this.setVisibleChartRange(undefined, undefined, false);

    // render for the first time
    this.render();

    // fire the ready event
    var me = this;
    setTimeout(function () {
        me.trigger('ready');
    }, 0);
};

/**
 * Event listener (singleton)
 */
links.events = links.events || {
    'listeners': [],

    /**
     * Find a single listener by its object
     * @param {Object} object
     * @return {Number} index  -1 when not found
     */
    'indexOf': function (object) {
        var listeners = this.listeners;
        for (var i = 0, iMax = this.listeners.length; i < iMax; i++) {
            var listener = listeners[i];
            if (listener && listener.object == object) {
                return i;
            }
        }
        return -1;
    },

    /**
     * Add an event listener
     * @param {Object} object
     * @param {String} event       The name of an event, for example 'select'
     * @param {function} callback  The callback method, called when the
     *                             event takes place
     */
    'addListener': function (object, event, callback) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (!listener) {
            listener = {
                'object': object,
                'events': {}
            };
            this.listeners.push(listener);
        }

        var callbacks = listener.events[event];
        if (!callbacks) {
            callbacks = [];
            listener.events[event] = callbacks;
        }

        // add the callback if it does not yet exist
        if (callbacks.indexOf(callback) == -1) {
            callbacks.push(callback);
        }
    },

    /**
     * Remove an event listener
     * @param {Object} object
     * @param {String} event       The name of an event, for example 'select'
     * @param {function} callback  The registered callback method
     */
    'removeListener': function (object, event, callback) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (listener) {
            var callbacks = listener.events[event];
            if (callbacks) {
                var index = callbacks.indexOf(callback);
                if (index != -1) {
                    callbacks.splice(index, 1);
                }

                // remove the array when empty
                if (callbacks.length == 0) {
                    delete listener.events[event];
                }
            }

            // count the number of registered events. remove listener when empty
            var count = 0;
            var events = listener.events;
            for (var e in events) {
                if (events.hasOwnProperty(e)) {
                    count++;
                }
            }
            if (count == 0) {
                delete this.listeners[index];
            }
        }
    },

    /**
     * Remove all registered event listeners
     */
    'removeAllListeners': function () {
        this.listeners = [];
    },

    /**
     * Trigger an event. All registered event handlers will be called
     * @param {Object} object
     * @param {String} event
     * @param {Object} properties (optional)
     */
    'trigger': function (object, event, properties) {
        var index = this.indexOf(object);
        var listener = this.listeners[index];
        if (listener) {
            var callbacks = listener.events[event];
            if (callbacks) {
                for (var i = 0, iMax = callbacks.length; i < iMax; i++) {
                    callbacks[i](properties);
                }
            }
        }
    }
};

/** ------------------------------------------------------------------------ **/

/**
 * Image Loader service.
 * can be used to get a callback when a certain image is loaded
 *
 */
links.imageloader = (function () {
    var urls = {};  // the loaded urls
    var callbacks = {}; // the urls currently being loaded. Each key contains 
    // an array with callbacks

    /**
     * Check if an image url is loaded
     * @param {String} url
     * @return {boolean} loaded   True when loaded, false when not loaded
     *                            or when being loaded
     */
    function isLoaded (url) {
        if (urls[url] == true) {
            return true;
        }

        var image = new Image();
        image.src = url;
        if (image.complete) {
            return true;
        }

        return false;
    }

    /**
     * Check if an image url is being loaded
     * @param {String} url
     * @return {boolean} loading   True when being loaded, false when not loading
     *                             or when already loaded
     */
    function isLoading (url) {
        return (callbacks[url] != undefined);
    }

    /**
     * Load given image url
     * @param {String} url
     * @param {function} callback
     * @param {boolean} sendCallbackWhenAlreadyLoaded  optional
     */
    function load (url, callback, sendCallbackWhenAlreadyLoaded) {
        if (sendCallbackWhenAlreadyLoaded == undefined) {
            sendCallbackWhenAlreadyLoaded = true;
        }

        if (isLoaded(url)) {
            if (sendCallbackWhenAlreadyLoaded) {
                callback(url);
            }
            return;
        }

        if (isLoading(url) && !sendCallbackWhenAlreadyLoaded) {
            return;
        }

        var c = callbacks[url];
        if (!c) {
            var image = new Image();
            image.src = url;

            c = [];
            callbacks[url] = c;

            image.onload = function (event) {
                urls[url] = true;
                delete callbacks[url];

                for (var i = 0; i < c.length; i++) {
                    c[i](url);
                }
            }
        }

        if (c.indexOf(callback) == -1) {
            c.push(callback);
        }
    }

    /**
     * Load a set of images, and send a callback as soon as all images are
     * loaded
     * @param {String[]} urls
     * @param {function } callback
     * @param {boolean} sendCallbackWhenAlreadyLoaded
     */
    function loadAll (urls, callback, sendCallbackWhenAlreadyLoaded) {
        // list all urls which are not yet loaded
        var urlsLeft = [];
        urls.forEach(function (url) {
            if (!isLoaded(url)) {
                urlsLeft.push(url);
            }
        });

        if (urlsLeft.length) {
            // there are unloaded images
            var countLeft = urlsLeft.length;
            urlsLeft.forEach(function (url) {
                load(url, function () {
                    countLeft--;
                    if (countLeft == 0) {
                        // done!
                        callback();
                    }
                }, sendCallbackWhenAlreadyLoaded);
            });
        }
        else {
            // we are already done!
            if (sendCallbackWhenAlreadyLoaded) {
                callback();
            }
        }
    }

    /**
     * Recursively retrieve all image urls from the images located inside a given
     * HTML element
     * @param {Node} elem
     * @param {String[]} urls   Urls will be added here (no duplicates)
     */
    function filterImageUrls (elem, urls) {
        var child = elem.firstChild;
        while (child) {
            if (child.tagName == 'IMG') {
                var url = child.src;
                if (urls.indexOf(url) == -1) {
                    urls.push(url);
                }
            }

            filterImageUrls(child, urls);

            child = child.nextSibling;
        }
    }

    return {
        'isLoaded': isLoaded,
        'isLoading': isLoading,
        'load': load,
        'loadAll': loadAll,
        'filterImageUrls': filterImageUrls
    };
})();


/** ------------------------------------------------------------------------ **/


/**
 * Add and event listener. Works for all browsers
 * @param {Element} element    An html element
 * @param {string}      action     The action, for example "click",
 *                                 without the prefix "on"
 * @param {function}    listener   The callback function to be executed
 * @param {boolean}     useCapture
 */
links.Timeline.addEventListener = function (element, action, listener, useCapture) {
    if (element.addEventListener) {
        if (useCapture === undefined)
            useCapture = false;

        if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
            action = "DOMMouseScroll";  // For Firefox
        }

        element.addEventListener(action, listener, useCapture);
    } else {
        element.attachEvent("on" + action, listener);  // IE browsers
    }
};

/**
 * Remove an event listener from an element
 * @param {Element}  element   An html dom element
 * @param {string}       action    The name of the event, for example "mousedown"
 * @param {function}     listener  The listener function
 * @param {boolean}      useCapture
 */
links.Timeline.removeEventListener = function(element, action, listener, useCapture) {
    if (element.removeEventListener) {
        // non-IE browsers
        if (useCapture === undefined)
            useCapture = false;

        if (action === "mousewheel" && navigator.userAgent.indexOf("Firefox") >= 0) {
            action = "DOMMouseScroll";  // For Firefox
        }

        element.removeEventListener(action, listener, useCapture);
    } else {
        // IE browsers
        element.detachEvent("on" + action, listener);
    }
};


/**
 * Get HTML element which is the target of the event
 * @param {Event} event
 * @return {Element} target element
 */
links.Timeline.getTarget = function (event) {
    // code from http://www.quirksmode.org/js/events_properties.html
    if (!event) {
        event = window.event;
    }

    var target;

    if (event.target) {
        target = event.target;
    }
    else if (event.srcElement) {
        target = event.srcElement;
    }

    if (target.nodeType != undefined && target.nodeType == 3) {
        // defeat Safari bug
        target = target.parentNode;
    }

    return target;
};

/**
 * Stop event propagation
 */
links.Timeline.stopPropagation = function (event) {
    if (!event)
        event = window.event;

    if (event.stopPropagation) {
        event.stopPropagation();  // non-IE browsers
    }
    else {
        event.cancelBubble = true;  // IE browsers
    }
};


/**
 * Cancels the event if it is cancelable, without stopping further propagation of the event.
 */
links.Timeline.preventDefault = function (event) {
    if (!event)
        event = window.event;

    if (event.preventDefault) {
        event.preventDefault();  // non-IE browsers
    }
    else {
        event.returnValue = false;  // IE browsers
    }
};


/**
 * Retrieve the absolute left value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} left        The absolute left position of this element
 *                              in the browser page.
 */
links.Timeline.getAbsoluteLeft = function(elem) {
    var doc = document.documentElement;
    var body = document.body;

    var left = elem.offsetLeft;
    var e = elem.offsetParent;
    while (e != null && e != body && e != doc) {
        left += e.offsetLeft;
        left -= e.scrollLeft;
        e = e.offsetParent;
    }
    return left;
};

/**
 * Retrieve the absolute top value of a DOM element
 * @param {Element} elem        A dom element, for example a div
 * @return {number} top        The absolute top position of this element
 *                              in the browser page.
 */
links.Timeline.getAbsoluteTop = function(elem) {
    var doc = document.documentElement;
    var body = document.body;

    var top = elem.offsetTop;
    var e = elem.offsetParent;
    while (e != null && e != body && e != doc) {
        top += e.offsetTop;
        top -= e.scrollTop;
        e = e.offsetParent;
    }
    return top;
};

/**
 * Get the absolute, vertical mouse position from an event.
 * @param {Event} event
 * @return {Number} pageY
 */
links.Timeline.getPageY = function (event) {
    if ('pageY' in event) {
        return event.pageY;
    }
    else {
        var clientY;
        if (('targetTouches' in event) && event.targetTouches.length) {
            clientY = event.targetTouches[0].clientY;
        }
        else {
            clientY = event.clientY;
        }

        var doc = document.documentElement;
        var body = document.body;
        return clientY +
            ( doc && doc.scrollTop || body && body.scrollTop || 0 ) -
            ( doc && doc.clientTop || body && body.clientTop || 0 );
    }
};

/**
 * Get the absolute, horizontal mouse position from an event.
 * @param {Event} event
 * @return {Number} pageX
 */
links.Timeline.getPageX = function (event) {
    if ('pageY' in event) {
        return event.pageX;
    }
    else {
        var clientX;
        if (('targetTouches' in event) && event.targetTouches.length) {
            clientX = event.targetTouches[0].clientX;
        }
        else {
            clientX = event.clientX;
        }

        var doc = document.documentElement;
        var body = document.body;
        return clientX +
            ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) -
            ( doc && doc.clientLeft || body && body.clientLeft || 0 );
    }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
links.Timeline.addClassName = function(elem, className) {
    var classes = elem.className.split(' ');
    if (classes.indexOf(className) == -1) {
        classes.push(className); // add the class to the array
        elem.className = classes.join(' ');
    }
};

/**
 * add a className to the given elements style
 * @param {Element} elem
 * @param {String} className
 */
links.Timeline.removeClassName = function(elem, className) {
    var classes = elem.className.split(' ');
    var index = classes.indexOf(className);
    if (index != -1) {
        classes.splice(index, 1); // remove the class from the array
        elem.className = classes.join(' ');
    }
};

/**
 * Check if given object is a Javascript Array
 * @param {*} obj
 * @return {Boolean} isArray    true if the given object is an array
 */
// See http://stackoverflow.com/questions/2943805/javascript-instanceof-typeof-in-gwt-jsni
links.Timeline.isArray = function (obj) {
    if (obj instanceof Array) {
        return true;
    }
    return (Object.prototype.toString.call(obj) === '[object Array]');
};

/**
 * parse a JSON date
 * @param {Date | String | Number} date    Date object to be parsed. Can be:
 *                                         - a Date object like new Date(),
 *                                         - a long like 1356970529389,
 *                                         an ISO String like "2012-12-31T16:16:07.213Z",
 *                                         or a .Net Date string like
 *                                         "\/Date(1356970529389)\/"
 * @return {Date} parsedDate
 */
links.Timeline.parseJSONDate = function (date) {
    if (date == undefined) {
        return undefined;
    }

    //test for date
    if (date instanceof Date) {
        return date;
    }

    // test for MS format.
    // FIXME: will fail on a Number
    var m = date.match(/\/Date\((-?\d+)([-\+]?\d{2})?(\d{2})?\)\//i);
    if (m) {
        var offset = m[2]
            ? (3600000 * m[2]) // hrs offset
            + (60000 * m[3] * (m[2] / Math.abs(m[2]))) // mins offset
            : 0;

        return new Date(
            (1 * m[1]) // ticks
                + offset
        );
    }

    // failing that, try to parse whatever we've got.
    return Date.parse(date);
};

links.Timeline.formatData = function(data) {
    /* ------------------------------------
      {
        "type" : "",
        "data" : {
          "title" : "",
          "desc" : "",
          "imgB64" : "",
          "imgClass" : ""
        },
        "events" : {
          "created" : {
            "d" : #,
            "t"|"l"|"lbl" : ""
          }
        }
      }
    ------------------------------------ */
    
    var newData = [], element, newElement, 
        events, event, eventType, dataTmp, eventDataTmp;
    for(var l = data.length; l--;) {
        element = data[l] || {};
        dataTmp = element.data || {};
        events = element.events || [];

        newElement = {};
        newElement.type = element.type;
        newElement.ek = element.ek;

        newElement.title = dataTmp.title;
        newElement.desc = dataTmp.desc;
        newElement.imgB64 = dataTmp.imgB64;
        newElement.imgClass = dataTmp.imgClass;

        for(eventType in events) {
            if(events.hasOwnProperty(eventType)) {
                event = events[eventType];
                eventDataTmp = {
                    start: new Date(event.d||event.date),
                    label: event.t || event.l || event.lbl || event.label, 
                    color: event.cb || event.color || event.bgColor,
                    labelColor: event.cf,
                    eventType: eventType
                };
                newData.push($.extend(true,{},newElement,eventDataTmp));
            }
        }
        
    }
    return newData;
}