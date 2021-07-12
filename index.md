## Welcome to notefor.one

A small application written in Node/Express on the server and vanilla javascript on the client. It allows you to send encrypted one-time-use messages to someone via unique URL's that are generated on the server - once someone views the note, the note is destroyed.

made from https://github.com/joshterrill/hushnote

### Spinning up your own instance

Install dependencies by typing npm install

Rename the .env.example file to be .env

In order for the server-side encryption and decryption to work correctly, an IV needs to be generated. This is a 16-character string that looks something like this: f8b43da1eb3cc7c5 which is the example that was put inside of the .env.example file. If you would like to generate your own, you can do so by running: node generate-iv.js

Type npm start to run

### Docker

To use Docker image we will need to set: 1 - IV=<the IV code 16 digit -> generated with node generate-iv.js> 2 - SECRET=<32 digit pass phrase> 3 - PUBLIC_URL=http://localhost:3000

docker run -d -e IV=97c13107fcbc9a67 -e SECRET=84b816f85bf46ced22c9c55cd5067c45 -e PUBLIC_URL=http://localhost:3000 -p 3000:80 dooloop/notefor.one:latest

This will set IV and secret to your image and set public url to localhost (CHANGE IT FOR OTHER ENVIRONMENTS)

It will acessible from http://localhost:3000

Your Pages site will use the layout and styles from the Jekyll theme you have selected in your [repository settings](https://github.com/lucaspiressimao/notefor.one/settings/pages). The name of this theme is saved in the Jekyll `_config.yml` configuration file.

### Support or Contact

Having trouble with Pages? Check out our [documentation](https://docs.github.com/categories/github-pages-basics/) or [contact support](https://support.github.com/contact) and we’ll help you sort it out.
