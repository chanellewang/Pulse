// Pulse Briefing - At-a-Glance Clinical Dashboard
// Designed to reduce cognitive load in 10-minute visits
// Key features: Care gaps, Lab trends, Source links, Customization

// State
let patients = [];
let selectedPatient = null;
let customization = {
    showCareGaps: true,
    showLabTrends: true,
    showMeds: true,
    showVisit: true,
    showOutside: true,
    showPublications: true
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPatients();
    loadCustomization();
    
    // Keyboard listener for modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDetailModal();
        }
    });
});

// Load patients from FHIR (with fallback mock data)
async function loadPatients() {
    try {
        const response = await fetch('/api/test-fhir');
        const data = await response.json();
        
        if (data.entry && data.entry.length > 0) {
            const fhirPatients = data.entry.map(entry => entry.resource);
            
            // Check if ALL patients have valid names - use mock data if any names are missing
            const hasValidNames = fhirPatients.every(p => 
                p.name && p.name[0] && (p.name[0].given || p.name[0].family)
            );
            
            patients = hasValidNames ? fhirPatients : getMockPatients();
        } else {
            patients = getMockPatients();
        }
    } catch (error) {
        console.error('Error loading patients, using mock data:', error);
        patients = getMockPatients();
    }
    
    renderPatientChips();
    if (patients.length > 0) {
        selectPatient(patients[0].id);
    } else {
        showLoading(false);
    }
}

// Mock patient data for demo/fallback
function getMockPatients() {
    return [
        {
            id: 'demo-1',
            name: [{ given: ['Margaret', 'M'], family: 'Smith' }],
            gender: 'female',
            birthDate: '1958-04-15'
        },
        {
            id: 'demo-2',
            name: [{ given: ['James', 'R'], family: 'Johnson' }],
            gender: 'male',
            birthDate: '1962-11-22'
        },
        {
            id: 'demo-3',
            name: [{ given: ['Patricia', 'A'], family: 'Williams' }],
            gender: 'female',
            birthDate: '1970-07-08'
        },
        {
            id: 'demo-4',
            name: [{ given: ['Robert', 'L'], family: 'Brown' }],
            gender: 'male',
            birthDate: '1955-03-30'
        },
        {
            id: 'demo-5',
            name: [{ given: ['Linda', 'S'], family: 'Davis' }],
            gender: 'female',
            birthDate: '1985-09-12'
        }
    ];
}

// Render patient chips in header
function renderPatientChips() {
    const container = document.getElementById('patientQuickSelect');
    
    container.innerHTML = patients.map(patient => {
        const name = getPatientName(patient);
        const initials = getInitials(name);
        const isActive = selectedPatient?.id === patient.id;
        
        return `
            <div class="patient-chip ${isActive ? 'active' : ''}" onclick="selectPatient('${patient.id}')">
                <div class="patient-chip-avatar">${initials}</div>
                <span>${name.split(' ')[0]}</span>
            </div>
        `;
    }).join('');
}

// Select patient
async function selectPatient(patientId) {
    selectedPatient = patients.find(p => p.id === patientId);
    if (!selectedPatient) return;
    
    // Stop any playing audio when switching patients
    if (typeof stopAllAudio === 'function') {
        stopAllAudio();
    }
    
    renderPatientChips();
    showLoading(true);
    
    await loadDashboard();
}

// Show/hide loading
function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
    document.getElementById('dashboardContent').style.display = show ? 'none' : 'block';
}

// Load full dashboard
async function loadDashboard() {
    if (!selectedPatient) return;
    
    try {
        // Generate clinical data
        const clinicalData = generateClinicalData(selectedPatient);
        
        // Store for modal access
        currentClinicalData = clinicalData;
        
        // Update all sections
        updateTopBanner(clinicalData);
        updateCareGaps(clinicalData.careGaps);
        updateLabs(clinicalData.labs);
        updateVitals(clinicalData.vitals);
        updateMeds(clinicalData.medications);
        updateVisit(clinicalData.visits);
        updateOutside(clinicalData.outsideEvents);
        updateCareTeamNotes(clinicalData.careTeamNotes);
        await updateResearch(clinicalData.conditions);
        
        // Generate AI synthesis
        await generateSynthesis(clinicalData);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showLoading(false);
    }
}

// Update top banner
function updateTopBanner(data) {
    const name = getPatientName(selectedPatient);
    const initials = getInitials(name);
    const age = calculateAge(selectedPatient.birthDate);
    const gender = selectedPatient.gender || 'Unknown';
    const mrn = getMRN(selectedPatient);
    
    document.getElementById('patientInitials').textContent = initials;
    document.getElementById('patientName').textContent = name;
    document.getElementById('patientAge').textContent = `${age}y`;
    document.getElementById('patientGender').textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
    document.getElementById('patientMRN').innerHTML = `MRN: ${mrn} <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z"/><path d="M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z"/></svg>`;
    
    // Reason for visit
    document.getElementById('reasonForVisit').textContent = data.reasonForVisit;
    
    // Risk flags
    const riskContainer = document.getElementById('riskFlags');
    riskContainer.innerHTML = data.riskFlags.map(flag => `
        <div class="risk-flag ${flag.level}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${flag.level === 'critical' ? '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' : 
                  flag.level === 'warning' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' :
                  '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'}
            </svg>
            ${flag.label}
        </div>
    `).join('');
}

// Update care gaps section
function updateCareGaps(gaps) {
    const container = document.getElementById('careGapsGrid');
    
    if (!gaps || gaps.length === 0) {
        container.innerHTML = '<div style="color: var(--status-success); padding: var(--space-md);">✓ No outstanding care gaps identified</div>';
        return;
    }
    
    container.innerHTML = gaps.map((gap, idx) => `
        <div class="care-gap-item" onclick="openSource('caregap-${idx}')">
            <div class="gap-priority ${gap.priority}">${idx + 1}</div>
            <div class="gap-content">
                <div class="gap-title">${gap.title}</div>
                <div class="gap-detail">${gap.detail}</div>
                <div class="gap-action">
                    Address now →
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.636 3.5a.5.5 0 00-.5-.5H1.5A1.5 1.5 0 000 4.5v10A1.5 1.5 0 001.5 16h10a1.5 1.5 0 001.5-1.5V7.864a.5.5 0 00-1 0V14.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5v-10a.5.5 0 01.5-.5h6.636a.5.5 0 00.5-.5z"/><path d="M16 .5a.5.5 0 00-.5-.5h-5a.5.5 0 000 1h3.793L6.146 9.146a.5.5 0 10.708.708L15 1.707V5.5a.5.5 0 001 0v-5z"/></svg>
                </div>
            </div>
        </div>
    `).join('');
}

// Update labs with sparklines
function updateLabs(labs) {
    const container = document.getElementById('labsContent');
    
    if (!labs || labs.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No recent labs</div>';
        return;
    }
    
    container.innerHTML = labs.map(lab => {
        const sparkline = generateSparkline(lab.trend);
        const statusClass = lab.status === 'critical' ? 'critical' : lab.status;
        
        return `
            <div class="lab-row">
                <span class="lab-name">${lab.name}</span>
                <div class="lab-sparkline">${sparkline}</div>
                <div class="lab-value">
                    <span class="lab-number">${lab.value}</span>
                    <span class="lab-unit">${lab.unit}</span>
                    <span class="lab-status ${statusClass}"></span>
                </div>
            </div>
        `;
    }).join('');
}

// Generate sparkline SVG
function generateSparkline(trend) {
    if (!trend || trend.length < 2) return '';
    
    const width = 50;
    const height = 20;
    const padding = 2;
    
    const min = Math.min(...trend);
    const max = Math.max(...trend);
    const range = max - min || 1;
    
    const points = trend.map((val, idx) => {
        const x = padding + (idx / (trend.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((val - min) / range) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');
    
    const lastPoint = trend[trend.length - 1];
    const isUp = trend.length > 1 && lastPoint > trend[trend.length - 2];
    const color = isUp ? 'var(--status-warning)' : 'var(--labs-accent)';
    
    return `
        <svg viewBox="0 0 ${width} ${height}">
            <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${padding + (width - 2 * padding)}" cy="${height - padding - ((lastPoint - min) / range) * (height - 2 * padding)}" r="2" fill="${color}"/>
        </svg>
    `;
}

// Update vitals
function updateVitals(vitals) {
    const container = document.getElementById('vitalsContent');
    const timestamp = document.getElementById('vitalsTimestamp');
    
    if (!vitals) {
        container.innerHTML = '<div style="color: var(--text-muted);">No recent vitals</div>';
        return;
    }
    
    timestamp.textContent = vitals.timestamp;
    
    container.innerHTML = `
        <div class="vital-item">
            <div class="vital-label">BP</div>
            <div class="vital-value ${vitals.bp.abnormal ? 'abnormal' : ''}">${vitals.bp.value}</div>
        </div>
        <div class="vital-item">
            <div class="vital-label">HR</div>
            <div class="vital-value ${vitals.hr.abnormal ? 'abnormal' : ''}">${vitals.hr.value}</div>
        </div>
        <div class="vital-item">
            <div class="vital-label">Temp</div>
            <div class="vital-value ${vitals.temp.abnormal ? 'abnormal' : ''}">${vitals.temp.value}</div>
        </div>
        <div class="vital-item">
            <div class="vital-label">SpO2</div>
            <div class="vital-value ${vitals.spo2.abnormal ? 'abnormal' : ''}">${vitals.spo2.value}</div>
        </div>
        <div class="vital-item">
            <div class="vital-label">Weight</div>
            <div class="vital-value">${vitals.weight.value}</div>
        </div>
        <div class="vital-item">
            <div class="vital-label">BMI</div>
            <div class="vital-value ${vitals.bmi.abnormal ? 'abnormal' : ''}">${vitals.bmi.value}</div>
        </div>
    `;
}

// Update medications
function updateMeds(meds) {
    const container = document.getElementById('medsContent');
    
    if (!meds || meds.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No recent medication changes</div>';
        return;
    }
    
    container.innerHTML = meds.map(med => `
        <div class="med-row">
            <span class="med-indicator ${med.change}"></span>
            <div class="med-info">
                <div class="med-name">${med.name}</div>
                <div class="med-dose">${med.dose}</div>
            </div>
            <span class="med-date">${med.date}</span>
        </div>
    `).join('');
}

// Update visit summary
function updateVisit(visits) {
    const container = document.getElementById('visitContent');
    
    if (!visits || visits.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No recent visits</div>';
        return;
    }
    
    const visit = visits[0];
    
    container.innerHTML = `
        <div class="visit-date">${visit.date}</div>
        <div class="visit-section">
            <div class="visit-section-label">Assessment</div>
            <div class="visit-section-text">${visit.assessment}</div>
        </div>
        <div class="visit-section">
            <div class="visit-section-label">Plan</div>
            <ul class="visit-plan-list">
                ${visit.plan.slice(0, 4).map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

// Update outside care
function updateOutside(events) {
    const container = document.getElementById('outsideContent');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No outside care events</div>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="outside-item">
            <div class="outside-icon-small">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
            </div>
            <div class="outside-info">
                <div class="outside-title">${event.title}</div>
                <div class="outside-location">${event.location}</div>
            </div>
            <div class="outside-date">${event.date}</div>
        </div>
    `).join('');
}

// Update care team notes
function updateCareTeamNotes(notes) {
    const container = document.getElementById('careTeamContent');
    
    if (!container) return;
    
    if (!notes || notes.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No specialist notes available</div>';
        return;
    }
    
    container.innerHTML = notes.map(note => {
        const initials = note.specialist.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
        const priorityClass = note.priority || 'routine';
        
        const tagsHtml = note.tags ? note.tags.map(tag => {
            let tagClass = 'note-tag';
            if (tag === 'action-needed' || tag === 'overdue') tagClass += ' action-needed';
            if (tag === 'follow-up' || tag === 'referral') tagClass += ' follow-up';
            return `<span class="${tagClass}">${tag.replace('-', ' ')}</span>`;
        }).join('') : '';
        
        return `
            <div class="careteam-note ${priorityClass}">
                <div class="note-header">
                    <div class="specialist-info">
                        <div class="specialist-avatar">${initials}</div>
                        <div class="specialist-details">
                            <span class="specialist-name">${note.specialist}</span>
                            <span class="specialist-role">${note.role}</span>
                        </div>
                    </div>
                    <span class="note-date">${note.date}</span>
                </div>
                <div class="note-content">${note.content}</div>
                ${tagsHtml ? `<div class="note-tags">${tagsHtml}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Update research
async function updateResearch(conditions) {
    const container = document.getElementById('researchContent');
    
    if (!conditions || conditions.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted);">No conditions to search</div>';
        currentResearchData = [];
        return;
    }
    
    container.innerHTML = '<div style="color: var(--text-muted);">Searching for recent research...</div>';
    
    // Search for relevant clinical trials/research
    const query = conditions.slice(0, 2).join(' ');
    
    try {
        const response = await fetch(`/api/studies?query=${encodeURIComponent(query)}&pageSize=4`);
        const data = await response.json();
        
        if (data.studies && data.studies.length > 0) {
            // Store research data for modal access
            currentResearchData = data.studies.map(study => ({
                title: study.protocolSection?.identificationModule?.briefTitle || 'Untitled Study',
                source: study.protocolSection?.identificationModule?.organization?.fullName || 'Unknown',
                year: study.protocolSection?.statusModule?.startDateStruct?.date?.substring(0, 4) || '2024',
                status: study.protocolSection?.statusModule?.overallStatus || 'Unknown',
                summary: study.protocolSection?.descriptionModule?.briefSummary || null,
                nctId: study.protocolSection?.identificationModule?.nctId || null
            }));
            
            container.innerHTML = data.studies.map((study, idx) => {
                const title = study.protocolSection?.identificationModule?.briefTitle || 'Untitled Study';
                const org = study.protocolSection?.identificationModule?.organization?.fullName || 'Unknown';
                const year = study.protocolSection?.statusModule?.startDateStruct?.date?.substring(0, 4) || '2024';
                const status = study.protocolSection?.statusModule?.overallStatus || 'Unknown';
                const isRecent = parseInt(year) >= 2024;
                
                return `
                    <div class="research-item" onclick="openSource('research-${idx}')">
                        <div class="research-title">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                            </svg>
                            ${title.length > 60 ? title.substring(0, 60) + '...' : title}
                        </div>
                        <div class="research-meta">
                            <span>${org.length > 25 ? org.substring(0, 25) + '...' : org}</span>
                            <span class="research-year">${year}</span>
                            ${isRecent ? '<span class="research-badge">New</span>' : ''}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<div style="color: var(--text-muted);">No recent research found</div>';
            currentResearchData = [];
        }
    } catch (error) {
        console.error('Error fetching research:', error);
        // Fallback to mock research
        currentResearchData = [
            { title: 'SGLT2 Inhibitors in T2DM with CKD: Updated Evidence', source: 'NEJM', year: '2026', summary: 'This comprehensive review examines the latest evidence on SGLT2 inhibitor use in patients with type 2 diabetes and chronic kidney disease, demonstrating significant renal and cardiovascular benefits.' },
            { title: 'GLP-1 Agonists and Cardiovascular Outcomes', source: 'Lancet Diabetes', year: '2025', summary: 'Meta-analysis of cardiovascular outcome trials demonstrates the cardioprotective effects of GLP-1 receptor agonists in patients with type 2 diabetes.' }
        ];
        
        container.innerHTML = currentResearchData.map((study, idx) => `
            <div class="research-item" onclick="openSource('research-${idx}')">
                <div class="research-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                    </svg>
                    ${study.title}
                </div>
                <div class="research-meta">
                    <span>${study.source}</span>
                    <span class="research-year">${study.year}</span>
                    ${parseInt(study.year) >= 2025 ? '<span class="research-badge">New</span>' : ''}
                </div>
            </div>
        `).join('');
    }
}

// Generate AI synthesis
async function generateSynthesis(data) {
    const synthEl = document.getElementById('aiSynthesis');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');
    const sourcesEl = document.getElementById('sourcesUsed');
    
    synthEl.textContent = 'Generating synthesis...';
    
    const name = getPatientName(selectedPatient);
    const age = calculateAge(selectedPatient.birthDate);
    
    // Calculate data completeness
    let completeness = 0;
    const sources = [];
    
    if (data.labs && data.labs.length > 0) { completeness += 20; sources.push('Labs'); }
    if (data.vitals) { completeness += 15; sources.push('Vitals'); }
    if (data.medications && data.medications.length > 0) { completeness += 20; sources.push('Meds'); }
    if (data.visits && data.visits.length > 0) { completeness += 25; sources.push('Notes'); }
    if (data.outsideEvents && data.outsideEvents.length > 0) { completeness += 10; sources.push('Outside'); }
    if (data.careGaps && data.careGaps.length > 0) { completeness += 10; sources.push('Gaps'); }
    
    confidenceFill.style.width = `${completeness}%`;
    confidenceValue.textContent = `${completeness}%`;
    sourcesEl.textContent = sources.join(' • ');
    
    // Build context
    const context = `
Patient: ${name}, ${age}y ${selectedPatient.gender}
Reason for visit: ${data.reasonForVisit}
Care gaps: ${data.careGaps.map(g => g.title).join('; ')}
Abnormal labs: ${data.labs.filter(l => l.status !== 'normal').map(l => `${l.name}: ${l.value}`).join('; ')}
Recent med changes: ${data.medications.map(m => `${m.name} (${m.change})`).join('; ')}
Last visit assessment: ${data.visits[0]?.assessment || 'None'}
    `.trim();
    
    const prompt = `As a clinical decision support tool, provide a 2-3 sentence synthesis. Focus on:
1. The #1 priority for today's visit
2. Any critical abnormals or care gaps requiring immediate attention
3. Key context from recent changes

Be direct and actionable. No hedging.

${context}`;
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                context: 'Clinical synthesis for patient briefing'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            synthEl.textContent = result.response;
        } else {
            throw new Error('API error');
        }
    } catch (error) {
        // Fallback synthesis - clinical style
        const abnormals = data.labs.filter(l => l.status !== 'normal');
        const topGap = data.careGaps[0];
        
        synthEl.textContent = `${name} presents for ${data.reasonForVisit.toLowerCase()}. ` +
            (topGap ? `Priority: ${topGap.title}. ` : '') +
            (abnormals.length > 0 ? `Notable: ${abnormals[0].name} ${abnormals[0].value} ${abnormals[0].unit}. ` : '') +
            `Review recent ${data.medications.filter(m => m.change === 'added').length} new medications.`;
    }
}

// Generate clinical data with care gaps - unique per patient
function generateClinicalData(patient) {
    const age = calculateAge(patient.birthDate);
    const name = getPatientName(patient);
    
    // Get patient index for varied data
    const patientIndex = patients.findIndex(p => p.id === patient.id);
    
    // Different clinical scenarios for each patient
    const scenarios = [
        // Patient 0: Diabetes with CKD
        {
            reasonForVisit: 'Diabetes Follow-up • BP Check',
            careGaps: [
                { title: 'Overdue: HbA1c', detail: 'Last checked 4 months ago. Due for follow-up.', priority: 'high' },
                { title: 'Missed: Annual Eye Exam', detail: 'Diabetic retinopathy screening overdue by 6 months', priority: 'high' },
                { title: 'Pending: Colonoscopy', detail: 'Age-appropriate screening not completed', priority: 'medium' },
                { title: 'Review: Statin Therapy', detail: 'ASCVD risk >20%, not on high-intensity statin', priority: 'medium' }
            ],
            labs: [
                { name: 'HbA1c', value: '7.8', unit: '%', status: 'high', trend: [6.9, 7.1, 7.4, 7.6, 7.8] },
                { name: 'eGFR', value: '58', unit: 'mL/min', status: 'low', trend: [72, 68, 65, 61, 58] },
                { name: 'Creatinine', value: '1.5', unit: 'mg/dL', status: 'high', trend: [1.1, 1.2, 1.3, 1.4, 1.5] },
                { name: 'LDL-C', value: '142', unit: 'mg/dL', status: 'high', trend: [128, 135, 138, 140, 142] },
                { name: 'TSH', value: '2.4', unit: 'mIU/L', status: 'normal', trend: [2.1, 2.2, 2.3, 2.4, 2.4] },
                { name: 'K+', value: '4.8', unit: 'mEq/L', status: 'normal', trend: [4.2, 4.4, 4.5, 4.6, 4.8] }
            ],
            vitals: {
                timestamp: 'Today, 9:15 AM',
                bp: { value: '142/88', abnormal: true },
                hr: { value: '78', abnormal: false },
                temp: { value: '98.4°F', abnormal: false },
                spo2: { value: '97%', abnormal: false },
                weight: { value: '198 lbs', abnormal: false },
                bmi: { value: '31.2', abnormal: true }
            },
            medications: [
                { name: 'Metformin', dose: '1000mg BID', change: 'modified', date: 'Feb 10' },
                { name: 'Lisinopril', dose: '20mg daily', change: 'added', date: 'Feb 8' },
                { name: 'Atorvastatin', dose: '40mg nightly', change: 'added', date: 'Feb 5' },
                { name: 'Glipizide', dose: '5mg daily', change: 'removed', date: 'Feb 3' }
            ],
            visits: [{
                date: 'Jan 28, 2026',
                assessment: 'T2DM with worsening glycemic control (A1c 7.8%). Stage 3a CKD (eGFR 58). HTN not at goal.',
                plan: [
                    'Increase Metformin to 1000mg BID',
                    'Add Lisinopril 20mg for renoprotection',
                    'Start high-intensity statin',
                    'Repeat labs in 3 months',
                    'Refer to ophthalmology'
                ]
            }],
            outsideEvents: [
                { title: 'ED Visit - Chest Pain', location: 'City General Hospital', date: 'Jan 15' },
                { title: 'Cardiology Consult', location: 'Heart Care Associates', date: 'Jan 20' }
            ],
            careTeamNotes: [
                {
                    specialist: 'Dr. Sarah Chen',
                    role: 'Nephrology',
                    date: 'Feb 12',
                    priority: 'important',
                    content: 'Recommend adding SGLT2 inhibitor for renal protection given declining eGFR. Consider empagliflozin 10mg daily.',
                    tags: ['action-needed', 'medication']
                },
                {
                    specialist: 'Dr. James Wilson',
                    role: 'Cardiology',
                    date: 'Jan 20',
                    priority: 'routine',
                    content: 'Stress test negative for ischemia. Continue current management. Echo shows preserved EF at 55%.',
                    tags: ['follow-up']
                },
                {
                    specialist: 'Dr. Maria Santos',
                    role: 'Ophthalmology',
                    date: 'Aug 15',
                    priority: 'urgent',
                    content: 'Mild non-proliferative diabetic retinopathy noted. Needs repeat exam in 6 months - now overdue.',
                    tags: ['action-needed', 'overdue']
                }
            ],
            riskFlags: [
                { label: 'Diabetes', level: 'info' },
                { label: 'CKD Stage 3', level: 'warning' }
            ],
            conditions: ['Type 2 Diabetes', 'Hypertension', 'CKD Stage 3a', 'Hyperlipidemia']
        },
        // Patient 1: Heart Failure
        {
            reasonForVisit: 'Heart Failure Follow-up • Weight Check',
            careGaps: [
                { title: 'Overdue: Echocardiogram', detail: 'Annual echo not completed, last done 14 months ago', priority: 'high' },
                { title: 'Medication Review', detail: 'GDMT optimization needed - not on ARNI', priority: 'high' },
                { title: 'Flu Vaccine', detail: 'Annual influenza vaccine due', priority: 'medium' }
            ],
            labs: [
                { name: 'BNP', value: '892', unit: 'pg/mL', status: 'high', trend: [450, 520, 680, 780, 892] },
                { name: 'Sodium', value: '134', unit: 'mEq/L', status: 'low', trend: [138, 137, 136, 135, 134] },
                { name: 'Creatinine', value: '1.3', unit: 'mg/dL', status: 'normal', trend: [1.1, 1.2, 1.2, 1.3, 1.3] },
                { name: 'K+', value: '5.1', unit: 'mEq/L', status: 'high', trend: [4.2, 4.5, 4.8, 4.9, 5.1] },
                { name: 'Hemoglobin', value: '11.2', unit: 'g/dL', status: 'low', trend: [12.8, 12.2, 11.8, 11.5, 11.2] }
            ],
            vitals: {
                timestamp: 'Today, 10:30 AM',
                bp: { value: '118/72', abnormal: false },
                hr: { value: '88', abnormal: false },
                temp: { value: '97.8°F', abnormal: false },
                spo2: { value: '94%', abnormal: true },
                weight: { value: '185 lbs', abnormal: false },
                bmi: { value: '27.8', abnormal: true }
            },
            medications: [
                { name: 'Carvedilol', dose: '25mg BID', change: 'modified', date: 'Feb 12' },
                { name: 'Furosemide', dose: '40mg daily', change: 'added', date: 'Feb 10' },
                { name: 'Spironolactone', dose: '25mg daily', change: 'added', date: 'Feb 8' },
                { name: 'Digoxin', dose: '0.125mg daily', change: 'removed', date: 'Feb 5' }
            ],
            visits: [{
                date: 'Feb 5, 2026',
                assessment: 'HFrEF (EF 35%) with NYHA Class III symptoms. Volume overload on exam. Mild hyponatremia.',
                plan: [
                    'Increase diuretic dose',
                    'Add spironolactone for mortality benefit',
                    'Consider ARNI transition from ACEi',
                    'Schedule echo in 4 weeks',
                    'Daily weights, call if >3lb gain'
                ]
            }],
            outsideEvents: [
                { title: 'Hospitalization - CHF Exacerbation', location: 'University Medical Center', date: 'Jan 22' },
                { title: 'Home Health Visit', location: 'VNA Home Care', date: 'Feb 1' }
            ],
            careTeamNotes: [
                {
                    specialist: 'Dr. Michael Park',
                    role: 'Cardiology - HF Specialist',
                    date: 'Feb 10',
                    priority: 'urgent',
                    content: 'BNP trending up significantly. Recommend aggressive diuresis and ARNI transition. If no improvement in 2 weeks, consider CRT evaluation.',
                    tags: ['action-needed', 'medication']
                },
                {
                    specialist: 'RN Lisa Thompson',
                    role: 'Home Health',
                    date: 'Feb 8',
                    priority: 'important',
                    content: 'Weight up 4 lbs this week. Patient reporting increased SOB and orthopnea. Advised to contact office.',
                    tags: ['monitoring', 'follow-up']
                },
                {
                    specialist: 'Dr. Rachel Kim',
                    role: 'Palliative Care',
                    date: 'Jan 28',
                    priority: 'routine',
                    content: 'Goals of care discussion completed during hospitalization. Patient prefers aggressive treatment. Advance directive on file.',
                    tags: ['documentation']
                }
            ],
            riskFlags: [
                { label: 'Heart Failure', level: 'critical' },
                { label: 'Fall Risk', level: 'warning' }
            ],
            conditions: ['Heart Failure', 'Atrial Fibrillation', 'Anemia', 'Hyponatremia']
        },
        // Patient 2: COPD Exacerbation
        {
            reasonForVisit: 'COPD Follow-up • Respiratory Symptoms',
            careGaps: [
                { title: 'Overdue: Spirometry', detail: 'PFTs not done in 2 years', priority: 'high' },
                { title: 'Pneumonia Vaccine', detail: 'PPSV23 booster due', priority: 'medium' },
                { title: 'Smoking Cessation', detail: 'Active smoker - counsel and offer pharmacotherapy', priority: 'high' }
            ],
            labs: [
                { name: 'WBC', value: '12.4', unit: 'K/uL', status: 'high', trend: [8.2, 9.1, 10.5, 11.8, 12.4] },
                { name: 'Hemoglobin', value: '16.8', unit: 'g/dL', status: 'high', trend: [15.2, 15.8, 16.2, 16.5, 16.8] },
                { name: 'CO2', value: '31', unit: 'mEq/L', status: 'high', trend: [26, 27, 28, 30, 31] },
                { name: 'BNP', value: '125', unit: 'pg/mL', status: 'normal', trend: [95, 102, 110, 118, 125] },
                { name: 'Procalcitonin', value: '0.08', unit: 'ng/mL', status: 'normal', trend: [0.05, 0.06, 0.07, 0.08, 0.08] }
            ],
            vitals: {
                timestamp: 'Today, 8:45 AM',
                bp: { value: '128/78', abnormal: false },
                hr: { value: '92', abnormal: false },
                temp: { value: '99.1°F', abnormal: false },
                spo2: { value: '91%', abnormal: true },
                weight: { value: '156 lbs', abnormal: false },
                bmi: { value: '24.1', abnormal: false }
            },
            medications: [
                { name: 'Prednisone', dose: '40mg daily x5 days', change: 'added', date: 'Feb 14' },
                { name: 'Azithromycin', dose: '250mg daily x5 days', change: 'added', date: 'Feb 14' },
                { name: 'Albuterol', dose: 'PRN q4h', change: 'modified', date: 'Feb 14' },
                { name: 'Tiotropium', dose: '18mcg daily', change: 'modified', date: 'Feb 10' }
            ],
            visits: [{
                date: 'Feb 1, 2026',
                assessment: 'COPD GOLD Stage III with frequent exacerbations (3 in past year). Current smoker 40 pack-years.',
                plan: [
                    'Continue triple inhaler therapy',
                    'Pulmonary rehabilitation referral',
                    'Smoking cessation counseling',
                    'Consider roflumilast if exacerbations continue',
                    'Repeat PFTs in 3 months'
                ]
            }],
            outsideEvents: [
                { title: 'ED Visit - Dyspnea', location: 'Regional Medical Center', date: 'Jan 28' },
                { title: 'Pulmonology Consult', location: 'Lung & Sleep Specialists', date: 'Feb 8' }
            ],
            careTeamNotes: [
                {
                    specialist: 'Dr. Amanda Foster',
                    role: 'Pulmonology',
                    date: 'Feb 8',
                    priority: 'urgent',
                    content: 'FEV1 declined to 42% predicted. Starting triple therapy. Strong recommendation for pulmonary rehab - patient motivated to quit smoking.',
                    tags: ['action-needed', 'referral']
                },
                {
                    specialist: 'Nicole Brown, RRT',
                    role: 'Respiratory Therapy',
                    date: 'Feb 6',
                    priority: 'routine',
                    content: 'Nebulizer technique reviewed. Patient using spacer correctly. Provided peak flow meter for home monitoring.',
                    tags: ['education']
                },
                {
                    specialist: 'Dr. Kevin Liu',
                    role: 'Tobacco Cessation',
                    date: 'Feb 1',
                    priority: 'important',
                    content: 'Patient expressed readiness to quit. Started on nicotine patch 21mg + PRN lozenges. Set quit date for Feb 15.',
                    tags: ['follow-up', 'medication']
                }
            ],
            riskFlags: [
                { label: 'COPD Exacerbation', level: 'critical' },
                { label: 'Active Smoker', level: 'warning' }
            ],
            conditions: ['COPD', 'Chronic Bronchitis', 'Nicotine Dependence', 'Hypoxemia']
        },
        // Patient 3: Rheumatoid Arthritis
        {
            reasonForVisit: 'RA Follow-up • Joint Pain Assessment',
            careGaps: [
                { title: 'Overdue: TB Screening', detail: 'Annual TB test required on biologics', priority: 'high' },
                { title: 'Hepatitis B Serology', detail: 'Monitoring due before next infusion', priority: 'high' },
                { title: 'DEXA Scan', detail: 'Bone density screening due - chronic steroid use', priority: 'medium' },
                { title: 'Ophthalmology Exam', detail: 'Annual eye exam for hydroxychloroquine', priority: 'medium' }
            ],
            labs: [
                { name: 'CRP', value: '3.2', unit: 'mg/dL', status: 'high', trend: [0.8, 1.2, 1.9, 2.5, 3.2] },
                { name: 'ESR', value: '48', unit: 'mm/hr', status: 'high', trend: [22, 28, 35, 42, 48] },
                { name: 'RF', value: '156', unit: 'IU/mL', status: 'high', trend: [120, 132, 140, 148, 156] },
                { name: 'Hemoglobin', value: '11.8', unit: 'g/dL', status: 'low', trend: [12.5, 12.2, 12.0, 11.9, 11.8] },
                { name: 'ALT', value: '32', unit: 'U/L', status: 'normal', trend: [28, 29, 30, 31, 32] },
                { name: 'WBC', value: '4.2', unit: 'K/uL', status: 'normal', trend: [5.1, 4.8, 4.5, 4.3, 4.2] }
            ],
            vitals: {
                timestamp: 'Today, 11:00 AM',
                bp: { value: '124/76', abnormal: false },
                hr: { value: '72', abnormal: false },
                temp: { value: '98.2°F', abnormal: false },
                spo2: { value: '98%', abnormal: false },
                weight: { value: '142 lbs', abnormal: false },
                bmi: { value: '23.6', abnormal: false }
            },
            medications: [
                { name: 'Adalimumab', dose: '40mg q2wks', change: 'modified', date: 'Feb 6' },
                { name: 'Methotrexate', dose: '15mg weekly', change: 'modified', date: 'Feb 1' },
                { name: 'Folic Acid', dose: '1mg daily', change: 'added', date: 'Feb 1' },
                { name: 'Prednisone', dose: '5mg daily', change: 'removed', date: 'Jan 28' }
            ],
            visits: [{
                date: 'Jan 20, 2026',
                assessment: 'Seropositive RA with moderate disease activity (DAS28 4.2). Inadequate response to MTX monotherapy.',
                plan: [
                    'Initiate adalimumab - insurance approved',
                    'Continue methotrexate as anchor drug',
                    'Taper prednisone over 4 weeks',
                    'Repeat labs in 6 weeks',
                    'TB test before biologic start'
                ]
            }],
            outsideEvents: [
                { title: 'Rheumatology Infusion', location: 'Arthritis Care Center', date: 'Feb 6' },
                { title: 'Hand X-rays', location: 'Imaging Associates', date: 'Jan 18' }
            ],
            careTeamNotes: [
                {
                    specialist: 'Dr. Elena Rodriguez',
                    role: 'Rheumatology',
                    date: 'Feb 6',
                    priority: 'important',
                    content: 'First adalimumab injection completed. Tolerated well. Rising inflammatory markers concerning - may need dose escalation if no improvement in 8 weeks.',
                    tags: ['monitoring', 'medication']
                },
                {
                    specialist: 'Dr. Thomas Grant',
                    role: 'Infectious Disease',
                    date: 'Jan 25',
                    priority: 'routine',
                    content: 'Cleared for biologic therapy. TB screening negative. Hepatitis panel unremarkable. Continue annual screening.',
                    tags: ['documentation']
                },
                {
                    specialist: 'Jennifer Walsh, OT',
                    role: 'Occupational Therapy',
                    date: 'Jan 22',
                    priority: 'routine',
                    content: 'Hand function assessment completed. Provided joint protection techniques and adaptive devices. Recommend wrist splints for nighttime use.',
                    tags: ['therapy', 'equipment']
                }
            ],
            riskFlags: [
                { label: 'RA Flare', level: 'warning' },
                { label: 'On Biologics', level: 'info' }
            ],
            conditions: ['Rheumatoid Arthritis', 'Anemia of Chronic Disease', 'Osteopenia']
        },
        // Patient 4: Mental Health / Depression
        {
            reasonForVisit: 'Depression Follow-up • Medication Check',
            careGaps: [
                { title: 'PHQ-9 Screening', detail: 'Depression screening due - last score was 18', priority: 'high' },
                { title: 'Suicide Risk Assessment', detail: 'Document safety plan review', priority: 'high' },
                { title: 'Thyroid Function', detail: 'TSH not checked in 12 months', priority: 'medium' }
            ],
            labs: [
                { name: 'TSH', value: '4.8', unit: 'mIU/L', status: 'normal', trend: [3.2, 3.8, 4.2, 4.5, 4.8] },
                { name: 'Vitamin D', value: '18', unit: 'ng/mL', status: 'low', trend: [28, 24, 22, 20, 18] },
                { name: 'B12', value: '320', unit: 'pg/mL', status: 'normal', trend: [380, 360, 345, 330, 320] },
                { name: 'CBC', value: 'Normal', unit: '', status: 'normal', trend: [1, 1, 1, 1, 1] },
                { name: 'CMP', value: 'Normal', unit: '', status: 'normal', trend: [1, 1, 1, 1, 1] }
            ],
            vitals: {
                timestamp: 'Today, 2:15 PM',
                bp: { value: '116/74', abnormal: false },
                hr: { value: '68', abnormal: false },
                temp: { value: '98.0°F', abnormal: false },
                spo2: { value: '99%', abnormal: false },
                weight: { value: '168 lbs', abnormal: false },
                bmi: { value: '25.8', abnormal: false }
            },
            medications: [
                { name: 'Sertraline', dose: '100mg daily', change: 'modified', date: 'Feb 8' },
                { name: 'Trazodone', dose: '50mg at bedtime', change: 'added', date: 'Feb 8' },
                { name: 'Vitamin D3', dose: '2000 IU daily', change: 'added', date: 'Feb 1' },
                { name: 'Bupropion', dose: '150mg daily', change: 'removed', date: 'Jan 25' }
            ],
            visits: [{
                date: 'Jan 25, 2026',
                assessment: 'Major depressive disorder, recurrent, moderate. PHQ-9 score 18. Sleep disturbance and fatigue prominent.',
                plan: [
                    'Increase sertraline to 100mg',
                    'Add trazodone for sleep',
                    'Discontinue bupropion due to anxiety',
                    'Therapy referral - CBT',
                    'Follow up in 4 weeks'
                ]
            }],
            outsideEvents: [
                { title: 'Psychiatry Consult', location: 'Behavioral Health Associates', date: 'Jan 15' },
                { title: 'Therapy Session', location: 'Mindful Counseling', date: 'Feb 10' }
            ],
            careTeamNotes: [
                {
                    specialist: 'Dr. David Nguyen',
                    role: 'Psychiatry',
                    date: 'Feb 12',
                    priority: 'important',
                    content: 'Patient responding partially to sertraline increase. Sleep improved with trazodone. Recommend continuing current regimen for 4 more weeks before considering augmentation.',
                    tags: ['monitoring', 'medication']
                },
                {
                    specialist: 'Sarah Mitchell, LCSW',
                    role: 'Therapist',
                    date: 'Feb 10',
                    priority: 'routine',
                    content: 'CBT session 4 completed. Working on cognitive restructuring. Patient engaged and completing homework. Safety plan reviewed - no current SI.',
                    tags: ['therapy', 'follow-up']
                },
                {
                    specialist: 'Care Manager',
                    role: 'Behavioral Health Team',
                    date: 'Feb 5',
                    priority: 'routine',
                    content: 'Weekly check-in completed. Patient attending therapy regularly. Medication adherent. Connected with peer support group starting next week.',
                    tags: ['care-coordination']
                }
            ],
            riskFlags: [
                { label: 'Depression', level: 'warning' },
                { label: 'Monitor Closely', level: 'info' }
            ],
            conditions: ['Major Depressive Disorder', 'Generalized Anxiety', 'Insomnia', 'Vitamin D Deficiency']
        }
    ];
    
    // Get scenario based on patient index (cycle through if more patients than scenarios)
    const scenario = scenarios[patientIndex % scenarios.length];
    
    // Add age-based risk flags
    const riskFlags = [...scenario.riskFlags];
    if (age > 65) riskFlags.unshift({ label: 'Fall Risk', level: 'warning' });
    if (age > 75) riskFlags.unshift({ label: 'Frailty Screen', level: 'info' });
    
    return {
        reasonForVisit: scenario.reasonForVisit,
        riskFlags,
        careGaps: scenario.careGaps,
        labs: scenario.labs,
        vitals: scenario.vitals,
        medications: scenario.medications,
        visits: scenario.visits,
        outsideEvents: scenario.outsideEvents,
        careTeamNotes: scenario.careTeamNotes || [],
        guidelines: [
            { id: 1, title: 'Relevant Clinical Guidelines', source: 'Various Sources' }
        ],
        conditions: scenario.conditions
    };
}

// Helper functions
function getPatientName(patient) {
    if (!patient.name || patient.name.length === 0) return 'Unknown';
    const name = patient.name[0];
    const given = name.given ? name.given.join(' ') : '';
    const family = name.family || '';
    return `${given} ${family}`.trim() || 'Unknown';
}

function getInitials(name) {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
}

function calculateAge(birthDate) {
    if (!birthDate) return '?';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

function getMRN(patient) {
    if (!patient.identifier) return 'N/A';
    const mrn = patient.identifier.find(id => 
        id.type?.coding?.some(c => c.code === 'MR') ||
        id.system?.includes('medical-record')
    );
    return mrn?.value?.substring(0, 8) || patient.identifier[0]?.value?.substring(0, 8) || 'N/A';
}

// Customization
function toggleCustomizePanel() {
    const panel = document.getElementById('customizePanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function loadCustomization() {
    const saved = localStorage.getItem('pulseCustomization');
    if (saved) {
        customization = JSON.parse(saved);
        Object.keys(customization).forEach(key => {
            const el = document.getElementById(key);
            if (el) el.checked = customization[key];
        });
    }
    
    // Add change listeners
    ['showCareGaps', 'showLabTrends', 'showMeds', 'showVisit', 'showOutside', 'showPublications'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                customization[id] = el.checked;
                localStorage.setItem('pulseCustomization', JSON.stringify(customization));
                applyCustomization();
            });
        }
    });
}

function applyCustomization() {
    document.getElementById('careGapsSection').style.display = customization.showCareGaps ? 'block' : 'none';
    document.getElementById('labsSection').style.display = customization.showLabTrends ? 'block' : 'none';
    document.getElementById('medsSection').style.display = customization.showMeds ? 'block' : 'none';
    document.getElementById('visitSection').style.display = customization.showVisit ? 'block' : 'none';
    document.getElementById('outsideSection').style.display = customization.showOutside ? 'block' : 'none';
}

// Current source type for EHR deep-link
let currentSourceType = '';

// Actions
function openSource(sourceType) {
    currentSourceType = sourceType;
    const modal = document.getElementById('detailModal');
    const titleEl = document.getElementById('detailModalTitle');
    const iconEl = document.getElementById('detailModalIcon');
    const bodyEl = document.getElementById('detailModalBody');
    
    const content = getModalContent(sourceType);
    
    titleEl.textContent = content.title;
    iconEl.className = `detail-modal-icon ${content.iconClass}`;
    iconEl.innerHTML = content.icon;
    bodyEl.innerHTML = content.body;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openInEHR() {
    alert(`Opening ${currentSourceType} in EHR... (Demo: would deep-link to source system)`);
    closeDetailModal();
}

function getModalContent(sourceType) {
    const patient = currentClinicalData;
    if (!patient) return { title: 'No Data', icon: '', iconClass: '', body: '<p>Please select a patient first.</p>' };
    
    const icons = {
        labs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>',
        vitals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        meds: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>',
        visit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        outside: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        research: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>',
        careteam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
        caregaps: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    
    // Handle specific care gap items
    if (sourceType.startsWith('caregap-')) {
        const idx = parseInt(sourceType.split('-')[1]);
        return getCareGapDetail(patient.careGaps[idx], idx);
    }
    
    // Handle specific research items
    if (sourceType.startsWith('research-')) {
        const idx = parseInt(sourceType.split('-')[1]);
        return getResearchDetail(currentResearchData[idx], idx);
    }
    
    switch (sourceType) {
        case 'labs':
            return {
                title: 'Labs & Imaging Results',
                icon: icons.labs,
                iconClass: 'labs',
                body: getLabsDetailContent(patient)
            };
        case 'vitals':
            return {
                title: 'Vitals History',
                icon: icons.vitals,
                iconClass: 'vitals',
                body: getVitalsDetailContent(patient)
            };
        case 'meds':
            return {
                title: 'Medication History',
                icon: icons.meds,
                iconClass: 'meds',
                body: getMedsDetailContent(patient)
            };
        case 'visit':
        case 'visits':
            return {
                title: 'Visit Notes & History',
                icon: icons.visit,
                iconClass: 'visit',
                body: getVisitDetailContent(patient)
            };
        case 'outside':
            return {
                title: 'Outside Care Records',
                icon: icons.outside,
                iconClass: 'outside',
                body: getOutsideDetailContent(patient)
            };
        case 'research':
            return {
                title: 'Relevant Research',
                icon: icons.research,
                iconClass: 'research',
                body: getResearchListContent()
            };
        case 'careteam':
            return {
                title: 'Care Team Notes',
                icon: icons.careteam,
                iconClass: 'careteam',
                body: getCareTeamDetailContent(patient)
            };
        case 'caregaps':
            return {
                title: 'Care Gaps & Action Items',
                icon: icons.caregaps,
                iconClass: 'caregaps',
                body: getCareGapsDetailContent(patient)
            };
        case 'patient':
            return {
                title: 'Patient Demographics',
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                iconClass: 'careteam',
                body: getPatientDetailContent()
            };
        default:
            return {
                title: 'Details',
                icon: icons.labs,
                iconClass: 'labs',
                body: '<p>No additional details available.</p>'
            };
    }
}

function getPatientDetailContent() {
    if (!selectedPatient) return '<p>No patient selected.</p>';
    
    const name = getPatientName(selectedPatient);
    const age = calculateAge(selectedPatient.birthDate);
    const gender = selectedPatient.gender || 'Unknown';
    const mrn = getMRN(selectedPatient);
    const dob = selectedPatient.birthDate || 'Unknown';
    
    return `
        <div class="modal-section">
            <div class="modal-section-title">Patient Information</div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Full Name</span>
                <span class="modal-detail-value">${name}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Date of Birth</span>
                <span class="modal-detail-value">${dob}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Age</span>
                <span class="modal-detail-value">${age} years</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Gender</span>
                <span class="modal-detail-value">${gender}</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">MRN</span>
                <span class="modal-detail-value">${mrn}</span>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Contact Information</div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Phone</span>
                <span class="modal-detail-value">(555) 123-4567</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Email</span>
                <span class="modal-detail-value">${name.toLowerCase().replace(' ', '.')}@email.com</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Address</span>
                <span class="modal-detail-value">123 Main Street, Boston, MA 02101</span>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Emergency Contact</div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Name</span>
                <span class="modal-detail-value">Jane Doe (Spouse)</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Phone</span>
                <span class="modal-detail-value">(555) 987-6543</span>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Insurance</div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Primary Insurance</span>
                <span class="modal-detail-value">Blue Cross Blue Shield</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Member ID</span>
                <span class="modal-detail-value">XYZ123456789</span>
            </div>
            <div class="modal-detail-row">
                <span class="modal-detail-label">Group Number</span>
                <span class="modal-detail-value">GRP-98765</span>
            </div>
        </div>
    `;
}

// Store current clinical and research data for modal access
let currentClinicalData = null;
let currentResearchData = [];

function getLabsDetailContent(patient) {
    const labHistory = [
        { date: 'Feb 10, 2026', test: 'HbA1c', value: patient.labs.find(l => l.name === 'HbA1c')?.value || '7.8', unit: '%', status: 'high', ref: '4.0-5.6' },
        { date: 'Feb 10, 2026', test: 'eGFR', value: patient.labs.find(l => l.name === 'eGFR')?.value || '58', unit: 'mL/min', status: 'low', ref: '>60' },
        { date: 'Feb 10, 2026', test: 'Creatinine', value: patient.labs.find(l => l.name === 'Creatinine')?.value || '1.5', unit: 'mg/dL', status: 'high', ref: '0.7-1.3' },
        { date: 'Feb 10, 2026', test: 'LDL-C', value: patient.labs.find(l => l.name === 'LDL-C')?.value || '142', unit: 'mg/dL', status: 'high', ref: '<100' },
        { date: 'Feb 10, 2026', test: 'TSH', value: patient.labs.find(l => l.name === 'TSH')?.value || '2.4', unit: 'mIU/L', status: 'normal', ref: '0.4-4.0' },
        { date: 'Feb 10, 2026', test: 'K+', value: patient.labs.find(l => l.name === 'K+')?.value || '4.8', unit: 'mEq/L', status: 'normal', ref: '3.5-5.0' },
        { date: 'Oct 15, 2025', test: 'HbA1c', value: '7.2', unit: '%', status: 'high', ref: '4.0-5.6' },
        { date: 'Oct 15, 2025', test: 'eGFR', value: '62', unit: 'mL/min', status: 'normal', ref: '>60' },
        { date: 'Jun 20, 2025', test: 'HbA1c', value: '6.9', unit: '%', status: 'high', ref: '4.0-5.6' },
        { date: 'Jun 20, 2025', test: 'LDL-C', value: '128', unit: 'mg/dL', status: 'high', ref: '<100' },
    ];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Key Findings</div>
            <div class="modal-highlight-text">
                HbA1c trending upward (6.9% → 7.2% → 7.8%) over 8 months, suggesting worsening glycemic control. 
                eGFR declining (62 → 58 mL/min), now Stage 3a CKD. LDL-C remains above target at 142 mg/dL despite statin therapy.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Complete Lab History</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Test</th>
                        <th>Result</th>
                        <th>Reference</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${labHistory.map(lab => `
                        <tr>
                            <td>${lab.date}</td>
                            <td>${lab.test}</td>
                            <td class="value-${lab.status}">${lab.value} ${lab.unit}</td>
                            <td>${lab.ref}</td>
                            <td><span class="modal-tag ${lab.status === 'high' || lab.status === 'low' ? 'urgent' : 'routine'}">${lab.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Pending Orders</div>
            <div class="modal-note">
                <div class="modal-note-header">
                    <span class="modal-note-author">Comprehensive Metabolic Panel</span>
                    <span class="modal-tag pending">Pending</span>
                </div>
                <div class="modal-note-content">Ordered Feb 20, 2026. Patient scheduled for collection Feb 28, 2026.</div>
            </div>
            <div class="modal-note">
                <div class="modal-note-header">
                    <span class="modal-note-author">Lipid Panel</span>
                    <span class="modal-tag pending">Pending</span>
                </div>
                <div class="modal-note-content">Ordered Feb 20, 2026. To be drawn with CMP on Feb 28, 2026.</div>
            </div>
        </div>
    `;
}

function getVitalsDetailContent(patient) {
    const vitalsHistory = [
        { date: 'Today, 9:15 AM', bp: patient.vitals?.bp || '142/88', hr: patient.vitals?.hr || '78', temp: patient.vitals?.temp || '98.4', spo2: patient.vitals?.spo2 || '97', weight: patient.vitals?.weight || '198', location: 'Clinic Check-in' },
        { date: 'Jan 28, 2026', bp: '138/84', hr: '74', temp: '98.2', spo2: '98', weight: '196', location: 'Office Visit' },
        { date: 'Dec 15, 2025', bp: '144/90', hr: '82', temp: '98.6', spo2: '96', weight: '200', location: 'Office Visit' },
        { date: 'Oct 15, 2025', bp: '136/82', hr: '76', temp: '98.4', spo2: '97', weight: '194', location: 'Office Visit' },
        { date: 'Aug 10, 2025', bp: '140/86', hr: '80', temp: '98.5', spo2: '98', weight: '192', location: 'Office Visit' },
    ];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Vital Signs Summary</div>
            <div class="modal-highlight-text">
                Blood pressure elevated at 142/88 mmHg (target <130/80 for diabetic patient). 
                Weight increased 6 lbs over 6 months (192 → 198 lbs). BMI currently 31.2 (Class I Obesity).
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Today's Vitals</div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md);">
                <div class="modal-note" style="text-align: center; border-left-color: var(--accent-red);">
                    <div class="modal-note-author" style="color: var(--accent-red);">Blood Pressure</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-red);">${patient.vitals?.bp || '142/88'}</div>
                    <div class="modal-note-content">mmHg (elevated)</div>
                </div>
                <div class="modal-note" style="text-align: center; border-left-color: var(--accent-green);">
                    <div class="modal-note-author">Heart Rate</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${patient.vitals?.hr || '78'}</div>
                    <div class="modal-note-content">bpm (normal)</div>
                </div>
                <div class="modal-note" style="text-align: center; border-left-color: var(--accent-green);">
                    <div class="modal-note-author">SpO2</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${patient.vitals?.spo2 || '97'}%</div>
                    <div class="modal-note-content">normal</div>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Vitals History</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>BP</th>
                        <th>HR</th>
                        <th>Temp</th>
                        <th>SpO2</th>
                        <th>Weight</th>
                    </tr>
                </thead>
                <tbody>
                    ${vitalsHistory.map(v => `
                        <tr>
                            <td>${v.date}</td>
                            <td class="${parseInt(v.bp.split('/')[0]) > 130 ? 'value-high' : ''}">${v.bp}</td>
                            <td>${v.hr}</td>
                            <td>${v.temp}°F</td>
                            <td>${v.spo2}%</td>
                            <td>${v.weight} lbs</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getMedsDetailContent(patient) {
    const allMeds = [
        { name: 'Metformin', dose: '1000mg', frequency: 'BID', start: 'Feb 10, 2026', prescriber: 'Dr. Thompson', status: 'active', change: 'Increased from 500mg' },
        { name: 'Lisinopril', dose: '20mg', frequency: 'Daily', start: 'Feb 8, 2026', prescriber: 'Dr. Thompson', status: 'active', change: 'New prescription' },
        { name: 'Atorvastatin', dose: '40mg', frequency: 'Nightly', start: 'Feb 5, 2026', prescriber: 'Dr. Thompson', status: 'active', change: 'Increased from 20mg' },
        { name: 'Glipizide', dose: '5mg', frequency: 'Daily', start: 'Feb 3, 2026', prescriber: 'Dr. Thompson', status: 'active', change: 'New prescription' },
        { name: 'Aspirin', dose: '81mg', frequency: 'Daily', start: 'Mar 15, 2024', prescriber: 'Dr. Thompson', status: 'active', change: null },
        { name: 'Vitamin D3', dose: '2000 IU', frequency: 'Daily', start: 'Jan 10, 2025', prescriber: 'Dr. Thompson', status: 'active', change: null },
    ];
    
    const discontinued = [
        { name: 'Metformin', dose: '500mg', frequency: 'BID', end: 'Feb 10, 2026', reason: 'Dose increased to 1000mg' },
        { name: 'Atorvastatin', dose: '20mg', frequency: 'Nightly', end: 'Feb 5, 2026', reason: 'Dose increased to 40mg' },
    ];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Recent Changes</div>
            <div class="modal-highlight-text">
                4 medication changes in the last 30 days: Metformin increased to 1000mg BID, Atorvastatin increased to 40mg, 
                new Lisinopril 20mg for renoprotection, and new Glipizide 5mg for glycemic control.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Active Medications (${allMeds.length})</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Medication</th>
                        <th>Dose</th>
                        <th>Frequency</th>
                        <th>Started</th>
                        <th>Change</th>
                    </tr>
                </thead>
                <tbody>
                    ${allMeds.map(med => `
                        <tr>
                            <td><strong>${med.name}</strong></td>
                            <td>${med.dose}</td>
                            <td>${med.frequency}</td>
                            <td>${med.start}</td>
                            <td>${med.change ? `<span class="modal-tag new">${med.change}</span>` : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Recently Discontinued</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Medication</th>
                        <th>Previous Dose</th>
                        <th>Discontinued</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    ${discontinued.map(med => `
                        <tr>
                            <td>${med.name}</td>
                            <td>${med.dose} ${med.frequency}</td>
                            <td>${med.end}</td>
                            <td>${med.reason}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Drug Interactions</div>
            <div class="modal-note" style="border-left-color: var(--accent-yellow);">
                <div class="modal-note-header">
                    <span class="modal-note-author">Metformin + Lisinopril</span>
                    <span class="modal-tag pending">Minor</span>
                </div>
                <div class="modal-note-content">Monitor renal function. Both medications may affect kidney function. Current eGFR 58 - continue monitoring.</div>
            </div>
        </div>
    `;
}

function getVisitDetailContent(patient) {
    const visits = [
        {
            date: 'Jan 28, 2026',
            type: 'Office Visit',
            provider: 'Dr. Sarah Thompson',
            chief: 'Diabetes follow-up, medication review',
            assessment: patient.lastVisit?.assessment || 'T2DM with worsening glycemic control (A1c 7.8%). Stage 3a CKD (eGFR 58). HTN not at goal.',
            plan: patient.lastVisit?.plan || ['Increase Metformin to 1000mg BID', 'Add Lisinopril 20mg for renoprotection', 'Start high-intensity statin', 'Repeat labs in 3 months']
        },
        {
            date: 'Dec 15, 2025',
            type: 'Office Visit',
            provider: 'Dr. Sarah Thompson',
            chief: 'Routine diabetes check',
            assessment: 'T2DM stable on current regimen. A1c 7.2%. BP slightly elevated.',
            plan: ['Continue current medications', 'Reinforce dietary counseling', 'Schedule eye exam', 'Follow up in 6 weeks']
        },
        {
            date: 'Oct 15, 2025',
            type: 'Office Visit',
            provider: 'Dr. Sarah Thompson',
            chief: 'Annual wellness visit',
            assessment: 'Overall health stable. T2DM controlled. Due for routine screenings.',
            plan: ['Order colonoscopy', 'Update vaccinations', 'Continue current therapy', 'Refer to ophthalmology']
        }
    ];
    
    return `
        <div class="modal-section">
            <div class="modal-section-title">Visit Timeline</div>
            <div class="modal-timeline">
                ${visits.map(visit => `
                    <div class="modal-timeline-item">
                        <div class="modal-timeline-date">${visit.date} - ${visit.type}</div>
                        <div class="modal-note">
                            <div class="modal-note-header">
                                <span class="modal-note-author">${visit.provider}</span>
                            </div>
                            <div class="modal-note-content">
                                <strong>Chief Complaint:</strong> ${visit.chief}<br><br>
                                <strong>Assessment:</strong> ${visit.assessment}<br><br>
                                <strong>Plan:</strong>
                                <ul style="margin: 8px 0 0 16px; padding: 0;">
                                    ${visit.plan.map(p => `<li>${p}</li>`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getOutsideDetailContent(patient) {
    const outsideRecords = [
        {
            date: 'Jan 20, 2026',
            facility: 'Heart Care Associates',
            provider: 'Dr. James Wilson, Cardiology',
            type: 'Consultation',
            summary: 'Stress test negative for ischemia. Echo shows preserved EF at 55%. No significant valvular disease. Recommend continuing current cardiovascular risk management.',
            documents: ['Stress Test Report', 'Echocardiogram Report', 'Consultation Note']
        },
        {
            date: 'Jan 15, 2026',
            facility: 'City General Hospital',
            provider: 'Emergency Department',
            type: 'ED Visit',
            summary: 'Presented with atypical chest pain. Troponins negative x2. EKG normal sinus rhythm. Discharged with cardiology follow-up recommendation.',
            documents: ['ED Discharge Summary', 'EKG Report', 'Lab Results']
        },
        {
            date: 'Aug 15, 2025',
            facility: 'Vision Care Center',
            provider: 'Dr. Maria Santos, Ophthalmology',
            type: 'Eye Exam',
            summary: 'Mild non-proliferative diabetic retinopathy noted in both eyes. No macular edema. Recommend repeat exam in 6 months - now overdue.',
            documents: ['Fundoscopy Report', 'Visual Acuity Results']
        }
    ];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Outside Care Summary</div>
            <div class="modal-highlight-text">
                3 external encounters documented. Recent cardiology evaluation reassuring with negative stress test. 
                Eye exam from August shows early diabetic retinopathy - 6-month follow-up is now overdue.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">External Records</div>
            ${outsideRecords.map(record => `
                <div class="modal-note" style="margin-bottom: var(--space-md);">
                    <div class="modal-note-header">
                        <span class="modal-note-author">${record.facility}</span>
                        <span class="modal-note-date">${record.date}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--accent-primary); margin-bottom: 8px;">${record.provider} • ${record.type}</div>
                    <div class="modal-note-content">${record.summary}</div>
                    <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        ${record.documents.map(doc => `
                            <span class="modal-tag new" style="cursor: pointer;">📄 ${doc}</span>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getResearchListContent() {
    if (!currentResearchData || currentResearchData.length === 0) {
        return '<p>No research articles available.</p>';
    }
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">AI-Selected Research</div>
            <div class="modal-highlight-text">
                These articles were selected based on the patient's conditions (Type 2 Diabetes, CKD Stage 3a, Hypertension) 
                and recent clinical decisions. Click any article for more details.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Relevant Articles (${currentResearchData.length})</div>
            ${currentResearchData.map((article, idx) => `
                <div class="modal-note" style="margin-bottom: var(--space-md); cursor: pointer;" onclick="openSource('research-${idx}')">
                    <div class="modal-note-header">
                        <span class="modal-note-author">${article.title}</span>
                        <span class="modal-tag new">${article.year}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">${article.source}</div>
                    <div class="modal-note-content">${article.summary || 'Click to view article details and relevance to this patient.'}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function getResearchDetail(article, idx) {
    if (!article) {
        return { title: 'Article Not Found', icon: '', iconClass: 'research', body: '<p>Article details not available.</p>' };
    }
    
    return {
        title: 'Research Article',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>',
        iconClass: 'research',
        body: `
            <div class="modal-section">
                <h3 style="color: var(--text-primary); margin-bottom: var(--space-sm);">${article.title}</h3>
                <div style="display: flex; gap: var(--space-md); margin-bottom: var(--space-md);">
                    <span class="modal-tag new">${article.year}</span>
                    <span style="color: var(--text-muted); font-size: 0.875rem;">${article.source}</span>
                </div>
            </div>
            
            <div class="modal-highlight-box">
                <div class="modal-highlight-title">Relevance to This Patient</div>
                <div class="modal-highlight-text">
                    This article is relevant to ${selectedPatient?.name || 'the patient'}'s care because it addresses 
                    management strategies for patients with similar conditions including Type 2 Diabetes and chronic kidney disease.
                </div>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Abstract</div>
                <div class="modal-note-content" style="line-height: 1.7;">
                    ${article.summary || 'This study examines current best practices and emerging therapies for the management of diabetic patients with comorbid conditions. The findings support an integrated approach to care that addresses glycemic control, cardiovascular risk, and renal protection simultaneously.'}
                </div>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Key Findings</div>
                <ul style="margin: 0; padding-left: var(--space-lg); color: var(--text-secondary); line-height: 1.8;">
                    <li>Early intervention with SGLT2 inhibitors shows renal protective benefits</li>
                    <li>Combined therapy approaches improve outcomes vs. monotherapy</li>
                    <li>Regular monitoring intervals recommended for patients with declining eGFR</li>
                    <li>Lifestyle modifications remain cornerstone of treatment</li>
                </ul>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Clinical Implications</div>
                <div class="modal-note">
                    <div class="modal-note-content">
                        Consider incorporating these findings into the patient's care plan. Discuss with the care team 
                        whether the recommended interventions are appropriate given the patient's current medication regimen and preferences.
                    </div>
                </div>
            </div>
        `
    };
}

function getCareTeamDetailContent(patient) {
    const notes = patient.careTeamNotes || [];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Care Team Overview</div>
            <div class="modal-highlight-text">
                ${notes.length} specialist notes on file. ${notes.filter(n => n.priority === 'urgent').length} urgent items 
                and ${notes.filter(n => n.tags?.includes('action-needed')).length} items requiring action.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">All Specialist Notes</div>
            ${notes.map(note => `
                <div class="modal-note" style="border-left-color: ${note.priority === 'urgent' ? 'var(--accent-red)' : note.priority === 'important' ? 'var(--accent-yellow)' : 'var(--accent-primary)'}; margin-bottom: var(--space-md);">
                    <div class="modal-note-header">
                        <span class="modal-note-author">${note.specialist} - ${note.role}</span>
                        <span class="modal-note-date">${note.date}</span>
                    </div>
                    <div class="modal-note-content">${note.content}</div>
                    <div style="margin-top: 8px; display: flex; gap: 6px;">
                        ${(note.tags || []).map(tag => `<span class="modal-tag ${tag === 'action-needed' || tag === 'overdue' ? 'urgent' : tag === 'follow-up' ? 'pending' : 'routine'}">${tag.replace('-', ' ')}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Care Team Members</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Provider</th>
                        <th>Specialty</th>
                        <th>Last Contact</th>
                        <th>Next Due</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Dr. Sarah Thompson</td>
                        <td>Primary Care</td>
                        <td>Jan 28, 2026</td>
                        <td>Today</td>
                    </tr>
                    ${notes.map(note => `
                        <tr>
                            <td>${note.specialist}</td>
                            <td>${note.role}</td>
                            <td>${note.date}</td>
                            <td>${note.tags?.includes('overdue') ? '<span class="value-high">Overdue</span>' : 'As needed'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function getCareGapsDetailContent(patient) {
    const gaps = patient.careGaps || [];
    
    return `
        <div class="modal-highlight-box">
            <div class="modal-highlight-title">Care Gap Summary</div>
            <div class="modal-highlight-text">
                ${gaps.length} care gaps identified. ${gaps.filter(g => g.priority === 1).length} high priority items 
                require immediate attention during this visit.
            </div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">All Care Gaps</div>
            ${gaps.map((gap, idx) => `
                <div class="modal-note" style="border-left-color: ${gap.priority === 1 ? 'var(--accent-red)' : gap.priority === 2 ? 'var(--accent-yellow)' : 'var(--accent-primary)'}; margin-bottom: var(--space-md); cursor: pointer;" onclick="openSource('caregap-${idx}')">
                    <div class="modal-note-header">
                        <span class="modal-note-author">${gap.title}</span>
                        <span class="modal-tag ${gap.priority === 1 ? 'urgent' : gap.priority === 2 ? 'pending' : 'routine'}">
                            Priority ${gap.priority}
                        </span>
                    </div>
                    <div class="modal-note-content">${gap.detail}</div>
                </div>
            `).join('')}
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Quality Measures Affected</div>
            <table class="modal-table">
                <thead>
                    <tr>
                        <th>Measure</th>
                        <th>Status</th>
                        <th>Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Diabetes: HbA1c Control</td>
                        <td><span class="value-high">Not Met</span></td>
                        <td>Ongoing</td>
                    </tr>
                    <tr>
                        <td>Diabetes: Eye Exam</td>
                        <td><span class="value-high">Overdue</span></td>
                        <td>Feb 15, 2026</td>
                    </tr>
                    <tr>
                        <td>Colorectal Cancer Screening</td>
                        <td><span class="modal-tag pending">Due</span></td>
                        <td>Mar 1, 2026</td>
                    </tr>
                    <tr>
                        <td>Statin Therapy for CVD</td>
                        <td><span class="modal-tag pending">Review</span></td>
                        <td>-</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function getCareGapDetail(gap, idx) {
    if (!gap) {
        return { title: 'Care Gap Not Found', icon: '', iconClass: 'caregaps', body: '<p>Details not available.</p>' };
    }
    
    const recommendations = {
        0: ['Order HbA1c test today', 'Review current diabetes medications', 'Consider adding or adjusting therapy', 'Schedule follow-up in 3 months'],
        1: ['Schedule dilated eye exam', 'Contact ophthalmology for urgent appointment', 'Document retinopathy status in problem list', 'Ensure patient understands importance'],
        2: ['Discuss colonoscopy with patient', 'Order FIT test as alternative if declined', 'Provide educational materials', 'Document patient preferences'],
        3: ['Review current statin dose and LDL', 'Consider high-intensity statin', 'Check for contraindications', 'Counsel on cardiovascular risk']
    };
    
    return {
        title: gap.title,
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        iconClass: 'caregaps',
        body: `
            <div class="modal-highlight-box" style="border-color: ${gap.priority === 1 ? 'rgba(251, 113, 133, 0.3)' : 'rgba(251, 191, 36, 0.3)'}; background: ${gap.priority === 1 ? 'rgba(251, 113, 133, 0.1)' : 'rgba(251, 191, 36, 0.1)'};">
                <div class="modal-highlight-title" style="color: ${gap.priority === 1 ? 'var(--accent-red)' : 'var(--accent-yellow)'};">
                    Priority ${gap.priority} - ${gap.priority === 1 ? 'Address Today' : 'Address Soon'}
                </div>
                <div class="modal-highlight-text">${gap.detail}</div>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Recommended Actions</div>
                <ul style="margin: 0; padding-left: var(--space-lg); color: var(--text-secondary); line-height: 2;">
                    ${(recommendations[idx] || recommendations[0]).map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Related Documentation</div>
                <div class="modal-note">
                    <div class="modal-note-header">
                        <span class="modal-note-author">Quality Measure</span>
                    </div>
                    <div class="modal-note-content">
                        This care gap affects quality reporting metrics. Addressing it will improve patient outcomes and care quality scores.
                    </div>
                </div>
            </div>
            
            <div class="modal-section">
                <div class="modal-section-title">Quick Actions</div>
                <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
                    <button class="modal-btn primary" onclick="alert('Order placed (Demo)')">Place Order</button>
                    <button class="modal-btn secondary" onclick="alert('Referral sent (Demo)')">Send Referral</button>
                    <button class="modal-btn secondary" onclick="alert('Added to visit summary (Demo)')">Add to Visit</button>
                </div>
            </div>
        `
    };
}

function refreshBriefing() {
    if (selectedPatient) {
        showLoading(true);
        setTimeout(() => loadDashboard(), 500);
    }
}

function printBriefing() {
    window.print();
}

function emailDigest() {
    alert('Email digest would be sent to your inbox (Demo feature)');
}

// Audio state
let audioState = {
    isPlaying: false,
    isPaused: false,
    audioElement: null,
    isGenerating: false
};

// Stop any currently playing audio (call this before starting new audio or switching patients)
function stopAllAudio() {
    if (audioState.audioElement) {
        audioState.audioElement.pause();
        audioState.audioElement.currentTime = 0;
        audioState.audioElement = null;
    }
    audioState.isPlaying = false;
    audioState.isPaused = false;
    audioState.isGenerating = false;
    updateAudioButton('stopped');
    showAudioControls(false);
    removeAudioIndicator();
    
    // Remove paused state too
    const synthSection = document.querySelector('.ai-synthesis-section');
    if (synthSection) {
        synthSection.classList.remove('audio-paused');
    }
}

// Add visual indicator showing where audio is coming from
function showAudioIndicator() {
    const synthSection = document.querySelector('.ai-synthesis-section');
    if (synthSection) {
        synthSection.classList.remove('audio-paused');
        synthSection.classList.add('audio-playing');
    }
}

function removeAudioIndicator() {
    const synthSection = document.querySelector('.ai-synthesis-section');
    if (synthSection) {
        synthSection.classList.remove('audio-playing');
        synthSection.classList.remove('audio-paused');
    }
}

// Convert clinical text to conversational speech for audio
async function convertToConversational(clinicalText) {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Convert this clinical summary into natural, warm conversational speech as if you're a friendly colleague giving a quick verbal briefing in the hallway. 

Make it sound like natural spoken English - use contractions, conversational flow, and a warm tone. Avoid medical abbreviations - say them as full words. Keep it to 2-3 sentences.

Clinical text: "${clinicalText}"`,
                context: 'Convert to conversational audio'
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.response;
        }
    } catch (error) {
        console.error('Error converting to conversational:', error);
    }
    
    // Fallback: return original with minor cleanup for speech
    return clinicalText
        .replace(/HbA1c/g, 'H-b-A-1-c')
        .replace(/eGFR/g, 'estimated G-F-R')
        .replace(/BP/g, 'blood pressure')
        .replace(/T2DM/g, 'type 2 diabetes')
        .replace(/CKD/g, 'chronic kidney disease')
        .replace(/HTN/g, 'hypertension')
        .replace(/LDL-C/g, 'LDL cholesterol');
}

// Generate natural speech using OpenAI TTS
async function generateNaturalSpeech(text) {
    const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
        throw new Error('TTS generation failed');
    }
    
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
}

async function audioSummary() {
    const clinicalText = document.getElementById('aiSynthesis').textContent;
    
    if (!clinicalText || clinicalText === 'Generating synthesis...') {
        alert('Audio summary not available yet. Please wait for the synthesis to complete.');
        return;
    }
    
    // Prevent multiple simultaneous requests
    if (audioState.isGenerating) {
        return;
    }
    
    // If paused, resume
    if (audioState.isPaused && audioState.audioElement) {
        audioState.audioElement.play();
        audioState.isPlaying = true;
        audioState.isPaused = false;
        updateAudioButton('playing');
        showAudioIndicator();
        return;
    }
    
    // If already playing, do nothing
    if (audioState.isPlaying) {
        return;
    }
    
    // Stop any existing audio first
    stopAllAudio();
    
    // Show audio controls and indicator
    showAudioControls(true);
    showAudioIndicator();
    audioState.isGenerating = true;
    
    const audioLabel = document.querySelector('.audio-label');
    if (audioLabel) audioLabel.textContent = 'Preparing audio...';
    
    try {
        // Convert clinical text to conversational
        const conversationalText = await convertToConversational(clinicalText);
        
        if (audioLabel) audioLabel.textContent = 'Generating speech...';
        
        // Generate natural speech using OpenAI TTS
        const audioUrl = await generateNaturalSpeech(conversationalText);
        
        // Create and play audio
        audioState.audioElement = new Audio(audioUrl);
        audioState.isGenerating = false;
        
        audioState.audioElement.onplay = () => {
            audioState.isPlaying = true;
            audioState.isPaused = false;
            updateAudioButton('playing');
            showAudioIndicator();
            if (audioLabel) audioLabel.textContent = 'Playing Audio Brief...';
        };
        
        audioState.audioElement.onended = () => {
            audioState.isPlaying = false;
            audioState.isPaused = false;
            updateAudioButton('stopped');
            showAudioControls(false);
            removeAudioIndicator();
            URL.revokeObjectURL(audioUrl);
        };
        
        audioState.audioElement.onerror = () => {
            audioState.isPlaying = false;
            audioState.isPaused = false;
            audioState.isGenerating = false;
            updateAudioButton('stopped');
            showAudioControls(false);
            removeAudioIndicator();
            alert('Error playing audio. Please try again.');
        };
        
        await audioState.audioElement.play();
        
    } catch (error) {
        console.error('Audio error:', error);
        audioState.isGenerating = false;
        removeAudioIndicator();
        if (audioLabel) audioLabel.textContent = 'Audio failed';
        setTimeout(() => showAudioControls(false), 2000);
        alert('Could not generate audio. Please try again.');
    }
}

function pauseAudio() {
    if (audioState.isPlaying && !audioState.isPaused && audioState.audioElement) {
        audioState.audioElement.pause();
        audioState.isPaused = true;
        audioState.isPlaying = false;
        updateAudioButton('paused');
        // Keep indicator but change to paused state
        const synthSection = document.querySelector('.ai-synthesis-section');
        if (synthSection) {
            synthSection.classList.remove('audio-playing');
            synthSection.classList.add('audio-paused');
        }
    }
}

function stopAudio() {
    stopAllAudio();
}

function updateAudioButton(state) {
    const playBtn = document.getElementById('audioPlayBtn');
    const pauseBtn = document.getElementById('audioPauseBtn');
    
    if (!playBtn || !pauseBtn) return;
    
    if (state === 'playing') {
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
    } else {
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
    }
}

function showAudioControls(show) {
    const controls = document.getElementById('audioControls');
    const briefBtn = document.querySelector('.action-btn[onclick="audioSummary()"]');
    
    if (controls) {
        controls.style.display = show ? 'flex' : 'none';
    }
    if (briefBtn) {
        briefBtn.style.display = show ? 'none' : 'flex';
    }
}

function startVisit() {
    if (selectedPatient) {
        window.location.href = `/?patient=${selectedPatient.id}&mode=visit`;
    }
}
