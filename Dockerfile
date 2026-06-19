# --- Étape 1 : build de l'app Angular (console vendeur) ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# Build de production (utilise environment.prod.ts -> gateway http://localhost:3000).
RUN npm run build

# --- Étape 2 : service statique via nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/vendors/browser /usr/share/nginx/html
EXPOSE 80
