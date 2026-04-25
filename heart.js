// ==========================
// ΧΕΙΡΙΣΤΗΡΙΑ
// ==========================
let bpmSlider;
let arrhythmiaCheckbox;
let tachycardiaCheckbox;
let soundCheckbox;
let repairButton;

// ==========================
// ΚΑΡΔΙΑ
// ==========================
let bpm = 70;
let beatInterval;
let lastBeatTime = 0;
let lastIntervalMs = 0;
let heartScale = 1;

let arrhythmia = false;
let tachycardia = false;
let soundOn = true;
let dangerous = false;

// ==========================
// ΗΧΟΣ
// ==========================
let osc;
let audioEnabled = false;

// ==========================
// ΗΚΓ
// ==========================
let ecg = [];
let ecgMaxPoints = 360;
let ecgY = 360;

// ==========================
// ΕΝΕΡΓΟΠΟΙΗΣΗ ΗΧΟΥ (ΜΟΝΟ ΜΕ ΚΛΙΚ)
// ==========================
function enableAudio() {
  if (!audioEnabled) {
    userStartAudio();
    let ctx = getAudioContext();
    if (ctx.state !== "running") ctx.resume();
    audioEnabled = true;
    console.log("✅ Audio unlocked");
  }
}

function setup() {
  // ✅ canvas με ρητό user gesture
  let cnv = createCanvas(600, 520);
  cnv.parent(document.querySelector("main"));
  cnv.mousePressed(enableAudio);

  bpmSlider = createSlider(40, 160, 70, 1);
  bpmSlider.position(20, 20);
  bpmSlider.style("width", "170px");

  arrhythmiaCheckbox = createCheckbox(" Αρρυθμία", false);
  arrhythmiaCheckbox.position(20, 55);

  tachycardiaCheckbox = createCheckbox(" Ταχυκαρδία", false);
  tachycardiaCheckbox.position(20, 80);

  soundCheckbox = createCheckbox(" Ήχος καρδιάς", true);
  soundCheckbox.position(20, 105);

  repairButton = createButton("🔄 Επανόρθωση ρυθμού");
  repairButton.position(20, 135);
  repairButton.mousePressed(repair);
  repairButton.attribute("disabled", "");

  osc = new p5.Oscillator("sine");
  osc.freq(80);
  osc.amp(0);
  osc.start();
}

function draw() {
  background(dangerous ? color(70, 0, 0) : 245);

  arrhythmia = arrhythmiaCheckbox.checked();
  tachycardia = tachycardiaCheckbox.checked();
  soundOn = soundCheckbox.checked();

  bpm = tachycardia ? 150 : bpmSlider.value();
  beatInterval = 60000 / bpm;

  let now = millis();
  let interval = arrhythmia
    ? beatInterval * random(0.65, 1.35)
    : beatInterval;

  // -------- ΠΑΛΜΟΣ --------
  if (now - lastBeatTime > interval) {
    heartScale = 1.3;

    if (lastBeatTime !== 0) {
      lastIntervalMs = now - lastBeatTime;
    }

    lastBeatTime = now;

    if (soundOn && audioEnabled && !dangerous) {
      playBeatSound();
    }

    addECGSpike();
  }

  heartScale = lerp(heartScale, 1, 0.15);

  // -------- ΕΠΙΚΙΝΔΥΝΟΤΗΤΑ --------
  dangerous =
    arrhythmia &&
    tachycardia &&
    bpm >= 150 &&
    lastIntervalMs > 0 &&
    lastIntervalMs < 420;

  // κουμπί επανόρθωσης μόνο σε danger
  if (dangerous) repairButton.removeAttribute("disabled");
  else repairButton.attribute("disabled", "");

  // -------- ΚΑΡΔΙΑ --------
  translate(width / 2, 230);
  scale(heartScale);
  noStroke();

  if (dangerous) fill(120, 0, 0);
  else if (arrhythmia) fill(200 + random(-30, 30), 0, 0);
  else fill(220, 0, 0);

  ellipse(-20, 0, 80, 80);
  ellipse(20, 0, 80, 80);
  triangle(-60, 0, 60, 0, 0, 80);
  resetMatrix();

  // -------- ΠΛΗΡΟΦΟΡΙΕΣ --------
  fill(0);
  textSize(14);
  text(`Καρδιακός ρυθμός: ${bpm} bpm`, 20, 175);
  text(
    `RR διάστημα: ${lastIntervalMs > 0 ? Math.round(lastIntervalMs) + " ms" : "-"}`,
    20,
    200
  );

  textSize(16);
  if (dangerous) fill("red"), text("🚨 Ανεπαρκής άντληση αίματος", 20, 235);
  else if (arrhythmia && tachycardia) fill("orange"), text("Ταχυκαρδία + Αρρυθμία", 20, 235);
  else if (arrhythmia) fill("red"), text("Αρρυθμία", 20, 235);
  else if (tachycardia) fill("orange"), text("Ταχυκαρδία", 20, 235);
  else fill("green"), text("Φυσιολογικός ρυθμός", 20, 235);

  drawECG();

  if (dangerous) {
    fill(150, 0, 0, 200);
    rect(0, height - 60, width, 60);
    fill(255);
    textSize(18);
    textAlign(CENTER, CENTER);
    text("Η καρδιά ΔΕΝ αντλεί αποτελεσματικά αίμα", width / 2, height - 30);
    textAlign(LEFT, BASELINE);
  }
}

// ==========================
// ΕΠΑΝΟΡΘΩΣΗ
// ==========================
function repair() {
  enableAudio();
  if (!dangerous) return;

  arrhythmiaCheckbox.checked(false);
  tachycardiaCheckbox.checked(false);
  bpmSlider.value(70);

  dangerous = false;
  lastIntervalMs = 0;
  lastBeatTime = millis();
  ecg = [];
}

// ==========================
// ΗΧΟΣ ΚΑΡΔΙΑΣ
// ==========================
function playBeatSound() {
  osc.freq(80);
  osc.amp(0.4, 0.01);
  setTimeout(() => osc.freq(55), 70);
  setTimeout(() => osc.amp(0, 0.1), 150);
}

// ==========================
// ΗΚΓ
// ==========================
function addECGSpike() {
  ecg.push(-35);
}

function drawECG() {
  ecg.push(0);
  if (ecg.length > ecgMaxPoints) ecg.shift();

  stroke(0, 180, 0);
  noFill();
  beginShape();

