// vim:fdm=syntax
// by tuberry
'use strict';

const Cairo = imports.cairo;
const { PangoCairo, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Color = Me.imports.color;

let DV = 2 / 3;
let FontName = '';
let DarkBg = true;
let TextRect = [-1, -1, 0, 0];

const setFontName = font => { FontName = font; };
const setTextRect = rect => { TextRect = rect; };
const setDarkBg = (dark) => { DarkBg = dark; };

const sinp = t => Math.sin(t * Math.PI);
const cosp = t => Math.cos(t * Math.PI);
const mod = (u, v) => u - Math.floor(u / v) * v;
const conv = (r, t) => [r * cosp(t), r * sinp(t)];
const overlap = (a, b) => !(a[0] > b[0] + b[2] || b[0] > a[0] + a[2] || a[1] > b[1] + b[3] || b[1] > a[1] + a[3]);

const rand = (l, u) => Math.random() * (u - l) + l;
const randbool = () =>  !!Math.round(Math.random());
const randamp = (x, y) => rand(x - y, x + y);
const randint = (l, u) => Math.floor(Math.random() * (u - l + 1)) + l;

const last = (a, n = 1) => a[a.length - n];
const scanl = (f, xs, ac) => xs.flatMap(x => ac = f(x, ac));
const zipWith = (f, ...xss) => xss[0].map((_, i) => f(...xss.map(xs => xs[i])));
const range = (u, l = 0, s = 1) => Array.from({ length: (u - l) / s + 1 }, (_, i) => l + i * s);
const dot = (xs, ys) => xs.map((x, i) => x * ys[i]).reduce((ac, v) => ac + v);
const rotate = t => [[cosp(t), sinp(t), 0], [-sinp(t), cosp(t), 0]];
const move = p => [[1, 0, p[0]], [0, 1, p[1]]];
const trans = (xs, ...ms) => ms.reduce((ac, m) => m.map(v => dot(v, ac.concat(1))), xs); // affine

function gauss(mu, sgm) {
    // https://en.wikipedia.org/wiki/Marsaglia_polar_method
    let q, u, v, p;
    do {
        u = 2 * Math.random() - 1;
        v = 2 * Math.random() - 1;
        q = u * u + v * v;
    } while(q >= 1 || q === 0);

    return mu + sgm * u * Math.sqrt(- 2 * Math.log(q) / q);
}

function shuffle(arr) {
    // Ref: https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    range(0, arr.length - 1, -1).forEach(i => {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    });
    return arr;
};

function genPolygon(clc, dt_a=0.6, dt_r=0.2, num=6) {
    // Ref: https://stackoverflow.com/a/25276331
    let [x, y, r] = clc;
    let stp = range(num - 1).map(() => randamp(2 / num, dt_a * 2 / num));
    let sum = stp.reduce((ac, v) => ac + v, 0);

    return scanl((u, v) => u + v, stp.map(w => 2 * w / sum), rand(0, 2))
        .map(s  => zipWith((u, v) => u + v, [x, y], conv(gauss(r, dt_r * r), s)));
}

function genCoords(rect, sum=20, fac=5) { // reduce collision
    // https://stackoverflow.com/a/4382286
    let quad = n => n == 0 ? [rect] : quad(n - 1).flatMap(rc => {
        let [x, y, w, h] = rc;
        let [a, b] = [w, h].map(i => Math.round(randamp(i / 2, i / fac)));
        return [[x, y, a, b], [x + a, y, w - a, b], [x + a, y + b, w - a, h - b], [x, y + b, a, h - b]];
    });

    return quad(Math.ceil(Math.log2(sum) / 2));
}

function circle(rect) {
    let [x, y, w, h] = rect;
    let r = Math.min(w, h) / 2;
    let ctr = w > h ? [rand(x + r, x + w - r), y + h / 2] : [x + w / 2, rand(y + r, y + h - r)];
    return ctr.concat(r);
};

function bezeirCtrls(vertex, smooth=1, closed=false) {
    // Ref: https://zhuanlan.zhihu.com/p/267693043
    let dis = (a, b) => Math.sqrt(zipWith((u, v) => u - v, a, b).reduce((ac, c) => ac + c ** 2, 0));
    let ctrls = range(vertex.length - (closed ? 1 : 2), 1).flatMap(i => {
        let [a, b, c] = [i - 1, i, i + 1].map(x => vertex[mod(x, vertex.length)]);
        let ls = [a, c].map(x => dis(x, b));
        let k0 = ls[0] / (ls[0] + ls[1]);
        let mp = [a, c].map(x => zipWith((u, v) => (u + v) / 2, x, b));
        let ds = zipWith((u, v) => u + (v - u) * k0, ...mp);
        return [mp[0], null, mp[1]].map(x => !x ? vertex[i] : zipWith((u, v, w) => u + (v - w) * smooth, b, x, ds));
    });

    return closed ? ctrls.splice(-1).concat(ctrls) : [vertex[0]].concat(ctrls, Array(2).fill(last(vertex)));
}

function getLunarPhase() {
    // Ref: https://ecomaan.nl/javascript/moonphase/
    // A recent new moon occured on december, 26, 2019 = 18256 days since 1970.
    // An average synodic month takes 29 days, 12 hours, 44 minutes, 3 seconds.
    let days = ((new Date()).getTime() / 86400000) - 18256.8;
    let month = 29.5305882;
    let m = Math.abs(days / month);

    return Math.round((m - Math.floor(m)) * 8) % 8;
}

function genMoon(x, y) {
    let phase = getLunarPhase();
    let [c_x, c_y, r1] = [x * 8 / 10, x / 10, x / 20];
    switch(phase) {
    case 1:
    case 7: {
        let [r_t, s_t1, e_t1, s_t2, e_t2] = [phase == 1 ? 1 / 4 : 3 / 4, - 1 / 2, 1 / 2, - 1 / 3, 1 / 3];
        let [c_x2, c_y2, r2] = [- r1 / Math.sqrt(3), 0, r1 * 2 / Math.sqrt(3)];
        let gd = new Cairo.RadialGradient(c_x2, c_y2, r2, c_x2, c_y2, r2 + r1 / 16);
        gd.addColorStopRGBA(0, 0, 0, 0, 0);
        gd.addColorStopRGBA(1, 0.8, 0.8, 0.8, 1);
        return [c_x, c_y, r1, s_t1, e_t1, c_x2, c_y2, r2, s_t2, e_t2, r_t, gd];
    }
    case 2:
    case 6: {
        let [r_t, s_t1, e_t1] = [phase == 2 ? 1 / 8 : 9 / 8, - 1 / 2, 1 / 2];
        let gd = new Cairo.LinearGradient(0, 0, r1 / 16, 0);
        gd.addColorStopRGBA(0, 0, 0, 0, 0);
        gd.addColorStopRGBA(1, 0.8, 0.8, 0.8, 1);
        return [c_x, c_y, r1, s_t1, e_t1, r_t, gd];
    }
    case 3:
    case 5: {
        let [r_t, s_t1, e_t1, s_t2, e_t2] = [phase == 3 ? 1 : - 1 / 4, 1 / 2, - 1 / 2, - 1 / 3, 1 / 3];
        let [c_x2, c_y2, r2] = [- r1 / Math.sqrt(3), 0, r1 * 2 / Math.sqrt(3)];
        let gd = new Cairo.RadialGradient(c_x2, c_y2, r2 - r1 / 16, c_x2, c_y2, r2);
        gd.addColorStopRGBA(0, 0.8, 0.8, 0.8, 1);
        gd.addColorStopRGBA(1, 0, 0, 0, 0);
        return [c_x, c_y, r1, s_t1, e_t1, c_x2, c_y2, r2, s_t2, e_t2, r_t, gd];
    }
    case 4:
        return [c_x, c_y, r1, Color.LIGHT];
    default:
        return [];
    }
}

function drawMoon(cr, pts) {
    switch(pts.length) {
    case 12: {
        let [c_x, c_y, r1, s_t1, e_t1, c_x2, c_y2, r2, s_t2, e_t2, r_t, gd] = pts;
        cr.save();
        cr.translate(c_x, c_y);
        cr.rotate(r_t * Math.PI);
        cr.setSource(gd);
        cr.arc(0, 0, r1, s_t1 * Math.PI, e_t1 *  Math.PI);
        cr.arc(c_x2, c_y2, r2, s_t2 * Math.PI, e_t2 *  Math.PI);
        cr.setFillRule(Cairo.FillRule.EVEN_ODD);
        cr.fill();
        cr.restore();
    } break;
    case 7: {
        let [c_x, c_y, r1, s_t, e_t, r_t, gd] = pts;
        cr.save();
        cr.translate(c_x, c_y);
        cr.rotate(r_t * Math.PI);
        cr.setSource(gd);
        cr.arc(0, 0, r1, s_t * Math.PI, e_t * Math.PI);
        cr.setFillRule(Cairo.FillRule.EVEN_ODD);
        cr.fill();
        cr.restore();
    } break;
    case 4: {
        let [c_x, c_y, r1, color] = pts;
        cr.setSourceRGBA(...color);
        cr.arc(c_x, c_y, r1, 0, 2 * Math.PI);
        cr.fill();
    } break;
    }
}

function genWaves(x, y) {
    let [layers, factor, m] = [5, 1 - DV, randint(7, 10)];
    let [dt, st] = [factor * y / layers, (1 - factor) * y];
    let pts = range(layers - 1).map(i => {
        let num = randint(m, m + 5);
        return bezeirCtrls(range(num).map(j => [x * j / num, randamp(st + i * dt, dt * 0.7)]));
    });

    return [[x, y, Color.getRandColor(DarkBg, 1 / layers)], pts];
}

function drawWaves(cr, waves, show) {
    let [other, pts] = waves;
    let [x, y, color] = other;
    pts.forEach(p => {
        cr.setSourceRGBA(...color.color);
        cr.moveTo(x, y);
        cr.lineTo(0, y);
        cr.lineTo(...p[0])
        range(p.length - 1, 0, 3).forEach(i => { cr.curveTo(...p[i], ...p[i+1], ...p[i+2]); });
        cr.closePath();
        cr.fill();
    });
    if(show) drawColor(cr, other);
}

function drawColor(cr, color) {
    if(!FontName) return;
    let [x, y, cl] = color;
    let fg = DarkBg ? 1 : 0;
    cr.save();
    cr.setSourceRGBA(fg, fg, fg, 0.1);
    let layout = PangoCairo.create_layout(cr);
    let desc = Pango.FontDescription.from_string(FontName);
    desc.set_size(x * Pango.SCALE / 15);
    layout.set_font_description(desc);
    layout.get_context().set_base_gravity(Pango.Gravity.EAST);
    layout.set_markup(cl.name, -1);
    let [fw, fh] = layout.get_pixel_size();
    cr.moveTo(x, 0.03 * y);
    cr.rotate(Math.PI / 2);
    PangoCairo.show_layout(cr, layout);
    cr.restore();
}

function genBlobs(x, y) {
    return shuffle(genCoords([0, 0, x ,y]))
        .filter(c => !overlap(c, TextRect))
        .slice(0, 16)
        .map(rect => [Color.getRandColor(DarkBg, 0.5).color, bezeirCtrls(genPolygon(circle(rect)), 1, true)]);
}

function drawBlobs(cr, pts) {
    pts.forEach(pt => {
        let [color, p] = pt;
        cr.setSourceRGBA(...color);
        cr.moveTo(...last(p));
        range(p.length - 1, 0, 3).forEach(i => { cr.curveTo(...p[i], ...p[i+1], ...p[i+2]); });
        cr.fill();
    });
}

function genOvals(x, y) {
    return shuffle(genCoords([0, 0, x ,y])).filter(c => !overlap(c, TextRect)).slice(0, 16).map(rect => {
        let [c_x, c_y, r] = circle(rect);
        let [e_w, e_h] = [r, gauss(r, 0.2 * r)];
        return [Color.getRandColor(DarkBg, 0.5).color, [c_x, c_y, e_w, e_h, 2 * Math.random()]];
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

function genCloud(rect, offset) {
    let [x, y, w, h] = rect;
    let wave = n => {
        let r = randbool();
        let a = shuffle(range(n - 1));
        range(n - 1, 0, 2).forEach(i => {
            if(i != 0 && (a[i] < a[i - 1]) ^ r) [a[i], a[i - 1]] = [a[i - 1], a[i]];
            if(i != n - 1 && (a[i] < a[i + 1]) ^ r) [a[i], a[i + 1]] = [a[i + 1], a[i]];
        });
        return a;
    };
    let extra = (a, b) => Math.floor(a > b ? gauss(x, w * a / 4) : gauss(x + w, w * (1 - a) / 4));
    let len = Math.floor(h / offset);
    let stp = wave(len).map(s => s / len);
    let fst = [[extra(stp[0], stp[1]), y]];
    let result = scanl((i, ac) => {
        let fd = randbool();
        let nx = x + w * stp[i];
        let oy = last(ac)[1];
        return [[nx, oy, fd], [nx, oy + offset, fd]];
    }, range(len - 1), fst);

    return fst.concat(result, [[extra(last(stp), last(stp, 2)), last(result)[1]]]);
}

function genClouds(x, y) {
    let offset = y / 27;
    let genRect = (pt) => {
        let a, b, c, d, e, f;
        switch(pt) {
        case 0: [a, b, c, d, e, f] = [0, 1 / 8, 1 / 16, 1 / 8, 2, [0, 0]]; break;
        case 1: [a, b, c, d, e, f] = [0, 1 / 8, 1 / 8, 1 / 4, 2, [0, 1 / 4]]; break;
        case 2: [a, b, c, d, e, f] = [0, 1 / 4, 0, 1 / 4, 5 / 2, [0, 2 / 4]]; break;
        case 3: [a, b, c, d, e, f] = [0, 1 / 4, 1 / 8, 1 / 4, 3, [1 / 4, 2 / 4]]; break;
        case 4: [a, b, c, d, e, f] = [0, 1 / 4, 0, 1 / 4, 5 / 2, [2 / 4, 2 / 4]]; break;
        default: [a, b, c, d, e, f] = [1 / 8, 1 / 4, 1 / 8, 1 / 4, 2, [2 / 4, 1 / 4]]; break;
        }
        let h = randint(3 * offset, pt ? 7 * offset : 5 * offset);
        let w = randint(h * 2, e * offset * 7);

        return [randint(a * x, b * x) + f[0] * x, randint(c * y, d * y) + f[1] * y, w, h];
    }
    let coords = [[0, 2, 4], [0, 2, 5], [0, 3, 5], [1, 3, 5], [1, 3, 5]][randint(0, 4)];

    return [genMoon(x, y), coords.map(c => [Color.getRandColor(DarkBg).color, genCloud(genRect(c), offset)])];
}

function drawClouds(cr, clouds) {
    let [moon, pts] = clouds;
    drawMoon(cr, moon);
    pts.forEach(pt => {
        let [color, p] = pt;
        // cr.setLineWidth(2);
        cr.setSourceRGBA(...color);
        cr.moveTo(...p[0]);
        range(p.length - 2, 1, 2).forEach(i => {
            let [x, y, f, d_y] = [...p[i], (p[i + 1][1] - p[i][1]) / 2];
            let flag = x < p[i + 2][0];
            cr.lineTo(x, y);
            cr.stroke();
            let [c_x, c_y, r, s_t, e_t] = [x, y + d_y, d_y, flag ? 1 / 2 : - 1 / 2, flag ? 3 / 2 : 1 / 2];
            cr.arc(c_x, c_y, r, s_t * Math.PI, e_t * Math.PI);
            cr.stroke();
            if(f) {
                cr.arc(flag ? c_x + r : c_x - r, c_y, r, s_t * Math.PI, e_t * Math.PI);
                cr.stroke();
            }
            cr.moveTo(p[i + 1][0], p[i + 1][1]);
        })
        cr.lineTo(...last(p));
        cr.stroke();
    });
}

function genMotto(cr, x, y, font, text, orien) {
    let layout = PangoCairo.create_layout(cr);
    layout.set_line_spacing(1.05);
    if(orien) {
        layout.set_width(0.6 * y * Pango.SCALE);
        layout.get_context().set_base_gravity(Pango.Gravity.EAST);
    } else {
        layout.set_alignment(Pango.Alignment.CENTER);
    }
    layout.set_font_description(Pango.FontDescription.from_string(font));
    layout.set_markup(text, -1);
    let [fw, fh] = layout.get_pixel_size();
    let [a, b, c, d] = [x / 2, DV * y / 2, fw / 2, fh / 2];
    setTextRect(orien ? [a - d, b - c, fh, fw] : [a - c, b - d, fw, fh]);
    setFontName(font);

    return [x, y, layout, orien, fw, fh];
}

function drawMotto(cr, pts) {
    let [x, y, layout, orien, fw, fh] = pts;
    let color = DarkBg ? Color.LIGHT : Color.DARK;
    cr.save();
    cr.setSourceRGBA(...color);
    if(orien) {
        cr.moveTo((x + fh) / 2, (DV * y - fw) / 2);
        cr.rotate(Math.PI / 2);
    } else {
        cr.moveTo((x - fw) / 2, (DV * y - fh) / 2);
    }
    PangoCairo.show_layout(cr, layout);
    cr.restore();
}

function drawBackground(cr, x, y, dark) {
    setDarkBg(dark);
    let color = DarkBg ? Color.DARK : Color.LIGHT;
    cr.setSourceRGBA(...color);
    cr.rectangle(0, 0, x, y);
    cr.fill();
}

function genTrees(x, y) {
    let ld = genLand(x, y);
    let color = Color.getRandColor();
    let t1 = genTree(8, rand(2, 5) * x / 20, 5 * y / 6 , x / 30);
    let t2 = genTree(6, rand(14, 18) * x / 20, 5 * y / 6, x / 30);
    return [t1, t2, ld, [x, y]].map(v => v.concat([color]));
}

function drawTrees(cr, pts, show) {
    let [t1, t2, ld, cl] = pts;
    drawTree(cr, t1);
    drawTree(cr, t2);
    drawLand(cr, ld);
}

function genFlower(x, y, l = 20, n = 5) {
    let da = 2 / (n + 1);
    let t2 = rand(0, 2);
    let t1 = gauss(1 / 2, 1 / 9);
    let fc = 1 - Math.abs(t1 * 2 - 1);
    let stp = range(n - 1).map(() => gauss(1, 1 / 2 - fc));
    let sum = stp.reduce((ac, c) => ac + c, 0);
    let tran = p => trans(p, [[1, cosp(t1) * fc, 0], [0, sinp(t1) * fc, 0]], rotate(t2), move([x, y]));

    return [sinp(t1) * fc > 0.6, scanl((u, v) => u + v, stp.map(s => s * da / sum), 0)
        .map((s, i) => [i, i + 1].map(t => [0.05, 0.1, 1].map(r => tran(conv(r * l, s + t * da)))))];
}

function drawFlower(cr, pts, cl) {
    let [fc, pt] = pts;
    cr.save();
    cr.setSourceRGBA(...cl.color);
    pt.forEach(p => {
        cr.moveTo(...p[0][1]);
        cr.curveTo(...p[0][2], ...p[1][2], ...p[1][1]);
        cr.curveTo(...p[1][0], ...p[0][0], ...p[0][1]);
    });
    cr.fill();
    cr.restore();
}

function genTree(n, x, y, l) {
    // Ref: http://fhtr.blogspot.com/2008/12/drawing-tree-with-haskell-and-cairo.html
    let branch = (vec, ang) => {
        if(!vec) return null;
        let t = vec[2] + ang * rand(0.1, 0.9);
        let s = 3 * Math.pow(1 - Math.abs(t), 2) * rand(0.1, 0.9);
        return s < 0.3 ? null : trans(vec.slice(0, 2), move(conv(s * l, t))).concat(t);
    }
    let root = [[0, 0, 0], branch([0, 0, 0], gauss(0, 1 / 16))];
    let tree = root.concat(scanl((i, ac) => ac.flatMap(a => [branch(a, - 1 / 4), branch(a, 1 / 4)]), range(n - 1, 1), [root[1]]));
    let thick = i => !tree[i] ? 0 : tree[i][2];
    let merg = (a, b) => 0.7 * (a + b) + 0.6 * (!a * b + !b * a) + !a * !b * 1.25;
    range(0, tree.length - 1, -1).forEach(i => { if(tree[i]) tree[i][2] = merg(thick(2 * i), thick(2 * i + 1)); });
    tree = tree.map(t => !t ? t : trans(t.slice(0, 2), rotate(1 / 2), move([x, y])).concat(t[2]));
    range(2 ** (n - 1) - 1, 4).forEach(i => { if(!!tree[i] && (!tree[2 * i] || !tree[2 * i + 1]))
            tree[i] = tree[i].concat([genFlower(tree[i][0], tree[i][1])]); });

    return [tree];
}

function drawTree(cr, pts) {
    let [tr, cl] = pts;
    if(tr.length <= 2) return;
    cr.save();
    cr.setLineCap(Cairo.LineCap.ROUND);
    cr.setLineJoin(Cairo.LineJoin.ROUND);
    cr.setSourceRGBA(0.24, 0.24, 0.24, 1);
    let lineTo = i => { if(!tr[i]) return; cr.setLineWidth(tr[i][2]); cr.lineTo(tr[i][0], tr[i][1]); cr.stroke(); };
    let flower = (i, s) => { if(!tr[i] || !tr[i][3]) return; if(s == tr[i][3][0]) drawFlower(cr, tr[i][3], cl); }
    range(Math.floor(Math.log2(tr.length)) - 1).forEach(i => {
        if(i == 0) {
            cr.moveTo(tr[i][0], tr[i][1]), lineTo(i + 1);
        } else {
            range(Math.pow(2, i) - 1, Math.pow(2, i - 1)).forEach(j => {
                if(!tr[j]) return;
                flower(2 * j, false);
                cr.moveTo(tr[j][0], tr[j][1]);
                lineTo(2 * j);
                flower(2 * j + 1, false);
                cr.moveTo(tr[j][0], tr[j][1]);
                lineTo(2 * j + 1);
                flower(j, true);
            });
        }
    });

    cr.restore();
}

function genLand(x, y, n = 20, f = 5 / 6) {
    let land = bezeirCtrls(zipWith((u, v) => [u * x / n, v === 40 ? f * y : gauss(v * y / 48, y / 96)],
        range(14, 5), [40, 40, 42, 44, 45, 46, 46, 43, 40, 40]), 0.3);
    return [[0, 7 * y / 8, x, y / 8], land.concat([[x, f * y], [x, y], [0, y], [0, f * y]])];
}

function drawLand(cr, pts) {
    let [rc, ld, cl] = pts;
    cr.setSourceRGBA(...cl.color);
    cr.rectangle(...rc);
    cr.fill()
    cr.setSourceRGBA(0.28, 0.28, 0.28, 1);
    range(26, 0, 3).forEach(i => { cr.curveTo(...ld[i], ...ld[i+1], ...ld[i+2]); });
    range(30, 27).forEach(i => { cr.lineTo(...ld[i]); });
    cr.fill();
}

