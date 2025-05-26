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
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#project-configuration">Project Configuration</a></li>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
    </li>
  </ol>
</details>



### 🧭 Introduction

### 🛠️ Technologies

### 🏗️ Architecture

### 📑 API Documentation

## 🚀 Getting Started

### ⚙️ Prerequisites

### 🧾 Project Configuration

## ▶️ Usage

## ✨ About the project ✨ 
The project's goal is to develop a system that utilizes smart city technology to recognize emergency signals and alert the relevant authorities. 

The key contribution of this proposal is the development of a platform that can identify gestures like the "Signal for Help" in real-time using surveillance systems. 

After detection, law enforcement is automatically notified to provide real-time assistance. Consideration is given to developing a support application for mobile devices, allowing nearby security or police
services to be promptly alerted.

The project consist of two main repositories :
- __[SignChat-Backend](https://nodeca.github.io/pica/demo/)__ - A backend architecture managed through **Docker Compose**
- __[SignChat-Frontend](https://nodeca.github.io/pica/demo/)__ - A **React Native** mobile application written in **Typescript** based on **Expo**



___

### System Requirement and Installation
To install and use it from your machine make sure you have
- **Node.js v16** installed 
- **Yeoman** generator installed: 

  ```bash
  npm i -g yo
  ```
  ```bash
  npm i -g generator-g-next
  ```

In order to connect to the db instances and all other services you also will need

- Some [MongoDB](https://www.mongodb.com/it-it) credentials
- A [Firebase SDK Admin](https://firebase.google.com/docs/admin/setup?hl=it#set-up-project-and-service-account) account for cloud messaging
- A [Nodemailer](https://nodemailer.com/usage/using-gmail/) configuration
- An [AWS Amplify](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html) account
  

### How to run S2Cities-Backend
First of all check your current version of Node.js (`node -v`).

Then:

1. Clone this project and open it within your favourite editor (I suggest you to use IntelliJIDEA tools)
2. Set up your keys - see the following section
3. Install node packages - `npm install`
4. Run the development server - `npm run dev`
5. Open [http://localhost:3000/admin-dashboard](http://localhost:3000/admin-dashboard) with your browser to see the result.


### .env file configuration
You can set up environment variables that are specific to your local machine by creating a new file 

`\.env.local`

in the root of the project.

Here is an example of essential declarations.

  ```bash
MONGODB_NAME= database-name-inside-mongodb
MONGODB_URI=mongodb+srv://username:password@cluster0.lcwvqcy.mongodb.net/?retryWrites=true&w=majority/$MONGODB_NAME
SECRET_KEY= your-mongodb-key
NEXT_PUBLIC_NODEMAILER= your-email-address
NEXT_PUBLIC_NODEMAILER_KEY= your-nodemailer-key
FIREBASE_ADMIN_PRIVATE_KEY_ID= your-firebase-key-id
FIREBASE_ADMIN_PRIVATE_KEY= your-firebase-key
FIREBASE_ADMIN_CLIENT_EMAIL= your-client-email
FIREBASE_ADMIN_CLIENT_ID= your-client-id
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL="https://www.googleapis.com/oauth2/v1/certs"
FIREBASE_ADMIN_CLIENT_X509_CERT_URL="https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tymt8%40s2cities.iam.gserviceaccount.com"
AWS_BUCKET_NAME= your-bucket-name
AWS_BUCKET_REGION="eu-north-1"
AWS_ACCESS_KEY= your-aws-key
AWS_SECRET_ACCESS_KEY= your-aws-secret-key
  ```


### How to tweak S2Cities-Backend
The easiest way to add components and classes to your directory is to follow the __[GeNYC](https://github.com/getapper/generator-g-next#readme)__ commands. 

```bash
yo g-next:page
```

To generate a new page.

```bash
yo g-next:comp
```

To generate a new component.

```bash
yo g-next:model
```

To generate a new model.

```bash
yo g-next:api
```

To generate a new api.

To learn more about GeNYG, take a look at the following resources:

- [GeNYG Documentation](https://github.com/getapper/generator-g-next#readme)
- [GeNYG Slides and Video Tutorial](https://docs.google.com/presentation/d/1pI6-jf8Zmr2pg9bcfOz29vhMZNqATOW7OwnHf3yRQck/edit#slide=id.p)


## About The Project