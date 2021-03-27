// vim:fdm=syntax
// by:tuberry@github
//
const { Gio, Gtk, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;
const gsettings = ExtensionUtils.getSettings();
const UI = Me.imports.ui;

var Fields = {
    FONT:     'font-name',
    COMMAND:  'text-command',
    POINTS:   'points-cache',
    STYLE:    'default-style',
    REFRESH:  'enable-refresh',
    SYSTRAY:  'enable-systray',
    COLOR:    'show-color-name',
    DSKETCH:  'dark-sketch-type',
    FOLDER:   'picture-location',
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

        this._bulidUI();
        this._bindValues();
        this.show_all();
    }

    _bulidUI() {
        this._field_font     = new Gtk.FontButton();
        this._field_interval = new UI.Spin(10, 300, 30);
        this._field_refresh  = new UI.Check(_('Auto refresh'));
        this._field_systray  = new UI.Check(_('Enable systray'));
        this._field_color    = new UI.Check(_('Show color name'));
        this._field_orient   = new UI.Combo([_('Horizontal'), _('Vertical')]);
        this._field_command  = new UI.Entry('fortune', _('Command to generate the center text'));
        this._field_lsketch  = new UI.Combo([_('Waves'), _('Ovals'), _('Blobs')], _('Light sketches'));
        this._field_style    = new UI.Combo([_('Light'), _('Dark'), _('Auto')], _('Background color'));
        this._field_dsketch  = new UI.Combo([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'));
        this._field_folder   = new UI.FileButton(gsettings.get_string(Fields.FOLDER), { action: Gtk.FileChooserAction.SELECT_FOLDER });

        let grid = new UI.ListGrid();
        let hbox = new Gtk.Box({ hexpand: false, });
        hbox.add(this._field_style);
        hbox.add(this._field_lsketch);
        hbox.add(this._field_dsketch);
        grid._add(this._field_systray);
        grid._add(this._field_color);
        grid._add(this._field_refresh, this._field_interval);
        grid._add(new UI.Label(_('Text orientation')), this._field_orient);
        grid._add(new UI.Label(_('Picture location')), this._field_folder);
        grid._add(new UI.Label(_('Text font')), this._field_font);
        grid._add(new UI.Label(_('Default style')), hbox);
        grid._att(new UI.Label(_('Text command')), this._field_command);

        this.add(new UI.Frame(grid));
    }

    _bindValues() {
        gsettings.bind(Fields.SYSTRAY,  this._field_systray,  'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.COLOR,    this._field_color,    'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.REFRESH,  this._field_refresh,  'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.STYLE,    this._field_style,    'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.LSKETCH,  this._field_lsketch,  'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.DSKETCH,  this._field_dsketch,  'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.INTERVAL, this._field_interval, 'value',  Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.ORIENT,   this._field_orient,   'active', Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.COMMAND,  this._field_command,  'text',   Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.FONT,     this._field_font,     'font',   Gio.SettingsBindFlags.DEFAULT);
        gsettings.bind(Fields.FOLDER,   this._field_folder,   'file',   Gio.SettingsBindFlags.DEFAULT);

        this._field_refresh.bind_property('active', this._field_interval, 'sensitive', GObject.BindingFlags.GET);
        this._field_interval.set_sensitive(this._field_refresh.active);
        this._field_command.set_edit(!gsettings.get_string(Fields.COMMAND));
    }
});

