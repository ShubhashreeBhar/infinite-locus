# 🚀 Crowdsourced Review Platform

A modern, full-stack web application for discovering and reviewing local businesses. This project features a React-based frontend and a PostgreSQL backend with automated rating calculations.

## ✨ Key Features
- **Business Directory**: Browse and search businesses by category.
- **Rating System**: Real-time star ratings and detailed reviews.
- **Admin Dashboard**: Specialized tools for listing management.
- **Responsive UI**: Fully mobile-friendly design using Tailwind CSS.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: PostgreSQL (InsForge), Row-Level Security (RLS)
- **Database Logic**: SQL triggers for automated rating aggregation.

## ⚙️ Setup
1. Clone the repository: `git clone https://github.com/ShubhashreeBhar/feedtrust.git`
2. Install dependencies: `npm install`
3. Configure environment: Create a `.env` file with your `VITE_INSFORGE_URL` and `VITE_INSFORGE_ANON_KEY`.
4. Run development server: `npm run dev`