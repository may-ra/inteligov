var width = 100,
    height = 100,
    radius = Math.min(width, height) / 2,
    innerRadius = radius - (radius/3);

var color = d3.scale.category10();

var svg = d3.select("#d3viz").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var data = [{label:"v",value:20,g:"a",color:"#00aedb"},{label:"w",value:10,g:"a",color:"#a200ff"},{label:"x",value:50,g:"a",color:"#8ec127"},{label:"y",value:50,g:"a",color:"#d41243"},{label:"z",value:30,g:"b",color:"#f47835"}];

var groups = d3.nest().key(function(e){return e.g;}).entries(data), group;

data = {label:"groups",children:[]};
for(var l = groups.length; l--;) {
    group = groups[l];
    data.children.push({label:group.key,children:group.values});   
}

var partition = d3.layout.partition().children(function(d){return d.children;}).value(function(d){return d.value;}).size([300,300]);

var dataNodes = partition.nodes(data), dataLinks = partition.links(dataNodes);
var root = dataLinks[0].source;

var total = root.value;

//GROUP FOR CENTER TEXT  
var innerGroup = svg.append("svg:g")
  .attr("class", "arc inner");
var outerGroup = svg.append("svg:g")
  .attr("class", "arc outer");

var whiteCircle = innerGroup.append("svg:circle")
  .attr("fill", "white")
  .attr("r", innerRadius);
var totalLabel = innerGroup.append("svg:text")
  .attr("class", "slice value")
  .attr("dy", 4.5)
  .attr("text-anchor", "middle") // text-align: right
  .text(total);
// *** //

 var arc = d3.svg.arc()
    .startAngle(function(d){ return d.startAngle; })
    .endAngle(function(d){ return d.endAngle; })
    .outerRadius(radius - 6)
    .innerRadius(innerRadius);

 var outerArc = d3.svg.arc()
    .startAngle(function(d){ return d.startAngle; })
    .endAngle(function(d){ return d.endAngle; })
    .outerRadius(radius)
    .innerRadius(radius - 6);

 var innerArc = d3.svg.arc()
    .startAngle(function(d){ return d.startAngle; })
    .endAngle(function(d){ return d.endAngle; })
    .outerRadius(innerRadius - 1)
    .innerRadius(innerRadius - 6);

var pie = d3.layout.pie().value(function(d) { return d.value; });

var g = svg.append("svg:g").attr("class","arc");
var innerG = svg.append("svg:g").attr("class","arc inner");

var donutData = [], oldDonutData = [];

function arcTweenBuilder(p1,i) {
    var s0,e0, p0, l = oldDonutData.length, tmp;

    if(l) {
        if(i < l) {
            tmp = oldDonutData[i] || oldDonutData[i-1]; 
            s0 = tmp.startAngle;
            e0 = tmp.endAngle; 
        } else {
            s0 = e0 = oldDonutData[l-1].endAngle;
        }
    } else {
        s0 = e0 = 0;
    }
    p0 = { startAngle: s0, endAngle: e0 };    

    return function arcTween() {
        var i = d3.interpolate(p0,p1)
        return function(t) {
            return arc(i(t));
        };
    };
}

function arcRemoveTweenBuilder(arc) {
  var e0 = pie.endAngle(), s0 = pie.startAngle();
  return function arcRemoveTween(d) {
      var i = d3.interpolate(d, {startAngle: e0, endAngle: e0});
      console.log(d);
      return function(t) {
        return arc(i(t));
      };
  };
}

function simpleArcTweenBuilder(arc) {
    var e0 = pie.endAngle(), s0 = pie.startAngle();
    return function simpleArcTween(d){
        var i = d3.interpolate({startAngle:s0,endAngle:s0},d);
        return function(t) {
            return arc(i(t));
        };
    };
}

function drawHelper(group,arc,nodes) {
    var paths = group.selectAll("path").data(pie(nodes));
    
    paths
    .enter().append("svg:path");
    
    paths
    .style("fill-opacity",0.1)
    .style("fill", function(d){ return d.data.color || color(d.data.label)})
    .transition().duration(750)
    .attrTween("d",function(d){return simpleArcTweenBuilder(arc)(d);});
    
    paths.exit()
    .transition().duration(500)
    .attrTween("d",function(d){return arcRemoveTweenBuilder(arc)(d);})
    .remove();
    
    return paths;
}

(function draw(nodes){
    var paths = g.selectAll("path").data(pie(nodes.children)),
        parent = nodes.parent; 
    
    oldDonutData = donutData.length? donutData.slice(0) : [];
    donutData = [];
    
    paths
    .enter().append("svg:path")
      .style("fill-opacity",0.4)
      .on("mouseover", function(e){
          var element = d3.select(this), data = e.data,
              children = data.children, innerPaths;
          
          element.style("fill-opacity",0.7);
          totalLabel.text(e.value);

          pie.startAngle(e.startAngle).endAngle(e.endAngle);
          children && drawHelper(innerGroup,innerArc,children);
      })
      .on("mouseout", function(e){
          drawHelper(innerGroup,innerArc,[]);
          d3.select(this).style("fill-opacity",0.4);
          totalLabel.text(e.data.parent.value);
      })
      .on("click", function(e){
          var data = e.data;
          if(data.children){
              pie.startAngle(0).endAngle(2*Math.PI);
              draw(data);
              drawHelper(outerGroup,outerArc,[data]);
          }
      });
    
    g
    .on("click",function(){
        drawHelper(innerGroup,innerArc,[]);
    });
     
    paths
    .exit().transition().duration(1000)
    .attrTween("d",function(d){
        return arcRemoveTweenBuilder(arc)(d);
    }).remove();
    
    paths.each(function(d,i) {
        var element = d3.select(this),
            data = d.data,
            p = donutData[i] = {startAngle: d.startAngle, endAngle: d.endAngle};
        element
        .transition().duration(1000)
        .attrTween("d",arcTweenBuilder(p,i))
        .style("fill", data.color || color(data.label));
    });
    
    parent && outerGroup
    .on("click",function(){
        var parent = nodes.parent;
        pie.startAngle(0).endAngle(2*Math.PI);
        draw(parent);
        drawHelper(outerGroup,outerArc,parent.parent||[]);
        totalLabel.text(nodes.parent.value);
    });
})(root)