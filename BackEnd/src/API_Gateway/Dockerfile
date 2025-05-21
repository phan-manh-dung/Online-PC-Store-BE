FROM node:18.20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# EXPOSE 5555
EXPOSE 8080

ENV NODE_ENV=production

CMD ["npm", "start"]