#!/bin/bash
# by tuberry & mechtifs

#API from https://github.com/xenv/gushici
res=$(curl -s https://v1.jinrishici.com/all.json)

#Detect text orientation and font size
orien=($(dconf read /org/gnome/shell/extensions/shuzhi/text-orientation))
font=($(dconf read /org/gnome/shell/extensions/shuzhi/font-name))
size=${font[1]//[!0-9]/}
test -z $size && size=40
#REF: https://unix.stackexchange.com/a/40897
cl(){ awk "BEGIN { print $*}"; }

#Text processing, `SZ_BGCOLOR` in the result will be replace by the bgcolor of wallpaper
content=$(echo $res | grep -Po '(?<="content" : ")[^"]*')
origin=$(echo $res | grep -Po '(?<="origin" : ")[^"]*' | sed -r 's/\ //g')
author=$(echo $res | grep -Po '(?<="author" : ")[^"]*')
if [[ ${orien[1]} -eq '1' ]]
then
	content=$(echo $content | sed -r 's/[，。：；？、！]/\n/g;s/[《》“”]//g;' | sed -r '/^\s*$/d')
fi
test -z $content && exit 1
printf '%s\n' $content \
	'<span font="'$(cl $size \* 2 / 5)'"> </span>' \
	'<span font="'$(cl $size \* 9 / 20)'">'「$origin」'<span bgcolor="#b45a56" fgcolor="SZ_BGCOLOR">'$author'</span></span>'
