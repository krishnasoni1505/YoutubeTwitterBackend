# 🎬 MegaBackend (YouTube Clone Backend)

This is a YouTube-inspired backend built with **Node.js**, **Express.js**, and **MongoDB**. It supports video uploads, user authentication, channel management, and image hosting with **Cloudinary**. Designed following MVC principles and built to be scalable, this project can be the foundation for a full-fledged video platform.

---

## 📌 Features

- 🔐 User Authentication (JWT-based)
- 👤 Channel Profile & Cover Image Uploads (Multer + Cloudinary)
- 🎥 Video Upload APIs
- 🧾 RESTful API design
- 🧠 MongoDB database modeling (Mongoose)
- 📦 Scalable MVC folder structure
- 🔒 Password hashing with bcrypt
- 🔁 Paginated data fetching
- 🌐 CORS and cookie-based session handling

---

## 🗂 Folder Structure

```
src/
├── controllers/        # Route logic and business controllers
├── db/                 # MongoDB connection
├── middlewares/        # Multer config, auth middleware
├── models/             # MongoDB schemas via Mongoose
├── routes/             # API routing layer
├── utils/              # Cloudinary config, helpers
├── app.js              # Express app setup
├── constants.js        # Reusable constants
└── index.js            # Server entry point

.env                    # Environment variables
```

---

## ⚙️ Tech Stack

| Layer         | Technology                         |
|---------------|-------------------------------------|
| Server        | Node.js, Express.js                 |
| Database      | MongoDB, Mongoose                   |
| Auth          | JWT, bcrypt                         |
| File Uploads  | Multer, Cloudinary                  |
| Dev Tools     | Nodemon, Prettier                   |

---

## 📦 Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/your-username/megabackend.git
cd megabackend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory and add:
```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGODB_URI=your_mongodb_uri

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

```

4. **Run in development mode:**
```bash
npm run dev
```

---

## 📁 API Overview

> Base URL: `http://localhost:8000/api/v1`

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| POST   | /users/register    | Register new user              |
| POST   | /users/login       | Login and receive JWT          |
| POST   | /videos/upload     | Upload a video                 |
| GET    | /videos            | Fetch paginated videos         |
| POST   | /users/profile     | Upload profile & cover image   |

> Full API docs coming soon...

---

## 🧑‍💻 Developer Info

**Author:** Krishna Soni  
**Version:** 1.0.0  
**License:** ISC  
**Keywords:** `Node.js`, `Express`, `Multer`, `Cloudinary`, `JWT`, `MongoDB`, `YouTube Clone`

---

## 🌐 Future Improvements  
- ✅ Well developed frontend

---

## 🫱🏼‍🫲🏼 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

---