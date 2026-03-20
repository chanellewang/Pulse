module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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
}
