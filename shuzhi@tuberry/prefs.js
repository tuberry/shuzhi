// vim:fdm=syntax
// by:tuberry@github
//
const { Gio, Gtk, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;

const gsettings = ExtensionUtils.getSettings();

var Fields = {
    FONT:     'font-name',
    COMMAND:  'text-command',
    POINTS:   'points-cache',
    STYLE:    'default-style',
    REFRESH:  'enable-refresh',
    SYSTRAY:  'enable-systray',
    COLOR:    'show-color-name',
    DSKETCH:  'dark-sketch-type',
    INTERVAL: 'refresh-interval',
    ORIENT:   'text-orientation',
    LSKETCH:  'light-sketch-type',
};

function buildPrefsWidget() {
    return new ShuzhiPrefs();
}

function init() {
    ExtensionUtils.initTranslations();
}

const ShuzhiPrefs = GObject.registerClass(
class ShuzhiPrefs extends Gtk.ScrolledWindow {
    _init() {
        super._init({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
        });

        this._bulidWidget();
        this._bulidUI();
        this._bindValues();
        this._syncStatus();
        this.show_all();
    }

    _bulidWidget() {
        this._field_systray = this._checkMaker(_('Enable systray'));
        this._field_refresh = this._checkMaker(_('Auto refresh'));
        this._field_color   = this._checkMaker(_('Show color name'));

        this._field_font     = new Gtk.FontButton();
        this._field_interval = this._spinMaker(10, 300, 30);
        this._field_orient   = this._comboMaker([_('Horizontal'), _('Vertical')]);
        this._field_style    = this._comboMaker([_('Light'), _('Dark'), _('Auto')], _('Background and text'));
        this._field_lsketch  = this._comboMaker([_('Waves'), _('Ovals'), _('Blobs')], _('Light sketches'));
        this._field_dsketch  = this._comboMaker([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'));
        this._field_command  = this._entryMaker('fortune', _('Command to generate the text in center'))
    }

    _bulidUI() {
        this._box = new Gtk.Box({
            margin: 30,
            orientation: Gtk.Orientation.VERTICAL,
        });
        this.add(this._box);

        let frame = this._listFrameMaker();
        let hbox = new Gtk.HBox({ hexpand: false, spacing: 8 });
        hbox.add(this._field_style);
        hbox.add(this._field_lsketch);
        hbox.add(this._field_dsketch);
        frame._add(this._field_systray);
        frame._add(this._field_color);
        frame._add(this._field_refresh, this._field_interval);
        frame._add(this._labelMaker(_('Text orientation')), this._field_orient);
        frame._add(this._labelMaker(_('Text font')), this._field_font);
        frame._add(this._labelMaker(_('Default style')), hbox);
        frame._att(this._labelMaker(_('Text command')), this._field_command);
    }

    _bindValues() {
        gsettings.bind(Fields.SYSTRAY,  this._field_systray,  'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.COLOR,    this._field_color,    'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.REFRESH,  this._field_refresh,  'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.STYLE,    this._field_style,    'active',      Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.LSKETCH,  this._field_lsketch,  'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.DSKETCH,  this._field_dsketch,  'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.INTERVAL, this._field_interval, 'value',     Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.ORIENT,   this._field_orient,   'active',    Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.COMMAND,  this._field_command,  'text',      Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.FONT,     this._field_font,     'font-name', Gio.SettingsBindFlags.DEFAULT);
    }

    _syncStatus() {
        this._field_refresh.connect('notify::active', widget => {
            this._field_interval.set_sensitive(widget.active);
        });
        this._field_interval.set_sensitive(this._field_refresh.active);
        let edit = !gsettings.get_string(Fields.COMMAND);
        this._field_command.set_editable(edit);
        this._field_command.secondary_icon_name = edit ? 'document-edit-symbolic' : 'action-unavailable-symbolic';
    }

    _listFrameMaker() {
        let frame = new Gtk.Frame({
            label_yalign: 1,
        });
        this._box.add(frame);

        frame.grid = new Gtk.Grid({
            margin: 10,
            hexpand: true,
            row_spacing: 12,
            column_spacing: 18,
            row_homogeneous: false,
            column_homogeneous: false,
        });

        frame.grid._row = 0;
        frame.add(frame.grid);
        frame._add = (x, y) => {
            const hbox = new Gtk.Box();
            hbox.pack_start(x, true, true, 4);
            if(y) hbox.pack_start(y, false, false, 4);
            frame.grid.attach(hbox, 0, frame.grid._row++, 1, 1);
        }
        frame._att = (x, y) => {
            const hbox = new Gtk.Box();
            hbox.pack_start(x, true, true, 4);
            if(y) hbox.pack_start(y, true, true, 4);
            frame.grid.attach(hbox, 0, frame.grid._row++, 1, 1);
        }

        return frame;
    }

    _spinMaker(l, u, s) {
        return new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: l,
                upper: u,
                step_increment: s,
            }),
        });
    }

    _labelMaker(x) {
        return new Gtk.Label({
            label: x,
            hexpand: true,
            halign: Gtk.Align.START,
        });
    }

    _checkMaker(x) {
        return new Gtk.CheckButton({
            label: x,
            hexpand: true,
            halign: Gtk.Align.START,
        });
    }

    _comboMaker(ops, tip) {
        let l = new Gtk.ListStore();
        l.set_column_types([GObject.TYPE_STRING]);
        ops.forEach(op => l.set(l.append(), [0], [op]));
        let c = new Gtk.ComboBox({ model: l, tooltip_text: tip ? tip : '' });
        let r = new Gtk.CellRendererText();
        c.pack_start(r, false);
        c.add_attribute(r, 'text', 0);
        return c;
    }

    _entryMaker(x, y, z) {
        let entry = new Gtk.Entry({
            editable: false,
            placeholder_text: x,
            hexpand: z ? false : true,
            secondary_icon_sensitive: true,
            secondary_icon_tooltip_text: y,
            secondary_icon_activatable: true,
            secondary_icon_name: 'action-unavailable',
        });
        entry.connect('icon-press', () => {
            if(entry.get_editable()) {
                entry.set_editable(false);
                entry.secondary_icon_name = 'action-unavailable'
            } else {
                entry.set_editable(true);
                entry.secondary_icon_name = 'document-edit-symbolic';
            }
        });
        return entry;
    }
});

