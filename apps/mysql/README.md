The docker compose creates a pretty default mysql container.

I put the environmental variable for building with the root password in a file called mysql-root. If you need to do it another way, change those environmenal variables there.

Build it with"

access mysql from root with
```bash
docker exec -it <CONTAINER ID OR NAME> mysql -u root -p
```


Enter your password, create a user and grant access to the tables. Make sure the user@host host allow access from the host or outside.
```mysql
CREATE USER '<username>'@'%' IDENTIFIED BY '<a good password>'
```

Grant all permissions, the app needs one user with all of them for now, but hopefully we'll transition to an agent that updates the schema and one that updates the users.
```mysql
GRANT ALL PRIVILEGES ON *.* TO '<username>'@'%' WITH GRANT OPTION;
```

Login to mysql via
```
mysql --protocol=tcp -P 3306 -h 127.0.0.1 -u $MYSQL_USERNAME -p
```

The dockerfile sets the volume to:
auth-db_auth-db-vol

To create a backup/dump. Make sure to include that `--no-data`
```bash
sudo docker exec <CONTAINER ID OR NAME> sh -c 'exec mysqldump -u <username> -p"<MYSQL_ROOT_PASSWORD>"' --no-data user_auth > user_auth.sql
```

To load from dump:
```bash
mysql -u <username> -p user_auth < user_auth.sql
# Enter password: ...
```