# 📹 House of Anbu - Real-Time Video & Chat Platform

> A high-concurrency video calling and messaging application built with Django Channels, WebRTC, and Redis. Engineered to handle sub-100ms latency for peer-to-peer communication.

![App Screenshot](Add_Your_Screenshot_Here)

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](YOUR_LIVE_LINK_HERE)
![Python](https://img.shields.io/badge/python-3.9-blue.svg)
![Django](https://img.shields.io/badge/django-4.0-green.svg)
![WebRTC](https://img.shields.io/badge/WebRTC-Realtime-orange.svg)
![Redis](https://img.shields.io/badge/Redis-Broker-red.svg)

## 📌 Project Overview
House of Anbu is a real-time communication suite inspired by WhatsApp. It solves the challenge of low-latency communication by utilizing **WebSockets** for chat and **WebRTC** for peer-to-peer video calls. The system uses **Redis** as a channel layer to handle concurrent WebSocket connections efficiently.

## 🚀 Key Features

### 💬 Real-Time Chat Architecture
* **WebSocket Delivery:** Instant message syncing using Django Channels (ASGI).
* **Event Broker:** Implemented **Redis** to manage WebSocket groups and message queues.
* **Status Tracking:** Real-time Online/Offline presence and "Typing..." indicators.
* **Read Receipts:** WhatsApp-style delivery status (Sent, Delivered, Read).

### 🎥 Video Calling (WebRTC)
* **Peer-to-Peer:** Direct media streaming between clients using Mesh architecture.
* **Signaling Server:** Custom Django implementation to exchange SDP and ICE candidates.
* **Call Logic:** Full cycle handling (Ringing, Connect, Mute, Disconnect).

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Django, Django REST Framework (DRF) |
| **Real-time** | Django Channels, WebRTC, Socket.io |
| **Database** | PostgreSQL (Indexed for chat history) |
| **Broker** | Redis (In-memory data structure store) |
| **Frontend** | React.js, Tailwind CSS |
| **Auth** | JWT (JSON Web Tokens) with OTP validation |

## 🔧 Installation & Setup

**Prerequisites:** Python 3.9+, Redis Server.

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/ANANDHURAI/House-of-Anbu-Realtime.git](https://github.com/ANANDHURAI/House-of-Anbu-Realtime.git)
    cd House-of-Anbu-Realtime
    ```

2.  **Create Virtual Environment**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```

3.  **Configure Environment Variables (.env)**
    *Create a file named `.env` in the root directory and add your secrets:*
    ```env
    SECRET_KEY=your_django_secret_key
    DEBUG=True
    DB_NAME=your_postgres_db
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

4.  **Run Services**
    ```bash
    # Start Redis (Required for Channels)
    redis-server

    # Run Django Server
    python manage.py runserver
    ```

## 👤 Author
**Anand Kumar** - *Independent Full Stack Developer*
