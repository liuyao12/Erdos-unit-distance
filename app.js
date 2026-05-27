(() => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d", { alpha: false });
  const statusEl = document.getElementById("status");
  const fieldSelect = document.getElementById("fieldSelect");
  const homeButton = document.getElementById("home");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const edgesButton = document.getElementById("edges");
  const pointsButton = document.getElementById("points");
  const gridButton = document.getElementById("grid");
  const saveButton = document.getElementById("save");
  const windowInput = document.getElementById("windowRadius");
  const windowLabel = document.getElementById("windowLabel");
  const lensInput = document.getElementById("lensRadius");
  const lensLabel = document.getElementById("lensLabel");

  const PHI = {
    12: [1, 0, -1, 0, 1],
    18: [1, 0, 0, -1, 0, 0, 1],
    24: [1, 0, 0, 0, -1, 0, 0, 0, 1],
    30: [1, 1, 0, -1, -1, -1, 0, 1, 1]
  };

  const FIELDS = [
    {
      id: "zeta12",
      label: "Q(zeta_12)",
      shortLabel: "Z[zeta_12]",
      m: 12,
      coefficientBound: 12,
      defaultLensWorldRadius: 2.5,
      defaultWindow: 4,
      windowMin: 1,
      windowMax: 8,
      windowStep: 0.1,
      pointFill: "#f0a000",
      pointStroke: "rgba(181, 110, 0, 0.76)",
      edgeStroke: "rgba(36, 54, 216, 0.35)"
    },
    {
      id: "zeta18",
      label: "Q(zeta_18)",
      shortLabel: "Z[zeta_18]",
      m: 18,
      coefficientBound: 3,
      defaultLensWorldRadius: 0.8,
      defaultWindow: 4,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#d9783d",
      pointStroke: "rgba(133, 57, 22, 0.72)",
      edgeStroke: "rgba(176, 72, 44, 0.34)"
    },
    {
      id: "zeta24",
      label: "Q(zeta_24)",
      shortLabel: "Z[zeta_24]",
      m: 24,
      coefficientBound: 2,
      defaultLensWorldRadius: 0.4,
      defaultWindow: 4,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#2f9a82",
      pointStroke: "rgba(18, 92, 77, 0.72)",
      edgeStroke: "rgba(22, 120, 104, 0.3)"
    },
    {
      id: "zeta30",
      label: "Q(zeta_30)",
      shortLabel: "Z[zeta_30]",
      m: 30,
      coefficientBound: 2,
      defaultLensWorldRadius: 0.4,
      defaultWindow: 4,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#5d74cf",
      pointStroke: "rgba(35, 54, 139, 0.7)",
      edgeStroke: "rgba(57, 84, 184, 0.28)"
    }
  ];

  const fieldById = new Map(FIELDS.map((field) => [field.id, field]));
  const datasetCache = new Map();
  const squareLatticeBenchmarkCache = new Map();
  const squareDiskBenchmarkCache = new Map();

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    centerX: 0,
    centerY: 0,
    scale: 80,
    fieldId: "zeta12",
    windowRadius: 4,
    lensRadius: 230,
    showEdges: true,
    showPoints: true,
    showGrid: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
    dirty: true,
    dataset: null
  };

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x;
  }

  function coeffKey(coeffs) {
    return coeffs.join(",");
  }

  function shiftedCoeffKey(coeffs, step) {
    let key = "";
    for (let i = 0; i < coeffs.length; i += 1) {
      if (i) key += ",";
      key += coeffs[i] + step[i];
    }
    return key;
  }

  function multiplyByX(vector, phi) {
    const degree = phi.length - 1;
    const carry = vector[degree - 1];
    const out = new Array(degree).fill(0);
    for (let i = degree - 1; i > 0; i -= 1) {
      out[i] = vector[i - 1];
    }
    if (carry) {
      for (let i = 0; i < degree; i += 1) {
        out[i] -= carry * phi[i];
      }
    }
    return out;
  }

  function rootSteps(m) {
    const phi = PHI[m];
    const degree = phi.length - 1;
    const steps = [new Array(degree).fill(0)];
    steps[0][0] = 1;
    for (let i = 1; i < m; i += 1) {
      steps.push(multiplyByX(steps[i - 1], phi));
    }
    return steps;
  }

  function embeddingRepresentatives(m) {
    const reps = [];
    for (let r = 1; r < m; r += 1) {
      if (gcd(r, m) === 1 && (r === 1 || r < m - r)) {
        reps.push(r);
      }
    }
    return reps;
  }

  function embeddingValues(m) {
    const degree = PHI[m].length - 1;
    return embeddingRepresentatives(m).map((r) => {
      const theta = 2 * Math.PI * r / m;
      const rootRe = Math.cos(theta);
      const rootIm = Math.sin(theta);
      let re = 1;
      let im = 0;
      const powers = [];
      for (let j = 0; j < degree; j += 1) {
        powers.push({ re, im });
        const nextRe = re * rootRe - im * rootIm;
        const nextIm = re * rootIm + im * rootRe;
        re = nextRe;
        im = nextIm;
      }
      return powers;
    });
  }

  function buildDataset(field, windowRadius) {
    const cacheKey = field.id + ":" + windowRadius.toFixed(2);
    if (datasetCache.has(cacheKey)) return datasetCache.get(cacheKey);

    const started = performance.now();
    const degree = PHI[field.m].length - 1;
    const base = 2 * field.coefficientBound + 1;
    const total = Math.pow(base, degree);
    const embeddings = embeddingValues(field.m);
    const internalRadiusSquared = windowRadius * windowRadius;
    const coeffs = new Array(degree).fill(0);
    const points = [];
    const index = new Map();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let code = 0; code < total; code += 1) {
      let value = code;
      for (let i = 0; i < degree; i += 1) {
        coeffs[i] = (value % base) - field.coefficientBound;
        value = Math.floor(value / base);
      }

      let accepted = true;
      let x = 0;
      let y = 0;
      for (let embeddingIndex = 0; embeddingIndex < embeddings.length; embeddingIndex += 1) {
        const powers = embeddings[embeddingIndex];
        let re = 0;
        let im = 0;
        for (let j = 0; j < degree; j += 1) {
          re += coeffs[j] * powers[j].re;
          im += coeffs[j] * powers[j].im;
        }
        const normSquared = re * re + im * im;
        if (embeddingIndex === 0) {
          x = re;
          y = im;
        } else if (normSquared > internalRadiusSquared + 1e-9) {
          accepted = false;
          break;
        }
      }

      if (accepted) {
        const savedCoeffs = coeffs.slice();
        index.set(coeffKey(savedCoeffs), points.length);
        points.push({ x, y, coeffs: savedCoeffs });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const steps = rootSteps(field.m);
    const edges = [];
    for (let i = 0; i < points.length; i += 1) {
      const coeff = points[i].coeffs;
      for (const step of steps) {
        const j = index.get(shiftedCoeffKey(coeff, step));
        if (j !== undefined && i < j) {
          edges.push([i, j]);
        }
      }
    }

    const dataset = {
      field,
      windowRadius,
      points,
      edges,
      bounds: { minX, minY, maxX, maxY },
      buildMs: performance.now() - started,
      exactPhysicalCrop: false
    };
    datasetCache.set(cacheKey, dataset);
    return dataset;
  }

  function currentField() {
    return fieldById.get(state.fieldId) || FIELDS[0];
  }

  function screenToWorld(sx, sy) {
    return {
      x: state.centerX + (sx - state.width / 2) / state.scale,
      y: state.centerY - (sy - state.height / 2) / state.scale
    };
  }

  function worldToScreen(x, y) {
    return {
      x: state.width / 2 + (x - state.centerX) * state.scale,
      y: state.height / 2 - (y - state.centerY) * state.scale
    };
  }

  function visibleBounds(extra) {
    const p0 = screenToWorld(-extra, state.height + extra);
    const p1 = screenToWorld(state.width + extra, -extra);
    return {
      xMin: Math.min(p0.x, p1.x),
      xMax: Math.max(p0.x, p1.x),
      yMin: Math.min(p0.y, p1.y),
      yMax: Math.max(p0.y, p1.y)
    };
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString();
  }

  function addDistanceCount(counts, distSquared, placements) {
    if (placements > 0) {
      counts.set(distSquared, (counts.get(distSquared) || 0) + placements);
    }
  }

  function exactSquareLatticeBlock(pointCount, width) {
    const fullRows = Math.floor(pointCount / width);
    const lastRow = pointCount % width;
    const counts = new Map();

    for (let dy = 0; dy < fullRows; dy += 1) {
      if (dy === 0) {
        for (let dx = 1; dx < width; dx += 1) {
          addDistanceCount(counts, dx * dx, (width - dx) * fullRows);
        }
      } else {
        for (let dx = -width + 1; dx < width; dx += 1) {
          addDistanceCount(counts, dx * dx + dy * dy, (width - Math.abs(dx)) * (fullRows - dy));
        }
      }
    }

    if (lastRow > 0) {
      for (let dx = 1; dx < lastRow; dx += 1) {
        addDistanceCount(counts, dx * dx, lastRow - dx);
      }
      for (let dy = 1; dy <= fullRows; dy += 1) {
        for (let dx = -width + 1; dx < lastRow; dx += 1) {
          const start = Math.max(0, -dx);
          const end = Math.min(width, lastRow - dx);
          addDistanceCount(counts, dx * dx + dy * dy, end - start);
        }
      }
    }

    let bestDistSquared = 1;
    let bestEdges = 0;
    for (const [distSquared, edges] of counts) {
      if (edges > bestEdges) {
        bestDistSquared = distSquared;
        bestEdges = edges;
      }
    }

    return {
      width,
      rows: fullRows + (lastRow > 0 ? 1 : 0),
      points: pointCount,
      edges: bestEdges,
      distSquared: bestDistSquared
    };
  }

  function squareLatticeBenchmark(pointCount) {
    const n = Math.max(0, Math.floor(pointCount));
    if (squareLatticeBenchmarkCache.has(n)) return squareLatticeBenchmarkCache.get(n);
    if (n < 2) {
      const empty = { width: n, rows: 1, points: n, edges: 0, distSquared: 1, approximate: false };
      squareLatticeBenchmarkCache.set(n, empty);
      return empty;
    }

    const root = Math.ceil(Math.sqrt(n));
    const approximate = n > 20000;
    const firstWidth = approximate ? Math.max(1, Math.floor(root * 0.55)) : 1;
    let best = exactSquareLatticeBlock(n, 1);
    for (let width = firstWidth; width <= root; width += 1) {
      const candidate = exactSquareLatticeBlock(n, width);
      if (candidate.edges > best.edges || (candidate.edges === best.edges && candidate.rows < best.rows)) {
        best = candidate;
      }
    }
    best = { ...best, approximate };
    squareLatticeBenchmarkCache.set(n, best);
    return best;
  }

  function squareDiskPoints(pointCount) {
    if (pointCount <= 0) return [];
    const radius = Math.ceil(Math.sqrt(pointCount / Math.PI)) + 3;
    const points = [];
    for (let y = -radius; y <= radius; y += 1) {
      for (let x = -radius; x <= radius; x += 1) {
        points.push({ x, y, distSquared: x * x + y * y });
      }
    }
    points.sort((a, b) => (
      a.distSquared - b.distSquared ||
      Math.abs(a.y) - Math.abs(b.y) ||
      Math.abs(a.x) - Math.abs(b.x) ||
      a.y - b.y ||
      a.x - b.x
    ));
    return points.slice(0, pointCount);
  }

  function squareDiskBenchmark(pointCount) {
    const n = Math.max(0, Math.floor(pointCount));
    if (squareDiskBenchmarkCache.has(n)) return squareDiskBenchmarkCache.get(n);
    if (n < 2) {
      const empty = { points: n, edges: 0, distSquared: 1, exact: true };
      squareDiskBenchmarkCache.set(n, empty);
      return empty;
    }
    if (n > 6000) {
      const paused = { points: n, edges: null, distSquared: null, exact: false };
      squareDiskBenchmarkCache.set(n, paused);
      return paused;
    }

    const points = squareDiskPoints(n);
    const counts = new Map();
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      for (let j = i + 1; j < points.length; j += 1) {
        const q = points[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distSquared = dx * dx + dy * dy;
        counts.set(distSquared, (counts.get(distSquared) || 0) + 1);
      }
    }

    let bestDistSquared = 1;
    let bestEdges = 0;
    for (const [distSquared, edges] of counts) {
      if (edges > bestEdges) {
        bestDistSquared = distSquared;
        bestEdges = edges;
      }
    }

    const benchmark = { points: n, edges: bestEdges, distSquared: bestDistSquared, exact: true };
    squareDiskBenchmarkCache.set(n, benchmark);
    return benchmark;
  }

  function lensScreenRadius() {
    const cap = Math.max(32, Math.min(state.width, state.height) / 2 - 28);
    return Math.max(16, Math.min(cap, state.lensRadius));
  }

  function resize() {
    state.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = state.width + "px";
    canvas.style.height = state.height + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.dirty = true;
    requestDraw();
  }

  function fitInitial() {
    const field = currentField();
    state.centerX = 0;
    state.centerY = 0;
    state.scale = Math.max(22, Math.min(1200, lensScreenRadius() / field.defaultLensWorldRadius));
    state.dirty = true;
    requestDraw();
  }

  function goHome() {
    state.centerX = 0;
    state.centerY = 0;
    state.dirty = true;
    requestDraw();
  }

  function zoomAt(sx, sy, factor) {
    const before = screenToWorld(sx, sy);
    state.scale = Math.max(8, Math.min(1200, state.scale * factor));
    state.centerX = before.x - (sx - state.width / 2) / state.scale;
    state.centerY = before.y + (sy - state.height / 2) / state.scale;
    state.dirty = true;
    requestDraw();
  }

  function drawGrid(bounds) {
    if (!state.showGrid) return;

    const worldSpan = Math.max(bounds.xMax - bounds.xMin, bounds.yMax - bounds.yMin);
    const candidates = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
    let step = candidates[candidates.length - 1];
    for (const candidate of candidates) {
      if (candidate * state.scale >= 52) {
        step = candidate;
        break;
      }
    }
    if (worldSpan > 300) return;

    ctx.save();
    ctx.strokeStyle = "rgba(20,20,20,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const xStart = Math.ceil(bounds.xMin / step) * step;
    const yStart = Math.ceil(bounds.yMin / step) * step;
    for (let x = xStart; x <= bounds.xMax; x += step) {
      const s = worldToScreen(x, 0).x;
      ctx.moveTo(s, 0);
      ctx.lineTo(s, state.height);
    }
    for (let y = yStart; y <= bounds.yMax; y += step) {
      const s = worldToScreen(0, y).y;
      ctx.moveTo(0, s);
      ctx.lineTo(state.width, s);
    }
    ctx.stroke();

    const origin = worldToScreen(0, 0);
    ctx.strokeStyle = "rgba(20,20,20,0.24)";
    ctx.lineWidth = 1.25;
    if (origin.y >= 0 && origin.y <= state.height) {
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(state.width, origin.y);
      ctx.stroke();
    }
    if (origin.x >= 0 && origin.x <= state.width) {
      ctx.beginPath();
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, state.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLensShade(radius) {
    ctx.save();
    ctx.fillStyle = "rgba(208, 211, 214, 0.34)";
    ctx.beginPath();
    ctx.rect(0, 0, state.width, state.height);
    ctx.arc(state.width / 2, state.height / 2, radius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(22,24,29,0.46)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(state.width / 2, state.height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    state.dirty = false;
    const field = currentField();
    const dataset = state.dataset || buildDataset(field, state.windowRadius);
    state.dataset = dataset;
    const points = dataset.points;
    const edges = dataset.edges;

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#f8f7f2";
    ctx.fillRect(0, 0, state.width, state.height);

    const drawBounds = visibleBounds(12);
    const lensRadius = lensScreenRadius();
    const lensRadiusSquared = lensRadius * lensRadius;
    const visible = new Uint8Array(points.length);
    const inLens = new Uint8Array(points.length);
    let visiblePoints = 0;
    let lensPoints = 0;

    drawGrid(drawBounds);

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const ps = worldToScreen(p.x, p.y);
      const isVisible = ps.x >= -12 && ps.x <= state.width + 12 && ps.y >= -12 && ps.y <= state.height + 12;
      if (isVisible) {
        visible[i] = 1;
        visiblePoints += 1;
      }
      const dx = ps.x - state.width / 2;
      const dy = ps.y - state.height / 2;
      if (dx * dx + dy * dy <= lensRadiusSquared) {
        inLens[i] = 1;
        lensPoints += 1;
      }
    }

    const drawEdgeLimit = 900000;
    const countEdgeLimit = 1600000;
    const drawEdges = state.showEdges && edges.length <= drawEdgeLimit;
    const countEdges = edges.length <= countEdgeLimit;
    let visibleEdges = 0;
    let lensEdges = 0;

    if (drawEdges || countEdges) {
      if (drawEdges) {
        ctx.save();
        ctx.strokeStyle = field.edgeStroke;
        ctx.lineWidth = Math.max(0.35, Math.min(1.05, state.scale * 0.0045));
        ctx.beginPath();
      }

      for (const [i, j] of edges) {
        const visibleEdge = visible[i] && visible[j];
        if (visibleEdge) {
          visibleEdges += 1;
          if (drawEdges) {
            const p = points[i];
            const q = points[j];
            const ps = worldToScreen(p.x, p.y);
            const qs = worldToScreen(q.x, q.y);
            ctx.moveTo(ps.x, ps.y);
            ctx.lineTo(qs.x, qs.y);
          }
        }
        if (inLens[i] && inLens[j]) {
          lensEdges += 1;
        }
      }

      if (drawEdges) {
        ctx.stroke();
        ctx.restore();
      }
    }

    if (state.showPoints) {
      const pointRadius = Math.max(0.85, Math.min(3.8, state.scale * 0.018));
      ctx.save();
      ctx.fillStyle = field.pointFill;
      ctx.strokeStyle = field.pointStroke;
      ctx.lineWidth = Math.max(0.35, Math.min(0.8, pointRadius * 0.22));
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        if (!visible[i]) continue;
        const p = points[i];
        const ps = worldToScreen(p.x, p.y);
        ctx.moveTo(ps.x + pointRadius, ps.y);
        ctx.arc(ps.x, ps.y, pointRadius, 0, Math.PI * 2);
      }
      ctx.fill();
      if (pointRadius > 1.8) ctx.stroke();
      ctx.restore();
    }

    drawLensShade(lensRadius);

    const sideBenchmark = lensPoints > 3 ? squareLatticeBenchmark(lensPoints) : null;
    const diskBenchmark = lensPoints > 3 ? squareDiskBenchmark(lensPoints) : null;
    const lensWorldRadius = lensRadius / state.scale;
    const lensEdgeText = countEdges ? formatNumber(lensEdges) : "paused";
    const sideText = sideBenchmark ? formatNumber(sideBenchmark.edges) : "0";
    const diskText = diskBenchmark
      ? (diskBenchmark.exact ? formatNumber(diskBenchmark.edges) : "paused")
      : "0";

    statusEl.innerHTML =
      "<strong>" + field.label + "</strong><br>" +
      "visible points: <strong>" + formatNumber(lensPoints) + "</strong><br>" +
      "unit edges: <strong>" + lensEdgeText + "</strong><br>" +
      "field radius: <strong>" + lensWorldRadius.toFixed(2) + "</strong><br>" +
      "square lattice, side row: <strong>" + sideText + "</strong><br>" +
      "square lattice, circular disk: <strong>" + diskText + "</strong>";
  }

  let raf = 0;
  function requestDraw() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (state.dirty) render();
    });
  }

  function setField(fieldId) {
    const field = fieldById.get(fieldId) || FIELDS[0];
    state.fieldId = field.id;
    state.windowRadius = field.defaultWindow;
    windowInput.min = String(field.windowMin);
    windowInput.max = String(field.windowMax);
    windowInput.step = String(field.windowStep);
    windowInput.value = String(field.defaultWindow);
    windowLabel.textContent = "W " + state.windowRadius.toFixed(1);
    fieldSelect.value = field.id;
    state.dataset = buildDataset(field, state.windowRadius);
    fitInitial();
  }

  function updateWindowRadius() {
    const field = currentField();
    state.windowRadius = Number(windowInput.value);
    windowLabel.textContent = "W " + state.windowRadius.toFixed(1);
    state.dataset = buildDataset(field, state.windowRadius);
    state.dirty = true;
    requestDraw();
  }

  function updateLensRadius() {
    state.lensRadius = Number(lensInput.value);
    lensLabel.textContent = "lens " + Math.round(state.lensRadius) + "px";
    state.dirty = true;
    requestDraw();
  }

  function initControls() {
    for (const field of FIELDS) {
      const option = document.createElement("option");
      option.value = field.id;
      option.textContent = field.label;
      fieldSelect.appendChild(option);
    }
    lensInput.value = String(state.lensRadius);
    updateLensRadius();
    setField(state.fieldId);
  }

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    state.dragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.centerX -= dx / state.scale;
    state.centerY += dy / state.scale;
    state.dirty = true;
    requestDraw();
  });

  canvas.addEventListener("pointerup", (event) => {
    state.dragging = false;
    canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove("dragging");
  });

  canvas.addEventListener("pointercancel", () => {
    state.dragging = false;
    canvas.classList.remove("dragging");
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.001));
  }, { passive: false });

  fieldSelect.addEventListener("change", () => setField(fieldSelect.value));
  homeButton.addEventListener("click", goHome);
  zoomInButton.addEventListener("click", () => zoomAt(state.width / 2, state.height / 2, 1.25));
  zoomOutButton.addEventListener("click", () => zoomAt(state.width / 2, state.height / 2, 0.8));
  edgesButton.addEventListener("click", () => {
    state.showEdges = !state.showEdges;
    edgesButton.classList.toggle("active", state.showEdges);
    state.dirty = true;
    requestDraw();
  });
  pointsButton.addEventListener("click", () => {
    state.showPoints = !state.showPoints;
    pointsButton.classList.toggle("active", state.showPoints);
    state.dirty = true;
    requestDraw();
  });
  gridButton.addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    gridButton.classList.toggle("active", state.showGrid);
    state.dirty = true;
    requestDraw();
  });
  windowInput.addEventListener("change", updateWindowRadius);
  windowInput.addEventListener("input", () => {
    windowLabel.textContent = "W " + Number(windowInput.value).toFixed(1);
  });
  lensInput.addEventListener("input", updateLensRadius);
  saveButton.addEventListener("click", () => {
    const field = currentField();
    const link = document.createElement("a");
    link.download = field.id + "-cut-and-project.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  window.addEventListener("resize", resize);
  resize();
  initControls();
})();
