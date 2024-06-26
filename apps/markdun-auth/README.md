Deploying docker

Run from the rootdir of this monorepo, not this package:

```bash
docker build -f apps/markdun-auth/Dockerfile  -t auth-node .
```

```bash
<project rootDir>$ docker stack deploy
```