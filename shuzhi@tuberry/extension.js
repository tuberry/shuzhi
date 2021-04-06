// vim:fdm=syntax
// by: tuberry@github
'use strict';

const Cairo = imports.cairo;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, GObject, Gio, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const gsettings = ExtensionUtils.getSettings();
const Me = ExtensionUtils.getCurrentExtension();
const Fields = Me.imports.fields.Fields;
const Draw = Me.imports.draw;

const dgsettings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });
const ngsettings = new Gio.Settings({ schema: 'org.gnome.settings-daemon.plugins.color' });
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;
const getIcon = x => Me.dir.get_child('icons').get_child(x + '-symbolic.svg').get_path();

const System = {
    PICTURE:     'picture-uri',
    PRIMARY:     'primary-color',
    LIGHT:       'night-light-enabled',
    PROPERTY:    'g-properties-changed',
    BUS_NAME:    'org.gnome.SettingsDaemon.Color',
    OBJECT_PATH: '/org/gnome/SettingsDaemon/Color',
};
const { loadInterfaceXML } = imports.misc.fileUtils;
const ColorInterface = loadInterfaceXML(System.BUS_NAME);
const ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface);

const Style = { Light: 0, Dark: 1, Auto: 2 };
const Orient = { Horizontal: 0, Vertical: 1 };
const Sketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3, };

const ShuZhi = GObject.registerClass({
    Properties: {
        'folder':    GObject.ParamSpec.string('folder', 'folder', 'folder', GObject.ParamFlags.READWRITE, ''),
        'style':     GObject.ParamSpec.uint('style', 'style', 'style', GObject.ParamFlags.READWRITE, 0, 2, 0),
        'night':     GObject.ParamSpec.boolean('night', 'night', 'night', GObject.ParamFlags.READWRITE, false),
        'command':   GObject.ParamSpec.string('command', 'command', 'command', GObject.ParamFlags.READWRITE, ''),
        'orient':    GObject.ParamSpec.uint('orient', 'orient', 'orient', GObject.ParamFlags.READWRITE, 0, 1, 0),
        'dsketch':   GObject.ParamSpec.uint('dsketch', 'dsketch', 'dsketch', GObject.ParamFlags.READWRITE, 0, 3, 0),
        'lsketch':   GObject.ParamSpec.uint('lsketch', 'lsketch', 'lsketch', GObject.ParamFlags.READWRITE, 0, 2, 0),
        'refresh':   GObject.ParamSpec.boolean('refresh', 'refresh', 'refresh', GObject.ParamFlags.READWRITE, false),
        'systray':   GObject.ParamSpec.boolean('systray', 'systray', 'systray', GObject.ParamFlags.READWRITE, false),
        'interval':  GObject.ParamSpec.uint('interval', 'interval', 'interval', GObject.ParamFlags.READWRITE, 10, 300, 60),
        'fontname':  GObject.ParamSpec.string('fontname', 'fontname', 'font name', GObject.ParamFlags.READWRITE, 'Sans 48'),
        'showcolor': GObject.ParamSpec.boolean('showcolor', 'showcolor', 'show color', GObject.ParamFlags.READWRITE, false),
    },
}, class ShuZhi extends GObject.Object {
    _init() {
        super._init();
        this._motto = '';
        this._points = [];
        this._interval = 30;
        this._inited = false;
        this._painted = false;

        this._bindSettings();
        this._buildWidgets();
    }

    _bindSettings() {
        gsettings.bind(Fields.FOLDER,   this, 'folder',    Gio.SettingsBindFlags.GET);
        ngsettings.bind(System.LIGHT,   this, 'night',     Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.STYLE,    this, 'style',     Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.DSKETCH,  this, 'dsketch',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.LSKETCH,  this, 'lsketch',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.COLOR,    this, 'showcolor', Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.INTERVAL, this, 'interval',  Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.FONT,     this, 'fontname',  Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.ORIENT,   this, 'orient',    Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.REFRESH,  this, 'refresh',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.SYSTRAY,  this, 'systray',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.COMMAND,  this, 'command',   Gio.SettingsBindFlags.GET);
    }

    _buildWidgets() {
        this._proxy = new ColorProxy(Gio.DBus.session, System.BUS_NAME, System.OBJECT_PATH, (proxy, error) => {
            if(!error) {
                this._onProxyChanged();
                this._proxy.connect(System.PROPERTY, this._onProxyChanged.bind(this));
            }
        });
    }

    set folder(folder) {
        this._folder = folder;
        this._queueRepaint();
    }

    set night(night) {
        let style = this.style;
        this._night = night;
        if(style == this.style) return;
        this._queueRepaint(true);
        this._updateMenu();
    }

    set orient(orient) {
        this._orient = orient;
        this._queueRepaint();
    }

    set showcolor(show) {
        this._showcolor = show;
        if(this.sketch == Sketch.Waves) this._queueRepaint();
    }

    set fontname(name) {
        this._fontname = name;
        this._queueRepaint();
    }

    set systray(systray) {
        if(systray) {
            if(this._button) return;
            this._button = new PanelMenu.Button(0.0, null, false);
            this._button.add_actor(new St.Icon({
                gicon: new Gio.FileIcon({ file: Gio.File.new_for_path(getIcon('florette')) }),
                style_class: 'shuzhi-systray system-status-icon',
            }));
            Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 0, 'right');
            this._updateMenu();
        } else {
            if(!this._button) return;
            this._button.destroy();
            delete this._button;
        }
    }

    set lsketch(sketch) {
        this._lsketch = sketch;
        if(this.style) return;
        this._queueRepaint(true);
        this._updateMenu();
    }

    set dsketch(sketch) {
        this._dsketch = sketch;
        if(!this.style) return;
        this._queueRepaint(true);
        this._updateMenu();
    }

    get sketch() {
        return this.style ? this._dsketch : this._lsketch;
    }

    set sketch(sketch) {
        gsettings.set_uint(this.style ? Fields.DSKETCH : Fields.LSKETCH, sketch);
    }

    set style(syl) {
        let style = this.style;
        this._style = syl;
        if(style == this.style) return;
        this._queueRepaint(true);
        this._updateMenu();
    }

    get style() {
        return this._style == Style.Auto ? this._night && this._light : this._style == Style.Dark;
    }

    get path() {
        let file = '/shuzhi-' + (this.style ? 'dark.png' : 'light.png');
        let dir = this._folder ? this._folder : GLib.get_user_cache_dir();
        return dir + file;
    }

    set refresh(refresh) {
        if(this._refreshId) GLib.source_remove(this._refreshId), this._refreshId = 0;
        if(!refresh) return;
        this._refreshId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._interval * 60, this._refreshBoth.bind(this));
    }

    set interval(interval) {
        this._interval = interval;
        this.refresh = true;
    }

    set command(command) {
        this._command = command;
        if(this._inited) {
            this.getMotto(false);
        } else {
            this._execute(this._command)
                .then(scc => { this._motto = scc; })
                .catch(() => { this._motto = ''; })
                .finally(() => {
                    this._inited = true;
                    let path = this.path;
                    let pic = Gio.File.new_for_path(path);
                    if(pic.query_exists(null) && dgsettings.get_string(System.PICTURE).includes(path)) return;
                    this._queueRepaint();
                });
        }
    }

    getMotto(paint) {
        this._execute(this._command)
            .then(scc => { this._motto = scc; })
            .catch(() => { this._motto = ''; })
            .finally(() => { this._queueRepaint(paint); });
    }

    _refreshBoth() {
        this.getMotto(true);

        return GLib.SOURCE_CONTINUE;
    }

    _refreshMotto() {
        this.getMotto(false);
    }

    _refreshSketch() {
        this._queueRepaint(true);
    }

    _queueRepaint(paint) {
        if(!this._inited) return;
        if(paint) this._painted = false;
        this.repaint();
    }

    _updateMenu() {
        if(!this._button) return;
        this._button.menu.removeAll();
        this._button.menu.addMenuItem(this._copyItem());
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._button.menu.addMenuItem(this._refreshMenu());
        this._button.menu.addMenuItem(this._sketchMenu());
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._button.menu.addMenuItem(this._settingItem());
    }

    _copyItem() {
        let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
        item.connect('activate', () => {
            let [ok, attr, text] = Pango.parse_markup(this._motto, -1, '');
            if(!ok) return;
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
        });
        item.add_child(new St.Label({ x_expand: true, text: _('Copy'), }));

        return item;
    }

    _refreshMenu() {
        let refresh = new PopupMenu.PopupSubMenuMenuItem(_('Refresh'));
        let motto = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
        motto.connect('activate', this._refreshMotto.bind(this));
        motto.add_child(new St.Label({ x_expand: true, text: _('Motto'), }));
        let sketch = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
        sketch.connect('activate', this._refreshSketch.bind(this));
        sketch.add_child(new St.Label({ x_expand: true, text: _('Sketch'), }));
        let both = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
        both.connect('activate', this._refreshBoth.bind(this));
        both.add_child(new St.Label({ x_expand: true, text: _('Both'), }));
        [both, motto, sketch].forEach(x => { refresh.menu.addMenuItem(x); });

        return refresh;
    }

    _sketchMenu() {
        let keys = Object.keys(Sketch);
        if(!this.style) keys.pop(); // exclude `clouds` in light style
        let sketch = new PopupMenu.PopupSubMenuMenuItem(_('Sketch: ') + _(keys[this.sketch]));
        keys.map(x => {
            let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
            item.setOrnament(this.sketch == Sketch[x] ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            item.connect('activate', () => { item._getTopMenu().close(); this.sketch = Sketch[x]; });
            item.add_child(new St.Label({ x_expand: true, text: _(x), }));
            return item;
        }).forEach(x => { sketch.menu.addMenuItem(x) });

        return sketch;
    }

    _settingItem() {
        let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
        item.connect('activate', () => { ExtensionUtils.openPrefs(); });
        item.add_child(new St.Label({ x_expand: true, text: _('Settings'), }));

        return item;
    }

    set desktop(image) {
        if(image) {
            let color = this.style ? '#242424' : '#E6E6E6';
            if(dgsettings.get_string(System.PRIMARY) != color) dgsettings.set_string(System.PRIMARY, color);
            dgsettings.set_string(System.PICTURE, 'file://' + image);
        } else {
            dgsettings.reset(System.PICTURE);
            dgsettings.reset(System.PRIMARY);
        }
    }

    _onProxyChanged() {
        let style = this.style;
        this._light = this._proxy.NightLightActive;
        if(style == this.style) return;
        this._queueRepaint(true);
        this._updateMenu();
    }

    repaint() {
        let [x, y] = global.display.get_size();
        let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, x, y);
        let context = new Cairo.Context(surface);
        if(!this._painted) this._points = [];
        let text = Draw.genMotto(context, x, y, this._fontname, this._motto, this._orient);
        Draw.drawBackground(context, x, y, this.style);
        switch(this.sketch) {
        case Sketch.Waves:
            if(!this._points.length) this._points = Draw.genWaves(x, y);
            Draw.drawWaves(context, this._points, this._showcolor);
            break;
        case Sketch.Blobs:
            if(!this._points.length) this._points = Draw.genBlobs(x, y);
            Draw.drawBlobs(context, this._points);
            break;
        case Sketch.Ovals:
            if(!this._points.length) this._points = Draw.genOvals(x, y);
            Draw.drawOvals(context, this._points);
            break;
        case Sketch.Clouds:
            if(!this._points.length) this._points = Draw.genClouds(x, y);
            Draw.drawClouds(context, this._points);
            break;
        default:
            return;
        }
        Draw.drawMotto(context, text); // draw text on the top
        let path = this.path;
        surface.writeToPNG(path);
        this.desktop = path;

        this._painted = true;
    }

    _execute(cmd) {
        return new Promise((resolve, reject) => {
            try {
                let [, command] = GLib.shell_parse_argv(cmd);
                let proc = new Gio.Subprocess({
                    argv: command,
                    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
                });
                proc.init(null);
                proc.communicate_utf8_async(null, null, (proc, res) => {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    proc.get_exit_status() ? reject(stderr.trim()) : resolve(stdout.trim());
                });
            } catch(e) {
                reject(e.message);
            }
        });
    }

    destroy() {
        // this.desktop = false;
        this.systray = false;
        this.refresh = false;
        delete this._proxy;
        delete this._points;
    }
});

const Extension = class Extension {
    constructor() {
        ExtensionUtils.initTranslations();
    }

    enable() {
        this._ext = new ShuZhi();
    }

    disable() {
        this._ext.destroy();
        delete this._ext;
    }
}

function init() {
    return new Extension();
}

