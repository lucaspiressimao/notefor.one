# notefor.one

A small application written in Node/Express on the server and vanilla javascript on the client. It allows you to send encrypted one-time-use messages to someone via unique URL's that are generated on the server - once someone views the note, the note is destroyed.

made from https://github.com/joshterrill/hushnote

## API Endpoints

### POST `/api/create/`

```
Headers: Content/Type = application/json
Body: {"note": "this is a test message"}
------------------------------------------
Success Response:
{
  "url": "http://localhost:3000/read/40312d32/160586e0",
  "error": null
}
```

### GET `/api/read/:key/:pass`

```
Success Response:
{
  "note": "this is a test message",
  "message": "Note has been destroyed."
}

Note Not Found Response:
{
  "note": null,
  "message": "Could not find note, perhaps it has already been destroyed?"
}

Incorrect Pass Response:
{
  "note": null,
  "message": "Incorrect URL parameters. Note has been destroyed."
}
```

## Spinning up your own instance

1. Install dependencies by typing `npm install`

2. Rename the `.env.example` file to be `.env`

3. In order for the server-side encryption and decryption to work correctly, an IV needs to be generated. This is a 16-character string that looks something like this: `f8b43da1eb3cc7c5` which is the example that was put inside of the `.env.example` file. If you would like to generate your own, you can do so by running: `node generate-iv.js`

4. Type `npm start` to run

## Docker

To use Docker image we will need to set:
1 - IV=<the IV code 16 digit -> generated with `node generate-iv.js`>
2 - SECRET=<32 digit pass phrase>
3 - PUBLIC_URL=http://localhost:3000 <use yout custom domain if needed>

``` docker run -d -e IV=97c13107fcbc9a67 -e SECRET=84b816f85bf46ced22c9c55cd5067c45 -e PUBLIC_URL=http://localhost:3000 -p 3000:80 lucaspiressimao/notefor.one:latest ```

This will set IV and secret to your image and set public url to localhost (CHANGE IT FOR OTHER ENVIRONMENTS)

It will acessible from http://localhost:3000