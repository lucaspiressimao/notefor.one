FROM node:15.14.0

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV PORT=80
ENV HOST=0.0.0.0
ENV TZ America/Sao_Paulo
ENV ALGORITHM=aes-256-ctr

EXPOSE 80
CMD [ "node", "src/index.js" ]