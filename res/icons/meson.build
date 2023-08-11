icon_name = 'florette-symbolic.svg'
custom_target(
  'icons',
  build_by_default: true,
  build_always_stale: true,
  output: icon_name,
  command: [
    find_program('gjs'),
    '-m',
    meson.source_root() / 'cli/gen-icons.js',
    '@OUTDIR@',
    icon_name
    ],
  install: true,
  install_dir: TARGET_DIR / 'icons/hicolor/scalable/status'
  )
