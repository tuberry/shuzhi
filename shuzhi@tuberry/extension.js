// vim:fdm=syntax
// by tuberry
'use strict';

const Cairo = imports.cairo;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, GObject, Gio, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const gsettings = ExtensionUtils.getSettings();
const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();
const Fields = Me.imports.fields.Fields;
const Draw = Me.imports.draw;

const dgsettings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });
const ngsettings = new Gio.Settings({ schema: 'org.gnome.settings-daemon.plugins.color' });
const FLORETTE_ICON = Me.dir.get_child('icons').get_child('florette-symbolic.svg').get_path();

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
const LSketch = { Waves: 0, Ovals: 1, Blobs: 2, Trees: 3 };
const DSketch = { Waves: 0, Ovals: 1, Blobs: 2, Clouds: 3 };

Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async', 'communicate_utf8_finish');

const ShuZhi = GObject.registerClass({
    Properties: {
        'folder':    GObject.ParamSpec.string('folder', 'folder', 'folder', GObject.ParamFlags.READWRITE, ''),
        'style':     GObject.ParamSpec.uint('style', 'style', 'style', GObject.ParamFlags.READWRITE, 0, 2, 0),
        'night':     GObject.ParamSpec.boolean('night', 'night', 'night', GObject.ParamFlags.READWRITE, false),
        'command':   GObject.ParamSpec.string('command', 'command', 'command', GObject.ParamFlags.READWRITE, ''),
        'orient':    GObject.ParamSpec.uint('orient', 'orient', 'orient', GObject.ParamFlags.READWRITE, 0, 1, 0),
        'dsketch':   GObject.ParamSpec.uint('dsketch', 'dsketch', 'dsketch', GObject.ParamFlags.READWRITE, 0, 3, 0),
        'lsketch':   GObject.ParamSpec.uint('lsketch', 'lsketch', 'lsketch', GObject.ParamFlags.READWRITE, 0, 3, 0),
        'display':   GObject.ParamSpec.boolean('display', 'display', 'display', GObject.ParamFlags.READWRITE, false),
        'refresh':   GObject.ParamSpec.boolean('refresh', 'refresh', 'refresh', GObject.ParamFlags.READWRITE, false),
        'systray':   GObject.ParamSpec.boolean('systray', 'systray', 'systray', GObject.ParamFlags.READWRITE, false),
        'interval':  GObject.ParamSpec.uint('interval', 'interval', 'interval', GObject.ParamFlags.READWRITE, 10, 300, 60),
        'fontname':  GObject.ParamSpec.string('fontname', 'fontname', 'font name', GObject.ParamFlags.READWRITE, 'Sans 48'),
        'showcolor': GObject.ParamSpec.boolean('showcolor', 'showcolor', 'show color', GObject.ParamFlags.READWRITE, false),
        'xdisplay':  GObject.ParamSpec.uint('xdisplay', 'xdisplay', 'xdisplay', GObject.ParamFlags.READWRITE, 800, 9600, 1920),
        'ydisplay':  GObject.ParamSpec.uint('ydisplay', 'ydisplay', 'ydisplay', GObject.ParamFlags.READWRITE, 600, 5400, 1080),
    },
}, class ShuZhi extends GObject.Object {
    _init() {
        super._init();

        this._buildWidgets();
        this._bindSettings();
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
        gsettings.bind(Fields.DISPLAY,  this, 'display',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.XDISPLAY, this, 'xdisplay',  Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.YDISPLAY, this, 'ydisplay',  Gio.SettingsBindFlags.GET);
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
        if(this._motto !== undefined) this.setMotto(false);
    }

    set showcolor(show) {
        this._showcolor = show;
        if(this.sketch == LSketch.Waves) this._queueRepaint();
    }

    set fontname(name) {
        this._fontname = name;
        Draw.setFontName(this._fontname);
        this._queueRepaint();
    }

    set systray(systray) {
        if(systray) {
            if(this._button) return;
            this._button = new PanelMenu.Button(null, Me.metadata.uuid);
            this._button.add_actor(new St.Icon({
                gicon: new Gio.FileIcon({ file: Gio.File.new_for_path(FLORETTE_ICON) }),
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

    set display(display) {
        this._display = display;
        this._queueRepaint(true);
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

        return (this._folder || GLib.get_user_cache_dir()) + file;
    }

    set refresh(refresh) {
        if(this._refreshId) GLib.source_remove(this._refreshId), delete this._refreshId;
        if(!refresh) return;
        this._refreshId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, this._interval * 60, this._refreshBoth.bind(this));
    }

    set interval(interval) {
        this._interval = interval;
        this.refresh = true;
    }

    set command(command) {
        if(this._command && this._command.replace(/ -*/g, '') == command.replace(/ -*/g, '')) return;
        this._command = command;
        this.setMotto(false, this._motto === undefined ? () => !this.checkFile && this._queueRepaint() : null);
    }

    get checkFile() { // Ensure the wallpaper consistent when unlocking and locking the screen
        let path = this.path;
        let pic = Gio.File.new_for_path(path);
        return pic.query_exists(null) && dgsettings.get_string(System.PICTURE).includes(path);
    }

    _onProxyChanged() {
        this._light = this._proxy.NightLightActive;
        this._updateMenu();
        if(this.checkFile) return;
        this._queueRepaint(true);
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

    async _check(cmd) {
        let chk = 'sh -c "command -v %s"'.format(cmd);
        let proc = new Gio.Subprocess({
            argv: GLib.shell_parse_argv(chk)[1],
            flags: Gio.SubprocessFlags.NONE
        });
        proc.init(null);
        await proc.communicate_utf8_async(null, null);

        return proc.get_successful();
    }

    async getMotto() {
        let [cmd] = GLib.shell_parse_argv(this._command)[1];
        if(await this._check(cmd)) {
            return await this._execute(this._command)
        } else {
            if(cmd == 'shuzhi.sh') {
                return await this._execute('bash ' + Me.dir.get_child('shuzhi.sh').get_path());
            } else {
                throw new Error('command not found');
            }
        }
    }

    setMotto(paint, callback) {
        this.getMotto().then(scc => this._motto = scc).catch(err => this._motto = '')
            .finally(callback || (() => this._queueRepaint(paint)));
    }

    _refreshBoth() {
        this.setMotto(true);

        return GLib.SOURCE_CONTINUE;
    }

    _refreshMotto() {
        this.setMotto(false);
    }

    _refreshSketch() {
        this._queueRepaint(true);
    }

    _queueRepaint(paint) {
        if(this._motto === undefined) return;
        if(paint) this._painted = false;
        this.repaint();
    }

    _updateMenu() {
        if(!this._button) return;
        this._button.menu.removeAll();
        this._button.menu.addMenuItem(this._menuItemMaker(_('Copy'), () => {
            let [ok, attr, text] = Pango.parse_markup(this._motto.replace(/SZ_BGCOLOR/, '#ffffff'), -1, '');
            if(ok) St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
        }));
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._button.menu.addMenuItem(this._refreshMenu());
        this._button.menu.addMenuItem(this._sketchMenu());
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._button.menu.addMenuItem(this._menuItemMaker(_('Settings'), () => { ExtensionUtils.openPrefs(); }));
    }

    _refreshMenu() {
        let refresh = new PopupMenu.PopupSubMenuMenuItem(_('Refresh'));
        refresh.menu.addMenuItem(this._menuItemMaker(_('Motto'), this._refreshMotto.bind(this)));
        refresh.menu.addMenuItem(this._menuItemMaker(_('Sketch'), this._refreshSketch.bind(this)));
        refresh.menu.addMenuItem(this._menuItemMaker(_('Both'), this._refreshBoth.bind(this)));

        return refresh;
    }

    _sketchMenu() {
        let sketches = this.style ? DSketch : LSketch;
        let keys = Object.keys(sketches);
        let sketch = new PopupMenu.PopupSubMenuMenuItem(_('Sketch: ') + _(keys[this.sketch]));
        keys.map(x => {
            let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shuzhi-item popup-menu-item' });
            item.setOrnament(this.sketch == sketches[x] ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            item.connect('activate', item => { this._button.menu.close(); this.sketch = sketches[x]; });
            item.add_child(new St.Label({ x_expand: true, text: _(x), }));
            return item;
        }).forEach(x => { sketch.menu.addMenuItem(x) });

        return sketch;
    }

    _menuItemMaker(text, callback) {
        let item = new PopupMenu.PopupMenuItem(text, { style_class: 'shuzhi-item popup-menu-item' });
        item.connect('activate', callback);

        return item;
    }

    set desktop(image) {
        if(image) {
            let color = Draw.getBgColor();
            if(dgsettings.get_string(System.PRIMARY) != color) dgsettings.set_string(System.PRIMARY, color);
            if(!dgsettings.get_string(System.PICTURE).includes(image)) dgsettings.set_string(System.PICTURE, 'file://' + image);
        } else {
            dgsettings.reset(System.PICTURE);
            dgsettings.reset(System.PRIMARY);
        }
    }

    repaint() {
        let [x, y] = this._display ? [this.xdisplay, this.ydisplay] : global.display.get_size();
        let surface = new Cairo.ImageSurface(Cairo.Format.ARGB32, x, y);
        let context = new Cairo.Context(surface);
        if(!this._painted) this._points = [];
        Draw.setDarkBg(this.style);
        let isImage = !this._motto || this._motto.endsWith('.png') || this._motto.endsWith('.svg');
        let motto = isImage ? Draw.genLogo(this._motto, x, y) : Draw.genMotto(context, x, y, this._motto, this._orient);
        Draw.drawBackground(context, x, y);
        if(this.drawSketch(context, x, y)) return;
        let path = this.path;
        if(isImage) {
            let img = new Cairo.ImageSurface(Cairo.Format.ARGB32, x, y);
            let ctx = new Cairo.Context(img);
            ctx.setSourceSurface(surface, 0, 0), ctx.paint();
            if(motto) ctx.setSourceSurface(...motto), ctx.paint();
            img.writeToPNG(path);
        } else {
            Draw.drawMotto(context, motto); // draw text on the top
            surface.writeToPNG(path);
        }
        this.desktop = path;
        this._painted = true;
    }

    drawSketch(context, x, y) {
        switch(this.sketch) {
        case DSketch.Waves:
            if(!this._points.length) this._points = Draw.genWaves(x, y);
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
            if(this.style) {
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

