# Étape 1 : Construction de l'application
FROM node:20.13.1 AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install --legacy-peer-deps

# Copier le reste des fichiers de l'application
COPY . .

# Construire l'application Next.js
RUN npm run build

# Étape 2 : Exécution de l'application
FROM node:20.13.1 AS runner

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers construits depuis l'étape de construction
COPY --from=builder /app ./

# Exposer le port sur lequel l'application va écouter
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]
