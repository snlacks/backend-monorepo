Dependencies for auth server

MySQL database with a dedicated table
smtp
sms

Files listed in [system readme](system/README.md) are the start of some automation, but I want to move the automated tasks into individual containers so perfomance isn't interfered with.

Each app/project within has a .tsconfig it either independently that imports the tsconfig inside `<rootdir>/.tsconfig.json`.  This isn't necessary in the future, there may come a time where this README doesn't get updated, and some of the packages/apps use their own package.json.

`<rootdir>/packages/config` includes the eslint config. Prettier is used for formatting as a extension/plugin of eslint.

Otherwise you can build it manually.
```bash
#!bin/bash
# npm run build --workspace=stevenlackscom-auth
npm run build --workspace=markdun-auth
```

## Health Check

The app projects each have a healthcheck option.
To make sure the app will launch, you can run the app on port 4000 instead of 3000 as a system service, then runs a simple test again health
```bash
npm run healthcheck --workspace=markdun-auth
```