InternShield

AI-Powered Internship Credibility & Transparency Platform

InternShield is an AI-powered platform designed to help students evaluate internship opportunities before applying or enrolling. The platform analyzes internship postings, PDFs, posters, company information, mentorship details, project quality, fee transparency, and verified student experiences to generate an objective internship credibility assessment.

Problem Statement

Many students join internships based on certificates, LORs, or promotional claims without understanding the actual learning value of the opportunity.

Common challenges include:

- Hidden registration or certificate fees
- Low-quality academic projects
- Lack of mentorship
- Limited industry exposure
- Misleading marketing claims
- Difficulty comparing internship opportunities

InternShield helps students make informed decisions by providing AI-driven internship analysis and community-verified insights.


Features

Internship Analyzer

Analyze internships using:

- Internship URLs
- Company Website URLs
- Company LinkedIn URLs
- Internship Posters
- PDF Documents

The system extracts and evaluates internship information automatically.

AI Audit Engine

The audit engine evaluates:

- Company Credibility
- Project Quality
- Mentorship Quality
- Industry Exposure
- Learning Value
- Fee Transparency
- Marketing Risk Indicators

and generates an explainable InternShield Score.

Hidden Fee Detection

Detects:

- Registration Fees
- Certificate Fees
- Training Fees
- Security Deposits
- Other Hidden Charges

through internship descriptions, registration forms, and uploaded documents.

Project Quality Assessment

Classifies projects as:

- Low Value Projects
- Medium Value Projects
- High Value Projects

based on complexity, industry relevance, and real-world exposure.

Verified Review System

Students can submit reviews after verifying participation using:

- Offer Letter
- Completion Certificate
- LOR
- Internship Email Screenshot
- Internship ID Card

Verification confirms participation but does not influence internship quality scores.

AI-Generated Review Summaries

Instead of relying on unstructured feedback, InternShield converts user responses into structured AI-generated internship reviews.

Anti-Manipulation Framework

InternShield prevents review abuse through:

- Single Review Per Student
- Outlier Detection
- Consensus Weighting
- Verification Checks
- Review Confidence Scoring

Scoring Model

Final Internship Score is calculated using:

- AI Audit Score → 60%
- Community Experience Score → 40%

The system prioritizes objective analysis while incorporating verified student experiences.

Technology Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- ShadCN UI

Backend

- FastAPI
- Python

Database

- PostgreSQL
- Redis

AI & Machine Learning

- DistilBERT
- Sentence Transformers
- Scikit-learn
- XGBoost

OCR & Document Processing

- EasyOCR
- Tesseract OCR
- OpenCV

Cloud & Storage

- AWS S3

Deployment

- Docker
- GitHub Actions
- Vercel
- Render

System Workflow

1. User submits internship information.
2. AI extracts internship details.
3. Company and project information are analyzed.
4. Fee transparency checks are performed.
5. Audit report is generated.
6. Verified participants submit reviews.
7. AI generates structured review summaries.
8. Final InternShield Score is calculated.

Future Scope

- Browser Extension
- University Integration
- Placement Cell Integration
- Mobile Application
- Advanced Internship Comparison Engine
- Internship Recommendation System

Project Structure

frontend/
backend/
database/
ai-engine/
ocr-service/
docs/

Impact

InternShield empowers students to:

- Identify genuine internship opportunities
- Avoid low-value internships
- Detect hidden fees
- Compare internship quality
- Make informed career decisions


"InternShield helps students evaluate internship quality through AI-driven audits and verified community experiences."
