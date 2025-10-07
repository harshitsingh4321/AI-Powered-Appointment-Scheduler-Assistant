# 🧠 AI-Powered Appointment Scheduler Assistant

> **Focus Area:** OCR → Entity Extraction → Normalization  
> **Goal:** Build a backend service that parses natural-language or document-based appointment requests and converts them into structured scheduling data.

---

## 📋 Overview

This backend service automates **appointment scheduling** by understanding both **typed text** and **image-based (scanned/handwritten)** requests.

**Key Features:**
1. **OCR (Optical Character Recognition)** — Extracts text from uploaded images using Tesseract.js + Sharp
2. **Entity Extraction** — Identifies key entities such as department, date, and time
3. **Normalization** — Converts natural-language date/time phrases into ISO format (e.g., `2025-10-17 15:00`)
4. **Guardrails** — Detects ambiguities or missing information (e.g., unclear date/time)
5. **Structured JSON Output** — Returns a clean appointment object suitable for APIs, calendars, or hospital databases

---

## 🏗️ System Architecture

### Pipeline Flow

```
Client → Multer Upload → OCR (Sharp + Tesseract) → Entity Extraction (Regex + Aliases) → 
Normalization (Chrono + Luxon) → Guardrail Validation → Final JSON Response
```

### Folder Structure

```
src/
├─ server.js              → Express app + middleware + routes
├─ routes/
│  └─ v1.js               → Versioned API endpoints
├─ middleware/
│  └─ upload.js           → Multer config (in-memory upload)
├─ pipeline/
│  ├─ ocr.js              → Sharp + Tesseract OCR logic
│  ├─ entities.js         → Regex + keyword extraction
│  ├─ normalize.js        → Chrono/Luxon normalization
│  └─ finalize.js         → Guardrails + JSON composer
├─ package.json
└─ .env.example
```

---

## ⚙️ Tech Stack

| Category | Library / Tool |
|----------|----------------|
| **Backend Framework** | Express.js |
| **OCR Engine** | Tesseract.js + Sharp |
| **Natural Language Date Parsing** | Chrono-Node |
| **Timezone & Date Utilities** | Luxon |
| **Schema Validation** | Zod |
| **File Upload Middleware** | Multer |
| **Environment Handling** | dotenv |
| **Logging** | Morgan |
| **Utility** | UUID (unique request IDs) |

---

## 🧩 Setup Instructions

### Clone & Install

```bash
git clone https://github.com/harshitsingh4321/AI-Powered-Appointment-Scheduler-Assistant.git
cd AI-Powered-Appointment-Scheduler-Assistant
npm install
```

### Environment Setup

Create a `.env` file:

```env
PORT=4000
NODE_ENV=development
MAX_FILE_SIZE=10485760
ALLOWED_MIME=image/jpeg,image/png,image/jpg,image/bmp
TZ=Asia/Kolkata
```

### Run Server

```bash
npm run dev
```

Server starts at → `http://localhost:4000`

---

## 🧠 API Documentation

### 1. Health Check

**Endpoint:** `GET /api/v1/health`

**Response:**
```json
{
  "ok": true,
  "service": "project_plum",
  "ts": "2025-10-08T18:52:55.793Z"
}
```

### 2. Parse Text Request

**Endpoint:** `POST /api/v1/parse/text`  
**Content-Type:** `application/json`

**Example Request:**
```bash
curl -X POST http://localhost:4000/api/v1/parse/text \
  -H "Content-Type: application/json" \
  -d '{"text":"Book dentist next Friday at 3pm"}'
```

**Example Response:**
```json
{
  "request_id": "cfd3d9c8-6f9c-4644-aefe-87f839e26d3e",
  "appointment": {
    "department": "Dentistry",
    "date": "2025-10-17",
    "time": "15:00",
    "tz": "Asia/Kolkata"
  },
  "status": "ok"
}
```

### 3. Parse Document Request

**Endpoint:** `POST /api/v1/parse/document`  
**Content-Type:** `multipart/form-data`  
**Form field:** `file` (required)

**Example Request (PowerShell):**
```powershell
& curl.exe -X POST "http://localhost:4000/api/v1/parse/document?minimal=true" `
  -F "file=@C:/Users/harsh/Desktop/Project_plum/dentist_next_friday_3pm.png"
```

**Example Response:**
```json
{
  "request_id": "a23f17b5-8d2e-4a27-a991-92166e9a7e3b",
  "appointment": {
    "department": "Dentistry",
    "date": "2025-10-17",
    "time": "15:00",
    "tz": "Asia/Kolkata"
  },
  "status": "ok"
}
```

---

## 🧮 Example Test Inputs

| Input (Text/Image) | Extracted Dept | Normalized Date | Time | Timezone |
|-------------------|----------------|-----------------|------|----------|
| "Book dentist next Friday at 3pm" | Dentistry | 2025-10-17 | 15:00 | Asia/Kolkata |
| "Dermatologist tomorrow 10:30 am" | Dermatology | 2025-10-09 | 10:30 | Asia/Kolkata |
| "Cardio on 2025-12-01 09:00" | Cardiology | 2025-12-01 | 09:00 | Asia/Kolkata |
| "ENT next Tuesday at noon" | ENT | 2025-10-14 | 12:00 | Asia/Kolkata |

---

## 🧱 Internal Modules Explanation

### `ocr.js`
Uses Sharp for image preprocessing (resize, grayscale, normalize). Tesseract.js performs OCR and confidence scoring. Returns `{ raw_text, confidence }`.

### `entities.js`
Extracts department, date_phrase, time_phrase using regex patterns and keyword maps. Uses confidence scoring to weigh entity certainty.

### `normalize.js`
Uses Chrono-Node to interpret relative dates like "next Friday", "tomorrow", etc. Adjusts ambiguous "next Friday" to nearest logical week. Normalizes into ISO date/time with Luxon.

### `finalize.js`
Guardrails to handle ambiguous/low-confidence cases. Composes final structured JSON if valid.

---

## 🧰 Sample Guardrail Output

If OCR or NLP confidence < 0.5:

```json
{
  "status": "needs_clarification",
  "message": "Ambiguous date/time or department",
  "hints": {
    "ask": "Please specify clear department, date (YYYY-MM-DD) and time (HH:mm)."
  }
}
```

---

## 🧪 Local Test Commands

### Text Tests

```powershell
Invoke-RestMethod "http://localhost:4000/api/v1/parse/text?minimal=true" `
  -Method POST -ContentType "application/json" `
  -Body '{"text":"Dermatologist tomorrow 10:30 am"}'
```

### Image Tests

```powershell
& curl.exe -X POST "http://localhost:4000/api/v1/parse/document?minimal=true" `
  -F "file=@C:/Users/harsh/Desktop/Project_plum/dermatologist_tomorrow_1030am.png"
```

---

## 💡 Development Process

| Stage | Key Improvements |
|-------|-----------------|
| **OCR** | Preprocess images using Sharp before Tesseract to improve accuracy |
| **Entity Extraction** | Added regex to detect both AM/PM and 24-hour times |
| **Normalization** | Disambiguate "next Friday" → current week if before Thursday |
| **Guardrails** | Return friendly JSON message when confidence is low |

---

## 🧩 Architecture Diagram

```
[ Client ]
   |
   v
[ Express Router ]
   |
   v
[ Multer Middleware ] ---> checks file
   |
   v
[ OCR Pipeline (Sharp + Tesseract) ]
   |
   v
[ Entity Extractor (Regex/Zod) ]
   |
   v
[ Normalizer (Chrono/Luxon) ]
   |
   v
[ Guardrail ]
   |
   v
[ Final JSON Response ]
```

---

## 🧠 State Handling & Data Flow

Each request runs in isolation (stateless REST):
- Uploaded images are processed in memory (not stored)
- Each request is tagged with a unique `request_id` using crypto.randomUUID()
- Confidence scores propagate through the pipeline to determine whether the result is "ok" or "needs_clarification"

---

## 🧩 Known Issues & Potential Improvements

- **OCR Noise:** Low contrast or blurry text may reduce confidence
- **Ambiguous Language:** "Next Friday" logic depends on current weekday context
- **Timezones:** Currently fixed to `Asia/Kolkata`; can be made dynamic
- **Persistence:** Appointments are not yet stored; MongoDB or PostgreSQL can be added
- **Frontend UI:** Could add a simple React upload form and response visualizer

---

## 📎 Repository & Demo

- **GitHub Repository:** [AI-Powered-Appointment-Scheduler-Assistant](https://github.com/harshitsingh4321/AI-Powered-Appointment-Scheduler-Assistant)
- **Local Server:** `http://localhost:4000`

---

## 📬 Contact

**Made by Harshit Singh**

- 📧 Email: harshitsingh789123@gmail.com
- 💻 GitHub: [harshitsingh4321](https://github.com/harshitsingh4321)

---
