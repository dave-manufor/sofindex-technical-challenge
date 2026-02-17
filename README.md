# 🏥 Clinic Scraper Microservice

A containerized Node.js/TypeScript microservice that discovers private clinic leads in Egypt by scraping Google Maps, filtering results with Groq Llama-3, and outputting clean structured data.

## Architecture

```
CLI args (--query "Dentist in Zayed")
  │
  ▼
scraper.ts — Google Maps via SerpApi
  │ returns RawPlace[]
  ▼
classifier.ts — Groq Llama-3 LLM filter
  │ keeps only private clinics (Iyada)
  ▼
phone.ts — Egyptian phone validation
  │ formats to +20xxxxxxxxxx
  ▼
output.ts — writes leads.csv + leads.json
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- OR [Node.js 20+](https://nodejs.org/) for local development

## Getting API Keys

### SerpApi (Google Maps Scraping)

1. Sign up at [serpapi.com](https://serpapi.com/)
2. Free tier gives you **100 searches/month**
3. Copy your API key from [serpapi.com/manage-api-key](https://serpapi.com/manage-api-key)

### Groq (AI Classification)

1. Sign up at [console.groq.com](https://console.groq.com/)
2. Go to [API Keys](https://console.groq.com/keys) and click **"Create API Key"**
3. Copy the generated key (starts with `gsk_`)
4. Free tier gives you **30 requests/minute** — more than enough

## Quick Start

### 1. Clone & configure

```bash
git clone https://github.com/dave-manufor/clinic-scraper.git
cd clinic-scraper
cp .env.example .env
# Edit .env and add your API keys
```

### 2. Run with Docker (recommended)

```bash
# Default query: "Dermatologist in Maadi"
docker-compose up --build

# Custom query
QUERY="Dentist in Zayed" docker-compose up --build
```

### 3. Run locally

```bash
npm install
npm run build
npm run start -- --query "Dentist in Zayed"

# Or with tsx (no build step)
npm run dev -- --query "Dentist in Zayed"
```

## CLI Options

| Flag                    | Description               | Default  |
| ----------------------- | ------------------------- | -------- |
| `-q, --query <query>`   | Search query _(required)_ | —        |
| `-o, --output <dir>`    | Output directory          | `output` |
| `-c, --concurrency <n>` | Parallel LLM requests     | `2`      |

## Environment Variables

| Variable          | Required | Description                             |
| ----------------- | -------- | --------------------------------------- |
| `SERPAPI_API_KEY` | ✅       | SerpApi key for Google Maps             |
| `GROQ_API_KEY`    | ✅       | Groq API key for Llama-3 classification |
| `MAX_CONCURRENCY` | ❌       | Max parallel LLM calls (default: 2)     |

## Output Schema (`leads.csv`)

| Column             | Example                         |
| ------------------ | ------------------------------- |
| `clinic_name`      | Dr. Ahmed Clinic                |
| `doctor_name`      | Dr. Ahmed                       |
| `phone_number`     | +201012345678                   |
| `address`          | 15 Road 9, Maadi, Cairo         |
| `Maps_link`        | https://www.google.com/maps/... |
| `confidence_score` | High                            |

## Sample Output

The following data was generated during testing with the query `"Dermatologist in Maadi"`:

```csv
clinic_name,doctor_name,phone_number,address,Maps_link,confidence_score
Dr. Rania Mohamed Mounir,Rania Mohamed Mounir,+201010829900,"ش ١٠٠, رقم ٢, المعادى ،القاهرة",https://www.google.com/maps/place/?q=place_id:0x145847ed5729c7ff:0x4d8460330e08abeb,High
Sallèna Wellness Clinic,,+201030308871,"X874+P63, Zahraa Al Maadi, Cairo Governorate 4064133",https://www.google.com/maps/place/?q=place_id:0x1458390026c224c3:0x7a7dab4069d29979,Medium
الدكتور محمد عبد الشكور المحمدى,محمد عبد الشكور المحمدى,+20223597609,"9 ميدان الحرية, Maadi, Cairo Governorate 4211123",https://www.google.com/maps/place/?q=place_id:0x145847f10a79b933:0xc2df0c51c056e502,High
Dr. Sara Hafez Skin Clinic,Sara Hafez,+201092370814,"Al Lasilki, Ezbet Fahmy, Maadi, Cairo Governorate 4234030",https://www.google.com/maps/place/?q=place_id:0x145839c818ab0c23:0x87bdcd22ec2674f6,High
Dr. Mahmoud Fawzy,Mahmoud Fawzy,+201283699923,"عمارة معمل البرج, 1 ميدان الحرية, Maadi, Cairo Governorate 4211126",https://www.google.com/maps/place/?q=place_id:0x145847f10a79b933:0x914482e5d4889e7b,High
عيادة الدكتوره اسماء سعيد جلديه وليزر,اسماء سعيد,+201090178037,"أبراج عثمان، حي المعادي, Cairo Governorate 11728",https://www.google.com/maps/place/?q=place_id:0x145847d1ae8da12f:0x7a22b1c50049e750,High
Dr. Wafaa Awad | Clinic,Wafaa Awad,+201098110338,"المعادي, شارع النصر, Cairo Governorate 11742",https://www.google.com/maps/place/?q=place_id:0x14583914ed0ac309:0xec05d7364dc6c41f,High
```

**Results:** 20 scraped → 17 accepted as private clinics → 3 rejected (Derma Life, Maadi Skin Medica, Skinway Egypt — corporate/generic names with no doctor attached).

## How the AI Filter Works

The classifier uses Groq Llama-3.3-70B with careful prompt engineering for Egyptian healthcare:

- **Rejects:** Hospitals (Mustashfa), Medical Centers (Markaz), Labs (Ma3mal), Pharmacies (Saydaliya)
- **Accepts:** Private clinics (Iyada), solo doctor practices, small group practices
- **Edge case handling:** "Dr. Mohamed Center" → likely private clinic ✅ vs "The Cairo Center" → corporate ❌

## Project Structure

```
src/
├── index.ts        # CLI entry point & orchestration
├── scraper.ts      # Google Maps scraping via SerpApi
├── classifier.ts   # Groq Llama-3 LLM classification
├── phone.ts        # Egyptian phone number validation
├── output.ts       # CSV/JSON file writer
├── types.ts        # Shared TypeScript interfaces
├── logger.ts       # Structured logging
└── retry.ts        # Async retry with exponential backoff
```

## Error Handling

- **Network failures:** Automatic retry with exponential backoff (up to 5 attempts)
- **Rate limits (429):** Respects server-suggested retry delays
- **Missing phone numbers:** Logged as warnings, places still processed
- **LLM failures:** Individual classification failures don't crash the pipeline — logged and skipped
