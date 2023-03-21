// vim:fdm=syntax
// by tuberry
/* exported init buildPrefsWidget */
'use strict';

const { Adw, Gtk, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const { _ } = Me.imports.util;
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
        this._blk = UI.block({
            FONT: ['value',    new UI.Font()],
            CLR:  ['active',   new Gtk.CheckButton()],
            RFS:  ['active',   new Gtk.CheckButton()],
            STRY: ['active',   new Gtk.CheckButton()],
            SPAN: ['value',    new UI.Spin(10, 300, 30)],
            PATH: ['value',    new UI.File({ select_folder: true })],
            BCK:  ['value',    new UI.Spin(0, 60, 1, _('Max backups'))],
            ORNT: ['selected', new UI.Drop([_('Horizontal'), _('Vertical')])],
            DSKT: ['selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Clouds')], _('Dark sketches'))],
            LSKT: ['selected', new UI.Drop([_('Waves'), _('Ovals'), _('Blobs'), _('Trees')], _('Light sketches'))],
            CMD:  ['text',     new UI.LazyEntry(_('# Set to shuzhi.sh to use the built-in script'), _('Command to generate the central text'))],
            STL:  ['selected', new UI.Drop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light'))],
        });
    }

    _buildUI() {
        [
            [this._blk.STRY,          [_('Enable systray')]],
            [this._blk.CLR,           [_('Color name')]],
            [this._blk.RFS,           [_('Auto refresh')], this._blk.SPAN],
            [[_('Text orientation')], this._blk.ORNT],
            [[_('Picture location')], this._blk.BCK, this._blk.PATH],
            [[_('Default style')],    this._blk.STL, this._blk.LSKT, this._blk.DSKT],
            [[_('Text font')],        this._blk.FONT],
            [[_('Text command')],     this._blk.CMD],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }
}
