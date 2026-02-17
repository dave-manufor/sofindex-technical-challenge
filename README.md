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
git clone https://github.com/dave-manufor/sofindex-technical-challenge.git
cd sofindex-technical-challenge
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

```json
[
  {
    "clinic_name": "Dr. Rania Mohamed Mounir",
    "doctor_name": "Rania Mohamed Mounir",
    "phone_number": "+201010829900",
    "address": "ش ١٠٠, رقم ٢, المعادى ،القاهرة",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847ed5729c7ff:0x4d8460330e08abeb",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Sallèna Wellness Clinic",
    "doctor_name": "",
    "phone_number": "+201030308871",
    "address": "X874+P63, Zahraa Al Maadi, Maadi as Sarayat Al Gharbeyah, Tura, Cairo Governorate 4064133",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458390026c224c3:0x7a7dab4069d29979",
    "confidence_score": "Medium"
  },
  {
    "clinic_name": "الدكتور محمد عبد الشكور المحمدى",
    "doctor_name": "محمد عبد الشكور المحمدى",
    "phone_number": "+20223597609",
    "address": "9 ميدان الحرية, Maadi Al Khabiri Ash Sharqeyah, Maadi, Cairo Governorate 4211123",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847f10a79b933:0xc2df0c51c056e502",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Skin House Clinic",
    "doctor_name": "",
    "phone_number": "+20237691976",
    "address": "47 Intersection Of rd, 79, Maadi as Sarayat Al Gharbeyah, Maadi",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458387385a8f155:0x24882adee9081e51",
    "confidence_score": "Medium"
  },
  {
    "clinic_name": "Dr. Sara Hafez Skin Clinic",
    "doctor_name": "Sara Hafez",
    "phone_number": "+201092370814",
    "address": "Al Lasilki, Ezbet Fahmy, Maadi, Cairo Governorate 4234030",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145839c818ab0c23:0x87bdcd22ec2674f6",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Dr. Mahmoud Fawzy",
    "doctor_name": "Mahmoud Fawzy",
    "phone_number": "+201283699923",
    "address": "عمارة معمل البرج, 1 ميدان الحرية, Maadi, Cairo Governorate 4211126",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847f10a79b933:0x914482e5d4889e7b",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Dr. Nasr Nazmy Maqar",
    "doctor_name": "Nasr Nazmy",
    "phone_number": "+20223784566",
    "address": "ش Mostafa Kamel, Maadi as Sarayat Al Gharbeyah, Maadi, Cairo Governorate 4212101",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847f67a1fd99b:0x327d756392ac12e5",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Dr. Islam Mohamed Abou El Khair",
    "doctor_name": "Islam Mohamed Abou El Khair",
    "phone_number": "+201050579960",
    "address": "3 Street 79, Maadi as Sarayat Al Gharbeyah, Maadi, Cairo Governorate 4212104",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145836a37e5a0447:0xe55323d3ff6900c3",
    "confidence_score": "High"
  },
  {
    "clinic_name": "عيادة الدكتوره اسماء سعيد جلديه وليزر",
    "doctor_name": "اسماء سعيد",
    "phone_number": "+201090178037",
    "address": "أبراج عثمان، حي المعادي، محافظة القاهرة‬،, Maadi, Cairo Governorate 11728",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847d1ae8da12f:0x7a22b1c50049e750",
    "confidence_score": "High"
  },
  {
    "clinic_name": "عيادة د. نيڤين درغام المعادي",
    "doctor_name": "د. نيڤين درغام",
    "phone_number": "+201005517868",
    "address": "9rd, Street 259, Ezbet Fahmy, Maadi, Cairo Governorate",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458390540f3faf7:0xb31cf21c590fbb86",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Dr. Wafaa Awad | Clinic",
    "doctor_name": "Wafaa Awad",
    "phone_number": "+201098110338",
    "address": "المعادي, شارع النصر, Cairo Governorate 11742",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x14583914ed0ac309:0xec05d7364dc6c41f",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Farida Clinic El Maadi",
    "doctor_name": "",
    "phone_number": "+201001421581",
    "address": "أمام مستشفيات اندلسية, 5 شارع الاسلكى, الرئيسي, Maadi, Cairo Governorate 11728",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x14583965f1cba18b:0x90c6e34868696fc2",
    "confidence_score": "Medium"
  },
  {
    "clinic_name": "Dr. Yehia Al Taher Center Maadi - New Cairo - Zayed",
    "doctor_name": "Yehia Al Taher",
    "phone_number": "+20223784911",
    "address": "Street 100, Maadi Al Khabiri Ash Sharqeyah, Maadi, Cairo Governorate 4211121",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847bb2aa7baa7:0x59f4deade934090a",
    "confidence_score": "Medium"
  },
  {
    "clinic_name": "دكتور محمود حسن",
    "doctor_name": "محمود حسن",
    "phone_number": "+201099005817",
    "address": "١٤ ه/١ شارع النصر المعادي, المعادى",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458391bb839b505:0xdb00f0e5425d4a2",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Dr. Engy Hussein aesthetic dermatology clinic عيادة د.إنجي حسين للجلدية و التجميل",
    "doctor_name": "Engy Hussein",
    "phone_number": "+201273356536",
    "address": "١/٢ Al Lasilki, Ezbet Fahmy, Maadi, Cairo Governorate 4234034",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458390019616221:0xdbe08e20184ed1e4",
    "confidence_score": "High"
  },
  {
    "clinic_name": "دكتور محمد يونس",
    "doctor_name": "محمد يونس",
    "phone_number": "+201011486480",
    "address": "محطه مترو حدائق المعادى, ٢ ش أمين محمد متفرع من ش, 9, Cairo Governorate",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x145847be9d1c6517:0x15c97a37bd558d86",
    "confidence_score": "High"
  },
  {
    "clinic_name": "Derma Bella Maadi",
    "doctor_name": "",
    "phone_number": "+201097097923",
    "address": "7 Nile Corniche, Maadi, Cairo Governorate 4211210",
    "Maps_link": "https://www.google.com/maps/place/?q=place_id:0x1458477fc4566caf:0x9c9a0cba098ee3a3",
    "confidence_score": "Medium"
  }
]
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
