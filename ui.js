// Populate Epic-style UI with patient profile information
document.addEventListener('DOMContentLoaded', () => {
    if (typeof patientProfile === 'undefined') {
        console.warn('patientProfile not found');
        return;
    }

    const profile = patientProfile;

    // Primary Diagnosis - display prominently
    const primaryDiagnosisInfo = document.getElementById('primaryDiagnosisInfo');
    if (primaryDiagnosisInfo) {
        if (profile.clinical?.diagnoses && profile.clinical.diagnoses.length > 0) {
            const primaryDiagnosis = profile.clinical.diagnoses[0];
            primaryDiagnosisInfo.innerHTML = `
                <div class="diagnosis-name">${primaryDiagnosis.condition}</div>
                <div class="diagnosis-details">${primaryDiagnosis.type} • ${primaryDiagnosis.status}</div>
            `;
        } else {
            // Fallback to lung cancer if diagnoses not set
            primaryDiagnosisInfo.innerHTML = `
                <div class="diagnosis-name">Lung Cancer</div>
                <div class="diagnosis-details">Primary Diagnosis • Active</div>
            `;
        }
    }

    populateList('precautionsList', profile.clinical?.precautions);
    populateList('allergiesList', profile.clinical?.allergies?.map(a => `${a.medication}`));

    const attending = profile.clinical?.attending;
    const attendingInfo = document.getElementById('attendingInfo');
    if (attending && attendingInfo) {
        attendingInfo.innerHTML = `
            <div class="provider-name">${attending.name}</div>
            <div>${attending.specialty || 'Attending Physician'}</div>
            <div>${profile.clinical?.organism ? `Organism: ${profile.clinical.organism}` : ''}</div>
        `;
    }

    const pharmacyInfo = document.getElementById('pharmacyInfo');
    if (pharmacyInfo && profile.pharmacy) {
        pharmacyInfo.textContent = profile.pharmacy.active ? 'Active: Yes (Hover for details)' : 'Inactive';
    }

    // Work list table
    const workListTable = document.getElementById('workListTable');
    if (workListTable && profile.workListTasks) {
        workListTable.innerHTML = profile.workListTasks.map(task => `
            <tr>
                <td>${task.time}</td>
                <td>${task.task}</td>
                <td>${task.priority}</td>
            </tr>
        `).join('');
    }

    // Vitals
    const vitalsGrid = document.getElementById('vitalsGrid');
    if (vitalsGrid && profile.vitalSigns) {
        const vitals = [
            { label: 'Heart Rate', value: profile.vitalSigns.heartRate?.range || '—', note: profile.vitalSigns.heartRate?.trend },
            { label: 'Temperature', value: profile.vitalSigns.temperature?.unit || '—', note: profile.vitalSigns.temperature?.trend },
            { label: 'Respiratory Rate', value: profile.vitalSigns.respiratoryRate?.value || '—', note: profile.vitalSigns.respiratoryRate?.trend },
            { label: 'Blood Pressure', value: profile.vitalSigns.bloodPressure?.value || '—', note: profile.vitalSigns.bloodPressure?.trend },
            { label: 'SpO₂', value: profile.vitalSigns.spO2?.value || '—', note: profile.vitalSigns.spO2?.trend }
        ];

        vitalsGrid.innerHTML = vitals.map(vital => `
            <div class="vital-chip">
                <h4>${vital.label}</h4>
                <div class="vital-value">${vital.value}</div>
                <div class="vital-note">${vital.note || ''}</div>
            </div>
        `).join('');
    }

    // Treatment team
    const treatmentTable = document.getElementById('treatmentTeamTable');
    if (treatmentTable && profile.treatmentTeam) {
        treatmentTable.innerHTML = profile.treatmentTeam.map(member => `
            <tr>
                <td>${member.name}</td>
                <td>${member.relationship || '—'}</td>
                <td>${member.specialty || '—'}</td>
                <td>${member.contact || '—'}</td>
            </tr>
        `).join('');
    }

    // Care plan
    const carePlanList = document.getElementById('carePlanList');
    if (carePlanList && profile.carePlan) {
        carePlanList.innerHTML = profile.carePlan.map(item => `
            <div class="careplan-item">
                <h4>${item.problem}</h4>
                <p>${item.goal}</p>
            </div>
        `).join('');
    }
});

function populateList(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el || !items) return;
    el.innerHTML = items.map(item => `<li>${item}</li>`).join('');
}


