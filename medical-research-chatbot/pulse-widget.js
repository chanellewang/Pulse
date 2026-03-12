// =============================================
// PULSE - Pre-Visit Chart Synthesis Widget
// Main Widget Controller
// =============================================

// State management
let pulseState = {
    isExpanded: false,
    settings: {
        labsTimeframe: 3,
        notesToInclude: ['oncology', 'primaryCare', 'emergency'],
        numberOfNotes: 5,
        clinicalSuggestions: true,
        autoExpandSections: ['sectionVisitContext', 'sectionHighlights']
    }
};

// =============================================
// WIDGET TOGGLE
// =============================================

function togglePulseWidget() {
    const widget = document.getElementById('pulseWidget');
    
    if (widget.classList.contains('pulse-collapsed')) {
        // Expand
        widget.classList.remove('pulse-collapsed');
        pulseState.isExpanded = true;
        
        // Apply auto-expand sections
        pulseState.settings.autoExpandSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.classList.add('pulse-section-expanded');
            }
        });
    } else {
        // Collapse
        widget.classList.add('pulse-collapsed');
        pulseState.isExpanded = false;
    }
}

// =============================================
// SECTION TOGGLE
// =============================================

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('pulse-section-expanded');
    }
}

// =============================================
// LABS TIMEFRAME SELECTOR
// =============================================

function toggleLabsTimeframeDropdown(event) {
    event.stopPropagation();
    
    const dropdown = document.getElementById('labsTimeframeDropdown');
    const btn = document.getElementById('labsTimeframeBtn');
    
    if (dropdown.classList.contains('show')) {
        closeLabsTimeframeDropdown();
    } else {
        dropdown.classList.add('show');
        btn.classList.add('active');
        
        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', closeLabsTimeframeOnOutsideClick);
        }, 0);
    }
}

function closeLabsTimeframeDropdown() {
    const dropdown = document.getElementById('labsTimeframeDropdown');
    const btn = document.getElementById('labsTimeframeBtn');
    
    if (dropdown) {
        dropdown.classList.remove('show');
    }
    if (btn) {
        btn.classList.remove('active');
    }
    
    document.removeEventListener('click', closeLabsTimeframeOnOutsideClick);
}

function closeLabsTimeframeOnOutsideClick(event) {
    const selector = document.querySelector('.pulse-timeframe-selector');
    if (selector && !selector.contains(event.target)) {
        closeLabsTimeframeDropdown();
    }
}

function setLabsTimeframe(months) {
    // Update state
    pulseState.settings.labsTimeframe = months;
    
    // Update button text
    const textElement = document.getElementById('labsTimeframeText');
    if (textElement) {
        textElement.textContent = `Last ${months} month${months > 1 ? 's' : ''}`;
    }
    
    // Update active state in dropdown
    document.querySelectorAll('.pulse-timeframe-option').forEach(option => {
        option.classList.remove('pulse-timeframe-active');
    });
    event.target.classList.add('pulse-timeframe-active');
    
    // Close dropdown
    closeLabsTimeframeDropdown();
    
    // Update the customize modal radio buttons to stay in sync
    document.querySelectorAll('input[name="labsTimeframe"]').forEach(radio => {
        radio.checked = parseInt(radio.value) === months;
    });
    
    // Show toast notification
    showToast(`Labs timeframe updated to ${months} month${months > 1 ? 's' : ''}`);
    
    // In a real implementation, this would filter the labs data
    // For demo, we'll just show a visual update
    updateLabsDisplay(months);
}

function updateLabsDisplay(months) {
    // This function would filter labs based on timeframe
    // For demo purposes, we just update the section badge if it exists elsewhere
    console.log(`Labs filtered to last ${months} months`);
    
    // Could add visual feedback like highlighting the section
    const labsSection = document.getElementById('sectionLabs');
    if (labsSection) {
        labsSection.classList.add('pulse-section-updated');
        setTimeout(() => {
            labsSection.classList.remove('pulse-section-updated');
        }, 500);
    }
}

// =============================================
// CUSTOMIZE MODAL
// =============================================

function openCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    modal.style.display = 'flex';
    
    // Set current values
    document.querySelectorAll('input[name="labsTimeframe"]').forEach(radio => {
        radio.checked = parseInt(radio.value) === pulseState.settings.labsTimeframe;
    });
}

function closeCustomizeModal() {
    const modal = document.getElementById('customizeModal');
    modal.style.display = 'none';
}

function saveCustomizeSettings() {
    // Get labs timeframe
    const labsTimeframe = document.querySelector('input[name="labsTimeframe"]:checked');
    if (labsTimeframe) {
        pulseState.settings.labsTimeframe = parseInt(labsTimeframe.value);
    }
    
    // Close modal and show toast
    closeCustomizeModal();
    showToast('Preferences saved successfully');
}

// =============================================
// DRAFT NOTE MODAL
// =============================================

function openDraftNoteModal() {
    const modal = document.getElementById('draftNoteModal');
    modal.style.display = 'flex';
    
    // Generate and display draft content
    populateDraftNote();
}

function closeDraftNoteModal() {
    const modal = document.getElementById('draftNoteModal');
    modal.style.display = 'none';
}

function populateDraftNote() {
    // Chief Complaint
    const ccElement = document.getElementById('draftCC');
    if (ccElement && typeof patientProfile !== 'undefined') {
        ccElement.textContent = patientProfile.visitContext.reasonForVisit;
    }
    
    // HPI
    const hpiElement = document.getElementById('draftHPI');
    if (hpiElement && typeof generateHPIDraft === 'function') {
        hpiElement.textContent = generateHPIDraft();
    }
    
    // Assessment and Plan
    const planElement = document.getElementById('draftPlan');
    if (planElement && typeof generateAssessmentPlanDraft === 'function') {
        planElement.textContent = generateAssessmentPlanDraft();
    }
}

function editNoteSection(section) {
    // In a real implementation, this would open an inline editor
    // For demo, just show a toast
    showToast('Edit mode activated for ' + section.toUpperCase());
}

function copyDraftNote() {
    // Compile the full note
    const cc = document.getElementById('draftCC')?.textContent || '';
    const hpi = document.getElementById('draftHPI')?.textContent || '';
    const plan = document.getElementById('draftPlan')?.textContent || '';
    
    const fullNote = `CHIEF COMPLAINT:\n${cc}\n\nHISTORY OF PRESENT ILLNESS:\n${hpi}\n\n${plan}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullNote).then(() => {
        showToast('Note copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy note');
    });
}

// =============================================
// CONTEXT POPOVER
// =============================================

// =============================================
// SPECIALIST SUGGESTIONS
// =============================================

function acknowledgeSuggestion(button) {
    const card = button.closest('.pulse-suggestion-card');
    
    // Toggle acknowledged state
    if (button.classList.contains('acknowledged')) {
        button.classList.remove('acknowledged');
        showToast('Suggestion unacknowledged');
    } else {
        button.classList.add('acknowledged');
        showToast('Suggestion acknowledged');
    }
}

function dismissSuggestion(button) {
    const card = button.closest('.pulse-suggestion-card');
    
    // Toggle dismissed state
    if (card.classList.contains('dismissed')) {
        card.classList.remove('dismissed');
        showToast('Suggestion restored');
    } else {
        card.classList.add('dismissed');
        showToast('Suggestion dismissed');
    }
}

// =============================================
// CONTEXT POPOVER
// =============================================

const clinicalContextData = {
    nsclc: {
        title: 'NSCLC Stage IIIB Guidelines',
        content: `<p><strong>Non-Small Cell Lung Cancer (NSCLC) Stage IIIB</strong> indicates locally advanced disease with involvement of mediastinal lymph nodes or contralateral nodes.</p>
        <p><strong>Treatment Approach:</strong></p>
        <ul>
            <li>Concurrent chemoradiation is standard for unresectable disease</li>
            <li>Consider durvalumab consolidation after chemoradiation</li>
            <li>Platinum-based doublet chemotherapy (e.g., FOLFOX-like regimens)</li>
            <li>Molecular testing (EGFR, ALK, ROS1, PD-L1) guides targeted therapy options</li>
        </ul>
        <p><strong>Prognosis:</strong> 5-year survival approximately 10-15% with treatment.</p>`
    },
    folfox: {
        title: 'FOLFOX Regimen Overview',
        content: `<p><strong>FOLFOX</strong> is a chemotherapy regimen combining Oxaliplatin, Leucovorin (folinic acid), and 5-Fluorouracil (5-FU).</p>
        <p><strong>Standard Dosing:</strong></p>
        <ul>
            <li>Oxaliplatin: 85 mg/m² IV over 2 hours</li>
            <li>Leucovorin: 400 mg/m² IV over 2 hours</li>
            <li>5-FU: 400 mg/m² bolus, then 2400 mg/m² over 46 hours</li>
        </ul>
        <p><strong>Common Side Effects:</strong></p>
        <ul>
            <li>Nausea/vomiting (prophylaxis with ondansetron)</li>
            <li>Peripheral neuropathy (cold sensitivity)</li>
            <li>Myelosuppression (monitor CBC)</li>
            <li>Fatigue</li>
        </ul>
        <p><strong>Monitoring:</strong> CBC, CMP before each cycle. Hold if ANC &lt;1500 or platelets &lt;75,000.</p>`
    },
    cea: {
        title: 'CEA Tumor Marker Interpretation',
        content: `<p><strong>Carcinoembryonic Antigen (CEA)</strong> is a glycoprotein tumor marker used in monitoring cancer treatment response.</p>
        <p><strong>Normal Range:</strong> 0-3 ng/mL (non-smokers), 0-5 ng/mL (smokers)</p>
        <p><strong>Clinical Utility:</strong></p>
        <ul>
            <li>Not used for screening (low specificity)</li>
            <li>Useful for monitoring treatment response</li>
            <li>Declining CEA suggests positive treatment response</li>
            <li>Rising CEA may indicate disease progression</li>
        </ul>
        <p><strong>This Patient:</strong> CEA decreased from 8.4 to 5.2 ng/mL, suggesting positive response to chemotherapy despite still being above normal range.</p>
        <p><strong>Recommendation:</strong> Continue monitoring with each cycle; correlate with imaging findings.</p>`
    }
};

function showContextPopover(event, contextKey) {
    event.preventDefault();
    
    const popover = document.getElementById('contextPopover');
    const titleElement = document.getElementById('popoverTitle');
    const bodyElement = document.getElementById('popoverBody');
    
    const contextData = clinicalContextData[contextKey];
    if (contextData) {
        titleElement.textContent = contextData.title;
        bodyElement.innerHTML = contextData.content;
    }
    
    // Position popover near the click
    const rect = event.target.closest('.pulse-context-link').getBoundingClientRect();
    popover.style.top = Math.min(rect.top, window.innerHeight - 400) + 'px';
    popover.style.left = Math.max(10, rect.left - 340) + 'px';
    popover.style.display = 'block';
    
    // Reset rating stars
    document.querySelectorAll('.pulse-rating-stars button').forEach(btn => {
        btn.classList.remove('active');
    });
}

function hideContextPopover() {
    const popover = document.getElementById('contextPopover');
    popover.style.display = 'none';
}

function rateContext(rating) {
    // Highlight stars up to the rating
    const stars = document.querySelectorAll('.pulse-rating-stars button');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
    
    // Show feedback toast
    showToast(`Thank you for your feedback! (${rating}/5 stars)`);
    
    // In a real implementation, this would send the rating to a server
    setTimeout(() => {
        hideContextPopover();
    }, 1000);
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================

function showToast(message) {
    const toast = document.getElementById('pulseToast');
    const messageElement = document.getElementById('toastMessage');
    
    messageElement.textContent = message;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// =============================================
// DRAG FUNCTIONALITY
// =============================================

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

function initDraggable() {
    const widget = document.getElementById('pulseWidget');
    const header = document.getElementById('pulseHeader');
    const collapsedHeader = document.getElementById('pulseCollapsedHeader');
    
    if (header) {
        header.addEventListener('mousedown', dragStart);
    }
    
    if (collapsedHeader) {
        collapsedHeader.addEventListener('mousedown', dragStart);
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}

function dragStart(e) {
    // Don't drag if clicking on buttons
    if (e.target.closest('button')) {
        return;
    }
    
    const widget = document.getElementById('pulseWidget');
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    isDragging = true;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        const widget = document.getElementById('pulseWidget');
        widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

// =============================================
// POPULATE DATA FROM PATIENT PROFILE
// =============================================

function populatePulseWidget() {
    if (typeof patientProfile === 'undefined') {
        console.warn('Patient profile not loaded');
        return;
    }
    
    const p = patientProfile;
    
    // Patient Header
    updateElementText('pulsePatientName', p.demographics.name);
    
    // Visit Context
    updateElementText('pulseVisitReason', p.visitContext.reasonForVisit);
    updateElementText('pulseReferringProvider', `${p.visitContext.referringProvider.name} (${p.visitContext.referringProvider.specialty})`);
    updateElementText('pulseLastVisitDate', p.visitContext.lastVisit.date);
    updateElementText('pulseLastVisitSummary', p.visitContext.lastVisit.summary);
    
    // Labs Highlights - already in HTML, but could be dynamically populated
    
    // Care Gaps - already in HTML, but could be dynamically populated
}

function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element && text) {
        element.textContent = text;
    }
}

// =============================================
// KEYBOARD SHORTCUTS
// =============================================

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            closeCustomizeModal();
            closeDraftNoteModal();
            hideContextPopover();
        }
        
        // Ctrl+P to toggle Pulse widget
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            togglePulseWidget();
        }
    });
}

// =============================================
// CLICK OUTSIDE HANDLERS
// =============================================

function initClickOutsideHandlers() {
    document.addEventListener('click', (e) => {
        // Close context popover when clicking outside
        const popover = document.getElementById('contextPopover');
        if (popover && popover.style.display === 'block') {
            if (!popover.contains(e.target) && !e.target.closest('.pulse-context-link')) {
                hideContextPopover();
            }
        }
    });
}

// =============================================
// SOURCE DATA LINKS
// =============================================

// Add hover tooltips for source data links
function initSourceDataLinks() {
    document.querySelectorAll('.pulse-source-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const linkTitle = link.getAttribute('title') || 'View in Epic';
            showToast(`Opening: ${linkTitle}`);
        });
    });
}

// =============================================
// EPIC TAB NAVIGATION
// =============================================

// Current active tab tracking
let currentMainTab = 'summary';
let currentSubTab = 'overview';

// Switch main navigation tabs (Summary, Chart Review, Results, etc.)
function switchMainTab(tabId, buttonElement) {
    // Update active state on buttons
    document.querySelectorAll('.epic-tabs-container .epic-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    // Hide all tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show selected tab panel
    const targetPanel = document.getElementById(`tabPanel-${tabId}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    currentMainTab = tabId;
    
    // Show toast notification
    const tabNames = {
        'summary': 'Summary',
        'chartReview': 'Chart Review',
        'results': 'Results',
        'workList': 'Work List',
        'mar': 'MAR',
        'flowsheets': 'Flowsheets',
        'intakeOutput': 'Intake/Output',
        'notes': 'Notes',
        'education': 'Education',
        'carePlan': 'Care Plan',
        'orders': 'Orders',
        'charges': 'Charges',
        'navigators': 'Navigators',
        'dcInfo': 'Discharge Info'
    };
    
    showToast(`Switched to ${tabNames[tabId] || tabId}`);
}

// Switch sub-tabs within a main tab
function switchSubTab(subTabId, buttonElement) {
    // Update active state on buttons
    const parentContainer = buttonElement.closest('.epic-sub-tabs');
    if (parentContainer) {
        parentContainer.querySelectorAll('.sub-tab').forEach(tab => {
            tab.classList.remove('active');
        });
    }
    if (buttonElement) {
        buttonElement.classList.add('active');
    }
    
    currentSubTab = subTabId;
    
    const subTabNames = {
        'overview': 'Overview',
        'index': 'Index',
        'sbarHandoff': 'SBAR Handoff',
        'compFlowsheet': 'Comp Flowsheet',
        'cosign': 'Cosign',
        'activeOrders': 'Active Orders',
        'fimAssessment': 'FIM Assessment'
    };
    
    showToast(`Switched to ${subTabNames[subTabId] || subTabId}`);
}

// Top navigation bar content modals
function showTopNavContent(section) {
    const modal = document.getElementById('topNavModal');
    const modalTitle = document.getElementById('topNavModalTitle');
    const modalBody = document.getElementById('topNavModalBody');
    
    if (!modal) {
        createTopNavModal();
        showTopNavContent(section);
        return;
    }
    
    const sectionContent = {
        'patientLookup': {
            title: 'Patient Lookup',
            icon: '🔍',
            content: 'Search for patients by name, MRN, or date of birth.'
        },
        'orCases': {
            title: 'OR Cases',
            icon: '🏥',
            content: 'View operating room schedule and surgical cases.'
        },
        'houseCensus': {
            title: 'House Census',
            icon: '📋',
            content: 'View current hospital census and bed availability.'
        },
        'transferCenter': {
            title: 'Transfer Center',
            icon: '🚑',
            content: 'Manage patient transfers between units and facilities.'
        },
        'staffedBeds': {
            title: 'Staffed Beds',
            icon: '🛏️',
            content: 'View bed status and staffing levels across units.'
        },
        'anywhereRN': {
            title: 'Anywhere RN',
            icon: '👩‍⚕️',
            content: 'Connect with nursing staff for remote consultations.'
        },
        'slicerDicer': {
            title: 'SlicerDicer',
            icon: '📊',
            content: 'Create custom reports and data analytics.'
        },
        'reports': {
            title: 'Reports',
            icon: '📈',
            content: 'Access standard and custom report templates.'
        }
    };
    
    const content = sectionContent[section] || { title: 'Unknown', icon: '❓', content: 'Section not found.' };
    
    modalTitle.textContent = content.title;
    modalBody.innerHTML = `
        <div class="modal-placeholder">
            <div class="modal-placeholder-icon">${content.icon}</div>
            <p>${content.content}</p>
            <p style="margin-top: 15px; font-size: 11px; color: #888;">This is a demo placeholder. In a real Epic system, this would open the ${content.title} module.</p>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeTopNavModal() {
    const modal = document.getElementById('topNavModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function createTopNavModal() {
    const modal = document.createElement('div');
    modal.id = 'topNavModal';
    modal.className = 'top-nav-modal';
    modal.innerHTML = `
        <div class="top-nav-modal-content">
            <div class="top-nav-modal-header">
                <h2 id="topNavModalTitle">Title</h2>
                <button class="top-nav-modal-close" onclick="closeTopNavModal()">&times;</button>
            </div>
            <div class="top-nav-modal-body" id="topNavModalBody">
                Content
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTopNavModal();
        }
    });
}

// Print functionality
function printPage() {
    window.print();
    showToast('Print dialog opened');
}

// Logout confirmation
function confirmLogout() {
    if (confirm('Are you sure you want to log out?')) {
        showToast('Logging out...');
        setTimeout(() => {
            alert('This is a demo. In a real system, you would be logged out.');
        }, 500);
    }
}

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initDraggable();
    initKeyboardShortcuts();
    initClickOutsideHandlers();
    initSourceDataLinks();
    
    // Populate data from patient profile
    populatePulseWidget();
    
    // Set initial state - widget starts collapsed
    const widget = document.getElementById('pulseWidget');
    if (widget) {
        widget.classList.add('pulse-collapsed');
    }
    
    // Create the top nav modal for navigation items
    createTopNavModal();
    
    // Make card links functional
    initCardLinks();
    
    console.log('Pulse widget initialized');
    console.log('Epic tabs are now fully functional!');
});

// Initialize card links to navigate between tabs
function initCardLinks() {
    // Make the Quick View card links navigate to corresponding tabs
    document.querySelectorAll('.epic-card .card-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const linkText = this.textContent.trim();
            
            // Map link text to tab actions
            const linkMappings = {
                'Comprehensive SBAR Flowsheet': () => switchSubTab('sbarHandoff', document.querySelector('[data-subtab="sbarHandoff"]')),
                'Active Orders': () => switchMainTab('orders', document.querySelector('[data-tab="orders"]')),
                'Medication Administration': () => switchMainTab('mar', document.querySelector('[data-tab="mar"]')),
                'Current Meds': () => switchMainTab('mar', document.querySelector('[data-tab="mar"]')),
                'Medication History': () => switchMainTab('mar', document.querySelector('[data-tab="mar"]')),
                'Labs - Last 72 Hours': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'Labs - Entire Admission': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'Labs - Unresulted': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'Microbiology Results': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'Radiology Results': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'PPD Results': () => switchMainTab('results', document.querySelector('[data-tab="results"]')),
                'Therapy Flowsheet': () => switchMainTab('flowsheets', document.querySelector('[data-tab="flowsheets"]')),
                'Care Plan and Patient Education': () => switchMainTab('carePlan', document.querySelector('[data-tab="carePlan"]')),
                'Oncology Summary': () => switchMainTab('orders', document.querySelector('[data-tab="orders"]')),
            };
            
            if (linkMappings[linkText]) {
                linkMappings[linkText]();
            } else {
                showToast(`Opening: ${linkText}`);
            }
        });
    });
}

// =============================================
// EXPORT FOR TESTING
// =============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        togglePulseWidget,
        toggleSection,
        openCustomizeModal,
        closeCustomizeModal,
        openDraftNoteModal,
        closeDraftNoteModal,
        showContextPopover,
        hideContextPopover,
        showToast,
        switchMainTab,
        switchSubTab,
        showTopNavContent,
        closeTopNavModal,
        printPage,
        confirmLogout
    };
}

