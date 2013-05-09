(function() {
 
 var version = "0.0.1",
     VizEngine = {};
 
 VizEngine.Viz = function Viz(type,version) {
    this.getType = function(){return type;};
    this.getVersion = function(){return version;};
 }

/** <Donut> **/
  VizEngine.Donut = function Donut(container) {

        var width = container.offsetWidth,
            height = container.offsetHeight,
            color = d3.scale.category10(),
            partition = d3.layout.partition().children(function(d){return d.children;}).value(function(d){return d.value;}).sort(null),
            pie = d3.layout.pie().sort(null).value(function(d) { return d.value; }),
            dataNodes, dataLinks, root, total, donutData = [], oldDonutData = [],
            radius, innerRadius, arc, outerArc, innerArc, svg, 
            innerGroup, outerGroup, totalLabel, descLabel,
            onClick, onReady;

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

          paths.enter().append("svg:path");

          paths
            .style("fill-opacity",0.2)
            .style("fill", function(d){ return d.data.color || d.data.cb || color(d.data.label)})
            .transition().duration(750)
            .attrTween("d",function(d){return simpleArcTweenBuilder(arc)(d);});

          paths.exit()
            .transition().duration(750)
            .attrTween("d",function(d){return arcRemoveTweenBuilder(arc)(d);})
            .remove();

          return paths;
      }

      function draw(nodes) {
          var paths = g.selectAll("path").data(pie(nodes.children)),
              parent = nodes.parent, that = this;
          
          totalLabel.text(nodes.value);
          descLabel.text(nodes.label);

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
                descLabel.text(data.label);

                pie.startAngle(e.startAngle).endAngle(e.endAngle);
                children && drawHelper(innerGroup,innerArc,children);
            })
            .on("mouseout", function(e){
                var parent = e.data.parent;
                drawHelper(innerGroup,innerArc,[]);
                d3.select(this).style("fill-opacity",0.4);
                totalLabel.text(parent.value);
                descLabel.text(parent.label);
            })
            .on("click", function(e){
                var data = e.data;
                if(data.children){
                    that.onClick(data.ek);
                    pie.startAngle(0).endAngle(2*Math.PI);
                    draw.call(that,data);
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
              .style("fill", data.color || data.cb || color(data.label));
          });
          
          parent && outerGroup
          .on("click",function(){
              pie.startAngle(0).endAngle(2*Math.PI);
              draw.call(that,parent);
              that.onClick(nodes.ek);
              drawHelper(outerGroup,outerArc,parent.parent||[]);
              totalLabel.text(nodes.parent.value);
          });
      }

      function initialize(options) {
        width = options.width || width || 100;
        height = options.height || height || 100;

        radius = Math.min(width, height) / 2;
        innerRadius = radius - (radius/3);

        arc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .outerRadius(radius - ((radius-innerRadius)/3))
        .innerRadius(innerRadius);

        outerArc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .outerRadius(radius)
        .innerRadius(radius - ((radius-innerRadius)/3));

        innerArc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .outerRadius(innerRadius)
        .innerRadius(innerRadius - ((radius-innerRadius)/4));


        svg = d3.select(container).append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        innerGroup = svg.append("svg:g").attr("class", "arc inner");
        outerGroup = svg.append("svg:g").attr("class", "arc outer");

        /* innerLabel */
        whiteCircle = innerGroup.append("svg:circle")
        .attr("fill", "white")
        .attr("r", innerRadius);

        totalLabel = innerGroup.append("svg:text")
        .attr("class", "slice value")
        .attr("dy", 25)
        .attr("text-anchor", "middle"); // text-align: right;

        descLabel = innerGroup.append("svg:text")
        .attr("class", "slice label")
        .attr("dy", 0)
        .attr("text-anchor", "middle"); 
        /* ---------- */

        g = svg.append("svg:g").attr("class","arc");
        innerG = svg.append("svg:g").attr("class","arc inner");

        partition.size([width,height]);

        this.onClick = options.onClick || $.noop;
        this.onReady = options.onReady || $.noop;
      }

      function setData(data) {
        var datum

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

        dataNodes = partition.nodes(data); 
        dataLinks = partition.links(dataNodes);
        root      = dataLinks[0].source;

        draw.call(this,root);
      }

      this.render = function(data, options) {
          initialize.call(this,options||{});
          setData.call(this,data);     
      }
  
  }
  VizEngine.Donut.prototype = new VizEngine.Viz("VizEngine.Donut","0.0.1");
  /** </Donut> **/

  /** <Timeline> **/
  VizEngine.Timeline = function Timeline(container) {

    var timeline = new links.Timeline(conatainer);

    this.render = function(data,options){
      timeline.draw(data,options);
      links.events.addListener(timeline, 'select', options.onClick||$.noop);
      links.events.addListener(timeline, 'ready', options.onReady||$.noop)
    }

  }
  VizEngine.Timeline.prototype = new VizEngine.Viz("VizEngine.Timeline","0.0.1");
  /** </Timeline> **/

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