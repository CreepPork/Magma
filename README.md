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
* [Requirements](#requirements)
* [Usage](#usage)
* [Commands](#commands)
* [Testing](#testing)
* [Contributing](#contributing)
* [Security](#security)
* [Credits](#credits)
* [License](#license)
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
- Supports Steam Guard
- Local mod support

# Requirements

- Node >= v10

## Windows

```bash
npm install --global --production windows-build-tools
```

The following is also required:
- [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk) - only the "Desktop C++ Apps" components are needed to be installed

## Linux

To build Magma on Linux, `make`, `python` and `build-essential` is required.

```
sudo apt install -y make python build-essential
```

# Usage
<!-- usage -->
```sh-session
$ npm install -g @creeppork/magma
$ magma COMMAND
running command...
$ magma (-v|--version|version)
@creeppork/magma/3.0.0-beta.1 linux-x64 node-v10.16.0
$ magma --help [COMMAND]
USAGE
  $ magma COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`magma activate [ID]`](#magma-activate-id)
* [`magma add IDS`](#magma-add-ids)
* [`magma add:local PATHS`](#magma-addlocal-paths)
* [`magma configure`](#magma-configure)
* [`magma cron`](#magma-cron)
* [`magma deactivate [ID]`](#magma-deactivate-id)
* [`magma help [COMMAND]`](#magma-help-command)
* [`magma initialize`](#magma-initialize)
* [`magma install`](#magma-install)
* [`magma list`](#magma-list)
* [`magma remove [ID]`](#magma-remove-id)
* [`magma update`](#magma-update)
* [`magma upgrade`](#magma-upgrade)

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

_See code: [src/commands/activate.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/activate.ts)_

## `magma add IDS`

Adds Steam Workshop items to the configuration files (does not download them).

```
USAGE
  $ magma add IDS

ARGUMENTS
  IDS  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive          Do not prompt for any input.
  -t, --type=all|client|server  [default: all]

EXAMPLES
  magma add 723217262 --type client
  magma add 450814997 723217262 713709341 --type all client server
```

_See code: [src/commands/add/index.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/add/index.ts)_

## `magma add:local PATHS`

Adds local mods to the configuration files.

```
USAGE
  $ magma add:local PATHS

ARGUMENTS
  PATHS  File paths.

OPTIONS
  -n, --nonInteractive          Do not prompt for any input.
  -t, --type=all|client|server  [default: all]

EXAMPLES
  magma add:local /home/arma/@client --type client
  magma add:local /home/arma/@all /home/arma/@client /home/arma/@server --type all client server
```

_See code: [src/commands/add/local.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/add/local.ts)_

## `magma configure`

Allows to modify the existing configuration file. In interactive mode all flags will be ignored (except Steam Guard).

```
USAGE
  $ magma configure

OPTIONS
  -c, --steamCmd=steamCmd                              Absolute path to the SteamCMD executable (including the file
                                                       itself).

  -g, --steamGuard=steamGuard                          Steam Guard code to use when authenticating.

  -l, --linuxGsmInstanceConfig=linuxGsmInstanceConfig  Absolute path to the LinuxGSM instance configuration file (where
                                                       it handles mods/servermods) (only supported on Linux)

  -n, --nonInteractive                                 Do not prompt for any input.

  -p, --password=password                              Steam user password.

  -s, --server=server                                  Absolute path to the directory where the server is (where the
                                                       server executable is).

  -u, --username=username                              Steam username.

  -w, --webhookUrl=webhookUrl                          Webhook URL to which the magma cron command will respond to.

ALIASES
  $ magma config

EXAMPLES
  magma configure
  magma configure --steamCmd "/var/steamcmd"
  magma configure -n -u UserName
```

_See code: [src/commands/configure.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/configure.ts)_

## `magma cron`

A command designed to be run in a time-based job scheduler to notify on social platforms for mod updates. Each time it is run, it will query the Steam Web API. Do not run this command too frequently so not to get rate-limited.

```
USAGE
  $ magma cron

OPTIONS
  -t, --test  Enabling will send a simple test message to your specified webhook.

EXAMPLE
  magma cron
```

_See code: [src/commands/cron.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/cron.ts)_

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

_See code: [src/commands/deactivate.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/deactivate.ts)_

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

  -g, --steamGuard=steamGuard                          Steam Guard code to use when authenticating.

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

_See code: [src/commands/initialize.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/initialize.ts)_

## `magma install`

Downloads and installs mods that have not been previously installed.

```
USAGE
  $ magma install
```

_See code: [src/commands/install.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/install.ts)_

## `magma list`

Lists all mods that have been added or installed by Magma.

```
USAGE
  $ magma list
```

_See code: [src/commands/list.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/list.ts)_

## `magma remove [ID]`

Removes mod files from disk.

```
USAGE
  $ magma remove [ID]

ARGUMENTS
  ID  Steam Workshop item IDs.

OPTIONS
  -n, --nonInteractive  Do not prompt for any input.

ALIASES
  $ magma uninstall

EXAMPLES
  magma remove
  magma remove 723217262
  magma remove 450814997 723217262 713709341
```

_See code: [src/commands/remove.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/remove.ts)_

## `magma update`

Updates currently downloaded mods from Steam Workshop.

```
USAGE
  $ magma update
```

_See code: [src/commands/update.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/update.ts)_

## `magma upgrade`

Upgrades Magma configuration file to match the newest version.

```
USAGE
  $ magma upgrade
```

_See code: [src/commands/upgrade.ts](https://github.com/CreepPork/Magma/blob/v3.0.0-beta.1/src/commands/upgrade.ts)_
<!-- commandsstop -->

# Testing

```bash
npm test
```

# Contributing

Please see [CONTRIBUTING.md](https://github.com/CreepPork/Magma/blob/master/CONTRIBUTING.md) for details.

# Security

If you discover any security-related issues, please e-mail [security@garkaklis.com](mailto:security@garkaklis.com) instead of using the issue tracker.

# Credits

- [Ralfs Garkaklis](https://github.com/CreepPork)
- [All Contributors](https://github.com/CreepPork/Magma/contributors)

# License

The MIT License (MIT). Please see the [License file](https://github.com/CreepPork/Magma/blob/master/LICENSE) for more information.
