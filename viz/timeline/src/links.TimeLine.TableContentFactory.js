(function(type){
	links.Timeline.TableContentFactory = function(){};
	links.Timeline.TableContentFactory.prototype = new links.Timeline.ContentFactory(type);

	links.Timeline.TableContentFactory.prototype.get = function(data) {
	
		var borderColor = data.color.toString(),
		$table = $(
			"<div>",
			{
				css:{width:"120px",height:"100%", "border-collapse":"collapse"},
				"class":"timeline-event-detail"
			}
		),
		tdStyle = {"text-align":"center",height:"32px",padding:0},
		$titleTR = 
			$("<div>",{css:{"display":"block"}}).append(
				[ data.imgB64 ?
					$(
						"<div>",
						{
							css:$.extend({"font-size":"10px","display":"inline"},tdStyle)
						}
					).append(
						$(
							"<div>",
							{
								css:{"border-style":"solid","border-width":"1px","float":"left"},
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
						"<div>",
						{
							css:{"font-size":"10px",width:"120px","text-align":"left"},
						}
					).append(
						data.label ?
								[$(
								"<div>",
								{
									css:{"font-size":"9px",width:"120px","text-align":"left",padding:"0 0 0 5px","display":"inline"},
									text:data.label,
									"class":"timeline-event-detail-label"
								}
							),
							$(
								"<div>",
								{
									css:{"border-style":"solid","border-width":"1px 1px 1px 0",padding:"2px 0 0 6px",height:data.imgB64?"20px":"12px"},
									text:data.title,
									"class":"timeline-event-detail timeline-event-detail-title"
								}
							)]
						:
						$(
							"<div>",
							{
								css:{"border-style":"solid","border-width":"1px 1px 1px 1px",height:data.imgB64?"16px":"12px",padding:"2px 0 2px 6px","margin-top":"2px","border-collapse":"collapse"},
								text:data.title,
								"class":"timeline-event-detail timeline-event-detail-title"
							}
						)
					)
				]
			),
			$desc = data.desc ? 
				$("<div>").append(
					$(
						"<div>",
						{
							css:{"font-size":"10px",height:"100%",padding:0}
						}
					).append(
						$(
							"<div>",
							{
								"class":"timeline-event-detail timeline-event-detail-description",
								css:{"margin-left":"12px","border-style":"solid","border-width":"0 1px 1px 1px",height:"100%","word-wrap":"break-word"},							
							}
						).append(
							$(
								"<p>",
								{	
									css:{"white-space": "pre-wrap","word-wrap":"break-word",display:"inline",height:"100%"},
									text:data.desc
								}
							)
						)
					)
				) : null;

		fragment = document.createDocumentFragment();

		$table.append($titleTR, $desc);

		$table.find("div.timeline-event-detail").css({"border-color":borderColor,"border-style":"outset"});

		fragment.appendChild($table[0]);

	return fragment;
	};
})("links.TimeLine.TableContent");