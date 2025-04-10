// SPDX-FileCopyrightText: tuberry
// SPDX-License-Identifier: GPL-3.0-or-later

import Gtk from 'gi://Gtk';

import * as UI from './ui.js';
import * as T from './util.js';
import {Key as K} from './const.js';

const {_} = UI;

class ShuzhiPrefs extends UI.Page {
    static {
        T.enrol(this);
    }

    $buildWidgets() {
        return [
            [K.CLR,  new UI.Check()],
            [K.RFS,  new UI.Check()],
            [K.STRY, new UI.Check()],
            [K.ACT,  new UI.Check()],
            [K.SPAN, new UI.Spin(10, 300, 30)],
            [K.BCK,  new UI.Spin(0, 60, 1, _('Max backups'))],
            [K.FONT, new UI.Font({tooltipText: _('Default font')})],
            [K.STL,  new UI.Drop([_('System'), _('Light'), _('Dark')])],
            [K.CLST, new UI.Drop([_('Watermark'), _('Highlight')], _('Color style'))],
            [K.ORNT, new UI.Drop([_('Horizontal'), _('Vertical')], _('Motto orientation'))],
            [K.CLFT, new UI.Font({level: Gtk.FontLevel.FACE, tooltipText: _('Color font')})],
            [K.SRC,  new UI.Entry('{"htext": "htext"}', ['application/x-executable', 'image/*'])],
            [K.PATH, new UI.File({folder: true, open: true}, {tooltipText: _('Picture location')})],
            [K.SRCT, new UI.Drop([_('Command'), _('Text'), _('Image'), _('Online')], _('Source type'))],
            [K.DSKT, new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Cloud')], _('Dark sketches'))],
            [K.LSKT, new UI.Drop([_('Luck'), _('Wave'), _('Oval'), _('Blob'), _('Tree')], _('Light sketches'))],
        ];
    }

    $buildUI() {
        return [
            [K.STRY, [_('_Enable systray')]],
            [K.ACT, [_('_Set accent color')]],
            [K.RFS, [_('_Auto refresh')], K.SPAN, UI.Spin.unit(_('min'))],
            [K.CLR, [_('_Color name')], K.CLST, K.CLFT],
            [[_('_Gen picture')], K.PATH, K.BCK],
            [[_('S_ketch style')], K.STL, K.LSKT, K.DSKT],
            [[_('_Motto style')], K.ORNT, K.FONT],
            [[_('M_otto source')], new UI.Help(({d, h}) => [h(_('Source type illustration')), [
                [_('Text'), _('<a href="https://docs.gtk.org/Pango/pango_markup.html">Pango markup</a> / plain text or JSON like:')],
                ['', `<tt>{
  "[hv]?[ld]?text": "${_('(horizontal/vertical and light/dark) markup or text')}",
  "seal": "${_('intagliated seal style text following the above text')}",
  "[ld]?image": "${_('light/dark image file path')}",
}</tt>`],
                [_('Command'), _('script to generate text like above')],
                [_('Online'), _('fallback text for the <a href="https://github.com/xenv/gushici">jinrishichi</a> API')],
                [_('Image'), _('path of an image, default to the distro logo')],
            ], h(_('Text placeholder')), d(['{SZ_BGCOLOR}', _('wallpaper background color'), '{SZ_ACCENT_COLOR}', _('system accent color')])]), K.SRC, K.SRCT],
        ];
    }
}

export default class extends UI.Prefs { $klass = ShuzhiPrefs; }
