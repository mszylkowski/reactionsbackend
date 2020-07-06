# Interactives server

Server to be used in conjunction with the development of AMP Story interactive elements.
Only use in development, never in production.

> Note: API not final

## Install and run

Requires NPM installed.

Execute:

```bash
npm install
node server.js
```

## Debug

Open [localhost:3000](http://localhost:3000)

The root will contain a list of all the current interactiveIds and votes for each option. Also there is a button to fake votes to start with a random amount of votes on each option of an initialized interactiveId. This will reset the *real* votes and add fake clientIds to each option randomly.