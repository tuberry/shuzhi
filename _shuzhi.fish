#!/bin/fish
# by tuberry
# depends on fortune-mod-mingju-git (AUR)

set red \#6d0f0f # vermilion
set bg SZ_BGCOLOR # the bgcolor of wallpaper

function qot -d quote
    set as (string split '=' $argv)
    echo $as[1]'=\"'$as[2]'\"'
end

function fmt -d format
    for x in $argv[2..-1]
        set as $as (qot $x)
    end
    echo "<span $as>$argv[1]</span>"
end

function json -a vtx htx -d to-json
    echo '{"vtext":"'$vtx'","htext":"'$htx'"}'
end

function gap -a bd tl -d add-gap
    echo (fmt $bd line_height=1.05 letter_spacing=6144)(fmt '\n' line_height=0.15)$tl
end

function shuzhi -d 凌寒独自开
    if contains -- -l $argv || contains -- --logo $argv
        echo '' # fallback to the distro logo
        # echo '{"logo":"/usr/share/pixmaps/gnome-logo-text-dark.svg"}'
        return 0
    end
    if contains -- -t $argv || contains -- --test $argv
        set hb '疏影横斜水清浅，暗香浮动'(fmt 月 fgcolor=white)'黄昏。\n'
        set vb '疏影横斜水清浅\n暗香浮动'(fmt 月 fgcolor=white)'黄昏\n'
        set ht (fmt '「山园小梅」 '(fmt 林逋 bgcolor=$red fgcolor=$bg) font=0.45em)
        set vt $ht
    else
        set mj (fortune mingju | sed 's/ ──── //g')
        set hb (echo $mj[1..-2]\\n | sed 's/[《》 “”]//g;')
        set vb (echo $mj[1..-2] | sed 's/[，。：；？、！]/\n/g;s/[《》 “”]//g' | sed '/^\s*$/d')
        set lt (math round -- (printf '%s\n' $vb | wc -L) / 0.9)
        set vb (echo $vb | sed -z 's/\s/\\\n/g') # GNU sed
        set tl (echo $mj[-1] | sed 's/《/\n「/g;s/》/」/g;s/ \/ /／/g')
        set ht (fmt $tl[2]' '(fmt $tl[1] bgcolor=$red fgcolor=$bg) font=0.45em)
        if test (math -- (string length $tl[2]) / $lt) -gt 1.4
            set tl[2] (echo $tl[2] | sed -e "s/.\{$lt\}/&\\\n/g")
            set vt (fmt $tl[2]' '(fmt $tl[1] bgcolor=$red fgcolor=$bg) font=0.45em)
        else
            set vt $ht
        end
    end
    json (gap $vb $vt) (gap $hb $ht)
    # json $vb$vt $hb$ht
end

shuzhi $argv
