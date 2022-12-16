## Initial Setup Instructions

Make a copy of `.env.example` under the`server`, and name it `.env`:

```
cd server
cp .env.example .env
```

In `.env`, fill in the fields for `CLIENT_ID` and `CLIENT_SECRET` with your
PetFinder API key and secret.

Once you've done that, install the dependencies for the server:

```
# assuming you're in the server directory:
npm install
```

## Run the application

Start the application in development mode

```
# assuming you're in the server directory:
npm run dev
```
