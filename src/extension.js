// vim:fdm=syntax
// by tuberry

import St from 'gi://St';
import GLib from 'gi://GLib';
import Cairo from 'gi://cairo';
import Pango from 'gi://Pango';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Draw from './draw.js';
import { Field } from './const.js';
import { MenuItem, DRadioItem, TrayIcon } from './menu.js';
import { xnor, noop, execute, fopen, fdelete, fcopy, denum, access } from './util.js';
import { Fulu, ExtensionBase, Destroyable, symbiose, omit, getSelf, lightProxy, _ } from './fubar.js';

const Style = { LIGHT: 0, DARK: 1, AUTO: 2, SYSTEM: 3 };
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };
const Desktop = { LIGHT: 'picture-uri', DARK: 'picture-uri-dark' };

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
        this._fulu_d = new Fulu({
            dpic: [Desktop.DARK,  'string'],
            lpic: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        this._fulu = new Fulu({
            interval:  [Field.SPAN, 'uint'],
            backups:   [Field.BCK,  'uint'],
            refresh:   [Field.RFS,  'boolean'],
            systray:   [Field.STRY, 'boolean'],
            command:   [Field.CMD,  'string'],
        }, gset, this).attach({
            folder:    [Field.PATH, 'string'],
            font:      [Field.FONT, 'string',  [null, x => Draw.setFontName(x)]],
            showcolor: [Field.CLR,  'boolean', [() => this.sketch !== LSketch.Waves]],
            orient:    [Field.ORNT, 'uint',    [null, () => { this._pts.length = 0; }]],
            lsketch:   [Field.LSKT, 'uint',    [() => this.dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
            dsketch:   [Field.DSKT, 'uint',    [() => !this.dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
        }, this, 'redraw').attach({
            style:     [Field.STL,  'uint'],
        }, this, 'murkey');
        this._tfield = new Fulu({ scheme: ['color-scheme', 'string', x => x === 'prefer-dark'] }, 'org.gnome.desktop.interface', this, 'murkey');
    }

    _buildWidgets() {
        this._pts = [];
        this._sbt = symbiose(this, () => omit(this, 'systray', '_light'), {
            cycle: [clearInterval, x => x && setInterval(() => this._setMotto(true), this._interval * 60000)],
        });
        this._light = lightProxy(() => { this.murkey = ['night_light', this._light.NightLightActive]; }, this);
        [this._dsketches, this._lsketches] = [DSketch, LSketch].map(x => Object.keys(x).map(y => _(y)));
    }

    set murkey([k, v, out]) {
        if(k) this[k] = out ? out(v) : v;
        let dark = this.style === Style.AUTO ? this.night_light
            : this.style === Style.SYSTEM ? this.scheme : this.style === Style.DARK;
        if(dark === this.dark) return;
        Draw.setDarkBg(this.dark = dark);
        this._queueRepaint(true);
        this._menus?.sketch.setList(this.sketches, this.sketch);
    }

    set redraw([k, v, out]) { // out <- [cond, pre, post];
        this[k] = v;
        if(out?.[0]?.(v)) return;
        out?.[1]?.(v);
        this._queueRepaint();
        out?.[2]?.(v);
    }

    set systray(systray) {
        if(xnor(systray, this._btn)) return;
        if(systray) {
            this._btn = Main.panel.addToStatusArea(getSelf().uuid, new PanelMenu.Button(0.5));
            this._btn.add_child(new TrayIcon('florette-symbolic', true));
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
        if(this._refresh) this._sbt.cycle.revive(true);
    }

    set command(command) {
        this._command = command;
        this._setMotto(false);
    }

    set motto(motto) {
        try {
            this._motto = JSON.parse(motto);
        } catch(e) {
            this._motto = !motto || motto.startsWith('file://') ? { logo: motto || '' } : { vtext: motto, htext: motto };
        }
    }

    get sketches() {
        return this.dark ? this._dsketches : this._lsketches;
    }

    getPath() {
        let file = `/shuzhi-${this.dark ? 'd.svg' : 'l.svg'}`;
        return (this.folder || GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES)) + file;
    }

    async _genMotto() {
        try {
            return await execute(this._command);
        } catch(e) {
            if(GLib.shell_parse_argv(this._command).at(1).at(0) === 'shuzhi.sh') {
                let size = 45,
                    wrap = (s, l) => s.replace(new RegExp(`(.{1,${l}})`, 'g'), '$1\n').trim(),
                    span = (s, o) => `<span${Object.entries(o).reduce((p, [k, v]) => `${p} ${k}="${v}"`, '')}>${s}</span>`,
                    { content, origin, author } = JSON.parse(await access('POST', 'https://v1.jinrishici.com/all.json')),
                    poet = `${span(author, { bgcolor: '#b00a', fgcolor: 'SZ_BGCOLOR' })}`,
                    title = span(`\n「${origin}」 ${poet}`, { size: `${size}%` }),
                    vcontent = content.replace(/[，。：；？、！]/g, '\n').replace(/[《》“”]/g, ''),
                    vheight = Math.round(vcontent.split('\n').reduce((p, x) => Math.max(p, x.length), 1) * 100 / size),
                    vtitle = span(`${wrap(`「${origin}`, vheight)}」 ${poet}`, { size: `${size}%` });
                return JSON.stringify({ vtext: `${vcontent}${vtitle}`, htext: `${content}${title}` });
            } else { throw e; }
        }
    }

    _checkImg() {
        let path = this.getPath();
        return this.style === Style.SYSTEM
            ? (path.endsWith('d.svg') ? this.dpic : this.lpic).endsWith(path)
            : this.lpic.endsWith(path) && this.dpic.endsWith(path);
    }

    _setMotto(paint) {
        this._genMotto().then(scc => { this.motto = scc; })
            .catch(() => { this.motto = ''; })
            .finally(() => {
                if(this._synced) {
                    this._queueRepaint(paint);
                } else {
                    this._synced = true; // skip when unlocking screen
                    if(!this._checkImg()) this._queueRepaint(true);
                }
            });
    }

    _queueRepaint(paint) {
        if(!['_motto', 'night_light'].every(x => x in this)) return;
        if(paint) this._pts.length = 0;
        this.repaint();
    }

    _copyMotto() {
        let mt = this.orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext;
        mt = mt ? mt.replace(/SZ_BGCOLOR/g, '#000') : this._motto.logo || '';
        try {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, Pango.parse_markup(mt, -1, '').at(2));
        } catch(e) {
            // ignore
        }
    }

    _addMenuItems() {
        this._menus = {
            copy: new MenuItem(_('Copy'), () => this._copyMotto()),
            refresh: new MenuSection([
                [_('Motto'),  () => this._setMotto(false)],
                [_('Sketch'), () => this._queueRepaint(true)],
                [_('Both'),   () => this._setMotto(true)],
            ], _('Refresh')),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: new DRadioItem(_('Sketch'), this.sketches, this.sketch, x => { this.sketch = x; }),
            sep2:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new MenuItem(_('Settings'), () => getSelf().openPreferences()),
        };
        Object.values(this._menus).forEach(x => this._btn.menu.addMenuItem(x));
    }

    set desktop(image) {
        if(image) {
            if(this.style === Style.SYSTEM) {
                if(image.endsWith('d.svg')) !this.dpic.endsWith(image) && this._fulu_d.set('dpic', image, this);
                else !this.lpic.endsWith(image) && this._fulu_d.set('lpic', image, this);
            } else {
                !this.lpic.endsWith(image) && this._fulu_d.set('lpic', image, this);
                !this.dpic.endsWith(image) && this._fulu_d.set('dpic', image, this);
            }
        } else {
            Object.values(this._fulu_d.prop.get(this)).forEach(([v]) => this._fulu_d.gset.reset(v));
        }
    }

    repaint() {
        let path = this.getPath(),
            { width: x, height: y } = Main.layoutManager.monitors.reduce((p, v) => p.height * p.width > v.height * v.width ? p : v),
            sf = new Cairo.SVGSurface(path, x, y),
            cr = new Cairo.Context(sf),
            mt = this.orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext,
            sc = mt ? Draw.genMotto(cr, x, y, mt, this.orient) : Draw.genLogo(this._motto.logo, x, y);
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
            baks = await denum(dir, x => (y => y.startsWith(head) && Date.parse(y.slice(9, 33)) ? [y] : [])(x.get_name()));
        baks.flat().slice(0, -this.backups).forEach(x => fdelete(fopen(dir, x)));
        await fcopy(fopen(path), fopen(path.replace(/\.svg$/, `-${new Date().toISOString()}.svg`)));
    }

    _drawSketch(cr, x, y) {
        switch(this.sketch) {
        case DSketch.Waves:
            if(!this._pts.length) this._pts = Draw.genWaves(x, y);
            Draw.drawWaves(cr, this._pts, this.showcolor);
            break;
        case DSketch.Blobs:
            if(!this._pts.length) this._pts = Draw.genBlobs(x, y);
            Draw.drawBlobs(cr, this._pts);
            break;
        case DSketch.Ovals:
            if(!this._pts.length) this._pts = Draw.genOvals(x, y);
            Draw.drawOvals(cr, this._pts);
            break;
        case DSketch.Clouds:
        case LSketch.Trees:
            if(this.dark) {
                if(!this._pts.length) this._pts = Draw.genClouds(x, y);
                Draw.drawClouds(cr, this._pts);
            } else {
                if(!this._pts.length) this._pts = Draw.genTrees(x, y);
                Draw.drawTrees(cr, this._pts);
            }
            break;
        }
    }
}

export default class Extension extends ExtensionBase { $klass = ShuZhi; }
