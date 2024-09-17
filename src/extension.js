// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Field} from './const.js';
import * as Draw from './draw.js';
import * as Menu from './menu.js';
import * as Util from './util.js';
import * as Fubar from './fubar.js';
import * as Color from './color.js';

const {_} = Fubar;
const Style = {SYSTEM: 0, LIGHT: 1, DARK: 2, AUTO: 3};
const Source = {COMMAND: 0, TEXT: 1, IMAGE: 2, ONLINE: 3};
const Dark = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, CLOUD: 4};
const Light = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, TREE: 4};

class MenuSection extends PopupMenu.PopupMenuSection {
    constructor(items, name) {
        super();
        if(name) this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(name));
        items.forEach(x => this.addMenuItem(new Menu.Item(...x)));
    }
}

class Motto {
    static #wrap = (s, l) => s.replace(RegExp(`(.{1,${l}})`, 'g'), '$1\n').trim();
    static #span = (s, o) => `<span${Object.entries(o).reduce((p, [k, v]) => `${p} ${k}="${v}"`, '')}>${s}</span>`;
    static #key = (m, t, ...xs) => xs.reduceRight((p, x) => p.concat(p.map(y => `${x}${y}`)), [t]).findLast(y => Util.has(m, y));

    static async fetch(cancel) {
        let cent = 45,
            size = {size: `${cent}%`},
            {content, origin, author} = JSON.parse(await Util.request('POST', 'https://v1.jinrishici.com/all.json', null, cancel)),
            title = this.#span(`「${origin}」`, size),
            gap = this.#span('\n', {line_height: 0.15}),
            body = content.replace(/[，。：；？、！]/g, '\n').replace(/[《》“”]/g, ''),
            height = Math.round(body.split('\n').reduce((p, x) => Math.max(p, x.length), 1) * 100 / cent),
            head = this.#span(`${this.#wrap(`「${origin}`, height)}」`, size);
        return {vtext: `${body}${gap}${head}`, htext: `${content}${gap}${title}`, seal: this.#span(author, size)};
    }

    static format = (dark, accent, ...args) => {
        let env = Color.genSpecifier(dark, accent);
        let key = Object.keys(env);
        return args.map(text => Util.format(text ?? '', txt => (k => k && [env[k], k.length])(key.find(x => txt.startsWith(x)))));
    };

    static get({motto, orient, dark, accent}) { // -> [text, image]
        let style = dark ? 'd' : 'l';
        let text = this.#key(motto, 'text', orient ? 'v' : 'h', style);
        return text ? [this.format(dark, accent, motto[text], motto.seal), null] : [null, motto[this.#key(motto, 'image', style)] ?? ''];
    }

    static copy(that) {
        let [text, image] = this.get(that);
        if(text.some(Util.id)) Fubar.copy(Fubar.essay(() => Pango.parse_markup(text.join(''), -1, '').at(2), () => text.join('')));
        else if(image) Fubar.copy(image);
    }

    static parse(text = '') {
        return Fubar.essay(() => JSON.parse(text, (k, v) => k ? String(v) : v), () => ({text}));
    }

    static async load(command, cancel) {
        return this.parse(await Util.execute(command, null, cancel));
    }
}

class ShuZhi extends Fubar.Mortal {
    constructor(gset) {
        super();
        this.#buildWidgets();
        this.#bindSettings(gset);
        this.#buildSources();
        this.#prepareMotto();
    }

    #buildWidgets() {
        [this.darkSketches, this.lightSketches] = [Dark, Light].map(x => Menu.RadioItem.getopt(x));
        [this.$darkSketch, this.$lightSketch] = [Dark, Light].map(x => Object.values(x).filter(y => y !== x.LUCK));
        Fubar.connect(this, Main.layoutManager, 'monitors-changed', Util.thunk(() =>
            ({width: this.X, height: this.Y} = Main.layoutManager.monitors.reduce((p, x) => p.height * p.width > x.height * x.width ? p : x))));
    }

    #bindSettings(gset) {
        this.$setBg = new Fubar.Setting('org.gnome.desktop.background', {
            lightPic: ['picture-uri', 'string'],
            darkPic:  ['picture-uri-dark', 'string'],
        }, this);
        this.$setIf = new Fubar.Setting('org.gnome.desktop.interface', {
            accent:  ['accent-color', 'string'],
            scaling: ['text-scaling-factor', 'double', null, () => this.#onFontSet()],
            scheme:  ['color-scheme', 'string', x => x === 'prefer-dark', () => this.#onLightOn()],
        }, this);
        this.$set = new Fubar.Setting(gset, {
            backups:  [Field.BCK,  'uint'],
            accents:  [Field.ACT,  'boolean', x => Color.Palette.saveAccent(x)],
            systray:  [Field.STRY, 'boolean', null, x => this.$src.tray.toggle(x)],
            interval: [Field.SPAN, 'uint',    null, x => this.$src.cycle.reload(x)],
            refresh:  [Field.RFS,  'boolean', null, x => this.$src.cycle.toggle(x)],
        }, this).attach({
            source:     [Field.SRC,  'string'],
            sourceType: [Field.SRCT, 'uint'],
        }, this, null, () => this.#redraw(true, true)).attach({
            folder:      [Field.PATH, 'string',  null, () => [true]],
            orient:      [Field.ORNT, 'uint',    null, () => [true, true]],
            showColor:   [Field.CLR,  'boolean', null, () => [this.waving]],
            colorStyle:  [Field.CLST, 'uint',    null, () => [this.waving]],
            colorFont:   [Field.CLFT, 'string',  x => Pango.FontDescription.from_string(x), () => [this.waving]],
            darkSketch:  [Field.DSKT, 'uint',    null, x => (this.dark && this.tray?.$menu.sketch.choose(x), [this.dark, true])],
            lightSketch: [Field.LSKT, 'uint',    null, x => (this.dark || this.tray?.$menu.sketch.choose(x), [!this.dark, true])],
        }, this, null, ([x, y]) => x && this.#redraw(y, false)).attach({
            fontName: [Field.FONT, 'string'],
        }, this, () => this.#onFontSet()).attach({
            style: [Field.STL, 'uint'],
        }, this, null, () => this.#onLightOn());
    }

    #buildSources() {
        let cancel = Fubar.Source.newCancel(),
            tray   = Fubar.Source.new(() => this.#genSystray(), this.systray),
            cycle  = Fubar.Source.newTimer(() => [() => this.#redraw(true, true), this.interval * 60000], false, null, this.refresh),
            light  = Fubar.Source.newLight(x => { this.night = x; this.#onLightOn(); }, true);
        this.$src = Fubar.Source.tie({cancel, tray, cycle, light}, this);
    }

    #prepareMotto() {
        this.newMotto().then(motto => {
            this.motto = motto;
            let path = this.getPath();
            if(this.style === Style.SYSTEM ? (this.dark ? this.darkPic : this.lightPic).endsWith(path)
                : this.lightPic.endsWith(path) && this.darkPic.endsWith(path)) return;
            this.#redraw(true);
        }).catch(Util.noop);
    }

    get tray() {
        return this.$src.tray.hub;
    }

    get waving() {
        return this.$type === Light.WAVE;
    }

    #onFontSet() {
        this.font = Pango.FontDescription.from_string(this.fontName);
        this.font.set_size(this.font.get_size() * this.scaling);
        this.#redraw(false, false);
    }

    #onLightOn() {
        let dark = this.style === Style.AUTO ? this.night
            : this.style === Style.SYSTEM ? this.scheme : this.style === Style.DARK;
        if(dark === this.dark) return;
        if((this.dark = dark)) this.tray?.$menu.sketch.setup(this.darkSketches, this.darkSketch);
        else this.tray?.$menu.sketch.setup(this.lightSketches, this.lightSketch);
        this.#redraw(true);
    }

    async newMotto() {
        try {
            switch(this.sourceType) {
            case Source.COMMAND: return await Motto.load(this.source, this.$src.cancel.reborn(), this.colour);
            case Source.TEXT:    return Motto.parse(this.source);
            case Source.IMAGE:   return {image: this.source};
            case Source.ONLINE:  return await Motto.fetch(this.$src.cancel.reborn());
            }
        } catch(e) {
            if(Fubar.Source.cancelled(e)) throw e;
            return Motto.parse(this.source);
        }
    }

    getPath() {
        return `${this.folder || GLib.get_tmp_dir()}/shuzhi-${this.dark ? 'd.svg' : 'l.svg'}`;
    }

    async #redraw(sketch, motto) {
        if(!Util.has(this, 'motto', 'night')) return;
        if(sketch) this.$skt = null;
        if(motto) this.motto = await this.newMotto();
        let path = this.getPath(),
            svg = new Cairo.SVGSurface(path, this.X, this.Y),
            cr = new Cairo.Context(svg);
        this.draw(cr);
        cr.$dispose();
        svg.finish();
        svg.flush();
        this.#setWallpaper(`file://${path}`);
        this.#backup(path).catch(Util.noop);
    }

    getSketch() {
        this.$type = this.dark ? this.darkSketch === Dark.LUCK ? Util.lot(this.$darkSketch) : this.darkSketch
            : this.lightSketch === Light.LUCK ? Util.lot(this.$lightSketch) : this.lightSketch;
        switch(this.$type) {
        case Light.WAVE: return Draw.Wave;
        case Light.BLOB: return Draw.Blob;
        case Light.OVAL: return Draw.Oval;
        case Light.TREE:
        case Dark.CLOUD: return this.dark ? Draw.Cloud : Draw.Tree;
        }
    }

    #draw(cr, paint, dye) {
        Util.seq(([x, y]) => { paint(x); Draw.paint(Draw.Motto, cr, y, this); }, [dye?.(), Draw.Motto.gen(cr, Motto.get(this), this)]);
    }

    draw(cr) {
        Draw.paint(Draw.BG, cr, Draw.BG.gen(this));
        if(this.$skt) {
            this.#draw(cr, () => this.$skt(cr));
        } else {
            let skt = this.getSketch();
            this.#draw(cr, cl => (pts => { this.$skt = Util.thunk($cr => Draw.paint(skt, $cr, pts, this), cr); })(skt.gen(cl, this)),
                () => Util.seq(() => this.accents && this.$setIf.set('accent', Color.Palette.takeAccent(), this), skt.dye(this)));
        }
    }

    #setWallpaper(path) {
        if(this.style === Style.SYSTEM) {
            if(path.endsWith('d.svg')) this.darkPic !== path && this.$setBg.set('darkPic', path, this);
            else this.lightPic !== path && this.$setBg.set('lightPic', path, this);
        } else {
            this.darkPic !== path && this.$setBg.set('darkPic', path, this);
            this.lightPic !== path && this.$setBg.set('lightPic', path, this);
        }
    }

    async #backup(path) {
        if(!this.backups) return;
        let dir = GLib.path_get_dirname(path),
            pre = path.endsWith('d.svg') ? 'shuzhi-d-' : 'shuzhi-l-',
            bak = await Util.readdir(dir, x => (y => y.startsWith(pre) && Date.parse(y.slice(9, 33)) ? [y] : [])(x.get_name())).catch(Util.noop) ?? [];
        bak.flat().slice(0, -this.backups).forEach(x => Util.fdelete(`${dir}/${x}`));
        await Util.fcopy(path, path.replace(/\.svg$/, `-${new Date().toISOString()}.svg`));
    }

    #genSystray() {
        let setSketch = x => this.$set.set(this.dark ? 'darkSketch' : 'lightSketch', x, this);
        return new Menu.Systray({
            copy: new Menu.Item(_('Copy'), () => Motto.copy(this)),
            refresh: new MenuSection([
                [_('Motto'),  () => this.#redraw(false, true)],
                [_('Sketch'), () => this.#redraw(true)],
                [_('Both'),   () => this.#redraw(true, true)],
            ], _('Refresh')),
            sep0:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: this.dark ? new Menu.RadioItem(_('Sketch'), this.darkSketches, this.darkSketch, setSketch)
                : new Menu.RadioItem(_('Sketch'), this.lightSketches, this.lightSketch, setSketch),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new Menu.Item(_('Settings'), () => Fubar.me().openPreferences()),
        }, 'florette-symbolic');
    }
}

export default class Extension extends Fubar.Extension { $klass = ShuZhi; }
