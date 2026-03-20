export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
}
