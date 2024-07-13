Basic Design

domain.com -> front end
domain.com/id -> auth-node, which relies on auth-mysql

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
# create a date-tagged and a latest copy
docker build -f ./Dockerfile.markdun-auth -t auth-node:$(date -d "today" +"%Y%m%d%H%M") -t auth-node .
```

Compose up:
```bash
MYSQL_ROOT_PASSWORD=some_password docker compose -f docker-compose.yml up -d
```

Saving an image:

```bash
docker save -o auth-node.tar auth-node
```

```bash
scp -i ~/.ssh/[key] /.../auth-node.tar steven@159.89.233.185:/.../auth-node.tar
```

Sharing to registry
```bash
docker commit <container-id> <auth-node|auth-mysql|markdun-fe|etc...>
docker tag <commit-name> container-registry.stevenlacks.com/<resource>
docker push container-registry.stevenlacks.com/<resource>
docker pull container-registry.stevenlacks.com/<resource>
```