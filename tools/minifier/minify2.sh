#! /bin/bash

if ( ! getopts "d:f:" opt); then
	echo -e "Usage: `basename $0` options -d directory -f files ..."
	exit $OPTERROR;
fi

while getopts "d:f:" opt; do
	case $opt in
	 	d )
			echo -e "\n\n\tMinificacion por carpeta, se minificaran todos los archivos en carpeta: $OPTARG \n"
			if [ -d $OPTARG ]; then
				test -e `ls yuicompressor-*.jar` -a -e `ls compiler.jar`
				if [ $? -ne 0 ]; then
					return 1
				fi
				declare YUI=`ls yuicompressor*.jar`
				declare CLOS=`ls compiler*.jar`
				declare CSS=`find $OPTARG -name "*.css"`
				declare JS=`find $OPTARG -name "*.js"`
				for i in $CSS $JS
				do
			        echo $i | grep '.min.' > /dev/null
			        if [ $? -eq 0 ]; then
			            continue
			        fi
			        case ${i##*.} in
			        	css )
			        		java -Xmx2048m -XX:MaxPermSize=2g -Xss256m -jar $YUI --type css $i -o $(echo $i | sed 's/\.[^\.]*$//').min.css
			        		;;
			        	js )
							java -Xmx2048m -XX:MaxPermSize=2g -Xss256m -jar $CLOS --js $i --js_output_file ${i%.*}.min.js >> ./minification.log 2>&1
							;;
						* ) 
							echo -e "Este script tiene vitaminas, sin embargo no minifica archivos distintos de css y js\n\n"
							sleep 2
							return -1
							;;
					esac
				done
			else
				echo -e "Argumento '$OPTARG' no es un directorio valido, asegurate de colocar una ubicacion absoluta."
			fi
			;;
		f )
			shift
			echo -e "\n\nSe minificaran los siguientes archivos: $@"
			test -e `ls yuicompressor-*.jar` -a -e `ls compiler.jar`
			if [ $? -ne 0 ]; then
				return 1
			fi
			declare YUI=`ls yuicompressor*.jar`
			declare CLOS=`ls compiler*.jar`
			for i in $@
			do
				if [ ! -e $i ]; then
					echo -e "Archivo '$i' no existe."
					exit -1
				fi
		        echo $i | grep '.min.' > /dev/null
		        if [ $? -eq 0 ]; then
		            continue
		        fi
		        case ${i##*.} in
		        	css )
		        		java -Xmx2048m -XX:MaxPermSize=2g -Xss256m -jar $YUI --type css $i -o $(echo $i | sed 's/\.[^\.]*$//').min.css
		        		;;
		        	js )
						echo "[ $(date +%D) ]" >> ./minification.log 
						java -Xmx2048m -XX:MaxPermSize=2g -Xss256m -jar $CLOS --js $i --js_output_file ${i%.*}.min.js >> ./minification.log 2>&1
						;;
					* ) 
						echo -e "Este script tiene vitaminas, sin embargo no minifica archivos distintos de css y js\n\n"
						sleep 2
						return -1
						;;
				esac
			done
			;;
	esac
done