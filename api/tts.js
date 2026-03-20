export const config = {
    maxDuration: 30,
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'No text provided' });
        }

        let apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        }

        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            console.error('API key missing or invalid');
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        // Use tts-1 (faster) instead of tts-1-hd to avoid timeout
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'tts-1',
                voice: 'nova',
                input: text.substring(0, 4000),
                speed: 1.0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAI TTS error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `OpenAI API error: ${response.status}`,
                details: errorText 
            });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        return res.send(buffer);

    } catch (error) {
        console.error('TTS handler error:', error);
        return res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
}
