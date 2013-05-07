/** <Line> **/
VizEngine.Line = function Line(container) {

	var width  = container.offsetWidth,
      	height = container.offsetHeight,
      	xScale, yScale;

    var line = d3.svg.line()
	    .x(function(d,i) { return xScale(i); })
	    .y(function(d) { return y(d.close); });

    var _init = function initialize(options){

    }

	this.render = function(data,options) {

	}


}
VizEngine.Line.prototype = new VizEngine.Viz("VizEngine.Line","0.0.1");
/** </Line> **/