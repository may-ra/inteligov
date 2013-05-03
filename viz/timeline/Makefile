#Variables to simply the make
TIMELINE=js prototype.js Item.js ItemBox.js ItemDot.js ItemRange.js ClusterGenerator.js StepDate.js
PREFIX_TIMELINE=$(addprefix ./src/links.TimeLine.,$(TIMELINE))

INTELI_TIMELINE=ContentFactory.js ContentGenerator.js
PREFIX_INTELI=$(addprefix ./src/inteli.gov.TimeLine.,$(INTELI_TIMELINE))

all: timeline.js

timeline.js: 
	cat $(PREFIX_TIMELINE) $(PREFIX_INTELI) > timeline.js

clean:
	rm -rf timeline.js

rebuild:
	make clean && make