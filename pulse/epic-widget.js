// Widget minimize/maximize functionality
function toggleWidget() {
    const widget = document.getElementById('clinicalTrialsWidget');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const maximizeBtn = document.getElementById('maximizeBtn');
    
    if (widget.classList.contains('minimized')) {
        widget.classList.remove('minimized');
        minimizeBtn.style.display = 'inline-block';
        maximizeBtn.style.display = 'none';
    } else {
        widget.classList.add('minimized');
        minimizeBtn.style.display = 'none';
        maximizeBtn.style.display = 'inline-block';
    }
}

// Make widget draggable
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const widget = document.getElementById('clinicalTrialsWidget');
const widgetHeader = widget.querySelector('.widget-header');

widgetHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    if (e.target.classList.contains('widget-btn')) {
        return; // Don't drag when clicking buttons
    }
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === widgetHeader || widgetHeader.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, widget);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// Initialize widget position
window.addEventListener('load', () => {
    xOffset = 0;
    yOffset = 0;
    setTranslate(0, 0, widget);
});

