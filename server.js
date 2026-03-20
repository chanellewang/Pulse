const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve Pulse briefing page as the main dashboard (BEFORE static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pulse.html'));
});

// Keep old Epic UI accessible at /epic
app.get('/epic', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve static files from the root directory (AFTER explicit routes)
app.use(express.static(__dirname));

// --- FHIR test route (SMART sandbox) ---
app.get('/test-fhir', async (req, res) => {
    try {
      const base = (process.env.FHIR_BASE_URL || 'https://r4.smarthealthit.org').replace(/\/$/, '');
      const url = `${base}/Patient?_count=5`;
  
      const response = await fetch(url, {
        headers: { Accept: 'application/fhir+json' }
      });
  
      if (!response.ok) {
        const text = await response.text();
        return res.status(500).send(`FHIR error ${response.status}: ${text}`);
      }
  
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Proxy endpoint for ClinicalTrials.gov API (in case of CORS issues)
app.get('/api/studies', async (req, res) => {
    try {
        const { query, pageSize, status } = req.query;
        
        const params = new URLSearchParams({
            'query.cond': query || '',
            pageSize: pageSize || '10',
            format: 'json'
        });

        if (status) {
            params.append('filter.overallStatus', status);
        }

        const apiUrl = `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch clinical trials data' });
    }
});

// OpenAI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history, context } = req.body;
        // Remove quotes if present and trim whitespace
        let apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        }

        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            console.error('OpenAI API key issue:', { 
                hasKey: !!process.env.OPENAI_API_KEY, 
                keyLength: process.env.OPENAI_API_KEY?.length,
                keyPreview: process.env.OPENAI_API_KEY?.substring(0, 10) + '...'
            });
            return res.status(500).json({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' });
        }

        // Build messages array for OpenAI
        const systemPrompt = context && context.includes('analyzing a patient profile')
            ? `You are a medical AI assistant specializing in analyzing patient profiles from Electronic Health Records (EHR) systems and identifying medical conditions. 
            You help healthcare providers by:
            1. Analyzing patient clinical data (medications, lab orders, notes, precautions)
            2. Identifying potential medical conditions, diagnoses, or health concerns
            3. Providing evidence-based reasoning for your identifications
            4. Recommending the most relevant condition for clinical trial matching
            
            Be thorough, accurate, and use proper medical terminology. When analyzing patient profiles, consider:
            - Medication indications and what they might treat
            - Lab orders and what they might indicate
            - Clinical notes and documented concerns
            - Precautions and their clinical significance
            
            Format your responses as requested (JSON when asked).`
            : `You are a helpful medical assistant specializing in clinical trials. 
            You help healthcare providers understand and find relevant clinical trials for their patients. 
            You provide clear, accurate, and concise summaries of clinical trial information.
            ${context ? `\n\nContext: ${context}` : ''}
            Always be professional and focus on helping the user understand clinical trial options.`;
        
        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        // Add chat history
        if (history && history.length > 0) {
            // Only keep last 10 messages to avoid token limits
            const recentHistory = history.slice(-10);
            messages.push(...recentHistory);
        }

        // Add current message
        messages.push({
            role: 'user',
            content: message
        });

        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
            }
            console.error('OpenAI API error:', errorData);
            const errorMessage = errorData.error?.message || errorData.error || 'Unknown error';
            throw new Error(`OpenAI API error: ${errorMessage}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

        res.json({ response: aiResponse });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message || 'Failed to process chat message' });
    }
});

// OpenAI Text-to-Speech endpoint - natural sounding voice
app.post('/api/tts', async (req, res) => {
    try {
        const { text } = req.body;
        
        let apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        }

        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Use OpenAI TTS API with 'nova' voice (natural female voice)
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'tts-1-hd',      // High quality model
                voice: 'nova',           // Natural, friendly female voice
                input: text,
                speed: 1.0               // Normal speed
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('TTS API error:', errorText);
            throw new Error(`TTS API error: ${response.status}`);
        }

        // Stream the audio back to the client
        res.set({
            'Content-Type': 'audio/mpeg',
            'Transfer-Encoding': 'chunked'
        });

        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Open your browser and navigate to the URL above to use the ClinicalTrials.gov search UI');
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  WARNING: OPENAI_API_KEY not found in environment variables!');
        console.warn('   The chatbot will not work without an API key.');
        console.warn('   Please create a .env file with: OPENAI_API_KEY=your_key_here');
    } else {
        console.log('✅ OpenAI API key found and configured');
    }
});

