# SPDX-FileCopyrightText: tuberry
# SPDX-License-Identifier: GPL-3.0-or-later

configure_file(
  input: 'metadata.json.in',
  output: 'metadata.json',
  configuration: metadata,
  install_dir: target_dir,
)

subdir('scalable/status') # HACK: for https://github.com/mesonbuild/meson/issues/2320

table = 'color.tsv'
color = custom_target(
  output: table,
  build_by_default: true,
  build_always_stale: true,
  command: [
    find_program('gjs'),
    '-m',
    '@SOURCE_ROOT@'/ 'cli/gen-color.js',
    '@OUTDIR@' / table,
  ],
)

foreach name: ['extension']
  gres = configure_file(
    input: f'@name@.gresource.xml.in',
    output: f'@name@.gresource.xml',
    configuration: {'icon': icon, 'table': table, 'path': metadata['path']},
  )
  gnome.compile_resources(
    name, gres,
    source_dir: '@OUTDIR@',
    dependencies: [tray, color], # NOTE: ? tray dep only not working
    gresource_bundle: true,
    install: true,
    install_dir: target_dir / 'resource',
  )
endforeach
