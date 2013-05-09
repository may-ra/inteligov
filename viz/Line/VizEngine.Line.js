(function() {
 
 	var version = "0.0.1", VizEngine = {};

/** <Viz> **/
VizEngine.Viz = function Viz(type,version) {
    this.getType = function(){return type;};
    this.getVersion = function(){return version;};
}
VizEngine.Viz.prototype.getInfo = function(){
	return [this.getType(),this.getVersion()].join('::');
}
/** </Viz> **/

/** <Line> **/
VizEngine.Line = function Line(container) {
	var items, valueLine, focus, 
		detailDateFormat = d3.time.format("%d/%m/%y"), detailValueFormat = d3.format(",.2f"),
		bisectDate = d3.bisector(function(d) { return d.ts; }).left;

	function _draw(lineFactory,options){
		var path, pathEl, pathLength, color = d3.rgb(options.color), borderColor = color.darker();

		focus = container.append("g").attr("class", "focus").style("display", "none");
	    focus.append("svg:circle").attr("class","circle focus").attr("r",4).style("stroke",borderColor.toString());
		focus.append("svg:text").attr("class","text focus").attr("x",-40).attr("dy",-7);

		valueLine = container.append("svg:line")
		    .attr("class","focus line")
		    .attr("x1", 35)
		    .attr("y1", 0)
		    .attr("x2", 0)
		    .attr("y2", 0);

		path =  container.append("svg:path")
	      .datum(items)
	      .attr("class", "line")
	      .style("stroke",options.color)
	      .attr("d",lineFactory);

	    pathEl = path.node();
		pathLength = pathEl.getTotalLength();

	    path
			.attr("stroke-dasharray", pathLength + " " + pathLength)
			.attr("stroke-dashoffset", pathLength)
			.transition()
			.duration(2000)
			.ease("linear")
			.attr("stroke-dashoffset", 0);
	} 

	function _findItemByDate(timeStamp){
		var i = bisectDate(items,timeStamp,1),
			item0 = items[i - 1]; item1 = items[i];
		return  timeStamp - item0.ts > item1.ts - timeStamp ? item1 : item0;
	}

	this.render = function render(data,lineFactory,options) {
		items = data;
	  	items.sort(function(a,b){return d3.ascending(a.ts,b.ts);});
	  	_draw(lineFactory,options);
	}

	this.onMouseMove = function onMouseMove(date,coordsAt){
		var item = _findItemByDate(date.getTime()), coords; 

		if(item){
			coords = coordsAt(item);

	        focus
	        .attr("transform", "translate(" + coords.join(",") + ")")
			.select("text").text(detailValueFormat(item.value) + " (" + detailDateFormat(new Date(item.ts)) + ")");

			valueLine
	        .attr("x2",coords[0]-3)
	        .attr("y1",coords[1]).attr("y2",coords[1]);
	    }
	}

	this.onClick = function onClick(date){
		return _findItemByDate(date.getTime());
	}
}
VizEngine.Line.prototype = new VizEngine.Viz("VizEngine.Line","0.0.1");
/** </Line> **/

/** <Progression> **/
VizEngine.Progression = function Progression(container) {

	var width = container.width, height = container.height, innerHeight, offsetLeft = container.offsetLeft,
		lines = [], dateFormat = d3.time.format("%m/%y"),
		options, xScale = d3.time.scale(), yScale = d3.scale.linear(),
		lineFactory = d3.svg.line().x(function(d){ return xScale(d.ts); }).y(function(d){ return yScale(d.value); });


	function _setOptions(opts) {
		options = opts;
		width = opts.width || width || 520;
		height = opts.height || height || 320;
		innerHeight = height - 15;
		this.options = options;
	}

	function _draw() {
		var overlay, that = this, options = this.options,
			svg = d3.select(container).append("svg").attr("width", width).attr("height", height);

		svg.append("g")
			.attr("transform", "translate(10,"+(height-10)+")")
			.attr("class", "axis x")
			.call(
			    d3.svg.axis().scale(xScale)
			    .orient("bottom")
			    .ticks(d3.time[options.xUnit],options.xStep)
			    .tickFormat(dateFormat)
			    .tickSize(0)
			    .tickPadding(0)
			);

		svg.append("g")
			.attr("transform","translate(15,0)")
			.attr("class", "axis y")
			.call(
			    d3.svg.axis().scale(yScale)
			    .orient("right")
			    .ticks(5)
			    .tickSize(0)
			    .tickPadding(0)
			    .tickSubdivide(0)
			);

		return svg;
	}

	function _drawOverlay(container){
		overlay = container.append("rect")
			.attr("class", "overlay")
			.attr("x",50)
			.attr("width", width-100)
			.attr("height", height-15);

	    overlay
			.on("mouseover", function() { container.selectAll(".focus").style("display", null); })
			.on("mouseout", function() { container.selectAll(".focus").style("display", "none"); })
			.on("mousemove",this.onMouseMove)
			.on("click", this.onClick);
	}

	this.onClick = function() {
		var x = d3.event.pageX - offsetLeft,
			date = xScale.invert(x),
			items = [], onClick = options.onClick;
		/* dispatch event to all lines in the chart */
	    for(var l = lines.length; l--;) {
	    	items.push(lines[l].onClick(date));
	    }
	    onClick && $.isFunction(onClick) && onClick(items);
	}

	this.onMouseMove = (function(coordsFactory) {
		return function(x) {
			var x = d3.event.pageX - offsetLeft,
				date = xScale.invert(x);
			/* dispatch event to all lines in the chart */
		    for(var l = lines.length; l--;) {
		    	lines[l].onMouseMove(date,coordsFactory);
		    }
		};
	})(function(item){ return [xScale(item.ts),yScale(item.value)]; })

	this.render = function(data,options) { 
		var items = data.values, item, group, line, container, i;
			
		var parseDate = d3.time.format("%d-%b-%y").parse;

		_setOptions.call(this,options||{});

		for(i = items.length; i--;) {
			item = items[i];
			item.ts = parseDate(item.d||item.date).getTime();
			//item.ts = item.d||item.date;
			//item.dt = new Date(item.ts);
			item.value = item.close;
		}

		items.sort(function(x,y){ return d3.ascending(x.ts,y.ts); });
		xScale.range([50,width-50]).domain(d3.extent(items,function(item){return item.ts;}));
	    yScale.range([innerHeight,25]).nice().domain(d3.extent(items, function(item) { return item.value; }));

	    container = _draw.call(this);

		var groups = d3.nest()
			.key(function(item){ return item.g||item.group; })
			.map(items,d3.map);

		var entries = groups.entries();

	    for(var i = entries.length; i--;) {
	    	group = entries[i];
	    	line = new VizEngine.Line(container);
	    	lines.push(line);
	    	line.render(group.value,lineFactory,{color:data.color[group.key],label:group.key});
	    }

	    /* [IMPORTANT] add on top of all other elements */
	    _drawOverlay.call(this,container);
	}

}
VizEngine.Progression.prototype = new VizEngine.Viz("VizEngine.Progression","0.0.1");
/** </Progression> **/

 window.VizEngine = VizEngine;

})();