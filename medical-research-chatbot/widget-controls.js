// Widget Controls - Minimize, Maximize, Drag, Close

// Handle missing Epic screenshot
function handleImageError(img) {
    const parent = img.parentElement;
    parent.innerHTML = `
        <div style="width:100%;height:100%;background:linear-gradient(135deg, #003366 0%, #004080 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;padding:40px;text-align:center;">
            <div style="font-size:24px;margin-bottom:20px;">📋</div>
            <div style="font-size:20px;font-weight:600;margin-bottom:10px;">Epic Screenshot Not Found</div>
            <div style="font-size:14px;line-height:1.6;max-width:500px;">
                Please add your Epic EHR screenshot as <strong>epic-screenshot.png</strong> in this folder.<br><br>
                The chatbot widget will overlay on top of your Epic interface.
            </div>
        </div>
    `;
}

let isMinimized = false;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

// Initialize widget controls when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const widget = document.getElementById('chatbotWidget');
    const widgetHeader = document.getElementById('widgetHeader');
    const widgetContent = document.getElementById('widgetContent');
    const widgetMinimized = document.getElementById('widgetMinimized');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const closeBtn = document.getElementById('closeBtn');
    const toggleTrials = document.getElementById('toggleTrials');

    if (!widget || !widgetHeader) return;

    // Minimize functionality
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            minimizeWidget();
        });
    }

    if (restoreBtn) {
        restoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            restoreWidget();
        });
    }

    // Close functionality
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Close the Clinical Trials Research Assistant?')) {
                widget.style.display = 'none';
            }
        });
    }

    // Drag functionality
    widgetHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Toggle trials section
    if (toggleTrials) {
        toggleTrials.addEventListener('click', () => {
            const trialsList = document.getElementById('trialsList');
            const isHidden = trialsList.classList.contains('hidden');
            
            if (isHidden) {
                trialsList.classList.remove('hidden');
                toggleTrials.textContent = 'Collapse';
            } else {
                trialsList.classList.add('hidden');
                toggleTrials.textContent = 'Expand';
            }
        });
    }

    // Update constraints on window resize
    window.addEventListener('resize', constrainWidget);
});

// Minimize/Restore functions
function minimizeWidget() {
    isMinimized = true;
    const widgetContent = document.getElementById('widgetContent');
    const widgetMinimized = document.getElementById('widgetMinimized');
    const widget = document.getElementById('chatbotWidget');
    if (widgetContent) widgetContent.classList.add('hidden');
    if (widgetMinimized) widgetMinimized.classList.remove('hidden');
    if (widget) {
        widget.style.width = 'auto';
        widget.style.minWidth = '250px';
    }
}

function restoreWidget() {
    isMinimized = false;
    const widgetContent = document.getElementById('widgetContent');
    const widgetMinimized = document.getElementById('widgetMinimized');
    const widget = document.getElementById('chatbotWidget');
    if (widgetContent) widgetContent.classList.remove('hidden');
    if (widgetMinimized) widgetMinimized.classList.add('hidden');
    if (widget) {
        widget.style.width = '450px';
        widget.style.minWidth = '450px';
    }
}

function dragStart(e) {
    const minimizeBtn = document.getElementById('minimizeBtn');
    const closeBtn = document.getElementById('closeBtn');
    const widgetHeader = document.getElementById('widgetHeader');
    const widget = document.getElementById('chatbotWidget');
    
    if (e.target === minimizeBtn || e.target === closeBtn) {
        return;
    }
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (widgetHeader && (e.target === widgetHeader || widgetHeader.contains(e.target))) {
        isDragging = true;
        if (widget) widget.style.cursor = 'grabbing';
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        const widget = document.getElementById('chatbotWidget');
        if (widget) setTranslate(currentX, currentY, widget);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
    const widget = document.getElementById('chatbotWidget');
    if (widget) widget.style.cursor = 'default';
}

function setTranslate(xPos, yPos, el) {
    if (el) el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// Prevent widget from being dragged off screen
function constrainWidget() {
    const widget = document.getElementById('chatbotWidget');
    if (!widget) return;
    
    const rect = widget.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    if (xOffset < 0) xOffset = 0;
    if (xOffset > maxX) xOffset = maxX;
    if (yOffset < 0) yOffset = 0;
    if (yOffset > maxY) yOffset = maxY;
    
    setTranslate(xOffset, yOffset, widget);
}

