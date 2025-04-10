#!/bin/bash
# SPDX-FileCopyrightText: tuberry
# SPDX-License-Identifier: GPL-3.0-or-later
# depends on fortune-mod-mingju-git (AUR)

div() { # round div
    echo $((($1 + $2 / 2) / $2))
}

cent=45
size=size=${cent}%
space0=$((1024 * 6)) # Pango.SCALE = 1024
space1=$(div $((cent * space0)) 100)

quote() {
    IFS="=" read -ra tmp <<<"$1"
    echo "${tmp[0]}=\\\"${tmp[1]}\\\""
}

format() {
    tmp=()
    for x in "${@:2}"; do
        tmp+=("$(quote "$x")")
    done
    echo "<span ${tmp[*]}>$1</span>"
}

json() {
    echo '{"htext": "'"$1"'","vtext": "'"$2"'", "seal": "'"$3"'"}'
}

gap() {
    echo "$(format "$1" line_height=1.05 letter_spacing=$space0)""$(format '\n' line_height=0.15)""$(format "$2" letter_spacing="$space1")"
}

if (($# == 0)); then
    mapfile -t text < <(fortune mingju | sed 's/ ──── //g')
    shopt -s extglob
    hbody=${text[0]//[《》]/}\\n
    mapfile -t vlist < <(echo "${text[0]}" | sed 's/[，。：；？、！]/\n/g;s/[《》]//g' | sed '/^\s*$/d')
    length=$(div $(($(printf '%s\n' "${vlist[@]}" | wc -L) * 50)) $cent) # 50 = 0.5 * 100
    vbody=$(echo "${vlist[@]}" | sed -z 's/\s/\\n/g')                    # GNU sed
    mapfile -t title < <(echo "${text[1]}" | sed 's/《/\n「/g;s/》//g;s/\//／/g')
    seal=$(format "${title[0]}" "$size" color='{SZ_ACCENT_COLOR}')
    hhead=$(format "${title[1]}」" "$size")
    if ((${#title[1]} * 10 > length * 13)); then
        title[1]=$(echo "${title[1]}" | sed -e "s/.\{$length\}/&\\\n/g")
        vhead=$(format "${title[1]}」" "$size")
    else
        vhead=$hhead
    fi
    json "$(gap "$hbody" "$hhead")" "$(gap "$vbody" "$vhead")" "$seal"
else
    while getopts 'lt?' flag; do
        case "$flag" in
        l)
            # echo '' # fallback to the distro logo
            echo '{"image":"/usr/share/pixmaps/gnome-logo-text-dark.svg"}'
            ;;
        t)
            hbody="疏影横斜水清浅，暗香浮动$(format 月 fgcolor=lightyellow)黄昏。\n"
            vbody="疏影横斜水清浅\n暗香浮动$(format 月 fgcolor=lightyellow)黄昏\n"
            seal=$(format 林逋 "$size" color='{SZ_ACCENT_COLOR}')
            hhead=$(format "「山园小梅」" "$size")
            json "$(gap "$vbody" "$hhead")" "$(gap "$hbody" "$hhead")" "$seal"
            ;;
        ?)
            printf "%s:\t mingju" "$0"
            printf "%s -t:\t test" "$0"
            printf "%s -l:\t logo" "$0"
            ;;
        esac
    done
fi
