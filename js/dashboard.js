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
  const aportesTbody=$('#aportes-tbody');const gastosTbody=$('#gastos-tbody');let totalA=0,totalG=0;let gastosData=[];let pieChart=null;
  onSnapshot(query(col('aportes'),orderBy('createdAt','desc')),snap=>{aportesTbody.innerHTML='';totalA=0;snap.forEach(d=>{const x=d.data();totalA+=Number(x.monto||0);aportesTbody.appendChild(rowAporte(d.id,x));});updateKPIs();});
  onSnapshot(query(col('gastos'),orderBy('createdAt','desc')),snap=>{gastosTbody.innerHTML='';totalG=0;gastosData=[];snap.forEach(d=>{const x=d.data();totalG+=Number(x.monto||0);gastosData.push(x);gastosTbody.appendChild(rowGasto(d.id,x));});updateKPIs();renderPie();});

  function renderPie(){
    const ctx=document.getElementById('pie-gastos'); if(!ctx) return;
    const groups={};
    gastosData.forEach(g=>{const key=(g.desc||'Otros').trim().toLowerCase();const label=(g.desc||'Otros').trim();if(!groups[key])groups[key]={label: label||'Otros', total:0};groups[key].total+=Number(g.monto||0);});
    const entries=Object.values(groups).sort((a,b)=>b.total-a.total).slice(0,8);
    const labels=entries.map(e=>e.label);
    const values=entries.map(e=>e.total);
    const total=values.reduce((a,b)=>a+b,0);
    const colors=['#3b82f6','#22c55e','#f43f5e','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
    if(pieChart) pieChart.destroy();
    pieChart=new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:colors,borderWidth:0,hoverOffset:8}]},options:{plugins:{legend:{display:false},tooltip:{callbacks:{label:(ctx)=>{const v=ctx.raw||0;const p=total?((v/total)*100).toFixed(1):0;return `${ctx.label}: ${fmtARS(v)} (${p}%)`;}}}},cutout:'62%'}});
    const legend=document.getElementById('pie-legend'); if(legend){legend.innerHTML=entries.map((e,i)=>{const p=total?((e.total/total)*100).toFixed(1):0;return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span><span style="display:inline-block;width:10px;height:10px;background:${colors[i]};border-radius:50%;margin-right:8px"></span>${e.label}</span><span>${fmtARS(e.total)} · ${p}%</span></div>`}).join('')||'<span style="color:var(--muted)">Sin gastos aún</span>';}
  }

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
