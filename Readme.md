# Leak parser

## Init

```bash
cp .template.env .env

# interactively set new db pass and location of the file to import
nano .env

# Start local db instance
docker compose up -d

# install dependencies
npm i

# compile project
npm exec tsc -p

# create initial table
echo 'CREATE TABLE IF NOT EXISTS tuples(email TEXT, password TEXT, frequency INTEGER DEFAULT 1, UNIQUE (email, password));' | docker compose exec -T postgres psql -U postgres

# run import script
node --env-file=./.env ./dist/index.js
```

## Reuse

```bash
# interactively set new location of the file to import
nano .env

# run import script
node --env-file=./.env ./dist/index.js
```

## Check results

```bash
echo 'select * from tuples limit 20;' | docker compose exec -T postgres psql -U postgres
```

## Run code in dev watch mode

```bash
ls *.ts | entr -scc 'npm exec tsc -p && node dist/index.js'
```
