// Pulse - Enhanced Patient Profile Data
// Based on Cindy Peterson with comprehensive pre-visit context

const patientProfile = {
    // Basic Demographics
    demographics: {
        name: "PETERSON, CINDY",
        firstName: "Cindy",
        lastName: "Peterson",
        age: 26,
        dob: "12/22/1985",
        gender: "Female",
        mrn: "28491",
        ssn: "xxx-xx-7256",
        address: "7816 First Ave, Apt 216, Madison WI 53711",
        homePhone: "608-555-2344",
        workPhone: "608-555-4012",
        mobilePhone: "608-555-2896",
        email: "cindy.peterson@email.com",
        emergencyContact: {
            name: "John Peterson",
            relationship: "Spouse",
            phone: "608-555-2345"
        },
        insurance: {
            primary: "BlueCross BlueShield",
            policyNumber: "BCB-2849100",
            groupNumber: "GRP-45821"
        },
        myChartStatus: "Active"
    },
    
    // Primary Diagnosis - PROMINENTLY DISPLAYED
    primaryDiagnosis: {
        condition: "Lung Cancer",
        icdCode: "C34.90",
        type: "Non-Small Cell Lung Cancer (NSCLC)",
        stage: "Stage IIIB",
        diagnosedDate: "01/10/2012",
        status: "Active",
        prognosis: "Responding to treatment",
        notes: "Primary cancer driving current treatment plan. Patient enrolled in chemotherapy regimen."
    },
    
    // Visit Context - For Pre-Visit Summary
    visitContext: {
        reasonForVisit: "Chemotherapy cycle 4 assessment + labs",
        visitType: "Follow-up Oncology Visit",
        scheduledDate: "01/22/2012",
        scheduledTime: "10:30 AM",
        referringProvider: {
            name: "Dr. Anna Gold",
            specialty: "Primary Care",
            clinic: "Madison Family Medicine",
            phone: "608-555-1000",
            referralDate: "01/08/2012",
            referralReason: "Abnormal chest X-ray, persistent cough, weight loss"
        },
        lastVisit: {
            date: "01/16/2012",
            provider: "Dr. Timothy Zeller",
            summary: "6-week follow-up. Patient tolerating FOLFOX well. Nausea improved with ondansetron. CEA decreased from 8.4→5.2 ng/mL. Continue current regimen. Chest CT showed stable disease.",
            planItems: [
                "Continue FOLFOX regimen cycle 4",
                "Monitor CEA levels",
                "Repeat chest CT in 6 weeks",
                "Continue supportive care medications"
            ]
        },
        outsideEvents: [
            {
                date: "01/01/2012",
                type: "Emergency Department Visit",
                facility: "St. Mary's Hospital ED",
                reason: "Severe nausea and dehydration post-chemotherapy",
                outcome: "IV fluids, ondansetron adjustment, discharged same day",
                followUp: "Increased antiemetic dosing, resolved"
            }
        ],
        visitFocusPrompts: [
            "Review response to cycle 3 chemotherapy",
            "Assess for chemotherapy side effects",
            "Check today's lab results (CBC, CMP, CEA)",
            "Discuss advance directive planning",
            "Flu vaccine due this visit"
        ]
    },
    
    // Clinical Information
    clinical: {
        attending: {
            name: "Zeller, Timothy Aaron, MD",
            specialty: "Medical Oncology",
            phone: "864-482-3483"
        },
        diagnoses: [
            {
                condition: "Lung Cancer",
                type: "Primary Diagnosis",
                status: "Active",
                icdCode: "C34.90",
                stage: "Stage IIIB",
                diagnosedDate: "01/10/2012"
            },
            {
                condition: "Chemotherapy-induced nausea",
                type: "Secondary",
                status: "Controlled",
                icdCode: "R11.2"
            },
            {
                condition: "Anemia of chronic disease",
                type: "Secondary",
                status: "Monitoring",
                icdCode: "D63.8"
            }
        ],
        precautions: ["Fall precautions"],
        allergies: [
            {
                medication: "Codeine",
                reaction: "Severe - Respiratory depression",
                severity: "High",
                verified: true
            },
            {
                medication: "Penicillins",
                reaction: "Moderate - Rash, hives",
                severity: "Moderate",
                verified: true
            }
        ],
        organism: "None"
    },
    
    // Current Medications with changes tracking
    medications: [
        {
            name: "FOLFOX (Oxaliplatin, Leucovorin, 5-FU)",
            type: "Chemotherapy Regimen",
            dose: "Per protocol",
            frequency: "Every 2 weeks",
            route: "IV",
            startDate: "01/15/2012",
            status: "Active",
            isNew: false,
            prescriber: "Dr. Zeller"
        },
        {
            name: "Ondansetron 8mg",
            type: "Antiemetic",
            dose: "8mg",
            frequency: "Every 8 hours PRN",
            route: "Oral",
            startDate: "01/15/2012",
            status: "Active",
            isNew: false,
            recentChange: "Dose increased from 4mg on 01/02/2012",
            prescriber: "Dr. Zeller"
        },
        {
            name: "Lorazepam 0.5mg",
            type: "Anxiolytic",
            dose: "0.5mg",
            frequency: "PRN for anxiety",
            route: "Oral",
            startDate: "01/10/2012",
            status: "Active",
            isNew: false,
            prescriber: "Dr. Zeller"
        },
        {
            name: "Dexamethasone 4mg",
            type: "Corticosteroid",
            dose: "4mg",
            frequency: "With chemotherapy",
            route: "Oral",
            startDate: "01/15/2012",
            status: "Active",
            isNew: false,
            prescriber: "Dr. Zeller"
        },
        {
            name: "Multivitamin",
            type: "Supplement",
            dose: "1 tablet",
            frequency: "Daily",
            route: "Oral",
            startDate: "01/10/2012",
            status: "Active",
            isNew: false,
            prescriber: "Dr. Gold"
        }
    ],
    
    // Medication changes summary
    medicationChanges: [
        {
            type: "Dose Increase",
            medication: "Ondansetron",
            change: "4mg → 8mg every 8 hours",
            date: "01/02/2012",
            reason: "Breakthrough nausea after cycle 2"
        }
    ],
    
    // Recent Labs with trends
    recentLabs: [
        {
            name: "CEA (Carcinoembryonic Antigen)",
            value: "5.2",
            unit: "ng/mL",
            date: "01/16/2012",
            normalRange: "0-3",
            trend: "down",
            previousValue: "8.4",
            previousDate: "01/02/2012",
            interpretation: "Improving - responding to treatment",
            flagged: true,
            flagType: "high"
        },
        {
            name: "WBC (White Blood Cells)",
            value: "6.2",
            unit: "K/μL",
            date: "01/16/2012",
            normalRange: "4-11",
            trend: "stable",
            previousValue: "6.5",
            interpretation: "Within normal limits",
            flagged: false
        },
        {
            name: "Hemoglobin",
            value: "12.8",
            unit: "g/dL",
            date: "01/16/2012",
            normalRange: "12-16",
            trend: "down",
            previousValue: "13.5",
            interpretation: "Low normal, monitor for anemia",
            flagged: false
        },
        {
            name: "Platelets",
            value: "245",
            unit: "K/μL",
            date: "01/16/2012",
            normalRange: "150-400",
            trend: "stable",
            previousValue: "252",
            interpretation: "Within normal limits",
            flagged: false
        },
        {
            name: "Creatinine",
            value: "0.9",
            unit: "mg/dL",
            date: "01/16/2012",
            normalRange: "0.6-1.2",
            trend: "stable",
            previousValue: "0.9",
            interpretation: "Normal renal function",
            flagged: false
        },
        {
            name: "eGFR",
            value: "85",
            unit: "mL/min",
            date: "01/16/2012",
            normalRange: ">60",
            trend: "stable",
            interpretation: "Adequate for chemotherapy",
            flagged: false
        },
        {
            name: "ALT",
            value: "28",
            unit: "U/L",
            date: "01/16/2012",
            normalRange: "7-56",
            trend: "stable",
            interpretation: "Normal liver function",
            flagged: false
        },
        {
            name: "AST",
            value: "24",
            unit: "U/L",
            date: "01/16/2012",
            normalRange: "10-40",
            trend: "stable",
            interpretation: "Normal liver function",
            flagged: false
        }
    ],
    
    // Recent Imaging
    recentImaging: [
        {
            type: "Chest CT with Contrast",
            date: "01/10/2012",
            facility: "Epic Medical Center Radiology",
            findings: "Stable 3.2cm right upper lobe mass. No new lesions. Mediastinal lymphadenopathy unchanged. No pleural effusion.",
            impression: "Stable disease. No evidence of progression.",
            radiologist: "Dr. Sarah Chen",
            link: "Chart Review > Results > Imaging"
        },
        {
            type: "PET-CT",
            date: "12/20/2011",
            facility: "Epic Medical Center Nuclear Medicine",
            findings: "FDG-avid right upper lobe mass (SUV 8.2). FDG-avid mediastinal lymph nodes. No distant metastases.",
            impression: "Stage IIIB NSCLC. No evidence of distant spread.",
            radiologist: "Dr. Michael Park",
            link: "Chart Review > Results > Imaging"
        }
    ],
    
    // Care Gaps
    careGaps: [
        {
            priority: "high",
            gap: "Advance Directive Discussion",
            dueDate: "Overdue",
            lastAddressed: "Never documented",
            action: "Discuss goals of care and advance directive preferences"
        },
        {
            priority: "medium",
            gap: "Flu Vaccine",
            dueDate: "Due this visit",
            lastAddressed: "Not given this season",
            action: "Administer influenza vaccine if not contraindicated"
        },
        {
            priority: "low",
            gap: "Smoking Cessation Counseling",
            dueDate: "Scheduled",
            lastAddressed: "01/10/2012",
            action: "Continue supportive counseling - patient quit 01/2012"
        }
    ],
    
    // Specialist Suggestions
    specialistSuggestions: [
        {
            id: "sug-001",
            provider: "Zeller, Timothy Aaron, MD",
            initials: "TZ",
            specialty: "Medical Oncology",
            type: "oncology",
            date: "01/16/2012",
            suggestion: "Consider adding immunotherapy evaluation if disease progresses after cycle 6. Patient may be candidate for pembrolizumab based on PD-L1 status. Recommend checking PD-L1 expression if not already done.",
            tags: ["Treatment Planning", "Immunotherapy"],
            status: "pending",
            priority: "medium"
        },
        {
            id: "sug-002",
            provider: "Gold, Anna, MD",
            initials: "AG",
            specialty: "Primary Care",
            type: "pcp",
            date: "01/14/2012",
            suggestion: "Please ensure advance directive discussion happens this visit. Patient expressed interest during last PCP visit but deferred to oncology team. Family is supportive and present today.",
            tags: ["Care Planning", "Goals of Care"],
            status: "pending",
            priority: "high"
        },
        {
            id: "sug-003",
            provider: "Clinical Pharmacy",
            initials: null,
            specialty: "Oncology Pharmacy",
            type: "pharmacy",
            date: "01/15/2012",
            suggestion: "Renal function adequate for full-dose oxaliplatin. Consider magnesium supplementation if peripheral neuropathy worsens. Current antiemetic regimen appropriate - ondansetron dose increase working well.",
            tags: ["Medication Review", "Dosing"],
            status: "pending",
            priority: "low"
        },
        {
            id: "sug-004",
            provider: "Bagwell, Jessica, RN",
            initials: "JB",
            specialty: "Oncology Nursing",
            type: "nursing",
            date: "01/16/2012",
            suggestion: "Patient reports improved sleep since starting lorazepam PRN. Fatigue remains 5/10 but manageable. Recommend discussing fatigue management strategies and possible occupational therapy referral if impacts daily activities.",
            tags: ["Symptom Management", "Quality of Life"],
            status: "pending",
            priority: "medium"
        }
    ],
    
    // Vital Signs (most recent)
    vitalSigns: {
        date: "01/16/2012",
        bloodPressure: {
            systolic: 128,
            diastolic: 82,
            unit: "mmHg",
            trend: "stable"
        },
        heartRate: {
            value: 72,
            unit: "bpm",
            trend: "stable"
        },
        temperature: {
            value: 98.6,
            unit: "°F",
            trend: "stable"
        },
        respiratoryRate: {
            value: 16,
            unit: "/min",
            trend: "stable"
        },
        oxygenSaturation: {
            value: 98,
            unit: "%",
            trend: "stable"
        },
        weight: {
            value: 145,
            unit: "lbs",
            trend: "stable",
            previousValue: 148,
            change: "-3 lbs since diagnosis"
        },
        height: {
            value: "5'6\"",
            unit: ""
        },
        bmi: {
            value: 23.4,
            interpretation: "Normal"
        },
        painScore: {
            value: 2,
            scale: "0-10",
            location: "Right chest, intermittent"
        }
    },
    
    // Treatment Team
    treatmentTeam: [
        {
            name: "Zeller, Timothy Aaron, MD",
            role: "Attending Physician",
            specialty: "Medical Oncology",
            contact: "864-482-3483",
            primary: true
        },
        {
            name: "Deas, Weldon Elizabeth, MD",
            role: "Resident",
            specialty: "Family Medicine",
            contact: "864-482-3483"
        },
        {
            name: "Bagwell, Jessica, RN",
            role: "Primary Nurse",
            specialty: "Oncology",
            contact: "Ext. 4521"
        },
        {
            name: "Gold, Anna, MD",
            role: "Primary Care Physician",
            specialty: "Family Medicine",
            contact: "608-555-1000"
        },
        {
            name: "Wood, Janet Denise, RN",
            role: "Case Manager",
            specialty: "Healthcare Management",
            contact: "Ext. 4822"
        }
    ],
    
    // Care Plan Problems/Goals
    carePlan: [
        {
            problem: "Lung Cancer",
            goal: "Complete chemotherapy regimen with optimal response",
            status: "In Progress",
            target: "Complete 6 cycles of FOLFOX"
        },
        {
            problem: "Chemotherapy Side Effects",
            goal: "Manage nausea and fatigue to maintain quality of life",
            status: "Controlled",
            target: "Pain score ≤3, able to maintain nutrition"
        },
        {
            problem: "Advance Care Planning",
            goal: "Complete advance directive documentation",
            status: "Pending",
            target: "Document wishes before cycle 5"
        }
    ],
    
    // Clinical Context Links
    clinicalContextLinks: [
        {
            title: "NSCLC Stage IIIB Treatment Guidelines (NCCN 2012)",
            category: "Guidelines",
            description: "Current treatment recommendations for Stage IIIB non-small cell lung cancer",
            url: "#guidelines-nsclc"
        },
        {
            title: "FOLFOX Regimen Overview",
            category: "Treatment",
            description: "Dosing, administration, and monitoring for FOLFOX chemotherapy",
            url: "#folfox-overview"
        },
        {
            title: "CEA Tumor Marker Interpretation",
            category: "Labs",
            description: "Understanding CEA trends in lung cancer monitoring",
            url: "#cea-interpretation"
        }
    ],
    
    // Work List Tasks
    workListTasks: [
        {
            time: "1555",
            task: "Re-check PRN Med (type, reason, follow-up/score required)",
            priority: "Timed",
            date: "01/22/2012"
        },
        {
            time: "PRN",
            task: "Review chemotherapy labs before infusion",
            priority: "Routine",
            date: "01/22/2012"
        }
    ],
    
    // Clinical Notes Summary
    clinicalNotes: [
        {
            type: "Progress Note",
            date: "01/16/2012",
            author: "Dr. Timothy Zeller",
            preview: "Cycle 3 follow-up: Patient tolerating FOLFOX with improved nausea control. CEA trending down. Will proceed with cycle 4.",
            link: "Notes > Progress Notes"
        },
        {
            type: "Nursing Note",
            date: "01/16/2012",
            author: "Jessica Bagwell, RN",
            preview: "Patient reports fatigue 5/10, nausea well controlled with ondansetron. Tolerating oral intake. Fall precautions in place.",
            link: "Notes > Nursing"
        }
    ],
    
    // Pharmacy
    pharmacy: {
        active: true,
        preferredPharmacy: "CVS Pharmacy - Madison",
        address: "1234 University Ave, Madison WI 53706",
        phone: "608-555-7890",
        fax: "608-555-7891"
    }
};

// Function to generate HPI draft
function generateHPIDraft() {
    const p = patientProfile;
    const dx = p.primaryDiagnosis;
    const visit = p.visitContext;
    const lastVisit = visit.lastVisit;
    
    const hpiDraft = `Ms. ${p.demographics.firstName} ${p.demographics.lastName} is a ${p.demographics.age}-year-old female with ${dx.stage} ${dx.type} (diagnosed ${dx.diagnosedDate}) who presents for ${visit.reasonForVisit}.

She is currently on ${p.medications[0].name} (initiated ${p.medications[0].startDate}) and tolerating treatment well with manageable nausea controlled by ${p.medications[1].name}. Her CEA has improved from ${p.recentLabs[0].previousValue} to ${p.recentLabs[0].value} ${p.recentLabs[0].unit}. Most recent chest CT (${p.recentImaging[0].date}) showed stable disease with no new lesions.

Since last visit on ${lastVisit.date}, she had one ED visit on ${visit.outsideEvents[0].date} for ${visit.outsideEvents[0].reason.toLowerCase()}, which resolved with ${visit.outsideEvents[0].outcome.toLowerCase()}.

Review of systems notable for intermittent right chest discomfort (pain ${p.vitalSigns.painScore.value}/10), mild fatigue, and appetite fair. Denies fever, significant weight loss since last visit, new cough, or dyspnea.`;

    return hpiDraft;
}

// Function to generate Assessment/Plan draft
function generateAssessmentPlanDraft() {
    const p = patientProfile;
    const dx = p.primaryDiagnosis;
    
    const assessmentPlan = `ASSESSMENT AND PLAN:

1. ${dx.stage} ${dx.type} - ${dx.status}
   - Tolerating FOLFOX chemotherapy well
   - CEA improving (${p.recentLabs[0].previousValue} → ${p.recentLabs[0].value})
   - Imaging shows stable disease
   - Plan: Proceed with cycle 4 chemotherapy today
   - Continue current regimen, repeat CEA in 2 weeks

2. Chemotherapy-induced nausea - Controlled
   - Improved with ondansetron dose adjustment
   - Continue ondansetron 8mg q8h PRN
   - Consider adding prochlorperazine if breakthrough

3. Anemia of chronic disease - Monitoring
   - Hemoglobin ${p.recentLabs[2].value} (stable, low-normal)
   - Monitor with next cycle labs
   - Consider iron studies if continues to trend down

4. Health Maintenance
   - Advance directive: Discuss today, provide forms
   - Flu vaccine: Administer today if agreeable
   - Continue smoking cessation support

5. Follow-up
   - Return in 2 weeks for cycle 5
   - Labs 1 day prior to next visit
   - Call if fever >100.4°F, severe nausea, or bleeding`;

    return assessmentPlan;
}

// Function to get patient profile summary for display
function getPatientProfileSummary() {
    return {
        name: patientProfile.demographics.name,
        dob: patientProfile.demographics.dob,
        mrn: patientProfile.demographics.mrn,
        primaryDiagnosis: `${patientProfile.primaryDiagnosis.condition} - ${patientProfile.primaryDiagnosis.stage}`,
        diagnoses: patientProfile.clinical.diagnoses.map(d => `${d.condition} (${d.type}, ${d.status})`).join(" | "),
        precautions: patientProfile.clinical.precautions,
        allergies: patientProfile.clinical.allergies.map(a => `${a.medication} (${a.severity})`).join(", "),
        currentMedications: patientProfile.medications.map(m => `${m.name} (${m.type})`).join(", "),
        reasonForVisit: patientProfile.visitContext.reasonForVisit,
        lastVisitSummary: patientProfile.visitContext.lastVisit.summary,
        careGaps: patientProfile.careGaps.map(g => `${g.gap} (${g.priority})`).join(", "),
        labHighlights: patientProfile.recentLabs.filter(l => l.flagged || l.trend !== 'stable').map(l => `${l.name}: ${l.value} ${l.unit} (${l.trend})`).join(", ")
    };
}

// Function to get labs filtered by timeframe
function getLabsByTimeframe(months = 3) {
    // In a real app, this would filter by date
    // For demo, return all labs
    return patientProfile.recentLabs;
}

// Function to get visit preparation data
function getVisitPrepData() {
    return {
        reasonForVisit: patientProfile.visitContext.reasonForVisit,
        referringProvider: patientProfile.visitContext.referringProvider,
        lastVisit: patientProfile.visitContext.lastVisit,
        outsideEvents: patientProfile.visitContext.outsideEvents,
        focusPrompts: patientProfile.visitContext.visitFocusPrompts,
        careGaps: patientProfile.careGaps
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        patientProfile, 
        getPatientProfileSummary,
        generateHPIDraft,
        generateAssessmentPlanDraft,
        getLabsByTimeframe,
        getVisitPrepData
    };
}
