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
const _ = ExtensionUtils.gettext;
const Draw = Me.imports.draw;
const { Fields, Field } = Me.imports.fields;

const Style = { Light: 0, Dark: 1, Auto: 2, System: 3 };
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };
const Desktop = { LIGHT: 'picture-uri', DARK: 'picture-uri-dark' };
const noop = () => {};
const fl = (...as) => Gio.File.new_for_path(GLib.build_filenamev(as));
const isBakOf = (x, y) => x.startsWith(`${y}-`) && x.endsWith('.svg');
const em2pg = (x, y) => x.replace(/([0-9.]*)em/g, (_m, s1) => `${y * s1}`);
const genIcon = x => Gio.Icon.new_for_string(Me.dir.get_child('icons').get_child(`${x}.svg`).get_path());

Gio._promisify(Gio.File.prototype, 'copy_async');
Gio._promisify(Gio.File.prototype, 'delete_async');
Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');

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

class ShuZhi {
    constructor() {
        this._pts = [];
        this._bindSettings();
        this._syncNightLight();
    }

    _bindSettings() {
        this._dfield = new Field({
            dpic: [Desktop.DARK,  'string'],
            lpic: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        this._field = new Field({
            interval:  [Fields.INTERVAL, 'uint'],
            backups:   [Fields.BACKUPS,  'uint'],
            refresh:   [Fields.REFRESH,  'boolean'],
            systray:   [Fields.SYSTRAY,  'boolean'],
            command:   [Fields.COMMAND,  'string'],
        }, ExtensionUtils.getSettings(), this).attach({
            folder:    [Fields.FOLDER,   'string'],
            orient:    [Fields.ORIENT,   'uint',    [null, () => { this._pts.length = 0; }]],
            font:      [Fields.FONT,     'string',  [null, x => Draw.setFontName(x)]],
            showcolor: [Fields.COLOR,    'boolean', [() => this.sketch !== LSketch.Waves]],
            lsketch:   [Fields.LSKETCH,  'uint',    [() => this._dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
            dsketch:   [Fields.DSKETCH,  'uint',    [() => !this._dark, () => { this._pts.length = 0; }, x => this._menus?.sketch.setSelected(x)]],
        }, this, 'redraw').attach({
            style:     [Fields.STYLE,    'uint'],
        }, this, 'murkey');
        this._tfield = new Field({ scheme: ['color-scheme', 'string', x => x === 'prefer-dark'] }, 'org.gnome.desktop.interface', this, 'murkey');
        LightProxy.connectObject('g-properties-changed', (_l, p) => p.lookup_value('NightLightActive', null) && this._syncNightLight(), this);
    }

    _syncNightLight() {
        if(LightProxy.NightLightActive === null) return;
        this.murkey = ['night_light', LightProxy.NightLightActive];
    }

    set murkey([k, v, out]) {
        this[k] = out ? out(v) : v;
        let dark = (this.style === Style.Auto && this.night_light) ||
            (this.style === Style.System && this.scheme) || this.style === Style.Dark;
        if(dark === this._dark) return;
        this._dark = dark;
        this._queueRepaint(true);
        this._menus?.sketch.setList(this.getSketches());
        this._menus?.sketch.setSelected(this.sketch);
    }

    set redraw([k, v, out]) { // out <- [cond, pre, post];
        this[k] = v;
        if(out?.[0]?.(v)) return;
        out?.[1]?.(v);
        this._queueRepaint();
        out?.[2]?.(v);
    }

    set systray(systray) {
        if(systray) {
            if(this._button) return;
            this._button = new PanelMenu.Button(0.5, Me.metadata.uuid);
            this._button.menu.actor.add_style_class_name('app-menu');
            this._button.add_actor(new St.Icon({ gicon: genIcon('florette-symbolic'), style_class: 'shuzhi-systray system-status-icon' }));
            Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 0, 'right');
            this._addMenuItems();
        } else {
            if(!this._button) return;
            this._button.destroy();
            this._menus = this._button = null;
        }
    }

    get sketch() {
        return this._dark ? this.dsketch : this.lsketch;
    }

    set sketch(sketch) {
        this._field.set(this._dark ? 'dsketch' : 'lsketch', sketch);
    }

    set refresh(refresh) {
        clearInterval(this._refreshId);
        if(refresh) this._refreshId = setInterval(() => this._setMotto(true), this._interval * 60000);
    }

    set interval(interval) {
        this._interval = interval;
        this.refresh = true;
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
        return Object.keys(this._dark ? DSketch : LSketch).map(x => _(x));
    }

    getPath() {
        let file = `/shuzhi-${this._dark ? 'dark.svg' : 'light.svg'}`;
        return (this.folder || GLib.get_user_cache_dir()) + file;
    }

    async _execute(cmd) {
        let proc = new Gio.Subprocess({
            argv: GLib.shell_parse_argv(cmd)[1],
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });
        proc.init(null);
        let [stdout, stderr] = await proc.communicate_utf8_async(null, null);
        if(proc.get_exit_status()) throw new Error(stderr.trim());
        return stdout.replace(/\n*$/, '');
    }

    async _checkCmd(cmd) {
        let chk = `sh -c "command -v ${cmd}"`;
        let proc = new Gio.Subprocess({
            argv: GLib.shell_parse_argv(chk)[1],
            flags: Gio.SubprocessFlags.NONE,
        });
        proc.init(null);
        await proc.communicate_utf8_async(null, null);
        return proc.get_successful();
    }

    async _genMotto() {
        let [cmd] = GLib.shell_parse_argv(this._command)[1];
        if(await this._checkCmd(cmd)) return this._execute(this._command);
        else if(cmd === 'shuzhi.sh') return this._execute(`bash ${Me.dir.get_child('shuzhi.sh').get_path()}`);
        else throw new Error('command not found');
    }

    _checkImg() {
        let path = this.getPath();
        return this._style === Style.System
            ? (path.endsWith('dark.svg') ? this.dpic : this.lpic).endsWith(path)
            : this.lpic.endsWith(path) && this.dpic.endsWith(path);
    }

    _setMotto(paint) {
        this._genMotto().then(scc => (this.motto = scc)).catch(() => (this.motto = '')).finally(() => {
            if(this._mlock) {
                this._queueRepaint(paint);
            } else {
                this._mlock = true; // skip when unlocking screen
                if(!this._checkImg()) this._queueRepaint(true);
            }
        });
    }

    _queueRepaint(paint) {
        if(!['_motto', 'night_light'].every(x => x in this)) return;
        if(paint) this._pts.length = 0;
        try {
            this.repaint();
        } catch(e) {
            logError(e);
        }
    }

    _copyMotto() {
        let mt = this.orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext;
        mt = mt ? em2pg(mt.replace(/SZ_BGCOLOR/g, '#fff'), 16) : this._motto.logo || '';
        let [ok, , text] = Pango.parse_markup(mt, -1, '');
        if(ok && text) St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
    }

    _addMenuItems() {
        this._menus = {
            refresh: new MenuSection([
                [_('Motto'),  () => this._setMotto(false)],
                [_('Sketch'), () => this._queueRepaint(true)],
                [_('Both'),   () => this._setMotto(true)],
            ], _('Refresh')),
            sep0:   new PopupMenu.PopupSeparatorMenuItem(),
            copy:   new MenuItem(_('Copy'), () => this._copyMotto()),
            reset:  new MenuItem(_('Reset'), () => { this.desktop = false; }),
            sep1:   new PopupMenu.PopupSeparatorMenuItem(),
            sketch: new DRadioItem(_('Sketch'), this.getSketches(), this.sketch, x => (this.sketch = x)),
            sep2:   new PopupMenu.PopupSeparatorMenuItem(),
            prefs:  new MenuItem(_('Settings'), () => ExtensionUtils.openPrefs()),
        };
        for(let p in this._menus) this._button.menu.addMenuItem(this._menus[p]);
    }

    set desktop(image) {
        if(image) {
            if(this._style === Style.System) {
                if(image.endsWith('dark.svg')) !this.dpic.endsWith(image) && this.setf('dpic', image, 'd');
                else !this.lpic.endsWith(image) && this.setf('lpic', image, 'd');
            } else {
                !this.lpic.endsWith(image) && this.setf('lpic', image, 'd');
                !this.dpic.endsWith(image) && this.setf('dpic', image, 'd');
            }
        } else {
            let vs = Object.values(this._dfield.prop);
            vs.forEach(([v]) => this._dfield.gset.reset(v));
        }
    }

    repaint() {
        let path = this.getPath(),
            { width: x, height: y } = Main.layoutManager.monitors.reduce((p, v) => p.height * p.width > v.height * v.width ? p : v),
            sf = new Cairo.SVGSurface(path, x, y),
            cr = new Cairo.Context(sf);
        Draw.setDarkBg(this._dark);
        let mtt = this.orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext,
            size = Pango.FontDescription.from_string(this.font).get_size() / 1024,
            motto = mtt ? Draw.genMotto(cr, x, y, em2pg(mtt, size), this.orient) : Draw.genLogo(this._motto.logo, x, y);
        Draw.drawBackground(cr);
        this._drawSketch(cr, x, y);
        mtt ? Draw.drawMotto(cr, motto) : Draw.drawLogo(cr, motto);
        cr.$dispose();
        sf.finish();
        sf.flush();
        this.desktop = path;
        if(this.backups > 0) this._backup(path).catch(noop);
    }

    async _backup(path) {
        let pics = [],
            dir = GLib.path_get_dirname(path),
            name = GLib.path_get_basename(path).replace(/\..+$/, '');
        await fl(path).copy_async(fl(dir, `${name}-${new Date().toLocaleFormat('%FT%T')}.svg`), Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, null, null);
        for await (let f of await fl(dir).enumerate_children_async(Gio.FILE_ATTRIBUTE_STANDARD_NAME, Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, null).catch(noop) ?? []) pics.push(f);
        pics = pics.flatMap(x => isBakOf(x.get_name(), name) ? [x] : []).slice(0, -this.backups - 1);
        Promise.all(pics.forEach(x => x.delete_async(GLib.PRIORITY_DEFAULT, null))).catch(noop);
    }

    _drawSketch(context, x, y) {
        switch(this.sketch) {
        case DSketch.Waves:
            if(!this._pts.length) this._pts = Draw.genWaves(x, y);
            Draw.drawWaves(context, this._pts, this.showcolor);
            break;
        case DSketch.Blobs:
            if(!this._pts.length) this._pts = Draw.genBlobs(x, y);
            Draw.drawBlobs(context, this._pts);
            break;
        case DSketch.Ovals:
            if(!this._pts.length) this._pts = Draw.genOvals(x, y);
            Draw.drawOvals(context, this._pts);
            break;
        case DSketch.Clouds:
        case LSketch.Trees:
            if(this._dark) {
                if(!this._pts.length) this._pts = Draw.genClouds(x, y);
                Draw.drawClouds(context, this._pts);
            } else {
                if(!this._pts.length) this._pts = Draw.genTrees(x, y);
                Draw.drawTrees(context, this._pts);
            }
            break;
        }
    }

    destroy() {
        ['_field', '_dfield', '_tfield'].forEach(x => this[x].detach(this));
        LightProxy.disconnectObject(this);
        this.systray = this.refresh = null;
    }
}

class Extension {
    constructor() {
        ExtensionUtils.initTranslations();
    }

    enable() {
        this._ext = new ShuZhi();
    }

    disable() {
        this._ext.destroy();
        this._ext = null;
    }
}

function init() {
    return new Extension();
}
