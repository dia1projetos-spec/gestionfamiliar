// js/dashboard.js - Versión COMPARTIDA Henrique e Sofia
import { db, auth } from './config.js';
import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let uid = null;
let aportes = [], gastos = [], eventos = [], tareas = [];
let currentDate = new Date();

// ESPACIO COMPARTIDO - todos los admins ven lo mismo
const BASE_PATH = `workspace/henrique-sofia`;

const fmtARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

window.addEventListener('user-logged', (e) => {
  uid = e.detail.uid;
  initListeners();
});

function initListeners() {
  onSnapshot(query(collection(db, `${BASE_PATH}/aportes`), orderBy('fecha','desc')), snap => {
    aportes = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderAportes();
    updateResumen();
  });
  
  onSnapshot(query(collection(db, `${BASE_PATH}/gastos`), orderBy('fecha','desc')), snap => {
    gastos = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderGastos();
    updateResumen();
  });
  
  onSnapshot(collection(db, `${BASE_PATH}/eventos`), snap => {
    eventos = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderCalendario();
  });
  
  onSnapshot(query(collection(db, `${BASE_PATH}/tareas`), orderBy('creado','desc')), snap => {
    tareas = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderTareas();
  });
}

// Aportes
function renderAportes() {
  const tbody = document.querySelector('#tabla-aportes tbody');
  tbody.innerHTML = '';
  aportes.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${a.institucion||''}" data-field="institucion"></td>
      <td><input type="date" value="${a.fecha||''}" data-field="fecha"></td>
      <td><input type="number" step="0.01" value="${a.monto||0}" data-field="monto"></td>
      <td><button class="btn-icon" data-del>✕</button></td>
    `;
    tr.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => updateDoc(doc(db, `${BASE_PATH}/aportes/${a.id}`), {
        [inp.dataset.field]: inp.type==='number'? parseFloat(inp.value)||0 : inp.value
      }));
    });
    tr.querySelector('[data-del]').onclick = () => deleteDoc(doc(db, `${BASE_PATH}/aportes/${a.id}`));
    tbody.appendChild(tr);
  });
}

document.getElementById('add-aporte').onclick = async () => {
  await addDoc(collection(db, `${BASE_PATH}/aportes`), {
    institucion: 'Nueva institución',
    fecha: new Date().toISOString().slice(0,10),
    monto: 0,
    creado: serverTimestamp()
  });
};

// Gastos
function renderGastos() {
  const tbody = document.querySelector('#tabla-gastos tbody');
  tbody.innerHTML = '';
  gastos.forEach(g => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input value="${g.concepto||''}" data-field="concepto"></td>
      <td><input type="date" value="${g.fecha||''}" data-field="fecha"></td>
      <td><input type="number" step="0.01" value="${g.monto||0}" data-field="monto"></td>
      <td><button class="btn-icon" data-del>✕</button></td>
    `;
    tr.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('change', () => updateDoc(doc(db, `${BASE_PATH}/gastos/${g.id}`), {
        [inp.dataset.field]: inp.type==='number'? parseFloat(inp.value)||0 : inp.value
      }));
    });
    tr.querySelector('[data-del]').onclick = () => deleteDoc(doc(db, `${BASE_PATH}/gastos/${g.id}`));
    tbody.appendChild(tr);
  });
}

document.getElementById('add-gasto').onclick = async () => {
  await addDoc(collection(db, `${BASE_PATH}/gastos`), {
    concepto: 'Nuevo gasto',
    fecha: new Date().toISOString().slice(0,10),
    monto: 0,
    creado: serverTimestamp()
  });
};

function updateResumen() {
  const totalA = aportes.reduce((s,a)=>s+(parseFloat(a.monto)||0),0);
  const totalG = gastos.reduce((s,g)=>s+(parseFloat(g.monto)||0),0);
  document.getElementById('total-aportes').textContent = fmtARS.format(totalA);
  document.getElementById('total-gastos').textContent = fmtARS.format(totalG);
  document.getElementById('saldo').textContent = fmtARS.format(totalA - totalG);
}

// Calendario
function renderCalendario() {
  const cal = document.getElementById('calendario');
  const label = document.getElementById('month-label');
  cal.innerHTML = '';
  
  const y = currentDate.getFullYear(), m = currentDate.getMonth();
  label.textContent = new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric'}).format(currentDate);
  
  ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].forEach(d=>{
    const n = document.createElement('div'); n.className='cal-day-name'; n.textContent=d; cal.appendChild(n);
  });
  
  const first = new Date(y,m,1), start = new Date(first); start.setDate(first.getDate()-first.getDay());
  for(let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const iso = d.toISOString().slice(0,10);
    const day = document.createElement('div');
    day.className='cal-day';
    if(d.getMonth()!==m) day.classList.add('other');
    if(iso===new Date().toISOString().slice(0,10)) day.classList.add('today');
    
    const evs = eventos.filter(e=>e.fecha===iso);
    if(evs.length) day.classList.add('has-event');
    
    day.innerHTML = `<div class="cal-day-num">${d.getDate()}</div><div class="cal-events">${evs.map(e=>e.titulo).join(', ')}</div>`;
    day.onclick = () => openDayModal(iso, evs);
    cal.appendChild(day);
  }
}

document.getElementById('prev-month').onclick = ()=>{currentDate.setMonth(currentDate.getMonth()-1);renderCalendario()};
document.getElementById('next-month').onclick = ()=>{currentDate.setMonth(currentDate.getMonth()+1);renderCalendario()};

function openDayModal(fecha, evs) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <h4>Compromisos - ${new Date(fecha+'T00:00').toLocaleDateString('es-AR')}</h4>
    <div id="ev-list"></div>
    <div class="form-row"><label>Título</label><input id="ev-titulo" placeholder="Reunión, pago..."></div>
    <div class="form-row"><label>Nota</label><textarea id="ev-nota" placeholder="Detalles"></textarea></div>
    <div class="modal-actions"><button class="btn-secondary" id="ev-add">Agregar</button></div>
  `;
  const list = body.querySelector('#ev-list');
  evs.forEach(ev=>{
    const div = document.createElement('div'); div.className='tarea'; div.style.marginBottom='8px';
    div.innerHTML = `<span><strong>${ev.titulo}</strong><br><small>${ev.nota||''}</small></span><button data-del>✕</button>`;
    div.querySelector('[data-del]').onclick = async ()=>{ await deleteDoc(doc(db,`${BASE_PATH}/eventos/${ev.id}`)); modal.classList.add('hidden'); };
    list.appendChild(div);
  });
  body.querySelector('#ev-add').onclick = async ()=>{
    const t = body.querySelector('#ev-titulo').value.trim();
    if(!t) return;
    await addDoc(collection(db,`${BASE_PATH}/eventos`),{fecha,titulo:t,nota:body.querySelector('#ev-nota').value,creado:serverTimestamp()});
    modal.classList.add('hidden');
  };
  modal.classList.remove('hidden');
}

// Tareas
function renderTareas() {
  const ul = document.getElementById('lista-tareas');
  ul.innerHTML = '';
  tareas.forEach(t=>{
    const li = document.createElement('li'); li.className='tarea'+(t.completada?' completada':'');
    li.innerHTML = `<input type="checkbox" ${t.completada?'checked':''}><span>${t.texto}</span><button data-del>✕</button>`;
    li.querySelector('input').onchange = e => updateDoc(doc(db,`${BASE_PATH}/tareas/${t.id}`),{completada:e.target.checked});
    li.querySelector('[data-del]').onclick = ()=>deleteDoc(doc(db,`${BASE_PATH}/tareas/${t.id}`));
    ul.appendChild(li);
  });
}

document.getElementById('add-tarea').onclick = () => {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <h4>Nueva tarea</h4>
    <div class="form-row"><input id="t-text" placeholder="Describí la tarea..."></div>
    <div class="modal-actions"><button class="btn-primary" id="t-save">Guardar</button></div>
  `;
  body.querySelector('#t-save').onclick = async ()=>{
    const txt = body.querySelector('#t-text').value.trim();
    if(txt){ await addDoc(collection(db,`${BASE_PATH}/tareas`),{texto:txt,completada:false,creado:serverTimestamp()}); modal.classList.add('hidden'); }
  };
  modal.classList.remove('hidden');
};

document.getElementById('modal-close').onclick = ()=>document.getElementById('modal').classList.add('hidden');
document.getElementById('modal').addEventListener('click', e=>{ if(e.target.id==='modal') e.target.classList.add('hidden') });

// Inicial
renderCalendario();
