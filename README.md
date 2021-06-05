# Arceus

Arceus is a Discord bot with a set of features that can be enabled separately.

The main feature is Ledger. Ledger is an archive for Discord messages, storing
messages, attachments, and other related data. It has a Web UI that can be
used to view the data, and a GraphQL API for building other tools.

## Running

Using the Dockerfile in this repo, set the following environment variables:

- DATABASE_URL: A PostgreSQL URL, including database
- DISCORD_TOKEN: A Discord Bot Token
- MINIO_ENDPOINT: An Endpoint to a MinIO server for attachment storage
- MINIO_BUDGET_LEDGER: The MinIO bucket to store attachments in
- MINIO_KEY_ID / MINIO_KEY_SECRET: MinIO credentials to use

Expose port 3000 for the web API.

## Configuration

You'll need to setup permissions. Permissions are a prefix-based system,
so `*` will give access to all commands, and `ledger::*` will give access
to all ledger commands. Initially, entries in the Grant, Role, and DiscordUser
tables will need to be added, then the bot's permission management commands
can be used.

Most modules can be enabled on a per-server, channel, or user basis.

For example, to enable Ledger for a server, use the following command:

```
~config:set module.ledger.guild.{guild id}.enabled true
```
