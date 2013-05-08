(function() {
 
 	var version = "0.0.1", VizEngine = {};/** <Viz> **/
VizEngine.Viz = function Viz(type,version) {
    this.getType = function(){return type;};
    this.getVersion = function(){return version;};
}
VizEngine.Viz.prototype.getInfo = function(){
	return [this.getType(),this.getVersion()].join('::');
}
/** </Viz> **//** <Line> **/
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
 window.VizEngine = VizEngine;

})();