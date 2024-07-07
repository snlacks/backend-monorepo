![Coverage](https://raw.githubusercontent.com/wiki/snlacks/generative-ai-portal/coverage.svg)

# Generative AI Portal - It likes to call itself Whispy

How I got this name? I asked the chat server what it thought I should call the web gateway that authenticates its users and connects to it, it said to call it "The Web Wizard", "API Dialogist" or " Sparkly Listener"...

I pieced together some of my favorite suggestions to call it "Whispy - Generative AI Portal." I for one welcome our new AI overlords... I mean Whispy.

PLEASE don't just pull this and try to run this for your production server. Please. Please, you're welcome to take this code. It's just not vetted to be a production service. This is a one time password backend and AI chat gateway to an Ollama Server. It requries a login via SMS to access the chat, has basic plubming for roles (User and Admin are included, but it should be easy to add more) and generating tokens in dev environment.

To get this running:

**Requires environmental variables**

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME="some username"
DB_PASSWORD="some password"
DB_DATABASE="database name"
TWILIO_ACCOUNT_SID="some id"
TWILIO_AUTH_TOKEN="some key"
ONE_TIME_PASSWORD_SMS_SENDER_NUMBER="+1(863) 869-2119"
JWT_SECRET="some token"
JWT_EXPIRES="24h"
OLLAMA_URI="http://127.0.0.1:11434"
GMAIL_CREDENTIALS="_gmail_credentials.json"
GMAIL_TOKEN="_gmail_token.json"
GMAIL_SENDER="email@addre.ss"
```

**Requires token and credentials files in root for gmail client**
_gmail_\*.json

/auth/users, GET
/auth/users, POST
/auth/request-otp, POST
/auth/login, POST
/auth/login-password, POST
/auth/users/password, PUT
/auth/dev-token, POST
/auth/refresh, POST
/auth/sign-out, POST
/auth/users/:id, DELETE
/mail/healthcheck, POST

It uses external dependencies (each has a module): Ollama webservice, Twillio, and MySql. Because they're in OO/Nest Modules they should be really easy to replace with other external services.

Dependencies for auth server

MySQL database with a dedicated table
smtp
sms

Files listed in [system readme](/system/README.md) are the start of some automation, but I want to move the automated tasks into individual containers so perfomance isn't interfered with.

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