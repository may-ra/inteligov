links.TimeLine.ContentGenerator = function(factory){
	this.factory = factory;
};

links.TimeLine.ContentGenerator.prototype.generate = function(data){
	this.get(data);
}

links.TimeLine.ContentGenerator.prototype.get = function(data){
	return data && this.factory && this.factory.get && this.factory.get.call(this,data);
}

links.TimeLine.ContentGenerator.prototype.getFactory = function(){
	return this.factory;
};

links.TimeLine.ContentGenerator.prototype.setFactory = function(factory){
	factory && (this.factory = factory);
};