#!/usr/bin/env -S gjs -m
// SPDX-FileCopyrightText: tuberry & mechtifs
// SPDX-License-Identifier: GPL-3.0-or-later
// vim:ft=javascript

import Soup from 'gi://Soup/?version=3.0';

let http = new Soup.Session({timeout: 30}),
    msg = Soup.Message.new('POST', 'https://v1.jinrishici.com/all.json'),
    ans = http.send_and_read(msg, null),
    span = (s, a) => `<span ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>${s}</span>`;
if(msg.statusCode !== Soup.Status.OK) throw new Error(`Unexpected response: ${msg.get_reason_phrase()}`);
let {content, origin, author} = JSON.parse(new TextDecoder().decode(ans.get_data())),
    body = content.replaceAll(/[，。：；？、！]/g, '\n').replaceAll(/[《》“”]/g, ''),
    title = span(`「${origin}」${span(author, {bgcolor: '%SZ_ACCENT_COLOR', fgcolor: '%SZ_BGCOLOR'})}`, {size: '45%'});
print(JSON.stringify({vtext: `${body}${title}`, htext: `${content}${title}`}));
