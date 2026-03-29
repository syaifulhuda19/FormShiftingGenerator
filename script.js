// ─────────────────────────────────────────
// STATE & VARIABLES
// ─────────────────────────────────────────
let MN = [];
let HR = [];

const S = {
  type: "shift",
  period: "",
  emp: { nama: "", posisi: "", lokasi: "", nik: "", leader: "" },
  defLokasi: "Yogyakarta",
  rows: [],
  sigEmp: null,
  sigLdr: null,
  spl: { hari: "", tgl: "", waktu: "", keperluan: "" },
};

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
async function init() {
  try {
    // Ambil data dari JSON
    const response = await fetch("./data.json");
    const data = await response.json();
    MN = data.months;
    HR = data.days;

    buildPeriodOptions();
    renderHead();
    renderRows();
  } catch (error) {
    console.error(
      "Gagal memuat data.json. Pastikan dijalankan melalui Local Server.",
      error
    );
  }
}

function buildPeriodOptions() {
  const sel = document.getElementById("sel-period");
  const now = new Date();
  const curY = now.getFullYear(),
    curM = now.getMonth() + 1;
  let defY = curY,
    defM = curM;
  if (now.getDate() <= 15) {
    defM--;
    if (defM < 1) {
      defM = 12;
      defY--;
    }
  }

  for (let y = 2025; y <= 2027; y++) {
    for (let m = 1; m <= 12; m++) {
      const eM = m === 12 ? 1 : m + 1;
      const eY = m === 12 ? y + 1 : y;
      const val = `${y}-${String(m).padStart(2, "0")}`;
      const txt = `${MN[m - 1]} ${y}  (16 ${MN[m - 1].slice(0, 3)} – 15 ${MN[
        eM - 1
      ].slice(0, 3)} ${eY})`;
      const opt = new Option(txt, val);
      if (y === defY && m === defM) opt.selected = true;
      sel.appendChild(opt);
    }
  }
  S.period = sel.value;
  buildRows();
}

// ─────────────────────────────────────────
// DATES
// ─────────────────────────────────────────
function parsePeriod(val) {
  const [y, m] = val.split("-").map(Number);
  const eM = m === 12 ? 1 : m + 1;
  const eY = m === 12 ? y + 1 : y;
  return { sY: y, sM: m, eM, eY };
}

function genDates(val) {
  const { sY, sM, eM, eY } = parsePeriod(val);
  const days = [];
  const daysInSM = new Date(sY, sM, 0).getDate();
  for (let d = 16; d <= daysInSM; d++) days.push(new Date(sY, sM - 1, d));
  for (let d = 1; d <= 15; d++) days.push(new Date(eY, eM - 1, d));
  return days;
}

function fmtDisplay(dt) {
  return `${dt.getDate()}/${MN[dt.getMonth()].slice(0, 3)}/${dt.getFullYear()}`;
}

function buildRows() {
  const dates = genDates(S.period);
  const prev = {};
  S.rows.forEach((r) => {
    prev[r.key] = r;
  });
  S.rows = dates.map((dt, i) => {
    const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    const p = prev[key];
    if (S.type === "shift") {
      return p && p.type === "shift"
        ? p
        : { type: "shift", no: i + 1, dt, key, on: false, lokasi: S.defLokasi };
    } else {
      return p && p.type === "lembur"
        ? p
        : {
            type: "lembur",
            no: i + 1,
            dt,
            key,
            on: false,
            lokasi: S.defLokasi,
            jadwal: "",
            mulai: "",
            selesai: "",
            ket: "",
          };
    }
  });
}

// ─────────────────────────────────────────
// TABLE EDITOR
// ─────────────────────────────────────────
function renderHead() {
  const h = document.getElementById("tbl-head");
  if (S.type === "shift") {
    h.innerHTML = `<tr><th class="text-center w-10">Aktif</th><th class="w-6">No</th><th>Tanggal</th><th>Hari</th><th>Lokasi</th></tr>`;
  } else {
    h.innerHTML = `<tr><th class="text-center w-10">Aktif</th><th class="w-6">No</th><th>Tanggal</th><th>Hari</th><th>Lokasi</th><th>Jadwal</th><th>Mulai</th><th>Selesai</th><th>Keterangan</th></tr>`;
  }
}

function renderRows() {
  const tb = document.getElementById("tbl-body");
  tb.innerHTML = "";
  S.rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.id = `tr-${i}`;
    if (r.on) tr.classList.add("is-active");
    tr.innerHTML = buildRowHTML(r, i);
    tb.appendChild(tr);
  });
}

function buildRowHTML(r, i) {
  const dis = r.on ? "" : "disabled";
  const day = HR[r.dt.getDay()];
  const dateTxt = fmtDisplay(r.dt);
  if (r.type === "shift") {
    return `
      <td class="text-center"><div class="tog ${
        r.on ? "on" : ""
      }" onclick="togRow(${i})"></div></td>
      <td class="text-center text-xs text-gray-400">${r.no}</td>
      <td class="text-sm font-500 whitespace-nowrap">${dateTxt}</td>
      <td class="text-xs text-gray-500 whitespace-nowrap">${day}</td>
      <td><input class="row-inp" value="${
        r.lokasi
      }" ${dis} oninput="updRow(${i},'lokasi',this.value)" style="min-width:90px"></td>`;
  } else {
    return `
      <td class="text-center"><div class="tog ${
        r.on ? "on" : ""
      }" onclick="togRow(${i})"></div></td>
      <td class="text-center text-xs text-gray-400">${r.no}</td>
      <td class="text-sm font-500 whitespace-nowrap">${dateTxt}</td>
      <td class="text-xs text-gray-500 whitespace-nowrap">${day}</td>
      <td><input class="row-inp" value="${
        r.lokasi
      }"  ${dis} oninput="updRow(${i},'lokasi',this.value)"  style="min-width:80px"></td>
      <td><input class="row-inp" value="${
        r.jadwal
      }" ${dis} oninput="updRow(${i},'jadwal',this.value)"  style="width:55px" placeholder="S"></td>
      <td><input class="row-inp" value="${
        r.mulai
      }"  ${dis} oninput="updRow(${i},'mulai',this.value)"   style="width:62px" placeholder="15:00"></td>
      <td><input class="row-inp" value="${
        r.selesai
      }"${dis} oninput="updRow(${i},'selesai',this.value)" style="width:62px" placeholder="00:00"></td>
      <td><input class="row-inp" value="${
        r.ket
      }"    ${dis} oninput="updRow(${i},'ket',this.value)"     style="min-width:100px"></td>`;
  }
}

function togRow(i) {
  S.rows[i].on = !S.rows[i].on;
  if (S.rows[i].on && S.type === "shift") S.rows[i].lokasi = S.defLokasi;
  const tr = document.getElementById(`tr-${i}`);
  tr.className = S.rows[i].on ? "is-active" : "";
  tr.innerHTML = buildRowHTML(S.rows[i], i);
  if (S.type === "lembur" && S.rows[i].on) autoSPL(i);
}

function autoSPL(i) {
  const r = S.rows[i];
  if (!document.getElementById("spl-hari").value) {
    document.getElementById("spl-hari").value = HR[r.dt.getDay()];
    S.spl.hari = HR[r.dt.getDay()];
  }
  if (!document.getElementById("spl-tgl").value) {
    const dd = String(r.dt.getDate()).padStart(2, "0");
    const mm = String(r.dt.getMonth() + 1).padStart(2, "0");
    const yy = r.dt.getFullYear();
    document.getElementById("spl-tgl").value = `${dd}/${mm}/${yy}`;
    S.spl.tgl = document.getElementById("spl-tgl").value;
  }
}

function updRow(i, f, v) {
  S.rows[i][f] = v;
}
function applyDefLokasi(v) {
  S.defLokasi = v;
  S.rows.forEach((r, i) => {
    if (r.on) {
      r.lokasi = v;
    }
  });
  renderRows();
}

// ─────────────────────────────────────────
// FORM TYPE & SYNC
// ─────────────────────────────────────────
function setType(t) {
  S.type = t;
  document.getElementById("tab-shift").className =
    "tab-btn" + (t === "shift" ? " active" : "");
  document.getElementById("tab-lembur").className =
    "tab-btn" + (t === "lembur" ? " active" : "");
  document.getElementById("div-def-lokasi").style.display =
    t === "shift" ? "" : "none";
  document.getElementById("div-spl").style.display =
    t === "lembur" ? "" : "none";
  document.getElementById("sec3-title").textContent =
    t === "shift" ? "Jadwal Shift Malam" : "Jadwal Lembur";
  document.getElementById("sec3-hint").textContent =
    t === "shift"
      ? "Toggle hari yang ada shift malam. Lokasi default dari kolom di bawah."
      : "Toggle hari lembur, lalu isi detail per baris. SPL otomatis terisi dari baris pertama aktif.";
  buildRows();
  renderHead();
  renderRows();
}

function onPeriodChange() {
  S.period = document.getElementById("sel-period").value;
  buildRows();
  renderRows();
}

function syncEmp() {
  S.emp.nama = document.getElementById("i-nama").value;
  S.emp.posisi = document.getElementById("i-posisi").value;
  S.emp.lokasi = document.getElementById("i-lokasi").value;
  S.emp.nik = document.getElementById("i-nik").value;
  S.emp.leader = document.getElementById("i-leader").value;
}
function syncSPL() {
  S.spl.hari = document.getElementById("spl-hari").value;
  S.spl.tgl = document.getElementById("spl-tgl").value;
  S.spl.waktu = document.getElementById("spl-waktu").value;
  S.spl.keperluan = document.getElementById("spl-keperluan").value;
}

// ─────────────────────────────────────────
// SIGNATURE
// ─────────────────────────────────────────
function loadSig(who, inp) {
  const f = inp.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = (e) => {
    const d = e.target.result;
    const img = document.getElementById(who === "emp" ? "img-emp" : "img-ldr");
    const ph = document.getElementById(who === "emp" ? "ph-emp" : "ph-ldr");
    const clr = document.getElementById(who === "emp" ? "clr-emp" : "clr-ldr");

    if (who === "emp") S.sigEmp = d;
    else S.sigLdr = d;
    img.src = d;
    img.classList.remove("hidden");
    ph.classList.add("hidden");
    clr.classList.remove("hidden");
  };
  rd.readAsDataURL(f);
}

function clearSig(who) {
  const isEmp = who === "emp";
  if (isEmp) S.sigEmp = null;
  else S.sigLdr = null;
  document.getElementById(isEmp ? "img-emp" : "img-ldr").src = "";
  document
    .getElementById(isEmp ? "img-emp" : "img-ldr")
    .classList.add("hidden");
  document
    .getElementById(isEmp ? "ph-emp" : "ph-ldr")
    .classList.remove("hidden");
  document
    .getElementById(isEmp ? "clr-emp" : "clr-ldr")
    .classList.add("hidden");
  document.getElementById(isEmp ? "fi-emp" : "fi-ldr").value = "";
}

// ─────────────────────────────────────────
// RENDER FORM HTML
// ─────────────────────────────────────────
function periodText() {
  const { sY, sM, eM, eY } = parsePeriod(S.period);
  return `16 ${MN[sM - 1]} ${sY} s/d 15 ${MN[eM - 1]} ${eY}`;
}

function logosSVG() {
  // Pastikan file logoBiznet.png ada di folder yang sama dengan index.html
  const pathDGM = "images/logoDGM.png"; // jika ada
  const pathBiznet = "images/logoBiznet.png";

  return `
    <img src="${pathDGM}" width="64" height="36" style="display:inline-block;vertical-align:middle;margin-right:6px" alt="Logo DGM">
    <img src="${pathBiznet}" width="78" height="36" style="display:inline-block;vertical-align:middle" alt="Logo Biznet">
  `;
}

function buildFormHTML() {
  syncEmp();
  syncSPL();
  const { nama, posisi, lokasi, nik, leader } = S.emp;
  const isShift = S.type === "shift";
  const title = isShift ? "FORM SHIFT MALAM" : "FORM TUNJANGAN KERJA";
  const pt = periodText();

  const bodyRows = S.rows
    .map((r) => {
      if (!r.on) {
        return `<tr><td>${
          r.no
        }</td><td style="text-align:left;white-space:nowrap">${fmtDisplay(
          r.dt
        )}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
      }
      const sigCell = S.sigEmp
        ? `<img src="${S.sigEmp}" style="height:16px;max-width:44px;object-fit:contain;display:inline-block">`
        : "";
      if (isShift) {
        return `<tr><td>${
          r.no
        }</td><td style="text-align:left;white-space:nowrap">${fmtDisplay(
          r.dt
        )}</td><td>${
          r.lokasi
        }</td><td>Malam</td><td>22:00</td><td>07:00</td><td>${sigCell}</td><td></td><td>Shift Malam</td></tr>`;
      } else {
        return `<tr><td>${
          r.no
        }</td><td style="text-align:left;white-space:nowrap">${fmtDisplay(
          r.dt
        )}</td><td>${r.lokasi}</td><td>${r.jadwal}</td><td>${r.mulai}</td><td>${
          r.selesai
        }</td><td>${sigCell}</td><td></td><td>${r.ket}</td></tr>`;
      }
    })
    .join("");

  const empSig = S.sigEmp
    ? `<img src="${S.sigEmp}" style="height:48px;max-width:160px;object-fit:contain;display:block;margin:4px auto">`
    : '<div style="height:48px"></div>';
  const ldrSig = S.sigLdr
    ? `<img src="${S.sigLdr}" style="height:48px;max-width:160px;object-fit:contain;display:block;margin:4px auto">`
    : '<div style="height:48px"></div>';
  const tanggalBuat = S.spl.tgl
    ? `Tanggal : ${S.spl.tgl}`
    : "Tanggal : _______________";
  const lokPrint = lokasi || "Yogyakarta";

  const page1 = `
    <div class="form-doc" style="padding:6mm 6mm 8mm 6mm">
      <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 5px 0">${title}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:5px">
        <tr>
          <td style="vertical-align:top;width:58%">
            <table class="form-info" style="min-width:220px">
              <tr><td style="width:92px">Nama Lengkap</td><td style="width:8px">:</td><td>${
                nama || "_______________"
              }</td></tr>
              <tr><td>Posisi</td><td>:</td><td>${
                posisi || "_______________"
              }</td></tr>
              <tr><td>Lokasi</td><td>:</td><td>${lokPrint}</td></tr>
              <tr><td>NIK Biznet</td><td>:</td><td>${
                nik || "_______________"
              }</td></tr>
            </table>
          </td>
          <td style="text-align:right;vertical-align:middle">${logosSVG()}</td>
        </tr>
      </table>
      <p style="text-align:center;font-size:9pt;margin:0 0 5px 0"><strong>Periode : ${pt}</strong></p>
      <table class="form-tbl">
        <thead>
          <tr><th rowspan="2" style="width:20px">No</th><th rowspan="2" style="width:62px">Tanggal</th><th rowspan="2">Lokasi</th><th rowspan="2">Jadwal<br>Kerja</th><th colspan="2">Jam Lembur</th><th rowspan="2" style="width:52px">Paraf<br>Karyawan</th><th rowspan="2" style="width:52px">Paraf<br>User</th><th rowspan="2">Keterangan Kegiatan Kerja</th></tr>
          <tr><th style="width:36px">Mulai</th><th style="width:36px">Selesai</th></tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      <div style="margin-top:7px;font-size:7.5pt">
        <u>Keterangan :</u>
        ${
          isShift
            ? `<div style="margin-left:10px">1. Harap diisi dengan jelas dan benar untuk kelancaran pembayaran gaji/upah lembur.</div><div style="margin-left:10px">2. Bila lembar absensi ini tidak diisi lengkap, termasuk tugas kerja lembur dan tandatangan superior, lemburan tidak akan diproses.</div>`
            : `<div style="margin-left:10px">1. Harap diisi dengan jelas dan benar untuk kelancaran pembayaran gaji/upah lembur.</div><div style="margin-left:10px">2. Bila lembar absensi ini tidak diisi lengkap, termasuk tugas kerja lembur dan tandatangan superior, lemburan tidak akan diproses.</div>`
        }
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <tr>
          <td style="width:50%;text-align:center;padding:3px;vertical-align:bottom">
            ${
              isShift
                ? "Karyawan yang membuat absensi"
                : "Karyawan yang membuat absensi,"
            }
            ${empSig}
            <div style="font-size:8.5pt">(${nama || "_______________"})</div>
            ${!isShift ? `<div style="font-size:8pt">${tanggalBuat}</div>` : ""}
          </td>
          <td style="width:50%;text-align:center;padding:3px;vertical-align:bottom">
            ${isShift ? "Mengetahui Atasan" : "Mengetahui atasan,"}
            ${ldrSig}
            <div style="font-size:8.5pt">(${leader || "_______________"})</div>
            ${!isShift ? `<div style="font-size:8pt">${tanggalBuat}</div>` : ""}
          </td>
        </tr>
      </table>
    </div>`;

  if (isShift) return page1;

  const splLokasi = lokPrint;
  const splDate = S.spl.tgl || "__ / __ / ____";
  const splHari = S.spl.hari || "___________";
  const splWaktu = S.spl.waktu || "___:___ s/d ___:___";
  const splKep = S.spl.keperluan || "_______________";

  const page2 = `
    <div class="form-doc pg-break" style="padding:15mm 18mm">
      <p style="text-align:center;font-weight:bold;font-size:12pt;margin:0 0 22px 0">Surat Perintah Lembur</p>
      <p style="margin:0 0 14px 0;font-size:9pt">Dengan ini menginstruksikan kepada :</p>
      <table style="border-collapse:collapse;margin-left:18px;margin-bottom:18px;font-size:9pt">
        <tr><td style="width:130px;padding:3px 0">Nama</td><td style="padding:3px 5px">:</td><td style="padding:3px 0">${
          nama || "_______________"
        }</td></tr>
        <tr><td style="padding:3px 0">Jabatan</td><td style="padding:3px 5px">:</td><td style="padding:3px 0">${
          posisi ? posisi + " " + splLokasi : "_______________"
        }</td></tr>
        <tr><td style="padding:3px 0">Hari / Tanggal</td><td style="padding:3px 5px">:</td><td style="padding:3px 0">${splHari} / ${splDate}</td></tr>
        <tr><td style="padding:3px 0">Waktu</td><td style="padding:3px 5px">:</td><td style="padding:3px 0">${splWaktu}</td></tr>
        <tr><td style="padding:3px 0">Keperluan Lembur</td><td style="padding:3px 5px">:</td><td style="padding:3px 0">${splKep}</td></tr>
      </table>
      <p style="font-size:9pt;margin:0 0 30px 0">Demikian Surat Perintah Lembur (SPL) ini dibuat untuk dijalankan dengan baik.</p>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="width:50%"></td>
          <td style="width:50%;text-align:center;padding:3px;vertical-align:top">
            <div style="font-size:9pt">${splLokasi}, ${splDate}</div>
            <div style="font-size:9pt;margin-top:2px">Mengetahui / Menyetujui</div>
            ${ldrSig}
            <div style="font-size:9pt">${leader || "_______________"}</div>
            <div style="font-size:8.5pt">Home Care Leader</div>
          </td>
        </tr>
      </table>
      <div style="margin-top:35px;font-size:8pt"><u>Keterangan :</u><div style="margin-left:10px">1. Pastikan Minimal Jam Lembur karyawan dan jam mulai lemburnya.</div></div>
    </div>`;

  return page1 + page2;
}

// ─────────────────────────────────────────
// MODAL / PRINT / EVENT LISTENERS
// ─────────────────────────────────────────
function openPreview() {
  document.getElementById(
    "modal-body"
  ).innerHTML = `<div style="background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">${buildFormHTML()}</div>`;
  document.getElementById("modal").classList.add("open");
}
function closeModal() {
  document.getElementById("modal").classList.remove("open");
}
function exportPDF() {
  const pa = document.getElementById("print-area");
  pa.innerHTML = buildFormHTML();
  pa.style.display = "block";
  closeModal();
  setTimeout(() => {
    window.print();
    setTimeout(() => {
      pa.style.display = "none";
    }, 800);
  }, 150);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// RUN INIT
init();
