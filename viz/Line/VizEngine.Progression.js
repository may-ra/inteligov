/** <Progression> **/
VizEngine.Progression = function Progression(container) {

	var width = container.width, height = container.height, innerHeight, offsetLeft = container.offsetLeft,
		svg, maxElements = 0, totalElements = 0, lines = [],
		xScale = d3.scale.linear(), yScale = d3.scale.linear(), xDateScale = d3.time.scale(),
		line = d3.svg.line().x(function(d,i){ return xScale(i); }).y(function(d){ return yScale(d.value); });


	function setOptions(options) {
		width = options.width || width || 620;
		height = options.height || height || 320;

		innerHeight = height - 15;
	}

	function _draw() {
		var overlay;

		svg = d3.select(container).append("svg").attr("width", width).attr("height", height);

		overlay = svg.append("rect")
			.attr("class", "overlay")
			.attr("x",50)
			.attr("width", width-100)
			.attr("height", height-15);

	    /*overlay
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
			});*/

		var ticks = xScale.ticks(xDateScale.ticks(d3.time.years,1).length);

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
			    d3.svg.axis().scale(yScale)
			    .orient("right")
			    .ticks(3)
			    .tickSize(0)
			    .tickPadding(0)
			    .tickSubdivide(0)
			);
	}

	this.render = function(data,options) {
		var items = data.values, item, totalElements = items.length, group;

		for(var l = items.length; l--;) {
			item = items[l];
			item.ts = item.d||item.date;
			item.date = new Date(item.ts);
		}

		setOptions(options);

		item.sort(function(x,y){ return d3.ascending(a.ts); });

		var groups = d3.nest()
			.keys(function(item){ return item.g||item.group; })
			.map(items,d3.map);

		maxElements = d3.max(
			$.map(groups.values(),function(group){ return group.length; })
		);

		xDateScale.domain(d3.extent(items,function(item){return item.date;}));
		xScale.range([50,width-50]).domain([0,maxElements]);
	    yScale.range([innerHeight,25]).nice().domain(d3.extent(items, function(item) { return item.value; }));

	    for(group in groups) {
	    	lines.push(
	    		new VizEngine.Line(groups[group],{line:line})
	    	);
	    }

	}

}
/** </Progression> **/