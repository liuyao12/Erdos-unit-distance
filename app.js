    const canvas = document.getElementById("stage");
    const ctx = canvas.getContext("2d", { alpha: false });
    const statusEl = document.getElementById("status");
    const homeButton = document.getElementById("home");
    const zoomInButton = document.getElementById("zoomIn");
    const zoomOutButton = document.getElementById("zoomOut");
    const edgesButton = document.getElementById("edges");
    const gridButton = document.getElementById("grid");
    const saveButton = document.getElementById("save");
    const windowInput = document.getElementById("windowRadius");
    const windowLabel = document.getElementById("windowLabel");

    const SQRT3 = Math.sqrt(3);
    const Q = SQRT3 / 2;
    const ROOT_STEPS = [
      [1, 0, 0, 0],
      [0, 0, 0, -1],
      [1, 0, 1, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 1, 0, 1]
    ];

    const state = {
      width: 1,
      height: 1,
      dpr: 1,
      centerX: 0,
      centerY: 0,
      scale: 125,
      windowRadius: 4,
      showEdges: true,
      showGrid: true,
      dragging: false,
      lastX: 0,
      lastY: 0,
      dirty: true,
      lastStats: null
    };

    function coeffKey(a, b, c, d) {
      return a + "," + b + "," + c + "," + d;
    }

    function physical(a, b, c, d) {
      return {
        x: a - 0.5 * c - Q * d,
        y: b + Q * c - 0.5 * d
      };
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
      state.centerX = 0;
      state.centerY = 0;
      state.scale = Math.max(28, Math.min(state.width, state.height) / 9.2);
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
      state.scale = Math.max(5, Math.min(900, state.scale * factor));
      state.centerX = before.x - (sx - state.width / 2) / state.scale;
      state.centerY = before.y + (sy - state.height / 2) / state.scale;
      state.dirty = true;
      requestDraw();
    }

    function enumerateModelSet(bounds, windowRadius) {
      const W = windowRadius;
      const pts = [];
      const index = new Map();
      const cMin = Math.ceil((bounds.yMin - W) / SQRT3 - 1e-9);
      const cMax = Math.floor((bounds.yMax + W) / SQRT3 + 1e-9);
      const dMin = Math.ceil(-(bounds.xMax + W) / SQRT3 - 1e-9);
      const dMax = Math.floor(-(bounds.xMin - W) / SQRT3 + 1e-9);
      const maxPoints = 320000;
      let clipped = false;

      for (let c = cMin; c <= cMax; c += 1) {
        for (let d = dMin; d <= dMax; d += 1) {
          const aPhysMin = bounds.xMin + 0.5 * c + Q * d;
          const aPhysMax = bounds.xMax + 0.5 * c + Q * d;
          const aStarMin = -W + 0.5 * c - Q * d;
          const aStarMax = W + 0.5 * c - Q * d;
          const aMin = Math.ceil(Math.max(aPhysMin, aStarMin) - 1e-9);
          const aMax = Math.floor(Math.min(aPhysMax, aStarMax) + 1e-9);
          if (aMin > aMax) continue;

          const bPhysMin = bounds.yMin - Q * c + 0.5 * d;
          const bPhysMax = bounds.yMax - Q * c + 0.5 * d;
          const bCenterStar = Q * c + 0.5 * d;

          for (let a = aMin; a <= aMax; a += 1) {
            const u = a - 0.5 * c + Q * d;
            const remaining = W * W - u * u;
            if (remaining < -1e-9) continue;
            const vMax = Math.sqrt(Math.max(0, remaining));
            const bMin = Math.ceil(Math.max(bPhysMin, bCenterStar - vMax) - 1e-9);
            const bMax = Math.floor(Math.min(bPhysMax, bCenterStar + vMax) + 1e-9);
            for (let b = bMin; b <= bMax; b += 1) {
              const z = physical(a, b, c, d);
              const point = { x: z.x, y: z.y, a, b, c, d };
              index.set(coeffKey(a, b, c, d), pts.length);
              pts.push(point);
              if (pts.length >= maxPoints) {
                clipped = true;
                return { pts, index, clipped };
              }
            }
          }
        }
      }

      return { pts, index, clipped };
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

    const squareLatticeBenchmarkCache = new Map();
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
        fullRows,
        lastRow,
        points: pointCount,
        edges: bestEdges,
        distSquared: bestDistSquared
      };
    }

    function squareLatticeBenchmark(pointCount) {
      const n = Math.max(0, Math.floor(pointCount));
      if (squareLatticeBenchmarkCache.has(n)) return squareLatticeBenchmarkCache.get(n);
      if (n < 2) {
        const empty = { width: n, rows: 1, fullRows: 1, lastRow: 0, points: n, edges: 0, distSquared: 1, approximate: false };
        squareLatticeBenchmarkCache.set(n, empty);
        return empty;
      }

      const root = Math.ceil(Math.sqrt(n));
      const approximate = n > 20000;
      const firstWidth = approximate ? Math.max(1, Math.floor(root * 0.55)) : 1;
      let best = exactSquareLatticeBlock(n, 1);

      for (let width = firstWidth; width <= root; width += 1) {
        const candidate = exactSquareLatticeBlock(n, width);
        if (
          candidate.edges > best.edges ||
          (candidate.edges === best.edges && candidate.rows < best.rows)
        ) {
          best = candidate;
        }
      }

      best = { ...best, approximate };
      squareLatticeBenchmarkCache.set(n, best);
      return best;
    }

    function segmentIntersectsView(p, q, bounds) {
      const minX = Math.min(p.x, q.x);
      const maxX = Math.max(p.x, q.x);
      const minY = Math.min(p.y, q.y);
      const maxY = Math.max(p.y, q.y);
      return maxX >= bounds.xMin && minX <= bounds.xMax && maxY >= bounds.yMin && minY <= bounds.yMax;
    }

    function drawGrid(bounds) {
      if (!state.showGrid) return;

      const worldSpan = Math.max(bounds.xMax - bounds.xMin, bounds.yMax - bounds.yMin);
      const candidates = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100, 200];
      let step = candidates[candidates.length - 1];
      for (const candidate of candidates) {
        if (candidate * state.scale >= 52) {
          step = candidate;
          break;
        }
      }
      if (worldSpan > 600) return;

      ctx.save();
      ctx.strokeStyle = "rgba(20,20,20,0.09)";
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

      ctx.strokeStyle = "rgba(20,20,20,0.22)";
      ctx.lineWidth = 1.25;
      const origin = worldToScreen(0, 0);
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

    function render() {
      state.dirty = false;
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = "#f8f7f2";
      ctx.fillRect(0, 0, state.width, state.height);

      const pointRadius = Math.max(1.15, Math.min(4.3, state.scale * 0.028));
      const generationMargin = state.showEdges ? Math.ceil(state.scale * 1.25) : Math.ceil(pointRadius + 4);
      const drawBounds = visibleBounds(0);
      const genBounds = visibleBounds(generationMargin);
      const generated = enumerateModelSet(genBounds, state.windowRadius);
      const points = generated.pts;
      const index = generated.index;

      drawGrid(drawBounds);

      let visiblePoints = 0;
      let visibleEdges = 0;
      const visible = new Uint8Array(points.length);
      for (let i = 0; i < points.length; i += 1) {
        const p = points[i];
        if (p.x >= drawBounds.xMin && p.x <= drawBounds.xMax && p.y >= drawBounds.yMin && p.y <= drawBounds.yMax) {
          visible[i] = 1;
          visiblePoints += 1;
        }
      }
      const edgeLimit = points.length <= 90000;
      if (state.showEdges && edgeLimit) {
        ctx.save();
        ctx.strokeStyle = "rgba(36, 54, 216, 0.37)";
        ctx.lineWidth = Math.max(0.45, Math.min(1.15, state.scale * 0.006));
        ctx.beginPath();
        for (let i = 0; i < points.length; i += 1) {
          if (!visible[i]) continue;
          const p = points[i];
          for (const step of ROOT_STEPS) {
            const j = index.get(coeffKey(p.a + step[0], p.b + step[1], p.c + step[2], p.d + step[3]));
            if (j === undefined) continue;
            if (!visible[j]) continue;
            const q = points[j];
            const ps = worldToScreen(p.x, p.y);
            const qs = worldToScreen(q.x, q.y);
            ctx.moveTo(ps.x, ps.y);
            ctx.lineTo(qs.x, qs.y);
            visibleEdges += 1;
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = "#f0a000";
      ctx.strokeStyle = "rgba(181, 110, 0, 0.76)";
      ctx.lineWidth = Math.max(0.45, Math.min(0.9, pointRadius * 0.22));
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        if (!visible[i]) continue;
        const p = points[i];
        const ps = worldToScreen(p.x, p.y);
        ctx.moveTo(ps.x + pointRadius, ps.y);
        ctx.arc(ps.x, ps.y, pointRadius, 0, Math.PI * 2);
      }
      ctx.fill();
      if (pointRadius > 2.2) ctx.stroke();
      ctx.restore();

      const squareBenchmark = visiblePoints > 3 ? squareLatticeBenchmark(visiblePoints) : null;
      const edgeText = state.showEdges
        ? (edgeLimit ? visibleEdges.toLocaleString() : "paused")
        : "hidden";
      let squareText = "";
      if (!state.showEdges) {
        squareText = "square-lattice comparison hidden<br>";
      } else if (!edgeLimit) {
        squareText = "square-lattice comparison paused at this zoom<br>";
      } else if (squareBenchmark) {
        squareText =
          "arranging these <strong>" + visiblePoints.toLocaleString() + "</strong> points in a square lattice would have <strong>" +
          Math.round(squareBenchmark.edges).toLocaleString() + "</strong> equal-distance pairs" +
          (squareBenchmark.approximate ? " approx" : "") + "<br>";
      }
      statusEl.innerHTML =
        "<strong>Z[zeta_12] model set</strong><br>" +
        "visible points: <strong>" + visiblePoints.toLocaleString() + "</strong><br>" +
        "visible unit distances: <strong>" + edgeText + "</strong><br>" +
        squareText +
        (generated.clipped ? "<br><strong>viewport cap reached</strong>" : "");
    }

    let raf = 0;
    function requestDraw() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (state.dirty) render();
      });
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
      const factor = Math.exp(-event.deltaY * 0.001);
      zoomAt(event.clientX, event.clientY, factor);
    }, { passive: false });

    homeButton.addEventListener("click", goHome);
    zoomInButton.addEventListener("click", () => zoomAt(state.width / 2, state.height / 2, 1.25));
    zoomOutButton.addEventListener("click", () => zoomAt(state.width / 2, state.height / 2, 0.8));
    edgesButton.addEventListener("click", () => {
      state.showEdges = !state.showEdges;
      edgesButton.classList.toggle("active", state.showEdges);
      state.dirty = true;
      requestDraw();
    });
    gridButton.addEventListener("click", () => {
      state.showGrid = !state.showGrid;
      gridButton.classList.toggle("active", state.showGrid);
      state.dirty = true;
      requestDraw();
    });
    windowInput.addEventListener("input", () => {
      state.windowRadius = Number(windowInput.value);
      windowLabel.textContent = "W " + state.windowRadius.toFixed(1);
      state.dirty = true;
      requestDraw();
    });
    saveButton.addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "dodecagonal-model-set.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });

    window.addEventListener("resize", resize);
    resize();
    fitInitial();
