// -----------------------------
// Mapping Zones
// -----------------------------
const ZONE_MAP = {
    "ABC": "G1",
    "D": "G2",
    "EF": "G3"
};

// -----------------------------
// Mapping Water Level to Folder
// -----------------------------
const WATER_LEVEL_MAP = {
    "ผิวดิน": "WET",
    "ไม่มีพิจารณาระดับน้ำ": "DRY",
    "ลดลงอย่างรวดเร็ว": "RAPID"
};

// -----------------------------
// Soil Parameter Table
// -----------------------------
const SOIL_TABLE = {
    "ABC": {
        soft: { gamma: 20, su: 25, E: 10000, c: 0, phi: 21, nu: 0.2, void: 1.4, Ko: 1, Kx: 8.64e-7, Ky: 8.64e-7 },
        stiff: { gamma: 18.9, su: 30, E: 30000, c: 0, phi: 22, nu: 0.2, void: 1.3, Ko: 0.7, Kx: 8.64e-6, Ky: 8.64e-6 },
        sand: { gamma: 20, su: 0, E: 80000, c: 16.4, phi: 32.82, nu: 0.2, void: 0.7, Ko: 0.5, Kx: 8.64e-2, Ky: 8.64e-2 }
    },
    "D": {
        soft: { gamma: 16.2, su: 16, E: 8000, c: 0, phi: 21, nu: 0.2, void: 1.776, Ko: 1, Kx: 8.64e-7, Ky: 8.64e-7 },
        stiff: { gamma: 16.8, su: 30, E: 25000, c: 0, phi: 22, nu: 0.2, void: 1.345, Ko: 0.7, Kx: 8.64e-6, Ky: 8.64e-6 },
        sand: { gamma: 20, su: 0, E: 80000, c: 16.4, phi: 32.14, nu: 0.2, void: 0.7, Ko: 0.5, Kx: 8.64e-2, Ky: 8.64e-2 }
    },
    "EF": {
        soft: { gamma: 15, su: 11, E: 6000, c: 0, phi: 21, nu: 0.2, void: 2.525, Ko: 1, Kx: 8.64e-7, Ky: 8.64e-7 },
        stiff: { gamma: 16, su: 25, E: 20000, c: 0, phi: 22, nu: 0.2, void: 2.065, Ko: 0.7, Kx: 8.64e-6, Ky: 8.64e-6 },
        sand: { gamma: 20, su: 0, E: 80000, c: 16.4, phi: 32.14, nu: 0.2, void: 0.7, Ko: 0.5, Kx: 8.64e-2, Ky: 8.64e-2 }
    }
};

let FS_DATA = null;
const el = id => document.getElementById(id);

// -----------------------------
// Convert scientific number to "8.64 × 10⁻7"
// -----------------------------
function formatPower(val) {
    if (val === null || val === undefined || val === "-" || val === "") return "-";

    let num = Number(val);
    if (isNaN(num)) return val;

    // แปลงเป็น e notation เช่น "8.64e-7"
    let exp = num.toExponential(2); // 2 ตำแหน่งนัยสำคัญ
    let parts = exp.split("e");
    let base = parts[0];
    let power = Number(parts[1]);

    // superscript map
    const sup = {
        "-": "⁻",
        "0": "⁰",
        "1": "¹",
        "2": "²",
        "3": "³",
        "4": "⁴",
        "5": "⁵",
        "6": "⁶",
        "7": "⁷",
        "8": "⁸",
        "9": "⁹"
    };

    let powerStr = [...power.toString()].map(c => sup[c] || c).join("");

    return `${base} × 10${powerStr}`;
}

// -----------------------------
// Format (FS: 3 decimals, X: 1 decimal)
// -----------------------------
const formatFS = (value, digits = 1) => {
    if (!value || value === "N/A") return digits === 3 ? "0.000" : "0.0";
    const n = parseFloat(value);
    return isNaN(n) ? (digits === 3 ? "0.000" : "0.0") : n.toFixed(digits);
};

// -----------------------------
// Input check
// -----------------------------
function checkInputs() {
    return (
        el("zone").value &&
        el("depth").value &&
        el("theta").value &&
        el("water_level").value
    );
}

// -----------------------------
// Reset Screen
// -----------------------------
function resetDisplay() {
    el("fsBox").textContent = "0.000";
    el("dispBox").textContent = "0.0 m";

    el("imgContainer").innerHTML =
        `<div style="text-align:center;color:#999;padding:20px;font-size:18px;">
            กรุณาเลือกข้อมูลให้ครบทั้ง 4 ส่วน
        </div>`;

    loadZone("");
    el("zoneHeader").textContent = "ZONE";
}

// -----------------------------
// Fill soil params
// -----------------------------
function fillParams(prefix, data) {
    const v = k => data ? (data[k] ?? "-") : "-";

    el(prefix + "_gamma_val").textContent = v("gamma");
    el(prefix + "_su_val").textContent = v("su");
    el(prefix + "_c_val").textContent = v("c");
    el(prefix + "_phi_val").textContent = v("phi");
    el(prefix + "_nu_val").textContent = v("nu");
    el(prefix + "_e_val").textContent = v("E");
    el(prefix + "_void_val").textContent = v("void");
    el(prefix + "_ko_val").textContent = v("Ko");

    // Kx / Ky แสดงเป็น 8.64 × 10⁻⁷
    el(prefix + "_kx_val").textContent = formatPower(v("Kx"));
    el(prefix + "_ky_val").textContent = formatPower(v("Ky"));
}

// -----------------------------
// Load soil table
// -----------------------------
function loadZone(zone) {
    const d = SOIL_TABLE[zone];

    fillParams("p1", d?.soft);
    fillParams("p2", d?.stiff);
    fillParams("p3", d?.sand);

    el("zoneHeader").textContent = zone ? `Zone ${zone}` : "ZONE";
}

// -----------------------------
// Compute FS
// -----------------------------
function computeFS() {
    if (!FS_DATA) return;

    const zone = el("zone").value;
    const depth = el("depth").value;
    const theta = el("theta").value;
    const wl = el("water_level").value;

    const prefix = ZONE_MAP[zone];
    const caseType = WATER_LEVEL_MAP[wl];

    const normalizeDeg = (d) => d.toString().replace("°", "").trim();

    const found = FS_DATA.find(x =>
        x.Zone === prefix &&
        x["Depth (m)"] == depth &&
        x["Case"] === caseType &&
        normalizeDeg(x["Degree (°)"]) === normalizeDeg(theta)
    );

    if (!found) {
        el("fsBox").textContent = "0.000";
        el("dispBox").textContent = "0.0 m";
        return;
    }

    // F.S. → 3 decimals
    el("fsBox").textContent = formatFS(found["F.S."], 3);

    // X (m) → 1 decimal
    el("dispBox").textContent = found["X (m)"]
        ? formatFS(found["X (m)"], 1) + " m"
        : "0.0 m";
}

// -----------------------------
// Show Image
// -----------------------------
function showImage() {
    const zone = el("zone").value;
    const depth = el("depth").value;
    const theta = el("theta").value;
    const wl = el("water_level").value;

    if (!zone || !depth || !theta || !wl) {
        el("imgContainer").innerHTML = "";
        return;
    }

    const prefix = ZONE_MAP[zone];    // G1 / G2 / G3
    const water = WATER_LEVEL_MAP[wl]; // DRY / WET / RAPID

    const folder = `PTT_PICTURE/${prefix}/${prefix}_${water}_ADDEDFailureline`;
    const file = `${prefix}_${water}_${theta}_${depth}m.png`;
    const fullPath = `${folder}/${file}`;

    const container = el("imgContainer");
    container.innerHTML = "";

    const img = document.createElement("img");
    img.src = fullPath;
    img.style.maxWidth = "100%";
    img.style.maxHeight = "380px";

    img.onerror = () => {
        container.innerHTML =
            `<div style="color:red; text-align:center; padding:20px; font-size:18px;">
                The Structure seems to be Collapse
            </div>`;
    };

    container.appendChild(img);
}

// -----------------------------
// Handle input changes
// -----------------------------
function handleInputChange() {
    if (checkInputs()) {
        loadZone(el("zone").value);
        computeFS();
        showImage();
    } else {
        resetDisplay();
    }
}

// -----------------------------
// Load JSON
// -----------------------------
fetch("PTT_EXCEL/PTT_FS.json")
    .then(res => res.json())
    .then(data => {
        FS_DATA = data;
        console.log("JSON Loaded", data);
    })
    .catch(err => console.error("JSON Load Error:", err));

// -----------------------------
// Toggle param table
// -----------------------------
document.getElementById("toggleParamTable").addEventListener("change", function () {
    el("paramBody").style.display = this.checked ? "block" : "none";
});

// -----------------------------
// Initialize
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    ["zone", "depth", "theta", "water_level"].forEach(id =>
        el(id).addEventListener("change", handleInputChange)
    );

    resetDisplay();
});
