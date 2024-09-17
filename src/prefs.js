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
        this.#buildWidgets(gset);
        this.#buildUI();
    }

    #buildWidgets(gset) {
        this.$blk = UI.tie({
            CLR:  new UI.Check(),
            RFS:  new UI.Check(),
            STRY: new UI.Check(),
            ACT:  new UI.Check(),
            SPAN: new UI.Spin(10, 300, 30),
            BCK:  new UI.Spin(0, 60, 1, _('Max backups')),
            FONT: new UI.Font({tooltipText: _('Default font')}),
            CLST: new UI.Drop([_('Watermark'), _('Highlight')], _('Color style')),
            PATH: new UI.File({folder: true}, {tooltipText: _('Picture location')}),
            ORNT: new UI.Drop([_('Horizontal'), _('Vertical')], _('Motto orientation')),
            CLFT: new UI.Font({level: Gtk.FontLevel.FACE, tooltipText: _('Color font')}),
            SRC:  new UI.Entry('{"htext": "htext"}', ['application/x-executable', 'image/*']),
            SRCT: new UI.Drop([_('Command'), _('Text'), _('Image'), _('Online')], _('Source type')),
            DSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Cloud')], _('Dark sketches')),
            LSKT: new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Tree')], _('Light sketches')),
            STL:  new UI.Drop([_('System'), _('Light'), _('Dark'), _('Auto')], _('Background color, “Auto” means sync with the Night Light')),
        }, gset);
    }

    #genSrcHelp() {
        return new UI.Help(`<b>${_('Source type illustration')}</b>
${_('Text')}: ${_('<a href="https://docs.gtk.org/Pango/pango_markup.html">Pango markup</a> / plain text or JSON like')}:
<tt>{
  "[hv]?[ld]?text": "${_('(horizontal/vertical and light/dark) markup or text')}",
  "seal": "${_('intagliated seal style text following the above text')}",
  "[ld]?image": "${_('light/dark image obsolute file path')}",
}</tt>
${_('Command')}: ${_('script to generate text like above')}
${_('Online')}: ${_('fallback text for the <a href="https://github.com/xenv/gushici">jinrishichi</a> API')}
${_('Image')}: ${_('obsolute file path, default to the distro logo')}`);
    }

    #buildUI() {
        [
            [this.$blk.STRY, [_('_Enable systray')]],
            [this.$blk.ACT, [_('_Set accent color')]],
            [this.$blk.RFS, [_('_Auto refresh'), _('Unit: minute')], this.$blk.SPAN],
            [this.$blk.CLR, [_('_Color name')], this.$blk.CLST, this.$blk.CLFT],
            [[_('_Gen picture')], this.$blk.PATH, this.$blk.BCK],
            [[_('S_ketch style')], this.$blk.STL, this.$blk.LSKT, this.$blk.DSKT],
            [[_('_Motto style')], this.$blk.ORNT, this.$blk.FONT],
            [[_('M_otto source')], this.#genSrcHelp(), this.$blk.SRC, this.$blk.SRCT],
        ].forEach(xs => this.add(new UI.ActRow(...xs)));
    }
}

export default class Prefs extends UI.Prefs { $klass = ShuZhiPrefs; }
