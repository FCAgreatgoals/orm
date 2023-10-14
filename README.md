oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g orm-cli
$ orm COMMAND
running command...
$ orm (--version)
orm-cli/0.0.0 linux-x64 node-v18.17.1
$ orm --help [COMMAND]
USAGE
  $ orm COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`orm hello PERSON`](#orm-hello-person)
* [`orm hello world`](#orm-hello-world)
* [`orm help [COMMANDS]`](#orm-help-commands)
* [`orm plugins`](#orm-plugins)
* [`orm plugins:install PLUGIN...`](#orm-pluginsinstall-plugin)
* [`orm plugins:inspect PLUGIN...`](#orm-pluginsinspect-plugin)
* [`orm plugins:install PLUGIN...`](#orm-pluginsinstall-plugin-1)
* [`orm plugins:link PLUGIN`](#orm-pluginslink-plugin)
* [`orm plugins:uninstall PLUGIN...`](#orm-pluginsuninstall-plugin)
* [`orm plugins:uninstall PLUGIN...`](#orm-pluginsuninstall-plugin-1)
* [`orm plugins:uninstall PLUGIN...`](#orm-pluginsuninstall-plugin-2)
* [`orm plugins update`](#orm-plugins-update)

## `orm hello PERSON`

Say hello

```
USAGE
  $ orm hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/FCA/orm-cli/blob/v0.0.0/dist/commands/hello/index.ts)_

## `orm hello world`

Say hello world

```
USAGE
  $ orm hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ orm hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [dist/commands/hello/world.ts](https://github.com/FCA/orm-cli/blob/v0.0.0/dist/commands/hello/world.ts)_

## `orm help [COMMANDS]`

Display help for orm.

```
USAGE
  $ orm help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for orm.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.19/src/commands/help.ts)_

## `orm plugins`

List installed plugins.

```
USAGE
  $ orm plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ orm plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/index.ts)_

## `orm plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ orm plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ orm plugins add

EXAMPLES
  $ orm plugins:install myplugin 

  $ orm plugins:install https://github.com/someuser/someplugin

  $ orm plugins:install someuser/someplugin
```

## `orm plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ orm plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ orm plugins:inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/inspect.ts)_

## `orm plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ orm plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ orm plugins add

EXAMPLES
  $ orm plugins:install myplugin 

  $ orm plugins:install https://github.com/someuser/someplugin

  $ orm plugins:install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/install.ts)_

## `orm plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ orm plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ orm plugins:link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/link.ts)_

## `orm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ orm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ orm plugins unlink
  $ orm plugins remove
```

## `orm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ orm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ orm plugins unlink
  $ orm plugins remove
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/uninstall.ts)_

## `orm plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ orm plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ orm plugins unlink
  $ orm plugins remove
```

## `orm plugins update`

Update installed plugins.

```
USAGE
  $ orm plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v3.8.0/src/commands/plugins/update.ts)_
<!-- commandsstop -->
