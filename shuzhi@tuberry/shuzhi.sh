#!/bin/bash
# by tuberry & mechtifs

# API from https://github.com/xenv/gushici
res=$(curl -s https://v1.jinrishici.com/all.json)
content=$(echo $res | grep -Po '(?<="content" : ")[^"]*')
test -z $content && exit 1
author=$(echo $res | grep -Po '(?<="author" : ")[^"]*')
origin=$(echo $res | grep -Po '(?<="origin" : ")[^"]*' | sed -r 's/\ //g')
# `SZ_BGCOLOR` is the bgcolor of wallpaper
title='<span font=\"0.45em\">'「$origin」'<span bgcolor=\"#b45a56\" fgcolor=\"SZ_BGCOLOR\">'$author'</span></span>'
vcontent=$(echo $content | sed -r 's/[，。：；？、！]/\n/g;s/[《》“”]//g;' | sed -r '/^\s*$/d' | sed -z 's/\n/\\n/g')
printf '{"vtext":"%s%s","htext":"%s\\n%s"}' "$vcontent" "$title" "$content" "$title"

# 同时显示通知,需要libnotify-bin支持

res=$(notify-send "$author-「$origin」`time`" "<b>$content</b>" -c device -u critical -i $HOME/.local/share/gnome-shell/extensions/shuzhi@tuberry/icons/florette-symbolic.svg)
