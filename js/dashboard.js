import { db } from './config.js';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const $=s=>document.querySelector(s);
const fmtARS=n=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n||0);
let currentUser=null;
const workspaceId='henrique-sofia';
const col=(name)=>collection(db,'workspace',workspaceId,name);
const userCol=(uid,name)=>collection(db,'users',uid,name);

document.addEventListener('app:ready',async e=>{currentUser=e.detail.user;await migrateIfNeeded();initNav();initDashboard();});

async function migrateIfNeeded(){
  // migra dados antigos de users/{uid} para workspace compartilhado (uma vez)
  try{
    const snap=await getDocs(query(col('aportes')));
    if(snap.empty && currentUser){
      const oldA=await getDocs(userCol(currentUser.uid,'aportes'));
      for(const d of oldA.docs){await addDoc(col('aportes'),{...d.data(),createdAt:serverTimestamp()});}
      const oldG=await getDocs(userCol(currentUser.uid,'gastos'));
      for(const d of oldG.docs){await addDoc(col('gastos'),{...d.data(),createdAt:serverTimestamp()});}
      const oldE=await getDocs(userCol(currentUser.uid,'eventos'));
      for(const d of oldE.docs){await addDoc(col('eventos'),{...d.data(),createdAt:serverTimestamp()});}
      const oldT=await getDocs(userCol(currentUser.uid,'tareas'));
      for(const d of oldT.docs){await addDoc(col('tareas'),{...d.data(),createdAt:serverTimestamp()});}
    }
  }catch(e){console.log('migração',e)}
}

function initNav(){document.querySelectorAll('.nav-btn').forEach(b=>{b.onclick=()=>{document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$('#view-'+b.dataset.view).classList.remove('hidden');}});}

function initDashboard(){
  const aportesTbody=$('#aportes-tbody');const gastosTbody=$('#gastos-tbody');let totalA=0,totalG=0;
  onSnapshot(query(col('aportes'),orderBy('createdAt','desc')),snap=>{aportesTbody.innerHTML='';totalA=0;snap.forEach(d=>{const x=d.data();totalA+=Number(x.monto||0);aportesTbody.appendChild(rowAporte(d.id,x));});updateKPIs();});
  onSnapshot(query(col('gastos'),orderBy('createdAt','desc')),snap=>{gastosTbody.innerHTML='';totalG=0;snap.forEach(d=>{const x=d.data();totalG+=Number(x.monto||0);gastosTbody.appendChild(rowGasto(d.id,x));});updateKPIs();});
  function updateKPIs(){$('#kpi-aportes').textContent=fmtARS(totalA);$('#kpi-gastos').textContent=fmtARS(totalG);$('#kpi-saldo').textContent=fmtARS(totalA-totalG);}
  $('#add-aporte').onclick=()=>openForm('Aporte',async data=>{await addDoc(col('aportes'),{...data,createdAt:serverTimestamp()})});
  $('#add-gasto').onclick=()=>openForm('Gasto',async data=>{await addDoc(col('gastos'),{...data,createdAt:serverTimestamp()})});
  function rowAporte(id,x){const tr=document.createElement('tr');tr.innerHTML=`<td><input type="date" value="${x.fecha||''}"></td><td><input value="${x.desc||''}" placeholder="Descripción"></td><td><input type="number" value="${x.monto||0}"></td><td><button class="btn-icon">🗑️</button></td>`;const [d,desc,m]=tr.querySelectorAll('input');const save=()=>updateDoc(doc(col('aportes'),id),{fecha:d.value,desc:desc.value,monto:Number(m.value||0)});[d,desc,m].forEach(i=>i.onchange=save);tr.querySelector('button').onclick=()=>deleteDoc(doc(col('aportes'),id));return tr;}
  function rowGasto(id,x){const tr=document.createElement('tr');tr.innerHTML=`<td><input type="date" value="${x.fecha||''}"></td><td><input value="${x.desc||''}" placeholder="Descripción"></td><td><input type="number" value="${x.monto||0}"></td><td><button class="btn-icon">🗑️</button></td>`;const [d,desc,m]=tr.querySelectorAll('input');const save=()=>updateDoc(doc(col('gastos'),id),{fecha:d.value,desc:desc.value,monto:Number(m.value||0)});[d,desc,m].forEach(i=>i.onchange=save);tr.querySelector('button').onclick=()=>deleteDoc(doc(col('gastos'),id));return tr;}
  let current=new Date();const grid=$('#cal-grid');const title=$('#cal-title');
  function renderCal(){grid.innerHTML='';const y=current.getFullYear(),m=current.getMonth();title.textContent=new Date(y,m).toLocaleDateString('es-AR',{month:'long',year:'numeric'});['D','L','M','M','J','V','S'].forEach(d=>{const el=document.createElement('div');el.className='cal-day-name';el.textContent=d;grid.appendChild(el)});const first=new Date(y,m,1);const start=(first.getDay()+6)%7;const days=new Date(y,m+1,0).getDate();for(let i=0;i<start;i++)grid.appendChild(blank());for(let d=1;d<=days;d++){const dateStr=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;const cell=document.createElement('div');cell.className='cal-day';cell.innerHTML=`<div class="cal-day-num">${d}</div><div class="cal-events" id="ev-${dateStr}"></div>`;cell.onclick=()=>openEvent(dateStr);grid.appendChild(cell)}onSnapshot(col('eventos'),snap=>{document.querySelectorAll('.cal-events').forEach(e=>e.innerHTML='');document.querySelectorAll('.cal-day').forEach(c=>c.classList.remove('has-event'));snap.forEach(doc=>{const e=doc.data();const el=document.getElementById('ev-'+e.fecha);if(el){el.textContent=(el.textContent?el.textContent+' • ':'')+e.titulo;el.parentElement.classList.add('has-event')}})})}
  function blank(){const b=document.createElement('div');b.className='cal-day other';return b}
  $('#prev-month').onclick=()=>{current.setMonth(current.getMonth()-1);renderCal()};$('#next-month').onclick=()=>{current.setMonth(current.getMonth()+1);renderCal()};renderCal();
  function openEvent(fecha){openForm('Evento '+fecha,async data=>{await addDoc(col('eventos'),{fecha,titulo:data.desc,createdAt:serverTimestamp()})},true)}
  const list=$('#tareas-list');onSnapshot(query(col('tareas'),orderBy('createdAt','desc')),snap=>{list.innerHTML='';snap.forEach(d=>{const t=d.data();const li=document.createElement('li');li.className='tarea'+(t.done?' completada':'');li.innerHTML=`<input type="checkbox" ${t.done?'checked':''}><span>${t.text}</span><button>×</button>`;li.querySelector('input').onchange=()=>updateDoc(doc(col('tareas'),d.id),{done:li.querySelector('input').checked});li.querySelector('button').onclick=()=>deleteDoc(doc(col('tareas'),d.id));list.appendChild(li)})});$('#add-tarea').onclick=()=>openForm('Nueva tarea',async data=>{if(data.desc)await addDoc(col('tareas'),{text:data.desc,done:false,createdAt:serverTimestamp()})},true);
  function openForm(title,onSave,simple=false){$('#modal-body').innerHTML=`<h3>${title}</h3>${simple?'<div class="form-row"><label>Descripción</label><input id="f-desc"></div>':'<div class="form-row"><label>Fecha</label><input id="f-fecha" type="date"></div><div class="form-row"><label>Descripción</label><input id="f-desc"></div><div class="form-row"><label>Monto</label><input id="f-monto" type="number"></div>'}<div class="modal-actions"><button id="m-cancel" class="btn-secondary">Cancelar</button><button id="m-save" class="btn-primary">Guardar</button></div>`;$('#modal').classList.remove('hidden');$('#m-cancel').onclick=close;$('#m-save').onclick=async()=>{const data={fecha:$('#f-fecha')?.value||'',desc:$('#f-desc')?.value||'',monto:Number($('#f-monto')?.value||0)};await onSave(data);close()}}
  function close(){$('#modal').classList.add('hidden')}
  $('#modal-close').onclick=close;
}
