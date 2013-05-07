/** <Viz> **/
VizEngine.Viz = function Viz(type,version) {
    this.getType = function(){return type;};
    this.getVersion = function(){return version;};
}
VizEngine.Viz.prototype.getInfo = function(){
	return [this.getType(),this.getVersion()].join('::');
}
/** </Viz> **/