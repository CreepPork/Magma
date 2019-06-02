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
$ npm install -g Magma
$ magma COMMAND
running command...
$ magma (-v|--version|version)
Magma/0.0.0 linux-x64 node-v10.15.3
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
  - [`magma hello [FILE]`](#magma-hello-file)
  - [`magma help [COMMAND]`](#magma-help-command)

## `magma hello [FILE]`

describe the command here

```
USAGE
  $ magma hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ magma hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/CreepPork/Magma/blob/v0.0.0/src/commands/hello.ts)_

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
<!-- commandsstop -->
