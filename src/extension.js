// vim:fdm=syntax
// by tuberry
/* exported init */
'use strict';

const Cairo = imports.cairo;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, GObject, Gio, Pango } = imports.gi;

const LightProxy = Main.panel.statusArea.quickSettings._nightLight._proxy;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { xnor, noop, _, execute, fl, fdelete, fcopy, denum } = Me.imports.util;
const { Fulu, Extension, Symbiont, DEventEmitter } = Me.imports.fubar;
const { Field } = Me.imports.const;
const Draw = Me.imports.draw;

const Style = { Light: 0, Dark: 1, Auto: 2, System: 3 };
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };
const Desktop = { LIGHT: 'picture-uri', DARK: 'picture-uri-dark' };

const bak = (x, y) => x.startsWith(`${y}-`) && x.endsWith('.svg');
const em2pg = (x, y) => x.replace(/([0-9.]*)em/g, (_m, s1) => `${y * s1}`);
const genIcon = x => Gio.Icon.new_for_string(Me.dir.get_child('icons').get_child(`${x}.svg`).get_path());

class MenuItem extends PopupMenu.PopupMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(text, callback, params) {
        super(text, params);
        this.connect('activate', callback);
    }

    setLabel(label) {
        if(this.label.text !== label) this.label.set_text(label);
    }
}

class MenuSection extends PopupMenu.PopupMenuSection {
    constructor(items, name) {
        super();
        if(name) this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(name));
        items.forEach(x => this.addMenuItem(new MenuItem(...x)));
    }
}

class DRadioItem extends PopupMenu.PopupSubMenuMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(name, list, index, cb1, cb2) {
        super('');
        this._name = name;
        this._cb1 = cb1;
        this._cb2 = cb2 || (x => this._list[x]);
        this.setList(list, index);
    }

    setSelected(index) {
        this._index = index;
        this.label.set_text(`${this._name}：${this._cb2(this._index) || ''}`);
        this.menu._getMenuItems().forEach((y, i) => y.setOrnament(index === i ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE));
    }

    setList(list, index) {
        let items = this.menu._getMenuItems();
        let diff = list.length - items.length;
        if(diff > 0) for(let a = 0; a < diff; a++) this.menu.addMenuItem(new MenuItem('', () => this._cb1(items.length + a)));
        else if(diff < 0) for(let a = 0; a > diff; a--) items.at(a - 1).destroy();
        this._list = list;
        this.menu._getMenuItems().forEach((x, i) => x.setLabel(list[i]));
        this.setSelected(index ?? this._index);
    }
}

class ShuZhi extends DEventEmitter {
    constructor() {
        super();
        this._buildWidgets();
        this._bindSettings();
        this._syncNightLight();
    }

    _bindSettings() {
        this._fulu_d = new Fulu({
            dpic: [Desktop.DARK,  'string'],
            lpic: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        this._fulu = new Fulu({
            interval:  [Field.INTERVAL, 'uint'],
            backups:   [Field.BACKUPS,  'uint'],
            refresh:   [Field.REFRESH,  'boolean'],
            systray:   [Field.SYSTRAY,  'boolean'],
            command:   [Field.COMMAND,  'string'],
        }, ExtensionUtils.getSettings(), this).attach({
            folder:    [Field.FOLDER,   'string'],
            orient:    [Field.ORIENT,   'uint',    [null, () => { this._pts.length = 0; }]],
            font:      [Field.FONT,     'string',  [null, x => this.setFontName(x)]],
            showcolor: [Field.COLOR,    'boolean', [() => this.sketch !== LSketch.Waves]],
            lsketch:   [Field.LSKETCH,  'uint',    [() => this.dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
            dsketch:   [Field.DSKETCH,  'uint',    [() => !this.dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
        }, this, 'redraw').attach({
            style:     [Field.STYLE,    'uint'],
        }, this, 'murkey');
        this._tfield = new Fulu({ scheme: ['color-scheme', 'string', x => x === 'prefer-dark'] }, 'org.gnome.desktop.interface', this, 'murkey');
        LightProxy.connectObject('g-properties-changed', (_l, p) => p.lookup_value('NightLightActive', null) && this._syncNightLight(), this);
    }

    _buildWidgets() {
        this._pts = [];
        this._sbt_r = new Symbiont(x => clearInterval(x), this, x => x && setInterval(() => this._setMotto(true), this._interval * 60000));
        new Symbiont(() => {
            LightProxy.disconnectObject(this);
            this.systray = null;
        }, this);
    }

    _syncNightLight() {
        if(LightProxy.NightLightActive === null) return;
        this.murkey = ['night_light', LightProxy.NightLightActive];
    }

    setFontName(font) {
        Draw.setFontName(font);
        this._font_size = Pango.FontDescription.from_string(font).get_size() / Pango.SCALE;
    }

    set murkey([k, v, out]) {
        this[k] = out ? out(v) : v;
        let dark = (this.style === Style.Auto && this.night_light) ||
            (this.style === Style.System && this.scheme) || this.style === Style.Dark;
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
        if(xnor(systray, this._button)) return;
        if(systray) {
            this._button = new PanelMenu.Button(0.5, Me.metadata.uuid);
            this._button.menu.actor.add_style_class_name('app-menu');
            this._button.add_actor(new St.Icon({ gicon: genIcon('florette-symbolic'), style_class: 'system-status-icon' }));
            Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 0, 'right');
            this._addMenuItems();
        } else {
            this._button.destroy();
            this._menus = this._button = null;
        }
    }

    get sketch() {
        return this.dark ? this.dsketch : this.lsketch;
    }

    set sketch(sketch) {
        this.setf(this.dark ? 'dsketch' : 'lsketch', sketch);
    }

    set refresh(refresh) {
        this._sbt_r.reset(this._refresh = refresh);
    }

    set interval(interval) {
        this._interval = interval;
        if(this._refresh) this._sbt_r.reset(true);
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
        let file = `/shuzhi-${this.dark ? 'dark.svg' : 'light.svg'}`;
        return (this.folder || GLib.get_user_cache_dir()) + file;
    }

    async _genMotto() {
        let fmt = x => x.replace(/\n*$/, '');
        try {
            return await execute(this._command, fmt);
        } catch(e) {
            let [cmd] = GLib.shell_parse_argv(this._command).at(1);
            if(cmd === 'shuzhi.sh') return execute(`bash ${Me.dir.get_child('shuzhi.sh').get_path()}`, fmt);
            else throw e;
        }
    }

    _checkImg() {
        let path = this.getPath();
        return this.style === Style.System
            ? (path.endsWith('dark.svg') ? this.dpic : this.lpic).endsWith(path)
            : this.lpic.endsWith(path) && this.dpic.endsWith(path);
    }

    _setMotto(paint) {
        this._genMotto().then(scc => (this.motto = scc))
            .catch(e => { logError(e); this.motto = ''; })
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
        mt = mt ? em2pg(mt.replace(/SZ_BGCOLOR/g, '#fff'), 16) : this._motto.logo || '';
        let [ok, , text] = Pango.parse_markup(mt, -1, '');
        if(ok && text) St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
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
        for(let p in this._menus) this._button.menu.addMenuItem(this._menus[p]);
    }

    set desktop(image) {
        if(image) {
            if(this.style === Style.System) {
                if(image.endsWith('dark.svg')) !this.dpic.endsWith(image) && this.setf('dpic', image, 'd');
                else !this.lpic.endsWith(image) && this.setf('lpic', image, 'd');
            } else {
                !this.lpic.endsWith(image) && this.setf('lpic', image, 'd');
                !this.dpic.endsWith(image) && this.setf('dpic', image, 'd');
            }
        } else {
            let vs = Object.values(this._fulu_d.prop.get(this));
            vs.forEach(([v]) => this._fulu_d.gset.reset(v));
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
        let pics = [],
            dir = GLib.path_get_dirname(path),
            name = GLib.path_get_basename(path).replace(/\..+$/, '');
        await fcopy(fl(path), fl(dir, `${name}-${new Date().toLocaleFormat('%FT%T')}.svg`));
        for(let f of await denum(fl(dir)).catch(noop) ?? []) pics.push(f);
        pics = pics.flatMap(x => bak(x.get_name(), name) ? [x] : []).slice(0, -this.backups - 1);
        Promise.all(pics.forEach(x => fdelete(x))).catch(noop);
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
