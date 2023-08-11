// vim:fdm=syntax
// by tuberry

import Gio from 'gi://Gio';

const sp = x => Math.sin(Math.PI * x);
const cp = x => Math.cos(Math.PI * x);

const L = 16;
const n = 1 / 16;
const m = n * L;
const W = L - 2 * m;
const fill = 'fill="#444"';

let w = W / 2,
    c = w * 5 / 16,
    R = w / (sp(1 / 5) + cp(1 / 5) * cp(1 / 10)),
    d = R * (1 - cp(1 / 5)) * cp(1 / 5) / 2,
    r = R * sp(1 / 5),
    pt = (x, y) => [m + w + x * cp(y), m + w + x * sp(y) + d],
    P = Array.from({ length: 5 }, (_x, i) => pt(R, 1 / 2 + i * 2 / 5));

Gio.File.new_for_path(ARGV.join('/')).replace_contents(`<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}" version="1.1">
 <path d="M ${P.at(-1).join(' ')}
\t${P.map(([x, y]) => `A ${r} ${r} 0 0 1 ${x} ${y}`).join('\n\t')}
\tM ${w + m} ${w + m + d} h -${c}
\ta ${c} ${c} 0 0 0 ${c * 2} 0
\ta ${c} ${c} 0 0 0 -${c * 2} 0"
 ${fill}/>
</svg>`, null, false, Gio.FileCreateFlags.NONE, null);
