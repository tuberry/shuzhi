// vim:fdm=syntax
// by tuberry
'use strict';

const Cairo = imports.cairo;
const { PangoCairo, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Color = Me.imports.color;

let FontName = '';
let DarkBg = true;
let TextRect = [-1, -1, -1, -1];

function setFontName(font) {
    FontName = font;
}

function setTextRect(rect) {
    TextRect = rect;
}

function setDarkBg(dark) {
    DarkBg = dark;
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randamp(x, y) {
    return rand(x - y, x + y);
}

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
    for(let i = arr.length - 1, j; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

function genPolygon(ctr_x, ctr_y, ave_r, dt_a, dt_r, vertex) {
    // Ref: https://stackoverflow.com/a/25276331
    let clip = (x, min, max) => {
        if(min > max) return x;
        else if(x < min) return min;
        else if(x > max) return max;
        else return x;
    }
    dt_a = clip(dt_a, 0, 1) * 2 * Math.PI / vertex;
    dt_r = clip(dt_r, 0, 1) * ave_r;
    let [min, max, points] = [(2 * Math.PI / vertex) - dt_a, (2 * Math.PI / vertex) + dt_a, []];
    let angle_step = Array.from({ length: vertex }, () => rand(min, max));
    let angle_norm = 2 * Math.PI / angle_step.reduce((ac, v) => ac + v);
    angle_step = angle_step.map(a => a * angle_norm);
    for(let i = 0, angle = rand(0, 2 * Math.PI); i < vertex; angle += angle_step[i], i++) {
        let r = clip(gauss(ave_r, dt_r), 0, 2 * ave_r);
        points.push([ctr_x + r * Math.cos(angle), ctr_y + r * Math.sin(angle)]);
    }

    return points;
}

function genCoords(rect, sum, factor) { // reduce collision
    // https://stackoverflow.com/a/4382286
    let quadsect = (rec, fac) => {
        let delta = v =>  Math.round(Math.random()) ? v : -v;
        let to_rect = (m, n, p, q) => [Math.min(m, p), Math.min(n, q), Math.max(m, p), Math.max(n, q)];
        let [a, b, c, d] = rec;
        let [w, h] = [c - a, d - b];
        let delta_x = delta(randint(0, w / fac));
        let delta_y = delta(randint(0, h / fac));
        let [n_x, n_y] = [a + w / 2 + delta_x, b + h / 2 + delta_y];
        return [to_rect(n_x, n_y, a, b), to_rect(n_x, n_y, c, b), to_rect(n_x, n_y, c, d), to_rect(n_x, n_y, a, d)];
    };
    do {
        let tmp = [];
        for(let i = 0; i < rect.length; i++)
            tmp = tmp.concat(quadsect(rect[i], factor));
        rect = tmp;
    } while(rect.length <= sum);

    return rect;
}

function overlap(rect1, rect2) {
    let [x0, y0, x1, y1] = rect1;
    let [x2, y2, x3, y3] = rect2;
    return !(x0 > x3 || x2 > x1 || y0 > y3 || y2 > y1);
}

function circle(rect) {
    let [a, b, c, d] = rect;
    let [w, h] = [c - a, d - b];
    return [a + w / 2, b + h / 2, Math.min(w, h) / 2];
};

function ctrlClosed(vertex, smooth) { // closed
    let [ctrl_list, result, len] = [[], [], vertex.length];
    let dis = (a, b) => Math.sqrt(a.map((v, i) => v - b[i]).reduce((ac, cv) => ac + cv ** 2, 0));
    for(let i = 1; i < len + 1; i++) {
        let [o, p, q] = [(i - 1) % len, i % len, (i + 1) % len];
        let [a_x, a_y] = vertex[o];
        let [b_x, b_y] = vertex[p];
        let [c_x, c_y] = vertex[q];
        let [ab_x, ab_y] = [(a_x + b_x) / 2.0, (a_y + b_y) / 2.0];
        let [bc_x, bc_y] = [(b_x + c_x) / 2.0, (b_y + c_y) / 2.0];
        let [len1, len2] = [dis(vertex[o], vertex[p]), dis(vertex[q], vertex[p])];
        let k1 = len1 / (len1 + len2);
        let [d_x, d_y] = [ab_x + (bc_x - ab_x) * k1, ab_y + (bc_y - ab_y) * k1];
        ctrl_list.push([b_x + (ab_x - d_x) * smooth, b_y + (ab_y - d_y) * smooth]);
        ctrl_list.push([b_x + (bc_x - d_x) * smooth, b_y + (bc_y - d_y) * smooth]);
    }
    ctrl_list.unshift(ctrl_list.pop());
    for(let i = 1; i < len + 1; i++) {
        result.push(ctrl_list[(i - 1) * 2]);
        result.push(ctrl_list[(i - 1) * 2 + 1]);
        result.push(vertex[i % len])
    }

    return result;
}

function ctrlUnclosed(vertex, smooth) { // unclosed
    // Ref: https://zhuanlan.zhihu.com/p/267693043
    let [ctrl_list, result, len] = [[vertex[0]], [], vertex.length];
    let dis = (a, b) => Math.sqrt(a.map((v, i) => v - b[i]).reduce((ac, cv) => ac + cv ** 2, 0));

    for(let i = 1; i < len - 1; i++) {
        let [o, p, q] = [i - 1, i, i + 1];
        let [a_x, a_y] = vertex[o];
        let [b_x, b_y] = vertex[p];
        let [c_x, c_y] = vertex[q];
        let [ab_x, ab_y] = [(a_x + b_x) / 2.0, (a_y + b_y) / 2.0];
        let [bc_x, bc_y] = [(b_x + c_x) / 2.0, (b_y + c_y) / 2.0];
        let [len1, len2] = [dis(vertex[o], vertex[p]), dis(vertex[q], vertex[p])];
        let k1 = len1 / (len1 + len2);
        let [d_x, d_y] = [ab_x + (bc_x - ab_x) * k1, ab_y + (bc_y - ab_y) * k1];
        ctrl_list.push([b_x + (ab_x - d_x) * smooth, b_y + (ab_y - d_y) * smooth]);
        ctrl_list.push([b_x + (bc_x - d_x) * smooth, b_y + (bc_y - d_y) * smooth]);
    }
    ctrl_list.push(vertex[len - 1]);
    for(let i = 1; i < len; i++) {
        result.push(ctrl_list[(i - 1) * 2]);
        result.push(ctrl_list[(i - 1) * 2 + 1]);
        result.push(vertex[i]);
    }

    return result;
}

function getLunarPhase() {
    // Ref: https://ecomaan.nl/javascript/moonphase/
    // A recent new moon occured on december, 26, 2019 = 18256 days since 1970.
    // An average synodic month takes 29 days, 12 hours, 44 minutes, 3 seconds.
    let date = new Date();
    let days_after_new_moon = (date.getTime() / 86400000) - 18256.8;
    let synodic_month = 29.5305882;
    let m = Math.abs(days_after_new_moon / synodic_month);
    // 0 => New Moon / 新月
    // 1 => Waxing Crescent Moon / 眉月 /)
    // 2 => Quarter Moon / 上弦月 /)
    // 3 => Waxing Gibbous Moon / 盈凸月 |)
    // 4 => Full Moon / 满月 ()
    // 5 => Waning Gibbous Moon / 亏凸月 (\
    // 6 => Last Quarter Moon / 下弦月 (/
    // 7 => Waning Crescent Moon / 残月 （\
    let p = Math.round((m - Math.floor(m)) * 8) % 8;
    return p;
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
    let [layers, alpha, factor, num] = [5, 0.2, 0.35, 10];
    let [delta, start] = [factor * y / layers, (1 - factor) * y];
    let pts = Array.from({ length: layers }, (_, i) => {
        let length = randint(num, num + 5);
        return ctrlUnclosed(Array.from({ length: length + 1 }, (_, j) => [x * j / length, randamp(start + i * delta, delta * 0.7)]), 1);
    });

    return [[x, y, Color.getRandColor(alpha, DarkBg)], pts];
}

function drawWaves(cr, waves, show) {
    let [other, pts] = waves;
    let [x, y, color] = other;
    pts.forEach(p => {
        cr.setSourceRGBA(...color.color);
        cr.moveTo(x, y);
        cr.lineTo(0, y);
        cr.lineTo(...p[0])
        for(let i = 0; i < p.length; i += 3)
            cr.curveTo(...p[i], ...p[i+1], ...p[i+2]);
        cr.closePath();
        cr.fill();
    });
    if(FontName && show) {
        let fg = DarkBg ? 1 : 0;
        cr.save();
        cr.setSourceRGBA(fg, fg, fg, 0.1);
        let layout = PangoCairo.create_layout(cr);
        let desc = Pango.FontDescription.from_string(FontName);
        desc.set_size(x * Pango.SCALE / 15);
        layout.set_font_description(desc);
        layout.get_context().set_base_gravity(Pango.Gravity.EAST);
        layout.set_markup(color.name, -1);
        let [fw, fh] = layout.get_pixel_size();
        cr.moveTo(x, 30);
        cr.rotate(Math.PI / 2);
        PangoCairo.show_layout(cr, layout);
        cr.restore();
    }
}

function genBlobs(x, y) {
    return shuffle(genCoords([[0, 0, x ,y]], 20, 5))
        .filter(c => !overlap(c, TextRect))
        .slice(0, 16)
        .map(rect => [Color.getRandColor(0.5, DarkBg).color, ctrlClosed(genPolygon(...circle(rect), 0.6, 0.2, 6), 1)] );
}

function drawBlobs(cr, pts) {
    pts.forEach(pt => {
        let [color, p] = pt;
        cr.setSourceRGBA(...color);
        cr.moveTo(...p[p.length - 1]);
        for(let i = 0; i < p.length; i += 3)
            cr.curveTo(...p[i], ...p[i+1], ...p[i+2]);
        cr.fill();
    });
}

function genOvals(x, y) {
    return shuffle(genCoords([[0, 0, x ,y]], 20, 5)).filter(c => !overlap(c, TextRect)).slice(0, 16).map(rect => {
        let [c_x, c_y, r] = circle(rect);
        let [e_w, e_h] = [r, gauss(r, 0.2 * r)];
        return [Color.getRandColor(0.5, DarkBg).color, [c_x, c_y, e_w, e_h, 2 * Math.random()]];
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
    let [x, y, w, h] = [rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]];
    let wave = n => {
        let src = shuffle(Array.from({ length: n }, (_, i) => i));
        if(Math.round(Math.random())) {
            for(let i = 0; i < n; i += 2) {
                if(i > 0 && src[i] < src[i - 1]) [src[i], src[i - 1]] = [src[i - 1], src[i]]
                if(i < n - 1 && src[i] < src[i + 1]) [src[i], src[i + 1]] = [src[i + 1], src[i]]
            }
        } else {
            for(let i = 0; i < n; i += 2) {
                if(i > 0 && src[i] > src[i - 1]) [src[i], src[i - 1]] = [src[i - 1], src[i]]
                if(i < n - 1 && src[i] > src[i + 1]) [src[i], src[i + 1]] = [src[i + 1], src[i]]
            }
        }
        return src;
    };
    let result = [];
    let length = Math.floor(h / offset);
    let steps = wave(length).map(s => s / length);
    if(steps[0] > steps[1]) {
        result.push([gauss(x, w * steps[0] / 3), y]);
    } else {
        result.push([gauss(x + w, w * (1 - steps[0]) / 3), y]);
    }
    for(let i = 0; i < length; i++) {
        let old_y = result[result.length - 1][1];
        let new_x = x + w * steps[i];
        let fold = Math.round(Math.random());
        result.push([new_x, old_y, fold]);
        result.push([new_x, old_y + offset, fold]);
    }
    if(steps[length - 1] > steps[length - 2]) {
        result.push([gauss(x, w * steps[length - 1] / 3), result[result.length - 1][1]]);
    } else {
        result.push([gauss(x + w, w * (1 - steps[length - 1]) / 3), result[result.length - 1][1]]);
    }

    return result;
}

function genClouds(x, y) {
    let offset = y / 27;
    let moonRect = [x * 3 / 4, x / 20, x * 17 / 20, x * 3 / 20];
    let cords = genCoords([[0, 0, x ,y]], 15, 6).filter(c => {
        if(c[2] - c[0] < 2 * offset || c[3] - c[1] < 2 * offset || c[3] - c[1] > 8 * offset)
            return false;
        return !overlap(c, TextRect) && !overlap(c, moonRect);
    });

    return [genMoon(x, y), shuffle(cords).slice(0, 3).map(c => [Color.getRandColor(1, DarkBg).color, genCloud(c, offset)])];
}

function drawClouds(cr, clouds) {
    let [moon, pts] = clouds;
    drawMoon(cr, moon);
    pts.forEach(pt => {
        let [color, p] = pt;
        // cr.setLineWidth(2);
        cr.setSourceRGBA(...color);
        cr.moveTo(...p[0]);
        for(let i = 1; i < p.length - 1; i += 2) {
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
        }
        cr.lineTo(...p[p.length - 1]);
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
    let [a, b, c, d] = [x / 2, 0.65 * y / 2, fw / 2, fh / 2];
    setTextRect(orien ? [a - d, b - c, a + d, b + c] : [a - c, b - d, a + c, b + d]);
    setFontName(font);

    return [x, y, layout, orien, fw, fh];
}

function drawMotto(cr, pts) {
    let [x, y, layout, orien, fw, fh] = pts;
    let color = DarkBg ? Color.LIGHT : Color.DARK;
    cr.save();
    cr.setSourceRGBA(...color);
    if(orien) {
        cr.moveTo((x + fh) / 2, (0.65 * y - fw) / 2);
        cr.rotate(Math.PI / 2);
    } else {
        cr.moveTo((x - fw) / 2, (0.65 * y - fh) / 2);
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
