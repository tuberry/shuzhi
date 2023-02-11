// vim:fdm=syntax
// by tuberry
/* exported setFontName setDarkBg genWaves drawWaves genBlobs
 * drawBlobs genOvals drawOvals genClouds drawClouds genTrees
 * genMotto drawMotto drawBackground drawTrees genLogo drawLogo */
'use strict';

const Cairo = imports.cairo;
const { PangoCairo, Pango, GLib, Gtk, Gdk, GdkPixbuf, Rsvg } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Color = Me.imports.color;

let Ratio = 2 / 3,
    NSpare = [], // cache of normal()
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

const Y = f => f(x => Y(f)(x)); // Y combinator
const scanl = (f, a, xs) => xs.flatMap(x => (a = f(x, a)));
const zipWith = (f, ...xss) => xss[0].map((_x, i) => f(...xss.map(xs => xs[i])));
const array = (n, f = i => i) => Array.from({ length: n }, (_x, i) => f(i));
const dist = (a, b) => Math.hypot(...zipWith((u, v) => u - v, a, b));
const dot = (xs, ys) => xs.map((x, i) => x * ys[i]).reduce(add);
const rotate = t => [[cosp(t), sinp(t), 0], [-sinp(t), cosp(t), 0]];
const move = ([x, y]) => [[1, 0, x], [0, 1, y]];
const affine = (xs, ...ms) => ms.reduce((p, v) => v.map(w => dot(w, p.concat(1))), xs);

const rgba2hex = rgba => `#${rgba.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
const lookupIcon = a => new Gtk.IconTheme().lookup_icon(a, 256, Gtk.IconLookupFlags.FORCE_SVG)?.get_filename();

function setDarkBg(dark) { DarkBg = dark; }
function setFontName(font) { FontName = font; }
function setTextRect(rect) { TextRect = rect; }
function getBgColor() { return rgba2hex(DarkBg ? Color.DARK : Color.LIGHT); }

function overlap([x, y, w, h], [m, n, p, q]) {
    let dw = Math.max(0, Math.min(x + w, m + p) - Math.max(x, m));
    let dh = Math.max(0, Math.min(y + h, n + q) - Math.max(y, n));
    return dw * dh > 0.06 * w * h;
}

function loop(f, u, l = 0, s = 1) {
    if(s > 0) for(let i = l; i <= u; i += s) f(i);
    else for(let i = l; i >= u; i += s) f(i);
}

function rNormal() { // -> [0, 1)
    // Ref: https://en.wikipedia.org/wiki/Marsaglia_polar_method
    if(NSpare.length) {
        return NSpare.pop();
    } else {
        let u, v, s,
            trim = x => x < 0 || x >= 1 ? 0.5 : x;
        do {
            u = 2 * Math.random() - 1;
            v = 2 * Math.random() - 1;
            s = u * u + v * v;
        } while(s >= 1 || s === 0);
        s = Math.sqrt(-2 * Math.log(s) / s);
        NSpare.push(trim(u * s / 6 + 0.5));
        return trim(v * s / 6 + 0.5);
    }
}

function rGauss(mu, sigma, k = 0) { // k <- (-1, 1)
    let n = Math.pow(rNormal(), 1 + Math.log(1 + Math.abs(k)) / Math.log(0.5));
    if(k < 0) n = 1 - n;
    return mu + sigma * (6 * n - 3);
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

function rDirichlet(n, a, s = 1) { // -> (0, 1), n <- N+
    let ret = shuffle(array(n, () => rGamma(a)));
    let sum = ret.reduce(add, 0);
    return ret.map(x => x * s / sum);
}

function shuffle(a) {
    // Ref: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    loop(i => (j => ([a[i], a[j]] = [a[j], a[i]]))(rN(i)), 1, a.length - 1, -1);
    return a;
}

function sample(a, n) { // n < a.length
    let ret = [];
    for(let i = a.length - 1, idx = {}, j; i >= a.length - n; i--) {
        j = rN(i);
        ret.push(idx[j] ?? j);
        idx[j] = idx[i] ?? i;
    }
    return ret.map(x => a[x]);
}

function wave(a) {
    rBool() ? loop(i => {
        i !== 0 && a[i] < a[i - 1] && ([a[i], a[i - 1]] = [a[i - 1], a[i]]);
        i !== a.length - 1 && a[i] < a[i + 1] && ([a[i], a[i + 1]] = [a[i + 1], a[i]]);
    }, a.length - 1, 0, 2) : loop(i => {
        i !== 0 && a[i] > a[i - 1] && ([a[i], a[i - 1]] = [a[i - 1], a[i]]);
        i !== a.length - 1 && a[i] > a[i + 1] && ([a[i], a[i + 1]] = [a[i + 1], a[i]]);
    }, a.length - 1, 0, 2);
    return a;
}

function genPolygon([x, y, r], n = 6, a = 4, dt_r = 0.2) {
    // Ref: https://stackoverflow.com/a/25276331
    return scanl(add, rand(0, 2), rDirichlet(n, a, 2))
        .map(t => zipWith(add, [x, y], p2ct(rGauss(1, dt_r) * r, t)));
}

function genCoords(rect, sum = 20, fac = 1 / 5) { // reduce collision
    // Ref: https://stackoverflow.com/a/4382286
    return Y(f => n => n === 0 ? [rect] : f(n - 1).flatMap(([x, y, w, h]) => {
        let [a, b] = [w, h].map(i => Math.round(i * rBimodal(1 / 2, fac)));
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

function bezeirCtrls(pts, smooth = 1, closed = false) {
    // Ref: https://zhuanlan.zhihu.com/p/267693043
    let ctrls = array(pts.length - (closed ? 1 : 2), i => i + 1).flatMap(i => {
        let [a, b, c] = [i - 1, i, i + 1].map(x => pts[x % pts.length]), // i - 1 >= 0
            ls = [a, c].map(x => dist(x, b)),
            ms = [a, c].map(x => zipWith((u, v) => (u + v) / 2, x, b)),
            ds = (k => zipWith((u, v) => u + (v - u) * k, ...ms))(ls[0] / ls.reduce(add));
        return (([x, y]) => [x, pts[i], y])(ms.map(x => zipWith((u, v, w) => u + (v - w) * smooth, b, x, ds)));
    });
    return closed ? ctrls.splice(-1).concat(ctrls) : [pts[0]].concat(ctrls, [pts.at(-1), pts.at(-1)]);
}

function genMoon(x, _y) {
    let p = Math.abs((Date.now() / 86400000 - 18256.8) / 29.5305882) % 1, // Ref: https://ecomaan.nl/javascript/moonphase/
        [c_x, c_y, r, s_t, e_t, t] = [x * 8 / 10, x / 10, x / 20, 0, Math.PI,  p > 0.5 ? Math.PI / 4 : -Math.PI / 4],
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

function genWaves(x, y) {
    let [layers, factor, min] = [5, 1 - Ratio, rInt(6, 9)],
        [dt, st] = [factor * y / layers, (1 - factor) * y],
        pts = array(layers, i => (n => bezeirCtrls(array(n + 1, j => [x * j / n, st + rAmp(i, Ratio) * dt])))(min + rN(6)));
    return [[x, y, Color.random(DarkBg, 1 / layers)], pts];
}

function drawWaves(cr, waves, show) {
    let [other, pts] = waves;
    let [x, y, color] = other;
    cr.save();
    cr.setSourceRGBA(...color.color);
    pts.forEach(p => {
        cr.moveTo(x, y);
        cr.lineTo(0, y);
        cr.lineTo(...p[0]);
        loop(i => cr.curveTo(...p[i], ...p[i + 1], ...p[i + 2]), p.length - 1, 0, 3);
        cr.closePath();
        cr.fill();
    });
    show && drawColor(cr, other);
    cr.restore();
}

function drawColor(cr, color) {
    if(!FontName) return;
    let [x, y, cl] = color;
    (fg => cr.setSourceRGBA(fg, fg, fg, 0.1))(DarkBg ? 1 : 0);
    let pl = PangoCairo.create_layout(cr);
    let ft = Pango.FontDescription.from_string(FontName);
    ft.set_size(x * Pango.SCALE / 15);
    pl.set_font_description(ft);
    pl.get_context().set_base_gravity(Pango.Gravity.EAST);
    pl.set_markup(cl.name, -1);
    cr.save();
    cr.moveTo(x, 0.03 * y);
    cr.rotate(Math.PI / 2);
    PangoCairo.show_layout(cr, pl);
    cr.restore();
}

function genBlobs(x, y) {
    return sample(genCoords([0, 0, x, y]).filter(rect => !overlap(rect, TextRect)), 16)
        .map(rect => [Color.random(DarkBg, 0.5).color, bezeirCtrls(genPolygon(circle(rect)), 1, true)]);
}

function drawBlobs(cr, pts) {
    cr.save();
    pts.forEach(pt => {
        let [color, p] = pt;
        cr.setSourceRGBA(...color);
        cr.moveTo(...p.at(-1));
        loop(i => cr.curveTo(...p[i], ...p[i + 1], ...p[i + 2]), p.length - 1, 0, 3);
        cr.fill();
    });
    cr.restore();
}

function genOvals(x, y) {
    return sample(genCoords([0, 0, x, y]).filter(rect => !overlap(rect, TextRect)), 16).map(rect => {
        let [c_x, c_y, r] = circle(rect);
        let [e_w, e_h] = [r, rGauss(1, 0.2) * r];
        return [Color.random(DarkBg, 0.5).color, [c_x, c_y, e_w, e_h, 2 * Math.random()]];
    });
}

function drawOvals(cr, pts) {
    pts.forEach(pt => {
        let color = pt[0];
        let [c_x, c_y, e_w, e_h, r_t] = pt[1];
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

function genCloud([x, y, w, h], offset) {
    let extra = (a, b) => Math.floor(a > b ? rGauss(x, w * a / 4) : rGauss(x + w, w * (1 - a) / 4)),
        len = Math.floor(h / offset),
        stp = wave(shuffle(array(len, i => i / len))),
        fst = [[extra(stp[0], stp[1]), y]],
        ret = scanl((i, t) => ((a, b, c) => [[a, b, c], [a, b + offset, c]])(x + w * stp[i], t.at(-1)[1], rBool()), fst, array(len));
    return fst.concat(ret, [[extra(stp.at(-1), stp.at(-2)), ret.at(-1)[1]]]);
}

function genClouds(x, y) {
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

function drawClouds(cr, clouds) {
    let [moon, pts] = clouds;
    drawMoon(cr, moon);
    cr.save();
    pts.forEach(pt => {
        let [color, p] = pt;
        // cr.setLineWidth(2);
        cr.setSourceRGBA(...color);
        cr.moveTo(...p[0]);
        loop(i => {
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

function genMotto(cr, x, y, text, vt) {
    let pl = PangoCairo.create_layout(cr);
    if(vt) {
        pl.set_width(Ratio * y * Pango.SCALE);
        pl.get_context().set_base_gravity(Pango.Gravity.EAST);
    } else {
        pl.set_alignment(Pango.Alignment.CENTER);
    }
    pl.set_font_description(Pango.FontDescription.from_string(FontName));
    pl.set_markup(text.replace(/SZ_BGCOLOR/g, getBgColor()), -1);
    let [fw, fh] = pl.get_pixel_size();
    let [a, b, c, d] = [x / 2, Ratio * y / 2, fw / 2, fh / 2];
    setTextRect(vt ? [a - d, Math.max(b - c, y / 32), fh, fw] : [a - c, b - d, fw, fh]);
    return [x, y, pl, vt, fw, fh];
}

function drawMotto(cr, pts) {
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

function drawBackground(cr) {
    cr.save();
    cr.setSourceRGBA(...DarkBg ? Color.DARK : Color.LIGHT);
    cr.paint();
    cr.restore();
}

function genTrees(x, y) {
    let ld = genLand(x, y),
        cl = Color.random(),
        t1 = genTree(8, rand(2, 5) * x / 20, 5 * y / 6, x / 30),
        t2 = genTree(6, rand(14, 18) * x / 20, 5 * y / 6, x / 30);
    return [t1, t2, ld].map(v => v.concat([cl]));
}

function drawTrees(cr, pts) {
    let [t1, t2, ld] = pts;
    drawTree(cr, t1);
    drawTree(cr, t2);
    drawLand(cr, ld);
}

function genFlower([x, y, v, w], z, l = 20, n = 5) {
    if(z < 8) return [false, w * 0.9, [x, y], affine([x, y], move(p2ct(rGauss(5 / 2, 1) * l, v - 1 / 2)))];
    let da = 2 / (n + 1),
        t1 = rGauss(1 / 2, 1 / 9),
        rt = rotate(rand(0, 2)),
        fc = 1 - Math.abs(t1 * 2 - 1),
        stp = array(n, () => rGauss(1, 1 / 2 - fc)),
        tran = p => affine(p, [[1, cosp(t1) * fc, 0], [0, sinp(t1) * fc, 0]], rt, move([x, y]));
    return [sinp(t1) * fc > 0.6, scanl(add, 0, (m => stp.map(s => s * da / m))(stp.reduce(add)))
        .map((s, i) => [i, i + 1].map(t => [0.05, 0.1, 1].map(r => tran(p2ct(r * l, s + t * da)))))];
}

function drawFlower(cr, pts, cl) {
    cr.save();
    if(pts.length > 2) {
        let [, w, s, t] = pts;
        cr.setLineWidth(w);
        cr.setSourceRGBA(0.2, 0.2, 0.2, 0.7);
        cr.setLineCap(Cairo.LineCap.BUTT);
        cr.moveTo(...s);
        cr.lineTo(...t);
        cr.stroke();
    } else {
        let [, pt] = pts;
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

function genTree(n, x, y, l) {
    // Ref: http://fhtr.blogspot.com/2008/12/drawing-tree-with-haskell-and-cairo.html
    let branch = (vec, ang) => {
        if(!vec) return null;
        let t = vec[2] + ang * rand(0.1, 0.9);
        let s = rand(0.1, 0.9) * 3 * (1 - Math.abs(t)) ** 2;
        return s < 0.3 ? null : affine(vec.slice(0, 2), move(p2ct(s * l, t - 1 / 2))).concat(t);
    };
    let root = [[x, y, 0], branch([x, y, 0], rGauss(0, 1 / 32))],
        tree = root.concat(scanl((_x, t) => t.flatMap(a => [branch(a, -1 / 4), branch(a, 1 / 4)]), [root[1]], array(n - 1))),
        merg = (a = 0, b = 0, c) => Math.max(0.7 * (a + b) + 0.5 * (!a * b + !b * a), a * 1.2, b * 1.2) + !a * !b * 1.25 * c;
    loop(i => tree[i] && tree[i].push(merg(tree[2 * i]?.[3], tree[2 * i + 1]?.[3], y / 1024)), 0, tree.length - 1, -1);
    loop(i => tree[i] && !tree[2 * i] !== !tree[2 * i + 1] && tree[i].push(genFlower(tree[i], i, y / 54)), 2 ** n - 1, 1);
    return [tree];
}

function drawTree(cr, pts) {
    let [tr, cl] = pts;
    cr.save();
    cr.setLineCap(Cairo.LineCap.ROUND);
    cr.setLineJoin(Cairo.LineJoin.ROUND);
    cr.setSourceRGBA(...Color.DARK);
    let lineTo = i => tr[i] && (cr.setLineWidth(tr[i][3]), cr.lineTo(tr[i][0], tr[i][1]), cr.stroke());
    let flower = (i, s) => (tr[i] && tr[i][4]) && (s === tr[i][4][0]) && drawFlower(cr, tr[i][4], cl);
    loop(i => {
        loop(j => {
            if(!tr[j]) return;
            flower(2 * j, false), cr.moveTo(tr[j][0], tr[j][1]), lineTo(2 * j);
            flower(2 * j + 1, false), cr.moveTo(tr[j][0], tr[j][1]), lineTo(2 * j + 1);
            flower(j, true);
        }, 2 ** i - 1, Math.floor(2 ** (i - 1)));
    }, Math.floor(Math.log2(tr.length)) - 1);
    cr.restore();
}

function genLand(x, y, n = 20, f = 5 / 6) {
    let land = bezeirCtrls(zipWith((u, v) => [u * x / n, v === 40 ? f * y : rGauss(v * y / 48, y / 96)],
        array(10, i => i + 5), [40, 40, 42, 44, 45, 46, 46, 43, 40, 40]), 0.3);
    return [y / 1024, [0, 7 * y / 8, x, y / 8], land.concat([[x, f * y], [x, y], [0, y], [0, f * y]])];
}

function drawLand(cr, pts) {
    let [sf, rc, ld, cl] = pts;
    cr.save();
    cr.setSourceRGBA(...cl.color.slice(0, 3), 0.4);
    cr.rectangle(...rc);
    cr.fill();
    cr.setSourceRGBA(...Color.LIGHT);
    loop(i => cr.curveTo(...ld[i], ...ld[i + 1], ...ld[i + 2]), 26, 0, 3);
    loop(i => cr.lineTo(...ld[i]), 30, 27);
    cr.fill();
    cr.moveTo(...ld.at(-1));
    cr.lineTo(...ld[0]);
    loop(i => cr.curveTo(...ld[i], ...ld[i + 1], ...ld[i + 2]), 26, 0, 3);
    cr.lineTo(...ld.at(-4));
    cr.setSourceRGBA(0, 0, 0, 0.4);
    cr.setLineWidth(sf * 2);
    cr.stroke();
    cr.restore();
}

function genLogo(fn, x, y) {
    try {
        let path = fn ? fn.replace(/~/, GLib.get_home_dir())
                : lookupIcon(`${GLib.get_os_info('LOGO') || 'gnome-logo'}-${DarkBg ? 'text-dark' : 'text'}`),
            svg = path.endsWith('.svg'),
            img = svg ? Rsvg.Handle.new_from_file(path) : GdkPixbuf.Pixbuf.new_from_file(path),
            { width: w, height: h } = svg ? img.get_pixbuf() : img;
        setTextRect([(x - w) / 2, (y * 0.8 - h) / 2, w, h]);
        return [svg, img];
    } catch(e) {
        console.warn('shuzhi:', e.message);
        setTextRect([-1, -1, 0, 0]);
        return [];
    }
}

function drawLogo(cr, pts) {
    if(!pts.length) return;
    cr.save();
    let [svg, img] = pts;
    let [x, y, width, height] = TextRect;
    if(svg) {
        img.render_document(cr, new Rsvg.Rectangle({ x, y, width, height }));
    } else {
        Gdk.cairo_set_source_pixbuf(cr, img, x, y);
        cr.paint();
    }
    cr.restore();
}
