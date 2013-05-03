/** ------------------------------------------------------------------------ **/

/*
 * @constructor  links.Timeline.ContentGenerator
 * The class ContentGenerator is constructor for content inside the bubbles in the ItemBox class.
 * It's main function is to create a visual content and let the ItemBox add this to the bubble.
 * 
 * If generator is provided and is inside the list of contents it works returning the object with
 * the generator asked for.
 * 
 * If generator is no provided it takes de default generator and returns it.
 * 
 * @param {Generator}
 *
*/

links.TimeLine.ContentGenerator = function(data,config){
	if(data){
		this.factory = data.factory;
		this.type = data.type;

	}
	/*
	(generator != undefined && generator instanceof Generator) &&	
		this.Generator = new Generator(generator);
	*/
};

links.TimeLine.ContentGenerator.prototype.generate = function(){};
links.TimeLine.ContentGenerator.prototype.registerGenerator = function(){};
links.TimeLine.ContentGenerator.prototype.unregisterGenerator = function(){};