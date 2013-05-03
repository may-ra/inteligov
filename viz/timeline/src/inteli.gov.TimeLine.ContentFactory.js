/** ------------------------------------------------------------------------ **/

/*
 * @constructor  inteli.gov.TimeLine.ContentFactory
 * The class ContentFactory is constructor for content inside the bubbles in the ItemBox class.
 * 
 * @param {data}
 *
*/

inteli.gov.TimeLine.ContentGenerator.ContentFactory = function(data, factory){
	factory ? this = new inteli.gov.TimeLine.ContentFactory[factory](data) : this.data = data || {};
};

inteli.gov.TimeLine.ContentGenerator.ContentFactory.prototype = new inteli.gov.TimeLine.ContentGenerator();

inteli.gov.TimeLine.ContentGenerator.ContentFactory.prototype.generate = function(data,factory){
	factory ? (inteli.gov.TimeLine.ContentGenerator.ContentFactory[factory] && this.generate.apply(this,data)) : return;
};
