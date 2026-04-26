// ==========================
// ΧΕΙΡΙΣΤΗΡΙΑ
// ==========================
let bpmSlider;
let arrhythmiaCheckbox;
let tachycardiaCheckbox;
let soundCheckbox;
let repairButton;
let fullscreenButton;
let controlsDiv;

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

// ✅ ΝΕΟ: χρονική δειγματοληψία ΗΚΓ
let ecgDt = 20;        // ms ανά δείγμα (~50 Hz)
let lastECGTime = 0;

// ==========================
// AUDIO UNLOCK
// ==========================
function enableAudio() {
  if (!audioEnabled) {
    userStartAudio();
    getAudioContext().resume();
    audioEnabled = true;
  }
}

// ==========================
// FULLSCREEN
// ==========================
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenButton.html("⛶ Έξοδος από πλήρη οθόνη");
  } else {
    fullscreenButton.html("⛶ Πλήρης οθόνη");
  }
});

// ==========================
// SETUP
// ==========================
function setup() {
  let container = select("#main");
  if (!container) container = select("body");

  let cnv = createCanvas(600, 520);
  cnv.parent(container);
  cnv.mousePressed(enableAudio);

  controlsDiv = createDiv();
  controlsDiv.parent(container);
  controlsDiv.attribute("id", "controls");
  controlsDiv.style("display", "flex");
  controlsDiv.style("flex-direction", "column");
  controlsDiv.style("gap", "8px");

  bpmSlider = createSlider(40, 160, 70, 1);
  bpmSlider.parent(controlsDiv);

  arrhythmiaCheckbox = createCheckbox(" Αρρυθμία", false);
  arrhythmiaCheckbox.parent(controlsDiv);

  tachycardiaCheckbox = createCheckbox(" Ταχυκαρδία", false);
  tachycardiaCheckbox.parent(controlsDiv);

  soundCheckbox = createCheckbox(" Ήχος καρδιάς", true);
  soundCheckbox.parent(controlsDiv);

  repairButton = createButton("🔄 Επανόρθωση ρυθμού");
  repairButton.parent(controlsDiv);
  repairButton.attribute("disabled", "");
  repairButton.mousePressed(repair);

  fullscreenButton = createButton("⛶ Πλήρης οθόνη");
  fullscreenButton.parent(controlsDiv);
  fullscreenButton.mousePressed(toggleFullscreen);

  osc = new p5.Oscillator("sine");
  osc.freq(80);
  osc.amp(0);
  osc.start();
}

// ==========================
// DRAW
// ==========================
function draw() {
  background(dangerous ? color(70, 0, 0) : 245);

  arrhythmia = arrhythmiaCheckbox.checked();
  tachycardia = tachycardiaCheckbox.checked();
  soundOn = soundCheckbox.checked();

  bpm = tachycardia ? 150 : bpmSlider.value();
  beatInterval = 60000 / bpm;

  let now = millis();
  let interval =
    arrhythmia ? beatInterval * random(0.65, 1.35) : beatInterval;

  if (now - lastBeatTime > interval) {
    heartScale = 1.3;

    if (lastBeatTime !== 0) {
      lastIntervalMs = now - lastBeatTime;
    }

    lastBeatTime = now;

    if (soundOn && audioEnabled && !dangerous) playBeatSound();
    addECGSpike();
  }

  heartScale = lerp(heartScale, 1, 0.15);

  dangerous =
    arrhythmia &&
    tachycardia &&
    bpm >= 150 &&
    lastIntervalMs > 0 &&
    lastIntervalMs < 420;

  if (dangerous) repairButton.removeAttribute("disabled");
  else repairButton.attribute("disabled", "");

  // ---------- ΚΑΡΔΙΑ ----------
  translate(width / 2, 230);
  scale(heartScale);
  noStroke();

  if (dangerous) fill(120, 0, 0);
  else if (arrhythmia) fill(200 + random(-30, 30), 0, 0);
  else fill(220, 0, 0);

  ellipse(-20, -10, 80, 80);
  ellipse(20, -10, 80, 80);
  triangle(-60, -5, 60, -5, 0, 80);
  resetMatrix();

  // ---------- ΚΕΙΜΕΝΟ ----------
  fill(0);
  textSize(14);
  text(`Καρδιακός ρυθμός: ${bpm} bpm`, 20, 175);
  text(
    `RR διάστημα: ${
      lastIntervalMs > 0 ? Math.round(lastIntervalMs) + " ms" : "-"
    }`,
    20,
    200
  );

  textSize(16);
  if (dangerous) {
    fill("red");
    text("🚨 Ανεπαρκής άντληση αίματος", 20, 235);
  } else if (arrhythmia && tachycardia) {
    fill("orange");
    text("Ταχυκαρδία + Αρρυθμία", 20, 235);
  } else if (arrhythmia) {
    fill("red");
    text("Αρρυθμία", 20, 235);
  } else if (tachycardia) {
    fill("orange");
    text("Ταχυκαρδία", 20, 235);
  } else {
    fill("green");
    text("Φυσιολογικός ρυθμός", 20, 235);
  }

  drawECG();

  if (dangerous) {
    fill(150, 0, 0, 200);
    rect(0, height - 60, width, 60);
    fill(255);
    textSize(18);
    textAlign(CENTER, CENTER);
    text(
      "Η καρδιά ΔΕΝ αντλεί αποτελεσματικά αίμα",
      width / 2,
      height - 30
    );
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
// ΗΧΟΣ
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
  ecg.push(-35);   // κορυφή R
}

function drawECG() {
  let now = millis();

  // ✅ Σταθερό χρονικό βήμα ΗΚΓ
  if (now - lastECGTime >= ecgDt) {
    ecg.push(0);
    lastECGTime = now;
  }

  if (ecg.length > ecgMaxPoints) ecg.shift();

  stroke(0, 180, 0);
  noFill();
  beginShape();
  for (let i = 0; i < ecg.length; i++) {
    let x = map(i, 0, ecgMaxPoints, 0, width);
    let y = ecgY + ecg[i] + (arrhythmia ? random(-4, 4) : 0);
    vertex(x, y);
  }
  endShape();

  stroke(180);
  line(0, ecgY, width, ecgY);
}

