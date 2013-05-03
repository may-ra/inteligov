

	<div id="try"></div>

<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>		
<script>

var links = {};
links.TimeLine = {};


links.TimeLine.ContentGenerator.prototype.generate = function(data) {
	return this.factory && this.factory.get && this.factory.get.call(this, data);	
}


links.TimeLine.TableContentFactory = function() {

	var type = "links.TimeLine.TableContentFactory";
	this.getType = (function(type) { return function() { return type; }; })(type);

}
links.TimeLine.TableContentFactory.prototype.get = function(data) {

	var $table = $(
			"<table>",
			{
				css:{width:"155px", height:"60px", "border-collapse":"collapse"},
				"class":"timeline-event-detail"
			}
		),
		tdStyle = {"text-align":"center",height:"32px",padding:0},
		$descTR = $("<tr>").append(
			$(
				"<td>",
				{
					css:$.extend({"font-size":"10px"},tdStyle)
				}
			).append(
				$(
					"<div>",
					{
						css:{"margin-left":"16px","border-style":"solid","border-width":"0 1px 1px 1px",height:"100%"},
						text:data.desc,
						"class":"timeline-event-detail-description"
					}
				)
			).attr("colSpan",2)
		),
		$titleTR = 
		$("<tr>").append(
			data.img ?
			[
				$(
					"<td>",
					{
						css:{padding:0,height:"32px",width:"32px"}
					}
				).append(
					$(
						"<div>",
						{
							css:{"border-style":"solid","border-width":"1px",height:"100%"},
							"class":data.img
						}
					)
				),
				$(
					"<td>",
					{
						css:$.extend({"font-size":"12px",width:"120px"},tdStyle)
					}
				).append(
					$(
						"<div>",
						{
							css:{"margin-top":"12px","border-style":"solid","border-width":"1px 1px 1px 0",height:"20px"},
							text:data.title,
							"class":"timeline-event-detail-title"
						}
					)
				)
			]:
			$(
				"<td>",
				{
					css:{"font-size":"12px",width:"120px",height:"20px",padding:0,"text-align":"center"}
				}
			).append(
				$(
					"<div>",
					{
						css:{"border-style":"solid","border-width":"1px 1px 1px 1px",height:"20px"},
						text:data.title,
						"class":"timeline-event-detail-title"
					}
				)
			)
		), fragment = document.createDocumentFragment();

	$table.append(
		$titleTR,
		$descTR
	);

	fragment.appendChild($table[0]);

	return fragment;
}

var generator = new links.TimeLine.ContentGenerator(new links.TimeLine.TableContentFactory());
document.getElementById("try").appendChild(generator.generate({
		title:'asunto1', 
		desc:'describe al asunto', 
		name:'beto',
		img:'foto.png'
	}));

</script>