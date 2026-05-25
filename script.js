/* ══════════════════════════════════════════
   Portfolio — script.js
   ══════════════════════════════════════════ */

/* ── Element references ── */
const canvas = document.getElementById('trail');
const ctx    = canvas.getContext('2d');
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
const label  = document.getElementById('cursor-label');

/* ── State ── */
let mx = -200, my = -200;   // mouse position
let rx = -200, ry = -200;   // lagging ring position
let points     = [];         // trail points
let frameCount = 0;
let isHovered  = false;

const MAX_PTS = 48;

/* ── Spark colours ── */
const SPARK_COLORS = [
  '#7c6ff7',  // purple
  '#a89cf7',  // light purple
  '#3dd68c',  // green
  '#f5a623',  // amber
  '#e879f9',  // pink
  '#60a5fa',  // blue
];

/* ══════════════════════════════════════════
   CANVAS RESIZE
   ══════════════════════════════════════════ */

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);

/* ══════════════════════════════════════════
   MOUSE TRACKING
   ══════════════════════════════════════════ */

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;

  // Move the dot cursor instantly
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';

  // Move the label alongside the cursor
  label.style.left = mx + 'px';
  label.style.top  = my + 'px';

  // Record point for trail
  points.push({ x: mx, y: my, age: 0 });
  if (points.length > MAX_PTS) points.shift();

  // Randomly spawn sparks while moving
  if (Math.random() > 0.3) spawnSpark(mx, my);
});

/* ══════════════════════════════════════════
   CLICK RIPPLE
   ══════════════════════════════════════════ */

document.addEventListener('click', e => {
  createRipple(e.clientX, e.clientY, 60 + Math.random() * 40, 0.65);
  createRipple(e.clientX, e.clientY, (60 + Math.random() * 40) * 1.6, 0.95, 0.4);
});

function createRipple(x, y, size, duration, opacity = 1) {
  const r = document.createElement('div');
  r.className = 'ripple';
  r.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    animation-duration: ${duration}s;
    opacity: ${opacity};
  `;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), duration * 1000 + 50);
}

/* ══════════════════════════════════════════
   SPARKS
   ══════════════════════════════════════════ */

function spawnSpark(x, y) {
  const s     = document.createElement('div');
  s.className = 'spark';

  const sz    = 1.5 + Math.random() * 3.5;
  const angle = Math.random() * Math.PI * 2;
  const dist  = 10 + Math.random() * 28;
  const dx    = Math.cos(angle) * dist;
  const dy    = Math.sin(angle) * dist;
  const col   = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];

  s.style.cssText = `
    width: ${sz}px;
    height: ${sz}px;
    left: ${x}px;
    top: ${y}px;
    background: ${col};
    opacity: 0.9;
    transition: transform 0.55s ease-out, opacity 0.55s ease-out;
    transform: translate(-50%, -50%);
  `;

  document.body.appendChild(s);

  // Trigger animation on next frame
  requestAnimationFrame(() => {
    s.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`;
    s.style.opacity   = '0';
  });

  setTimeout(() => s.remove(), 580);
}

/* ══════════════════════════════════════════
   CURSOR HOVER EFFECTS
   ══════════════════════════════════════════ */

function attachHoverEffects() {
  const interactiveEls = document.querySelectorAll('button, a, .pc, .ftab');

  interactiveEls.forEach(el => {
    const cursorLabel = el.dataset.cursor || '';

    el.addEventListener('mouseenter', () => {
      isHovered = true;
      cursor.style.transform  = 'translate(-50%, -50%) scale(2.8)';
      cursor.style.background = '#a89cf7';
      ring.style.width        = '64px';
      ring.style.height       = '64px';
      ring.style.borderColor  = 'rgba(168, 156, 247, 0.55)';
      if (cursorLabel) {
        label.textContent  = cursorLabel;
        label.style.opacity = '1';
      }
    });

    el.addEventListener('mouseleave', () => {
      isHovered = false;
      cursor.style.transform  = 'translate(-50%, -50%) scale(1)';
      cursor.style.background = '#7c6ff7';
      ring.style.width        = '36px';
      ring.style.height       = '36px';
      ring.style.borderColor  = 'rgba(124, 111, 247, 0.5)';
      label.style.opacity     = '0';
    });
  });
}

attachHoverEffects();

/* ══════════════════════════════════════════
   PROJECT FILTER
   ══════════════════════════════════════════ */

function filterProjects(type, btn) {
  // Update active tab
  document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  // Show / hide cards
  document.querySelectorAll('.pc').forEach(card => {
    const match = type === 'all' || card.dataset.type === type;
    card.classList.toggle('hidden', !match);
  });
}

// Expose globally so the inline onclick attributes in HTML can call it
window.filterProjects = filterProjects;

/* ══════════════════════════════════════════
   ANIMATION LOOP — trail + ring lerp
   ══════════════════════════════════════════ */

function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Smoothly lerp the ring toward the cursor
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';

  // Age all trail points
  points.forEach(p => p.age++);
  points = points.filter(p => p.age < MAX_PTS);

  // Draw the fading trail
  if (points.length > 2) {
    for (let i = 1; i < points.length; i++) {
      const t = 1 - points[i].age / MAX_PTS;
      ctx.beginPath();
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = `rgba(124, 111, 247, ${t * 0.55})`;
      ctx.lineWidth   = t * 3.5;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }
  }

  // Drip tiny ghost sparks along the trail every 4 frames
  frameCount++;
  if (frameCount % 4 === 0 && points.length > 0) {
    const last = points[points.length - 1];
    const p    = document.createElement('div');
    p.className = 'spark';
    const sz    = 1 + Math.random() * 2;
    p.style.cssText = `
      width: ${sz}px;
      height: ${sz}px;
      left: ${last.x}px;
      top: ${last.y}px;
      background: rgba(124, 111, 247, 0.45);
      opacity: 0.55;
      transform: translate(-50%, -50%);
      transition: opacity 0.4s;
    `;
    document.body.appendChild(p);
    setTimeout(() => {
      p.style.opacity = '0';
      setTimeout(() => p.remove(), 420);
    }, 30);
  }
}

draw();

const projectsContainer = document.getElementById("projects-container");

async function fetchProjects() {
  try {
    const response = await fetch(
      "https://api.github.com/users/Suneet0806/repos"
    );

    const repos = await response.json();

    // Remove forked repos
    const filteredRepos = repos.filter(repo => !repo.fork);

    filteredRepos.forEach(repo => {
      const card = document.createElement("div");
      card.classList.add("project-card");

      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description available."}</p>
        <p><strong>Language:</strong> ${repo.language || "Unknown"}</p>
        <a href="${repo.html_url}" target="_blank">
          View Project
        </a>
      `;

      projectsContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
  }
}

fetchProjects();
