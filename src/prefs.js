// vim:fdm=syntax
// by tuberry
/* exported init buildPrefsWidget */
'use strict';

const { Adw, Gtk, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const { Fields, Block } = Me.imports.fields;
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
        this._blk = new Block({
            color:  [Fields.COLOR,    'active',   new Gtk.CheckButton()],
            fresh:  [Fields.REFRESH,  'active',   new Gtk.CheckButton()],
            tray:   [Fields.SYSTRAY,  'active',   new Gtk.CheckButton()],
            span:   [Fields.INTERVAL, 'value',    new UI.Spin(10, 300, 30)],
            backup: [Fields.BACKUPS,  'value',    new UI.Spin(0, 60, 1, _('Max backups'))],
            orient: [Fields.ORIENT,   'selected', new UI.Drop([_('Horizontal'), _('Vertical')])],
            font:   [Fields.FONT,     'font',     new Gtk.FontButton({ valign: Gtk.Align.CENTER })],
            path:   [Fields.FOLDER,   'file',     new UI.File({ action: Gtk.FileChooserAction.SELECT_FOLDER })],
            dskt:   [Fields.DSKETCH,  'selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'))],
            lskt:   [Fields.LSKETCH,  'selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Trees')], _('Light sketches'))],
            cmd:    [Fields.COMMAND,  'text',     new UI.LazyEntry(_('# Set to shuzhi.sh to use the built-in script'), _('Command to generate the central text'))],
            style:  [Fields.STYLE,    'selected', new UI.Drop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light'))],
        });
    }

    _buildUI() {
        [
            [this._blk.tray,          [_('Enable systray')]],
            [this._blk.color,         [_('Color name')]],
            [this._blk.fresh,         [_('Auto refresh')], this._blk.span],
            [[_('Text orientation')], this._blk.orient],
            [[_('Picture location')], this._blk.backup,  this._blk.path],
            [[_('Default style')],    this._blk.style,   this._blk.lskt, this._blk.dskt],
            [[_('Text font')],        this._blk.font],
            [[_('Text command')],     this._blk.cmd],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }
}
