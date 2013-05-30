#! /bin/bash

if [ $# -lt 1 ]; then
	echo -e "You have to provide at least one file.\n"
	echo -e 'Usage:\n\tmake [ css | js | all | clean | files FILES="file1 file2 ..." ] \n\nif you dont provide an option, program asumes "all" as the default'
fi

css(){
	export ROOT=`pwd`
	declare YUI=`ls $ROOT/yuicompressor-*.jar`
	declare CSS=`find $ROOT -name "*.css"`
	declare ORIGIN
	for i in $CSS
	do
		java -jar $YUI --type css $i -o '.css$:.min.css'
	done
}

js(){
	declare CLOS=`ls $PWD/compiler*.jar`
	declare JS=`find $PWD -name "*.js"`
	for i in $JS
	do
		echo $i | grep ".min." > /dev/null
		if [  $? -eq 0 ]; then
			continue
		fi
		java -jar $CLOS --js $i --js_output_file ${i%.*}.min.js
	done
}

case $1 in
	css )
		css		
		;;
	js )
		js
		;;
	all )
		css 
		js
		;;
	clean )
		find . -name "*.min.*" -exec rm {} 
		;;
	files )
		declare CLOS=`ls $PWD/compiler*.jar`
		declare YUI=`ls $PWD/yuicompressor-*.jar`

		shift

		for i in $@
		do
			if [ ${i##*.} = "js" ]; then
				java -jar $CLOS --js $i --js_output_file ${i%.*}.min.js
			elif [ ${i##*.} = "css" ]; then
				java -jar $YUI --type css $i -o '.css$:.min.css'
			fi
		done
		;;
esac