# Support Chat

This project consists of:

- **Angular** frontend
- **Express** backend (Node.js)
- **MongoDB** database

---

## Prerequisites

- [Node.js](https://nodejs.org/)
- [Angular CLI](https://angular.dev/tools/cli)

  ```bash
  npm install -g @angular/cli
  ```

- [MongoDB](https://www.mongodb.com/try/download/community) (local or cloud with [MongoDB Atlas](https://www.mongodb.com/atlas))

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/paragdeka/support-chat
cd support-chat
```

### 2. Install dependencies

- **Backend (Express + Mongoose)**

  ```bash
  cd server
  npm install
  ```

- **Frontend (Angular)**

  ```bash
  cd client
  npm install
  ```

---

## Development

### MongoDB

Use **MongoDB Atlas** connection string.

- [Setup mongodb atlas](https://www.youtube.com/watch?v=jXgJyuBeb_o)

Or start mongodb locally

- [Setup mongodb locally](https://www.linkedin.com/pulse/comprehensive-guide-setting-up-mongodb-locally-macos-parasuraman-vulrc)

### Backend (Express + MongoDB)

- Add **server/.env** with your MongoDB URI:

  ```
  MONGO_URI=mongodb://localhost:27017/support-chat
  ```

- Run backend:

  ```bash
  cd server
  npm run dev
  ```

### Frontend (Angular)

- Run frontend:

  ```bash
  cd client
  ng serve
  ```

- App runs at: `http://localhost:4200`
- API runs at: `http://localhost:4000`

# Testing the App

1. Open the frontend in your browser: http://localhost:4200
2. You will see the Login Page.
3. Click the Signup link on the login page.
4. Create a Support Agent account.
5. After logging in, click "Simulate Chat" to start chatting as a customer or directly go to http://localhost:4200/chat
