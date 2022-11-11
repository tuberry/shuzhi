#!/bin/fish
# by tuberry
# need fortune-mod-mingju-git (AUR) installed

function shuzhi -d 凌寒独自开
    switch $argv
        case test
            # `SZ_BGCOLOR` is the bgcolor of wallpaper
            set hbd '疏影横斜水清浅，暗香浮动<span fgcolor=\"white\">月</span>黄昏。'
            # set vbd '疏影横斜水清浅\\n暗香浮动<span fgcolor=\\"white\\">月</span>黄昏\\n'
            set vbd '<span line_height=\"0.8\">疏影横斜水清浅\n暗香浮动<span bgcolor=\"green\">月</span>黄昏</span>\n'
            set htt '<span font=\"0.45em\">「山园小梅」 <span bgcolor=\"#b45a56\" fgcolor=\"SZ_BGCOLOR\">林逋</span></span>'
            set vtt $htt
        case '*'
            set shu (fortune mingju | sed 's/ ──── //g')
            set hbd (echo $shu[1..-2] | sed 's/[《》 “”]//g;')
            set vbd (echo $shu[1..-2] | sed 's/[，。：；？、！]/\n/g;s/[《》 “”]//g' | sed '/^\s*$/d')
            set mx (math round -- (printf '%s\n' $vbd | wc -L) / 0.9)
            set vbd (echo $vbd | sed -z 's/\s/\\\n/g') # GNU sed
            set hd (echo $shu[-1] | sed 's/《/\n「/g;s/》/」/g;s/ \/ /／/g')
            set htt '<span font=\"0.45em\">'$hd[2]' <span bgcolor=\"#b45a56\" fgcolor=\"SZ_BGCOLOR\">'$hd[1]'</span></span>'
            if test (math -- (string length $hd[2]) / $mx) -gt 1.3
                set hd[2] (echo $hd[2] | sed -e "s/.\{$mx\}/&\\\n/g")
                set vtt '<span font=\"0.45em\">'$hd[2]' <span bgcolor=\"#b45a56\" fgcolor=\"SZ_BGCOLOR\">'$hd[1]'</span></span>'
            else
                set vtt $htt
            end
    end
    printf '{"vtext":"%s%s","htext":"%s%s"}' $vbd $vtt $hbd $htt
end

if contains -- -t $argv || contains -- --test $argv
    shuzhi test
else if contains -- -l $argv || contains -- --logo $argv
    echo '' # fallback to the distro logo
    # echo '{"logo":"/usr/share/pixmaps/gnome-logo-text-dark.svg"}'
else
    shuzhi
end
