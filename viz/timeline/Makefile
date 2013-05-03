#Variables to simply the make
TIMELINE=js prototype.js Item.js ItemBox.js ItemDot.js ItemRange.js ClusterGenerator.js StepDate.js ContentFactory.js ContentGenerator.js TableContentFactory.js
PREFIX_TIMELINE=$(addprefix ./src/links.TimeLine.,$(TIMELINE))

all: timeline.js

timeline.js: 
	cat $(PREFIX_TIMELINE) $(PREFIX_INTELI) > timeline.js

clean:
	rm -rf timeline.js

rebuild:
	make clean && make