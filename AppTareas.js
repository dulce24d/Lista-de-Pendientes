const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 8080;
const host = '148.213.41.145';
let pendientes = [];
let idCounter = 1; // Manejo seguro de IDs

app.use(bodyParser.json());

// Página principal con interfaz HTML integrada
app.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Lista de Pendientes</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-5">
        <h2 class="text-center mb-4">APP de tareas</h2>
        <div class="input-group mb-3">
            <input type="text" id="tareaInput" class="form-control" placeholder="Nueva tarea...">
            <button class="btn btn-primary" onclick="agregarTarea()">Agregar tarea</button>
        </div>
        <div class="row">
            <div class="col-md-6">
                <h4>Tareas por hacer</h4>
                <ul id="pendientes" class="list-group mb-3"></ul>
            </div>
            <div class="col-md-6">
                <h4>Tareas realizadas</h4>
                <ul id="realizadas" class="list-group"></ul>
            </div>
        </div>
    </div>
    <script>
        async function cargarPendientes() {
            const res = await fetch('/pendientes');
            const data = await res.json();
            const pendientes = document.getElementById('pendientes');
            const realizadas = document.getElementById('realizadas');
            pendientes.innerHTML = '';
            realizadas.innerHTML = '';
            data.forEach(p => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = p.realizado;
                checkbox.className = 'form-check-input me-2';
                checkbox.onchange = () => actualizarTarea(p.id, checkbox.checked);
                li.appendChild(checkbox);
                li.appendChild(document.createTextNode(p.tarea));
                const btnEliminar = document.createElement('button');
                btnEliminar.className = 'btn btn-danger btn-sm ms-2';
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.onclick = () => eliminarTarea(p.id);
                li.appendChild(btnEliminar);
                if (p.realizado) {
                    realizadas.appendChild(li);
                } else {
                    pendientes.appendChild(li);
                }
            });
        }

        async function agregarTarea() {
            const tarea = document.getElementById('tareaInput').value;
            if (!tarea) {
                alert('La tarea es obligatoria');
                return;
            }
            const res = await fetch('/pendientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tarea })
            });
            if (res.ok) {
                cargarPendientes();
                document.getElementById('tareaInput').value = '';
            } else {
                const error = await res.json();
                alert(error.error);
            }
        }

        async function eliminarTarea(id) {
            try {
                const res = await fetch(\`/pendientes/\${id}\`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Error al eliminar la tarea');
                cargarPendientes();
            } catch (error) {
                alert('Hubo un problema al eliminar la tarea');
                console.error(error);
            }
        }

        async function actualizarTarea(id, realizado) {
            try {
                const res = await fetch(\`/pendientes/\${id}\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ realizado })
                });
                if (!res.ok) throw new Error('Error al actualizar la tarea');
                cargarPendientes();
            } catch (error) {
                alert('Hubo un problema al actualizar la tarea');
                console.error(error);
            }
        }

        document.addEventListener('DOMContentLoaded', cargarPendientes);
    </script>
</body>
</html>`);
});

// Obtener todas las tareas
app.get('/pendientes', (req, res) => {
    res.json(pendientes);
});

// Agregar nueva tarea
app.post('/pendientes', (req, res) => {
    const { tarea } = req.body;
    if (!tarea) {
        return res.status(400).json({ error: 'La tarea es obligatoria' });
    }
    if (pendientes.find(p => p.tarea === tarea)) {
        return res.status(400).json({ error: 'La tarea ya existe' });
    }
    const nuevoPendiente = { id: idCounter++, tarea, realizado: false };
    pendientes.push(nuevoPendiente);
    res.status(201).json(nuevoPendiente);
});

// Eliminar tarea por ID
app.delete('/pendientes/:id', (req, res) => {
    const { id } = req.params;
    const idNum = parseInt(id);
    if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

    const index = pendientes.findIndex(p => p.id === idNum);
    if (index === -1) return res.status(404).json({ error: 'Pendiente no encontrado' });

    pendientes.splice(index, 1);
    res.status(204).send();
});

// Actualizar el estado de la tarea
app.put('/pendientes/:id', (req, res) => {
    const { id } = req.params;
    const { realizado } = req.body;
    const idNum = parseInt(id);
    if (isNaN(idNum)) return res.status(400).json({ error: 'ID inválido' });

    const pendiente = pendientes.find(p => p.id === idNum);
    if (!pendiente) return res.status(404).json({ error: 'Pendiente no encontrado' });

    pendiente.realizado = realizado;
    res.json(pendiente);
});

app.listen(port, host, () => {
    console.log(`Servidor ejecutándose en http://${host}:${port}`);
});


