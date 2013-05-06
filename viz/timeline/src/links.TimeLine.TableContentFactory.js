

(function(type){

	links.Timeline.TableContentFactory = function() {}
	links.Timeline.TableContentFactory.prototype = new links.Timeline.ContentFactory(type);

	//TODO: update the layout by honoring the data structure provided by: lfsandoval@consistent.com.mx
	links.Timeline.TableContentFactory.prototype.get = function(data) {

		var borderColor = data.color.toString(),
			$table = $(
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
							"class":"timeline-event-detail timeline-event-detail-description"
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
								"class":[data.img, "timeline-event-detail timeline-event-detail-image"].join(" ")
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
								"class":"timeline-event-detail timeline-event-detail-title"
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
							"class":"timeline-event-detail timeline-event-detail-title"
						}
					)
				)
			), fragment = document.createDocumentFragment();

		$table.append(
			$titleTR,
			$descTR
		);

		$table.find("div.timeline-event-detail").css({"border-color":borderColor,"border-style":"outset"});

		fragment.appendChild($table[0]);

		return fragment;
	}

})("links.TimeLine.TableContentFactory");