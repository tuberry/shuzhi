// vim:fdm=syntax
// by tuberry
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { GLib, St, GObject, Gio, Pango } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const gsettings = ExtensionUtils.getSettings();
const Me = ExtensionUtils.getCurrentExtension();
const Fields = Me.imports.prefs.Fields;
const Draw = Me.imports.draw;

const dgsettings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });
const ngsettings = new Gio.Settings({ schema: 'org.gnome.settings-daemon.plugins.color' });
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;
const getIcon = x => Me.dir.get_child('icons').get_child(x + '-symbolic.svg').get_path();

const System = {
    NONE:        0,
    COLOR:       'primary-color',
    PICTURE:     'picture-options',
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
        'style':     GObject.param_spec_uint('style', 'style', 'style', 0, 2, 0, GObject.ParamFlags.READWRITE),
        'night':     GObject.param_spec_boolean('night', 'night', 'night', false, GObject.ParamFlags.READWRITE),
        'command':   GObject.param_spec_string('command', 'command', 'command', '', GObject.ParamFlags.READWRITE),
        'orient':    GObject.param_spec_uint('orient', 'orient', 'orient', 0, 1, 0, GObject.ParamFlags.READWRITE),
        'dsketch':   GObject.param_spec_uint('dsketch', 'dsketch', 'dsketch', 0, 3, 0, GObject.ParamFlags.READWRITE),
        'lsketch':   GObject.param_spec_uint('lsketch', 'lsketch', 'lsketch', 0, 2, 0, GObject.ParamFlags.READWRITE),
        'refresh':   GObject.param_spec_boolean('refresh', 'refresh', 'refresh', false, GObject.ParamFlags.READWRITE),
        'systray':   GObject.param_spec_boolean('systray', 'systray', 'systray', false, GObject.ParamFlags.READWRITE),
        'interval':  GObject.param_spec_uint('interval', 'interval', 'interval', 10, 300, 60, GObject.ParamFlags.READWRITE),
        'fontname':  GObject.param_spec_string('fontname', 'fontname', 'font name', 'Sans 48', GObject.ParamFlags.READWRITE),
        'showcolor': GObject.param_spec_boolean('showcolor', 'showcolor', 'show color', false, GObject.ParamFlags.READWRITE),
    },
}, class ShuZhi extends GObject.Object {
    _init() {
        super._init();
        this._motto = '';
        this._points = [];
        this._interval = 30;
        this._painted = false;

        this._bindSettings();
        this._buildWidgets();
    }

    _bindSettings() {
        gsettings.bind(Fields.STYLE,    this, 'style',     Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.SYSTRAY,  this, 'systray',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.DSKETCH,  this, 'dsketch',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.LSKETCH,  this, 'lsketch',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.COLOR,    this, 'showcolor', Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.INTERVAL, this, 'interval',  Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.COMMAND,  this, 'command',   Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.FONT,     this, 'fontname',  Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.ORIENT,   this, 'orient',    Gio.SettingsBindFlags.GET);
        gsettings.bind(Fields.REFRESH,  this, 'refresh',   Gio.SettingsBindFlags.GET);
        ngsettings.bind(System.LIGHT,   this, 'night',     Gio.SettingsBindFlags.GET)
        this._proxy = new ColorProxy(Gio.DBus.session, System.BUS_NAME, System.OBJECT_PATH, (proxy, error) => {
            if(error) return;
            this._onProxyChanged();
            this._proxy.connect(System.PROPERTY, this._onProxyChanged.bind(this));
        });
    }

    _buildWidgets() {
        this._area = new St.DrawingArea({style_class: 'shu-zhi-area', reactive: false, });
        this._area.set_size(...global.display.get_size());
        this._area.connect('repaint', this._repaint.bind(this));
        Main.layoutManager._backgroundGroup.add_actor(this._area);
        this._area.queue_repaint();
    }

    set night(night) {
        this._night = night;
        this._queueRepaint();
    }

    set orient(orient) {
        this._orient = orient;
        this._queueRepaint();
    }

    set showcolor(show) {
        this._showcolor = show;
        if(this._sketch == Sketch.Waves) this._queueRepaint();
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
                style_class: 'shu-zhi-systray system-status-icon',
            }));
            Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 0, 'right');
        } else {
            if(!this._button) return;
            this._button.destroy();
            delete this._button;
        }
    }

    set lsketch(sketch) {
        if(this.style) return;
        this._sketch = sketch;
        this._points = [];
        this._queueRepaint();
        this._updateMenu();
    }

    set dsketch(sketch) {
        if(!this.style) return;
        this._sketch = sketch;
        this._points = [];
        this._queueRepaint();
        this._updateMenu();
    }

    set sketch(sketch) {
        gsettings.set_uint(this._style ? Fields.DSKETCH : Fields.LSKETCH, sketch);
    }

    set style(style) {
        this._style = style;
        this._queueRepaint();
        this._updateMenu();
    }

    get style() {
        return this._style == Style.Auto ? this._night && this._light : this._style == Style.Dark;
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
        this._execute(this._command).then(scc => { this._motto = scc; }).catch(() => { this._motto = ''; }).finally(() => { this._queueRepaint(); });
    }

    get motto() {
        return this._execute(this._command).then(scc => scc).catch(() => '');
    }

    async _refreshBoth() {
        this._painted = false;
        this._motto = await this.motto;
        this._queueRepaint();

        return GLib.SOURCE_CONTINUE;
    }

    async _refreshMotto() {
        this._motto = await this.motto;
        this._queueRepaint();
    }

    _refreshSketch() {
        this._painted = false;
        this._queueRepaint();
    }

    _updateMenu() {
        if(!this._button) return;
        this._button.menu.removeAll();
        this._button.menu.addMenuItem(this._copyItem());
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(_('Refresh')));
        this._refreshItems().forEach(x => this._button.menu.addMenuItem(x));
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(_('Styles')));
        this._sketchItems().forEach(x => this._button.menu.addMenuItem(x));
        this._button.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(_('More')));
        this._button.menu.addMenuItem(this._settingItem());
    }

    _copyItem() {
        let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
        item.connect('activate', () => {
            let [ok, attr, text] = Pango.parse_markup(this._motto, -1, '');
            if(!ok) return;
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, text);
        });
        item.add_child(new St.Label({ x_expand: true, text: _('Copy'), }));

        return item;
    }

    _refreshItems() {
        let motto = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
        motto.connect('activate', this._refreshMotto.bind(this));
        motto.add_child(new St.Label({ x_expand: true, text: _('Motto'), }));

        let sketch = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
        sketch.connect('activate', this._refreshSketch.bind(this));
        sketch.add_child(new St.Label({ x_expand: true, text: _('Sketch'), }));

        let both = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
        both.connect('activate', this._refreshBoth.bind(this));
        both.add_child(new St.Label({ x_expand: true, text: _('Both'), }));

        return [both, motto, sketch];
    }

    _queueRepaint() {
        if(!this._area) return;
        this._area.queue_repaint();
    }

    _sketchItems() {
        let keys = Object.keys(Sketch);
        if(!this.style) keys.pop(); // exclude `clouds` in light style

        return keys.map(x => {
            let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
            item.setOrnament(this._sketch == Sketch[x] ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE);
            item.connect('activate', () => { item._getTopMenu().close(); this.sketch = Sketch[x]; });
            item.add_child(new St.Label({ x_expand: true, text: _(x), }));
            return item;
        });
    }

    _settingItem() {
        let item = new PopupMenu.PopupBaseMenuItem({ style_class: 'shu-zhi-item' });
        item.connect('activate', () => { item._getTopMenu().close(); ExtensionUtils.openPrefs(); });
        item.add_child(new St.Label({ x_expand: true, text: _('Settings'), }));

       return item;
    }

    set desktop(color) {
        if(color) {
            dgsettings.set_string(System.COLOR, color);
            dgsettings.set_enum(System.PICTURE, System.NONE);
        } else {
            dgsettings.reset(System.COLOR);
            dgsettings.reset(System.PICTURE);
        }
    }

    _onProxyChanged() {
        this._light = this._proxy.NightLightActive;
        this._queueRepaint();
    }

    _repaint(area) {
        if(!area.visible) return;
        let cr = area.get_context();
        let [x, y] = area.get_surface_size();
        if(!this._painted) this._points = [];
        let text = Draw.genMotto(cr, x, y, this._fontname, this._motto, this._orient);
        this.desktop = Draw.drawBackground(cr, x, y, this.style);
        switch(this._sketch) {
        case Sketch.Waves:
            if(!this._points.length) this._points = Draw.genWaves(x, y);
            Draw.drawWaves(cr, this._points, this._showcolor);
            break;
        case Sketch.Blobs:
            if(!this._points.length) this._points = Draw.genBlobs(x, y);
            Draw.drawBlobs(cr, this._points);
            break;
        case Sketch.Ovals:
            if(!this._points.length) this._points = Draw.genOvals(x, y);
            Draw.drawOvals(cr, this._points);
            break;
        case Sketch.Clouds:
            if(!this._points.length) this._points = Draw.genClouds(x, y);
            Draw.drawClouds(cr, this._points);
            break;
        default:
            break;
        }
        Draw.drawMotto(cr, text); // draw text on the top
        this._painted = true;

        cr.$dispose();
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
        this.desktop = false;
        this.systray = false;
        this.refresh = false;
        this._area.destroy();
        delete this._area;
        delete this._proxy;
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

