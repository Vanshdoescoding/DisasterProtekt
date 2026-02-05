# Ops

## Postgres
```bash
docker-compose up -d
```

Default connection string:
```
postgresql://disaster:disaster@localhost:5432/disasterprotek
```

For local tests, you can set:
```
DATABASE_URL=sqlite::memory:
```
