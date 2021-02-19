#!/bin/fish
# by tuberry, need fortune-mod-mingju-git (AUR) installed

if contains -- -v $argv || contains -- --vertical $argv
	set shu (fortune mingju | sed -r 's/ ──── //g')
	set body (echo $shu[1..-2] | sed -r 's/[，。：；？、！]/\n/g;/《/d;/》/d;' | sed -r '/^\s*$/d')
	set head (echo $shu[-1] | sed -e 's/《/\n「/g;s/》/」/g')
	set head[2] (string replace ' ' '' $head[2])
else if contains -- -t $argv || contains -- --test $argv
	set body '疏影横斜水清浅' '暗香浮动<span fgcolor="white">月</span>黄昏'
	set head '林逋' '「山园小梅」'
else
	set shu (fortune mingju | sed -r 's/ ──── //g')
	set body (echo $shu[1..-2] | sed -r '/《/d;/》/d;')
	set head (echo $shu[-1] | sed -e 's/《/\n「/g;s/》/」/g')
	set head[2] (string replace ' ' '' $head[2])
end
set zhi $body '<span font="16"> </span>' '<span font="18">'$head[2]' <span bgcolor="#9a2e36" fgcolor="#eee">'$head[1]'</span></span>'
printf '%s\n' $zhi
