// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {Field} from './const.js';
import * as Draw from './draw.js';
import {Accent} from './color.js';
import {MenuItem, RadioItem, Systray} from './menu.js';
import {Setting, Extension, Mortal, Source, myself, _, copy} from './fubar.js';
import {noop, execute, fdelete, fcopy, readdir, request, capitalize, lot, has, seq} from './util.js';

const Style = {LIGHT: 0, DARK: 1, AUTO: 2, SYSTEM: 3};
const Type = {COMMAND: 0, TEXT: 1, IMAGE: 2, ONLINE: 3};
const Dark = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, CLOUD: 4};
const Light = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, TREE: 4};
const Desktop = {LIGHT: 'picture-uri', DARK: 'picture-uri-dark'};

class MenuSection extends PopupMenu.PopupMenuSection {
    constructor(items, name) {
        super();
        if(name) this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(name));
        items.forEach(x => this.addMenuItem(new MenuItem(...x)));
    }
}

class Motto {
    static parse(text = '') {
        try {
            return JSON.parse(text);
        } catch(e) {
            return {vtext: text, htext: text};
        }
    }

    static get({vtext, htext}, orient) {
        return (orient ? vtext || htext : htext || vtext) || '';
    }

    static $wrap = (s, l) => s.replace(RegExp(`(.{1,${l}})`, 'g'), '$1\n').trim();
    static $span = (s, o) => `<span${Object.entries(o).reduce((p, [k, v]) => `${p} ${k}="${v}"`, '')}>${s}</span>`;

    static async fetch(cancel) {
        let size = 45,
            {content, origin, author} = JSON.parse(await request('POST', 'https://v1.jinrishici.com/all.json', null, cancel)),
            poet = `${this.$span(author, {bgcolor: '#b00a', fgcolor: 'SZ_BGCOLOR'})}`,
            title = this.$span(`\n「${origin}」 ${poet}`, {size: `${size}%`}),
            vContent = content.replace(/[，。：；？、！]/g, '\n').replace(/[《》“”]/g, ''),
            vGap = this.$span('\n', {line_height: 0.15}),
            vHeight = Math.round(vContent.split('\n').reduce((p, x) => Math.max(p, x.length), 1) * 100 / size),
            vTitle = this.$span(`${this.$wrap(`「${origin}`, vHeight)}」 ${poet}`, {size: `${size}%`});
        return {vtext: `${vContent}${vGap}${vTitle}`, htext: `${content}${title}`};
    }

    static async load(command, cancel) {
        return this.parse(await execute(command, null, cancel));
    }

    static copy(motto, orient) {
        let text = this.get(motto, orient) || motto.logo;
        if(!text) return;
        try {
            copy(Pango.parse_markup(text.replace(/SZ_BGCOLOR/g, '#000'), -1, '').at(2));
        } catch(e) {
            copy(text);
        }
    }
}

class ShuZhi extends Mortal {
    constructor(gset) {
        super();
        this.$buildWidgets();
        this.$bindSettings(gset);
    }

    $bindSettings(gset) {
        this.$setBg = new Setting({
            darkPic: [Desktop.DARK, 'string'],
            lightPic: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        this.$setIf = new Setting({
            accent: ['accent-color', 'string'],
            scheme: ['color-scheme', 'string', x => x === 'prefer-dark'],
        }, 'org.gnome.desktop.interface', this, () => this.$onLightPut()).attach({
            scaling: ['text-scaling-factor', 'double'],
        }, this, () => this.$onFontPut());
        this.$set = new Setting({
            backups:  [Field.BCK,  'uint'],
            stress:   [Field.ACT,  'boolean', x => Accent.save(x)],
            interval: [Field.SPAN, 'uint',    x => this.$src.cycle.reload(x)],
            refresh:  [Field.RFS,  'boolean', x => this.$src.cycle.toggle(x)],
            systray:  [Field.STRY, 'boolean', x => this.$src.systray.toggle(x)],
        }, gset, this).attach({
            source:     [Field.SRC,  'string'],
            sourceType: [Field.SRCT, 'uint'],
        }, this, () => this.setMotto(true), true).attach({
            folder:      [Field.PATH, 'string',  null, () => [true]],
            orient:      [Field.ORNT, 'uint',    null, () => [true, true]],
            showColor:   [Field.CLR,  'boolean', null, () => [this.waving]],
            colorStyle:  [Field.CLST, 'uint',    null, () => [this.waving]],
            colorFont:   [Field.CLFT, 'string',  x => Pango.FontDescription.from_string(x), () => [this.waving]],
            darkSketch:  [Field.DSKT, 'uint',    null, x => (this.dark && this.$menu?.sketch.setChosen(x), [this.dark, true])],
            lightSketch: [Field.LSKT, 'uint',    null, x => (this.dark || this.$menu?.sketch.setChosen(x), [!this.dark, true])],
        }, this, ([x, y]) => x && this.$redraw(y)).attach({
            fontName: [Field.FONT, 'string'],
        }, this, () => this.$onFontPut()).attach({
            style: [Field.STL, 'uint'],
        }, this, () => this.$onLightPut());
    }

    $buildWidgets() {
        this.$src = Source.fuse({
            cancel: Source.newCancel(),
            systray: new Source(() => this.$genSystray()),
            light: Source.newLight(x => { this.night = x; this.$onLightPut(); }, true),
            cycle: Source.newTimer((x = this.interval) => [() => this.setMotto(true), x * 60000]),
        }, this);
        [this.$darkSketch, this.$lightSketch] = [Dark, Light].map(x => Object.values(x).filter(y => y !== x.LUCK));
        [this.darkSketches, this.lightSketches] = [Dark, Light].map(x => Object.keys(x).map(y => _(capitalize(y))));
    }

    $onFontPut() {
        this.font = Pango.FontDescription.from_string(this.fontName ?? 'Serif 32');
        this.font.set_size(this.font.get_size() * (this.scaling ?? 1));
        this.$redraw();
    }

    $onLightPut() {
        if(!has(this, 'night')) return;
        let dark = this.style === Style.AUTO ? this.night
            : this.style === Style.SYSTEM ? this.scheme : this.style === Style.DARK;
        if(dark === this.dark) return;
        Draw.setDarkBg(this.dark = dark);
        this.$menu?.sketch.setOptions(this.sketches, this.sketch);
        this.$redraw(true);
    }

    get waving() {
        return this.$skt?.type === Light.WAVE;
    }

    get $menu() {
        return this.$src.systray.hub?.$menu;
    }

    get sketch() {
        return this.dark ? this.darkSketch : this.lightSketch;
    }

    get sketches() {
        return this.dark ? this.darkSketches : this.lightSketches;
    }

    async genMotto() {
        try {
            switch(this.sourceType) {
            case Type.IMAGE:   return {logo: this.source};
            case Type.TEXT:    return Motto.parse(this.source);
            case Type.ONLINE:  return await Motto.fetch(this.$src.cancel.reborn());
            case Type.COMMAND: return await Motto.load(this.source, this.$src.cancel.reborn());
            }
        } catch(e) {
            if(Source.cancelled(e)) throw e;
            return Motto.parse(this.source);
        }
    }

    setMotto(clear) {
        this.genMotto().then(motto => {
            let inited = this.motto; // skip when unlocking screen
            this.motto = motto;
            if(inited) this.$redraw(clear);
            else if(!this.checkPath()) this.$redraw(true);
        }).catch(noop);
    }

    getPath() {
        return `${this.folder || GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES)}/shuzhi-${this.dark ? 'd.svg' : 'l.svg'}`;
    }

    checkPath() {
        let path = this.getPath();
        return this.style === Style.SYSTEM
            ? (path.endsWith('d.svg') ? this.darkPic : this.lightPic).endsWith(path)
            : this.lightPic.endsWith(path) && this.darkPic.endsWith(path);
    }

    $redraw(clear) {
        if(!has(this, 'motto', 'night')) return;
        if(clear) this.$skt = null;
        let path = this.getPath(),
            {width: x, height: y} = Main.layoutManager.monitors.reduce((p, v) => p.height * p.width > v.height * v.width ? p : v),
            surface = new Cairo.SVGSurface(path, x, y),
            cr = new Cairo.Context(surface),
            logo = has(this.motto, 'logo'),
            source = logo ? Draw.genLogo(this.motto.logo ?? '', x, y)
                : Draw.genMotto(cr, x, y, Motto.get(this.motto, this.orient), this.orient, this.font, this.scaling);
        Draw.drawBackground(cr);
        this.drawSketch(cr, x, y);
        logo ? Draw.drawLogo(cr, source) : Draw.drawMotto(cr, source);
        cr.$dispose();
        surface.finish();
        surface.flush();
        this.setWallpaper(`file://${path}`);
        this.backupWallpaper(path).catch(noop);
    }

    $genSystray() {
        return new Systray({
            copy: new MenuItem(_('Copy'), () => Motto.copy(this.motto, this.$orient)),
            refresh: new MenuSection([
                [_('Motto'),  () => this.setMotto(false)],
                [_('Sketch'), () => this.$redraw(true)],
                [_('Both'),   () => this.setMotto(true)],
            ], _('Refresh')),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: new RadioItem(_('Sketch'), this.sketches, this.sketch, x => this.$set.set(this.dark ? 'darkSketch' : 'lightSketch', x, this)),
            sep2:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new MenuItem(_('Settings'), () => myself().openPreferences()),
        }, 'florette-symbolic');
    }

    setWallpaper(path) {
        if(path) {
            if(this.style === Style.SYSTEM) {
                if(path.endsWith('d.svg')) this.darkPic !== path && this.$setBg.set('darkPic', path, this);
                else this.lightPic !== path && this.$setBg.set('lightPic', path, this);
            } else {
                this.darkPic !== path && this.$setBg.set('darkPic', path, this);
                this.lightPic !== path && this.$setBg.set('lightPic', path, this);
            }
        } else {
            Object.values(Desktop).forEach(x => this.$setBg.gset.reset(x));
        }
    }

    async backupWallpaper(path) {
        if(!this.backups) return;
        let dir = GLib.path_get_dirname(path),
            prefix = path.endsWith('d.svg') ? 'shuzhi-d-' : 'shuzhi-l-',
            baks = await readdir(dir, x => (y => y.startsWith(prefix) && Date.parse(y.slice(9, 33)) ? [y] : [])(x.get_name())).catch(noop) ?? [];
        baks.flat().slice(0, -this.backups).forEach(x => fdelete(`${dir}/${x}`));
        await fcopy(path, path.replace(/\.svg$/, `-${new Date().toISOString()}.svg`));
    }

    genSketch(x, y) {
        let pts, type = this.dark
            ? this.darkSketch === Dark.LUCK ? lot(this.$darkSketch) : this.darkSketch
            : this.lightSketch === Light.LUCK ? lot(this.$lightSketch) : this.lightSketch;
        switch(type) {
        case Light.WAVE: pts = Draw.genWaves(x, y); break;
        case Light.BLOB: pts = Draw.genBlobs(x, y); break;
        case Light.OVAL: pts = Draw.genOvals(x, y); break;
        case Light.TREE:
        case Dark.CLOUD: pts = this.dark ? Draw.genClouds(x, y) : Draw.genTrees(x, y); break;
        }
        if(this.stress) seq(a => a && a !== this.accent && this.$setIf.set('accent', a, this), Accent.take());
        return {type, pts};
    }

    drawSketch(cr, x, y) {
        let {type, pts} = this.$skt ??= this.genSketch(x, y);
        switch(type) {
        case Light.WAVE: Draw.drawWaves(cr, pts, this.showColor, this.colorFont, this.colorStyle); break;
        case Light.BLOB: Draw.drawBlobs(cr, pts); break;
        case Light.OVAL: Draw.drawOvals(cr, pts); break;
        case Light.TREE:
        case Dark.CLOUD: this.dark ? Draw.drawClouds(cr, pts) : Draw.drawTrees(cr, pts); break;
        }
    }
}

export default class MyExtension extends Extension { $klass = ShuZhi; }
