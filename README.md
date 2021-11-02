# 数枝 | Shuzhi

受[几枝](https://github.com/unicar9/jizhi)启发的 gnome shell 壁纸生成扩展。

Wallpaper generation extension for GNOME Shell, inspired by [Jizhi](https://github.com/unicar9/jizhi).

>望着窗外，只要想起一生中后悔的事 / 梅花便落满了南山 —— *张枣 《镜中》*<br>
[![license]](/LICENSE)
<br>

![shuzhi](https://user-images.githubusercontent.com/17917040/108039729-7453cc00-7077-11eb-9d91-4beebcef9e97.png)

## Installation

### Manual

The latest and supported version should only work on the most current stable version of GNOME Shell.

```bash
git clone https://github.com/tuberry/shuzhi.git && cd shuzhi
make && make install
# make LANG=your_language_code mergepo # for translation
```

For older versions, it's necessary to switch the git tag before `make`:

```bash
# git tag # to see available versions
git checkout your_gnome_shell_version
```

### E.G.O

[<img src="https://raw.githubusercontent.com/andyholmes/gnome-shell-extensions-badge/master/get-it-on-ego.svg?sanitize=true" alt="Get it on GNOME Extensions" height="100" align="middle">][EGO]

## Features

![szprefs](https://user-images.githubusercontent.com/17917040/108040675-8f730b80-7078-11eb-86e9-b50a3ed5f39a.png)

## Note

* Set the text command to `shuzhi.sh` to enable the builtin script;
* Support [Pango](https://developer.gnome.org/pygtk/stable/pango-markup-language.html) markups or images (SVG & PNG only), see [shuzhi.sh](/shuzhi@tuberry/shuzhi.sh) or [_shuzhi.fish](/_shuzhi.fish) for reference;

## Acknowledgements

* [gushichi](https://github.com/xenv/gushici): the API used in [shuzhi.sh](/shuzhi@tuberry/shuzhi.sh).

[license]:https://img.shields.io/badge/license-GPLv3-green.svg
[EGO]:https://extensions.gnome.org/extension/3985/shu-zhi/
