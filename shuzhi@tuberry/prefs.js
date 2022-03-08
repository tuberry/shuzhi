// vim:fdm=syntax
// by tuberry
/* exported init buildPrefsWidget */
'use strict';

const { Adw, Gtk, Gio, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const gsettings = ExtensionUtils.getSettings();
const Fields = Me.imports.fields.Fields;
const UI = Me.imports.ui;

function buildPrefsWidget() {
    return new ShuzhiPrefs();
}

function init() {
    ExtensionUtils.initTranslations();
}

class TipDrop extends Gtk.DropDown {
    static {
        GObject.registerClass(this);
    }

    constructor(args, tip) {
        super({ model: Gtk.StringList.new(args), valign: Gtk.Align.CENTER, tooltip_text: tip || '' });
    }
}

class ShuzhiPrefs extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super();
        this._buildWidgets();
        this._bindValues();
        this._buildUI();
    }

    _buildWidgets() {
        this._field_color    = new Gtk.CheckButton();
        this._field_refresh  = new Gtk.CheckButton();
        this._field_systray  = new Gtk.CheckButton();
        this._field_interval = new UI.Spin(10, 300, 30);
        this._field_xdisplay = new UI.Spin(800, 9600, 100);
        this._field_ydisplay = new UI.Spin(600, 5400, 100);
        this._field_orient   = new UI.Drop(_('Horizontal'), _('Vertical'));
        this._field_font     = new Gtk.FontButton({ valign: Gtk.Align.CENTER });
        this._field_folder   = new UI.File({ action: Gtk.FileChooserAction.SELECT_FOLDER });
        this._field_command  = new UI.LazyEntry('shuzhi.sh', _('Command to generate the central text'));
        this._field_dsketch  = new TipDrop([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'));
        this._field_lsketch  = new TipDrop([_('Waves'), _('Ovals'), _('Blobs'), _('Trees')], _('Light sketches'));
        this._field_display  = new Adw.ExpanderRow({ title: _('Set resolution'), show_enable_switch: true, subtitle: _('Required only if incorrect') });
        this._field_style    = new TipDrop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light'));
    }

    _buildUI() {
        [
            [this._field_systray, [_('Enable systray')]],
            [this._field_color, [_('Show color name')]],
            [this._field_refresh, [_('Auto refresh')], this._field_interval],
            [[_('Picture location')], this._field_folder],
            [[_('Default style')], this._field_style, this._field_lsketch, this._field_dsketch],
            [[_('Text orientation')], this._field_orient],
            [[_('Text font')], this._field_font],
            [[_('Text command')], this._field_command],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
        [[[_('Height')], this._field_ydisplay], [[_('Width')], this._field_xdisplay]].forEach(xs => this._field_display.add_row(new UI.PrefRow(...xs)));
        this.add(this._field_display);
        if(this._field_display.enable_expansion) this._field_display.set_expanded(true);
    }

    _bindValues() {
        [
            [Fields.SYSTRAY,  this._field_systray,  'active'],
            [Fields.DISPLAY,  this._field_display,  'enable-expansion'],
            [Fields.COLOR,    this._field_color,    'active'],
            [Fields.REFRESH,  this._field_refresh,  'active'],
            [Fields.STYLE,    this._field_style,    'selected'],
            [Fields.LSKETCH,  this._field_lsketch,  'selected'],
            [Fields.DSKETCH,  this._field_dsketch,  'selected'],
            [Fields.INTERVAL, this._field_interval, 'value'],
            [Fields.XDISPLAY, this._field_xdisplay, 'value'],
            [Fields.YDISPLAY, this._field_ydisplay, 'value'],
            [Fields.ORIENT,   this._field_orient,   'selected'],
            [Fields.COMMAND,  this._field_command,  'text'],
            [Fields.FONT,     this._field_font,     'font'],
            [Fields.FOLDER,   this._field_folder,   'file'],
        ].forEach(xs => gsettings.bind(...xs, Gio.SettingsBindFlags.DEFAULT));
    }
}

