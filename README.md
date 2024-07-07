
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

# Docker stuff
Build examples:
```bash
docker build -f ./Dockerfile.markdun-auth  -t auth-node:latest .
```
```bash
docker build -f ./Dockerfile.markdun-auth -t auth-node:$(date -d "today" +"%Y%m%d%H%M") .
```

Compose up:
```bash
MYSQL_ROOT_PASSWORD=some_password docker compose -f docker-compose.yml up -d
```
