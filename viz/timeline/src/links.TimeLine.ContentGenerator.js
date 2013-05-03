

links.Timeline.ContentGenerator = function(factory){
	this.factory = factory;
};

links.Timeline.ContentGenerator.prototype.generate = function(data){
	this.get(data);
}

links.Timeline.ContentGenerator.prototype.get = function(data){
	return data && this.factory && this.factory.get && this.factory.get.call(this,data);
}

links.Timeline.ContentGenerator.prototype.getFactory = function(){
	return this.factory;
};

links.Timeline.ContentGenerator.prototype.setFactory = function(factory){
	factory && (this.factory = factory);
};