// vim:fdm=syntax
// by tuberry

import St from 'gi://St';
import GLib from 'gi://GLib';
import Rsvg from 'gi://Rsvg';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';
import GdkPixbuf from 'gi://GdkPixbuf';
import PangoCairo from 'gi://PangoCairo';

import * as Color from './color.js';
import { array, fopen } from './util.js';

let Ratio = 2 / 3,
    FontName = '',
    DarkBg = true,
    TextRect = [-1, -1, 0, 0];

const add = (u, v) => u + v;
const sinp = t => Math.sin(t * Math.PI);
const cosp = t => Math.cos(t * Math.PI);
const p2ct = (r, t) => [r * cosp(t), r * sinp(t)];

const rAmp = (u, v) => Math.random() * 2 * v + u - v;
const rand = (l, u) => Math.random() * (u - l) + l;
const rInt = (l, u) => Math.floor(rand(l, u + 1)); // -> l .. u
const rN = n => Math.floor(Math.random() * n); // -> 0 .. n - 1
const rBool = () => Math.random() < 0.5;
const rNormal = normal();

const Y = f => f(x => Y(f)(x)); // Y combinator
const scanl = (f, a, xs) => xs.flatMap(x => (a = f(x, a)));
const zipWith = (f, ...xss) => xss[0].map((_x, i) => f(...xss.map(xs => xs[i])));
const lerp = (a, b, t) => zipWith((u, v) => (1 - t) * u + t * v, a, b);
const norm2 = (a, b) => Math.hypot(...zipWith((u, v) => u - v, a, b));
const move = (a, r, t) => zipWith(add, a, p2ct(r, t));
const translate = ([x, y]) => [[1, 0, x], [0, 1, y]];
const rotate = t => [[cosp(t), sinp(t), 0], [-sinp(t), cosp(t), 0]];
const dot = (xs, ys) => xs.map((x, i) => x * ys[i]).reduce(add);
const affine = (xs, ...ms) => ms.reduce((a, m) => m.map(v => dot(v, a.concat(1))), xs);
const swap = (a, i, j) => ([a[i], a[j]] = [a[j], a[i]]);
const pie = (a, s = 1) => (m => a.map(x => x * s / m))(a.reduce(add));
const loopl = (f, u, l = 0, s = 1) => { for(let i = l; i <= u; i += s) f(i); };
const loopr = (f, u, l = 0, s = 1) => { for(let i = u; i >= l; i -= s) f(i); };

export function setDarkBg(dark) { DarkBg = dark; }
export function setFontName(font) { FontName = font; }

function overlap([x, y, w, h], [m, n, p, q]) {
    let dw = Math.max(0, Math.min(x + w, m + p) - Math.max(x, m));
    let dh = Math.max(0, Math.min(y + h, n + q) - Math.max(y, n));
    return dw * dh > 0.06 * w * h;
}

function normal() { // -> [0, 1]
    // Ref: https://en.wikipedia.org/wiki/Marsaglia_polar_method
    let spare = [];
    return function () {
        if(spare.length) {
            return spare.pop();
        } else {
            let u, v, s;
            do {
                u = 2 * Math.random() - 1;
                v = 2 * Math.random() - 1;
                s = u * u + v * v;
            } while(s >= 1 || s === 0);
            s = Math.sqrt(-2 * Math.log(s) / s);
            spare.push(Math.clamp(u * s / 6 + 0.5, 0, 1));
            return Math.clamp(v * s / 6 + 0.5, 0, 1);
        }
    };
}

function rGauss(mu, sigma, k = 0) { // k <- (-1, 1)
    let n = Math.pow(rNormal(), 1 - Math.log2(1 + Math.abs(k)));
    return mu + sigma * (6 * (k < 0 ? 1 - n : n) - 3);
}

function rBimodal(mu, s3, k = 0.5) { // k <- (0, 1)
    return rGauss(mu, s3 / 3, rBool() ? k : -k);
}

function rGamma(a, b = 1) { // a:alpha == k > 0, b:beta == 1 / theta > 0
    // Ref: https://en.wikipedia.org/wiki/Gamma_distribution#Random_variate_generation
    if(a < 1) return rGamma(a + 1, b) * Math.pow(Math.random(), 1 / a);
    let d = a - 1 / 3,
        c = 1 / Math.sqrt(9 * d),
        u, v, s;
    do {
        do {
            s = rGauss(0, 1);
            v = 1 + c * s;
        } while(v <= 0);
        v *= v * v;
        u = 1 - Math.random();
    } while(u >= 1 - 0.331 * s * s * s * s && Math.log(u) >= s * s / 2 + d * (1 - v  + Math.log(v)));
    return d * v / b;
}

function rDirichlet(n, a, s = 1) { // n <- N+
    return pie(array(n, () => rGamma(a)), s);
}

function shuffle(a) {
    // Ref: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    loopr(i => swap(a, rN(i), i), a.length - 1, 1);
    return a;
}

function sample(a, n) { // n < a.length
    let ret = [], idx = {};
    loopr(i => (j => {
        ret.push(idx[j] ?? j);
        idx[j] = idx[i] ?? i;
    })(rN(i)), a.length - 1, a.length - n);
    return ret.map(x => a[x]);
}

function wave(a) {
    rBool() ? loopl(i => {
        if(i !== 0 && a[i] < a[i - 1]) swap(a, i, i - 1);
        if(i !== a.length - 1 && a[i] < a[i + 1]) swap(a, i, i + 1);
    }, a.length - 1, 0, 2) : loopl(i => {
        if(i !== 0 && a[i] > a[i - 1]) swap(a, i, i - 1);
        if(i !== a.length - 1 && a[i] > a[i + 1]) swap(a, i, i + 1);
    }, a.length - 1, 0, 2);
    return a;
}

function genPolygon([x, y, r], n = 6, a = 8, dt_r = 0.25) {
    // Ref: https://stackoverflow.com/a/25276331
    return scanl(add, rand(0, 2), rDirichlet(n, a, 2)).map(t => move([x, y], rGauss(0.95, dt_r) * r, t));
}

function genLattices(rect, sum = 20, factor = 1 / 5) { // reduce collision
    // Ref: https://stackoverflow.com/a/4382286
    return Y(f => n => n === 0 ? [rect] : f(n - 1).flatMap(([x, y, w, h]) => {
        let [a, b] = [w, h].map(i => Math.round(i * rBimodal(1 / 2, factor)));
        return Math.abs(a / w - 1 / 2) < Math.abs(b / h - 1 / 2)
            ? [[x, y, a, b], [x, y + b, a, h - b], [x + a, y, w - a, h - b], [x + a, y + h - b, w - a, b]]
            : [[x, y, a, b], [x + a, y, w - a, b], [x, y + b, w - a, h - b], [x + w - a, y + b, a, h - b]];
    }))(Math.ceil(Math.log2(sum) / 2));
}

function circle([x, y, w, h]) {
    let r = Math.min(w, h) / 2;
    let ctr = w > h ? [x + rand(r, w - r), y + h / 2] : [x + w / 2, y + rand(r, h - r)];
    return ctr.concat(r);
}

function genBezeirCtrls([a, b, c], smooth) {
    // Ref: https://zhuanlan.zhihu.com/p/267693043
    let ms = [a, c].map(x => lerp(x, b, 1 / 2)),
        d = lerp(...ms, 1 / (1 + norm2(c, b) / norm2(a, b))),
        [e, f] = ms.map(x => zipWith((u, v, w) => u + (v - w) * smooth, b, x, d));
    return [e, b, f];
}

function genBezeirCurve(pts, smooth = 1, closed = false) { // -> [start, ...ctrls]
    if(closed) {
        let ctrls = array(pts.length, i => genBezeirCtrls(array(3, j => pts[(i + j) % pts.length]), smooth)).flat();
        return [pts[0], ctrls.at(-1), ...ctrls.slice(0, -1)];
    } else {
        let ctrls = array(pts.length - 2, i => genBezeirCtrls(array(3, j => pts[i + j]), smooth)).flat();
        return [pts[0], pts[0], ...ctrls, pts.at(-1), pts.at(-1)];
    }
}

function drawBezeirCurve(cr, [start, ...pts]) {
    cr.moveTo(...start);
    loopl(i => cr.curveTo(...array(3, j => pts[i + j]).flat()), pts.length - 1, 0, 3);
}

function genMoon(x, _y) {
    let p = Math.abs((Date.now() / 86400000 - 18256.8) / 29.5305882) % 1, // Ref: https://ecomaan.nl/javascript/moonphase/
        [c_x, c_y, r, s_t, e_t, t] = [x * 8 / 10, x / 10, x / 20, 0, Math.PI, p > 0.5 ? Math.PI / 4 : -Math.PI / 4],
        q = (1 - Math.abs(2 * p - 1)).toFixed(3);
    if(Math.abs(q - 1) < 0.005) {
        return [c_x, c_y, r, Color.LIGHT];
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
}

function drawMoon(cr, pts) {
    cr.save();
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
    cr.restore();
}

export function genWaves(x, y) {
    let [layers, factor, min] = [5, 1 - Ratio, rInt(6, 9)],
        [dt, st] = [factor * y / layers, (1 - factor) * y],
        pts = array(layers, i => (n => genBezeirCurve(array(n + 1, j => [x * j / n, st + rAmp(i, Ratio) * dt])))(min + rN(6)));
    return [[x, y, Color.random(DarkBg, 1 / layers)], pts];
}

export function drawWaves(cr, waves, show) {
    let [[x, y, color], pts] = waves;
    cr.save();
    cr.setSourceRGBA(...color.color);
    pts.forEach(p => {
        drawBezeirCurve(cr, p);
        cr.lineTo(x, y);
        cr.lineTo(0, y);
        cr.fill();
    });
    show && drawColor(cr, x, y, color);
    cr.restore();
}

function drawColor(cr, x, y, color) {
    if(!FontName) return;
    cr.save();
    (fg => cr.setSourceRGBA(fg, fg, fg, 0.1))(DarkBg ? 1 : 0);
    let pl = PangoCairo.create_layout(cr);
    let ft = Pango.FontDescription.from_string(FontName);
    ft.set_size(x * Pango.SCALE / 15);
    pl.set_font_description(ft);
    pl.get_context().set_base_gravity(Pango.Gravity.EAST);
    pl.set_markup(color.name, -1);
    cr.moveTo(x, 0.03 * y);
    cr.rotate(Math.PI / 2);
    PangoCairo.show_layout(cr, pl);
    cr.restore();
}

export function genBlobs(x, y) {
    return sample(genLattices([0, 0, x, y]).filter(rect => !overlap(rect, TextRect)), 16)
        .map(rect => [Color.random(DarkBg, 0.5).color, genBezeirCurve(genPolygon(circle(rect)), 1, true)]);
}

export function drawBlobs(cr, pts) {
    cr.save();
    pts.forEach(pt => {
        let [color, p] = pt;
        cr.setSourceRGBA(...color);
        drawBezeirCurve(cr, p);
        cr.fill();
    });
    cr.restore();
}

export function genOvals(x, y) {
    return sample(genLattices([0, 0, x, y]).filter(rect => !overlap(rect, TextRect)), 16).map(rect => {
        let [c_x, c_y, r] = circle(rect);
        let [e_w, e_h] = [r, rGauss(1, 0.2) * r];
        return [Color.random(DarkBg, 0.5).color, [c_x, c_y, e_w, e_h, 2 * Math.random()]];
    });
}

export function drawOvals(cr, pts) {
    pts.forEach(pt => {
        let [color, [c_x, c_y, e_w, e_h, r_t]] = pt;
        cr.save();
        cr.setSourceRGBA(...color);
        cr.translate(c_x, c_y);
        cr.rotate(r_t * Math.PI);
        cr.scale(e_w, e_h);
        cr.arc(0, 0, 1.0, 0, 2 * Math.PI);
        cr.fill();
        cr.restore();
    });
}

export function genCloud([x, y, w, h], offset) {
    let mend = (a, b) => Math.floor(a > b ? rGauss(x, w * a / 4) : rGauss(x + w, w * (1 - a) / 4)),
        len = Math.floor(h / offset),
        stp = wave(shuffle(array(len, i => i / len))),
        fst = [mend(stp[0], stp[1]), y],
        ret = scanl((i, t) => ((a, b, c) => [[a, b, c], [a, b + offset, c]])(x + w * stp[i], t.at(-1).at(1), rBool()), [fst], array(len));
    return [fst, ...ret, [mend(stp.at(-1), stp.at(-2)), ret.at(-1).at(1)]];
}

export function genClouds(x, y) {
    let offset = y / 27,
        coords = [[0, 2, 4], [0, 2, 5], [0, 3, 5], [1, 3, 5], [1, 3, 5]][rN(5)],
        genRect = pt => {
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
            let h = rInt(3 * offset, pt ? 7 * offset : 5 * offset);
            let w = rInt(h * 2, e * offset * 7);
            return [rInt(a * x, b * x) + f[0] * x, rInt(c * y, d * y) + f[1] * y, w, h];
        };
    return [genMoon(x, y), coords.map(c => [Color.random(DarkBg).color, genCloud(genRect(c), offset)])];
}

export function drawClouds(cr, clouds) {
    let [moon, pts] = clouds;
    drawMoon(cr, moon);
    cr.save();
    pts.forEach(pt => {
        let [color, p] = pt;
        // cr.setLineWidth(2);
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
    cr.restore();
}

export function genMotto(cr, x, y, text, vt) {
    let pl = PangoCairo.create_layout(cr);
    if(vt) {
        pl.set_width(Ratio * y * Pango.SCALE);
        pl.get_context().set_base_gravity(Pango.Gravity.EAST);
    } else {
        pl.set_alignment(Pango.Alignment.CENTER);
    }
    pl.set_font_description(Pango.FontDescription.from_string(FontName));
    pl.set_markup(text.replace(/SZ_BGCOLOR/g, DarkBg ? Color.DHEX : Color.LHEX), -1);
    let [fw, fh] = pl.get_pixel_size();
    let [a, b, c, d] = [x / 2, Ratio * y / 2, fw / 2, fh / 2];
    TextRect = vt ? [a - d, Math.max(b - c, y / 32), fh, fw] : [a - c, b - d, fw, fh];
    return [x, y, pl, vt, fw, fh];
}

export function drawMotto(cr, pts) {
    let [x, y, pl, vt, fw, fh] = pts;
    cr.save();
    cr.setSourceRGBA(...DarkBg ? Color.LIGHT : Color.DARK);
    if(vt) {
        let dy = fw < y * (Ratio - 1 / 16) ? 0 : y / 32;
        cr.moveTo((x + fh) / 2, (Ratio * y - fw) / 2 + dy);
        cr.rotate(Math.PI / 2);
    } else {
        cr.moveTo((x - fw) / 2, (Ratio * y - fh) / 2);
    }
    PangoCairo.show_layout(cr, pl);
    cr.restore();
}

export function drawBackground(cr) {
    cr.save();
    cr.setSourceRGBA(...DarkBg ? Color.DARK : Color.LIGHT);
    cr.paint();
    cr.restore();
}

export function genTrees(x, y) {
    let ld = genLand(x, y),
        cl = Color.random(),
        t1 = genTree(8, rand(2, 5) * x / 20, 5 * y / 6, x / 30),
        t2 = genTree(6, rand(14, 18) * x / 20, 5 * y / 6, x / 30);
    return [t1, t2, ld].map(v => v.concat(cl));
}

export function drawTrees(cr, pts) {
    let [t1, t2, ld] = pts;
    drawTree(cr, t1);
    drawTree(cr, t2);
    drawLand(cr, ld);
}

function genFlower([x, y, v, w], z, l = 20, n = 5) {
    if(z < 8) return [w * 0.9, [x, y], move([x, y], rGauss(5 / 2, 1) * l, v - 1 / 2), false];
    let dt = 2 / (n + 1),
        it = rotate(rand(0, 2)),
        st = rGauss(1 / 2, 1 / 9),
        fc = 1 - Math.abs(st * 2 - 1),
        stp = pie(array(n, () => rGauss(1, 1 / 2 - fc)), dt),
        cast = (r, t) => affine(p2ct(r, t), [[1, cosp(st) * fc, 0], [0, sinp(st) * fc, 0]], it, translate([x, y]));
    return [scanl(add, 0, stp).map((s, i) => [i, i + 1].map(j => [0.05, 0.1, 1].map(r => cast(r * l, s + j * dt)))), sinp(st) * fc > 0.6];
}

function drawFlower(cr, pts, cl) {
    cr.save();
    if(pts.length > 2) {
        let [w, s, t] = pts;
        cr.setLineWidth(w);
        cr.setSourceRGBA(0.2, 0.2, 0.2, 0.7);
        cr.setLineCap(Cairo.LineCap.BUTT);
        cr.moveTo(...s);
        cr.lineTo(...t);
        cr.stroke();
    } else {
        let [pt] = pts;
        cr.setSourceRGBA(...cl.color);
        pt.forEach(p => {
            cr.moveTo(...p[0][1]);
            cr.curveTo(...p[0][2], ...p[1][2], ...p[1][1]);
            cr.curveTo(...p[1][0], ...p[0][0], ...p[0][1]);
        });
        cr.fill();
    }
    cr.restore();
}

export function genTree(n, x, y, l) {
    // Ref: http://fhtr.blogspot.com/2008/12/drawing-tree-with-haskell-and-cairo.html
    let branch = (vec, ang) => {
        if(!vec) return null;
        let t = vec[2] + ang * rand(0.1, 0.9);
        let s = rand(0.1, 0.9) * 3 * (1 - Math.abs(t)) ** 2;
        return s < 0.3 ? null : move(vec.slice(0, 2), s * l, t - 1 / 2).concat(t);
    };
    let root = [[x, y, 0], branch([x, y, 0], rGauss(0, 1 / 64))],
        tree = root.concat(scanl((_x, t) => t.flatMap(a => [branch(a, -1 / 4), branch(a, 1 / 4)]), [root[1]], array(n - 1))),
        meld = (a = 0, b = 0, c) => Math.max(0.7 * (a + b) + 0.5 * (!a * b + !b * a), a * 1.2, b * 1.2) + !a * !b * 1.25 * c;
    loopr(i => tree[i] && tree[i].push(meld(tree[2 * i]?.[3], tree[2 * i + 1]?.[3], y / 1024)), tree.length - 1);
    loopl(i => tree[i] && !tree[2 * i] !== !tree[2 * i + 1] && tree[i].push(genFlower(tree[i], i, y / 54)), 2 ** n - 1, 1);
    return [tree];
}

export function drawTree(cr, pts) {
    let [tr, cl] = pts;
    cr.save();
    cr.setLineCap(Cairo.LineCap.ROUND);
    cr.setLineJoin(Cairo.LineJoin.ROUND);
    cr.setSourceRGBA(...Color.DARK);
    let lineTo = i => tr[i] && (cr.setLineWidth(tr[i][3]), cr.lineTo(tr[i][0], tr[i][1]), cr.stroke());
    let flower = (i, s) => (tr[i] && tr[i][4]) && (s === tr[i][4].at(-1)) && drawFlower(cr, tr[i][4], cl);
    loopl(i => {
        loopl(j => {
            if(!tr[j]) return;
            flower(2 * j, false), cr.moveTo(tr[j][0], tr[j][1]), lineTo(2 * j);
            flower(2 * j + 1, false), cr.moveTo(tr[j][0], tr[j][1]), lineTo(2 * j + 1);
            flower(j, true);
        }, 2 ** i - 1, Math.floor(2 ** (i - 1)));
    }, Math.floor(Math.log2(tr.length)) - 1);
    cr.restore();
}

function genLand(x, y, n = 20, f = 5 / 6) {
    let riverbed = genBezeirCurve(zipWith((u, v) => [u * x / n, v === 40 ? f * y : rGauss(v * y / 48, y / 96)],
        array(10, i => i + 5), [40, 40, 42, 44, 45, 46, 46, 43, 40, 40]), 0.3);
    return [y / 1024, [0, 7 * y / 8, x, y / 8], riverbed, [[x, f * y], [x, y], [0, y], [0, f * y]]];
}

function drawLand(cr, pts) {
    let [sf, rc, rb, ld, cl] = pts;
    cr.save();
    cr.setSourceRGBA(...cl.color.slice(0, 3), 0.4);
    cr.rectangle(...rc);
    cr.fill();
    cr.setSourceRGBA(...Color.LIGHT);
    drawBezeirCurve(cr, rb);
    loopl(i => cr.lineTo(...ld[i]), ld.length - 1);
    cr.fill();
    cr.moveTo(...ld.at(-1));
    cr.lineTo(...rb[0]);
    drawBezeirCurve(cr, rb);
    cr.lineTo(...ld[0]);
    cr.setSourceRGBA(0, 0, 0, 0.4);
    cr.setLineWidth(sf * 2);
    cr.stroke();
    cr.restore();
}

export function genLogo(fn, x, y) {
    try {
        let path = fn ? fn.replace(/~/, GLib.get_home_dir())
                : new St.IconTheme().lookup_icon(`${GLib.get_os_info('LOGO') || 'gnome-logo'}-${DarkBg ? 'text-dark' : 'text'}`,
                    256, St.IconLookupFlags.FORCE_SVG)?.get_filename(),
            svg = path.endsWith('.svg'),
            img = svg ? Rsvg.Handle.new_from_file(path) : GdkPixbuf.Pixbuf.new_from_file(path) && // NOTE: avoid `uncatchable exception` assertion
            St.TextureCache.get_default().load_file_to_cairo_surface(fopen(path), 1, 1),
            { width: w, height: h } = svg ? img : { width: img.getWidth(), height: img.getHeight() };
        TextRect = [(x - w) / 2, (y * 0.8 - h) / 2, w, h];
        return [svg, img];
    } catch(e) {
        logError(e);
        TextRect = [-1, -1, 0, 0];
        return [];
    }
}

export function drawLogo(cr, pts) {
    if(!pts.length) return;
    cr.save();
    let [svg, img] = pts;
    let [x, y, width, height] = TextRect;
    if(svg) {
        img.render_document(cr, new Rsvg.Rectangle({ x, y, width, height }));
    } else {
        cr.setSourceSurface(img, x, y);
        cr.paint();
    }
    cr.restore();
}
