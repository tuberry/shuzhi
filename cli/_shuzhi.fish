#!/bin/fish
# SPDX-FileCopyrightText: tuberry
# SPDX-License-Identifier: GPL-3.0-or-later
# depends on fortune-mod-mingju-git (AUR)

set cent 45 # cent
set size size={$cent}%

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

function json -a vt ht sl -d to-json
    echo '{"vtext":"'$vt'","htext":"'$ht'", "seal": "'$sl'"}'
end

function gap -a bd tl -d add-gap
    set spc (math 1024 x 6) # Pango.SCALE = 1024
    set spc1 (math round $cent x $spc / 100)
    echo (fmt $bd line_height=1.05 letter_spacing=$spc)(fmt '\n' line_height=0.15)(fmt $tl letter_spacing=$spc1)
end

function shuzhi -d 凌寒独自开
    argparse --ignore-unknown l/logo t/test -- $argv
    if set -q _flag_l
        echo '' # fallback to the distro logo
        # echo '{"image":"/usr/share/pixmaps/gnome-logo-text-dark.svg"}'
        return 0
    end
    if set -q _flag_t
        set hb '疏影横斜水清浅，暗香浮动'(fmt 月 fgcolor=lightyellow)'黄昏。\n'
        set vb '疏影横斜水清浅\n暗香浮动'(fmt 月 fgcolor=lightyellow)'黄昏\n'
        set ht (fmt '「山园小梅」' $size)
        set sl (fmt 林逋 $size)
        set vt $ht
    else
        set mj (fortune mingju | sed 's/ ──── //g')
        set hb (echo $mj[1..-2]\\n | sed 's/[《》]//g;')
        set vb (echo $mj[1..-2] | sed 's/[，。：；？、！]/\n/g;s/[《》]//g' | sed '/^\s*$/d')
        set lt (math round -- (printf '%s\n' $vb | wc -L) / 2 / $cent x 100)
        set vb (echo $vb | sed -z 's/\s/\\\n/g') # GNU sed
        set tl (echo $mj[-1] | sed 's/《/\n「/g;s/》/」/g;s/\//／/g')
        set sl (fmt $tl[1] $size)
        set ht (fmt $tl[2]' ' $size)
        if test (math -- (string length $tl[2]) / $lt) -gt 1.3
            set tl[2] (echo $tl[2] | sed -e "s/.\{$lt\}/&\\\n/g")
            set vt (fmt $tl[2] $size)
        else
            set vt $ht
        end
    end
    json (gap $vb $vt) (gap $hb $ht) (fmt $sl color=%SZ_ACCENT_COLOR)
end

shuzhi $argv
