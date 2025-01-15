// Gestión de pantallas
function showScreen(screenId) {
    const screens = ['home', 'admin', 'qr', 'default'];
    screens.forEach(screen => {
        document.getElementById(`${screen}-screen`).classList.add('hidden');
    });
    document.getElementById(`${screenId}-screen`).classList.remove('hidden');

    if (screenId === 'admin') {
        loadResponses();
    } else if (screenId === 'qr') {
        loadQR();
    } else if (screenId === 'default') {
        loadDefaultResponse();
    }
}

// Formulario de agregar/editar
function toggleAddForm() {
    const form = document.getElementById('add-form');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('keyword-input').value = '';
        document.getElementById('response-input').value = '';
    }
}

// Cargar todas las respuestas
async function loadResponses() {
    try {
        const response = await fetch('/api/responses');
        const data = await response.json();
        const container = document.getElementById('responses-list');
        container.innerHTML = '<div class="list-header">RESPUESTAS CONFIGURADAS</div>';

        for (const [keyword, resp] of Object.entries(data)) {
            if (keyword === 'default') continue;
            
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-item-content">
                    <div class="list-item-title">${keyword}</div>
                    <div class="list-item-subtitle">${resp}</div>
                </div>
                <div class="actions">
                    <button class="action-button" onclick="editResponse('${keyword.replace(/'/g, "\\'")}')">✎</button>
                    <button class="action-button delete" onclick="deleteResponse('${keyword.replace(/'/g, "\\'")}')">🗑</button>
                </div>
            `;
            container.appendChild(item);
        }
    } catch (error) {
        console.error('Error cargando respuestas:', error);
    }
}

// Cargar respuesta por defecto
async function loadDefaultResponse() {
    try {
        const response = await fetch('/api/responses');
        const data = await response.json();
        if (data.default) {
            document.getElementById('default-response').value = data.default;
        }
    } catch (error) {
        console.error('Error cargando respuesta por defecto:', error);
    }
}

// Guardar respuesta
async function saveResponse() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const response = document.getElementById('response-input').value.trim();

    if (!keyword || !response) {
        alert('Por favor completa todos los campos');
        return;
    }

    try {
        const currentResponses = await (await fetch('/api/responses')).json();
        currentResponses[keyword] = response;

        const saveResponse = await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentResponses)
        });

        if (saveResponse.ok) {
            document.getElementById('keyword-input').value = '';
            document.getElementById('response-input').value = '';
            toggleAddForm();
            loadResponses();
        }
    } catch (error) {
        console.error('Error guardando respuesta:', error);
        alert('Error al guardar la respuesta');
    }
}

// Guardar respuesta por defecto
async function saveDefaultResponse() {
    const defaultResponse = document.getElementById('default-response').value.trim();
    
    if (!defaultResponse) {
        alert('Por favor escribe una respuesta por defecto');
        return;
    }

    try {
        const currentResponses = await (await fetch('/api/responses')).json();
        currentResponses.default = defaultResponse;

        const saveResponse = await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentResponses)
        });

        if (saveResponse.ok) {
            alert('Respuesta por defecto guardada');
            showScreen('home');
        }
    } catch (error) {
        console.error('Error guardando respuesta por defecto:', error);
        alert('Error al guardar la respuesta por defecto');
    }
}

// Editar respuesta
async function editResponse(keyword) {
    try {
        const responses = await (await fetch('/api/responses')).json();
        document.getElementById('keyword-input').value = keyword;
        document.getElementById('response-input').value = responses[keyword];
        document.getElementById('add-form').classList.remove('hidden');
    } catch (error) {
        console.error('Error cargando respuesta para editar:', error);
        alert('Error al cargar la respuesta');
    }
}

// Eliminar respuesta
async function deleteResponse(keyword) {
    if (!confirm('¿Estás seguro de querer eliminar esta respuesta?')) return;

    try {
        const responses = await (await fetch('/api/responses')).json();
        delete responses[keyword];

        const response = await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responses)
        });

        if (response.ok) {
            loadResponses();
        }
    } catch (error) {
        console.error('Error eliminando respuesta:', error);
        alert('Error al eliminar la respuesta');
    }
}

// Cargar QR
async function loadQR() {
    try {
        const response = await fetch('/qr');
        const html = await response.text();
        const container = document.getElementById('qr-container');
        
        // Extraer la imagen del QR del HTML
        const match = html.match(/<img src="([^"]+)"/);
        if (match) {
            const img = document.createElement('img');
            img.src = match[1];
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            container.innerHTML = '';
            container.appendChild(img);
        } else {
            container.innerHTML = 'Generando código QR...';
        }
    } catch (error) {
        console.error('Error cargando QR:', error);
        document.getElementById('qr-container').innerHTML = 'Error al cargar el código QR';
    }
}

// Inicializar
function init() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        showScreen(hash);
    }
}

// Manejar navegación
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
        showScreen(hash);
    } else {
        showScreen('home');
    }
});

// Iniciar aplicación
init();
