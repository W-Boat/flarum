# Flarum development demo

Fork of `flarum/flarum`, branch `codex/dev-demo`, using Flarum 2.0.0-rc.8.

The demo uses PHP 8.3+ and SQLite. The server listens at
<http://127.0.0.1:8888> and serves only `public/`.

## Install

Install the dependencies with Composer, or unpack the matching official
installation package and copy its `vendor/` and `composer.lock` into this checkout.
Required PHP modules include curl, dom, fileinfo, gd, mbstring, openssl,
pdo_mysql, pdo_sqlite, tokenizer, zip, and session.

```powershell
composer install
php dev/prepare.php
php flarum install --file=.demo-install.json --no-interaction
php flarum extension:enable flarum-gdpr
php flarum cache:clear
```

The randomly generated administrator credentials are stored in the ignored
`.demo-credentials.json`. SQLite data, credentials, and runtime files stay local.
Email uses the log driver, so the demo does not send external email.

## Run

```powershell
./dev/start.ps1
```

The script uses the portable PHP runtime in `../.runtime/php` if available,
otherwise PHP from PATH. Alternatively:

```sh
php -S 127.0.0.1:8888 -t public dev/router.php
```

This is a local development server. The included GDPR extension supports account
anonymization; anonymous posting is a separate feature and is not installed.
Automatic GDPR jobs require the scheduler. For local manual testing:

```sh
php flarum schedule:run
```

## Example discussions

With the server running, use Node.js 18+ to create three categories, six Chinese
discussions, replies, and one anonymized demo author:

```sh
node dev/seed.mjs
```

Run this only on a newly installed, empty demo. The marker prevents repeat runs
after a successful seed; a failed partial seed requires a fresh empty demo.
