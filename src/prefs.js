// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GObject from 'gi://GObject';

import * as UI from './ui.js';

const {_} = UI;

class ShuZhiPrefs extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor(gset) {
        super();
        this.$buildWidgets(gset);
        this.$buildUI();
    }

    $buildWidgets(gset) {
        this.$blk = UI.block({
            CLR:  new UI.Check(),
            RFS:  new UI.Check(),
            STRY: new UI.Check(),
            ACT:  new UI.Check(),
            SPAN: new UI.Spin(10, 300, 30),
            BCK:  new UI.Spin(0, 60, 1, _('Max backups')),
            SRC:  new UI.Entry('# echo hello, world!', true),
            FONT: new UI.Font({tooltipText: _('Default font')}),
            CLST: new UI.Drop([_('Watermark'), _('Highlight')], _('Color style')),
            PATH: new UI.File({folder: true}, {tooltipText: _('Picture location')}),
            ORNT: new UI.Drop([_('Horizontal'), _('Vertical')], _('Motto orientation')),
            CLFT: new UI.Font({level: Gtk.FontLevel.FACE, tooltipText: _('Color font')}),
            DSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Cloud')], _('Dark sketches')),
            LSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Tree')], _('Light sketches')),
            SRCT: new UI.Drop([_('Command'), _('Text'), _('Image'), _('Online')], _('Source type, “Online” uses the jinrishichi API')),
            STL:  new UI.Drop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light')),
        }, gset);
    }

    $buildUI() {
        [
            [this.$blk.STRY,  [_('Enable systray')]],
            [this.$blk.ACT,   [_('Set accent color')]],
            [this.$blk.RFS,   [_('Auto refresh')], this.$blk.SPAN],
            [this.$blk.CLR,   [_('Color name')], this.$blk.CLST, this.$blk.CLFT],
            [UI.Check.mock(), [_('Gen picture')], this.$blk.PATH, this.$blk.BCK],
            [UI.Check.mock(), [_('Sketch style')], this.$blk.STL, this.$blk.LSKT, this.$blk.DSKT],
            [UI.Check.mock(), [_('Motto style')], this.$blk.ORNT, this.$blk.FONT],
            [UI.Check.mock(), [_('Motto source')], this.$blk.SRC, this.$blk.SRCT],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }
}

export default class PrefsWidget extends UI.Prefs { $klass = ShuZhiPrefs; }
