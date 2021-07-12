#!/bin/bash
# by tuberry & mechtifs

#API from https://github.com/xuchunyang/mingju
api='https://mingju.vercel.app/api/random'
res=$(curl -s $api)
while [[ "$res" == *"error"* ]]
do
	res=$(curl -s $api)
done
contents=$(echo $res | grep -Po '(?<="contents": ")[^"]*')
source=$(echo $res | grep -Po '(?<="source": ")[^"]*')

#Detect text orientaion
orien=($(dconf read /org/gnome/shell/extensions/shuzhi/text-orientation))

#Text processing
if [[ ${orien[1]} -eq '0' ]]
then
	body=$(echo $contents | sed -r '/《/d;/》/d;')
	head=($(echo $source | sed -e 's/《/\n「/g;s/》/」/g'))
else
	body=$(echo $contents | sed -r 's/[，。：；？、！]/\n/g;/《/d;/》/d;' | sed -r '/^\s*$/d')
	head=($(echo $source | sed -e 's/《/\n「/g;s/》/」/g'))
fi
printf '%s\n' $body '<span font="16"> </span>' '<span font="18">'${head[1]}'<span bgcolor="#9a2e36" fgcolor="#eee">'${head[0]}'</span></span>'
