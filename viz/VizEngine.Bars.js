/*<Bar>*/
VizEngine.Bar = function Bar(container) {     

var data = [{value:1,status:"a"}, {value:8,status:"b"}, {value:15,status:"c"}, {value:16,status:"d"}, {value:23,status:"e"}, {value:4200,status:"f"}];

var values = $.map(data, function(e){return e.value;}), vMax = d3.max(values), vMin = d3.min(values), sparse = (vMax - vMin) >= 40, tickDelta = 0;

var x = (sparse? d3.scale.log() : d3.scale.ordinal());
x.domain([sparse? 0.8 : 0, vMax]).range([0, 420]);

tickDelta+=5;

var ticksData = $.grep(x.ticks(10),function(v,i){
        return v%tickDelta === 0;
    });

this.setData(data);

while (ticksData.length > 10) {
    tickDelta+=5;
    console.log(tickDelta);
    ticksData = $.merge([ticksData.shift()],$.grep(ticksData,function(v,i){
        return v%tickDelta === 0;
    }));

var y = d3.scale.ordinal()
.domain(data.map(function(d){return d.status;}))
    .rangeBands([0, 120]);

var color = d3.scale.ordinal()
.domain(data.map(function(d){return d.status;}))
.range(["#B3B5B7","#2FB67C","#15C2EF","#BD8372","#F0565B","#F9A658"]);

var chart = d3.select("body").append("svg:svg")
        .attr("class", "chart")
        .attr("width", 440)
        .attr("height", 140)
        .append("g")
        .attr("transform", "translate(10,15)");

        chart.append("svg:g")
        .attr("class","ticks")
        .selectAll("g.tick")
        .data(ticksData)
        .enter().append("svg:g")
        .attr("class","tick")
        .each(function(d){
            var tick = d3.select(this);
            var dx = x(d);
            
        tick.append("path")
        .attr("class","tick")
        .attr("stroke-dasharray","1,3")
        .attr("d",["M",dx,0,"L",dx,120].join(" "))
        .style("stroke", "#ccc")
        .style("stroke-width",1);
        
        tick.append("text")
        .attr("class", "tick")
        .attr("x", x)
        .attr("y", 0)
        .attr("dy", -3)
        .attr("text-anchor", "middle")
        .style("cursor","pointer")
        .on("mouseenter", function(){
            tick.selectAll("path.tick")
            .style("stroke", "#FFFFFF")
            .attr("stroke-dasharray","1,1");
        })
        .on("mouseout", function(){
            tick.selectAll("path.tick")
            .style("stroke", "#ccc")
            .attr("stroke-dasharray","1,3");
        })
        .text(d);
        });
      
        chart.append("svg:g").attr("class", "bars")
        .selectAll("g.bar")
        .data(data)
        .enter().append("svg:g")
        .attr("class","bar")
        .on("mouseover", function() {d3.select(this).selectAll("rect.bar").style("fill-opacity",1)})
        .on("mouseout", function() {d3.select(this).selectAll("rect.bar").style("fill-opacity",0.4)})
        .each(function(d){
            var bar = d3.select(this);
            bar.append("rect")
        .attr("class","bar")
        .attr("y", y(d.status))
        .attr("height", y.rangeBand())
        .style("fill-opacity",0.4)
        .style("fill",color(d.status))
        .attr("width", 0)
        .transition().duration(1000)
        .attr("width", x(d.value));
        
        bar.append("text")
        .attr("class","bar")
        .attr("x", 0)
        .attr("y", y(d.status) + y.rangeBand() / 2)
        .attr("dx", -3) // padding-right
        .attr("dy", ".5em") // vertical-align: middle
        .attr("text-anchor", "end") // text-align: right
        .text(d.value)
        .transition().duration(1000)
        .attr("x", x(d.value));
    });

        chart.append("line")
        .attr("y1", 0)
        .attr("y2", 120)
        .style("stroke", "#FFFFFF"); 
        
                function setData(data) {
                if($.isArray(data)) {
                  var groups = d3.nest().key(function(e){return e.g || e.group;}).map(data, d3.map), 
                      length = groups.keys().length, group;

                    data = {label:'global'}
                    if(length === 1) {
                      data.children = groups.values()[0];
                    } else {
                      data.children = [];
                      for(group in groups) {
                        data.children.push({label:group,children:groups[group]});   
                      }
                    }
                }
        }       

      this.render = function(data) {
      initialize.call(this,options||{});
      getData.call(this,data);

}

VizEngine.Bar.prototype = new VizEngine.Viz("VizEngine.Bar","0.0.1");

