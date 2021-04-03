// vim:fdm=syntax
// by: tuberry@github
'use strict';

const { Gtk, Gio, GLib, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = imports.gettext.domain(Me.metadata['gettext-domain']).gettext;
const gsettings = ExtensionUtils.getSettings();
const Fields = Me.imports.fields.Fields;
const UI = Me.imports.ui;

function buildPrefsWidget() {
    return new ShuzhiPrefs();
}

function init() {
    ExtensionUtils.initTranslations();
}

const ShuzhiPrefs = GObject.registerClass(
class ShuzhiPrefs extends Gtk.ScrolledWindow {
    _init() {
        super._init({ hscrollbar_policy: Gtk.PolicyType.NEVER, });

        this._buildWidgets();
        this._bindValues();
        this._buildUI();
        GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 20, () => {
            this.get_root().default_height = 475;
            return GLib.SOURCE_REMOVE;
        }); // maybe effective, see https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/4029
    }

    _buildWidgets() {
        this._field_font     = new Gtk.FontButton();
        this._field_interval = new UI.Spin(10, 300, 30);
        this._field_refresh  = new UI.Check(_('Auto refresh'));
        this._field_systray  = new UI.Check(_('Enable systray'));
        this._field_color    = new UI.Check(_('Show color name'));
        this._field_orient   = new UI.Combo([_('Horizontal'), _('Vertical')]);
        this._field_command  = new UI.Entry('fortune', _('Command to generate the center text'));
        this._field_folder   = new UI.FileButton({ action: Gtk.FileChooserAction.SELECT_FOLDER });
        this._field_lsketch  = new UI.Combo([_('Waves'), _('Ovals'), _('Blobs')], _('Light sketches'));
        this._field_style    = new UI.Combo([_('Light'), _('Dark'), _('Auto')], _('Background color'));
        this._field_dsketch  = new UI.Combo([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'));
    }

    _buildUI() {
        let grid = new UI.ListGrid();
        grid._add(this._field_systray);
        grid._add(this._field_color);
        grid._add(this._field_refresh, this._field_interval);
        grid._add(new UI.Label(_('Text orientation')), this._field_orient);
        grid._add(new UI.Label(_('Picture location')), this._field_folder);
        grid._add(new UI.Label(_('Text font')), this._field_font);
        grid._add(new UI.Label(_('Default style')), new UI.Box().appends([this._field_style, this._field_lsketch, this._field_dsketch]));
        grid._att(new UI.Label(_('Text command')), this._field_command);
        this.set_child(new UI.Frame(grid));
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

        this._field_command._set_edit();
    }
});

