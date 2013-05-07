<html>
<head><title>stackedBars</title></head>
<body>

<div id="d3SBtest"></div>
<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>	
<script>
var data = [{
    "date": "5/1854",
    "wounds": 0,
    "other": 95,
    "disease": 105
}, {
    "date": "6/1854",
    "wounds": 0,
    "other": 40,
    "disease": 95
}, {
    "date": "7/1854",
    "wounds": 0,
    "other": 140,
    "disease": 520
}, {
    "date": "8/1854",
    "wounds": 20,
    "other": 150,
    "disease": 800
}, {
    "date": "9/1854",
    "wounds": 220,
    "other": 230,
    "disease": 740
}, {
    "date": "10/1854",
    "wounds": 305,
    "other": 310,
    "disease": 600
}, {
    "date": "11/1854",
    "wounds": 480,
    "other": 290,
    "disease": 820
}, {
    "date": "12/1854",
    "wounds": 295,
    "other": 310,
    "disease": 1100
}, {
    "date": "1/1855",
    "wounds": 230,
    "other": 460,
    "disease": 1440
}, {
    "date": "2/1855",
    "wounds": 180,
    "other": 520,
    "disease": 1270
}, {
    "date": "3/1855",
    "wounds": 155,
    "other": 350,
    "disease": 935
}, {
    "date": "4/1855",
    "wounds": 195,
    "other": 195,
    "disease": 560
}, {
    "date": "5/1855",
    "wounds": 180,
    "other": 155,
    "disease": 550
}, {
    "date": "6/1855",
    "wounds": 330,
    "other": 130,
    "disease": 650
}, {
    "date": "7/1855",
    "wounds": 260,
    "other": 130,
    "disease": 430
}, {
    "date": "8/1855",
    "wounds": 290,
    "other": 110,
    "disease": 490
}, {
    "date": "9/1855",
    "wounds": 355,
    "other": 100,
    "disease": 290
}, {
    "date": "10/1855",
    "wounds": 135,
    "other": 95,
    "disease": 245
}, {
    "date": "11/1855",
    "wounds": 100,
    "other": 140,
    "disease": 325
}, {
    "date": "12/1855",
    "wounds": 40,
    "other": 120,
    "disease": 215
}, {
    "date": "1/1856",
    "wounds": 0,
    "other": 160,
    "disease": 160
}, {
    "date": "2/1856",
    "wounds": 0,
    "other": 100,
    "disease": 100
}, {
    "date": "3/1856",
    "wounds": 0,
    "other": 125,
    "disease": 90
}];

var links = {};
link.stackedBars = {};


function vizObj(value,date,color,label,group)
	{
		this.value = value;
		this.date = date;
		this.color = color;
		this.label = label;
		this.group = group;

		this.drawTable= drawTable
		function drawTable (vizObj)
		{
			var $bars = $( ) 

			var w = 960,
			    h = 500,
			    p = [20, 50, 30, 20],
			    x = d3.scale.ordinal().rangeRoundBands([0, w - p[1] - p[3]]),
			    y = d3.scale.linear().range([0, h - p[0] - p[2]]),
			    z = d3.scale.ordinal().range(["pink", "lightgreen", "lightblue"]),
			    parse = d3.time.format("%YYYY-%MM-%DD %HH:%MI:%SS").parse,
			    format = d3.time.format("%b");

			var svg = d3.select("#d3SBtest").append("svg:svg")
			    .attr("width", w)
			    .attr("height", h)
			    .append("svg:g")
			    .attr("transform", "translate(" + p[3] + "," + (h - p[2]) + ")");

			/*
			//define children elements
			data = {cause:"branches",children:[]};
			for(var b = branches.lenght; b--;) {
			    branch = branches[b];
			    data.children.push({cause:branch.key,children:branch.values});
			}

			//generate partitions N
			var elements = d3.layout.partition();

			type.children(function(d)
			                  {
			                      return d.children;
			                  }).value(function(d)
			                          {
                              return d.value;
                          }).sort(null).size([width,height]);*/


			// Transpose the data into layers by cause.
			var causes = d3.layout.stack()(["wounds", "other",
			    "disease"].map(function (cause) {
			        return data.map(function (d) {
			            return {
			                x: parse(d.date),
			                y: +d[cause]
			            };
			        });
			    }));

					x.domain(causes[0].map(function (d) {
		        return d.x;
		    }));
		    y.domain([0, d3.max(causes[causes.length - 1], function (d) {
		        return d.y0 + d.y;
		    })]);


		    // Add a group for each cause.
		    var cause = svg.selectAll("g.cause")
		        .data(causes)
		        .enter().append("svg:g")
		        .attr("class", "cause")
		        .style("fill", function (d, i) {
		        return z(i);
		    })
		        .style("stroke", function (d, i) {
		        return d3.rgb(z(i)).darker();
		           
		    });

		cause
		.on("mouseover",function(){
		    d3.select(this).selectAll("rect").style("fill-opacity",0.5);
		})
		.on("mouseout",function(){
		    d3.select(this).selectAll("rect").style("fill-opacity",1);
		})    
		.on("click",function(){
		    d3.select(this).selectAll("rect").style("fill-opacity",0.2);    
		});

		    // Add a rect for each date.
		    var rect = cause.selectAll("rect")
		        .data(Object)
		        .enter().append("svg:rect")
		        .attr("x", function (d) {
		        return x(d.x);
		    })
		        .attr("y", function (d) {
		        return -y(d.y0) - y(d.y);
		    })
		        .attr("height", 0)
		        .transition().duration(5000)
		    .attr("height", function (d) {
		        
		            return y(d.y);})
		        .attr("width", x.rangeBand());
		 

		    // Add a label per date.
		    var label = svg.selectAll("text")
		        .data(x.domain())
		        .enter().append("svg:text")
		        .attr("x", function (d) {
		        return x(d) + x.rangeBand() / 2;
		    })
		        .attr("y", 6)
		        .attr("text-anchor", "middle")
		        .attr("dy", ".71em")
		        .text(format);

		    // Add y-axis rules.
		    var rule = svg.selectAll("g.rule")
		        .data(y.ticks(5))
		        .enter().append("svg:g")
		        .attr("class", "rule")
		        .attr("transform", function (d) {
		        return "translate(0," + -y(d) + ")";
		    });

		    rule.append("svg:line")
		        .attr("x2", w - p[1] - p[3])
		        .style("stroke", function (d) {
		        return d ? "#fff" : "#000";
		    })
		        .style("stroke-opacity", function (d) {
		        return d ? .7 : null;
		    });

		    rule.append("svg:text")
		        .attr("x", w - p[1] - p[3] + 6)
		        .attr("dy", ".35em")
		        .text(d3.format(",d"));


					}

				}


var vizObject = new Bar({
	value:'',
	date:'',
	color:'',
	label:'',
	group:''
})




//define nodes and links
var DNodes = elements.nodes(data),
    links = elements.links(DNodes),
    root = links[0].source,
    total = root.value;

*/

    // Compute the x-domain (by date) and y-domain (by top).
    

</script>
</body>
</html>