# Sofindex Technical Challenge: The "Clinic

# Scraper" Microservice

**Role:** Junior AI Automation Engineer **Project:** Lead Generation Pipeline (Alpha) **Timeline:** 48
Hours

## 1. The Mission

We are moving beyond simple scripts. We need a robust, fault-tolerant **microservice** that can
autonomously discover, verify, and store contact details for private doctors in Egypt.
**Your Goal:** Build a **containerized** Python/Node.js application that accepts a location and
specialty (e.g., _"Dermatologist in Maadi"_ ), scrapes the results, filters them using an LLM to
ensure they are **Private Clinics** (not hospitals/centers), and saves the clean data to a
CSV/JSON file (or SQLite database).
**This is a test of your ability to ship production-grade software.** We expect code that can
run on a server, not just a Jupyter notebook.

## 2. Technical Requirements (The "Must-Haves")

Your submission must meet the following production standards. If it does not build, it fails.
**A. The Scraper Engine**
● **Input:** The script must accept arguments (e.g., --query "Dentist in Zayed").
● **Source:** Use **Google Maps** (via Apify, SerpApi, or a custom Selenium/Puppeteer script).
● **Resilience:** The scraper must handle network timeouts and retries automatically.
**B. The AI Filter (The Brain)**
● Integrate a **Free LLM API** (Groq llama-3 or Gemini flash) to process the raw names.
● **Strict Logic:** The system must accurately discard:
○ Hospitals (Mustashfa)
○ Medical Centers (Markaz)
○ Labs (Ma3mal)
○ Pharmacies
● **Output:** It must only keep **Solo/Group Private Clinics** (Iyada).

**C. Data Structure (The Output)**
The final output must be a clean, structured file (leads.csv) with the following schema:
● clinic_name (e.g., "Dr. Ahmed Clinic")
● doctor_name (extracted from the title if possible)
● phone_number (Cleaned to standard format: +201xxxxxxxxx)
● address
● Maps_link
● confidence_score (High/Medium/Low based on the LLM's certainty)
**D. Deployment (Docker)**
● Include a Dockerfile and docker-compose.yml.
● We should be able to run your project with a single command: docker-compose up.

## 3. The "Edge Case" Challenge

Real data is messy. Your code must handle these specific Egyptian market nuances:

1. **Phone Numbers:** Some clinics list landlines (02...), others list mobiles (01...). Your
   code should validate that a number exists.
2. **Ambiguity:** "Dr. Mohamed Center" is often a private clinic, while "The Cairo Center" is
   corporate. Your Prompt Engineering needs to be smart enough to tell the difference.

## 4. Deliverables

Do not send a zip file.

1. **Public GitHub Repository:** containing clean, commented code.
2. **README.md:** This is critical. It must include:
   ○ Instructions on how to get an API Key (Groq/Gemini).
   ○ The exact command to run the scraper.
   ○ A sample of the output data you generated during testing.

## 5. Evaluation Criteria

```
● Code Quality: Is it modular? (e.g., scraper.py, classifier.py, main.py).
```

● **Error Handling:** Does the crash if the API is down, or does it log the error and retry?
● **Speed:** Does it process leads in parallel (async/await) or one by one?
**Good luck. The Sofindex Team**
