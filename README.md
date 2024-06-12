![Coverage](https://raw.githubusercontent.com/wiki/snlacks/generative-ai-portal/coverage.svg)

# Generative AI Portal - It likes to call itself Whispy

How I got this name? I asked the chat server what it thought I should call the web gateway that authenticates its users and connects to it, it said to call it "The Web Wizard", "API Dialogist" or " Sparkly Listener"...

I pieced together some of my favorite suggestions to call it "Whispy - Generative AI Portal." I for one welcome our new AI overlords... I mean Whispy.

PLEASE don't just pull this and try to run this for your production server. Please. Please, you're welcome to take this code. It's just not vetted to be a production service. This is a one time password backend and AI chat gateway to an Ollama Server. It requries a login via SMS to access the chat, has basic plubming for roles (User and Admin are included, but it should be easy to add more) and generating tokens in dev environment.

To get this running:

```bash
DB_USERNAME=*
DB_PASSWORD=*
DB_DATABASE=*
TWILIO_ACCOUNT_SID=*
TWILIO_AUTH_TOKEN=*
ONE_TIME_PASSWORD_SMS_SENDER_NUMBER=*
JWT_SECRET=*
JWT_EXPIRES=*
OLLAMA_URI=*
```

POST /auth/request-otp accepts password or phone number. If password and known device,
POST /auth/login
POST /auth/refresh (protected, self - returns user, updates token expire)
POST /auth/dev-token (protected, dev only)
POST /auth/sign-out (remove HTTP only cookie if it exists)
GET /auth/users (protected, role Admin)
POST /auth/users (reqires guest key, to limit public access)
PUT /auth/users/password
POST /ai-chat/chat-stream/

It uses external dependencies (each has a module): Ollama webservice, Twillio, and MySql. Because they're in OO/Nest Modules they should be really easy to replace with other external services.

## License

This is [MIT licensed](LICENSE).
