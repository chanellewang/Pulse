# Pulse – AI-Powered Clinical Briefing Platform

Pulse transforms fragmented EHR data into concise, actionable pre-visit briefings for physicians. By aggregating patient information from multiple sources and leveraging AI synthesis, Pulse reduces chart review time and ensures no critical information is missed.

## Features

- 💊 **Pre-Visit Briefings** - Comprehensive patient summaries generated in seconds
- 🔬 **FHIR Integration** - Imports patient data from FHIR-compliant EHR systems
- 🤖 **AI Synthesis** - Intelligent analysis that prioritizes actionable insights
- ⚠️ **Care Gap Detection** - Automatically identifies overdue screenings, missed exams, and pending actions
- 📊 **Lab Trend Visualization** - Visual indicators for abnormal values and trends
- 💊 **Medication Tracking** - Recent changes highlighted with drug interaction alerts
- 👥 **Care Team Notes** - Consolidated specialist recommendations with priority tagging
- 🏥 **Outside Care Records** - Integration of external facility visits and consultations
- 🔊 **Audio Briefing** - Natural-sounding TTS for hands-free chart review
- 📚 **Research Integration** - Surfaces relevant clinical studies based on patient conditions

## Screenshots

### Patient Briefing Dashboard
The main dashboard provides a comprehensive overview of the patient's clinical status, including care gaps, labs, vitals, medications, and visit history.

### AI Synthesis
AI-generated summary highlighting key concerns and recommended actions for the visit.

## Files

- `pulse.html` - Main clinical briefing dashboard
- `pulse-briefing.js` - Dashboard logic, FHIR data processing, and AI synthesis
- `pulse-briefing.css` - Styles for the briefing interface
- `server.js` - Express server with OpenAI integration and FHIR proxy
- `patient-profile.js` - Patient data management utilities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```
   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
   - **Pulse Dashboard**: `http://localhost:3000/pulse`

## Usage

### Clinical Briefing Workflow

1. Open `http://localhost:3000/pulse` to access the Pulse dashboard
2. Select a patient from the top navigation bar
3. Review the pre-visit briefing:
   - **Care Gaps & Action Items** - Prioritized list of items requiring attention
   - **Labs & Imaging** - Recent results with trend indicators
   - **Latest Vitals** - Current vital signs with alerts for abnormal values
   - **Medication Changes** - Recent prescriptions and dosage adjustments
   - **Last Visit & Plan** - Previous encounter summary and care plan
   - **Outside Care** - Records from external facilities
   - **Care Team Notes** - Specialist recommendations
   - **Relevant Research** - AI-curated clinical studies
4. Click any section header to view detailed information in a modal
5. Use **Audio Brief** for a spoken summary of the patient
6. Click **Start Visit** to transition to the active encounter

### Customization

- Click **Customize** to toggle which sections appear on your dashboard
- Preferences are saved locally for future sessions

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   FHIR Server   │────▶│  Pulse Server   │────▶│   OpenAI API    │
│  (Patient Data) │     │   (Express.js)  │     │  (AI Synthesis) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Pulse Dashboard │
                        │    (Browser)     │
                        └─────────────────┘
```

## API Integrations

- **FHIR R4** - Patient data import from compliant EHR systems
- **OpenAI GPT-4** - AI synthesis and natural language generation
- **OpenAI TTS** - Text-to-speech for audio briefings
- **ClinicalTrials.gov** - Relevant research article retrieval

## Technologies

- HTML5 / CSS3 / JavaScript
- Node.js / Express
- OpenAI API (GPT-4, TTS)
- FHIR R4 Standard

## License

MIT
