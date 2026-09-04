const KEY="monitoring_work_data_v1";
let data=JSON.parse(localStorage.getItem(KEY)||'{"jobs":[],"activities":[],"dailyMonitoring":{}}');
data.jobs = Array.isArray(data.jobs) ? data.jobs : [];
data.activities = Array.isArray(data.activities) ? data.activities : [];
data.dailyMonitoring = data.dailyMonitoring && typeof data.dailyMonitoring==="object" ? data.dailyMonitoring : {};

let page="home";

function save(){localStorage.setItem(KEY,JSON.stringify(data));}
function todayISO(){return new Date().toISOString().slice(0,10)}
function fmtDate(v){
  if(!v)return"-";
  return new Date(v+"T00:00:00").toLocaleDateString("id-ID",{
    day:"2-digit",month:"long",year:"numeric",weekday:"long"
  })
}
function esc(s){
  return String(s??"").replace(/[&<>"']/g,m=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]))
}

/* =========================================================
   MONITORING HARIAN
   ========================================================= */
function getDailyChecks(date){
  if(!data.dailyMonitoring[date]) data.dailyMonitoring[date]={};
  return data.dailyMonitoring[date];
}

function dailyCompleted(date){
  const checks=getDailyChecks(date);
  return data.jobs.reduce((n,job)=>n+(checks[job]===true?1:0),0);
}

function dailyProgress(date){
  const total=data.jobs.length;
  const done=dailyCompleted(date);
  return total ? Math.round((done/total)*100) : 0;
}

function render(){
  document.querySelectorAll(".nav-item").forEach(b=>
    b.classList.toggle("active",b.dataset.page===page)
  );

  const c=document.getElementById("content");

  if(page==="home") c.innerHTML=home();
  else if(page==="monitoring") c.innerHTML=dailyMonitoring();
  else c.innerHTML=settings();

  bind();
}

function home(){return `
  <div class="menu-grid monitoring-home-grid">

    <button class="menu-card" data-go="jobs">
      <div class="icon">📋</div>
      <h3>1. Daftar Pekerjaan</h3>
      <p>Kelola daftar semua pekerjaan: tambah, simpan, dan hapus.</p>
    </button>

    <button class="menu-card" data-go="activities">
      <div class="icon">📅</div>
      <h3>2. Daftar Kegiatan</h3>
      <p>Catat tanggal, kegiatan, deadline, catatan, dan alarm pengingat.</p>
    </button>

    <button class="menu-card" data-go="checklist">
      <div class="icon">☑️</div>
      <h3>3. Checklist Tugas</h3>
      <p>Checklist kegiatan berdasarkan tanggal yang dipilih.</p>
    </button>

    <button class="menu-card daily-menu-card" data-go="dailyMonitoring">
      <div class="icon">📊</div>
      <h3>4. Monitoring Harian</h3>
      <p>Checklist pekerjaan setiap hari dan pantau progres pekerjaan.</p>
    </button>

  </div>`}

function jobs(){return `
  <div class="section-title">Daftar Pekerjaan</div>

  <div class="card job-form">
    <b>Tambah Pekerjaan</b>
    <p class="small-muted">Masukkan pekerjaan yang ingin dipantau.</p>

    <div class="job-input-row">
      <input id="jobName" type="text"
        placeholder="Contoh: Follow Up Nasabah"
        autocomplete="off">
      <button class="btn green" data-add-job>Tambah</button>
    </div>
  </div>

  <div class="job-heading">
    <b>Daftar Pekerjaan</b>
    <span>${data.jobs.length} pekerjaan</span>
  </div>

  <div id="jobList">
    ${
      data.jobs.length
      ?
      data.jobs.map((j,i)=>`
        <div class="card task job-item">
          <div class="num">${i+1}</div>
          <div class="task-main"><b>${esc(j)}</b></div>
          <button class="icon-btn" data-del-job="${i}" aria-label="Hapus pekerjaan">🗑️</button>
        </div>
      `).join("")
      :
      `<div class="card empty">
        📋<br>
        Belum ada pekerjaan.<br>
        <span class="small-muted">Tambahkan pekerjaan pertama Anda.</span>
      </div>`
    }
  </div>
`}

function activities(){return `
  <div class="section-title">Daftar Kegiatan</div>
  <div class="card">
    <label>Tanggal</label><input id="actDate" type="date" value="${todayISO()}">
    <label>Nama Kegiatan</label><input id="actName" placeholder="Contoh: Meeting Team">
    <label>Deadline</label><input id="actDeadline" type="datetime-local">
    <label>Catatan</label><textarea id="actNote" placeholder="Catatan kegiatan..."></textarea>
    <label>Alarm Pengingat</label><input id="actAlarm" type="datetime-local">
    <div class="btn-row">
      <button class="btn primary" data-save-act>Simpan</button>
      <button class="btn outline" data-go="checklist">Lihat Checklist</button>
    </div>
  </div>

  <div>
    ${
      data.activities.length
      ?
      data.activities
      .slice()
      .sort((a,b)=>(a.date+a.deadline).localeCompare(b.date+b.deadline))
      .map((a,i)=>`
        <div class="card">
          <div class="task">
            <div class="num">📅</div>
            <div class="task-main">
              <b>${esc(a.name)}</b>
              <small>${fmtDate(a.date)} · Deadline ${
                a.deadline
                ? new Date(a.deadline).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
                : "-"
              }</small>
            </div>
            <button class="icon-btn" data-del-act="${i}">🗑️</button>
          </div>
          ${a.note?`<p class="small-muted">${esc(a.note)}</p>`:""}
          ${a.alarm?`<div class="reminder card">🔔 Alarm: ${new Date(a.alarm).toLocaleString("id-ID")}</div>`:""}
        </div>
      `).join("")
      :
      '<div class="card empty">Belum ada kegiatan.</div>'
    }
  </div>
`}

function checklist(){
  const date=document.getElementById("checkDate")?.value||todayISO();
  const list=data.activities.filter(a=>a.date===date);
  const done=list.filter(a=>a.done).length;

  return `
    <div class="section-title">Checklist Tugas</div>

    <div class="card date-card">
      <div>
        <div class="small-muted">Tanggal</div>
        <div class="date-main">${fmtDate(date)}</div>
      </div>
      <input id="checkDate" type="date" value="${date}" style="max-width:170px">
    </div>

    <div class="card summary">
      <div><strong>${done}</strong><span>Selesai</span></div>
      <div><strong>${list.length}</strong><span>Total</span></div>
      <div><strong>${list.length-done}</strong><span>Sisa</span></div>
    </div>

    <div class="card">
      ${
        list.length
        ?
        list.map(a=>`
          <label class="check-row">
            <input type="checkbox"
              data-check="${data.activities.indexOf(a)}"
              ${a.done?"checked":""}>
            <div class="check-info">
              <b>${esc(a.name)}</b>
              <small>Deadline: ${
                a.deadline
                ? new Date(a.deadline).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})
                : "-"
              }</small>
            </div>
          </label>
        `).join("")
        :
        '<div class="empty">Tidak ada kegiatan pada tanggal ini.</div>'
      }
    </div>

    <div class="card reminder">
      🔔 Pengingat alarm diatur dari menu <b>Daftar Kegiatan</b>.
    </div>
  `
}

/* =========================================================
   MENU 4 — MONITORING HARIAN
   Mengambil semua pekerjaan dari Daftar Pekerjaan.
   Status checklist disimpan terpisah berdasarkan tanggal.
   ========================================================= */
function dailyMonitoring(){
  const date=document.getElementById("dailyDate")?.value||todayISO();
  const checks=getDailyChecks(date);
  const done=dailyCompleted(date);
  const total=data.jobs.length;
  const remaining=total-done;
  const progress=dailyProgress(date);

  return `
    <div class="section-title">Monitoring Harian</div>

    <div class="card daily-date-card">
      <div>
        <div class="small-muted">Tanggal Monitoring</div>
        <div class="date-main">${fmtDate(date)}</div>
      </div>
      <input id="dailyDate" type="date" value="${date}" aria-label="Pilih tanggal monitoring">
    </div>

    <div class="card daily-progress-card">
      <div class="daily-progress-top">
        <div>
          <b>Progress Pekerjaan</b>
          <span>${done} dari ${total} pekerjaan selesai</span>
        </div>
        <strong>${progress}%</strong>
      </div>

      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%"></div>
      </div>

      <div class="summary daily-summary">
        <div><strong>${done}</strong><span>Selesai</span></div>
        <div><strong>${total}</strong><span>Total</span></div>
        <div><strong>${remaining}</strong><span>Sisa</span></div>
      </div>
    </div>

    <div class="daily-heading">
      <b>Checklist Pekerjaan Hari Ini</b>
      <span>${total} pekerjaan</span>
    </div>

    <div class="card daily-list-card">
      ${
        total
        ?
        data.jobs.map((job,i)=>`
          <label class="daily-check-row">
            <input type="checkbox"
              data-daily-check="${i}"
              ${checks[job]===true?"checked":""}>
            <span class="daily-check-box">
              ${checks[job]===true?"✓":""}
            </span>
            <span class="daily-check-info">
              <b>${esc(job)}</b>
              <small>${checks[job]===true?"Selesai":"Belum selesai"}</small>
            </span>
          </label>
        `).join("")
        :
        `<div class="empty">
          📋<br>
          Belum ada Daftar Pekerjaan.<br>
          <span class="small-muted">Buat pekerjaan terlebih dahulu di menu Daftar Pekerjaan.</span>
        </div>`
      }
    </div>

    ${
      total
      ?
      `<button class="btn primary daily-save-btn" data-save-daily>
        💾 Simpan Monitoring ${fmtDate(date)}
      </button>`
      :
      ""
    }

    <div class="card reminder daily-note">
      📌 <b>Catatan:</b> Checklist Monitoring Harian tersimpan berdasarkan tanggal.
      Daftar Pekerjaan tetap menjadi daftar utama dan dapat digunakan setiap hari.
    </div>
  `
}

function settings(){return `
  <div class="section-title">Pengaturan</div>
  <div class="card">
    <b>Prototype MONITORING WORK</b>
    <p class="small-muted">Data tersimpan di perangkat melalui localStorage.</p>
    <button class="btn danger" data-reset>Hapus Semua Data</button>
  </div>
`}

function bind(){
  document.querySelectorAll("[data-page]").forEach(b=>{
    b.onclick=()=>{
      page=b.dataset.page;
      render();
    };
  });

  document.querySelectorAll("[data-go]").forEach(b=>{
    b.onclick=()=>{
      const go=b.dataset.go;
      renderSub(go);
    };
  });

  document.querySelectorAll("[data-del-job]").forEach(b=>{
    b.onclick=()=>{
      const index=+b.dataset.delJob;
      const removed=data.jobs[index];

      if(!confirm(`Hapus pekerjaan "${removed}"?`)) return;

      data.jobs.splice(index,1);

      /* Bersihkan pekerjaan tersebut dari seluruh riwayat monitoring. */
      Object.keys(data.dailyMonitoring).forEach(date=>{
        if(data.dailyMonitoring[date]){
          delete data.dailyMonitoring[date][removed];
        }
      });

      save();
      renderSub("jobs");
    };
  });

  document.querySelectorAll("[data-del-act]").forEach(b=>{
    b.onclick=()=>{
      const sorted=data.activities
        .slice()
        .sort((a,b)=>(a.date+a.deadline).localeCompare(b.date+b.deadline));
      const index=+b.dataset.delAct;
      const target=sorted[index];

      const realIndex=data.activities.indexOf(target);
      if(realIndex<0)return;

      if(!confirm(`Hapus kegiatan "${target.name}"?`)) return;

      data.activities.splice(realIndex,1);
      save();
      renderSub("activities");
    };
  });

  document.querySelector("[data-add-job]")?.addEventListener("click",()=>{
    const input=document.getElementById("jobName");
    const name=input?.value.trim();

    if(!name){
      alert("Nama pekerjaan wajib diisi.");
      input?.focus();
      return;
    }

    if(data.jobs.includes(name)){
      alert("Pekerjaan tersebut sudah ada.");
      input?.focus();
      return;
    }

    data.jobs.push(name);
    save();
    renderSub("jobs");
  });

  document.getElementById("jobName")?.addEventListener("keydown",e=>{
    if(e.key==="Enter") document.querySelector("[data-add-job]")?.click();
  });

  document.querySelector("[data-save-act]")?.addEventListener("click",()=>{
    const dateEl=document.getElementById("actDate");
    const nameEl=document.getElementById("actName");
    const deadlineEl=document.getElementById("actDeadline");
    const noteEl=document.getElementById("actNote");
    const alarmEl=document.getElementById("actAlarm");

    const date=dateEl?.value||"";
    const name=nameEl?.value.trim()||"";
    const deadline=deadlineEl?.value||"";
    const note=noteEl?.value.trim()||"";
    const alarm=alarmEl?.value||"";

    if(!date){
      alert("Tanggal kegiatan wajib diisi.");
      return;
    }

    if(!name){
      alert("Nama kegiatan wajib diisi.");
      nameEl?.focus();
      return;
    }

    data.activities.push({
      date:date,
      name:name,
      deadline:deadline,
      note:note,
      alarm:alarm,
      done:false
    });

    save();

    alert("Kegiatan berhasil disimpan.");
    renderSub("activities");
  });

  document.getElementById("checkDate")?.addEventListener("change",renderSubChecklist);

  document.querySelectorAll("[data-check]").forEach(x=>{
    x.onchange=()=>{
      data.activities[+x.dataset.check].done=x.checked;
      save();
      renderSubChecklist();
    };
  });

  document.getElementById("dailyDate")?.addEventListener("change",renderSubDaily);

  document.querySelectorAll("[data-daily-check]").forEach(x=>{
    x.onchange=()=>{
      const date=document.getElementById("dailyDate")?.value||todayISO();
      const job=data.jobs[+x.dataset.dailyCheck];
      if(!job)return;

      const checks=getDailyChecks(date);
      checks[job]=x.checked;
      save();

      renderSubDaily();
    };
  });

  document.querySelector("[data-save-daily]")?.addEventListener("click",()=>{
    const date=document.getElementById("dailyDate")?.value||todayISO();
    save();
    alert(`Monitoring Harian untuk ${fmtDate(date)} berhasil disimpan.`);
    renderSubDaily();
  });

  document.querySelector("[data-reset]")?.addEventListener("click",()=>{
    if(confirm("Hapus semua data?")){
      data={jobs:[],activities:[],dailyMonitoring:{}};
      save();
      page="home";
      render();
    }
  });
}

function openSub(sub){renderSub(sub)}

function renderSub(sub){
  const content=document.getElementById("content");

  if(sub==="jobs") content.innerHTML=jobs();
  else if(sub==="activities") content.innerHTML=activities();
  else if(sub==="checklist") content.innerHTML=checklist();
  else if(sub==="dailyMonitoring") content.innerHTML=dailyMonitoring();

  bind();
}

function renderSubChecklist(){
  document.getElementById("content").innerHTML=checklist();
  bind();
}

function renderSubDaily(){
  document.getElementById("content").innerHTML=dailyMonitoring();
  bind();
}

/* =========================================================
   CSS TAMBAHAN — Menu 4 Monitoring Harian
   Disisipkan dari app.js agar cukup mengganti SATU file.
   ========================================================= */
(function addDailyMonitoringStyles(){
  if(document.getElementById("daily-monitoring-styles"))return;

  const style=document.createElement("style");
  style.id="daily-monitoring-styles";
  style.textContent=`
    /* Home: 4 menu tanpa kartu Selamat Datang */
    .monitoring-home-grid{
      margin-top:0 !important;
      padding-bottom:8px;
    }

    .monitoring-home-grid .menu-card{
      min-height:128px;
    }

    .monitoring-home-grid .daily-menu-card .icon{
      background:#eee8ff;
    }

    /* Halaman Monitoring Harian */
    .daily-date-card{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
    }

    .daily-date-card input{
      width:auto;
      max-width:170px;
      min-width:145px;
    }

    .daily-progress-card{
      padding:17px;
    }

    .daily-progress-top{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }

    .daily-progress-top b{
      display:block;
      color:var(--purple);
      font-size:16px;
    }

    .daily-progress-top span{
      display:block;
      color:#777;
      font-size:11px;
      margin-top:4px;
    }

    .daily-progress-top strong{
      color:var(--green);
      font-size:27px;
      line-height:1;
    }

    .progress-track{
      width:100%;
      height:12px;
      margin:15px 0 14px;
      border-radius:20px;
      background:#eee9f8;
      overflow:hidden;
    }

    .progress-fill{
      height:100%;
      border-radius:20px;
      background:var(--green);
      transition:width .2s ease;
    }

    .daily-summary{
      margin-top:4px;
    }

    .daily-heading{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      color:#fff;
      margin:7px 2px 9px;
    }

    .daily-heading b{
      font-size:16px;
    }

    .daily-heading span{
      font-size:11px;
      opacity:.8;
    }

    .daily-list-card{
      padding:6px 15px;
    }

    .daily-check-row{
      display:flex;
      align-items:center;
      gap:11px;
      padding:13px 0;
      margin:0;
      border-bottom:1px solid #eee;
      cursor:pointer;
    }

    .daily-check-row:last-child{
      border-bottom:0;
    }

    .daily-check-row > input{
      position:absolute;
      opacity:0;
      pointer-events:none;
    }

    .daily-check-box{
      flex:0 0 27px;
      width:27px;
      height:27px;
      border:2px solid #cfc9db;
      border-radius:8px;
      display:grid;
      place-items:center;
      color:#fff;
      background:#fff;
      font-size:18px;
      font-weight:800;
      transition:.15s ease;
    }

    .daily-check-row > input:checked + .daily-check-box{
      background:var(--green);
      border-color:var(--green);
    }

    .daily-check-info{
      flex:1;
      min-width:0;
    }

    .daily-check-info b{
      display:block;
      color:var(--text);
      font-size:14px;
    }

    .daily-check-info small{
      display:block;
      color:#777;
      font-size:11px;
      margin-top:3px;
    }

    .daily-check-row > input:checked ~ .daily-check-info b{
      color:var(--green);
    }

    .daily-check-row > input:checked ~ .daily-check-info small{
      color:var(--green);
    }

    .daily-save-btn{
      width:100%;
      margin:2px 0 12px;
      min-height:45px;
    }

    .daily-note{
      line-height:1.45;
    }

    @media(max-width:380px){
      .daily-date-card{
        align-items:flex-start;
      }

      .daily-date-card input{
        min-width:130px;
      }

      .daily-progress-top strong{
        font-size:24px;
      }

      .daily-check-info b{
        font-size:13px;
      }
    }
  `;

  document.head.appendChild(style);
})();

render();
