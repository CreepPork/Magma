Magma
=====

A CLI app that is a mod updater for LinuxGSM powered Arma 3 servers.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/Magma.svg)](https://npmjs.org/package/Magma)
[![Build Status](https://travis-ci.com/CreepPork/Magma.svg?token=TsdTZZVMQRx2yic71M4F&branch=master)](https://travis-ci.com/CreepPork/Magma)
[![Codecov](https://codecov.io/gh/CreepPork/Magma/branch/master/graph/badge.svg)](https://codecov.io/gh/CreepPork/Magma)
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
magma/0.0.0 linux-x64 node-v10.15.3
$ magma --help [COMMAND]
USAGE
  $ magma COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`magma download ITEMID`](#magma-download-itemid)
* [`magma help [COMMAND]`](#magma-help-command)
* [`magma initialize`](#magma-initialize)
* [`magma login`](#magma-login)

## `magma download ITEMID`

Downloads a Steam Workshop item.

```
USAGE
  $ magma download ITEMID

ARGUMENTS
  ITEMID  Steam Workshop item ID. Can be found in the URL.

OPTIONS
  -g, --gameAppId=gameAppId  Steam game app ID. Can be found at SteamDB or in the URL.
```

_See code: [src/commands/download.ts](https://github.com/CreepPork/Magma/blob/v0.0.0/src/commands/download.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `magma initialize`

Initializes servers configuration data.

```
USAGE
  $ magma initialize

OPTIONS
  -f, --force  Skip a check if the settings file already exists.

ALIASES
  $ magma init
```

_See code: [src/commands/initialize.ts](https://github.com/CreepPork/Magma/blob/v0.0.0/src/commands/initialize.ts)_

## `magma login`

Logs into SteamCMD.

```
USAGE
  $ magma login
```

_See code: [src/commands/login.ts](https://github.com/CreepPork/Magma/blob/v0.0.0/src/commands/login.ts)_
<!-- commandsstop -->
