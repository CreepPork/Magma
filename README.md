Magma
=====

A CLI app that is a mod updater for Arma 3 servers.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/Magma.svg)](https://npmjs.org/package/Magma)
[![Build Status](https://travis-ci.com/CreepPork/Magma.svg?token=TsdTZZVMQRx2yic71M4F&branch=master)](https://travis-ci.com/CreepPork/Magma)
[![Downloads/week](https://img.shields.io/npm/dw/Magma.svg)](https://npmjs.org/package/Magma)
[![License](https://img.shields.io/npm/l/Magma.svg)](https://github.com/CreepPork/Magma/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g magma
$ magma COMMAND
running command...
$ magma (-v|--version|version)
magma/1.0.0 win32-x64 node-v10.15.3
$ magma --help [COMMAND]
USAGE
  $ magma COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
- [Magma](#magma)
- [Usage](#usage)
- [Commands](#commands)
  - [`magma add ITEMID`](#magma-add-itemid)
  - [`magma download ITEMID`](#magma-download-itemid)
  - [`magma help [COMMAND]`](#magma-help-command)
  - [`magma initialize`](#magma-initialize)
  - [`magma install`](#magma-install)
  - [`magma login`](#magma-login)
  - [`magma remove`](#magma-remove)
  - [`magma update`](#magma-update)

## `magma add ITEMID`

Adds Steam Workshop item data to the config file.

```
USAGE
  $ magma add ITEMID

ARGUMENTS
  ITEMID  Steam Workshop item IDs. Chaining them will add all of them at once.

OPTIONS
  -g, --gameAppId=gameAppId  Steam game app ID. Can be found at SteamDB or in the URL.

EXAMPLES
  magma add 723217262
  magma add 450814997 723217262 713709341
  magma add 430091721 -g 4000
```

_See code: [src\commands\add.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\add.ts)_

## `magma download ITEMID`

Downloads Steam Workshop items, moves keys and updates mods.

```
USAGE
  $ magma download ITEMID

ARGUMENTS
  ITEMID  Steam Workshop item IDs. Chaining them will download all of them at once.

OPTIONS
  -f, --force                Ignores time updated timestamp from Steam Workshop.
  -g, --gameAppId=gameAppId  Steam game app ID. Can be found at SteamDB or in the URL.

EXAMPLES
  magma download 723217262
  magma download 450814997 723217262 713709341 -f
  magma download 430091721 -g 4000
```

_See code: [src\commands\download.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\download.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src\commands\help.ts)_

## `magma initialize`

Initializes servers configuration data.

```
USAGE
  $ magma initialize

OPTIONS
  -f, --force  Skip the check for a settings file. If exists, it will be overwritten.

ALIASES
  $ magma init
```

_See code: [src\commands\initialize.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\initialize.ts)_

## `magma install`

Installs and updates all mods that are present in your configuration file.

```
USAGE
  $ magma install
```

_See code: [src\commands\install.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\install.ts)_

## `magma login`

Logs into SteamCMD.

```
USAGE
  $ magma login
```

_See code: [src\commands\login.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\login.ts)_

## `magma remove`

Removes selected mods from disk completely and their keys.

```
USAGE
  $ magma remove
```

_See code: [src\commands\remove.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\remove.ts)_

## `magma update`

Updates installed mods to their latest versions.

```
USAGE
  $ magma update
```

_See code: [src\commands\update.ts](https://github.com/CreepPork/Magma/blob/v1.0.0/src\commands\update.ts)_
<!-- commandsstop -->
