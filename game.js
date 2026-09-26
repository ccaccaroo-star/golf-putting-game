"use strict";

const canvas = document.getElementById("course");
const ctx = canvas.getContext("2d");
const ui = Object.fromEntries(["direction", "directionValue", "power", "powerValue", "putt", "reset", "strokes", "distance", "status", "success", "successTitle", "successText", "playAgain"].map(id => [id, document.getElementById(id)]));
const W = 900, H = 640;
const start = { x: 245, y: 462 };
const hole = { x: 650, y: 216, radius: 13 };
const ball = { x: start.x, y: start.y, vx: 0, vy: 0 };
const friction = 105;
let strokes = 0, moving = false, won = false, lastTime = 0, sink = 0;
let trail = [];

function angle() { return Number(ui.direction.value) * Math.PI / 180; }
function syncControls() {
  ui.directionValue.textContent = `${ui.direction.value}°`;
  ui.powerValue.innerHTML = `${ui.power.value}<span>%</span>`;
  for (const input of [ui.direction, ui.power]) {
    input.style.setProperty("--fill", `${(input.value - input.min) / (input.max - input.min) * 100}%`);
  }
}
function updateDistance() {
  ui.distance.textContent = (Math.hypot(hole.x - ball.x, hole.y - ball.y) / 35).toFixed(1);
}
function aimAt(x, y) {
  if (moving || won) return;
  ui.direction.value = Math.round(Math.atan2(y - ball.y, x - ball.x) * 180 / Math.PI);
  syncControls();
}
function reset() {
  Object.assign(ball, { ...start, vx: 0, vy: 0 });
  strokes = 0; moving = false; won = false; sink = 0; trail = [];
  ui.strokes.textContent = "00";
  ui.success.hidden = true;
  ui.putt.disabled = ui.direction.disabled = ui.power.disabled = false;
  ui.putt.innerHTML = 'PUTT <span>↗</span>';
  ui.power.value = 55;
  aimAt(hole.x, hole.y);
  ui.status.textContent = "첫 퍼팅을 준비해 주세요.";
  updateDistance();
}
function putt() {
  if (moving || won) return;
  const speed = Number(ui.power.value) * 5;
  ball.vx = Math.cos(angle()) * speed;
  ball.vy = Math.sin(angle()) * speed;
  moving = true; strokes++; trail = [];
  ui.strokes.textContent = String(strokes).padStart(2, "0");
  ui.putt.disabled = ui.direction.disabled = ui.power.disabled = true;
  ui.putt.textContent = "ROLLING…";
  ui.status.textContent = "공이 굴러가는 중이에요…";
}
function holeIn() {
  won = true; moving = false; ball.vx = ball.vy = 0;
  ball.x = hole.x; ball.y = hole.y;
  ui.distance.textContent = "0.0";
  ui.status.textContent = `${strokes}타 만에 홀인!`;
  ui.successTitle.textContent = strokes === 1 ? "홀인원!" : strokes === 2 ? "나이스 파!" : "나이스 퍼팅!";
  ui.successText.textContent = `${strokes}타 만에 성공했어요. 멋진 마무리예요.`;
  ui.putt.textContent = "HOLED!";
}
function physics(dt) {
  if (!moving) return;
  // Small steps keep cup detection reliable even on a slow frame.
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const step = dt / steps;
  for (let i = 0; i < steps && moving; i++) {
    const speed = Math.hypot(ball.vx, ball.vy);
    const next = Math.max(0, speed - friction * step);
    const ratio = speed ? next / speed : 0;
    ball.x += ball.vx * step; ball.y += ball.vy * step;
    ball.vx *= ratio; ball.vy *= ratio;
    // Soft course-edge rebounds keep every shot playable.
    if (ball.x < 70 || ball.x > 830) { ball.x = Math.max(70, Math.min(830, ball.x)); ball.vx *= -.65; }
    if (ball.y < 82 || ball.y > 558) { ball.y = Math.max(82, Math.min(558, ball.y)); ball.vy *= -.65; }
    if (Math.hypot(ball.x - hole.x, ball.y - hole.y) < hole.radius + 3 && next < 180) { holeIn(); break; }
    if (next < 1) {
      moving = false; ball.vx = ball.vy = 0;
      ui.putt.disabled = ui.direction.disabled = ui.power.disabled = false;
      ui.putt.innerHTML = 'PUTT <span>↗</span>';
      ui.status.textContent = "조금 더 가까이! 다음 퍼팅을 준비하세요.";
      aimAt(hole.x, hole.y);
    }
  }
  trail.push({ x: ball.x, y: ball.y });
  if (trail.length > 18) trail.shift();
  updateDistance();
}
function ellipse(x, y, rx, ry, color) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#47704b"; ctx.fillRect(0, 0, W, H);
  // Alternating mown bands and soft landscaping, all drawn locally.
  for (let i = -8; i < 18; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff04" : "#102e1607";
    ctx.beginPath(); ctx.moveTo(i * 92, 0); ctx.lineTo(i * 92 + 92, 0); ctx.lineTo(i * 92 + 410, H); ctx.lineTo(i * 92 + 318, H); ctx.fill();
  }
  ellipse(440, 338, 388, 246, "#2e543630");
  ellipse(450, 319, 389, 248, "#729257");
  ellipse(450, 315, 374, 233, "#a3b878");
  ctx.save(); ctx.beginPath(); ctx.ellipse(450, 315, 374, 233, 0, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? "#ffffff08" : "#486e3407"; ctx.fillRect(i * 85, 0, 85, H); }
  for (let i = 0; i < 650; i++) {
    const x = (i * 137.51) % W, y = (i * 79.31) % H;
    ctx.fillStyle = "#35592712"; ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.strokeStyle = "#e9efbd25"; ctx.lineWidth = 1.5;
  for (const r of [185, 215]) { ctx.beginPath(); ctx.ellipse(470, 311, r * 1.5, r, -.15, .2, 4.9); ctx.stroke(); }
  ctx.restore();
  for (const [x,y,r] of [[22,160,42],[49,197,29],[865,482,41],[896,440,34],[131,584,28],[787,58,35]]) {
    ellipse(x+4,y+8,r,r*.75,"#254e3538"); ellipse(x,y,r,r*.8,"#365d40"); ellipse(x-6,y-8,r*.7,r*.52,"#527c4d");
  }
  ellipse(hole.x + 20, hole.y + 7, 35, 7, "#35502922");
  ellipse(hole.x, hole.y + 2, 17, 12, "#77904f");
  ellipse(hole.x, hole.y, 13, 10, "#1c352b");
  ellipse(hole.x, hole.y + 3, 9, 5, "#0f241e");
  ctx.strokeStyle = "#fffbe4"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hole.x, hole.y - 3); ctx.lineTo(hole.x, hole.y - 88); ctx.stroke();
  ctx.fillStyle = "#f4d88a"; ctx.beginPath(); ctx.moveTo(hole.x+1,hole.y-88); ctx.quadraticCurveTo(hole.x+23,hole.y-98,hole.x+43,hole.y-80); ctx.lineTo(hole.x+43,hole.y-54); ctx.quadraticCurveTo(hole.x+21,hole.y-72,hole.x+1,hole.y-61); ctx.fill();
  ctx.fillStyle = "#6d693f"; ctx.font = "bold 14px Arial"; ctx.fillText("1",hole.x+19,hole.y-72);
  if (!moving && !won) {
    const a = angle(), length = 60 + Number(ui.power.value) * 1.15;
    ctx.save(); ctx.strokeStyle = "#fffbe9a6"; ctx.lineWidth = 2; ctx.setLineDash([3, 9]);
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y); ctx.lineTo(ball.x + Math.cos(a)*length, ball.y + Math.sin(a)*length); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = "#fffbe94d"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ball.x, ball.y, 19, 0, Math.PI*2); ctx.stroke();
  }
  if (moving) trail.forEach((p,i) => ellipse(p.x,p.y,3,3,`rgba(255,255,230,${i/trail.length*.13})`));
  const size = won ? Math.max(0, 1 - sink * 2.5) : 1;
  if (size > 0) {
    ellipse(ball.x+3,ball.y+5,9*size,6*size,"#23402f35");
    const gradient = ctx.createRadialGradient(ball.x-3,ball.y-4,1,ball.x,ball.y,9);
    gradient.addColorStop(0,"#ffffff"); gradient.addColorStop(.65,"#fcfcf0"); gradient.addColorStop(1,"#d2d8ba");
    ellipse(ball.x,ball.y,8*size,8*size,gradient);
    if (!won) { ellipse(ball.x+2,ball.y+3,1,1,"#b5bda555"); ellipse(ball.x-3,ball.y+1,1,1,"#b5bda555"); }
  }
}
function frame(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
  lastTime = time;
  physics(dt);
  if (won) {
    sink += dt;
    if (sink > .65 && ui.success.hidden) { ui.success.hidden = false; ui.playAgain.focus(); }
  }
  draw(); requestAnimationFrame(frame);
}
function pointerAim(event) {
  const rect = canvas.getBoundingClientRect();
  aimAt((event.clientX - rect.left) / rect.width * W, (event.clientY - rect.top) / rect.height * H);
}
canvas.addEventListener("pointerdown", event => { canvas.setPointerCapture(event.pointerId); pointerAim(event); });
canvas.addEventListener("pointermove", event => { if (canvas.hasPointerCapture(event.pointerId)) pointerAim(event); });
ui.direction.addEventListener("input", syncControls);
ui.power.addEventListener("input", syncControls);
ui.putt.addEventListener("click", putt);
ui.reset.addEventListener("click", reset);
ui.playAgain.addEventListener("click", () => { reset(); ui.putt.focus(); });
document.addEventListener("keydown", event => {
  if (event.code === "Space" && !["INPUT", "BUTTON", "A"].includes(document.activeElement.tagName)) { event.preventDefault(); putt(); }
});
reset(); requestAnimationFrame(frame);
