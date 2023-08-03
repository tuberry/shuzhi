// vim:fdm=syntax
// by tuberry
/* exported init */
'use strict';

const Cairo = imports.cairo;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { xnor, noop, _, execute, fopen, fdelete, fcopy, denum, access } = Me.imports.util;
const { Fulu, Extension, Destroyable, symbiose, omit, initLightProxy } = Me.imports.fubar;
const { MenuItem, DRadioItem, TrayIcon } = Me.imports.menu;
const { Field } = Me.imports.const;
const Draw = Me.imports.draw;

const Style = { LIGHT: 0, DARK: 1, AUTO: 2, SYSTEM: 3 };
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };
const Desktop = { LIGHT: 'picture-uri', DARK: 'picture-uri-dark' };
const em2pg = (x, y) => x.replaceAll(/([0-9.]*)em/g, (_m, s1) => `${y * s1}`);

class MenuSection extends PopupMenu.PopupMenuSection {
    constructor(items, name) {
        super();
        if(name) this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(name));
        items.forEach(x => this.addMenuItem(new MenuItem(...x)));
    }
}

class ShuZhi extends Destroyable {
    constructor() {
        super();
        this._buildWidgets();
        this._bindSettings();
    }

    _bindSettings() {
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
        }, ExtensionUtils.getSettings(), this).attach({
            folder:    [Field.PATH, 'string'],
            orient:    [Field.ORNT, 'uint',    [null, () => { this._pts.length = 0; }]],
            font:      [Field.FONT, 'string',  [null, x => this.setFontName(x)]],
            showcolor: [Field.CLR,  'boolean', [() => this.sketch !== LSketch.Waves]],
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
        this._light = initLightProxy(() => { this.murkey = ['night_light', this._light.NightLightActive]; }, this);
    }

    setFontName(font) {
        Draw.setFontName(font);
        this._font_size = Pango.FontDescription.from_string(font).get_size() / Pango.SCALE;
    }

    set murkey([k, v, out]) {
        if(k) this[k] = out ? out(v) : v;
        let dark = this.style === Style.AUTO ? this.night_light
            : this.style === Style.SYSTEM ? this.scheme : this.style === Style.DARK;
        if(dark === this.dark) return;
        Draw.setDarkBg(this.dark = dark);
        this._queueRepaint(true);
        this._menus?.sketch.setList(this.getSketches(), this.sketch);
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
            this._btn = Main.panel.addToStatusArea(Me.metadata.uuid, new PanelMenu.Button(0.5, Me.metadata.uuid));
            this._btn.add_actor(new TrayIcon('florette-symbolic', true));
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

    getSketches() {
        return Object.keys(this.dark ? DSketch : LSketch).map(x => _(x));
    }

    getPath() {
        let file = `/shuzhi-${this.dark ? 'd.svg' : 'l.svg'}`;
        return (this.folder || GLib.get_user_cache_dir()) + file;
    }

    async _genMotto() {
        try {
            return await execute(this._command);
        } catch(e) {
            if(GLib.shell_parse_argv(this._command).at(1).at(0) === 'shuzhi.sh') {
                let { content, origin, author } = JSON.parse(await access('POST', 'https://v1.jinrishici.com/all.json')),
                    vcontent = content.replaceAll(/[，。：；？、！]/g, '\n').replaceAll(/[《》“”]/g, ''),
                    span = (s, a) => `<span ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>${s}</span>`,
                    title = span(`「${origin}」${span(author, { bgcolor: '#b00a', fgcolor: 'SZ_BGCOLOR' })}`, { font: '0.45em' });
                return JSON.stringify({ vtext: `${vcontent}${title}`, htext: `${content}${title}` });
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
        this._genMotto().then(scc => (this.motto = scc))
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
        mt = mt ? em2pg(mt.replace(/SZ_BGCOLOR/g, '#000'), 16) : this._motto.logo || '';
        try {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, Pango.parse_markup(mt, -1, '').at(2));
        } catch(e) {
            // ignore
        }
    }

    _addMenuItems() {
        this._menus = {
            copy:   new MenuItem(_('Copy'), () => this._copyMotto()),
            refresh: new MenuSection([
                [_('Motto'),  () => this._setMotto(false)],
                [_('Sketch'), () => this._queueRepaint(true)],
                [_('Both'),   () => this._setMotto(true)],
            ], _('Refresh')),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: new DRadioItem(_('Sketch'), this.getSketches(), this.sketch, x => (this.sketch = x)),
            sep2:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new MenuItem(_('Settings'), () => ExtensionUtils.openPrefs()),
        };
        for(let p in this._menus) this._btn.menu.addMenuItem(this._menus[p]);
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
            sc = mt ? Draw.genMotto(cr, x, y, em2pg(mt, this._font_size), this.orient) : Draw.genLogo(this._motto.logo, x, y);
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
        let dir = fopen(GLib.path_get_dirname(path));
        [...await denum(dir).catch(noop) ?? []].map(x => x.get_name())
            .flatMap(x => Date.parse(x.slice(9, 33)) ? [dir.get_child(x)] : [])
            .slice(0, -this.backups)
            .forEach(x => fdelete(x));
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

function init() {
    return new Extension(ShuZhi);
}
