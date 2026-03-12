# ClinicalTrials.gov Search UI - Epic EMR Integration MVP

A web interface for searching clinical trials from ClinicalTrials.gov, integrated as a widget into an Epic EMR-style mockup interface.

## Features

- 🤖 **AI-Powered Chatbot** - Intelligent assistant that summarizes and explains clinical trials
- 🔍 Search clinical trials by condition, disease, or keyword
- 📊 AI-generated summaries of clinical trial results
- 💬 Conversational interface for asking questions about trials
- 🎨 Epic EMR-style mockup interface
- 🪟 Floating widget with minimize/maximize functionality
- 🔗 Context-aware responses based on patient condition (colon cancer)
- ⚡ Fast and efficient API integration
- 🖱️ Draggable widget interface

## Files

- `index.html` - Standalone clinical trials search interface
- `epic-mockup.html` - Epic EMR mockup with integrated clinical trials widget
- `app.js` - Clinical trials API integration logic
- `epic-widget.js` - Widget minimize/maximize and drag functionality
- `styles.css` - Styles for standalone interface
- `epic-styles.css` - Styles for Epic mockup interface

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
   - **Epic Mockup with Chatbot**: `http://localhost:3000/epic-mockup.html`
   - **Standalone UI**: `http://localhost:3000/index.html`

## Usage

### Epic Mockup Interface with Chatbot

1. Open `epic-mockup.html` to see the Epic EMR-style interface
2. The Clinical Trials Chatbot widget appears in the bottom-right corner
3. The chatbot automatically searches for "colon cancer" trials when the page loads
4. The AI assistant provides a comprehensive summary of available trials
5. Ask questions in the chat interface, such as:
   - "What are the most promising trials?"
   - "Which trials are currently recruiting?"
   - "Tell me about immunotherapy trials"
   - "What are the eligibility criteria?"
6. Click the minimize button (−) to collapse the widget
7. Click the maximize button (+) to expand it again
8. Drag the widget header to move it around the screen

### Standalone Interface

1. Open `index.html` for a full-screen clinical trials search interface
2. Enter search terms and use filters as needed
3. View results in a clean, modern interface

## Widget Features

- **Minimize/Maximize**: Toggle widget size with the control buttons
- **Draggable**: Click and drag the widget header to reposition
- **Responsive**: Adapts to different screen sizes
- **Integrated**: Seamlessly integrated into Epic-style interface

## API

This application uses the [ClinicalTrials.gov Data API](https://clinicaltrials.gov/data-api/api) to fetch clinical trial data.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js/Express (for local server and CORS proxy)

## License

MIT

