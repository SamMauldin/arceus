FROM node:16.9.0-stretch

WORKDIR /usr/src/app

COPY package-lock.json ./
COPY package.json ./
RUN npm ci

COPY prisma .
RUN npx prisma generate

COPY . .

RUN npm run build

EXPOSE 3000

CMD [ "npm", "start" ]
