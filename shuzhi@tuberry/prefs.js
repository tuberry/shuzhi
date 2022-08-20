// vim:fdm=syntax
// by tuberry
/* exported init buildPrefsWidget */
'use strict';

const { Adw, Gtk, Gio, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const { Fields } = Me.imports.fields;
const UI = Me.imports.ui;

function buildPrefsWidget() {
    return new ShuzhiPrefs();
}

function init() {
    ExtensionUtils.initTranslations();
}

class ShuzhiPrefs extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super();
        this._buildWidgets();
        this._buildUI();
    }

    _buildWidgets() {
        let gsettings = ExtensionUtils.getSettings();
        this._field = {
            COLOR:    ['active',   new Gtk.CheckButton()],
            REFRESH:  ['active',   new Gtk.CheckButton()],
            SYSTRAY:  ['active',   new Gtk.CheckButton()],
            INTERVAL: ['value',    new UI.Spin(10, 300, 30)],
            BACKUPS:  ['value',    new UI.Spin(0, 60, 1, _('Max backups'))],
            ORIENT:   ['selected', new UI.Drop([_('Horizontal'), _('Vertical')])],
            FONT:     ['font',     new Gtk.FontButton({ valign: Gtk.Align.CENTER })],
            FOLDER:   ['file',     new UI.File({ action: Gtk.FileChooserAction.SELECT_FOLDER })],
            COMMAND:  ['text',     new UI.LazyEntry('shuzhi.sh', _('Command to generate the central text'))],
            DSKETCH:  ['selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'))],
            LSKETCH:  ['selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Trees')], _('Light sketches'))],
            STYLE:    ['selected', new UI.Drop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light'))],
        };
        Object.entries(this._field).forEach(([x, [y, z]]) => gsettings.bind(Fields[x], z, y, Gio.SettingsBindFlags.DEFAULT));
    }

    _buildUI() {
        [
            [this._field.SYSTRAY[1],  [_('Enable systray')]],
            [this._field.COLOR[1],    [_('Show color name')]],
            [this._field.REFRESH[1],  [_('Auto refresh')], this._field.INTERVAL[1]],
            [[_('Picture location')], this._field.BACKUPS[1], this._field.FOLDER[1]],
            [[_('Default style')],    this._field.STYLE[1], this._field.LSKETCH[1], this._field.DSKETCH[1]],
            [[_('Text orientation')], this._field.ORIENT[1]],
            [[_('Text font')],        this._field.FONT[1]],
            [[_('Text command')],     this._field.COMMAND[1]],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }
}
