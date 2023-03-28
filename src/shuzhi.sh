#!/usr/bin/env gjs
// vim:filetype=javascript
// by tuberry & mechtifs
'use strict'; // workaround for https://gjs.guide/extensions/review-guidelines/review-guidelines.html#scripts-and-binaries

imports.gi.versions.Soup = '3.0';
const { Soup } = imports.gi;

let ssn = new Soup.Session({ timeout: 30 }),
    msg = Soup.Message.new('POST', 'https://v1.jinrishici.com/all.json'),
    byt = ssn.send_and_read(msg, null),
    spn = (s, a) => `<span ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>${s}</span>`;
if(msg.statusCode !== Soup.Status.OK) throw new Error(`Unexpected response: ${msg.get_reason_phrase()}`);
let { content, origin, author } = JSON.parse(new TextDecoder().decode(byt.get_data())),
    vcontent = content.replaceAll(/[，。：；？、！]/g, '\n').replaceAll(/[《》“”]/g, ''),
    title = spn(`「${origin}」${spn(author, { bgcolor: '#b00a', fgcolor: 'SZ_BGCOLOR' })}`, { font: '0.45em' });
print(JSON.stringify({ vtext: `${vcontent}${title}`, htext: `${content}${title}` }));
