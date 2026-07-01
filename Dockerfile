FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Usar el script del package.json
RUN npm run prisma:generate

COPY . .

# ---------- Desarrollo ----------
FROM node:20-alpine AS runner

WORKDIR /app

# Instalar nodemon para hot-reload
RUN npm install -g nodemon

# Copiar dependencias
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copiar código fuente (bind mount lo sobreescribirá)
COPY . .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
