// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import Gio from 'gi://Gio';
import {array} from '../src/util.js';

const L = 16; // length (side)
const M = 1 / 16; // margin
const W = 1 - 2 * M; // width (content)
const C = 'dimgrey'; // color
const XFM = `fill="${C}" transform="translate(${M} ${M}) scale(${W} ${W}) rotate(-18 .5 .5)"`;
const SVG = `viewBox="0 0 1 1" width="${L}" height="${L}" xmlns="http://www.w3.org/2000/svg"`;
const save = (text, name) => Gio.File.new_for_path(ARGV.concat(name).join('/'))
    .replace_contents(text, null, false, Gio.FileCreateFlags.NONE, null);

let a = Math.sin(Math.PI / 5),
    b = Math.cos(Math.PI / 5),
    c = Math.cos(Math.PI / 10),
    d = 1 / (2 * (a + b * c)),
    e = 1 - (2 * a + b + b * b) * d + 1 / 2,
    f = d * a,
    g = f * 3 / 4,
    p2ct = (r, t) => [1 / 2 + r * Math.cos(Math.PI * t), e + r * Math.sin(Math.PI * t)],
    penta = array(5, i => p2ct(d, 1 / 2 + i * (2 / 5)));

save(`<svg ${SVG}>
  <g ${XFM}>
    <path d="M ${penta.at(-1).join(' ')} ${penta.map(([x, y]) => `A ${f} ${f} 0 0 1 ${x} ${y}`).join(' ')}
      M ${1 / 2 - g} ${e} a ${g} ${g} 0 0 0 ${g * 2} 0 a ${g} ${g} 0 0 0 -${g * 2} 0 Z"/>
  </g>
</svg>`);
