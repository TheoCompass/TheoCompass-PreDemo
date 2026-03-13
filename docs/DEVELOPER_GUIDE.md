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

## 7. Current Status & Next Immediate Tasks
The core backend pipeline, D1 database, Euclidean calculation engine, and the primary Results Dashboard UI are now fully operational. The frontend successfully maps user stances across 12 dimensions, calculates tolerance, and plots them dynamically against the D1-backed scatter landscape.

### Next Immediate Tasks (Where we are now):
1. **Wiki / Deep Dive Pages:** 
   Build dynamic routes (e.g., `/denomination/[id]`) so users can click on a Top 10 result and see exactly *how* that denomination answered the 120 questions compared to the user.
2. **Standard & Deep Modes:**
   The frontend currently locks users into the 30-question "Quick" mode. We need to unlock the "Standard" (70 Qs) and "Deep" (120 Qs) modes by ensuring the frontend correctly passes the URL parameters to the API.
3. **Database Expansion:**
   Transition the database from the 30 "Pre-Demo" denominations to the full 230+ master list by executing the final `seed.sql` generated from the domain expert's master CSV.
4. **Mobile Optimization & Polish:**
   Review all UI elements (especially the 12-axis chart and Recharts tooltips) on mobile viewports to ensure scaling and touch targets are optimal.

