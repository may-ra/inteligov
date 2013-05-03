/** ------------------------------------------------------------------------ **/

/*
 * @constructor  inteli.gov.TimeLine.ContentGenerator
 * The class ContentGenerator is constructor for content inside the bubbles in the ItemBox class.
 * 
 * If factory is provided and is inside the list of contents it works returning the object with
 * the generator asked for.
 * 
 * If factory is no provided it takes de default factory and returns it.
 * 
 * @param {data}
 *		Object containing the specific data, if not data provided it creates an empty object
 *		Otherwise it just add the data to data property
 *
 * @param {factory}
 *		If factory is provided, ContentFactory checks for the existence on the register of the factory
 *		and creates a new object of that factory with the specific data for.
 *
*/

inteli.gov.TimeLine.ContentGenerator = function(data, factory){
	factory ? this = new inteli.gov.TimeLine.ContentFactory(data, factory) : this = new inteli.gov.TimeLine.ContentFactory(data);
};


inteli.gov.TimeLine.ContentGenerator.prototype.generate = function(data,factory){
	data && factory ? this.generate.apply(this, data, factory) : this.generate.apply(this, data);
};

inteli.gov.TimeLine.ContentGenerator.prototype.get = function(){

}

inteli.gov.TimeLine.ContentGenerator.prototype.getFactory = function(){
	return this.factory;
};

inteli.gov.TimeLine.ContentGenerator.prototype.setFactory = function(factory){
	factory && (this.factory = factory);
};

inteli.gov.TimeLine.ContentGenerator.prototype.registerFactory = function(factory){
	factory && inteli.gov.TimeLine.ContentGenerator.ContentFactory[factory] = factory;
};