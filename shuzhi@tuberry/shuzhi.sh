#!/bin/bash
# by tuberry & mechtifs

#API from https://github.com/xenv/gushici
res=$(curl -s https://v1.jinrishici.com/all.json)

#Detect text orientaion
orien=($(dconf read /org/gnome/shell/extensions/shuzhi/text-orientation))

#Text processing
content=$(echo $res | grep -Po '(?<="content" : ")[^"]*')
origin=$(echo $res | grep -Po '(?<="origin" : ")[^"]*' | sed -r 's/\ //g')
author=$(echo $res | grep -Po '(?<="author" : ")[^"]*')
if [[ ${orien[1]} -eq '1' ]]
then
	content=$(echo $content | sed -r 's/[，。：；？、！]/\n/g;s/[《》“”]//g;' | sed -r '/^\s*$/d')
fi
printf '%s\n' $content '<span font="16"> </span>' '<span font="18">'「$origin」'<span bgcolor="#9a2e36" fgcolor="#eee">'$author'</span></span>'
