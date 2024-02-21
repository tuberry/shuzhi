// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import GLib from 'gi://GLib';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Draw from './draw.js';
import {Field} from './const.js';
import {MenuItem, RadioItem, PanelButton} from './menu.js';
import {xnor, noop, execute, fdelete, fcopy, readdir, request, capitalize, lot, has} from './util.js';
import {Fulu, ExtensionBase, Destroyable, symbiose, omit, getSelf, bindNight, _, copy} from './fubar.js';

const Style = {LIGHT: 0, DARK: 1, AUTO: 2, SYSTEM: 3};
const Desktop = {LIGHT: 'picture-uri', DARK: 'picture-uri-dark'};
const LSketch = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, TREE: 4};
const DSketch = {LUCK: 0, WAVE: 1, OVAL: 2, BLOB: 3, CLOUD: 4};

class MenuSection extends PopupMenu.PopupMenuSection {
    constructor(items, name) {
        super();
        if(name) this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(name));
        items.forEach(x => this.addMenuItem(new MenuItem(...x)));
    }
}

class ShuZhi extends Destroyable {
    constructor(gset) {
        super();
        this._buildWidgets();
        this._bindSettings(gset);
    }

    _bindSettings(gset) {
        this._fulu_bg = new Fulu({
            dpic: [Desktop.DARK,  'string'],
            lpic: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        this._fulu_if = new Fulu({
            scheme: ['color-scheme', 'string', x => x === 'prefer-dark'],
        }, 'org.gnome.desktop.interface', this, 'murkey').attach({
            scaling: ['text-scaling-factor', 'double'],
        }, this, 'font');
        this._fulu = new Fulu({
            interval: [Field.SPAN, 'uint'],
            backups:  [Field.BCK,  'uint'],
            refresh:  [Field.RFS,  'boolean'],
            systray:  [Field.STRY, 'boolean'],
            command:  [Field.CMD,  'string'],
        }, gset, this).attach({
            folder:      [Field.PATH, 'string'],
            orient:      [Field.ORNT, 'uint',    {clear: true}],
            show_color:  [Field.CLR,  'boolean', {check: () => this._skt?.type !== LSketch.WAVE}],
            color_style: [Field.CLST, 'uint',    {check: () => this._skt?.type !== LSketch.WAVE}],
            lsketch:     [Field.LSKT, 'uint',    {check: () => this.dark, clear: true, cover: x => this._menus?.sketch.setChosen(x)}],
            dsketch:     [Field.DSKT, 'uint',    {check: () => !this.dark, clear: true, cover: x => this._menus?.sketch.setChosen(x)}],
            color_font:  [Field.CLFT, 'string',  {convert: x => Pango.FontDescription.from_string(x), check: () => this._skt?.type !== LSketch.WAVE}],
        }, this, 'redraw').attach({
            style: [Field.STL,  'uint'],
        }, this, 'murkey').attach({
            fontname: [Field.FONT, 'string'],
        }, this, 'font');
        bindNight(x => ['_night', x], this, 'murkey');
    }

    _buildWidgets() {
        this._sbt = symbiose(this, () => omit(this, 'systray'), {
            cycle: [clearInterval, x => x && setInterval(() => this._updateMotto(true), this._interval * 60000)],
        });
        [this._dsketch, this._lsketch] = [DSketch, LSketch].map(x => Object.values(x).filter(y => y !== x.LUCK));
    }

    set font([k, v]) {
        this[k] = v;
        if(!has(this, 'fontname', 'scaling')) return;
        let font = Pango.FontDescription.from_string(this.fontname);
        font.set_size(font.get_size() * this.scaling);
        this.redraw = ['_font', font];
    }

    set murkey([k, v, cb]) {
        this[k] = cb?.(v) ?? v;
        if(!has(this, '_night')) return;
        let dark = this.style === Style.AUTO ? this._night
            : this.style === Style.SYSTEM ? this.scheme : this.style === Style.DARK;
        if(dark === this.dark) return;
        Draw.setDarkBg(this.dark = dark);
        this._queueRepaint(true);
        this._menus?.sketch.setOptions(this.sketches, this.sketch);
    }

    set redraw([k, v, cb = {}]) {
        let {convert, check, clear, cover} = cb;
        this[k] = convert?.(v) ?? v;
        if(check?.(v)) return;
        this._queueRepaint(clear);
        cover?.(v);
    }

    set systray(systray) {
        if(xnor(systray, this._btn)) return;
        if(systray) {
            this._btn = new PanelButton('florette-symbolic');
            this._addMenuItems();
        } else {
            omit(this, '_btn', '_menus');
        }
    }

    get sketch() {
        return this.dark ? this.dsketch : this.lsketch;
    }

    set sketch(sketch) {
        this._fulu.set(this.dark ? 'dsketch' : 'lsketch', sketch, this);
    }

    set refresh(refresh) {
        this._sbt.cycle.revive(this._refresh = refresh);
    }

    set interval(interval) {
        this._interval = interval;
        this._sbt.cycle.revive(this._refresh);
    }

    set command(command) {
        this._command = command;
        this._updateMotto(false);
    }

    set motto(motto) {
        try {
            this._motto = JSON.parse(motto);
        } catch(e) {
            this._motto = !motto || motto.startsWith('file://') ? {logo: motto || ''} : {vtext: motto, htext: motto};
        }
    }

    get sketches() {
        return Object.keys(this.dark ? DSketch : LSketch).map(y => _(capitalize(y)));
    }

    getPath() {
        return `${this.folder || GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES)}/shuzhi-${this.dark ? 'd.svg' : 'l.svg'}`;
    }

    async _genMotto() {
        try {
            return await execute(this._command);
        } catch(e) {
            if(GLib.shell_parse_argv(this._command).at(1).at(0) === 'shuzhi.sh') {
                let size = 45,
                    wrap = (s, l) => s.replace(RegExp(`(.{1,${l}})`, 'g'), '$1\n').trim(),
                    span = (s, o) => `<span${Object.entries(o).reduce((p, [k, v]) => `${p} ${k}="${v}"`, '')}>${s}</span>`,
                    {content, origin, author} = JSON.parse(await request('POST', 'https://v1.jinrishici.com/all.json')),
                    poet = `${span(author, {bgcolor: '#b00a', fgcolor: 'SZ_BGCOLOR'})}`,
                    title = span(`\n「${origin}」 ${poet}`, {size: `${size}%`}),
                    vcontent = content.replace(/[，。：；？、！]/g, '\n').replace(/[《》“”]/g, ''),
                    vheight = Math.round(vcontent.split('\n').reduce((p, x) => Math.max(p, x.length), 1) * 100 / size),
                    vtitle = span(`${wrap(`「${origin}`, vheight)}」 ${poet}`, {size: `${size}%`});
                return JSON.stringify({vtext: `${vcontent}${vtitle}`, htext: `${content}${title}`});
            } else { throw e; }
        }
    }

    _checkPath() {
        let path = this.getPath();
        return this.style === Style.SYSTEM
            ? (path.endsWith('d.svg') ? this.dpic : this.lpic).endsWith(path)
            : this.lpic.endsWith(path) && this.dpic.endsWith(path);
    }

    _updateMotto(paint) {
        this._genMotto().then(scc => { this.motto = scc; })
            .catch(() => { this.motto = ''; })
            .finally(() => {
                if(this._synced) {
                    this._queueRepaint(paint);
                } else {
                    this._synced = true; // skip when unlocking screen
                    if(!this._checkPath()) this._queueRepaint(true);
                }
            });
    }

    _queueRepaint(clear) {
        if(!has(this, '_motto', '_night')) return;
        if(clear) this._skt = null;
        this.repaint();
    }

    _copyMotto() {
        if(!this._motto) return;
        let mt = this._getMotto();
        try {
            copy(Pango.parse_markup(mt.replace(/SZ_BGCOLOR/g, '#000'), -1, '').at(2) || this._motto.logo);
        } catch(e) {
            // ignore
        }
    }

    _getMotto() {
        return this.orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext;
    }

    _addMenuItems() {
        this._menus = {
            copy: new MenuItem(_('Copy'), () => this._copyMotto()),
            refresh: new MenuSection([
                [_('Motto'),  () => this._updateMotto(false)],
                [_('Sketch'), () => this._queueRepaint(true)],
                [_('Both'),   () => this._updateMotto(true)],
            ], _('Refresh')),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: new RadioItem(_('Sketch'), this.sketches, this.sketch, x => { this.sketch = x; }),
            sep2:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new MenuItem(_('Settings'), () => getSelf().openPreferences()),
        };
        Object.values(this._menus).forEach(x => this._btn.menu.addMenuItem(x));
    }

    set desktop(image) {
        if(image) {
            if(this.style === Style.SYSTEM) {
                if(image.endsWith('d.svg')) !this.dpic.endsWith(image) && this._fulu_bg.set('dpic', image, this);
                else !this.lpic.endsWith(image) && this._fulu_bg.set('lpic', image, this);
            } else {
                !this.lpic.endsWith(image) && this._fulu_bg.set('lpic', image, this);
                !this.dpic.endsWith(image) && this._fulu_bg.set('dpic', image, this);
            }
        } else {
            Object.values(this._fulu_bg.prop.get(this)).forEach(([v]) => this._fulu_bg.gset.reset(v));
        }
    }

    repaint() {
        let path = this.getPath(),
            {width: x, height: y} = Main.layoutManager.monitors.reduce((p, v) => p.height * p.width > v.height * v.width ? p : v),
            sf = new Cairo.SVGSurface(path, x, y),
            cr = new Cairo.Context(sf),
            mt = this._getMotto(),
            sc = mt ? Draw.genMotto(cr, x, y, mt, this.orient, this._font, this.scaling) : Draw.genLogo(this._motto.logo, x, y);
        Draw.drawBackground(cr);
        this._drawSketch(cr, x, y);
        mt ? Draw.drawMotto(cr, sc) : Draw.drawLogo(cr, sc);
        cr.$dispose();
        sf.finish();
        sf.flush();
        this._backup(this.desktop = path).catch(noop);
    }

    async _backup(path) {
        if(!this.backups) return;
        let dir = GLib.path_get_dirname(path),
            head = path.endsWith('d.svg') ? 'shuzhi-d-' : 'shuzhi-l-',
            baks = await readdir(dir, x => (y => y.startsWith(head) && Date.parse(y.slice(9, 33)) ? [y] : [])(x.get_name())).catch(noop) ?? [];
        baks.flat().slice(0, -this.backups).forEach(x => fdelete(`${dir}/${x}`));
        await fcopy(path, path.replace(/\.svg$/, `-${new Date().toISOString()}.svg`));
    }

    _genSketch(x, y) {
        let type = this.dark
            ? this.dsketch === DSketch.LUCK ? lot(this._dsketch) : this.dsketch
            : this.lsketch === LSketch.LUCK ? lot(this._lsketch) : this.lsketch;
        switch(type) {
        case LSketch.WAVE: return {type, dots: Draw.genWaves(x, y)};
        case LSketch.BLOB: return {type, dots: Draw.genBlobs(x, y)};
        case LSketch.OVAL: return {type, dots: Draw.genOvals(x, y)};
        case LSketch.TREE:
        case DSketch.CLOUD: return {type, dots: this.dark ? Draw.genClouds(x, y) : Draw.genTrees(x, y)};
        }
    }

    _drawSketch(cr, x, y) {
        this._skt ??= this._genSketch(x, y);
        switch(this._skt.type) {
        case LSketch.WAVE: Draw.drawWaves(cr, this._skt.dots, [this.show_color, this.color_font, this.color_style]); break;
        case LSketch.BLOB: Draw.drawBlobs(cr, this._skt.dots); break;
        case LSketch.OVAL: Draw.drawOvals(cr, this._skt.dots); break;
        case LSketch.TREE:
        case DSketch.CLOUD: if(this.dark) Draw.drawClouds(cr, this._skt.dots); else Draw.drawTrees(cr, this._skt.dots); break;
        }
    }
}

export default class Extension extends ExtensionBase { $klass = ShuZhi; }
