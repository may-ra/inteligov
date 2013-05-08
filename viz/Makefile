# VizEngine Makefile
#
# iNteligov
#
# New Elements can be added easy to this variable just adding the main name.
DIRS=Viz Bar Donut Line MultiLine StackedBars

# Add the extension with addsuffix and then add VizEngine to every name on DIRS, in this way, you
# have the accurate name, except for timeline, because its only a dependency
SOURCES=$(addsuffix .js,$(addprefix VizEngine.,$(DIRS))) timeline/timeline.js

# Manually add VizEngine.top.js because this never changes on carpet, same with VizEngine.bottom.js
#
# Then join the dirs and the sources, but first check for StackedBars, because StackedBars isn't named 
# the same as his directory, so replace him!
ALL=VizEngine.top.js $(join $(addsuffix /,$(DIRS)), $(subst StackedBars,SBars,$(SOURCES))) VizEngine.bottom.js

# Necesary file to continue
all: VizEngine.js

# If file doesn't exist, then make it!, but check first if TimeLine was made it
VizEngine.js: clean timeline.js
	make clean && cat $(ALL) > VizEngine.js

Viz: clean VizEngine.top.js Viz/VizEngine.Viz.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js VizEngine.bottom.js > Viz/VizEngine.js

Bar: clean VizEngine.top.js Viz/VizEngine.Viz.js Bar/VizEngine.Bar.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js Bar/VizEngine.Bar.js VizEngine.bottom.js > Bar/VizEngine.js

Donut: clean VizEngine.top.js Viz/VizEngine.Viz.js Donut/VizEngine.Donut.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js Donut/VizEngine.Donut.js VizEngine.bottom.js > Donut/VizEngine.js

Line: clean VizEngine.top.js Viz/VizEngine.Viz.js Line/VizEngine.Line.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js Line/VizEngine.Line.js VizEngine.bottom.js > Line/VizEngine.js

MultiLine: clean VizEngine.top.js Viz/VizEngine.Viz.js MultiLine/VizEngine.MultiLine.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js MultiLine/VizEngine.MultiLine.js VizEngine.bottom.js > MultiLine/VizEngine.js

StackedBars: clean VizEngine.top.js Viz/VizEngine.Viz.js StackedBars/VizEngine.SBars.js VizEngine.bottom.js
	rm -rf Line/VizEngine.js && cat VizEngine.top.js Viz/VizEngine.Viz.js StackedBars/VizEngine.SBars.js VizEngine.bottom.js > StackedBars/VizEngine.js

clean:
	rm -rf VizEngine.js

timeline.js:
	cd timeline && make rebuild && cd ..
