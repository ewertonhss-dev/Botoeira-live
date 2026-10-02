const DB_NAME = "botoeira-sons-db";
const STORE = "sounds";
const SLOT_COUNT = 50;

const board = document.getElementById("board");
const editor = document.getElementById("editor");
const slotNumber = document.getElementById("slotNumber");
const soundName = document.getElementById("soundName");
const soundFile = document.getElementById("soundFile");
const fileInfo = document.getElementById("fileInfo");
const editorMessage = document.getElementById("editorMessage");
const status = document.getElementById("status");
const statusDot = document.getElementById("statusDot");

let db;
let slots = Array.from({ length: SLOT_COUNT }, (_, i) => ({
  id: i,
  name: `Botão ${i + 1}`,
  fileName: "",
  blob: null
}));
let selected = 0;
let currentAudio = null;
let currentObjectUrl = null;
let playing = -1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getAllSounds() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function putSound(sound) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(sound);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function deleteSound(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function stopAll() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentAudio = null;
  currentObjectUrl = null;
  playing = -1;
  status.textContent = "Pronto para tocar.";
  statusDot.classList.remove("playing");
  render();
}

async function playSlot(i) {
  const s = slots[i];
  if (!s.blob) {
    openEditor(i);
    editorMessage.textContent = "Este botão está vazio. Escolha um arquivo de áudio.";
    return;
  }
  stopAll();
  currentObjectUrl = URL.createObjectURL(s.blob);
  const audio = new Audio(currentObjectUrl);
  currentAudio = audio;
  playing = i;
  status.textContent = `Tocando: ${s.name}`;
  statusDot.classList.add("playing");
  render();

  audio.addEventListener("ended", stopAll, { once: true });
  try {
    await audio.play();
  } catch {
    stopAll();
    status.textContent = "Não foi possível reproduzir este áudio.";
  }
}

function openEditor(i) {
  selected = i;
  const s = slots[i];
  slotNumber.textContent = String(i + 1).padStart(2, "0");
  soundName.value = s.blob ? s.name : "";
  soundFile.value = "";
  fileInfo.textContent = s.fileName ? `Áudio atual: ${s.fileName}` : "Nenhum áudio configurado.";
  editorMessage.textContent = "";
  editor.showModal();
}

function render() {
  board.innerHTML = "";
  slots.forEach((s, i) => {
    const wrap = document.createElement("div");
    wrap.className = "pad-wrap";

    const pad = document.createElement("button");
    pad.type = "button";
    pad.className = `pad${s.blob ? " configured" : ""}${playing === i ? " playing" : ""}`;
    pad.setAttribute("aria-label", s.blob ? `Tocar ${s.name}` : `Configurar botão ${i + 1}`);

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = String(i + 1).padStart(2, "0");

    const symbol = document.createElement("span");
    symbol.className = "symbol";
    symbol.textContent = s.blob ? (playing === i ? "🔊" : "▶") : "＋";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = s.blob ? s.name : "Adicionar";

    pad.append(num, symbol, label);
    pad.addEventListener("click", () => playSlot(i));

    const gear = document.createElement("button");
    gear.type = "button";
    gear.className = "gear";
    gear.textContent = "⚙";
    gear.setAttribute("aria-label", `Editar botão ${i + 1}`);
    gear.addEventListener("click", (event) => {
      event.stopPropagation();
      openEditor(i);
    });

    wrap.append(pad, gear);
    board.appendChild(wrap);
  });
}

document.getElementById("stopAll").addEventListener("click", stopAll);
document.getElementById("closeEditor").addEventListener("click", () => editor.close());

soundFile.addEventListener("change", () => {
  const f = soundFile.files?.[0];
  fileInfo.textContent = f
    ? `Selecionado: ${f.name} • ${(f.size / 1024 / 1024).toFixed(2)} MB`
    : (slots[selected].fileName ? `Áudio atual: ${slots[selected].fileName}` : "Nenhum áudio configurado.");
});

document.getElementById("saveSound").addEventListener("click", async () => {
  const f = soundFile.files?.[0];
  const old = slots[selected];

  if (!f && !old.blob) {
    editorMessage.textContent = "Selecione um arquivo de áudio.";
    return;
  }
  if (f && !f.type.startsWith("audio/")) {
    editorMessage.textContent = "Escolha um arquivo de áudio válido.";
    return;
  }

  const next = {
    id: selected,
    name: (soundName.value.trim() || (f ? f.name.replace(/\.[^.]+$/, "") : old.name)).slice(0, 30),
    fileName: f ? f.name : old.fileName,
    blob: f || old.blob
  };

  try {
    await putSound(next);
    slots[selected] = next;
    fileInfo.textContent = `Áudio atual: ${next.fileName}`;
    editorMessage.textContent = "Salvo neste navegador.";
    render();
  } catch (error) {
    console.error(error);
    editorMessage.textContent = "Não foi possível salvar. O armazenamento do navegador pode estar cheio.";
  }
});

document.getElementById("testSound").addEventListener("click", async () => {
  const f = soundFile.files?.[0];
  if (f) {
    stopAll();
    const url = URL.createObjectURL(f);
    const a = new Audio(url);
    currentAudio = a;
    currentObjectUrl = url;
    status.textContent = `Testando: ${f.name}`;
    statusDot.classList.add("playing");
    a.addEventListener("ended", stopAll, { once: true });
    try { await a.play(); } catch { stopAll(); editorMessage.textContent = "Não foi possível testar este arquivo."; }
  } else if (slots[selected].blob) {
    await playSlot(selected);
  } else {
    editorMessage.textContent = "Selecione um áudio para testar.";
  }
});

document.getElementById("removeSound").addEventListener("click", async () => {
  if (playing === selected) stopAll();
  try {
    await deleteSound(selected);
    slots[selected] = { id: selected, name: `Botão ${selected + 1}`, fileName: "", blob: null };
    soundName.value = "";
    soundFile.value = "";
    fileInfo.textContent = "Nenhum áudio configurado.";
    editorMessage.textContent = "Áudio removido.";
    render();
  } catch (error) {
    console.error(error);
    editorMessage.textContent = "Não foi possível remover este áudio.";
  }
});

editor.addEventListener("click", (event) => {
  const rect = editor.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) editor.close();
});

async function init() {
  render();
  if (!("indexedDB" in window)) {
    status.textContent = "Este navegador não oferece armazenamento IndexedDB.";
    return;
  }
  try {
    db = await openDB();
    const saved = await getAllSounds();
    saved.forEach((item) => {
      if (Number.isInteger(item.id) && item.id >= 0 && item.id < SLOT_COUNT) slots[item.id] = item;
    });
    render();
  } catch (error) {
    console.error(error);
    status.textContent = "Não foi possível abrir o armazenamento local.";
  }
}

init();
