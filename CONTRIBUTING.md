# Contributing

Contributions are **welcome** and will be fully **credited**.

We accept contributions via Pull Requests on [GitHub](https://github.com/CreepPork/Magma).


## Pull Requests

- **Document any change in behaviour** - Make sure the `README.md` and any other relevant documentation are kept up-to-date.

- **Consider our release cycle** - We try to follow [SemVer v2.0.0](http://semver.org/). Randomly breaking public APIs is not an option.

- **Create feature branches** - Don't ask us to pull from your master branch.

- **One pull request per feature** - If you want to do more than one thing, send multiple pull requests.

- **Send coherent history** - Make sure each individual commit in your pull request is meaningful. If you had to make multiple intermediate commits while developing, please [squash them](http://www.git-scm.com/book/en/v2/Git-Tools-Rewriting-History#Changing-Multiple-Commit-Messages) before submitting.

- **Follow TSLint guidelines** - TSLint is there to make the code look somewhat uniform. If unable to follow then list your reasoning in the Pull Request.

- **Tests are recommended** - If you are creating a new feature or fixing an existing bug, the test suite should be kept up-to-date.

* * *

- To test Magma run:

```bash
npm test
```

- To run Magma for development:

```bash
./bin/run <command>
```

- To compile Magma for production usage:

```bash
tsc -b
npm run version
npm pack
```

**Happy coding**!
