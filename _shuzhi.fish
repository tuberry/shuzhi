#!/usr/bin/fish
# by tuberry
# need fortune-mod-mingju-git (AUR) installed

function shuzhi -d '凌寒独自开'
	switch $argv
		case vertical
			set shu (fortune mingju | sed 's/ ──── //g')
			set body (echo $shu[1..-2] | sed 's/[，。：；？、！]/\n/g;s/[《》 “”]//g' | sed '/^\s*$/d')
			set head (echo $shu[-1] | sed 's/《/\n「/g;s/》/」/g')
			set head[2] (string replace ' ' '' $head[2])
		case horizontal
			set shu (fortune mingju | sed 's/ ──── //g')
			set body (echo $shu[1..-2] | sed 's/[《》 “”]//g;')
			set head (echo $shu[-1] | sed 's/《/\n「/g;s/》/」/g')
			set head[2] (string replace ' ' '' $head[2])
		case '*'
			set body '疏影横斜水清浅' '暗香浮动<span fgcolor="white">月</span>黄昏'
			set head '林逋' '「山园小梅」'
	end
	set size (string replace -r -a '[^\d]+' '' (dconf read /org/gnome/shell/extensions/shuzhi/font-name))
	test -z $size; and set size 40
	set zhi $body '<span font="'(math -- $size x 0.4)'"> </span>' \
	'<span font="'(math -- $size x 0.45)'">'$head[2]' <span bgcolor="#b45a56" fgcolor="SZ_BGCOLOR">'$head[1]'</span></span>'
	printf '%s\n' $zhi # `SZ_BGCOLOR` will be replace by the bgcolor of wallpaper
end

if contains -- -v $argv || contains -- --vertical $argv
	shuzhi vertical
else if contains -- -h $argv || contains -- --horizontal $argv
	shuzhi horizontal
else if contains -- -t $argv || contains -- --test $argv
	shuzhi test
else if contains -- -l $argv || contains -- --logo $argv
	echo '' # fallback to the distro logo
	# echo '/usr/share/pixmaps/archlinux-logo.svg'
else
	set orien (dconf read /org/gnome/shell/extensions/shuzhi/text-orientation | string split ' ')
	if test $orien[2] -eq 1
		shuzhi vertical
	else
		shuzhi horizontal
	end
end

