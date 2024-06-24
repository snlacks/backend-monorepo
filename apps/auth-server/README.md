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
AUTH_DOMAIN="localhost"
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

## License

This is [MIT licensed](LICENSE).
