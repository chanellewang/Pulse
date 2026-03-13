// Clinical Trials Chatbot with OpenAI Integration
const API_BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';
let currentTrialsData = null;
let chatHistory = [];
let patientConditions = [];

// Initialize chatbot with patient profile analysis
async function initializeChatbot() {
    const chatMessages = document.getElementById('chatMessages');
    
    // Start with lung cancer summary and trials
    await loadLungCancerSummary();
    await searchAndSummarizeTrials('Lung Cancer');
}

// Load lung cancer summary
async function loadLungCancerSummary() {
    const summaryDiv = document.getElementById('lungCancerSummary');
    if (!summaryDiv) return;
    
    summaryDiv.innerHTML = `
        <p><strong>Lung Cancer</strong> is one of the most common cancers worldwide, with two main types: non-small cell lung cancer (NSCLC) and small cell lung cancer (SCLC).</p>
        <p><strong>Key Facts:</strong></p>
        <ul style="margin-left: 20px; margin-top: 8px;">
            <li>NSCLC accounts for about 85% of cases</li>
            <li>Treatment options include surgery, chemotherapy, radiation, targeted therapy, and immunotherapy</li>
            <li>Early detection significantly improves survival rates</li>
            <li>Clinical trials are exploring new treatments and combinations</li>
        </ul>
        <p style="margin-top: 8px;"><strong>Current Focus:</strong> Searching for active clinical trials that may be relevant for this patient's condition.</p>
    `;
}

// Analyze patient profile to identify conditions
async function analyzePatientProfile() {
    showLoading(true);
    
    try {
        const profileSummary = getPatientProfileSummary();
        
        // Send patient profile to AI for condition identification
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Analyze this patient profile from an Epic EHR system and identify the primary medical conditions, diagnoses, or health concerns. 

IMPORTANT: The patient has a PRIMARY DIAGNOSIS of LUNG CANCER. This should be the primary focus for clinical trial matching.

Consider:
- PRIMARY DIAGNOSIS: Lung Cancer (this is the main condition)
- Current medications and their indications (IV fluids, PRN medications)
- Lab orders (Hemoglobin/Hematocrit monitoring)
- Vital signs (elevated heart rate 140-170 bpm, other vital signs)
- Work list tasks (PRN meds, IV site checks)
- Precautions (Fall precautions)
- Care plan problems (Lung Cancer, Discharge planning, Acute pain management)
- Clinical notes and team observations

Patient Profile:
${JSON.stringify(profileSummary, null, 2)}

Key Observations:
- PRIMARY DIAGNOSIS: Lung Cancer - This is the patient's main medical condition
- Elevated heart rate (140-170 bpm) may be related to lung cancer, cardiac issues, dehydration, pain, or infection
- IV fluid administration (NS infusion) suggests dehydration or fluid management
- Hemoglobin/Hematocrit monitoring suggests possible anemia or blood loss (common in cancer patients)
- Fall precautions suggest mobility/balance concerns
- Acute pain management goal suggests active pain issues (may be related to lung cancer)
- PRN medications being monitored

Please provide:
1. A list of identified conditions (Lung Cancer MUST be included as the primary condition)
2. Brief reasoning for each condition based on the clinical data
3. The most relevant condition for clinical trial matching (should be Lung Cancer)

Format your response as JSON with this structure:
{
  "conditions": ["Lung Cancer", "condition2"],
  "reasoning": "brief explanation",
  "primaryCondition": "Lung Cancer"
}`,
                history: [],
                context: 'You are analyzing a patient profile from an EHR system to identify medical conditions.'
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to analyze patient profile: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Parse AI response to extract conditions
        try {
            // Try to extract JSON from the response
            const jsonMatch = data.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                patientConditions = analysis.conditions || [];
                const primaryCondition = analysis.primaryCondition || (patientConditions[0] || 'general medical condition');
                
                // Update UI with identified conditions
                updateIdentifiedConditions(patientConditions, analysis.reasoning);
                
                // Search for trials based on identified conditions
                addMessage('assistant', `I've identified ${patientConditions.length} condition(s): ${patientConditions.join(', ')}. Searching for relevant clinical trials...`);
                await searchAndSummarizeTrials(primaryCondition);
            } else {
                // Fallback: extract conditions from text
                const conditionMatch = data.response.match(/conditions?[:\s]+\[?([^\]]+)\]?/i);
                if (conditionMatch) {
                    patientConditions = conditionMatch[1].split(',').map(c => c.trim());
                } else {
                    patientConditions = ['general medical condition'];
                }
                updateIdentifiedConditions(patientConditions, data.response);
                await searchAndSummarizeTrials(patientConditions[0] || 'general medical condition');
            }
        } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            // Fallback: use a default condition based on profile
            patientConditions = inferConditionsFromProfile();
            updateIdentifiedConditions(patientConditions, 'Analysis completed. Conditions inferred from clinical data.');
            await searchAndSummarizeTrials(patientConditions[0] || 'general medical condition');
        }
        
    } catch (error) {
        console.error('Error analyzing patient profile:', error);
        addMessage('assistant', `I encountered an error analyzing the patient profile: ${error.message}. I'll proceed with a general search.`);
        // Fallback to inferred conditions
        patientConditions = inferConditionsFromProfile();
        updateIdentifiedConditions(patientConditions, 'Conditions inferred from clinical data.');
        await searchAndSummarizeTrials(patientConditions[0] || 'general medical condition');
    } finally {
        showLoading(false);
    }
}

// Infer conditions from patient profile when AI analysis fails
function inferConditionsFromProfile() {
    const conditions = [];
    
    // Safety check for patientProfile
    if (typeof patientProfile === 'undefined') {
        return ['Lung Cancer']; // Default fallback
    }
    
    const profile = patientProfile;
    
    // PRIMARY DIAGNOSIS: Lung Cancer
    if (profile.clinical.diagnoses && profile.clinical.diagnoses.length > 0) {
        profile.clinical.diagnoses.forEach(diagnosis => {
            conditions.push(diagnosis.condition);
        });
    } else {
        conditions.push('Lung Cancer'); // Default primary diagnosis
    }
    
    // Check for other indicators
    if (profile.clinical.precautions.includes('Fall precautions')) {
        conditions.push('Fall risk / Mobility issues');
    }
    
    if (profile.medications.some(m => m.name.includes('sodium chloride') || m.name.includes('NS'))) {
        conditions.push('Dehydration / Fluid management');
    }
    
    if (profile.labOrders.some(l => l.name.includes('Hemoglobin') || l.name.includes('Hematocrit'))) {
        conditions.push('Anemia / Blood disorder');
    }
    
    return conditions;
}

// Update the identified conditions in the UI
function updateIdentifiedConditions(conditions, reasoning) {
    const conditionsDiv = document.getElementById('identifiedConditions');
    conditionsDiv.innerHTML = '';
    
    if (conditions && conditions.length > 0) {
        conditions.forEach(condition => {
            const conditionTag = document.createElement('div');
            conditionTag.className = 'condition-tag';
            conditionTag.textContent = condition;
            conditionsDiv.appendChild(conditionTag);
        });
        
        if (reasoning) {
            const reasoningDiv = document.createElement('div');
            reasoningDiv.className = 'condition-reasoning';
            reasoningDiv.textContent = reasoning.substring(0, 200) + (reasoning.length > 200 ? '...' : '');
            conditionsDiv.appendChild(reasoningDiv);
        }
    } else {
        conditionsDiv.innerHTML = '<div class="no-conditions">No specific conditions identified</div>';
    }
}

// Search for trials and get AI summary
async function searchAndSummarizeTrials(searchTerm) {
    showLoading(true);
    
    try {
        // Build query parameters
        let queryParams = new URLSearchParams();
        queryParams.append('query.cond', searchTerm);
        queryParams.append('pageSize', '10');
        queryParams.append('format', 'json');

        const url = `${API_BASE_URL}?${queryParams.toString()}`;
        
        let response;
        try {
            response = await fetch(url);
        } catch (fetchError) {
            // Try proxy endpoint
            const proxyParams = new URLSearchParams({
                query: searchTerm,
                pageSize: '10'
            });
            response = await fetch(`/api/studies?${proxyParams.toString()}`);
        }
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        currentTrialsData = data;
        
        if (!data || !data.studies || data.studies.length === 0) {
            addMessage('assistant', `I couldn't find any clinical trials for "${searchTerm}". The patient's condition may not have active trials, or we may need to refine the search.`);
            showLoading(false);
            return;
        }

        // Display trials in the UI
        displayTrialsInUI(data);
        
        // Get AI summary of the trials
        await getAISummary(data, searchTerm);
        
    } catch (error) {
        console.error('Error fetching trials:', error);
        addMessage('assistant', `Sorry, I encountered an error while searching for clinical trials: ${error.message}`);
        showLoading(false);
    }
}

// Get AI summary of clinical trials
async function getAISummary(trialsData, condition) {
    try {
        // Prepare trial summaries for AI
        const trialSummaries = trialsData.studies.slice(0, 10).map(study => {
            const protocolSection = study.protocolSection || {};
            const identificationModule = protocolSection.identificationModule || {};
            const statusModule = protocolSection.statusModule || {};
            const conditionsModule = protocolSection.conditionsModule || {};
            const descriptionModule = protocolSection.descriptionModule || {};

            const nctId = identificationModule.nctId || 'N/A';
            const title = identificationModule.briefTitle || identificationModule.officialTitle || 'No title';
            const status = statusModule.overallStatus || 'Unknown';
            const conditions = conditionsModule.conditions || [];
            
            let briefSummary = '';
            if (descriptionModule.briefSummary) {
                briefSummary = typeof descriptionModule.briefSummary === 'string' 
                    ? descriptionModule.briefSummary 
                    : (descriptionModule.briefSummary.text || '');
            }

            return {
                nctId,
                title,
                status,
                conditions: conditions.join(', '),
                summary: briefSummary.substring(0, 500)
            };
        });

        // Send to OpenAI API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Please provide a comprehensive summary of these clinical trials for ${condition}. Focus on:
1. Overall overview of available trials
2. Key treatment approaches being studied
3. Trial statuses (recruiting, completed, etc.)
4. Most promising or relevant trials
5. Any important eligibility criteria or study details

Here are the trials:
${JSON.stringify(trialSummaries, null, 2)}`,
                history: chatHistory
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to get AI summary';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Add summary to chat
        addMessage('assistant', `Here's a comprehensive summary of the clinical trials for ${condition}:\n\n${data.response}`);
        chatHistory.push({ role: 'user', content: `Summarize clinical trials for ${condition}` });
        chatHistory.push({ role: 'assistant', content: data.response });
        
    } catch (error) {
        console.error('Error getting AI summary:', error);
        // Show the actual error to user for debugging
        addMessage('assistant', `I found ${trialsData.studies.length} clinical trials for ${condition}, but encountered an error getting the AI summary: ${error.message}. Here's a basic overview:\n\n${generateBasicSummary(trialsData)}`);
    } finally {
        showLoading(false);
    }
}

// Generate basic summary if AI fails
function generateBasicSummary(trialsData) {
    const studies = trialsData.studies.slice(0, 5);
    let summary = '';
    
    studies.forEach((study, index) => {
        const protocolSection = study.protocolSection || {};
        const identificationModule = protocolSection.identificationModule || {};
        const statusModule = protocolSection.statusModule || {};
        
        const title = identificationModule.briefTitle || 'Untitled Study';
        const status = statusModule.overallStatus || 'Unknown';
        const nctId = identificationModule.nctId || 'N/A';
        
        summary += `${index + 1}. **${title}**\n   Status: ${status}\n   NCT ID: ${nctId}\n\n`;
    });
    
    return summary;
}

// Send user message
async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage('user', message);
    chatInput.value = '';
    
    showLoading(true);
    
    try {
        // Check if user wants to search for new trials
        if (message.toLowerCase().includes('search for') || message.toLowerCase().includes('find trials')) {
            const condition = extractConditionFromMessage(message) || patientConditions[0] || 'general medical condition';
            await searchAndSummarizeTrials(condition);
            return;
        }
        
        // Otherwise, send to chatbot with patient context
        // Safety check for patientProfile
        if (typeof patientProfile === 'undefined') {
            throw new Error('Patient profile not loaded. Please refresh the page.');
        }
        
        const primaryDiagnosis = patientProfile.clinical.diagnoses && patientProfile.clinical.diagnoses.length > 0 
            ? patientProfile.clinical.diagnoses.map(d => d.condition).join(', ')
            : 'Lung Cancer';
        const patientContext = `Patient Profile Context:
- PRIMARY DIAGNOSIS: ${primaryDiagnosis}
- Identified Conditions: ${patientConditions.join(', ') || primaryDiagnosis}
- Allergies: ${patientProfile.clinical.allergies ? patientProfile.clinical.allergies.map(a => a.medication).join(', ') : 'None'}
- Current Medications: ${patientProfile.medications ? patientProfile.medications.map(m => m.name).join(', ') : 'None'}
- Lab Orders: ${patientProfile.labOrders ? patientProfile.labOrders.map(l => l.name).join(', ') : 'None'}
- Precautions: ${patientProfile.clinical.precautions ? patientProfile.clinical.precautions.join(', ') : 'None'}`;

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                context: `${patientContext}${currentTrialsData ? `\n\nCurrent Clinical Trials Data: ${JSON.stringify(currentTrialsData.studies.slice(0, 5).map(s => ({
                    title: s.protocolSection?.identificationModule?.briefTitle,
                    status: s.protocolSection?.statusModule?.overallStatus,
                    nctId: s.protocolSection?.identificationModule?.nctId,
                    conditions: s.protocolSection?.conditionsModule?.conditions || []
                })))}` : ''}`
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'Failed to get response';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        addMessage('assistant', data.response);
        
        // Update chat history
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: data.response });
        
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('assistant', `Sorry, I encountered an error: ${error.message}. Please check the server console for more details.`);
    } finally {
        showLoading(false);
    }
}

// Extract condition from message
function extractConditionFromMessage(message) {
    const lowerMessage = message.toLowerCase();
    // Check if any of the identified conditions are mentioned
    for (const condition of patientConditions) {
        if (lowerMessage.includes(condition.toLowerCase())) {
            return condition;
        }
    }
    // Common condition keywords - prioritize lung cancer
    if (lowerMessage.includes('lung cancer') || lowerMessage.includes('lung carcinoma') || lowerMessage.includes('pulmonary cancer')) return 'Lung Cancer';
    if (lowerMessage.includes('colon cancer') || lowerMessage.includes('colorectal')) return 'colorectal cancer';
    if (lowerMessage.includes('diabetes')) return 'diabetes';
    if (lowerMessage.includes('anemia')) return 'anemia';
    if (lowerMessage.includes('dehydration')) return 'dehydration';
    if (lowerMessage.includes('fall')) return 'fall risk';
    // Default to lung cancer if no specific condition mentioned
    return 'Lung Cancer';
}

// Add message to chat
function addMessage(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    // Format markdown-like text (basic)
    contentDiv.innerHTML = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show/hide loading indicator
function showLoading(show) {
    const loading = document.getElementById('chatLoading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Display trials in the UI
function displayTrialsInUI(trialsData) {
    const trialsSection = document.getElementById('trialsSection');
    const trialsList = document.getElementById('trialsList');
    
    if (!trialsList) return;
    
    trialsList.innerHTML = '';
    
    // Show the trials section if it was hidden
    if (trialsSection) {
        trialsSection.classList.remove('hidden');
        trialsList.classList.remove('hidden');
    }
    
    trialsData.studies.slice(0, 10).forEach(study => {
        const protocolSection = study.protocolSection || {};
        const identificationModule = protocolSection.identificationModule || {};
        const statusModule = protocolSection.statusModule || {};
        const conditionsModule = protocolSection.conditionsModule || {};
        const descriptionModule = protocolSection.descriptionModule || {};
        
        const nctId = identificationModule.nctId || 'N/A';
        const title = identificationModule.briefTitle || identificationModule.officialTitle || 'No title';
        const status = statusModule.overallStatus || 'Unknown';
        const conditions = conditionsModule.conditions || [];
        
        let briefSummary = '';
        if (descriptionModule.briefSummary) {
            briefSummary = typeof descriptionModule.briefSummary === 'string' 
                ? descriptionModule.briefSummary 
                : (descriptionModule.briefSummary.text || '');
        }
        
        const trialCard = document.createElement('div');
        trialCard.className = 'trial-card';
        trialCard.innerHTML = `
            <h4>${escapeHtml(title)}</h4>
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
            <div class="trial-link">
                <a href="https://clinicaltrials.gov/study/${nctId}" target="_blank">View Full Details →</a>
            </div>
        `;
        trialsList.appendChild(trialCard);
    });
    
    // Ensure trials section is visible
    if (trialsSection) {
        trialsSection.classList.remove('hidden');
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle Enter key in chat input and initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Initialize chatbot when page loads
    initializeChatbot();
});

