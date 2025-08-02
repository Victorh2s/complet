FROM --platform=linux/amd64 node:22.17.1

WORKDIR /home/api

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 8080
