Magma
=====

Magma is a CLI tool for Arma 3 server mod managment that works both on Windows and Linux.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@creeppork/magma.svg)](https://npmjs.org/package/@creeppork/magma)
[![Codecov](https://codecov.io/gh/CreepPork/Magma/branch/rewrite/graph/badge.svg)](https://codecov.io/gh/CreepPork/Magma)
[![Downloads/week](https://img.shields.io/npm/dw/@creeppork/magma.svg)](https://npmjs.org/package/@creeppork/magma)
[![License](https://img.shields.io/npm/l/@creeppork/magma.svg)](https://github.com/CreepPork/Magma/blob/master/package.json)

<!-- toc -->
* [Features](#features)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Features

- Downloads mods from Steam Workshop, moves to directories, installs keys, updates config files
- Windows and Linux server support
- Server mod support (`-serverMod=...`)
- Client-side mod support (only installs keys)
- Fully supports non-interactive shells
- Support for a cron job (or task scheduler on Windows) that checks for mod updates and if found notifies Discord
- Ability to update and remove mods
- Supports mod activation and deactivation (doesn't remove them from disk)
- Allows mod preset managment to quickly swap large amounts of mods

# Usage
<!-- usage -->
```sh-session
$ npm install -g @creeppork/magma
$ magma COMMAND
running command...
$ magma (-v|--version|version)
@creeppork/magma/2.0.0-beta.0 linux-x64 node-v10.16.0
$ magma --help [COMMAND]
USAGE
  $ magma COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`magma activate [ID]`](#magma-activate-id)
* [`magma add ID`](#magma-add-id)
* [`magma cron`](#magma-cron)
* [`magma deactivate [ID]`](#magma-deactivate-id)
* [`magma help [COMMAND]`](#magma-help-command)
* [`magma initialize`](#magma-initialize)
* [`magma install`](#magma-install)
* [`magma list`](#magma-list)
* [`magma remove [ID]`](#magma-remove-id)
* [`magma update`](#magma-update)

## `magma activate [ID]`

Activates mods by adding their symlinks and keys back.

```
USAGE
  $ magma activate [ID]

ARGUMENTS
  ID  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive  Do not prompt for any input.

EXAMPLES
  magma activate
  magma activate 723217262
  magma activate 450814997 723217262 713709341
```

_See code: [src/commands/activate.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/activate.ts)_

## `magma add ID`

Adds Steam Workshop items to the configuration files (does not download them).

```
USAGE
  $ magma add ID

ARGUMENTS
  ID  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive          Do not prompt for any input.
  -t, --type=all|client|server  [default: all]

EXAMPLES
  magma add 723217262 --type client
  magma add 450814997 723217262 713709341 --type all client server
```

_See code: [src/commands/add.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/add.ts)_

## `magma cron`

A command designed to be run in a time-based job scheduler to notify on social platforms for mod updates.

```
USAGE
  $ magma cron

EXAMPLE
  magma cron
```

_See code: [src/commands/cron.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/cron.ts)_

## `magma deactivate [ID]`

Deactivates mods by removing their symlinks and keys.

```
USAGE
  $ magma deactivate [ID]

ARGUMENTS
  ID  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive  Do not prompt for any input.

EXAMPLES
  magma deactivate
  magma deactivate 723217262
  magma deactivate 450814997 723217262 713709341
```

_See code: [src/commands/deactivate.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/deactivate.ts)_

## `magma help [COMMAND]`

display help for magma

```
USAGE
  $ magma help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_

## `magma initialize`

Initializes the configuration data required for Magma to operate.

```
USAGE
  $ magma initialize

OPTIONS
  -c, --steamCmd=steamCmd                              Absolute path to the SteamCMD executable (including the file
                                                       itself).

  -f, --force                                          Skip the check for the magma.json file. If it exists, it will be
                                                       overwritten.

  -l, --linuxGsmInstanceConfig=linuxGsmInstanceConfig  Absolute path to the LinuxGSM instance configuration file (where
                                                       it handles mods/servermods) (only supported on Linux)

  -n, --nonInteractive                                 Do not prompt for any input.

  -p, --password=password                              Steam user password.

  -s, --server=server                                  Absolute path to the directory where the server is (where the
                                                       server executable is).

  -u, --username=username                              Steam username.

  -w, --webhookUrl=webhookUrl                          Webhook URL to which the magma cron command will respond to.

ALIASES
  $ magma init
```

_See code: [src/commands/initialize.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/initialize.ts)_

## `magma install`

Downloads and installs mods that have not been previously installed.

```
USAGE
  $ magma install
```

_See code: [src/commands/install.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/install.ts)_

## `magma list`

Lists all mods that have been added or installed by Magma.

```
USAGE
  $ magma list
```

_See code: [src/commands/list.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/list.ts)_

## `magma remove [ID]`

Removes mod files from disk.

```
USAGE
  $ magma remove [ID]

ARGUMENTS
  ID  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive  Do not prompt for any input.

EXAMPLES
  magma remove
  magma remove 723217262
  magma remove 450814997 723217262 713709341
```

_See code: [src/commands/remove.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/remove.ts)_

## `magma update`

Updates currently downloaded mods from Steam Workshop.

```
USAGE
  $ magma update
```

_See code: [src/commands/update.ts](https://github.com/CreepPork/Magma/blob/v2.0.0-beta.0/src/commands/update.ts)_
<!-- commandsstop -->
