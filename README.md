# 🌍 TravelRover

A modern travel planning application built with **React frontend** and **Django backend**, featuring real-time **flight search**, **secure booking management**, and **user authentication**.

---

## 📸 Demo & Screenshots

> (CURRENTLY BUILDING IT)

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [⚙️ Configuration](#-configuration)
- [🏃‍♂️ Running the Application](#-running-the-application)
- [🐛 Troubleshooting](#-troubleshooting)
- [📜 License](#-license)

---

## ✨ Features

- 🔍 **Flight Search** – Search and browse flights with **Google Places API**
- 📅 **Booking Management** – Create, update, and cancel bookings
- 👤 **User Authentication** – Secure JWT-based auth with Django
- 🎨 **Modern UI** – Responsive **Tailwind CSS** design for a clean, mobile-first experience
- 🔔 **Smart Notifications** – Toast alerts so you’re always in the loop
- 📱 **Mobile-friendly** – Seamless view across devices

---

## 🛠 Tech Stack

### Frontend

- ⚛️ **React 18** (with Hooks & Context)
- ⚡ **Vite** – next-gen frontend tooling
- 🎨 **Tailwind CSS** – utility-first styling
- 🧭 **React Router** – smooth navigation
- 🎛️ **React Select** + **React Icons** – polished UI components
- 🔔 **Sonner** – toast notifications

### Backend

- 🐍 **Django** – robust Python web framework
- 🛠 **Django REST Framework** – for clean REST APIs
- 🗄 **SQLite** (development DB, easy to upgrade to Postgres/MySQL)
- 🌍 **django-cors-headers** – cross-origin handling

---

## 📋 Prerequisites

Make sure you’ve got these installed:

- **Node.js** (v16 or higher) → [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) → [Download](https://www.python.org/)
- **npm** or **yarn** – package manager of choice
- **Git** – version control

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/JamirBasa/TravelRover.git
cd TravelRover
2. Frontend Setup
Bash

# Install frontend dependencies
npm install  # or yarn install
3. Backend Setup
Bash

cd travel-backend

# Virtual environment
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# (Optional) Create superuser
python manage.py createsuperuser
⚙️ Configuration

🔐 Environment Variables

**Frontend (.env.local):**

Create a `.env.local` file in the root directory with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google APIs
VITE_GOOGLE_PLACE_API_KEY=your_google_places_api_key
VITE_GOOGLE_GEMINI_AI_API_KEY=your_google_gemini_api_key

# Backend API
VITE_API_BASE_URL=http://localhost:8000
```

**Backend (travel-backend/.env):**

Create a `.env` file in the `travel-backend` directory with:

```env
# Django Configuration
SECRET_KEY=your_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# External APIs
SERPAPI_KEY=your_serpapi_key
```

**⚠️ Security Note:** Never commit your `.env` files to version control. Use the provided `.env.example` files as templates.
🏃‍♂️ Running the Application
Backend
Bash

cd travel-backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
python manage.py runserver
👉 Runs at: http://localhost:8000

Frontend
Bash

cd TravelRover
npm run dev   # or yarn dev
👉 Runs at: http://localhost:5173

🐛 Troubleshooting
CORS errors?
Double-check ALLOWED_HOSTS in Django and the frontend VITE_API_BASE_URL.

Google Places not working?
Ensure the API key is enabled for Places API under GCP.

Database locked error in SQLite?
Stop other Django processes or switch to Postgres for production.


📜 License
MIT License © 2025 TravelRover Team



```
