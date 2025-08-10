// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import St from 'gi://St';

import * as T from './util.js';

export const FG = {DARK: 0, LIGHT: 1, MODERATE: 2};
export const BgRGBA = {DARK: [0.14, 0.14, 0.14, 1], LIGHT: [0.9, 0.9, 0.9, 1]};

const Accent = {
    blue:   '#3584e4', teal:   '#2190a4', green: '#3a944a',
    yellow: '#c88800', orange: '#ed5b00', red:   '#e62d42',
    pink:   '#d56199', purple: '#9141ac', slate: '#6f8396',
}; // from https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/src/st/st-theme-context.c
const Accents = Object.keys(Accent);
const BgHex = T.vmap(BgRGBA, v => `#${v.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`);

export const specify = (dark, accent) => ({SZ_BGCOLOR: dark ? BgHex.DARK : BgHex.LIGHT, SZ_ACCENT_COLOR: Accent[accent]});

export class Palette {
    constructor() {
        let table = T.decode(T.fopen('resource://org/gnome/shell/extensions/shuzhi/color.tsv').load_contents(null).at(1)),
            rgb2oklch = rgb => {
                let [r, g, b] = rgb.map(x => x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92), // linear srgb
                    l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b),
                    m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b),
                    s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b),
                    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
                return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, Math.hypot(A, B), 180 * (Math.atan2(B, A) / Math.PI + 2) % 360];
            },
            hue2accent = h => {
                if(h > 345) return St.SystemAccentColor.PINK;
                else if(h > 290) return St.SystemAccentColor.PURPLE;
                else if(h > 230) return St.SystemAccentColor.BLUE;
                else if(h > 175) return St.SystemAccentColor.TEAL;
                else if(h > 130) return St.SystemAccentColor.GREEN;
                else if(h > 75) return St.SystemAccentColor.YELLOW;
                else if(h > 35) return St.SystemAccentColor.ORANGE;
                else if(h > 10) return St.SystemAccentColor.RED;
                else return St.SystemAccentColor.PINK;
            };
        this.$color = table.split('\n').map(x => (([hex, name]) => [hex.match(/(..)/g).map(y => parseInt(y, 16) / 255), name])(x.split('\t')));
        this.$index = this.$color.reduce((p, [rgb], i) => {
            let [l, c, h] = rgb2oklch(rgb);
            let accent = c < 0.04 ? St.SystemAccentColor.SLATE : hue2accent(h);
            l *= 0.5 / 0.5693; // middle grey
            p[accent][l < 0.5 ? FG.DARK : FG.LIGHT].push(i);
            if(l > 0.25 && l < 0.75) p[accent][FG.MODERATE].push(i);
            return p;
        }, T.array(Accents.length, i => ({accent: i, [FG.DARK]: [], [FG.LIGHT]: [], [FG.MODERATE]: []})));
    }

    random(style, alpha = 1) {
        let {accent, [style]: roll} = T.lot(this.$index);
        if(this.$accent) {
            let count = this.$accent[accent];
            this.$accent[accent] = count && accent !== St.SystemAccentColor.SLATE ? count + 1 : 1;
        }
        let [rgb, name] = this.$color[T.lot(roll) ?? 0];
        return {color: rgb.concat(alpha), name};
    }

    saveAccent(save) {
        this.$accent = save ? [] : null;
    }

    takeAccent() {
        return Accents[this.$accent?.splice(0).reduce((p, x, i) => p[0] < x ? p[T.$][0](x)[T.$][1](i) : p, [-1, -1])[1]] ?? 'blue';
    }
}
