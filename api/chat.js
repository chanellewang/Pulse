module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { message, history, context } = req.body;
        let apiKey = process.env.OPENAI_API_KEY;
        if (apiKey) {
            apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
        }

        if (!apiKey || apiKey === 'your_openai_api_key_here') {
            return res.status(500).json({ error: 'OpenAI API key not configured.' });
        }

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
            { role: 'system', content: systemPrompt }
        ];

        if (history && history.length > 0) {
            const recentHistory = history.slice(-10);
            messages.push(...recentHistory);
        }

        messages.push({ role: 'user', content: message });

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
}
