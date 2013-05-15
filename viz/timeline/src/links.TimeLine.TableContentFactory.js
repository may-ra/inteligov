(function (type) {
    links.Timeline.TableContentFactory = function () {};
    links.Timeline.TableContentFactory.prototype = new links.Timeline.ContentFactory(type);

    links.Timeline.TableContentFactory.prototype.get = function (data) {
        
        var borderColor = data.color.toString(),
            $table = $(
                "<div>", {
                css: {
                    width: "182px",
                    "border-collapse": "collapse"
                },
                "class": "timeline-event-detail"
            }),
            $titleTR =
                $("<div>", {
                css: {
                    "display": "block"
                }
            }).append(
            [data.imgB64 ?
                    $(
                    "<div>", {
                    css: {
                        "font-size": "10px",
                        position: "relative",
                        top: "0px",
                        "left": "0px"
                    }
                }).append(
                    $(
                    "<div>", {
                    css: {
                        "border-style": "outset",
                        "border-width": "1px",
                        "float": "left",
                        position: "relative"
                    },
                    "class": ["timeline-event-detail", "timeline-event-detail-image"].join(" ")
                }).append(
                    $(
                    "<img>", {
                    css: {
                        border: "none",
                        "border-width": 0,
                        height: "32px",
                        width: "32px"
                    },
                    "src": "data:image/png;base64," + data.imgB64
                }))) : null,
                $(
                    "<div>", {
                    css: {
                        "font-size": "10px",
                        width: data.imgB64 ? "150px" : "182px",
                        "text-align": "left",
                        position: "relative",
                        top: data.imgB64 ? data.label ? "0px" : "12px" : "0px"
                    },
                }).append(data.title ?
                    data.label ? [$(
                        "<div>", {
                        css: {
                            color: data.labelColor,
                            "font-size": "9px",
                            padding: "0 0 0 5px",
                            position: "relative"
                        },
                        text: data.label,
                        "class": "timeline-event-detail-label"
                    }),
                    $(
                        "<div>", {
                        css: {
                            "border-style": "outset",
                            "border-width": "1px 1px 1px 0px",
                            position: "relative",
                            padding: "2px 0 0 6px",
                            height: "20px",
                            left: data.imgB64 ? "34px" : "0px",
                            width: data.imgB64 ? "150px" : "182px"
                        },
                        text: data.title,
                        "class": "timeline-event-detail timeline-event-detail-title"
                    })
                ] :
                    $(
                    "<div>", {
                    css: {
                        "border-style": "outset",
                        "border-width": "1px 1px 1px 0px",
                        height: data.imgB64 ? "16px" : "12px",
                        padding: "2px 0 2px 6px",
                        "margin-top": "2px",
                        "border-collapse": "collapse",
                        left: data.imgB64 ? "2px" : "0px"
                    },
                    text: data.title,
                    "class": "timeline-event-detail timeline-event-detail-title"
                }) :
                    data.label ?
                    $(
                    "<div>", {
                    css: {
                        color: data.labelColor,
                        "font-size": "9px",
                        padding: "0 0 0 5px",
                        position: "relative"
                    },
                    text: data.label,
                    "class": "timeline-event-detail-label"
                }) : null)
            ]),
            $desc = data.desc ?
                $("<div>").append(
                $(
                "<div>", {
                css: {
                    "font-size": "10px",
                    height: "24px",
                    padding: 0,
                    top: data.title ? data.label ? null : "32px" : null
                }
            }).append(
                $(
                "<div>", {
                "class": "timeline-event-detail timeline-event-detail-description",
                css: {
                    "border-style": "solid",
                    "margin-left": data.title ? "16px" : "0px",
                    "border-width": "0 1px 1px 1px",
                    height: "100%",
                    "word-wrap": "break-word"
                },
            }).append(
                $(
                "<p>", {
                css: {
                    "white-space": "pre-wrap",
                    "word-wrap": "break-word",
                    display: data.imgB64 ? data.label ? "inline" : null : "inline",
                    height: "100%"
                },
                text: data.desc
            })))) : null;

        fragment = document.createDocumentFragment();

        $table.append($titleTR, $desc);

        $table.find("div.timeline-event-detail").css({
            "border-color": borderColor
        });

        fragment.appendChild($table[0]);

        return fragment;
    };
})("links.TimeLine.TableContent");