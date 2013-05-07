(function(type){
	links.Timeline.TableContentFactory = function(){};
	links.Timeline.TableContentFactory.prototype = new links.Timeline.ContentFactory(type);

	links.Timeline.TableContentFactory.prototype.get = function(data) {
		var borderColor = data.color.toString(),
		$table = $(
			"<table>",
			{
				css:{width:"155px", height:"100%", "border-collapse":"collapse"},
				"class":"timeline-event-detail"
			}
		).attr("cellspacing",0).attr("cellpadding",0),
		tdStyle = {"text-align":"center",height:"32px",padding:0},
		$titleTR = 
			$("<tr>").append(
				[ data.imgB64 ?
					$(
						"<td>",
						{
							css:$.extend({"font-size":"10px"},tdStyle)
						}
					).append(
						$(
							"<div>",
							{
								css:{"border-style":"solid","border-width":"1px"},
								"class":["timeline-event-detail","timeline-event-detail-image"].join(" ")
							}
						).append(
							$(
								"<img>",
								{
									css:{border:"none","border-width":0,height:"32px",width:"32px"},
									"src":"data:image/png;base64,"+data.imgB64
								}
							)
						)
					): null,
					$(
						"<td>",
						{
							css:{"font-size":"10px",width:"120px","text-align":"left"},
						}
					).append(
						data.label ?
								[$(
								"<div>",
								{
									css:{"font-size":"9px",width:"120px","text-align":"left",padding:"0 0 0 5px"},
									text:data.label,
									"class":"timeline-event-detail-label"
								}
							),
							$(
								"<div>",
								{
									css:{"border-style":"solid","border-width":"1px 1px 1px 0",padding:"2px 0 0 6px",height:"20px"},
									text:data.title,
									"class":"timeline-event-detail timeline-event-detail-title"
								}
							)]
						:
						$(
							"<div>",
							{
								css:{"border-style":"solid","border-width":"1px 1px 1px 1px",height:"20px",padding:"2px 0 0 6px","margin-top":data.img?"10px":"2px","border-collapse":"collapse"},
								text:data.title,
								"class":"timeline-event-detail timeline-event-detail-title"
							}
						)
					)
				]
			),
			$desc = data.desc ? 
				$("<tr>").append(
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
								"class":"timeline-event-detail timeline-event-detail-description",
								"rowspan":"2",
								text: data.desc
							}
						)
					).attr("colSpan",2)
				) : null;

		fragment = document.createDocumentFragment();

		$table.append($titleTR, $desc);

		$table.find("div.timeline-event-detail").css({"border-color":borderColor,"border-style":"outset"});

		fragment.appendChild($table[0]);

	return fragment;
	};
})("links.TimeLine.TableContent");