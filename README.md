# SignChat-Backend 

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#introduction">Introduction</a></li>
        <li><a href="#technologies">Technologies</a></li>
        <li><a href="#architecture">Architecture</a></li>
        <li><a href="#api-documentation">API Documentation</a></li>
      </ul>
    </li>
    <li>
      <a href="#get-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#project-configuration">Project Configuration</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#build-docker-images">Build Docker Images</a></li>
        <li><a href="#run-project-with-docker-compose">Run Project with Docker Compose</a></li>
        <li><a href="#logs-and-debugging">Logs and Debugging</a></li>
      </ul>
    </li>
  </ol>
</details>

## **About The Project**

### Introduction
There is a big problem today: deaf and non-deaf people often struggle to communicate.
This project aims to bridge this communication gap by developing a mobile application that incorporate an advanced sign language recognition algorithm, translating gestures into speech, and vice versa, making communication truly inclusive. By addressing this unmet need, we are not just enhancing accessibility but fostering a more connected and empathetic world.

The project consists of two main repositories:

<!-- TODO: change link when repositories uploaded to Team -->
- __[SignChat-backend](https://github.com/Davide-Natale/SignChat-backend.git)__ - A backend architecture managed through **Docker Compose**

- __[SignChat-frontend](https://github.com/Davide-Natale/SignChat-frontend.git)__ - A **React Native** mobile application written in **Typescript** based on **Expo**

### Technologies
The technologies used to develop this project are:
- `React Native(Expo)` → Mobile Application
- `Node.js + Express` → Backend API + Media Server
- `PostgreSQL + Redis` → Database
- `Python` → Translating microservices
- `Docker` → Orchestration

### Architecture
The backend system architecture is composed of the following 5 Docker container managed through Docker Compose:

1. `Node container`: this container is used to run a Node.js server which exposes RESTful API, manage video call signaling through WebSocket and handle video call stream using Mediasoup

2. `Postgres container`: it contains a PostgreSQL database used to save users data

3. `Redis container`: it contains a Redis database used to save temporarly blacklisted JWT token

4. `Video translator container`: it contains a microservice Python listening on a TCP socket. It comunicate with Node.js server through FFmpeg process istances to process video stream and traslate gesture into audio using an AI algorithm

5. `Audio translator container`: it contains another microservice Python listening on a TCP socket. It also comunicate with Node.js server through FFmpeg process instances to process audio stream and translate in into pose

### API Documentation
The RESTful API exposed by the Node.js server are documented following the Swagger/OpenAPI standard. After starting Node.js server (via Docker or locally), the API documentation is available at:

```
http://localhost:3000/api-docs
```

## **Get Started**

### Prerequisites
Before running the project, make sure the following requirements are met:

- **[Node.js](https://nodejs.org/)** (v22+), used to generate JWT secrets

- **[Docker & Docker Compose](https://www.docker.com/get-started/)**, required to 
build, run and orchestrate backend services in isolated containers

- A **[Firebase Project](https://firebase.google.com/)**, used for cloud messaging

- A **[Supabase Project](https://supabase.com/)**, rquired for cloud storage

- A **[Nodemailer](https://nodemailer.com/usage/using-gmail/)** configuration based on Gmail and [App Password](https://support.google.com/mail/answer/185833?hl=it), used to send email from Node.js server

### Project Configuration
Before using this project, make sure to configure it properly by following the instructions below:

1. **Clone the repository**
    ```
    git clone https://github.com/Davide-Natale/SignChat-backend.git
    cd SignChat-backend
    ```

2. **Add Firebase Service Account Key**  
    In order to send push notification from Node.js server using FCM, you need to generate a Service Account Key:
    - Go to the **[Firebase Console](https://console.firebase.google.com/)**
    - Select your project and navigate to **Project Settings**
    - Move to the **Service accounts** tab
    - Click **Generate new private key**, this will download a `JSON` file
    - Rename the file to `service-account-key.json`
    - Move it to the **root directory** of the project

3. **Add APK file**  
    In order to be able to expose mobile APK file from backed through a RESTful API:
    - Create a folder named `downloads` in the root directory of the project
    - Place the latest APK file in it, the file must be   named `SignChat-latest.apk`.  
      You can follow the instructions to generate the APK build described in the **[README](https://github.com/Davide-Natale/SignChat-frontend#get-started)** file of the SignChat-fronted repository
      <!-- TODO: change link once new README created -->

4. **Environment variables configuration**  
    Create a `.env` file in the root directory of the project based on the template below:

    ```
    # Server settings
    PORT=3000
    SERVER_IP=your_local_ip_address

    # Redis configuration
    REDIS_HOST=redis
    REDIS_PORT=6379
    REDIS_USER=default
    REDIS_PASSWORD=your_redis_password

    # PostgreSQL configuration
    POSTGRES_DB=signchat
    POSTGRES_USER=your_database_user
    POSTGRES_PASSWORD=your_database_password
    POSTGRES_HOST=postgres

    # JWT secrets
    JWT_SECRET=your_jwt_secret_key
    JWT_REFRESH_SECRET=your_jwt_refresh_secret_key

    # Email credentials for Nodemailer
    EMAIL_SERVICE=gmail
    EMAIL_USER=your_email_address
    EMAIL_PASSWORD=your_email_app_password

    # Supabase configuration
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    SUPABASE_BUCKET=your_supabase_bucket_name
    ```

5. **JWT secrets generation**  
    To generate strong and secure JWT secrets for your application, run the following script included in the project:
    ```
    node ./utils/generateJwtSecrets.js
    ```
    This will generate and print two secure random strings to be used as:
    - `JWT_SECRET`
    - `JWT_REFRESH_SECRET`
    Copy and paste them into your `.env` file accordingly

6. **Supabase Configuration**  
   To enable image upload and access through Supabase Storage, follow the steps below:
    1. **Create a Public Bucket**
        - Go to the **[Supabase Dashboard](https://app.supabase.com/)**
        - Select your project
        - Navigate to **Storage** > **Buckets**
        - Click **New Bucket**
        - Name it (e.g., `uploads`)
        - Enable **Public bucket** option
    2. **Get Supabase Credentials**
        - From the Dashboard, go to **Project Settings**
        - Copy the following values:
          - `Project URL` from **Data API** tab → `SUPABASE_URL`
          - `Service role key` from **API Keys** tab → `SUPABASE_SERVICE_ROLE_KEY`
        - Use the bucket name you created as `SUPABASE_BUCKET`

        Make sure to insert these values into your `.env` file as shown in point 4.

## **Usage**
In order to run and manage the project using Docker Compose, please refer to the commands described below:

### Build Docker Images
Before running the containers, build the images with:
```
docker compose build
```

### Run Project with Docker Compose

- Start all services in detached mode (using the pre-built images):
  ```
  docker compose up -d
  ```
  NB: this command must be used to create or recreate Docker container after new images are built

- Stop running containers without removing them:
  ```
  docker compose stop
  ```

- Start stopped containers again:
  ```
  docker compose start
  ```

- Stop and remove containers, networks and volumes:
  ```
  docker compose down
  ```

### Logs and Debugging

- View logs of all services:
  ```
  dockers compose logs -f
  ```

- View logs of a specific service (e.g., node):
  ```
  docker compose logs -f <service_name>

<p align="right">
  <a href="#top">
    <img src="assets/icons/arrow-up-circle.svg" alt="Back to top" style="width: 20px; height: 20px;">
  </a>
</p>