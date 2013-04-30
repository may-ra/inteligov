all: timeline.js

timeline.js: 
	cat ./src/links.TimeLine.js ./src/links.TimeLine.prototype.js ./src/links.TimeLine.Item.js ./src/links.TimeLine.ItemBox.js ./src/links.TimeLine.ItemDot.js ./src/links.TimeLine.ItemRange.js ./src/links.TimeLine.ClusterGenerator.js ./src/links.TimeLine.StepDate.js > timeline.js

clean:
	rm -rf timeline.js
