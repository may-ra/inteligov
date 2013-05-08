/** <Line> **/
VizEngine.Line = function Line(container) {

	var width  = container.offsetWidth,
      	height = container.offsetHeight,
      	innerHeight,
      	xScale = d3.scale.linear(), 
      	yScale = d3.scale.linear(), 
      	xDateScale = d3.time.scale(),
      	line = d3.svg.line().x(function(d,i){ return xScale(i); }).y(function(d){ return yScale(d.value); });
      	dateFormat = d3.time.format("%m/%y"),
    	detailDateFormat = d3.time.format("%d/%m/%y"),
    	parseDate = d3.time.format("%d-%b-%y").parse;

    var line = d3.svg.line()
	    .x(function(d,i) { return xScale(i); })
	    .y(function(d) { return yScale(d.value); });

	var _onClick = function onClick(){

	}

    var _init = function initialize(data,options) {
    	width = options.width || width || 320;
    	height = options.height || height || 320;

    	innerHeight = height - 15;

    	svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

	  	xScale.domain([0,data.length]);
	    xDateScale.domain(d3.extent(data,function(d){return d.date||d.d;}));
	    yScale.domain(d3.extent(data, function(d) { return d.value; }));

	    focus = svg.append("g").attr("class", "focus").style("display", "none");

	    focus.append("svg:circle").attr("class","circle focus").attr("r",3.5);
		focus.append("svg:text").attr("class","text focus").attr("x",-40).attr("dy",-7);

		var lineH = svg.append("svg:line")
		    .attr("class","focus line")
		    .attr("x1", 35)
		    .attr("y1", 0)
		    .attr("x2", 0)
		    .attr("y2", 0);

		var lineV = svg.append("svg:line")
		    .attr("class","focus line")
		    .attr("x1", 0)
		    .attr("y1", innerHeight)
		    .attr("x2", 0)
		    .attr("y2", innerHeight);

		var overlay = svg.append("rect")
	      .attr("class", "overlay")
	      .attr("x",50)
	      .attr("width", width-100)
	      .attr("height", height-15);

		var path =  svg.append("svg:path")
	      .datum(data)
	      .attr("class", "line")
	      .attr("d", line);

	    var pathEl = path.node();
		var pathLength = pathEl.getTotalLength();
		var offsetLeft = container.offsetLeft;

	    path
			.attr("stroke-dasharray", pathLength + " " + pathLength)
			.attr("stroke-dashoffset", pathLength)
			.transition()
			.duration(2000)
			.ease("linear")
			.attr("stroke-dashoffset", 0);

		overlay
    		.on("mouseover", function() { svg.selectAll(".focus").style("display", null); })
    		.on("mouseout", function() { svg.selectAll(".focus").style("display", "none"); })
    		.on("mousemove", function() {
		        var x = d3.event.pageX - offsetLeft; 
		        var d = data[Math.floor(xScale.invert(x))],
		            dy = yScale(d.value);

		        if(d){
		            focus
		            .attr("transform", "translate(" + x + "," + dy + ")");
		            
		            focus.select("text").text(d.value + " (" + detailDateFormat(d.date) + ")");
		            
		            lineH
		            .attr("x2",x-3)
		            .attr("y1",dy).attr("y2",dy);
		            
		            lineV
		            .attr("y2",dy+3)
		            .attr("x1",x).attr("x2",x);
		        }
			});

		svg.append("g")
		.attr("transform", "translate(10,"+(height-10)+")")
		.attr("class", "x axis")
		.call(
		    d3.svg.axis().scale(xScale)
		    .orient("bottom")
		    .tickValues(ticks)
		    .tickFormat(
		        function(d){
		            return dateFormat(data[d].date);
		        }
		    )
		    .tickSize(0)
		    .tickPadding(0)
		);

		svg.append("g")
		.attr("transform","translate(15,0)")
		.attr("class", "y axis")
		.call(
		    d3.svg.axis().scale(y)
		    .orient("right")
		    .ticks(3)
		    .tickSize(0)
		    .tickPadding(2)
		    .tickSubdivide(0)
		);

	}    

	this.render = function(data,options) {
		var items = data.values, item;

		console.log(items);

		for(var l = items.length; l--;) {
			item = items[l];
			item.value = item.close;
			item.date = parseDate(item.date);
		}

	  	items.sort(function(a,b){return d3.ascending(a.date||a.d,b.date||b.d);});
	}


}
VizEngine.Line.prototype = new VizEngine.Viz("VizEngine.Line","0.0.1");
/** </Line> **/
