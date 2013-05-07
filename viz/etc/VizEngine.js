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
            radius, innerRadius, arc, outerArc, innerArc, svg, innerGroup, outerGroup, totalLabel, onClick, onReady;

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
        .attr("dy", 5)
        .attr("text-anchor", "middle"); // text-align: right;
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

 window.VizEngine = VizEngine;

})();