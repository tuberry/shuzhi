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
            FONT: new UI.Font(),
            CLR:  new UI.Check(),
            RFS:  new UI.Check(),
            STRY: new UI.Check(),
            SPAN: new UI.Spin(10, 300, 30),
            PATH: new UI.File({folder: true}),
            BCK:  new UI.Spin(0, 60, 1, _('Max backups')),
            CLFT: new UI.Font({level: Gtk.FontLevel.FACE, tooltipText: _('Color font')}),
            CLST: new UI.Drop([_('Watermark'), _('Highlight')], _('Color style')),
            ORNT: new UI.Drop([_('Horizontal'), _('Vertical')], _('Text orientation')),
            DSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Cloud')], _('Dark sketches')),
            LSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Tree')], _('Light sketches')),
            CMD:  new UI.LazyEntry(_('# Set to shuzhi.sh to use the jinrishici API'), _('Command to generate the central text')),
            STL:  new UI.Drop([_('Light'), _('Dark'), _('Auto'), _('System')], _('Background color, “Auto” means sync with the Night Light')),
        }, gset);
    }

    $buildUI() {
        [
            [this.$blk.STRY,          [_('Enable systray')]],
            [this.$blk.RFS,           [_('Auto refresh')], this.$blk.SPAN],
            [this.$blk.CLR,           [_('Color name')], this.$blk.CLST, this.$blk.CLFT],
            [[_('Picture location')], this.$blk.BCK, this.$blk.PATH],
            [[_('Default style')],    this.$blk.STL, this.$blk.LSKT, this.$blk.DSKT],
            [[_('Text orientation')], this.$blk.ORNT],
            [[_('Text font')],        this.$blk.FONT],
            [[_('Text command')],     this.$blk.CMD],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }
}

export default class PrefsWidget extends UI.Prefs { $klass = ShuZhiPrefs; }
