#!/bin/bash
# by tuberry & mechtifs, need jq installed

mj=~/.local/share/gnome-shell/extensions/shuzhi@tuberry/mingju.json
rand=$(shuf -i 0-9999 -n 1)
shu=($(jq -r ".[$rand] | .contents + \" \" + .source" "$mj"))
ori=($(dconf read /org/gnome/shell/extensions/shuzhi/text-orientation))
if [[ ${ori[1]} -eq "0" ]]
then
	body=$(echo ${shu[0]} | sed -r '/《/d;/》/d;')
	head=($(echo ${shu[1]} | sed -e 's/《/\n「/g;s/》/」/g'))
else
	body=$(echo ${shu[0]} | sed -r 's/[，。：；？、！]/\n/g;/《/d;/》/d;' | sed -r '/^\s*$/d')
	head=($(echo ${shu[1]} | sed -e 's/《/\n「/g;s/》/」/g'))
fi
printf '%s\n' $body '<span font="16"> </span>' '<span font="18">'${head[1]}'<span bgcolor="#9a2e36" fgcolor="#eee">'${head[0]}'</span></span>'
