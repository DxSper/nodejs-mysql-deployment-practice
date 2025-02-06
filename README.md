**Crée une app js qui communique avec DB**

    const express = require('express');
    const mysql = require('mysql2');
    require('dotenv').config(); // Ensure you have dotenv installed if you're using a .env file
    
    const app = express();
    const port = 3000;
    
    const dbConfig = {
      host: process.env.DB_HOST, // Use environment variables
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    };
    
    let db; // Declare db variable here
    let connectionAttempts = 0;
    const maxAttempts = 3;
    const retryDelay = 10000; // 10 seconds
    
    function connectToDatabase() {
      db = mysql.createConnection(dbConfig); // Initialize db connection
    
      db.connect((err) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          connectionAttempts++;
          if (connectionAttempts < maxAttempts) {
            console.log(`Retrying connection in ${retryDelay / 1000} seconds...`);
            setTimeout(connectToDatabase, retryDelay);
          } else {
            console.error('Failed to connect to the database after 3 attempts.');
          }
        } else {
          console.log('Connected to the MySQL database.');
        }
      });
    }
    
    connectToDatabase();
    
    app.get('/data', (req, res) => {
      db.query('SELECT * FROM users', (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      });
    });
    
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

**Dockeriser mon APP** 
. Lancer un conteneur MySQL

   
    
      docker run --name mysql-container -e MYSQL_ROOT_PASSWORD=your_password -d -p 3306:3306 mysql:latest

2. Se connecter à MySQL



    docker exec -it mysql-container mysql -u root -p

Entrez le mot de passe que vous avez défini (your_password).
3. Créer une base de données et une table



    CREATE DATABASE test_db;
    USE test_db;
    
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE
    );

4. Insérer des données dans la table



    INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
    INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');

5. Créer le fichier Dockerfile pour l'application Node.js

>     dockerfile
>     
>     # Utiliser l'image officielle de Node.js comme image de base
>     FROM node:20
>     
>     # Définir le répertoire de travail dans le conteneur
>     WORKDIR /usr/src/app
>     
>     # Copier le fichier package.json et package-lock.json
>     COPY package*.json ./
>     
>     # Installer les dépendances
>     RUN npm install
>     
>     # Copier le reste de l'application
>     COPY . .
>     
>     # Exposer le port sur lequel l'application écoute
>     EXPOSE 3000
>     
>     # Commande pour démarrer l'application
>     CMD ["node", "app.js"]

*6. Créer le fichier .dockerignore*

    node_modules npm-debug.log

*7. Construire l'image Docker pour l'application Node.js*

    docker build -t my-node-app .

*8. Exécuter le conteneur de l'application Node.js*

docker run -p 3000:3000 --name my-node-container --link mysql-container:mysql my-node-app

**Pousser l'image sur docker hub**
crée un compte sur docker hub
dans le terminal

    docker login
    docker tag my-node-app dockdesper/my-node-app:latest
    docker push my-node-app dockerdesper/my-node-app:latest
    https://hub.docker.com/r/dockdesper/my-node-app

**Crée un docker compose pour faire tourner mon app** 

 - Récupéré l'image my-node-app
 - Supprimer my-node-app:latest
 - Supprimer le container mysql mais pas les données
 - Lancer l'image
 - Récupéré l'image de Mysql
 - Lancer la DB et recupéré les data

```yaml
version: '3.8'

services:

  app:
    image: dockdesper/my-node-app:latest
    ports:
      - "3005:3000"
    depends_on:
      - mysql
    env_file:
      - .env

  mysql:
    image: mysql:5.7
    ports:
      - "3306:3306"
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}  # Utilise la variable d'environnement pour le mot de passe root
      MYSQL_DATABASE: ${DB_NAME}  # Utilise la variable d'environnement pour le nom de la base de données
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

il faut crée un fichier .env 


supprimer le my-node-app

    docker rmi my-node-app:latest

Supprimer le conteneur MySQL sans supprimer les données :

    docker stop mysql-container
    docker rm mysql-container

lancer le docker compose:

    docker-compose up -d

On retrouve bien les infos de la DB sur le serveur node js.


Transformer mon compose en service linux --

    nano my-node-app.service

    [Unit]
    Description=My Node.js App
    After=docker.service
    Requires=docker.service
    
    [Service]
    Restart=always
    ExecStart=/usr/local/bin/docker-compose -f /root/Documents/ex2docker/docker-compose.yml up
    ExecStop=/usr/local/bin/docker-compose -f /root/Documents/ex2docker/docker-compose.yml down
    WorkingDirectory=/root/Documents/ex2docker
    User=root
    Group=root
    
    [Install]
    WantedBy=multi-user.target

Deplacer le fichier service dans le dossier service 
```bash
/etc/systemd/system/
```
```bash
sudo systemctl daemon-reload
```
```bash
sudo systemctl start my-node-app
```
Tout automatiser avec github et github action (déploiement compris)  CIA :
crée un dossier .github/workflows via l'interface web de github

    name: CI/CD Pipeline
    
    on:
      push:
        branches:
          - main 
    
    jobs:
      build:
        runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build Docker image
        run: docker build -t dockdesper/my-node-app:latest .

      - name: Push Docker image
        run: docker push dockdesper/my-node-app:latest

      deploy:
        runs-on: ubuntu-latest
        needs: build

    steps:
      - name: Checkout code
        uses: actions/checkout@v4


Le workflow push bien sur Docker Hub. 

TO-DO:
WASHTOWER pour effectuée des actions autos sur le serveurs
