// ClinicalTrials.gov API integration
const API_BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

// Handle Enter key press in search input (works in both standalone and widget contexts)
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchTrials();
            }
        });
        
        // Auto-search if there's a default value (for Epic mockup with patient condition)
        if (searchInput.value && searchInput.value.trim()) {
            // Small delay to ensure widget is rendered if it's in a widget context
            setTimeout(() => {
                searchTrials();
            }, 500);
        }
    }
});

async function searchTrials() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const maxResults = parseInt(document.getElementById('maxResults').value) || 10;
    const statusFilter = document.getElementById('statusFilter').value;

    if (!searchTerm) {
        showError('Please enter a search term');
        return;
    }

    // Hide previous results and errors
    document.getElementById('results').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('loading').classList.remove('hidden');

    try {
        // Build query parameters for ClinicalTrials.gov API v2
        // The API uses a query string format like: query.cond=diabetes
        let queryParams = new URLSearchParams();
        queryParams.append('query.cond', searchTerm);
        queryParams.append('pageSize', maxResults.toString());
        queryParams.append('format', 'json');

        // Add status filter if selected
        if (statusFilter) {
            queryParams.append('filter.overallStatus', statusFilter);
        }

        const url = `${API_BASE_URL}?${queryParams.toString()}`;
        
        let response;
        try {
            // Try direct API call first
            response = await fetch(url);
        } catch (fetchError) {
            // If CORS error, try using the proxy endpoint
            console.log('Direct API call failed, trying proxy...');
            const proxyParams = new URLSearchParams({
                query: searchTerm,
                pageSize: maxResults.toString()
            });
            if (statusFilter) {
                proxyParams.append('status', statusFilter);
            }
            response = await fetch(`/api/studies?${proxyParams.toString()}`);
        }
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        displayResults(data);
    } catch (error) {
        console.error('Error fetching trials:', error);
        showError(`Failed to fetch clinical trials: ${error.message}. Please try again or check your internet connection.`);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    const trialsList = document.getElementById('trialsList');
    const resultsCount = document.getElementById('resultsCount');

    // Clear previous results
    trialsList.innerHTML = '';

    if (!data || !data.studies || data.studies.length === 0) {
        showError('No clinical trials found for your search. Try different keywords.');
        return;
    }

    const count = data.studies.length;
    const total = data.totalCount || count;
    resultsCount.textContent = `Found ${count} ${count === 1 ? 'trial' : 'trials'}${total > count ? ` (${total} total available)` : ''}`;

    // Display each trial
    data.studies.forEach(study => {
        const trialCard = createTrialCard(study);
        trialsList.appendChild(trialCard);
    });

    resultsDiv.classList.remove('hidden');
}

function createTrialCard(study) {
    const card = document.createElement('div');
    card.className = 'trial-card';

    const protocolSection = study.protocolSection || {};
    const identificationModule = protocolSection.identificationModule || {};
    const statusModule = protocolSection.statusModule || {};
    const conditionsModule = protocolSection.conditionsModule || {};
    const descriptionModule = protocolSection.descriptionModule || {};

    const nctId = identificationModule.nctId || 'N/A';
    const title = identificationModule.briefTitle || identificationModule.officialTitle || 'No title available';
    const status = statusModule.overallStatus || 'Unknown';
    const conditions = conditionsModule.conditions || [];
    // Handle briefSummary which might be a string or object with text property
    let briefSummary = '';
    if (descriptionModule.briefSummary) {
        briefSummary = typeof descriptionModule.briefSummary === 'string' 
            ? descriptionModule.briefSummary 
            : (descriptionModule.briefSummary.text || '');
    }

    card.innerHTML = `
        <h3>${escapeHtml(title)}</h3>
        <div class="trial-id">NCT ID: ${nctId}</div>
        <div class="trial-info">
            <strong>Status:</strong>
            <span class="status ${status.replace(/\s+/g, '_')}">${status}</span>
        </div>
        ${conditions.length > 0 ? `
            <div class="trial-info">
                <strong>Conditions:</strong> ${conditions.map(c => escapeHtml(c)).join(', ')}
            </div>
        ` : ''}
        ${briefSummary ? `
            <div class="trial-info">
                <strong>Summary:</strong> ${escapeHtml(briefSummary.substring(0, 200))}${briefSummary.length > 200 ? '...' : ''}
            </div>
        ` : ''}
        <div class="trial-info" style="margin-top: 10px;">
            <a href="https://clinicaltrials.gov/study/${nctId}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">
                View Full Details →
            </a>
        </div>
    `;

    return card;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

