const socket = new WebSocket('ws://localhost:3000');
let selectedColor = '#000000';
let zoomLevel = 1;
const maxZoom = 4;
const minZoom = 1;

document.getElementById('colorPicker').addEventListener('input', (e) => {
    selectedColor = e.target.value;
});

document.getElementById('zoom-in').addEventListener('click', () => {
    zoomLevel = Math.min(maxZoom, zoomLevel + 0.5);
    updateZoom();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    zoomLevel = Math.max(minZoom, zoomLevel - 0.5);
    updateZoom();
});

function updateZoom() {
    const grid = document.getElementById('grid');
    grid.style.transform = `scale(${zoomLevel})`;
    if (zoomLevel > 1) {
        grid.classList.add('zoomed');
    } else {
        grid.classList.remove('zoomed');
    }
}

socket.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'grid') {
        renderGrid(data.grid);
    } else if (data.type === 'update_pixel') {
        updatePixel(data.x, data.y, data.color);
    } else if (data.type === 'error') {
        document.getElementById('error-message').textContent = data.message;
        setTimeout(() => {
            document.getElementById('error-message').textContent = '';
        }, 3000);
    }
};

function renderGrid(grid) {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';

    grid.forEach((row, x) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'row';

        row.forEach((color, y) => {
            const pixelElement = document.createElement('div');
            pixelElement.className = 'pixel';
            pixelElement.style.backgroundColor = color;

            pixelElement.setAttribute('data-original-color', color);

            pixelElement.addEventListener('mouseenter', () => {
                previewPixel(pixelElement);
            });

            pixelElement.addEventListener('mouseleave', () => {
                removePreview(pixelElement);
            });

            pixelElement.addEventListener('click', () => {
                confirmPixelPlacement(x, y, pixelElement);
            });

            rowElement.appendChild(pixelElement);
        });

        gridElement.appendChild(rowElement);
    });
}

function previewPixel(pixelElement) {
    const originalColor = pixelElement.getAttribute('data-original-color');

    pixelElement.style.backgroundColor = selectedColor;
    pixelElement.classList.add('preview');

    pixelElement.setAttribute('data-preview-color', selectedColor);
}

function removePreview(pixelElement) {
    pixelElement.classList.remove('preview');
    
    const originalColor = pixelElement.getAttribute('data-original-color');
    pixelElement.style.backgroundColor = originalColor; // Remettre la couleur originale
}

function confirmPixelPlacement(x, y, pixelElement) {
    const confirmed = confirm(`Are you sure you want to place this pixel at (${x}, ${y})?`);
    if (confirmed) {
        socket.send(JSON.stringify({ type: 'place_pixel', x, y, color: selectedColor }));
        
        pixelElement.style.backgroundColor = selectedColor;
        pixelElement.setAttribute('data-original-color', selectedColor);
        pixelElement.classList.remove('preview');
    }
}

function updatePixel(x, y, color) {
    const gridElement = document.getElementById('grid');
    const row = gridElement.children[x];
    const pixel = row.children[y];
    pixel.style.backgroundColor = color;
}