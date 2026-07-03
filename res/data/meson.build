# SPDX-FileCopyrightText: tuberry
# SPDX-License-Identifier: GPL-3.0-or-later

configure_file(
  input: 'metadata.json.in',
  output: 'metadata.json',
  configuration: me,
  install_dir: target_dir,
)

_table = 'color.tsv'
_icon = 'florette-symbolic.svg'
_gres = {'icon': _icon, 'table': _table, 'path': me['path']}

_deps = [] + custom_target(
  input: ['../../cli/gen-icon.js'],
  output: _icon,
  build_subdir: 'scalable/status',
  command: [
    find_program('gjs'),
    '-m',
    '@INPUT@',
    '@OUTDIR@',
    _icon,
  ],
) + custom_target(
  input: ['../../cli/gen-color.js'],
  output: _table,
  command: [
    find_program('gjs'),
    '-m',
    '@INPUT@',
    '@OUTDIR@' / _table,
  ],
)

foreach x: ['extension']
  gnome.compile_resources(
    x, configure_file(
      input: f'@x@.gresource.xml.in',
      output: f'@x@.gresource.xml',
      configuration: _gres,
    ),
    source_dir: '@OUTDIR@',
    dependencies: _deps,
    gresource_bundle: true,
    install: true,
    install_dir: target_dir / 'resource',
  )
endforeach
