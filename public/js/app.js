const API = '/api';
const modalProducto = new bootstrap.Modal('#modalProducto');
const modalComprador = new bootstrap.Modal('#modalComprador');
const modalDetalleVenta = new bootstrap.Modal('#modalDetalleVenta');
const modalPreviewInventario = new bootstrap.Modal('#modalPreviewInventario');
const modalResultadoCarga = new bootstrap.Modal('#modalResultadoCarga');

let productos = [];
let compradores = [];
let carrito = [];

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    navegarA(el.dataset.page);
  });
});

function navegarA(page) {
  document.querySelectorAll('[data-page]').forEach(a => a.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  const bsCollapse = bootstrap.Collapse.getInstance(document.getElementById('mainNav'));
  if (bsCollapse) bsCollapse.hide();

  switch (page) {
    case 'inicio': renderInicio(); break;
    case 'consulta-ventas': renderConsultaVentas(); break;
    case 'nueva-venta': renderNuevaVenta(); break;
    case 'disponibilidad': renderDisponibilidad(); break;
    case 'productos': renderProductos(); break;
    case 'cargar-inventario': renderCargarInventario(); break;
    case 'consultar-inventario': renderConsultarInventario(); break;
    case 'compradores': renderCompradores(); break;
  }
}

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (res.status === 401) { window.location.href = '/login.html'; return; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error del servidor');
  }
  return res.json();
}

async function cerrarSesion() {
  await api('/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}

// ==================== INICIO ====================
async function renderInicio() {
  const content = document.getElementById('app-content');
  content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-warning" style="width:3rem;height:3rem;"></div></div>';
  try {
    const data = await api('/ventas/resumen');
    const prods = await api('/productos');
    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
        <div>
          <h4 class="page-title mb-1"><i class="bi bi-house-door"></i> Panel de Control</h4>
          <p class="text-muted mb-0">Bienvenido a <span class="text-gold fw-bold">GOLDEN DRAGON</span></p>
        </div>
        <span class="badge bg-gold text-dark fs-6 px-3 py-2">
          <i class="bi bi-calendar3"></i> ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>
      <div class="row mb-4 fade-in">
        <div class="col-md-3 mb-3">
          <div class="card stat-card pulse-glow h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="stat-label">Ventas Hoy</div>
                  <div class="stat-value">$${data.ventas_hoy.monto.toFixed(2)}</div>
                  <small class="text-muted">${data.ventas_hoy.total} transacciones</small>
                </div>
                <div class="stat-icon"><i class="bi bi-graph-up-arrow"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="stat-label">Ventas Totales</div>
                  <div class="stat-value">$${data.ventas_totales.monto.toFixed(2)}</div>
                  <small class="text-muted">${data.ventas_totales.total} ventas registradas</small>
                </div>
                <div class="stat-icon"><i class="bi bi-cash-stack"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="stat-label">Productos</div>
                  <div class="stat-value">${prods.length}</div>
                  <small class="text-muted">en catálogo</small>
                </div>
                <div class="stat-icon"><i class="bi bi-box-seam"></i></div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3 mb-3">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="stat-label">Bajo Stock</div>
                  <div class="stat-value">${data.productos_bajo_stock.total}</div>
                  <small class="text-muted">productos ≤ 5 uds</small>
                </div>
                <div class="stat-icon"><i class="bi bi-exclamation-triangle"></i></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row fade-in">
        <div class="col-md-6 mb-3">
          <div class="card h-100">
            <div class="card-header"><i class="bi bi-trophy"></i> Productos Más Vendidos</div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead><tr><th>Producto</th><th class="text-end">Cantidad</th><th class="text-end">Total</th></tr></thead>
                  <tbody>
                    ${data.productos_mas_vendidos.length === 0
                      ? '<tr><td colspan="3" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> Sin ventas aún</td></tr>'
                      : data.productos_mas_vendidos.map(p => `
                        <tr>
                          <td><strong>${p.nombre}</strong></td>
                          <td class="text-end">${p.cantidad}</td>
                          <td class="text-end text-gold fw-bold">$${p.total.toFixed(2)}</td>
                        </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-3">
          <div class="card h-100">
            <div class="card-header"><i class="bi bi-calendar-week"></i> Ventas Últimos 7 Días</div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead><tr><th>Fecha</th><th class="text-end">Ventas</th><th class="text-end">Monto</th></tr></thead>
                  <tbody>
                    ${data.ventas_por_dia.length === 0
                      ? '<tr><td colspan="3" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> Sin datos</td></tr>'
                      : data.ventas_por_dia.map(d => `
                        <tr>
                          <td>${d.fecha}</td>
                          <td class="text-end"><span class="badge bg-gold text-dark">${d.cantidad}</span></td>
                          <td class="text-end text-gold fw-bold">$${d.monto.toFixed(2)}</td>
                        </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger fade-in"><i class="bi bi-exclamation-triangle"></i> Error al cargar: ${err.message}</div>`;
  }
}

// ==================== CONSULTA DE VENTAS ====================
async function renderConsultaVentas() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 fade-in">
      <h4 class="page-title mb-2"><i class="bi bi-search"></i> Consulta de Ventas</h4>
      <div class="d-flex flex-wrap gap-2 align-items-center">
        <select class="form-select form-select-sm" id="filtroEstado" style="width:auto;min-width:130px;">
          <option value="">Todos los estados</option>
          <option value="completada">Completadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <input type="date" class="form-control form-control-sm" id="filtroDesde" style="width:auto;max-width:150px;">
        <input type="date" class="form-control form-control-sm" id="filtroHasta" style="width:auto;max-width:150px;">
        <button class="btn btn-gold btn-sm" onclick="cargarVentas()"><i class="bi bi-search"></i> Filtrar</button>
        <button class="btn btn-outline-gold btn-sm" onclick="limpiarFiltrosVentas()"><i class="bi bi-x-circle"></i> Limpiar</button>
      </div>
    </div>
    <div class="card fade-in">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead><tr><th>#</th><th>Comprador</th><th class="text-end">Total</th><th>Estado</th><th>Fecha</th><th class="text-center">Acciones</th></tr></thead>
            <tbody id="tablaVentas"><tr><td colspan="6" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-gold"></div> Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>`;
  await cargarVentas();
}

function limpiarFiltrosVentas() {
  document.getElementById('filtroEstado').value = '';
  document.getElementById('filtroDesde').value = '';
  document.getElementById('filtroHasta').value = '';
  cargarVentas();
}

async function cargarVentas() {
  const estado = document.getElementById('filtroEstado').value;
  const desde = document.getElementById('filtroDesde').value;
  const hasta = document.getElementById('filtroHasta').value;
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta + 'T23:59:59');

  try {
    const ventas = await api(`/ventas?${params.toString()}`);
    const tbody = document.getElementById('tablaVentas');
    if (ventas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No se encontraron ventas</td></tr>';
      return;
    }
    tbody.innerHTML = ventas.map(v => `
      <tr>
        <td><strong>${v.id}</strong></td>
        <td>${v.comprador_nombre}</td>
        <td class="text-end text-gold fw-bold">$${v.total.toFixed(2)}</td>
        <td><span class="badge ${v.estado === 'completada' ? 'bg-success' : v.estado === 'pendiente' ? 'bg-warning text-dark' : 'bg-danger'}">${v.estado}</span></td>
        <td><small>${new Date(v.created_at).toLocaleString('es-ES')}</small></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-gold" onclick="verDetalleVenta(${v.id})" title="Ver detalle"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="cancelarVenta(${v.id})" title="Cancelar"><i class="bi bi-x-circle"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('tablaVentas').innerHTML = `<tr><td colspan="6" class="text-danger">${err.message}</td></tr>`;
  }
}

async function verDetalleVenta(id) {
  try {
    const v = await api(`/ventas/${id}`);
    document.getElementById('detalleVentaId').textContent = v.id;
    document.getElementById('detalleVentaBody').innerHTML = `
      <div class="row mb-3">
        <div class="col"><strong>Comprador:</strong> ${v.comprador_nombre}</div>
        <div class="col"><strong>Estado:</strong> <span class="badge ${v.estado === 'completada' ? 'bg-success' : v.estado === 'pendiente' ? 'bg-warning text-dark' : 'bg-danger'}">${v.estado}</span></div>
        <div class="col"><strong>Fecha:</strong> ${new Date(v.created_at).toLocaleString('es-ES')}</div>
      </div>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>Producto</th><th class="text-end">Precio</th><th class="text-end">Cant.</th><th class="text-end">Subtotal</th></tr></thead>
          <tbody>
            ${v.items.map(i => `
              <tr>
                <td>${i.producto_nombre}</td>
                <td class="text-end">$${i.precio_unitario.toFixed(2)}</td>
                <td class="text-end">${i.cantidad}</td>
                <td class="text-end text-gold fw-bold">$${i.subtotal.toFixed(2)}</td>
              </tr>`).join('')}
          </tbody>
          <tfoot><tr><th colspan="3" class="text-end">Total</th><th class="text-end text-gold fs-5">$${v.total.toFixed(2)}</th></tr></tfoot>
        </table>
      </div>`;
    modalDetalleVenta.show();
  } catch (err) { alert(err.message); }
}

async function cancelarVenta(id) {
  if (!confirm('¿Cancelar esta venta? Se restaurará el stock.')) return;
  try {
    await api(`/ventas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado: 'cancelada' }) });
    await cargarVentas();
  } catch (err) { alert(err.message); }
}

// ==================== DISPONIBILIDAD ====================
async function renderDisponibilidad() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
      <h4 class="page-title"><i class="bi bi-check-circle"></i> Disponibilidad de Productos</h4>
      <div>
        <input class="form-control form-control-sm" id="buscarDisponibilidad" placeholder="Buscar producto..." style="width:250px;">
      </div>
    </div>
    <div class="row availability-grid" id="disponibilidadGrid">
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-warning"></div>
      </div>
    </div>`;

  document.getElementById('buscarDisponibilidad').addEventListener('input', cargarDisponibilidad);
  await cargarDisponibilidad();
}

async function cargarDisponibilidad() {
  const buscar = document.getElementById('buscarDisponibilidad')?.value || '';
  try {
    const data = await api(`/productos${buscar ? '?buscar=' + encodeURIComponent(buscar) : ''}`);
    const grid = document.getElementById('disponibilidadGrid');
    if (data.length === 0) {
      grid.innerHTML = '<div class="col-12"><div class="alert alert-info text-center"><i class="bi bi-info-circle"></i> No hay productos disponibles</div></div>';
      return;
    }
    grid.innerHTML = data.map(p => {
      const pct = Math.min((p.stock / 100) * 100, 100);
      const stockClass = p.stock > 20 ? 'stock-high' : p.stock > 5 ? 'stock-medium' : 'stock-low';
      const barClass = p.stock > 20 ? 'bg-success' : p.stock > 5 ? 'bg-warning' : 'bg-danger';
      return `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-3">
          <div class="avail-item h-100">
            <div class="stock-circle ${stockClass} mx-auto">${p.stock}</div>
            <h6 class="mb-1">${p.nombre}</h6>
            <small class="text-muted">$${p.precio.toFixed(2)}</small>
            <div class="progress mt-2">
              <div class="progress-bar ${barClass}" role="progressbar" style="width:${pct}%"></div>
            </div>
            <small class="text-muted">${p.stock} unidad${p.stock !== 1 ? 'es' : ''}</small>
          </div>
        </div>`;
    }).join('');
  } catch (err) {
    document.getElementById('disponibilidadGrid').innerHTML =
      `<div class="col-12"><div class="alert alert-danger">${err.message}</div></div>`;
  }
}

// ==================== PRODUCTOS ====================
async function renderProductos() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 fade-in">
      <h4 class="page-title mb-2"><i class="bi bi-list-ul"></i> Listado de Productos</h4>
      <div class="d-flex gap-2">
        <input class="form-control form-control-sm" id="buscarProducto" placeholder="Buscar producto..." style="width:200px;">
        <button class="btn btn-gold btn-sm" onclick="abrirModalProducto()"><i class="bi bi-plus"></i> Nuevo</button>
      </div>
    </div>
    <div class="card fade-in">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th class="text-end">Precio</th><th class="text-end">Stock</th><th class="text-center">Acciones</th></tr></thead>
            <tbody id="tablaProductos"><tr><td colspan="6" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-gold"></div> Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('buscarProducto').addEventListener('input', cargarProductos);
  await cargarProductos();
}

async function cargarProductos() {
  const buscar = document.getElementById('buscarProducto')?.value || '';
  try {
    productos = await api(`/productos${buscar ? '?buscar=' + encodeURIComponent(buscar) : ''}`);
    const tbody = document.getElementById('tablaProductos');
    if (productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay productos registrados</td></tr>';
      return;
    }
    tbody.innerHTML = productos.map(p => `
      <tr>
        <td>${p.id}</td>
        <td><strong>${p.nombre}</strong></td>
        <td><small class="text-muted">${p.descripcion || '-'}</small></td>
        <td class="text-end">$${p.precio.toFixed(2)}</td>
        <td class="text-end"><span class="badge ${p.stock <= 5 ? 'bg-danger' : p.stock <= 20 ? 'bg-warning text-dark' : 'bg-success'}">${p.stock}</span></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-gold" onclick="abrirModalProducto(${p.id})" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('tablaProductos').innerHTML = `<tr><td colspan="6" class="text-danger">${err.message}</td></tr>`;
  }
}

function abrirModalProducto(id = null) {
  document.getElementById('modalProductoTitle').textContent = id ? 'Editar Producto' : 'Nuevo Producto';
  document.getElementById('editProductoId').value = id || '';
  document.getElementById('prodNombre').value = '';
  document.getElementById('prodDescripcion').value = '';
  document.getElementById('prodPrecio').value = '';
  document.getElementById('prodStock').value = '';

  if (id) {
    const p = productos.find(x => x.id === id);
    if (p) {
      document.getElementById('prodNombre').value = p.nombre;
      document.getElementById('prodDescripcion').value = p.descripcion;
      document.getElementById('prodPrecio').value = p.precio;
      document.getElementById('prodStock').value = p.stock;
    }
  }
  modalProducto.show();
}

document.getElementById('btnGuardarProducto').addEventListener('click', async () => {
  const id = document.getElementById('editProductoId').value;
  const data = {
    nombre: document.getElementById('prodNombre').value.trim(),
    descripcion: document.getElementById('prodDescripcion').value.trim(),
    precio: parseFloat(document.getElementById('prodPrecio').value),
    stock: parseInt(document.getElementById('prodStock').value) || 0
  };
  if (!data.nombre || isNaN(data.precio) || data.precio < 0) return alert('Nombre y precio válido son requeridos');
  try {
    if (id) await api(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api('/productos', { method: 'POST', body: JSON.stringify(data) });
    modalProducto.hide();
    await cargarProductos();
  } catch (err) { alert(err.message); }
});

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await api(`/productos/${id}`, { method: 'DELETE' });
    await cargarProductos();
  } catch (err) { alert(err.message); }
}

// ==================== CARGAR INVENTARIO ====================
let inventarioPendiente = [];

function renderCargarInventario() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="fade-in">
      <h4 class="page-title mb-4"><i class="bi bi-upload"></i> Cargar Inventario</h4>

      <div class="row">
        <div class="col-md-6 mb-3">
          <div class="card h-100">
            <div class="card-header"><i class="bi bi-filetype-csv"></i> Cargar desde CSV</div>
            <div class="card-body">
              <p class="text-muted small">Sube un archivo CSV con columnas: <code>nombre, descripcion, precio, stock</code></p>
              <div class="drop-zone" id="dropZone" onclick="document.getElementById('csvFile').click()">
                <i class="bi bi-cloud-upload"></i>
                <p class="mt-2 mb-0">Arrastra tu archivo CSV aquí o haz clic para seleccionar</p>
                <small class="text-muted">O pega el contenido CSV en el área de texto</small>
              </div>
              <input type="file" id="csvFile" accept=".csv" class="d-none">
              <textarea class="form-control mt-3" id="csvTexto" rows="5" placeholder="nombre,descripcion,precio,stock&#10;Producto A,Descripción A,100,50&#10;Producto B,Descripción B,200,30"></textarea>
              <div class="mt-3">
                <label class="form-label">Modo de carga</label>
                <select class="form-select" id="modoCarga">
                  <option value="add">Sumar al stock existente</option>
                  <option value="replace">Reemplazar stock existente</option>
                </select>
              </div>
              <button class="btn btn-gold mt-3 w-100" onclick="previsualizarCarga()"><i class="bi bi-eye"></i> Previsualizar Carga</button>
            </div>
          </div>
        </div>

        <div class="col-md-6 mb-3">
          <div class="card h-100">
            <div class="card-header"><i class="bi bi-hand-index"></i> Carga Manual</div>
            <div class="card-body">
              <p class="text-muted small">Agrega productos uno por uno al inventario</p>
              <div class="mb-2">
                <input class="form-control form-control-sm" id="manualNombre" placeholder="Nombre del producto">
              </div>
              <div class="mb-2">
                <input class="form-control form-control-sm" id="manualDescripcion" placeholder="Descripción">
              </div>
              <div class="row mb-2">
                <div class="col">
                  <input type="number" class="form-control form-control-sm" id="manualPrecio" placeholder="Precio" step="0.01" min="0">
                </div>
                <div class="col">
                  <input type="number" class="form-control form-control-sm" id="manualStock" placeholder="Stock" min="0">
                </div>
              </div>
              <button class="btn btn-outline-gold btn-sm w-100" onclick="agregarManualInventario()"><i class="bi bi-plus"></i> Agregar a lista</button>
              <hr class="my-3">
              <h6>Items pendientes (<span id="pendientesCount">0</span>)</h6>
              <div style="max-height:200px;overflow-y:auto;" id="listaPendientes">
                <p class="text-muted small mb-0">No hay items pendientes. Agrega productos manualmente o carga un CSV.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('csvFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('csvTexto').value = ev.target.result;
    };
    reader.readAsText(file);
  });

  const dropZone = document.getElementById('dropZone');
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('csvTexto').value = ev.target.result;
      };
      reader.readAsText(file);
    }
  });
}

function agregarManualInventario() {
  const nombre = document.getElementById('manualNombre').value.trim();
  const descripcion = document.getElementById('manualDescripcion').value.trim();
  const precio = parseFloat(document.getElementById('manualPrecio').value);
  const stock = parseInt(document.getElementById('manualStock').value) || 0;
  if (!nombre) return alert('El nombre es requerido');
  inventarioPendiente.push({ nombre, descripcion, precio: isNaN(precio) ? 0 : precio, stock });
  document.getElementById('manualNombre').value = '';
  document.getElementById('manualDescripcion').value = '';
  document.getElementById('manualPrecio').value = '';
  document.getElementById('manualStock').value = '';
  actualizarListaPendientes();
}

function actualizarListaPendientes() {
  document.getElementById('pendientesCount').textContent = inventarioPendiente.length;
  const lista = document.getElementById('listaPendientes');
  if (inventarioPendiente.length === 0) {
    lista.innerHTML = '<p class="text-muted small mb-0">No hay items pendientes.</p>';
    return;
  }
  lista.innerHTML = inventarioPendiente.map((item, i) => `
    <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-secondary">
      <div><strong>${item.nombre}</strong> <small class="text-muted">$${item.precio.toFixed(2)} x ${item.stock}</small></div>
      <button class="btn btn-sm btn-outline-danger py-0" onclick="quitarPendiente(${i})"><i class="bi bi-x"></i></button>
    </div>`).join('');
}

function quitarPendiente(idx) {
  inventarioPendiente.splice(idx, 1);
  actualizarListaPendientes();
}

function parsearCSV(texto) {
  const lineas = texto.split('\n').filter(l => l.trim());
  if (lineas.length < 2) return [];
  const encabezados = lineas[0].split(',').map(h => h.trim().toLowerCase());
  const idxNombre = encabezados.indexOf('nombre');
  const idxDesc = encabezados.indexOf('descripcion');
  const idxPrecio = encabezados.indexOf('precio');
  const idxStock = encabezados.indexOf('stock');
  if (idxNombre === -1 || idxPrecio === -1) {
    throw new Error('CSV debe tener al menos columnas: nombre, precio');
  }
  const items = [];
  for (let i = 1; i < lineas.length; i++) {
    const cols = lineas[i].split(',').map(c => c.trim());
    items.push({
      nombre: cols[idxNombre] || '',
      descripcion: idxDesc >= 0 ? cols[idxDesc] || '' : '',
      precio: parseFloat(cols[idxPrecio]) || 0,
      stock: idxStock >= 0 ? parseInt(cols[idxStock]) || 0 : 0
    });
  }
  return items.filter(i => i.nombre);
}

function previsualizarCarga() {
  const csvTexto = document.getElementById('csvTexto').value.trim();
  if (csvTexto) {
    try {
      const items = parsearCSV(csvTexto);
      if (items.length === 0) return alert('No se encontraron datos válidos en el CSV');
      inventarioPendiente = items;
      actualizarListaPendientes();
    } catch (err) {
      return alert(err.message);
    }
  }
  if (inventarioPendiente.length === 0) return alert('No hay items para cargar. Agrega productos o pega un CSV.');
  mostrarPreviewCarga();
}

function mostrarPreviewCarga() {
  const modal = document.getElementById('previewInventarioBody');
  const modo = document.getElementById('modoCarga').value;
  modal.innerHTML = `
    <div class="alert alert-info"><i class="bi bi-info-circle"></i> Modo: <strong>${modo === 'add' ? 'Sumar stock' : 'Reemplazar stock'}</strong></div>
    <div class="table-responsive" style="max-height:400px;overflow-y:auto;">
      <table class="table table-sm">
        <thead><tr><th>Nombre</th><th>Descripción</th><th class="text-end">Precio</th><th class="text-end">Stock</th></tr></thead>
        <tbody>
          ${inventarioPendiente.map(item => `
            <tr>
              <td><strong>${item.nombre}</strong></td>
              <td><small class="text-muted">${item.descripcion || '-'}</small></td>
              <td class="text-end">$${item.precio.toFixed(2)}</td>
              <td class="text-end">${item.stock}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <p class="text-muted mt-2 mb-0">Total: <strong>${inventarioPendiente.length}</strong> productos</p>`;
  modalPreviewInventario.show();
}

document.getElementById('btnConfirmarCarga').addEventListener('click', async () => {
  const modo = document.getElementById('modoCarga').value;
  const btn = document.getElementById('btnConfirmarCarga');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cargando...';
  try {
    const resultado = await api('/inventario/cargar', {
      method: 'POST',
      body: JSON.stringify({ items: inventarioPendiente, mode: modo })
    });
    modalPreviewInventario.hide();
    document.getElementById('resultadoCargaBody').innerHTML = `
      <div class="text-center py-3">
        <div style="font-size:3rem;color:var(--gold);">&#10003;</div>
        <h5 class="text-gold">Carga Completada</h5>
        <div class="row mt-3">
          <div class="col">
            <div class="card bg-transparent border-success text-center p-2">
              <div class="fs-3 text-success">${resultado.creados}</div>
              <small>Creados</small>
            </div>
          </div>
          <div class="col">
            <div class="card bg-transparent border-warning text-center p-2">
              <div class="fs-3 text-warning">${resultado.actualizados}</div>
              <small>Actualizados</small>
            </div>
          </div>
        </div>
        ${resultado.errores && resultado.errores.length > 0 ? `
          <div class="alert alert-warning mt-3">${resultado.errores.length} error(es)</div>
        ` : ''}
      </div>`;
    modalResultadoCarga.show();
    inventarioPendiente = [];
    actualizarListaPendientes();
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Confirmar Carga';
  }
});

// ==================== CONSULTAR INVENTARIO ====================
async function renderConsultarInventario() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 fade-in">
      <h4 class="page-title mb-2"><i class="bi bi-eye"></i> Consultar Inventario</h4>
      <div class="d-flex gap-2 flex-wrap">
        <select class="form-select form-select-sm" id="filtroStock" style="width:auto;min-width:130px;">
          <option value="">Todos los niveles</option>
          <option value="5">Stock crítico (≤ 5)</option>
          <option value="20">Stock bajo (≤ 20)</option>
          <option value="50">Stock medio (≤ 50)</option>
        </select>
        <input class="form-control form-control-sm" id="buscarInventario" placeholder="Buscar producto..." style="width:180px;">
        <button class="btn btn-gold btn-sm" onclick="cargarInventario()"><i class="bi bi-search"></i> Consultar</button>
        <button class="btn btn-outline-gold btn-sm" onclick="exportarInventario()"><i class="bi bi-download"></i> Exportar</button>
      </div>
    </div>

    <div class="row mb-3 fade-in" id="resumenInventario"></div>

    <div class="card fade-in">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0" id="tablaInventario">
            <thead><tr><th>ID</th><th>Producto</th><th>Descripción</th><th class="text-end">Precio</th><th class="text-end">Stock</th><th>Nivel</th><th>Valor Inventario</th></tr></thead>
            <tbody id="tablaInventarioBody"><tr><td colspan="7" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-gold"></div> Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('buscarInventario').addEventListener('input', cargarInventario);
  document.getElementById('filtroStock').addEventListener('change', cargarInventario);
  await cargarInventario();
}

async function cargarInventario() {
  const buscar = document.getElementById('buscarInventario')?.value || '';
  const minimo = document.getElementById('filtroStock').value;
  try {
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);
    if (minimo) params.set('minimo', minimo);

    let data;
    if (minimo || buscar) {
      data = await api(`/inventario/stock?${params.toString()}`);
    } else {
      data = await api(`/productos${buscar ? '?buscar=' + encodeURIComponent(buscar) : ''}`);
    }

    const resumen = document.getElementById('resumenInventario');
    const totalItems = data.length;
    const totalValor = data.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const totalStock = data.reduce((sum, p) => sum + p.stock, 0);
    const bajos = data.filter(p => p.stock <= 5).length;

    resumen.innerHTML = `
      <div class="col-md-3 col-6 mb-2">
        <div class="card bg-transparent text-center p-2">
          <small class="text-muted">Productos</small>
          <div class="fs-4 text-gold fw-bold">${totalItems}</div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="card bg-transparent text-center p-2">
          <small class="text-muted">Stock Total</small>
          <div class="fs-4 text-gold fw-bold">${totalStock}</div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="card bg-transparent text-center p-2">
          <small class="text-muted">Valor Inventario</small>
          <div class="fs-4 text-gold fw-bold">$${totalValor.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-md-3 col-6 mb-2">
        <div class="card bg-transparent text-center p-2">
          <small class="text-muted">Stock Crítico</small>
          <div class="fs-4 ${bajos > 0 ? 'text-danger' : 'text-success'} fw-bold">${bajos}</div>
        </div>
      </div>`;

    const tbody = document.getElementById('tablaInventarioBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay productos</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(p => {
      const nivel = p.stock <= 5 ? 'Crítico' : p.stock <= 20 ? 'Bajo' : p.stock <= 50 ? 'Medio' : 'Óptimo';
      const nivelClass = p.stock <= 5 ? 'bg-danger' : p.stock <= 20 ? 'bg-warning text-dark' : p.stock <= 50 ? 'bg-info text-dark' : 'bg-success';
      const valor = p.precio * p.stock;
      return `
        <tr>
          <td>${p.id}</td>
          <td><strong>${p.nombre}</strong></td>
          <td><small class="text-muted">${p.descripcion || '-'}</small></td>
          <td class="text-end">$${p.precio.toFixed(2)}</td>
          <td class="text-end">${p.stock}</td>
          <td><span class="badge ${nivelClass} inventory-badge">${nivel}</span></td>
          <td class="text-end text-gold">$${valor.toFixed(2)}</td>
        </tr>`;
    }).join('');
  } catch (err) {
    document.getElementById('tablaInventarioBody').innerHTML =
      `<tr><td colspan="7" class="text-danger">${err.message}</td></tr>`;
  }
}

function exportarInventario() {
  const rows = document.querySelectorAll('#tablaInventarioBody tr');
  if (!rows.length || rows[0].querySelector('td')?.colSpan) return alert('No hay datos para exportar');
  let csv = 'ID,Producto,Descripcion,Precio,Stock,Nivel,Valor\n';
  rows.forEach(row => {
    const cols = row.querySelectorAll('td');
    if (cols.length >= 7) {
      const id = cols[0].textContent.trim();
      const nombre = cols[1].textContent.trim();
      const desc = cols[2].textContent.trim().replace(/,/g, ';');
      const precio = cols[3].textContent.trim().replace('$', '');
      const stock = cols[4].textContent.trim();
      const nivel = cols[5].textContent.trim();
      const valor = cols[6].textContent.trim().replace('$', '');
      csv += `${id},"${nombre}","${desc}",${precio},${stock},"${nivel}",${valor}\n`;
    }
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

// ==================== COMPRADORES ====================
async function renderCompradores() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 fade-in">
      <h4 class="page-title mb-2"><i class="bi bi-people"></i> Compradores</h4>
      <div class="d-flex gap-2">
        <input class="form-control form-control-sm" id="buscarComprador" placeholder="Buscar comprador..." style="width:200px;">
        <button class="btn btn-gold btn-sm" onclick="abrirModalComprador()"><i class="bi bi-plus"></i> Nuevo</button>
      </div>
    </div>
    <div class="card fade-in">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th class="text-center">Acciones</th></tr></thead>
            <tbody id="tablaCompradores"><tr><td colspan="6" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm text-gold"></div> Cargando...</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>`;

  document.getElementById('buscarComprador').addEventListener('input', cargarCompradores);
  await cargarCompradores();
}

async function cargarCompradores() {
  const buscar = document.getElementById('buscarComprador')?.value || '';
  try {
    compradores = await api(`/compradores${buscar ? '?buscar=' + encodeURIComponent(buscar) : ''}`);
    const tbody = document.getElementById('tablaCompradores');
    if (compradores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4"><i class="bi bi-inbox"></i> No hay compradores registrados</td></tr>';
      return;
    }
    tbody.innerHTML = compradores.map(c => `
      <tr>
        <td>${c.id}</td>
        <td><strong>${c.nombre}</strong></td>
        <td>${c.email || '-'}</td>
        <td>${c.telefono || '-'}</td>
        <td><small class="text-muted">${c.direccion || '-'}</small></td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-gold" onclick="abrirModalComprador(${c.id})" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarComprador(${c.id})" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    document.getElementById('tablaCompradores').innerHTML = `<tr><td colspan="6" class="text-danger">${err.message}</td></tr>`;
  }
}

function abrirModalComprador(id = null) {
  document.getElementById('modalCompradorTitle').textContent = id ? 'Editar Comprador' : 'Nuevo Comprador';
  document.getElementById('editCompradorId').value = id || '';
  document.getElementById('compNombre').value = '';
  document.getElementById('compEmail').value = '';
  document.getElementById('compTelefono').value = '';
  document.getElementById('compDireccion').value = '';

  if (id) {
    const c = compradores.find(x => x.id === id);
    if (c) {
      document.getElementById('compNombre').value = c.nombre;
      document.getElementById('compEmail').value = c.email;
      document.getElementById('compTelefono').value = c.telefono;
      document.getElementById('compDireccion').value = c.direccion;
    }
  }
  modalComprador.show();
}

document.getElementById('btnGuardarComprador').addEventListener('click', async () => {
  const id = document.getElementById('editCompradorId').value;
  const data = {
    nombre: document.getElementById('compNombre').value.trim(),
    email: document.getElementById('compEmail').value.trim(),
    telefono: document.getElementById('compTelefono').value.trim(),
    direccion: document.getElementById('compDireccion').value.trim()
  };
  if (!data.nombre) return alert('El nombre es requerido');
  try {
    if (id) await api(`/compradores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api('/compradores', { method: 'POST', body: JSON.stringify(data) });
    modalComprador.hide();
    await cargarCompradores();
  } catch (err) { alert(err.message); }
});

async function eliminarComprador(id) {
  if (!confirm('¿Eliminar este comprador?')) return;
  try {
    await api(`/compradores/${id}`, { method: 'DELETE' });
    await cargarCompradores();
  } catch (err) { alert(err.message); }
}

// ==================== NUEVA VENTA ====================
async function renderNuevaVenta() {
  const content = document.getElementById('app-content');
  content.innerHTML = `
    <div class="fade-in">
      <h4 class="page-title mb-4"><i class="bi bi-plus-circle"></i> Nueva Venta</h4>
      <div class="row">
        <div class="col-md-5 mb-3">
          <div class="card mb-3">
            <div class="card-header"><i class="bi bi-person"></i> Seleccionar Comprador</div>
            <div class="card-body">
              <div class="mb-3">
                <input class="form-control" id="buscarCompradorVenta" placeholder="Buscar comprador...">
              </div>
              <div class="list-group" id="listaCompradoresVenta" style="max-height:200px;overflow-y:auto;"></div>
              <div class="mt-2" id="compradorSeleccionado"></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><i class="bi bi-box"></i> Agregar Producto</div>
            <div class="card-body">
              <div class="mb-2">
                <input class="form-control" id="buscarProductoVenta" placeholder="Buscar producto...">
              </div>
              <div class="list-group" id="listaProductosVenta" style="max-height:200px;overflow-y:auto;"></div>
            </div>
          </div>
        </div>
        <div class="col-md-7 mb-3">
          <div class="card">
            <div class="card-header d-flex justify-content-between">
              <span><i class="bi bi-cart"></i> Carrito de Venta</span>
              <span class="badge bg-gold text-dark" id="carritoCount">0</span>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead><tr><th>Producto</th><th class="text-end">Precio</th><th class="text-end">Cant.</th><th class="text-end">Subtotal</th><th class="text-center"></th></tr></thead>
                  <tbody id="carritoBody">
                    <tr id="carritoVacio"><td colspan="5" class="text-center text-muted py-4">Carrito vacío. Seleccione un comprador y agregue productos.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card-footer">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <small class="text-muted">Items: <span id="totalItems">0</span></small>
                </div>
                <div class="text-end">
                  <div class="total-venta">Total: $<span id="totalCarrito">0.00</span></div>
                  <button class="btn btn-gold btn-lg mt-2" id="btnFinalizarVenta" disabled onclick="finalizarVenta()">
                    <i class="bi bi-check-circle"></i> Finalizar Venta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('buscarCompradorVenta').addEventListener('input', buscarCompradoresVenta);
  document.getElementById('buscarProductoVenta').addEventListener('input', buscarProductosVenta);
  await Promise.all([buscarCompradoresVenta(), buscarProductosVenta()]);
}

let compradorSeleccionadoId = null;

async function buscarCompradoresVenta() {
  const q = document.getElementById('buscarCompradorVenta').value;
  const lista = document.getElementById('listaCompradoresVenta');
  try {
    const data = await api(`/compradores${q ? '?buscar=' + encodeURIComponent(q) : ''}`);
    if (data.length === 0) {
      lista.innerHTML = '<div class="list-group-item text-muted">Sin resultados</div>';
      return;
    }
    lista.innerHTML = data.map(c => `
      <button class="list-group-item list-group-item-action ${compradorSeleccionadoId === c.id ? 'active' : ''}"
              onclick="seleccionarComprador(${c.id}, '${c.nombre.replace(/'/g, "\\'")}')">
        <strong>${c.nombre}</strong><br><small>${c.email || c.telefono || ''}</small>
      </button>`).join('');
  } catch (_) { lista.innerHTML = '<div class="list-group-item text-danger">Error al cargar</div>'; }
}

function seleccionarComprador(id, nombre) {
  compradorSeleccionadoId = id;
  document.getElementById('compradorSeleccionado').innerHTML = `
    <div class="alert alert-success py-2 mb-0">
      <i class="bi bi-check-circle"></i> <strong>${nombre}</strong>
      <button class="btn btn-sm btn-outline-danger float-end" onclick="quitarComprador()">Cambiar</button>
    </div>`;
  document.getElementById('buscarCompradorVenta').value = nombre;
  document.getElementById('listaCompradoresVenta').innerHTML = '';
  actualizarBotonVenta();
}

function quitarComprador() {
  compradorSeleccionadoId = null;
  document.getElementById('compradorSeleccionado').innerHTML = '';
  document.getElementById('buscarCompradorVenta').value = '';
  buscarCompradoresVenta();
  actualizarBotonVenta();
}

async function buscarProductosVenta() {
  const q = document.getElementById('buscarProductoVenta').value;
  const lista = document.getElementById('listaProductosVenta');
  try {
    const data = await api(`/productos${q ? '?buscar=' + encodeURIComponent(q) : ''}`);
    const disponibles = data.filter(p => p.stock > 0);
    if (disponibles.length === 0) {
      lista.innerHTML = '<div class="list-group-item text-muted">Sin productos disponibles</div>';
      return;
    }
    lista.innerHTML = disponibles.map(p => {
      const enCarrito = carrito.find(i => i.producto_id === p.id);
      const maxCarrito = p.stock - (enCarrito ? enCarrito.cantidad : 0);
      return `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div><strong>${p.nombre}</strong><br><small class="text-muted">$${p.precio.toFixed(2)} | Stock: ${p.stock}</small></div>
          ${maxCarrito > 0
            ? `<button class="btn btn-sm btn-gold" onclick="agregarAlCarrito(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio}, ${p.stock})"><i class="bi bi-plus"></i></button>`
            : '<span class="badge bg-secondary">Agotado</span>'}
        </div>`;
    }).join('');
  } catch (_) { lista.innerHTML = '<div class="list-group-item text-danger">Error al cargar</div>'; }
}

function agregarAlCarrito(id, nombre, precio, stock) {
  const existente = carrito.find(i => i.producto_id === id);
  if (existente) {
    if (existente.cantidad >= stock) return alert('Stock máximo alcanzado');
    existente.cantidad++;
    existente.subtotal = existente.cantidad * existente.precio_unitario;
  } else {
    carrito.push({ producto_id: id, producto_nombre: nombre, precio_unitario: precio, cantidad: 1, subtotal: precio });
  }
  renderCarrito();
  buscarProductosVenta();
}

function renderCarrito() {
  const tbody = document.getElementById('carritoBody');
  let total = 0, items = 0;

  if (carrito.length === 0) {
    tbody.innerHTML = '<tr id="carritoVacio"><td colspan="5" class="text-center text-muted py-4">Carrito vacío</td></tr>';
    document.getElementById('carritoCount').textContent = '0';
    document.getElementById('totalCarrito').textContent = '0.00';
    document.getElementById('totalItems').textContent = '0';
    actualizarBotonVenta();
    return;
  }

  tbody.innerHTML = carrito.map((item, idx) => {
    total += item.subtotal;
    items += item.cantidad;
    return `
      <tr>
        <td>${item.producto_nombre}</td>
        <td class="text-end">$${item.precio_unitario.toFixed(2)}</td>
        <td class="text-end" style="width:120px;">
          <div class="input-group input-group-sm">
            <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${idx}, -1)">-</button>
            <input type="number" class="form-control text-center" value="${item.cantidad}" min="1" style="width:50px;" onchange="cambiarCantidadA(${idx}, this.value)">
            <button class="btn btn-outline-secondary" onclick="cambiarCantidad(${idx}, 1)">+</button>
          </div>
        </td>
        <td class="text-end text-gold fw-bold">$${item.subtotal.toFixed(2)}</td>
        <td class="text-center"><button class="btn btn-sm btn-outline-danger" onclick="quitarDelCarrito(${idx})"><i class="bi bi-trash"></i></button></td>
      </tr>`;
  }).join('');

  document.getElementById('carritoCount').textContent = items.toString();
  document.getElementById('totalCarrito').textContent = total.toFixed(2);
  document.getElementById('totalItems').textContent = items.toString();
  actualizarBotonVenta();
}

function cambiarCantidad(idx, delta) {
  const producto = productos.find(p => p.id === carrito[idx].producto_id);
  const nueva = carrito[idx].cantidad + delta;
  if (nueva < 1) return quitarDelCarrito(idx);
  const maxPosible = producto ? producto.stock : 999;
  if (nueva > maxPosible) return alert('Stock insuficiente');
  carrito[idx].cantidad = nueva;
  carrito[idx].subtotal = nueva * carrito[idx].precio_unitario;
  renderCarrito();
  buscarProductosVenta();
}

function cambiarCantidadA(idx, val) {
  const cantidad = parseInt(val) || 1;
  const producto = productos.find(p => p.id === carrito[idx].producto_id);
  const maxPosible = producto ? producto.stock : 999;
  if (cantidad > maxPosible) return alert('Stock insuficiente');
  carrito[idx].cantidad = Math.max(1, Math.min(cantidad, maxPosible));
  carrito[idx].subtotal = carrito[idx].cantidad * carrito[idx].precio_unitario;
  renderCarrito();
  buscarProductosVenta();
}

function quitarDelCarrito(idx) {
  carrito.splice(idx, 1);
  renderCarrito();
  buscarProductosVenta();
}

function actualizarBotonVenta() {
  const btn = document.getElementById('btnFinalizarVenta');
  if (btn) btn.disabled = !(compradorSeleccionadoId && carrito.length > 0);
}

async function finalizarVenta() {
  if (!compradorSeleccionadoId || carrito.length === 0) return;
  const btn = document.getElementById('btnFinalizarVenta');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Procesando...';

  try {
    const venta = await api('/ventas', {
      method: 'POST',
      body: JSON.stringify({
        comprador_id: compradorSeleccionadoId,
        items: carrito.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad }))
      })
    });
    carrito = [];
    compradorSeleccionadoId = null;
    renderCarrito();
    document.getElementById('compradorSeleccionado').innerHTML = '';
    document.getElementById('buscarCompradorVenta').value = '';
    await buscarCompradoresVenta();
    await buscarProductosVenta();

    document.getElementById('detalleVentaId').textContent = venta.id;
    document.getElementById('detalleVentaBody').innerHTML = `
      <div class="alert alert-success"><i class="bi bi-check-circle"></i> Venta registrada exitosamente</div>
      <div class="row mb-3">
        <div class="col"><strong>Comprador:</strong> ${venta.comprador_nombre}</div>
        <div class="col"><strong>Total:</strong> <span class="text-gold fw-bold">$${venta.total.toFixed(2)}</span></div>
        <div class="col"><strong>Fecha:</strong> ${new Date(venta.created_at).toLocaleString('es-ES')}</div>
      </div>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead><tr><th>Producto</th><th class="text-end">Precio</th><th class="text-end">Cant.</th><th class="text-end">Subtotal</th></tr></thead>
          <tbody>
            ${venta.items.map(i => `
              <tr><td>${i.producto_nombre}</td><td class="text-end">$${i.precio_unitario.toFixed(2)}</td><td class="text-end">${i.cantidad}</td><td class="text-end text-gold fw-bold">$${i.subtotal.toFixed(2)}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    modalDetalleVenta.show();
  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle"></i> Finalizar Venta';
    actualizarBotonVenta();
  }
}

document.addEventListener('DOMContentLoaded', () => navegarA('inicio'));
