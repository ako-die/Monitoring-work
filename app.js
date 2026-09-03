const KEY="monitoring_work_data_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"jobs":[],"activities":[]}');
let page="home";

function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function todayISO(){return new Date().toISOString().slice(0,10)}
function fmtDate(v){if(!v)return"-";return new Date(v+"T00:00:00").toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric",weekday:"long"})}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function render(){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const c=document.getElementById("content");
  if(page==="home") c.innerHTML=home();
  else if(page==="monitoring") c.innerHTML=monitoring();
  else c.innerHTML=settings();
  bind();
}

function home(){return `
  <div class="section-title">MONITORING WORK</div>
  <div class="card"><b>Selamat datang 👋</b><p class="small-muted">Kelola pekerjaan dan kegiatan harian dengan lebih teratur.</p></div>
  <div class="menu-grid">
    <button class="menu-card" data-go="jobs"><div class="icon">📋</div><h3>1. Daftar Pekerjaan</h3><p>Kelola daftar semua pekerjaan: tambah, simpan, dan hapus.</p></button>
    <button class="menu-card" data-go="activities"><div class="icon">📅</div><h3>2. Daftar Kegiatan</h3><p>Catat tanggal, kegiatan, deadline, catatan, dan alarm pengingat.</p></button>
    <button class="menu-card" data-go="checklist"><div class="icon">☑️</div><h3>3. Checklist Tugas</h3><p>Checklist kegiatan berdasarkan tanggal yang dipilih.</p></button>
  </div>`}

function jobs(){return `
  <div class="section-title">Daftar Pekerjaan</div>
  <div id="jobList">${data.jobs.length?data.jobs.map((j,i)=>`<div class="card task"><div class="num">${i+1}</div><div class="task-main"><b>${esc(j)}</b></div><button class="icon-btn" data-del-job="${i}">🗑️</button></div>`).join(""):'<div class="card empty">Belum ada pekerjaan.</div>'}</div>
  <button class="fab" data-add-job>+</button>`}

function activities(){return `
  <div class="section-title">Daftar Kegiatan</div>
  <div class="card">
    <label>Tanggal</label><input id="actDate" type="date" value="${todayISO()}">
    <label>Nama Kegiatan</label><input id="actName" placeholder="Contoh: Meeting Team">
    <label>Deadline</label><input id="actDeadline" type="datetime-local">
    <label>Catatan</label><textarea id="actNote" placeholder="Catatan kegiatan..."></textarea>
    <label>Alarm Pengingat</label><input id="actAlarm" type="datetime-local">
    <div class="btn-row"><button class="btn primary" data-save-act>Simpan</button><button class="btn outline" data-go="checklist">Lihat Checklist</button></div>
  </div>
  <div>${data.activities.length?data.activities.slice().sort((a,b)=>(a.date+a.deadline).localeCompare(b.date+b.deadline)).map((a,i)=>`
    <div class="card"><div class="task"><div class="num">📅</div><div class="task-main"><b>${esc(a.name)}</b><small>${fmtDate(a.date)} · Deadline ${a.deadline?new Date(a.deadline).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}):"-"}</small></div><button class="icon-btn" data-del-act="${i}">🗑️</button></div>${a.note?`<p class="small-muted">${esc(a.note)}</p>`:""}${a.alarm?`<div class="reminder card">🔔 Alarm: ${new Date(a.alarm).toLocaleString("id-ID")}</div>`:""}</div>`).join(""):'<div class="card empty">Belum ada kegiatan.</div>'}</div>`}

function checklist(){const date=document.getElementById("checkDate")?.value||todayISO(); const list=data.activities.filter(a=>a.date===date); const done=list.filter(a=>a.done).length; return `
  <div class="section-title">Checklist Tugas</div>
  <div class="card date-card"><div><div class="small-muted">Tanggal</div><div class="date-main">${fmtDate(date)}</div></div><input id="checkDate" type="date" value="${date}" style="max-width:170px"></div>
  <div class="card summary"><div><strong>${done}</strong><span>Selesai</span></div><div><strong>${list.length}</strong><span>Total</span></div><div><strong>${list.length-done}</strong><span>Sisa</span></div></div>
  <div class="card">${list.length?list.map((a,i)=>`<label class="check-row"><input type="checkbox" data-check="${data.activities.indexOf(a)}" ${a.done?"checked":""}><div class="check-info"><b>${esc(a.name)}</b><small>Deadline: ${a.deadline?new Date(a.deadline).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"}):"-"}</small></div></label>`).join(""):'<div class="empty">Tidak ada kegiatan pada tanggal ini.</div>'}</div>
  <div class="card reminder">🔔 Pengingat alarm diatur dari menu <b>Daftar Kegiatan</b>.</div>`}

function monitoring(){return `<div class="section-title">Monitoring</div><div class="card"><b>Ringkasan Hari Ini</b><div class="summary" style="margin-top:15px"><div><strong>${data.jobs.length}</strong><span>Pekerjaan</span></div><div><strong>${data.activities.filter(a=>a.date===todayISO()).length}</strong><span>Kegiatan</span></div><div><strong>${data.activities.filter(a=>a.date===todayISO()&&a.done).length}</strong><span>Selesai</span></div></div></div>
<div class="menu-grid"><button class="menu-card" data-go="jobs"><h3>Daftar Pekerjaan</h3></button><button class="menu-card" data-go="activities"><h3>Daftar Kegiatan</h3></button><button class="menu-card" data-go="checklist"><h3>Checklist Tugas</h3></button></div>`}

function settings(){return `<div class="section-title">Pengaturan</div><div class="card"><b>Prototype MONITORING WORK</b><p class="small-muted">Data tersimpan di perangkat melalui localStorage.</p><button class="btn danger" data-reset>Hapus Semua Data</button></div>`}

function bind(){
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{page=b.dataset.page;render()});
  document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{page="monitoring"; const go=b.dataset.go; render(); setTimeout(()=>openSub(go),0)});
  document.querySelectorAll("[data-del-job]").forEach(b=>b.onclick=()=>{data.jobs.splice(+b.dataset.delJob,1);save();renderSub("jobs")});
  document.querySelectorAll("[data-del-act]").forEach(b=>b.onclick=()=>{data.activities.splice(+b.dataset.delAct,1);save();renderSub("activities")});
  document.querySelector("[data-add-job]")?.addEventListener("click",()=>{const name=prompt("Nama pekerjaan:");if(name?.trim()){data.jobs.push(name.trim());save();renderSub("jobs")}});
  document.querySelector("[data-save-act]")?.addEventListener("click",()=>{
    const name=document.getElementById("actName").value.trim(); if(!name){alert("Nama kegiatan wajib diisi.");return}
    data.activities.push({date:document.getElementById("actDate").value,name,deadline:document.getElementById("actDeadline").value, note:document.getElementById("actNote").value.trim(), alarm:document.getElementById("actAlarm").value,done:false});
    save(); alert("Kegiatan berhasil disimpan."); renderSub("activities");
  });
  document.getElementById("checkDate")?.addEventListener("change",renderSubChecklist);
  document.querySelectorAll("[data-check]").forEach(x=>x.onchange=()=>{data.activities[+x.dataset.check].done=x.checked;save();renderSubChecklist()});
  document.querySelector("[data-reset]")?.addEventListener("click",()=>{if(confirm("Hapus semua data?")){data={jobs:[],activities:[]};save();render()}});
}
function openSub(sub){renderSub(sub)}
function renderSub(sub){document.getElementById("content").innerHTML=sub==="jobs"?jobs():sub==="activities"?activities():checklist();bind()}
function renderSubChecklist(){document.getElementById("content").innerHTML=checklist();bind()}

render();
