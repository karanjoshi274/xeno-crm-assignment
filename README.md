# Xeno CRM Mini Platform

## Overview

This project is a mini CRM platform for creating targeted campaigns. It includes:
- **Data Ingestion APIs**: Upload customer and order data (secured, with JWT).
- **Campaign Segmentation UI**: Define campaigns using a dynamic rule builder (e.g., age > 30 AND city = "NY").
- **Audience Preview**: See how many customers match the rules before creating the campaign.
- **Campaign Delivery Simulation**: On saving a campaign, messages are "sent" to the audience (90% success).
- **AI-driven Insights**: The UI shows generated message suggestions (based on objective) and a performance summary.
- **Authentication**: Google OAuth login; only logged-in users can manage campaigns.

## Tech Stack

- **Frontend**: React.js, React Router, Axios, `@react-oauth/google` for Google Login.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT.
- **Deployment**: (Suggested) Render or Heroku for backend; Vercel for frontend.

## Setup & Run

### Prerequisites
- Node.js installed.
- MongoDB instance (local or Atlas).
- Google OAuth Client ID (setup Google Cloud project with OAuth credentials for `http://localhost:3000`).

### Backend
1. Clone repo and navigate to `server/`.
2. Copy `.env.example` to `.env` and fill in:
