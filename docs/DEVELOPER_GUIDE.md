# TheoCompass: Developer Onboarding Guide

Welcome to the TheoCompass project! This document outlines the backend architecture, data flow, and current state of the application. 

## 1. High-Level Overview
TheoCompass is a highly nuanced theological alignment tool. Unlike standard personality quizzes, it calculates a user's alignment with over 230 Christian denominations based on 3 dimensions for every question:
1. **The Stance:** What they believe.
2. **Certainty (C):** How confident they are (0 to 3).
3. **Tolerance (T):** How they view Christians who disagree (0 to 4).

Because the math to calculate Euclidean distances across 120 questions for 230 denominations is highly complex, our backend is designed to run efficiently on Cloudflare Workers utilizing batched D1 SQLite queries.

## 2. Tech Stack
We are using a modern, serverless edge stack:
* **Frontend:** Next.js (React, Tailwind CSS, TypeScript).
* **Backend API:** Cloudflare Workers (TypeScript running on V8 Isolates at the edge).
* **Database:** Cloudflare D1 (Serverless SQLite).
* **Data Pipeline (ETL):** Node.js and Python scripts.

## 3. The Data Pipeline (How Data gets to the DB)
The "source of truth" for this project is a series of master CSV files managed by the domain expert. 
* **Step 1:** Raw CSVs containing questions, answers, and scoring matrices are edited.
* **Step 2:** `node build_precomputed.js` runs heavy mathematical models to cache dimension coordinates.
* **Step 3:** `python generate_sql_seed.py` merges everything into a massive `seed.sql` file.
* **Step 4:** The `seed.sql` file is executed against the Cloudflare D1 database via Wrangler.

## 4. Database Schema Summary
The D1 SQLite database contains several key tables:
* `questions`: Holds the question text and sequencing flags.
* `answer_options`: Holds the answers linked to `question_id`.
* `denominations`: Holds denomination metadata.
* `denomination_answers` / `denomination_selected_options`: Holds how every denomination effectively answered the quiz and their historical Certainty/Tolerance.
* `answer_scoring` / `hidden_dimensions`: The mathematical weights for the backend calculation engine.
* `denomination_compass_coordinates`: The precomputed dimensions for the results dashboard Scattermap.

## 5. The API (Cloudflare Worker)
The Worker (`theocompass-api/src/index.ts`) connects the Next.js frontend to the D1 database.
**Current Endpoints:**
* `GET /api/questions?mode=quick`: Dynamically fetches the quiz questions and nested answers based on the selected mode.
* `GET /api/coordinates`: Serves the precomputed dimensional data for the frontend chart visualizations.
* `POST /api/calculate`: **The Core Engine.** Receives the user's 30+ answers, fetches the mathematical baselines for the denominations via a batched D1 query, runs the 12-dimensional Euclidean distance algorithm (applying Posture Amplifiers and Schism Drag), and returns an array of the Top 10 matching denominations with exact percentages.

## 6. Frontend State & Silence Logic
The frontend tracks user progress in a Next.js client component (`userAnswers` state). A unique mechanic is the **Silence options**, which bypass the standard Certainty/Tolerance sliders and auto-inject specific logic directly into the payload:
* **Apathetic Silence** ("Not relevant to me"): Injects Certainty 0, Tolerance 2. 
* **Hostile Silence** ("I reject this framing"): Injects Certainty 3, Tolerance 1. 
The backend handles these automatically, forcing neutral coordinates (50) and applying the amplified distance penalties.

## 7. Next Immediate Tasks (Where we are now)
The data pipeline, database, question-serving API, and the massive Euclidean calculation engine are **fully operational**. Here is what we need to build next:

1. **Results Dashboard UI (Frontend):** Build the Next.js view to catch the `POST /api/calculate` response. We need a clean, Tailwind-styled list or grid to display the calculated Top 10 matching denominations, including their percentages and family groups.
2. **User Coordinate Generation:** The backend currently calculates the User-to-Denomination match, but we also need to extract the User's final 12-axis averages so we can plot them on the radar chart alongside their top matches.
3. **Data Visualization:** Integrate Chart.js or Recharts to build the 12-axis diverging bar chart and the theological tag cloud.
