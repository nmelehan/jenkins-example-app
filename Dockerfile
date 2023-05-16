FROM node:6-alpine

RUN mkdir -p /home/node/example-app/
WORKDIR /home/node/example-app/

COPY package.json /home/node/example-app/
RUN npm install

COPY index.js /home/node/example-app/

EXPOSE 3000

CMD ["node", "index.js"]
