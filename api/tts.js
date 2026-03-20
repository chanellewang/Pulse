export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text } = req.body;
        
        let apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        }

        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'tts-1-hd',
                voice: 'nova',
                input: text,
                speed: 1.0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('TTS API error:', errorText);
            throw new Error(`TTS API error: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error('TTS error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate speech' });
    }
}
