# 数枝 | Shuzhi

受[几枝](https://github.com/unicar9/jizhi)启发的 GNOME Shell 格言壁纸生成扩展。

GNOME Shell extension to generate wallpapers featuring mottos, inspired by [Jizhi](https://github.com/unicar9/jizhi).

>望着窗外，只要想起一生中后悔的事 / 梅花便落满了南山 —— *张枣 《镜中》*\
[![license]](/LICENSE.md)

![shuzhi](https://user-images.githubusercontent.com/17917040/108039729-7453cc00-7077-11eb-9d91-4beebcef9e97.png)

## Installation

### Manual

The latest and supported version should only work on the [current stable version](https://release.gnome.org/calendar/#branches) of GNOME Shell.

```bash
git clone https://github.com/tuberry/shuzhi.git && cd shuzhi
meson setup build && meson install -C build
# meson setup build -Dtarget=system && meson install -C build # system-wide, default --prefix=/usr/local
```

For older versions, it's recommended to install via:

```bash
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell \
          --method org.gnome.Shell.Extensions.InstallRemoteExtension 'shuzhi@tuberry'
```

It's quite the same as installing from:

### E.G.O

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]

## Notes

* Support [Pango](https://docs.gtk.org/Pango/pango_markup.html) markups or images, see also [_shuzhi.sh](/cli/_shuzhi.sh) or [_shuzhi.js](/cli/_shuzhi.js) for reference;
* If you don't want to bother with scripting, set the motto source as `Online` to use [jinrishici] as source. **Note that this project is not affiliated with jinrishici in any way**;

## Contributions

Feel free to open an issue or PR in the repo for any question or idea.

### Translations

To initialize or update the po file from sources:

```bash
bash ./cli/update-po.sh [your_lang_code] # like zh_CN, default to $LANG
```

### Developments

To install GJS TypeScript type [definitions](https://www.npmjs.com/package/@girs/gnome-shell):

```bash
npm install @girs/gnome-shell --save-dev
```

## Acknowledgements

* [gushichi][jinrishici]: the online API

[jinrishici]:https://github.com/xenv/gushici
[license]:https://img.shields.io/badge/license-GPLv3+-green.svg
[EGO]:https://extensions.gnome.org/extension/3985/shu-zhi/
