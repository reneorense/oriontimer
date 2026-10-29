/**
 * Creates the DOM structure for a single 3D drum.
 */
export function createReelContainer(id, label) {
    const container = document.createElement('div');
    container.className = 'reel-container';
    container.id = `container-${id}`;

    const reel = document.createElement('div');
    reel.className = 'reel';
    
    const drum = document.createElement('div');
    drum.className = 'drum';
    drum.dataset.rotation = 0;
    drum.style.transform = `rotateX(0deg)`;

    // Create the 10 faces (0-9)
    for (let i = 0; i < 10; i++) {
        const face = document.createElement('div');
        face.className = 'face';
        face.textContent = i;
        face.style.transform = `rotateX(${i * 36}deg) translateZ(var(--radius))`;
        drum.appendChild(face);
    }

    const labelEl = document.createElement('div');
    labelEl.className = 'reel-label';
    labelEl.textContent = label;

    reel.appendChild(drum);
    container.appendChild(reel);
    container.appendChild(labelEl);

    return container;
}

/**
 * Updates the drum to show a specific digit, ensuring forward rotation.
 */
export function setReelDigit(id, newDigit, colorHex) {
    const drum = document.querySelector(`#container-${id} .drum`);
    const faces = document.querySelectorAll(`#container-${id} .face`);
    if (!drum) return;

    // Update colors if provided
    if (colorHex) {
        faces.forEach(face => face.style.color = colorHex);
    }

    let currentRotation = parseFloat(drum.dataset.rotation);
    let currentDigit = Math.round((currentRotation / 36) % 10);
    if (currentDigit < 0) currentDigit += 10;

    let diff = newDigit - currentDigit;
    
    // Always rotate forward (e.g., 9 to 0 goes +1 step)
    if (diff < 0) diff += 10;

    currentRotation += (diff * 36);
    drum.dataset.rotation = currentRotation;
    drum.style.transform = `rotateX(${-currentRotation}deg)`;
}
