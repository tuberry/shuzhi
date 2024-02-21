icon = 'florette-symbolic.svg'
custom_target(
  output: icon,
  build_by_default: true,
  build_always_stale: true,
  command: [
    find_program('gjs'),
    '-m',
    meson.source_root() / 'cli/gen-icons.js',
    '@OUTDIR@',
    icon
  ],
  install: true,
  install_dir: (target == 'system' ? datadir : target_dir)  / 'icons/hicolor/scalable/status'
)

if(target == 'system')
  gnome.post_install(gtk_update_icon_cache: true)
endif
