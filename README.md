# 数枝 | Shuzhi

受[几枝](https://github.com/unicar9/jizhi)启发的 gnome shell 壁纸生成扩展。

Wallpaper generation extension for GNOME Shell, inspired by [Jizhi](https://github.com/unicar9/jizhi).

>望着窗外，只要想起一生中后悔的事 / 梅花便落满了南山 —— *张枣 《镜中》*<br>
[![license]](/LICENSE.md)
<br>

![shuzhi](https://user-images.githubusercontent.com/17917040/108039729-7453cc00-7077-11eb-9d91-4beebcef9e97.png)

## Installation

### Manual

The latest and supported version should only work on the most current stable version of GNOME Shell.

```bash
git clone https://github.com/tuberry/shuzhi.git && cd shuzhi
meson setup build && meson install -C build
# meson setup build -Dtarget=system && meson install -C build # system-wide, default --prefix=/usr/local
```

For older versions (< 44), it's recommended to install via:

### E.G.O

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]

## Features

![szpref](https://user-images.githubusercontent.com/17917040/155916819-c07054a9-78a4-4ca1-9f39-31f4c85e4256.png)

## Notes

* Support [Pango](https://docs.gtk.org/Pango/pango_markup.html) markups or images, see [_shuzhi.fish](/cli/_shuzhi.fish) or [_shuzhi.gjs](/cli/_shuzhi.gjs) for reference;
* If you don't want to bother with scripting, set the text command to `shuzhi.sh` to use [jinrishici] as source. **Note that this project is not affiliated with jinrishici in any way**.

## Contributions

Any contribution is welcome.

### Ideas

For any question or idea, feel free to open an issue or PR in the repo.

### Translations

To update the po file from sources:

```bash
bash ./cli/update-po.sh [your_lang_code] # like zh_CN, default to $LANG
```

### Developments

To install GJS TypeScript type [definitions](https://www.npmjs.com/package/@girs/gnome-shell):

```bash
npm install @girs/gnome-shell --save-dev
```

## Acknowledgements

* [gushichi][jinrishici]: the API

[jinrishici]:https://github.com/xenv/gushici
[license]:https://img.shields.io/badge/license-GPLv3+-green.svg
[EGO]:https://extensions.gnome.org/extension/3985/shu-zhi/
