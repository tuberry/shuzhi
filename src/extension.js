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
const {$, $$, $s} = T;

const Style = {SYSTEM: 0, LIGHT: 1, DARK: 2};
const Dark = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, CLOUD: 4};
const Light = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, TREE: 4};
const Src = {CMD: 0, TEXT: 1, IMAGE: 2, ONLINE: 3};
const Re = {NONE: 0, SKETCH: 1, MOTTO: 2, BOTH: 3};
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
    $bindSettings(gset) {
        this.$setBG = new F.Setting('org.gnome.desktop.background', this, BG);
        this.$setIF = new F.Setting('org.gnome.desktop.interface', this, [
            IF.ACCENT, [IF.SCALE, null, () => this.$onFontSet()],
            [IF.STYLE, x => x === 'prefer-dark', () => this.$onStyleSet()],
        ]);
        this.$set = new F.Setting(gset, this, [
            K.BCK, [K.ACT, null, x => this.palette.saveAccent(x)],
            [K.MENU, null, x => this.$src.menu.toggle(x)],
            [K.SPAN, null, x => this.$src.cycle.reload(x)],
            [K.RFS, null, x => this.$src.cycle.toggle(x)],
        ], [K.SRC, K.SRCT], null, () => this.$redraw(Re.BOTH), [
            [K.PATH, null, () => [true]],
            [K.CLR, null, () => [this.waving]],
            [K.CLST, null, () => [this.waving]],
            [K.DSKT, null, () => [this.dark, true]],
            [K.LSKT, null, () => [!this.dark, true]],
            [['level', K.ORNT], x => !x, () => [true, true]],
            [K.CLFT, x => Pango.FontDescription.from_string(x), () => [this.waving]],
        ], null, ([x, y]) => x && this.$redraw(y ? Re.SKETCH : Re.NONE),
        [K.FONT], () => this.$onFontSet(),
        [K.STL], () => this.$onStyleSet());
    }

    $buildSources() {
        let cancel = F.Source.newCancel(),
            cycle = F.Source.newTimer(() => [() => this.$redraw(Re.BOTH), this[K.SPAN] * 60000], false, null, this[K.RFS]),
            menu = F.Source.newInjector([Main.layoutManager, {_addBackgroundMenu: (a, f, xs) => { f.apply(a, xs); this.$amendBgMenu(xs); }}], this[K.MENU],
                () => { if(global.stage.peek_stage_views().length) Main.layoutManager.screenTransition.run(); Main.layoutManager._updateBackgrounds(); }), // HACK: workaround for flickering when _updateBackgrounds & mutter devkit compatibility
            dog = F.Source.newHandler(Main.layoutManager, 'monitors-changed', (() => ({width: this.W, height: this.H} = Main.layoutManager
                .monitors.reduce((p, x) => p.height * p.width > x.height * x.width ? p : x, {width: 16, height: 9})))[$].call());
        this.$src = F.Source.tie(this, {cancel, cycle, menu}, dog);
        this.$buildWidgets();
    }

    $buildWidgets() {
        this.palette = new Color.Palette()[$].saveAccent(this[K.ACT]);
        [this.darkSketch, this.lightSketch] = [Dark, Light].map(x => Object.values(x).filter(y => y !== x.LUCK));
        this.getMotto().then(motto => {
            this.motto = motto;
            if(this[K.PATH] && (this[K.STL] === Style.SYSTEM ? (this.dark ? this[BG.DARK] : this[BG.LIGHT]).endsWith(this.path)
                : this[BG.LIGHT].endsWith(this.path) && this[BG.DARK].endsWith(this.path))) return;
            this.$redraw(Re.SKETCH);
        }).catch(T.nop);
    }

    $amendBgMenu([bgManager]) {
        let menu = bgManager.backgroundActor._backgroundMenu;
        F.erase(menu._settingsActions, 'gnome-background-panel.desktop'); // remove 'Change Background...' item
        let refresh = (x = Re.BOTH) => { this.$src.cycle.reload(); this.$redraw(x); };
        [
            new M.ToolItem([{
                fresh: [() => { menu.close(); refresh(); }, 'view-refresh-symbolic'],
                copy: [() => { menu.close(); MT.copy(this); }, 'edit-copy-symbolic'],
                prefs: [() => { menu.close(); F.me().openPreferences(); }, M.Icon.wrap('florette-symbolic')],
            }, 'shuzhi-bg-menu-icon'], {activate: true})[$].connect('activate', refresh)[$$](it =>
                menu.actor.connect('key-press-event', (_a, e) => M.altNum(e, it))),
            new PopupMenu.PopupMenuSection()[$s].addMenuItem([new M.Separator(_('Refresh')),
                ...[[_('Motto'), Re.MOTTO], [_('Sketch'), Re.SKETCH], [_('Both')]].map(([x, y]) => new M.Item(x, () => refresh(y)))]),
        ].reverse().forEach(x => menu.addMenuItem(x, 0));
    }

    get waving() {
        return this.$type === Light.WAVE;
    }

    $onFontSet() {
        this.font = Pango.FontDescription.from_string(this[K.FONT]);
        this.font.set_size(this.font.get_size() * this[IF.SCALE]);
        this.$redraw(Re.NONE);
    }

    $onStyleSet() {
        let dark = this[K.STL] === Style.SYSTEM ? this[IF.STYLE] : this[K.STL] === Style.DARK;
        if(dark === this.dark) return;
        this.dark = dark;
        this.path = `${this[K.PATH] || GLib.get_tmp_dir()}/shuzhi-${dark ? 'd' : 'l'}.svg`;
        this.$redraw(Re.SKETCH);
    }

    getMotto() {
        return Promise.try(() => {
            switch(this[K.SRCT]) {
            case Src.CMD: return MT.load(this[K.SRC], this.$src.cancel.reborn(), this.colour);
            case Src.TEXT: return MT.parse(this[K.SRC]);
            case Src.IMAGE: return {image: this[K.SRC]};
            case Src.ONLINE: return MT.fetch(this.$src.cancel.reborn());
            }
        }).catch(e => {
            if(F.Source.cancelled(e)) throw e;
            logError(e);
            return MT.parse(this[K.SRC]);
        });
    }

    async $redraw(redraw) {
        if(!Object.hasOwn(this, 'motto')) return;
        if(redraw & Re.SKETCH) this.$skt = null;
        if(redraw & Re.MOTTO) this.motto = await this.getMotto();
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

    $draw(cr, paint, dye) {
        [dye?.(), Draw.Motto.gen(cr, MT.get(this), this)][$$](([x, y]) => { paint(x); Draw.paint(Draw.Motto, cr, y, this); });
    }

    draw(cr) {
        Draw.paint(Draw.BG, cr, Draw.BG.gen(this));
        if(this.$skt) {
            this.$draw(cr, () => this.$skt(cr));
        } else {
            let skt = this.getSketch();
            this.$draw(cr, color => (pts => { this.$skt = (ctx => Draw.paint(skt, ctx, pts, this))[$].call(null, cr); })(skt.gen(color, this)),
                () => skt.dye(this)[$$](() => this[K.ACT] && this.$setIF.set(IF.ACCENT, this.palette.takeAccent())));
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
