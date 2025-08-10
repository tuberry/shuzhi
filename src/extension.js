// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as T from './util.js';
import * as M from './menu.js';
import * as F from './fubar.js';
import {Key as K} from './const.js';

import * as Draw from './draw.js';
import * as Color from './color.js';

const {_} = F;
const {$, $$} = T;

const Style = {SYSTEM: 0, LIGHT: 1, DARK: 2};
const Source = {CMD: 0, TEXT: 1, IMAGE: 2, ONLINE: 3};
const Dark = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, CLOUD: 4};
const Light = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, TREE: 4};
const BG = {LIGHT: 'picture-uri', DARK: 'picture-uri-dark'};
const IF = {ACCENT: 'accent-color', SCALE: 'text-scaling-factor', STYLE: 'color-scheme'};
const MT = {
    $form: (a, ...xs) => xs.map(x => x ? T.format(x, k => a[k]) : ''),
    $wrap: (s, l) => s.replace(RegExp(`(.{1,${l}})`, 'gu'), '$1\n').trim(),
    $span: (s, o) => `<span${Object.entries(o).reduce((p, [k, v]) => `${p} ${k}="${v}"`, '')}>${s}</span>`,
    $find: (m, t, ...xs) => xs.reduceRight((p, x) => p[$].push(...p.map(y => `${x}${y}`)), [t]).findLast(y => Object.hasOwn(m, y)),
    async fetch(cancel) {
        let cent = 45,
            size = {size: `${cent}%`},
            {content, origin, author} = JSON.parse(await T.request('POST', 'https://v1.jinrishici.com/all.json', null, cancel)),
            title = this.$span(`「${origin}」`, size),
            gap = this.$span('\n', {line_height: 0.15}),
            body = content.replace(/[，。：；？、！]/g, '\n').replace(/[《》“”]/g, ''),
            height = Math.round(body.split('\n').reduce((p, x) => Math.max(p, x.length), 1) * 100 / cent),
            head = this.$span(`${this.$wrap(`「${origin}`, height)}」`, size);
        return {vtext: `${body}${gap}${head}`, htext: `${content}${gap}${title}`, seal: this.$span(author, size)};
    },
    get({motto, level, dark, [IF.ACCENT]: accent}) { // -> [text, image]
        let style = dark ? 'd' : 'l';
        let text = this.$find(motto, 'text', level ? 'h' : 'v', style);
        return text ? [this.$form(Color.specify(dark, accent), motto[text], motto.seal), null]
            : [null, motto[this.$find(motto, 'image', style)] ?? ''];
    },
    copy(host) {
        let [text, image] = this.get(host);
        if(text.some(T.id)) F.copy(T.essay(() => Pango.parse_markup(text.join(''), -1, '').at(2), () => text.join('')));
        else if(image) F.copy(image);
    },
    parse(text = '') {
        return T.essay(() => JSON.parse(text, (k, v) => k ? String(v) : v), () => ({text}));
    },
    async load(command, cancel) {
        return this.parse(await T.execute(command, null, cancel));
    },
};

class ShuZhi extends F.Mortal {
    constructor(gset) {
        super()[$].$buildWidgets()[$].$bindSettings(gset)[$].$buildSources().$prepareMotto();
    }

    $buildWidgets() {
        this.palette = new Color.Palette();
        [this.darkSketch, this.lightSketch] = [Dark, Light].map(x => Object.values(x).filter(y => y !== x.LUCK));
        F.connect(this, Main.layoutManager, 'monitors-changed', (() => ({width: this.W, height: this.H} =
            Main.layoutManager.monitors.reduce((p, x) => p.height * p.width > x.height * x.width ? p : x, {width: 16, height: 9})))[$].call());
    }

    $bindSettings(gset) {
        this.$setBG = new F.Setting('org.gnome.desktop.background', BG, this);
        this.$setIF = new F.Setting('org.gnome.desktop.interface', [
            IF.ACCENT, [IF.SCALE, null, () => this.#onFontSet()],
            [IF.STYLE, x => x === 'prefer-dark', () => this.#onStyleSet()],
        ], this);
        this.$set = new F.Setting(gset, [
            K.BCK, [K.ACT, x => this.palette.saveAccent(x)],
            [K.MENU, null, x => this.$src.menu.toggle(x)],
            [K.SPAN, null, x => this.$src.cycle.reload(x)],
            [K.RFS,  null, x => this.$src.cycle.toggle(x)],
        ], this).tie([K.SRC, K.SRCT], this, null, () => this.#redraw(true, true)).tie([
            [K.PATH, null, () => [true]],
            [K.CLR,  null, () => [this.waving]],
            [K.CLST, null, () => [this.waving]],
            [K.DSKT, null, () => [this.dark, true]],
            [K.LSKT, null, () => [!this.dark, true]],
            [K.ORNT, x => { this.level = !x; }, () => [true, true]],
            [K.CLFT, x => Pango.FontDescription.from_string(x), () => [this.waving]],
        ], this, null, ([x, y]) => x && this.#redraw(y, false))
            .tie([K.FONT], this, () => this.#onFontSet())
            .tie([K.STL], this, () => this.#onStyleSet());
    }

    $buildSources() {
        let cancel = F.Source.newCancel(),
            cycle = F.Source.newTimer(() => [() => this.#redraw(true, true), this[K.SPAN] * 60000], false, null, this[K.RFS]),
            menu = F.Source.newInjector([Main.layoutManager, {_addBackgroundMenu: (a, f, xs) => { f.apply(a, xs); this.#amendBgMenu(xs); }}], this[K.MENU],
                () => { Main.layoutManager.screenTransition.run(); Main.layoutManager._updateBackgrounds(); }); // HACK: workaround for flickering when _updateBackgrounds
        this.$src = F.Source.tie({cancel, cycle, menu}, this);
    }

    #amendBgMenu([bgManager]) {
        let menu = bgManager.backgroundActor._backgroundMenu;
        if(menu.firstMenuItem instanceof M.ToolItem) return;
        menu.firstMenuItem.destroy(); // remove 'Change Background...' item
        let refresh = (...xs) => { this.$src.cycle.reload(); this.#redraw(...xs); };
        let button = (func, icon) => new M.Button(() => { menu.close(); func(); }, icon)[$].set({styleClass: 'shuzhi-bg-menu-icon', xExpand: true});
        [
            new PopupMenu.PopupMenuSection()[$$].addMenuItem([
                [_('Motto'),  () => refresh(false, true)],
                [_('Sketch'), () => refresh(true, false)],
                [_('Both'),   () => refresh(true, true)],
            ].map(x => new M.Item(...x))[$].unshift(new M.Separator(_('Refresh')))),
            T.seq(new M.ToolItem({
                refresh: button(() => refresh(true, true), 'view-refresh-symbolic'),
                copy: button(() => MT.copy(this), 'edit-copy-symbolic'),
                prefs: button(() => F.me().openPreferences(), 'florette-symbolic'),
            }, {activate: true})[$].connect('activate', () => refresh(true, true)), x =>
                menu.actor.connect('key-press-event', (_a, e) => { M.altNum(e, x); })),
        ].forEach(x => menu.addMenuItem(x, 0));
    }

    $prepareMotto() {
        this.getMotto().then(motto => {
            this.motto = motto;
            if(this[K.PATH] && (this[K.STL] === Style.SYSTEM ? (this.dark ? this[BG.DARK] : this[BG.LIGHT]).endsWith(this.path)
                : this[BG.LIGHT].endsWith(this.path) && this[BG.DARK].endsWith(this.path))) return;
            this.#redraw(true);
        }).catch(T.nop);
    }

    get waving() {
        return this.$type === Light.WAVE;
    }

    #onFontSet() {
        this.font = Pango.FontDescription.from_string(this[K.FONT]);
        this.font.set_size(this.font.get_size() * this[IF.SCALE]);
        this.#redraw(false, false);
    }

    #onStyleSet() {
        let dark = this[K.STL] === Style.SYSTEM ? this[IF.STYLE] : this[K.STL] === Style.DARK;
        if(dark === this.dark) return;
        this.dark = dark;
        this.path = `${this[K.PATH] || GLib.get_tmp_dir()}/shuzhi-${dark ? 'd' : 'l'}.svg`;
        this.#redraw(true);
    }

    getMotto() {
        return Promise.try(() => {
            switch(this[K.SRCT]) {
            case Source.CMD:    return MT.load(this[K.SRC], this.$src.cancel.reborn(), this.colour);
            case Source.TEXT:   return MT.parse(this[K.SRC]);
            case Source.IMAGE:  return {image: this[K.SRC]};
            case Source.ONLINE: return MT.fetch(this.$src.cancel.reborn());
            }
        }).catch(e => {
            if(F.Source.cancelled(e)) throw e;
            logError(e);
            return MT.parse(this[K.SRC]);
        });
    }

    async #redraw(sketch, motto) {
        if(!Object.hasOwn(this, 'motto')) return;
        if(sketch) this.$skt = null;
        if(motto) this.motto = await this.getMotto();
        let svg = new Cairo.SVGSurface(this.path, this.W, this.H);
        let cr = new Cairo.Context(svg);
        this.draw(cr);
        cr.$dispose();
        svg[$].finish().flush();
        this[$].$setWallpaper(`file://${this.path}`).$backup(this.path).catch(T.nop);
    }

    getSketch() {
        this.$type = this.dark ? this[K.DSKT] === Dark.LUCK ? T.lot(this.darkSketch) : this[K.DSKT]
            : this[K.LSKT] === Light.LUCK ? T.lot(this.lightSketch) : this[K.LSKT];
        switch(this.$type) {
        case Light.WAVE: return Draw.Wave;
        case Light.BLOB: return Draw.Blob;
        case Light.OVAL: return Draw.Oval;
        case Light.TREE:
        case Dark.CLOUD: return this.dark ? Draw.Cloud : Draw.Tree;
        }
    }

    #draw(cr, paint, dye) {
        T.seq([dye?.(), Draw.Motto.gen(cr, MT.get(this), this)], ([x, y]) => { paint(x); Draw.paint(Draw.Motto, cr, y, this); });
    }

    draw(cr) {
        Draw.paint(Draw.BG, cr, Draw.BG.gen(this));
        if(this.$skt) {
            this.#draw(cr, () => this.$skt(cr));
        } else {
            let skt = this.getSketch();
            this.#draw(cr, color => (pts => { this.$skt = (ctx => Draw.paint(skt, ctx, pts, this))[$].call(null, cr); })(skt.gen(color, this)),
                () => T.seq(skt.dye(this), () => this[K.ACT] && this.$setIF.set(IF.ACCENT, this.palette.takeAccent())));
        }
    }

    $setWallpaper(path) {
        if(this[K.STL] === Style.SYSTEM) {
            if(path.endsWith('d.svg')) this[BG.DARK] !== path && this.$setBG.set(BG.DARK, path);
            else this[BG.LIGHT] !== path && this.$setBG.set(BG.LIGHT, path);
        } else {
            this[BG.DARK] !== path && this.$setBG.set(BG.DARK, path);
            this[BG.LIGHT] !== path && this.$setBG.set(BG.LIGHT, path);
        }
    }

    async $backup(path) {
        if(!this[K.BCK]) return;
        let dir = GLib.path_get_dirname(path),
            pfx = path.endsWith('d.svg') ? 'shuzhi-d-' : 'shuzhi-l-',
            bak = await T.readdir(dir, x => (y => y.startsWith(pfx) && Date.parse(y.slice(9, 33)) ? [y] : [])(x.get_name())).catch(T.nop) ?? [];
        bak.flat().slice(0, -this[K.BCK]).forEach(x => T.fdelete(`${dir}/${x}`));
        await T.fcopy(path, path.replace(/\.svg$/, `-${new Date().toISOString()}.svg`));
    }
}

export default class extends F.Extension { $klass = ShuZhi; }
