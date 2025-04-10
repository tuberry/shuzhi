// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';
import GLib from 'gi://GLib';
import Rsvg from 'gi://Rsvg';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';
import GdkPixbuf from 'gi://GdkPixbuf';
import PangoCairo from 'gi://PangoCairo';

import * as T from './util.js';
import {FG, BgRGBA} from './color.js';

const RATIO = 2 / 3;
const PANEL = 1 / 30;

const add = (u, v) => u + v;
const sinp = t => Math.sin(t * Math.PI);
const cosp = t => Math.cos(t * Math.PI);
const p2ct = (r, t) => [r * cosp(t), r * sinp(t)];
const scanl = (f, a, xs) => xs.flatMap(x => (a = f(x, a)));
const zipWith = (f, ...xss) => xss[0].map((_x, i) => f(...xss.map(xs => xs[i])));
const lerp = (a, b, t) => zipWith((u, v) => u + (v - u) * t, a, b);
const distance = (a, b) => Math.hypot(...zipWith((u, v) => u - v, a, b)); // euclidean metric
const move = (a, r, t) => zipWith(add, a, p2ct(r, t));
const translate = ([x, y]) => [[1, 0, x], [0, 1, y]];
const rotate = t => [[cosp(t), sinp(t), 0], [-sinp(t), cosp(t), 0]];
const dot = (xs, ys) => xs.map((x, i) => x * ys[i]).reduce(add);
const affine = (xs, ...ms) => ms.reduce((p, m) => m.map(v => dot(v, p.concat(1))), xs);
const swap = (a, i, j) => ([a[i], a[j]] = [a[j], a[i]]);
const pie = (a, s = 1) => (m => a.map(x => x * s / m))(a.reduce(add));
const draw = (f, cr, ...xs) => { cr.save(); f(cr, ...xs); cr.restore(); };
const loopl = (f, u, l = 0, s = 1) => { for(let i = l; i <= u; i += s) f(i); };
const loopr = (f, u, l = 0, s = 1) => { for(let i = u; i >= l; i -= s) f(i); };

export const paint = (m, ...xs) => draw(m.draw, ...xs);

const RAND = { // PRNG
    color: ({dark, palette}, alpha) => palette.random(dark ? FG.LIGHT : FG.DARK, alpha),
    uniform: (l, u) => Math.random() * (u - l) + l, // -> [u, l)
    compass: (u, v) => Math.random() * 2 * v + u - v, // -> [u - v, u + v)
    integer: (l, u) => Math.floor(RAND.uniform(l, u + 1)), // -> l .. u
    natural: n => Math.floor(Math.random() * n), // -> 0 .. n - 1
    boolean: () => Math.random() < 0.5,
    normal: (() => { // -> (0, 1) // Ref: https://en.wikipedia.org/wiki/Marsaglia_polar_method
        let cache = [];
        return () => {
            if(cache.length) {
                return cache.pop();
            } else {
                let u, v, s;
                do {
                    u = 2 * Math.random() - 1;
                    v = 2 * Math.random() - 1;
                    s = u * u + v * v;
                } while(s >= 1 || s === 0);
                s = Math.sqrt(-2 * Math.log(s) / s);
                cache.push(Math.clamp(u * s / 6 + 0.5, 0, 1));
                return Math.clamp(v * s / 6 + 0.5, 0, 1);
            }
        };
    })(),
    gauss: (m, s, k = 0) => (n => m + s * (6 * (k < 0 ? 1 - n : n) - 3))(Math.pow(RAND.normal(), 1 - Math.log2(1 + Math.abs(k)))), // k <- (-1, 1)
    bimodal: (mu, s3, k = 0.5) => RAND.gauss(mu, s3 / 3, RAND.boolean() ? k : -k), // k <- (0, 1)
    gamma: (a, b = 1) => { // a:alpha == k > 0, b:beta == 1 / theta > 0 // Ref: https://en.wikipedia.org/wiki/Gamma_distribution#Random_variate_generation
        if(a < 1) return RAND.gamma(a + 1, b) * Math.pow(Math.random(), 1 / a);
        let d = a - 1 / 3,
            c = 1 / Math.sqrt(9 * d),
            u, v, s;
        do {
            do {
                s = RAND.gauss(0, 1);
                v = 1 + c * s;
            } while(v <= 0);
            v *= v * v;
            u = 1 - Math.random();
        } while(u >= 1 - 0.331 * s * s * s * s && Math.log(u) >= s * s / 2 + d * (1 - v  + Math.log(v)));
        return d * v / b;
    },
    dirichlet: (n, a, s = 1) => pie(T.array(n, () => RAND.gamma(a)), s), // n <- N+
};

export const BG = {
    gen: ({dark}) => dark ? BgRGBA.DARK : BgRGBA.LIGHT,
    draw: (cr, color) => { cr.setSourceRGBA(...color); cr.paint(); },
};

const Curve = {
    $gen: ([a, b, c], smooth) => { // Ref: https://zhuanlan.zhihu.com/p/267693043
        let ms = [a, c].map(x => lerp(x, b, 1 / 2)),
            d = lerp(...ms, 1 / (1 + distance(c, b) / distance(a, b))),
            [e, f] = ms.map(x => zipWith((u, v, w) => u + (v - w) * smooth, b, x, d));
        return [e, b, f];
    },
    gen: (pts, smooth = 1, closed = false) => { // -> [start, ...ctrls]
        if(closed) {
            let ctrls = T.array(pts.length, i => Curve.$gen(T.array(3, j => pts[(i + j) % pts.length]), smooth)).flat();
            return [pts[0], ctrls.at(-1), ...ctrls.slice(0, -1)];
        } else {
            let ctrls = T.array(pts.length - 2, i => Curve.$gen(T.array(3, j => pts[i + j]), smooth)).flat();
            return [pts[0], pts[0], ...ctrls, pts.at(-1), pts.at(-1)];
        }
    },
    link: (cr, [start, ...pts]) => {
        cr.moveTo(...start);
        loopl(i => cr.curveTo(...T.array(3, j => pts[i + j]).flat()), pts.length - 1, 0, 3);
    },
};

const Moon = {
    gen: (x, _y) => {
        let p = Math.abs((Date.now() / 86400000 - 18256.8) / 29.5305882) % 1, // Ref: https://ecomaan.nl/javascript/moonphase/
            [c_x, c_y, r, s_t, e_t, t] = [x * 8 / 10, x / 10, x / 20, 0, Math.PI, p > 0.5 ? Math.PI / 4 : -Math.PI / 4],
            q = (1 - Math.abs(2 * p - 1)).toFixed(3);
        if(Math.abs(q - 1) < 0.005) {
            return [c_x, c_y, r, BgRGBA.LIGHT];
        } else if(Math.abs(q - 0.5) < 0.005) {
            let g = new Cairo.LinearGradient(0, 0, 0, r / 16);
            g.addColorStopRGBA(0, 0, 0, 0, 0);
            g.addColorStopRGBA(1, 0.8, 0.8, 0.8, 1);
            return [c_x, c_y, r, s_t, e_t, t, g];
        } else if(q < 0.5) {
            let m = 1 - 2 * q,
                n = 1 / m,
                t1 = Math.asin((n - m) / (n + m)),
                [c_x1, c_y1, r1, s_t1, e_t1] = [0, r * (m - n) / 2, r * (n + m) / 2, t1, Math.PI - t1],
                g = new Cairo.RadialGradient(c_x1, c_y1, r1, c_x1, c_y1, r1 + r / 16);
            g.addColorStopRGBA(0, 0, 0, 0, 0);
            g.addColorStopRGBA(1, 0.8, 0.8, 0.8, 1);
            return [c_x, c_y, r, s_t, e_t, c_x1, c_y1, r1, s_t1, e_t1, t, g];
        } else {
            let m = 2 * q - 1,
                n = 1 / m,
                t1 = Math.asin((n - m) / (n + m)),
                [c_x1, c_y1, r1, s_t1, e_t1] = [0, r * (n - m) / 2, r * (n + m) / 2, Math.PI + t1, 2 * Math.PI - t1],
                g = new Cairo.RadialGradient(c_x1, c_y1, r1 - r * Math.min((n - 1) / 2, 1 / 16), c_x1, c_y1, r1);
            g.addColorStopRGBA(0, 0.8, 0.8, 0.8, 1);
            g.addColorStopRGBA(1, 0, 0, 0, 0);
            return [c_x, c_y, r, s_t, e_t, c_x1, c_y1, r1, s_t1, e_t1, t, g];
        }
    },
    draw: (cr, pts) => {
        switch(pts.length) {
        case 12: {
            let [c_x, c_y, r, s_t, e_t, c_x1, c_y1, r1, s_t1, e_t1, t, g] = pts;
            cr.translate(c_x, c_y);
            cr.rotate(t);
            cr.setSource(g);
            cr.arc(0, 0, r, s_t, e_t);
            cr.arc(c_x1, c_y1, r1, s_t1, e_t1);
            cr.setFillRule(Cairo.FillRule.EVEN_ODD);
            cr.fill();
            break;
        }
        case 7: {
            let [c_x, c_y, r, s_t, e_t, t, g] = pts;
            cr.translate(c_x, c_y);
            cr.rotate(t);
            cr.setSource(g);
            cr.arc(0, 0, r, s_t, e_t);
            cr.setFillRule(Cairo.FillRule.EVEN_ODD);
            cr.fill();
            break;
        }
        case 4: {
            let [c_x, c_y, r1, color] = pts;
            cr.setSourceRGBA(...color);
            cr.arc(c_x, c_y, r1, 0, 2 * Math.PI);
            cr.fill();
            break;
        }
        }
    },
};

const Tile = {
    sample: (a, n) => { // n < a.length
        let ret = [], idx = {};
        loopr(i => (j => {
            ret.push(idx[j] ?? j);
            idx[j] = idx[i] ?? i;
        })(RAND.natural(i)), a.length - 1, a.length - n);
        return ret.map(x => a[x]);
    },
    lattice: (rect, sum = 20, ratio = 1 / 5) => { // Ref: https://stackoverflow.com/a/4382286
        return T.Y(f => n => n === 0 ? [rect] : f(n - 1).flatMap(([x, y, w, h]) => {
            let [a, b] = [w, h].map(i => Math.round(i * RAND.bimodal(1 / 2, ratio)));
            return Math.abs(a / w - 1 / 2) < Math.abs(b / h - 1 / 2)
                ? [[x, y, a, b], [x, y + b, a, h - b], [x + a, y, w - a, h - b], [x + a, y + h - b, w - a, b]]
                : [[x, y, a, b], [x + a, y, w - a, b], [x, y + b, w - a, h - b], [x + w - a, y + b, a, h - b]];
        }))(Math.ceil(Math.log2(sum) / 2));
    },
    circle: ([x, y, w, h]) => {
        let r = Math.min(w, h) / 2;
        return w > h ? [x + RAND.uniform(r, w - r), y + h / 2, r] : [x + w / 2, y + RAND.uniform(r, h - r), r];
    },
    overlap: ([x, y, w, h], [m, n, p, q]) => {
        let dw = Math.max(0, Math.min(x + w, m + p) - Math.max(x, m));
        let dh = Math.max(0, Math.min(y + h, n + q) - Math.max(y, n));
        return dw * dh > 0.06 * w * h;
    },
    N: 16,
    dye: x => T.array(Tile.N, () => RAND.color(x, x.dark ? 0.5 : 0.6).color),
    gen: (C, {W, H}) => Tile.sample(Tile.lattice([0, 0, W, H]).filter(x => !Tile.overlap(x, Motto.area)), Tile.N).map(x => Tile.circle(x)),
};

export const Blob = {
    polygon: ([x, y, r], n = 6, a = 8, dt_r = 0.25) => scanl(add, RAND.uniform(0, 2), RAND.dirichlet(n, a, 2))
        .map(t => move([x, y], RAND.gauss(0.95, dt_r) * r, t)), // Ref: https://stackoverflow.com/a/25276331
    dye: Tile.dye,
    gen: (C, {W, H}) => Tile.gen(C, {W, H}).map((x, i) => [C[i], Curve.gen(Blob.polygon(x), 1, true)]),
    draw: (cr, pts) => pts.forEach(pt => {
        let [color, p] = pt;
        cr.setSourceRGBA(...color);
        Curve.link(cr, p);
        cr.fill();
    }),
};

export const Oval = {
    dye: Tile.dye,
    gen: (C, {W, H}) => Tile.gen(C, {W, H}).map((x, i) => [C[i], x.concat(RAND.gauss(1, 0.2) * x[2], 2 * Math.random())]),
    draw: (cr, pts) => pts.forEach(([color, [c_x, c_y, e_w, e_h, r_t]]) => draw(() => {
        cr.setSourceRGBA(...color);
        cr.translate(c_x, c_y);
        cr.rotate(r_t * Math.PI);
        cr.scale(e_w, e_h);
        cr.arc(0, 0, 1, 0, 2 * Math.PI);
        cr.fill();
    }, cr)),
};

export const Wave = {
    N: 5,
    dye: x => RAND.color(x, 1 / Wave.N),
    gen: (C, {W, H}) => {
        let [layers, ratio, min] = [Wave.N, 1 - RATIO, RAND.integer(6, 9)],
            [dt, st] = [ratio * H / layers, (1 - ratio) * H],
            pts = T.array(layers, i => (n => Curve.gen(T.array(n + 1, j => [W * j / n, st + RAND.compass(i, RATIO) * dt])))(min + RAND.natural(6)));
        return [W, H, C, pts];
    },
    draw: (cr, waves, {showColor, colorFont, colorStyle, dark}) => {
        let [x, y, {color, name}, pts] = waves;
        cr.setSourceRGBA(...color);
        pts.forEach(p => {
            Curve.link(cr, p);
            cr.lineTo(x, y);
            cr.lineTo(0, y);
            cr.fill();
        });
        if(showColor) {
            colorFont.set_size(x * Pango.SCALE / 15);
            let sc = colorStyle ? color.with(3, 1) : dark ? [1, 1, 1, 0.1] : [0, 0, 0, 0.1];
            paint(Markup, cr, Markup.gen(cr, colorFont, name, true), x, y * PANEL, true, sc);
        }
    },
};

export const Cloud = {
    shuffle: a => (loopr(i => swap(a, RAND.natural(i), i), a.length - 1, 1), a), // Ref: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    sway: a => (f => (loopl(i => { f(i, i - 1); f(i, i + 1); }, a.length - 1, 0, 2), a))(
        RAND.boolean() ? (i, j) => a[i] < a[j] && swap(a, i, j) : (i, j) => a[i] > a[j] && swap(a, i, j)),
    dye: x => T.array(3, () => RAND.color(x).color),
    $gen: ([x, y, w, h], offset) => {
        let mend = (a, b) => Math.floor(a > b ? RAND.gauss(x, w * a / 4) : RAND.gauss(x + w, w * (1 - a) / 4)),
            len = Math.floor(h / offset),
            stp = Cloud.sway(Cloud.shuffle(T.array(len, i => i / len))),
            fst = [mend(stp[0], stp[1]), y],
            ret = scanl((i, t) => ((a, b, c) => [[a, b, c], [a, b + offset, c]])(x + w * stp[i], t.at(-1).at(1), RAND.boolean()), [fst], T.array(len));
        return [fst, ...ret, [mend(stp.at(-1), stp.at(-2)), ret.at(-1).at(1)]];
    },
    gen: (C, {W, H}) => {
        let offset = H / 27,
            coords = [[0, 2, 4], [0, 2, 5], [0, 3, 5], [1, 3, 5], [1, 3, 5]][RAND.natural(5)],
            frame = pt => {
                let [a, b, c, d, e, f] = (() => {
                    switch(pt) {
                    case 0: return [0, 1 / 8, 1 / 16, 1 / 8, 2, [0, 0]];
                    case 1: return [0, 1 / 8, 1 / 8, 1 / 4, 2, [0, 1 / 4]];
                    case 2: return [0, 1 / 4, 0, 1 / 4, 5 / 2, [0, 2 / 4]];
                    case 3: return [0, 1 / 4, 1 / 8, 1 / 4, 3, [1 / 4, 2 / 4]];
                    case 4: return [0, 1 / 4, 0, 1 / 4, 5 / 2, [2 / 4, 2 / 4]];
                    default: return [1 / 8, 1 / 4, 1 / 8, 1 / 4, 2, [2 / 4, 1 / 4]];
                    }
                })();
                let h = RAND.integer(3 * offset, pt ? 7 * offset : 5 * offset);
                let w = RAND.integer(h * 2, e * offset * 7);
                return [RAND.integer(a * W, b * W) + f[0] * W, RAND.integer(c * H, d * H) + f[1] * H, w, h];
            };
        return [Moon.gen(W, H), offset / 20, coords.map((c, i) => [C[i], Cloud.$gen(frame(c), offset)])];
    },
    draw: (cr, clouds) => {
        let [moon, lw, pts] = clouds;
        paint(Moon, cr, moon);
        cr.setLineWidth(lw);
        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setLineJoin(Cairo.LineJoin.ROUND);
        pts.forEach(pt => {
            let [color, p] = pt;
            cr.setSourceRGBA(...color);
            cr.moveTo(...p[0]);
            loopl(i => {
                let [x, y, f, d_y] = [...p[i], (p[i + 1][1] - p[i][1]) / 2];
                let flag = x < p[i + 2][0];
                cr.lineTo(x, y);
                cr.stroke();
                let [c_x, c_y, r, s_t, e_t] = [x, y + d_y, d_y, flag ? 1 / 2 : -1 / 2, flag ? 3 / 2 : 1 / 2];
                cr.arc(c_x, c_y, r, s_t * Math.PI, e_t * Math.PI);
                cr.stroke();
                f && cr.arc(flag ? c_x + r : c_x - r, c_y, r, s_t * Math.PI, e_t * Math.PI), cr.stroke();
                cr.moveTo(p[i + 1][0], p[i + 1][1]);
            }, p.length - 2, 1, 2);
            cr.lineTo(...p.at(-1));
            cr.stroke();
        });
    },
};

const Markup = {
    gen: (cr, font, text, level) => {
        let pl = PangoCairo.create_layout(cr);
        if(level) pl.set_alignment(Pango.Alignment.CENTER);
        else pl.get_context().set_base_gravity(Pango.Gravity.EAST);
        pl.set_font_description(font);
        pl.set_markup(text, -1);
        return pl;
    },
    draw: (cr, pl, x, y, level, color) => {
        cr.moveTo(x, y); // HACK: PangoCairo is buggy with cr.translate sometimes?
        if(!level) cr.rotate(Math.PI / 2);
        if(color) {
            cr.setSourceRGBA(...color);
            PangoCairo.show_layout(cr, pl);
        } else {
            PangoCairo.layout_path(cr, pl);
        }
    },
};

const Seal = {
    link: (cr, x, y, w, h) => { // anti-clockwise curved rect
        let u = x + w,
            v = y + h,
            r = Math.min(w, h) / 3;
        cr.moveTo(x + r, y);
        cr.curveTo(x, y, x, y, x, y + r);
        cr.lineTo(x, v - r);
        cr.curveTo(x, v, x, v, x + r, v);
        cr.lineTo(u - r, v);
        cr.curveTo(u, v, u, v, u, v - r);
        cr.lineTo(u, y + r);
        cr.curveTo(u, y, u, y, u - r, y);
        cr.closePath();
    },
    gen: (cr, pl, W, H, seal, level, font, dark) => {
        if(!seal) return;
        let ed = pl.index_to_pos(T.encode(pl.get_text()).length),
            [u, v] = (level ? [ed.x, ed.y] : [-ed.y, ed.x]).map(x => x / Pango.SCALE),
            ps = Markup.gen(cr, font, seal, level),
            color = T.essay(() => {
                let {red, green, blue} = Pango.parse_markup(seal, -1, '')[1].get_attributes().find(x => x.as_color()).as_color().color;
                return [red / 0xffff, green / 0xffff, blue / 0xffff];
            }, () => dark ? [0.5, 0.16, 0.12] : [0.9, 0.36, 0.3]);
        return [ps, W + u, H + v, level, color];
    },
    draw: (cr, pts) => {
        if(!pts) return;
        let [ps, x, y, level, color] = pts;
        paint(Markup, cr, ps, x, y, level);
        let [w, h] = ps.get_pixel_size();
        Seal.link(cr, ...level ? [x, y, w, h] : [x - h, y, h, w]);
        cr.setSourceRGB(...color);
        cr.fill(); // FIXME: incorrect filling of stroke overlaps
    },
};

const Text = {
    gen: (cr, text, seal, {W, H, level, font, dark}) => {
        let pl = Markup.gen(cr, font, text, level);
        if(level) pl.set_alignment(Pango.Alignment.CENTER);
        let [w, h] = pl.get_pixel_size(),
            [a, b, c, d] = [W / 2, RATIO * H / 2, w / 2, h / 2],
            x, y;
        if(level) {
            x = Math.max(a - c, 0);
            y = Math.max(b - d, H * PANEL);
            Motto.area = [x, y, w, h];
        } else {
            x = Math.max(a + d, h);
            y = Math.max(b - c, H * PANEL);
            Motto.area = [x - h, y, h, w];
        }
        return [pl, x, y, level, Seal.gen(cr, pl, x, y, seal, level, font, dark)];
    },
    draw: (cr, pts, {dark}) => {
        let [pl, x, y, level, seal] = pts;
        paint(Seal, cr, seal);
        paint(Markup, cr, pl, x, y, level, dark ? BgRGBA.LIGHT : BgRGBA.DARK);
    },
};

const Image = {
    logo: (x, d) => St.IconTheme.new().lookup_icon(`${x}-${d ? 'text-dark' : 'text'}`, -1, St.IconLookupFlags.FORCE_SVG),
    gen: (fn, {W, H, dark}) => {
        try {
            let url = fn ? T.fopen(fn).get_path() : Image.logo(`${GLib.get_os_info('LOGO') || 'gnome-logo'}`, dark).get_filename(),
                img = url.endsWith('.svg') ? Rsvg.Handle.new_from_file(url) : GdkPixbuf.Pixbuf.new_from_file(url) && // HACK: avoid `uncatchable exception` assertion
                    St.TextureCache.get_default().load_file_to_cairo_surface(T.fopen(url), 1, 1),
                {width: w, height: h} = img instanceof Rsvg.Handle ? img : {width: img.getWidth(), height: img.getHeight()};
            Motto.area = [(W - w) / 2, (H * 0.8 - h) / 2, w, h];
            return img;
        } catch(e) {
            logError(e);
            Motto.area = [-1, -1, 0, 0];
            return null;
        }
    },
    draw: (cr, img) => {
        if(!img) return;
        let [x, y, width, height] = Motto.area;
        if(img instanceof Rsvg.Handle) {
            img.render_document(cr, new Rsvg.Rectangle({x, y, width, height}));
        } else {
            cr.setSourceSurface(img, x, y);
            cr.paint();
        }
    },
};

export const Motto = {
    text: null,
    area: [-1, -1, 0, 0],
    gen: (cr, [txt, img], host) => ((Motto.text = img === null)) ? Text.gen(cr, ...txt, host) : Image.gen(img, host),
    draw: (...xs) => Motto.text ? Text.draw(...xs) : Image.draw(...xs),
};

export const Tree = {
    dye: ({palette}) => palette.random(FG.MODERATE).color,
    $gen: (n, w, h, l) => { // Ref: http://fhtr.blogspot.com/2008/12/drawing-tree-with-haskell-and-cairo.html
        let branch = (vec, ang) => {
            if(!vec) return null;
            let t = vec[2] + ang * RAND.uniform(0.1, 0.9);
            let s = RAND.uniform(0.1, 0.9) * 3 * (1 - Math.abs(t)) ** 2;
            return s < 0.3 ? null : move(vec.slice(0, 2), s * l, t - 1 / 2).concat(t);
        };
        let root = [[w, h, 0], branch([w, h, 0], RAND.gauss(0, 1 / 64))],
            tree = root.concat(scanl((_x, t) => t.flatMap(a => [branch(a, -1 / 4), branch(a, 1 / 4)]), [root[1]], T.array(n - 1))),
            meld = (a = 0, b = 0, c) => Math.max(0.7 * (a + b) + 0.5 * (!a * b + !b * a), a * 1.2, b * 1.2) + !a * !b * 1.25 * c;
        loopr(i => tree[i] && tree[i].push(meld(tree[2 * i]?.[3], tree[2 * i + 1]?.[3], h / 1024)), tree.length - 1);
        loopl(i => tree[i] && !tree[2 * i] !== !tree[2 * i + 1] && tree[i].push(Flower.gen(tree[i], i, h / 54)), 2 ** n - 1, 1);
        return tree;
    },
    gen: (C, {W, H}) => {
        let ld = Land.gen(W, H),
            t1 = Tree.$gen(8, RAND.uniform(2, 5) * W / 20, 5 * H / 6, W / 30),
            t2 = Tree.$gen(6, RAND.uniform(14, 18) * W / 20, 5 * H / 6, W / 30);
        return [t1, t2, ld, C];
    },
    $draw: (cr, pts, color) => {
        cr.setSourceRGBA(...BgRGBA.DARK);
        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setLineJoin(Cairo.LineJoin.ROUND);
        let lineTo = i => pts[i] && (cr.setLineWidth(pts[i][3]), cr.lineTo(pts[i][0], pts[i][1]), cr.stroke());
        let flower = (i, s) => (pts[i] && pts[i][4]) && (s === pts[i][4].at(-1)) && paint(Flower, cr, pts[i][4], color);
        loopl(i => {
            loopl(j => {
                if(!pts[j]) return;
                flower(2 * j, false), cr.moveTo(pts[j][0], pts[j][1]), lineTo(2 * j);
                flower(2 * j + 1, false), cr.moveTo(pts[j][0], pts[j][1]), lineTo(2 * j + 1);
                flower(j, true);
            }, 2 ** i - 1, Math.floor(2 ** (i - 1)));
        }, Math.floor(Math.log2(pts.length)) - 1);
    },
    draw: (cr, pts) => {
        let [t1, t2, ld, cl] = pts;
        paint(Land, cr, ld, cl, () => [t1, t2].forEach(tr => draw(Tree.$draw, cr, tr, cl)));
    },
};

const Flower = {
    gen: ([x, y, v, w], z, l = 20, n = 5) => {
        if(z < 8) return [w * 0.9, [x, y], move([x, y], RAND.gauss(5 / 2, 1) * l, v - 1 / 2), false];
        let dt = 2 / (n + 1),
            it = rotate(RAND.uniform(0, 2)),
            st = RAND.gauss(1 / 2, 1 / 9),
            rt = 1 - Math.abs(st * 2 - 1),
            stop = pie(T.array(n, () => RAND.gauss(1, 1 / 2 - rt)), dt),
            cast = (r, t) => affine(p2ct(r, t), [[1, cosp(st) * rt, 0], [0, sinp(st) * rt, 0]], it, translate([x, y]));
        return [scanl(add, 0, stop).map((s, i) => [i, i + 1].map(j => [0.05, 0.1, 1].map(r => cast(r * l, s + j * dt)))), sinp(st) * rt > 0.6];
    },
    draw: (cr, pts, color) => {
        if(pts.length > 2) {
            let [w, s, t] = pts;
            cr.setLineWidth(w);
            cr.setSourceRGBA(0.2, 0.2, 0.2, 0.7);
            cr.setLineCap(Cairo.LineCap.BUTT); // intercept
            cr.moveTo(...s);
            cr.lineTo(...t);
            cr.stroke();
        } else {
            let [pt] = pts;
            cr.setSourceRGBA(...color);
            pt.forEach(p => {
                cr.moveTo(...p[0][1]);
                cr.curveTo(...p[0][2], ...p[1][2], ...p[1][1]);
                cr.curveTo(...p[1][0], ...p[0][0], ...p[0][1]);
            });
            cr.fill();
        }
    },
};

const Land = {
    gen: (W, H, n = 20, ratio = 5 / 6) => {
        let riverbed = Curve.gen(zipWith((u, v) => [u * W / n, v === 0 ? ratio * H : RAND.gauss(ratio + v / 48, 1 / 96) * H],
            T.array(10, i => i + 5), [0, 0, 2, 4, 5, 6, 6, 3, 0, 0]), 0.3);
        return [H / 512, [0, 7 * H / 8, W, H / 8], ratio * H, W, riverbed];
    },
    draw: (cr, pts, color, tree) => {
        let [lw, rs, ld, wd, rb] = pts;
        cr.moveTo(0, ld);
        cr.lineTo(...rb[0]);
        Curve.link(cr, rb);
        cr.lineTo(wd, ld);
        cr.setSourceRGBA(0, 0, 0, 0.4);
        cr.setLineWidth(lw);
        cr.strokePreserve();
        [[wd, 0], [0, 0], [0, ld]].forEach(p => cr.lineTo(...p));
        cr.clip();
        cr.rectangle(...rs);
        cr.setSourceRGBA(...color.with(3, 0.4));
        cr.fill();
        tree();
    },
};
