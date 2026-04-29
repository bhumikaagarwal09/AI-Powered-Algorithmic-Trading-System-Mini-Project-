# 🚀 AI-Powered Algorithmic Trading System

A **full-stack, AI-driven trading platform** that automates stock analysis and decision-making using real-time market data and intelligent models. Built on a **MERN stack architecture**, the system acts as a **real-time decision engine** delivering **AI-assisted trading insights** for smarter trading across global markets.

---

## 🚀 Project Overview

The AI-Powered Algorithmic Trading System enables users to track and analyze stocks from **NSE (India)** and **NASDAQ (US)** through an automated workflow powered by artificial intelligence.

Users can define trading strategies such as **buy price, target profit, and holding duration**. The system continuously monitors market data, evaluates it using AI, and generates actionable signals: **BUY**, **SELL**, or **HOLD**.

The primary goal is to eliminate emotional bias and enable **disciplined, data-driven trading decisions**.

---

## ✨ Key Features

- ⚡ Automated stock monitoring across NSE & NASDAQ  
- 🧠 AI-powered recommendations using Google Gemini AI  
- 📊 Real-time decision engine for continuous evaluation  
- 🎯 Custom trading conditions (target, buy price, duration)  
- 🔔 Email alerts for instant action  
- 🔐 Secure authentication (JWT + OAuth)  
- 🔁 Background automation using cron jobs  
- 🏗️ Full-stack scalable MERN architecture  

---

## 🧠 How It Works

1. **User Input**
   - Select stock (NSE/NASDAQ)
   - Define trading parameters

2. **Real-Time Data Fetching**
   - System retrieves live stock data using APIs

3. **AI Processing**
   - Google Gemini AI analyzes trends and conditions

4. **Decision Engine**
   - Generates BUY / SELL / HOLD recommendation

5. **Automation Layer**
   - Cron jobs continuously monitor market changes

6. **Notification System**
   - Email alerts are sent for actionable signals

---

## 🏗️ Tech Stack

### Backend
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  

### Authentication
- jsonwebtoken (JWT)  
- passport-google-oauth20  
- bcryptjs  

### AI & Intelligence
- @google/generative-ai (Google Gemini AI)  
- groq-sdk  

### Automation & Services
- node-cron  
- nodemailer  
- axios  

---

## ⚙️ System Architecture

The backend follows a **modular and scalable architecture**:

- **Routes Layer** → Handles API endpoints  
- **Middleware Layer** → Authentication and validation  
- **Services Layer** → Business logic (AI, trading, email)  
- **Jobs Layer** → Automated monitoring using cron  
- **Database Layer** → MongoDB with Mongoose models  

This ensures **clean separation of concerns** and scalability.

---

## 📊 AI Integration

The system integrates **Google Gemini AI** to provide intelligent decision-making:

- Analyzes real-time stock data  
- Evaluates trends and conditions  
- Generates contextual trading signals  

This enables **AI-assisted trading insights** beyond static rule-based systems.

---

## 📈 Trading Logic

The decision engine combines **user-defined rules + AI analysis**:

- **BUY** → When price meets entry conditions and AI signals growth  
- **SELL** → When target is reached or AI predicts decline  
- **HOLD** → When conditions are neutral or uncertain  

---

## 🔔 Notification System

- Email alerts powered by **nodemailer**  
- Triggers:
  - BUY opportunities  
  - SELL signals  
  - Target achievement  
- Eliminates need for constant manual monitoring  

---

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd <project-folder>/server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the `server/` directory.

### 4. Run the Server
```bash
npm run dev
```

Server runs at: `http://localhost:5000`

---

## 🔑 Environment Variables

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# AI Keys
GOOGLE_AI_API_KEY=your_google_gemini_key
GROQ_API_KEY=your_groq_key

# Email Configuration
EMAIL_USER=your_email
EMAIL_PASS=your_email_password

# OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## 📌 API Integration

The system integrates external APIs for:

- 📊 Real-time stock price tracking  
- 🌍 Market coverage:
  - NSE (India)  
  - NASDAQ (US)  

Data is fetched using `axios` and processed through the AI pipeline.

---

## 🧪 Future Enhancements

- 📉 Advanced indicators (RSI, MACD, Bollinger Bands)  
- 📊 Analytics dashboard with visual insights  
- 🤖 Automated trade execution (broker integration)  
- 📱 Mobile push notifications  
- 🧠 AI improvements using historical learning  
- 🌐 Portfolio tracking system  

---

## 💼 Why This Project Stands Out

- Demonstrates end-to-end MERN development  
- Integrates real-world AI (Google Gemini)  
- Implements automation + APIs + scalable backend design  
- Solves a real-world financial use case  
- Highlights strong system architecture and decision engine design  

---

## 🤝 Contribution Guidelines

1. Fork the repository  
2. Create a feature branch  
```bash
git checkout -b feature/your-feature-name
```
3. Commit changes  
```bash
git commit -m "Add your feature"
```
4. Push and open a Pull Request