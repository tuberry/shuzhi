// vim:fdm=syntax
// by tuberry
/* exported init */
'use strict';

const Cairo = imports.cairo;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, GObject, Gio, Pango } = imports.gi;
const LightProxy = Main.panel.statusArea.aggregateMenu._nightLight._proxy;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const Draw = Me.imports.draw;
const { Fields } = Me.imports.fields;

const Style = { Light: 0, Dark: 1, Auto: 2, System: 3 };
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };
const Desktop = { LIGHT: 'picture-uri', COLOR: 'primary-color', DARK: 'picture-uri-dark' };
const noop = () => {};
const conv = (ft, sz) => ft.replace(/([0-9.]*)em/g, (mt, s1) => `${sz * s1}`);
const genIcon = x => Gio.Icon.new_for_string(Me.dir.get_child('icons').get_child(`${x}-symbolic.svg`).get_path());

Gio._promisify(Gio.File.prototype, 'copy_async');
Gio._promisify(Gio.File.prototype, 'delete_async');
Gio._promisify(Gio.File.prototype, 'query_info_async');
Gio._promisify(Gio.File.prototype, 'enumerate_children_async');
Gio._promisify(Gio.FileEnumerator.prototype, 'next_files_async');
Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');

async function backup(path, max) {
    if(max < 1) return;
    let infos, files = [];
    let dir = GLib.path_get_dirname(path);
    let name = GLib.path_get_basename(path).replace(/\..+$/, '');
    let fl = (...as) => Gio.File.new_for_path(GLib.build_filenamev(as));
    await fl(path).copy_async(fl(dir, `${name}-${new Date().toISOString()}.png`), Gio.FileCopyFlags.NONE, GLib.PRIORITY_DEFAULT, null, null);
    let denum = await fl(dir).enumerate_children_async(Gio.FILE_ATTRIBUTE_STANDARD_NAME, Gio.FileQueryInfoFlags.NONE, GLib.PRIORITY_DEFAULT, null);
    while((infos = await denum?.next_files_async(100, GLib.PRIORITY_DEFAULT, null))?.length) files.push(...infos);
    files = files.flatMap(x => x.get_name().startsWith(`${name}-`) ? [x.get_name()] : []).slice(max + 1);
    Promise.all(files.forEach(x => fl(dir, x).delete_async(GLib.PRIORITY_DEFAULT, null))).catch(noop);
}

class Field {
    constructor(prop, gset, obj) {
        this.gset = typeof gset === 'string' ? new Gio.Settings({ schema: gset }) : gset;
        this.prop = prop;
        this.bind(obj);
    }

    _get(x) {
        return this.gset[`get_${this.prop[x][1]}`](this.prop[x][0]);
    }

    _set(x, y) {
        this.gset[`set_${this.prop[x][1]}`](this.prop[x][0], y);
    }

    bind(a) {
        let fs = Object.entries(this.prop);
        fs.forEach(([x]) => { a[x] = this._get(x); });
        this.gset.connectObject(...fs.flatMap(([x, [y]]) => [`changed::${y}`, () => { a[x] = this._get(x); }]), a);
    }

    unbind(a) {
        this.gset.disconnectObject(a);
    }
}

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

class DRadioItem extends PopupMenu.PopupSubMenuMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(name, modes, index, callback) {
        super('');
        this._name = name;
        this._call = callback;
        this.setModes(modes);
        this.setSelected(index);
    }

    setSelected(index) {
        this._index = index;
        this.label.set_text(`${this._name}${_(this._list[this._index]) ?? ''}`);
        this._items.forEach((y, i) => y.setOrnament(index === i ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE));
    }

    setModes(modes) {
        let list = Object.keys(modes);
        let items = this._items;
        let diff = list.length - items.length;
        if(diff > 0) for(let a = 0; a < diff; a++) this.menu.addMenuItem(new MenuItem('', () => this._call(items.length + a)));
        else if(diff < 0) for(let a = 0; a > diff; a--) items.at(a - 1).destroy();
        this._list = list;
        this._items.forEach((x, i) => x.setLabel(_(this._list[i])));
    }

    updateModes(modes) {
        this.setModes(modes);
        this.setSelected(this._index);
    }

    get _items() {
        return this.menu._getMenuItems();
    }
}

class ShuZhi {
    constructor() {
        this._onProxyChanged();
        this._bindSettings();
    }

    _bindSettings() {
        this._dfield = new Field({
            dtcolor: [Desktop.COLOR, 'string'],
            dtdark:  [Desktop.DARK,  'string'],
            dtlight: [Desktop.LIGHT, 'string'],
        }, 'org.gnome.desktop.background', this);
        LightProxy.connectObject('g-properties-changed', this._onProxyChanged.bind(this), this);
        this._tfield = new Field({
            scheme: ['color-scheme', 'string'],
        }, 'org.gnome.desktop.interface', this);
        this._nfield = new Field({
            night: ['night-light-enabled', 'boolean'],
        }, 'org.gnome.settings-daemon.plugins.color', this);
        this._field = new Field({
            folder:    [Fields.FOLDER,   'string'],
            style:     [Fields.STYLE,    'uint'],
            dsketch:   [Fields.DSKETCH,  'uint'],
            lsketch:   [Fields.LSKETCH,  'uint'],
            showcolor: [Fields.COLOR,    'boolean'],
            interval:  [Fields.INTERVAL, 'uint'],
            backups:   [Fields.BACKUPS,  'uint'],
            fontname:  [Fields.FONT,     'string'],
            orient:    [Fields.ORIENT,   'uint'],
            refresh:   [Fields.REFRESH,  'boolean'],
            display:   [Fields.DISPLAY,  'boolean'],
            xdisplay:  [Fields.XDISPLAY, 'uint'],
            ydisplay:  [Fields.YDISPLAY, 'uint'],
            systray:   [Fields.SYSTRAY,  'boolean'],
            command:   [Fields.COMMAND,  'string'],
        }, ExtensionUtils.getSettings(), this);
    }

    _styleChanged(prop) {
        let dark = this.dark;
        Object.assign(this, prop);
        if(dark === this.dark) return;
        this._queueRepaint(true);
        this._menus?.sketch.updateModes(this.sketches);
    }

    _onProxyChanged() {
        this._styleChanged({ _light: LightProxy.NightLightActive });
    }

    set style(style) {
        this._styleChanged({ _style: style });
    }

    set scheme(scheme) {
        this._styleChanged({ _scheme: scheme === 'prefer-dark' });
    }

    set folder(folder) {
        this._folder = folder;
        this._queueRepaint();
    }

    set night(night) {
        this._styleChanged({ _night: night });
    }

    set orient(orient) {
        this._orient = orient;
        this._queueRepaint(false);
    }

    set showcolor(show) {
        this._showcolor = show;
        if(this.sketch === LSketch.Waves) this._queueRepaint();
    }

    set fontname(name) {
        this._fontname = name;
        Draw.setFontName(this._fontname);
        this._queueRepaint();
    }

    set systray(systray) {
        if(systray) {
            if(this._button) return;
            this._button = new PanelMenu.Button(0.5, Me.metadata.uuid);
            this._button.menu.actor.add_style_class_name('app-menu');
            this._button.add_actor(new St.Icon({ gicon: genIcon('florette'), style_class: 'shuzhi-systray system-status-icon' }));
            Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 0, 'right');
            this._addMenuItems();
        } else {
            if(!this._button) return;
            this._button.destroy();
            this._menus = this._button = null;
        }
    }

    set display(display) {
        this._display = display;
        this._queueRepaint(true);
    }

    set lsketch(sketch) {
        this._lsketch = sketch;
        if(this.dark) return;
        this._queueRepaint(true);
        this._menus?.sketch.setSelected(sketch);
    }

    set dsketch(sketch) {
        this._dsketch = sketch;
        if(!this.dark) return;
        this._queueRepaint(true);
        this._menus?.sketch.setSelected(sketch);
    }

    get sketch() {
        return this.dark ? this._dsketch : this._lsketch;
    }

    get sketches() {
        return this.dark ? DSketch : LSketch;
    }

    set sketch(sketch) {
        this._field._set(this.dark ? 'dsketch' : 'lsketch', sketch);
    }

    get dark() {
        return (this._style === Style.Auto && this._night && this._light) ||
            (this._style === Style.System && this._scheme) || this._style === Style.Dark;
    }

    get path() {
        let file = `/shuzhi-${this.dark ? 'dark.png' : 'light.png'}`;

        return (this._folder || GLib.get_user_cache_dir()) + file;
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
            this._motto = !motto || motto.endsWith('.png') || motto.endsWith('.svg') ? { logo: motto || '' } : { vtext: motto, htext: motto };
        }
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

    async _getMotto() {
        let [cmd] = GLib.shell_parse_argv(this._command)[1];
        if(await this._checkCmd(cmd)) return this._execute(this._command);
        else if(cmd === 'shuzhi.sh') return this._execute(`bash ${Me.dir.get_child('shuzhi.sh').get_path()}`);
        else throw new Error('command not found');
    }

    get _checkImage() {
        let path = this.path;
        return this._style === Style.System
            ? (path.endsWith('dark.png') ? this.dtdark : this.dtlight).endsWith(path)
            : this.dtlight.endsWith(path) && this.dtdark.endsWith(path);
    }

    _setMotto(paint) {
        if('_motto' in this) {
            this._getMotto().then(scc => (this.motto = scc)).catch(() => (this.motto = ''))
                .finally(() => this._queueRepaint(paint));
        } else {
            this._getMotto().then(scc => (this.motto = scc)).catch(() => (this.motto = ''))
                .finally(() => this._checkImage || this._queueRepaint(true));
        }
    }

    _queueRepaint(paint) {
        if(!['_motto', '_style', '_light', '_scheme', '_night'].every(x => x in this)) return;
        if(paint) this._painted = false;
        this.repaint();
    }

    _copyMotto() {
        let mtt = this._orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext;
        mtt = mtt ? conv(mtt.replace(/SZ_BGCOLOR/g, '#fff'), 16) : this._motto.logo || '';
        let [ok, , text] = Pango.parse_markup(mtt, -1, '');
        if(ok && text) St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
    }

    _addMenuItems() {
        this._menus = {
            copy:     new MenuItem(_('Copy'), this._copyMotto.bind(this)),
            sep1:     new PopupMenu.PopupSeparatorMenuItem(),
            refresh:  new PopupMenu.PopupSubMenuMenuItem(_('Refresh')),
            sketch:   new DRadioItem(_('Sketch: '), this.sketches, this.sketch, x => (this.sketch = x)),
            sep2:     new PopupMenu.PopupSeparatorMenuItem(),
            settings: new MenuItem(_('Settings'), () => ExtensionUtils.openPrefs()),
        };
        [
            [_('Motto'),  () => this._setMotto(false)],
            [_('Sketch'), () => this._queueRepaint(true)],
            [_('Both'),   () => this._setMotto(true)],
        ].forEach(xs => this._menus.refresh.menu.addMenuItem(new MenuItem(...xs)));
        for(let p in this._menus) this._button.menu.addMenuItem(this._menus[p]);
    }

    set desktop(image) {
        if(image) {
            let color = Draw.getBgColor();
            if(this.dtcolor !== color) this._dfield._set('dtcolor', color);
            if(this._style === Style.System) {
                if(image.endsWith('dark.png')) !this.dtdark.endsWith(image) && this._dfield._set('dtdark', image);
                else !this.dtlight.endsWith(image) && this._dfield._set('dtlight', image);
            } else {
                !this.dtlight.endsWith(image) && this._dfield._set('dtlight', image);
                !this.dtdark.endsWith(image) && this._dfield._set('dtdark', image);
            }
        } else {
            let vs = Object.values(this._dfield.prop);
            vs.forEach(([v]) => this._dfield.gset.reset(v));
        }
    }

    repaint() {
        let [x, y] = this._display ? [this.xdisplay, this.ydisplay] : global.display.get_size();
        let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, x, y);
        let context = new Cairo.Context(surface);
        if(!this._painted) this._points = [];
        Draw.setDarkBg(this.dark);
        let mtt = this._orient ? this._motto.vtext || this._motto.htext : this._motto.htext || this._motto.vtext;
        let size = Pango.FontDescription.from_string(this._fontname).get_size() / 1024;
        let motto = mtt ? Draw.genMotto(context, x, y, conv(mtt, size), this._orient) : Draw.genLogo(this._motto.logo, x, y);
        Draw.drawBackground(context, x, y);
        if(this._drawSketch(context, x, y)) return;
        mtt ? Draw.drawMotto(context, motto) : Draw.drawLogo(context, motto);
        let path = this.path;
        surface.writeToPNG(path);
        this.desktop = path;
        this._painted = true;
        backup(path, this.backups).catch(noop);
    }

    _drawSketch(context, x, y) {
        switch(this.sketch) {
        case DSketch.Waves:
            if(!this._points?.length) this._points = Draw.genWaves(x, y);
            Draw.drawWaves(context, this._points, this._showcolor);
            break;
        case DSketch.Blobs:
            if(!this._points.length) this._points = Draw.genBlobs(x, y);
            Draw.drawBlobs(context, this._points);
            break;
        case DSketch.Ovals:
            if(!this._points.length) this._points = Draw.genOvals(x, y);
            Draw.drawOvals(context, this._points);
            break;
        case DSketch.Clouds:
        case LSketch.Trees:
            if(this.dark) {
                if(!this._points.length) this._points = Draw.genClouds(x, y);
                Draw.drawClouds(context, this._points);
            } else {
                if(!this._points.length) this._points = Draw.genTrees(x, y);
                Draw.drawTrees(context, this._points);
            }
            break;
        default: return true;
        }

        return false;
    }

    destroy() {
        ['_field', '_dfield', '_tfield', '_nfield'].forEach(x => this[x].unbind(this));
        LightProxy.disconnectObject(this);
        this.systray = this.refresh = this._points = null;
        // this.desktop = false;
    }
}

class Extension {
    static {
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
