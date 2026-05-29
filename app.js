(() => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d", { alpha: false });
  const toolbarEl = document.querySelector(".toolbar");
  const statusEl = document.getElementById("status");
  const tooltipEl = document.getElementById("pointTooltip");
  const fieldPanelEl = document.querySelector(".field-panel");
  const fieldPosetEl = document.getElementById("fieldPoset");
  const fieldPanelToggleButton = document.getElementById("fieldPanelToggle");
  const fieldPanelCloseButton = document.getElementById("fieldPanelClose");
  const fieldBackdropEl = document.getElementById("fieldBackdrop");
  const windowControl = document.querySelector(".slider-wrap");
  const homeButton = document.getElementById("home");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const edgesButton = document.getElementById("edges");
  const pointsButton = document.getElementById("points");
  const gridButton = document.getElementById("grid");
  const saveButton = document.getElementById("save");
  const windowInput = document.getElementById("windowRadius");
  const windowLabel = document.getElementById("windowLabel");

  const PHI = {
    3: [1, 1, 1],
    4: [1, 0, 1],
    5: [1, 1, 1, 1, 1],
    7: [1, 1, 1, 1, 1, 1, 1],
    8: [1, 0, 0, 0, 1],
    9: [1, 0, 0, 1, 0, 0, 1],
    12: [1, 0, -1, 0, 1],
    18: [1, 0, 0, -1, 0, 0, 1],
    24: [1, 0, 0, 0, -1, 0, 0, 0, 1],
    30: [1, 1, 0, -1, -1, -1, 0, 1, 1]
  };

  const FIELDS = [
    {
      id: "gaussian",
      type: "cyclotomic",
      label: "Q(i)",
      shortLabel: "Z[i]",
      generator: "i",
      relationText: "Z[i], i² = -1",
      m: 4,
      fullRing: true,
      defaultLensWorldRadius: 8,
      defaultWindow: 0,
      windowMin: 0,
      windowMax: 1,
      windowStep: 1,
      pointFill: "#4267ac",
      pointStroke: "rgba(45, 70, 125, 0.72)",
      edgeStroke: "rgba(48, 77, 146, 0.3)"
    },
    {
      id: "eisenstein",
      type: "cyclotomic",
      label: "Q(zeta_3)",
      shortLabel: "Z[zeta_3]",
      generator: "ζ",
      generatorHtml: "ζ<sub>3</sub>",
      relationText: "Z[ζ], ζ³ = 1",
      m: 3,
      fullRing: true,
      defaultLensWorldRadius: 7.5,
      defaultWindow: 0,
      windowMin: 0,
      windowMax: 1,
      windowStep: 1,
      pointFill: "#b45b3e",
      pointStroke: "rgba(128, 62, 42, 0.72)",
      edgeStroke: "rgba(161, 71, 48, 0.3)"
    },
    {
      id: "sqrtMinus2",
      type: "basis",
      label: "Q(sqrt(-2))",
      shortLabel: "Z[sqrt(-2)]",
      generatorHtml: "√-2",
      basisLabels: ["1", "α"],
      definitionText: "α = √-2",
      relationText: "Z[α], α² = -2",
      degree: 2,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: Math.SQRT2 }
        ]
      ],
      conjugateSigns: [1, -1],
      productTable: {
        "1,1": [-2, 0]
      },
      fullRing: true,
      defaultLensWorldRadius: 8,
      defaultWindow: 0,
      windowMin: 0,
      windowMax: 1,
      windowStep: 1,
      pointFill: "#1687a7",
      pointStroke: "rgba(18, 91, 111, 0.72)",
      edgeStroke: "rgba(14, 126, 158, 0.3)"
    },
    {
      id: "zeta5",
      type: "cyclotomic",
      label: "Q(zeta_5)",
      shortLabel: "Z[zeta_5]",
      m: 5,
      defaultLensWorldRadius: 3,
      defaultWindow: 2,
      windowMin: 0.8,
      windowMax: 5,
      windowStep: 0.1,
      pointFill: "#287c68",
      pointStroke: "rgba(24, 91, 77, 0.72)",
      edgeStroke: "rgba(23, 117, 96, 0.3)"
    },
    {
      id: "zeta7",
      type: "cyclotomic",
      label: "Q(zeta_7)",
      shortLabel: "Z[zeta_7]",
      m: 7,
      defaultLensWorldRadius: 1.6,
      defaultWindow: 2.2,
      windowMin: 0.8,
      windowMax: 4,
      windowStep: 0.1,
      pointFill: "#9a5b33",
      pointStroke: "rgba(117, 66, 35, 0.72)",
      edgeStroke: "rgba(141, 80, 44, 0.3)"
    },
    {
      id: "zeta8",
      type: "cyclotomic",
      label: "Q(zeta_8)",
      shortLabel: "Z[zeta_8]",
      m: 8,
      defaultLensWorldRadius: 3,
      defaultWindow: 2,
      windowMin: 0.8,
      windowMax: 5,
      windowStep: 0.1,
      pointFill: "#7a67b3",
      pointStroke: "rgba(84, 69, 138, 0.72)",
      edgeStroke: "rgba(92, 75, 156, 0.3)"
    },
    {
      id: "zeta9",
      type: "cyclotomic",
      label: "Q(zeta_9)",
      shortLabel: "Z[zeta_9]",
      m: 9,
      defaultLensWorldRadius: 1.4,
      defaultWindow: 2.3,
      windowMin: 0.8,
      windowMax: 4,
      windowStep: 0.1,
      pointFill: "#b24f70",
      pointStroke: "rgba(137, 52, 82, 0.72)",
      edgeStroke: "rgba(166, 59, 93, 0.3)"
    },
    {
      id: "zeta12",
      type: "cyclotomic",
      label: "Q(zeta_12)",
      shortLabel: "Z[zeta_12]",
      m: 12,
      defaultLensWorldRadius: 2.5,
      defaultWindow: 2.6,
      windowMin: 1,
      windowMax: 8,
      windowStep: 0.1,
      pointFill: "#f0a000",
      pointStroke: "rgba(181, 110, 0, 0.76)",
      edgeStroke: "rgba(36, 54, 216, 0.35)"
    },
    {
      id: "sqrtMinus2SqrtMinus3",
      type: "basis",
      label: "Q(sqrt(-2), sqrt(-3))",
      shortLabel: "Z[sqrt(-2), sqrt(-3)]",
      generatorHtml: "√-2, √-3",
      basisLabels: ["1", "α", "β", "αβ"],
      definitionText: "α = √-2, β = √-3",
      relationText: "Z[α, β], α² = -2, β² = -3",
      degree: 4,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: Math.SQRT2 },
          { re: 0, im: Math.sqrt(3) },
          { re: -Math.sqrt(6), im: 0 }
        ],
        [
          { re: 1, im: 0 },
          { re: 0, im: Math.SQRT2 },
          { re: 0, im: -Math.sqrt(3) },
          { re: Math.sqrt(6), im: 0 }
        ]
      ],
      conjugateSigns: [1, -1, -1, 1],
      productTable: {
        "1,1": [-2, 0, 0, 0],
        "1,2": [0, 0, 0, 1],
        "1,3": [0, 0, -2, 0],
        "2,2": [-3, 0, 0, 0],
        "2,3": [0, -3, 0, 0],
        "3,3": [6, 0, 0, 0]
      },
      defaultLensWorldRadius: 2.7,
      defaultWindow: 2.4,
      windowMin: 0.8,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#72751e",
      pointStroke: "rgba(83, 85, 24, 0.72)",
      edgeStroke: "rgba(112, 118, 30, 0.32)"
    },
    {
      id: "zeta18",
      type: "cyclotomic",
      label: "Q(zeta_18)",
      shortLabel: "Z[zeta_18]",
      m: 18,
      defaultLensWorldRadius: 0.8,
      defaultWindow: 2.2,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#d9783d",
      pointStroke: "rgba(133, 57, 22, 0.72)",
      edgeStroke: "rgba(176, 72, 44, 0.34)"
    },
    {
      id: "zeta24",
      type: "cyclotomic",
      label: "Q(zeta_24)",
      shortLabel: "Z[zeta_24]",
      m: 24,
      defaultLensWorldRadius: 0.4,
      defaultWindow: 2,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#2f9a82",
      pointStroke: "rgba(18, 92, 77, 0.72)",
      edgeStroke: "rgba(22, 120, 104, 0.3)"
    },
    {
      id: "zeta30",
      type: "cyclotomic",
      label: "Q(zeta_30)",
      shortLabel: "Z[zeta_30]",
      m: 30,
      defaultLensWorldRadius: 0.4,
      defaultWindow: 2,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#5d74cf",
      pointStroke: "rgba(35, 54, 139, 0.7)",
      edgeStroke: "rgba(57, 84, 184, 0.28)"
    }
  ];

  const FIELD_POSET_NODES = [
    { id: "rational", labelHtml: "<span class=\"field-label\"><strong>Q</strong></span>", x: 50, y: 90, disabled: true },
    { id: "gaussian", fieldId: "gaussian", x: 18, y: 72 },
    { id: "eisenstein", fieldId: "eisenstein", x: 50, y: 72 },
    { id: "sqrtMinus2", fieldId: "sqrtMinus2", x: 82, y: 72 },
    { id: "zeta5", fieldId: "zeta5", x: 10, y: 54 },
    { id: "zeta8", fieldId: "zeta8", x: 31, y: 54 },
    { id: "zeta12", fieldId: "zeta12", x: 52, y: 54 },
    { id: "sqrtMinus2SqrtMinus3", fieldId: "sqrtMinus2SqrtMinus3", x: 77, y: 54 },
    { id: "zeta7", fieldId: "zeta7", x: 12, y: 36 },
    { id: "zeta9", fieldId: "zeta9", x: 38, y: 36 },
    { id: "zeta18", fieldId: "zeta18", x: 58, y: 36 },
    { id: "zeta30", fieldId: "zeta30", x: 82, y: 36 },
    { id: "zeta24", fieldId: "zeta24", x: 56, y: 14 }
  ];

  const FIELD_POSET_EDGES = [
    ["rational", "gaussian"],
    ["rational", "eisenstein"],
    ["rational", "sqrtMinus2"],
    ["rational", "zeta5"],
    ["rational", "zeta7"],
    ["gaussian", "zeta8"],
    ["gaussian", "zeta12"],
    ["eisenstein", "zeta12"],
    ["eisenstein", "zeta9"],
    ["eisenstein", "zeta18"],
    ["eisenstein", "sqrtMinus2SqrtMinus3"],
    ["eisenstein", "zeta30"],
    ["sqrtMinus2", "zeta8"],
    ["sqrtMinus2", "sqrtMinus2SqrtMinus3"],
    ["zeta5", "zeta30"],
    ["zeta8", "zeta24"],
    ["zeta12", "zeta24"],
    ["sqrtMinus2SqrtMinus3", "zeta24"]
  ];

  const fieldById = new Map(FIELDS.map((field) => [field.id, field]));
  const embeddingGeometryCache = new Map();
  const rootPowerCoefficientCache = new Map();
  const UNIT_DISTANCE_SQUARED = 1;
  const UNIT_DISTANCE_TOLERANCE = 1e-8;
  const DATA_BUFFER_AREA_FACTOR = 10;
  const DATA_BUFFER_LINEAR_FACTOR = Math.sqrt(DATA_BUFFER_AREA_FACTOR);
  const DATA_BUFFER_EXTRA_WORLD = 1.25;
  const MAX_DYNAMIC_CANDIDATES = 8000000;
  const DISTANCE_RACE_PAIR_LIMIT = 1600000;
  const DISTANCE_RACE_ROWS = 6;
  const DISTANCE_KEY_SCALE = 1000000;
  const DISTANCE_COLORS = [
    "#f0a000",
    "#2f66ff",
    "#00a982",
    "#e34b85",
    "#8b5cff",
    "#ff6b35",
    "#14b8c5",
    "#d64b08",
    "#25a244",
    "#c026d3"
  ];

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    centerX: 0,
    centerY: 0,
    scale: 80,
    fieldId: "zeta5",
    windowRadius: 2,
    showEdges: true,
    showPoints: true,
    showGrid: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
    autoFitPending: false,
    dirty: true,
    dataset: null,
    hoverPoint: null,
    selectedDistanceKey: null
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

  function fieldDegree(field) {
    if (field.degree) return field.degree;
    return PHI[field.m].length - 1;
  }

  function fieldEmbeddingValues(field) {
    if (field.embeddings) return field.embeddings;
    return embeddingValues(field.m);
  }

  function invertMatrix(matrix) {
    const n = matrix.length;
    const augmented = matrix.map((row, rowIndex) => {
      const out = row.slice();
      for (let col = 0; col < n; col += 1) {
        out.push(col === rowIndex ? 1 : 0);
      }
      return out;
    });

    for (let col = 0; col < n; col += 1) {
      let pivotRow = col;
      let pivotSize = Math.abs(augmented[col][col]);
      for (let row = col + 1; row < n; row += 1) {
        const size = Math.abs(augmented[row][col]);
        if (size > pivotSize) {
          pivotSize = size;
          pivotRow = row;
        }
      }
      if (pivotSize < 1e-12) {
        throw new Error("Embedding matrix is singular");
      }
      if (pivotRow !== col) {
        const tmp = augmented[col];
        augmented[col] = augmented[pivotRow];
        augmented[pivotRow] = tmp;
      }

      const pivot = augmented[col][col];
      for (let k = 0; k < 2 * n; k += 1) {
        augmented[col][k] /= pivot;
      }
      for (let row = 0; row < n; row += 1) {
        if (row === col) continue;
        const factor = augmented[row][col];
        if (Math.abs(factor) < 1e-14) continue;
        for (let k = 0; k < 2 * n; k += 1) {
          augmented[row][k] -= factor * augmented[col][k];
        }
      }
    }

    return augmented.map((row) => row.slice(n));
  }

  function embeddingGeometry(field) {
    if (embeddingGeometryCache.has(field.id)) return embeddingGeometryCache.get(field.id);

    const embeddings = fieldEmbeddingValues(field);
    const matrix = [];
    for (const powers of embeddings) {
      matrix.push(powers.map((power) => power.re));
      matrix.push(powers.map((power) => power.im));
    }

    const geometry = {
      embeddings,
      inverse: invertMatrix(matrix)
    };
    embeddingGeometryCache.set(field.id, geometry);
    return geometry;
  }

  function expandBounds(bounds, linearFactor, extra) {
    const centerX = (bounds.xMin + bounds.xMax) / 2;
    const centerY = (bounds.yMin + bounds.yMax) / 2;
    const halfWidth = (bounds.xMax - bounds.xMin) * linearFactor / 2 + extra;
    const halfHeight = (bounds.yMax - bounds.yMin) * linearFactor / 2 + extra;
    return {
      xMin: centerX - halfWidth,
      xMax: centerX + halfWidth,
      yMin: centerY - halfHeight,
      yMax: centerY + halfHeight
    };
  }

  function boundsContains(outer, inner) {
    const eps = 1e-9;
    return (
      outer.xMin <= inner.xMin + eps &&
      outer.xMax >= inner.xMax - eps &&
      outer.yMin <= inner.yMin + eps &&
      outer.yMax >= inner.yMax - eps
    );
  }

  function coefficientRangesForRegion(field, windowRadius, physicalBounds) {
    const degree = fieldDegree(field);
    const geometry = embeddingGeometry(field);
    const intervals = [
      [physicalBounds.xMin, physicalBounds.xMax],
      [physicalBounds.yMin, physicalBounds.yMax]
    ];

    for (let i = 2; i < degree; i += 1) {
      intervals.push([-windowRadius, windowRadius]);
    }

    const ranges = [];
    let candidateCount = 1;
    for (let coeffIndex = 0; coeffIndex < degree; coeffIndex += 1) {
      let minValue = 0;
      let maxValue = 0;
      for (let row = 0; row < degree; row += 1) {
        const coefficient = geometry.inverse[coeffIndex][row];
        const low = intervals[row][0];
        const high = intervals[row][1];
        if (coefficient >= 0) {
          minValue += coefficient * low;
          maxValue += coefficient * high;
        } else {
          minValue += coefficient * high;
          maxValue += coefficient * low;
        }
      }

      const min = Math.floor(minValue - 1e-9);
      const max = Math.ceil(maxValue + 1e-9);
      const size = Math.max(0, max - min + 1);
      ranges.push({ min, max, size });
      candidateCount *= size;
    }

    return { ranges, candidateCount };
  }

  function datasetPlan(field, windowRadius, viewBounds) {
    const degree = fieldDegree(field);
    const factors = degree >= 8
      ? [1.6, 1.3, 1.1, 1]
      : [DATA_BUFFER_LINEAR_FACTOR, 2.5, 2, 1.6, 1.3, 1.1, 1];
    const extraWorld = degree >= 8 ? 0.1 : DATA_BUFFER_EXTRA_WORLD;
    let fallback = null;

    for (const factor of factors) {
      const bounds = expandBounds(viewBounds, factor, extraWorld);
      const { ranges, candidateCount } = coefficientRangesForRegion(field, windowRadius, bounds);
      const plan = { bounds, ranges, candidateCount };
      if (!fallback || candidateCount < fallback.candidateCount) {
        fallback = plan;
      }
      if (candidateCount <= MAX_DYNAMIC_CANDIDATES) {
        return plan;
      }
    }

    return fallback;
  }

  function isUnitDistance(p, q) {
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const distanceSquared = dx * dx + dy * dy;
    return Math.abs(distanceSquared - UNIT_DISTANCE_SQUARED) <= UNIT_DISTANCE_TOLERANCE;
  }

  function buildUnitDistanceEdges(points) {
    const cellSize = 1;
    const neighborRange = 2;
    const grid = new Map();
    const edges = [];

    const cellKey = (x, y) => x + "," + y;

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const cellX = Math.floor(p.x / cellSize);
      const cellY = Math.floor(p.y / cellSize);

      for (let oy = -neighborRange; oy <= neighborRange; oy += 1) {
        for (let ox = -neighborRange; ox <= neighborRange; ox += 1) {
          const bucket = grid.get(cellKey(cellX + ox, cellY + oy));
          if (!bucket) continue;

          for (const j of bucket) {
            if (isUnitDistance(p, points[j])) {
              edges.push([j, i]);
            }
          }
        }
      }

      const key = cellKey(cellX, cellY);
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(i);
    }

    return edges;
  }

  function buildDataset(field, windowRadius, plan) {
    const started = performance.now();
    const degree = fieldDegree(field);
    const total = plan.candidateCount;
    const embeddings = embeddingGeometry(field).embeddings;
    const internalRadiusSquared = windowRadius * windowRadius;
    const coeffs = new Array(degree).fill(0);
    const sizes = plan.ranges.map((range) => range.size);
    const lows = plan.ranges.map((range) => range.min);
    const points = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let code = 0; code < total; code += 1) {
      let value = code;
      for (let i = 0; i < degree; i += 1) {
        coeffs[i] = lows[i] + (value % sizes[i]);
        value = Math.floor(value / sizes[i]);
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
          if (
            x < plan.bounds.xMin - 1e-9 ||
            x > plan.bounds.xMax + 1e-9 ||
            y < plan.bounds.yMin - 1e-9 ||
            y > plan.bounds.yMax + 1e-9
          ) {
            accepted = false;
            break;
          }
        } else if (normSquared > internalRadiusSquared + 1e-9) {
          accepted = false;
          break;
        }
      }

      if (accepted) {
        const pointCoeffs = coeffs.slice();
        points.push({
          x,
          y,
          coeffs: pointCoeffs,
          rootPower: field.type === "cyclotomic" ? rootOfUnityPower(field, pointCoeffs) : null
        });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const edges = buildUnitDistanceEdges(points);

    const dataset = {
      field,
      windowRadius,
      points,
      edges,
      queryBounds: plan.bounds,
      candidateCount: total,
      bounds: { minX, minY, maxX, maxY },
      buildMs: performance.now() - started,
      exactPhysicalCrop: false
    };
    return dataset;
  }

  function ensureDataset(field, windowRadius, viewBounds) {
    const current = state.dataset;
    if (
      current &&
      current.field.id === field.id &&
      current.windowRadius === windowRadius &&
      current.queryBounds &&
      boundsContains(current.queryBounds, viewBounds)
    ) {
      return current;
    }

    const plan = datasetPlan(field, windowRadius, viewBounds);
    const dataset = buildDataset(field, windowRadius, plan);
    state.dataset = dataset;
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

  function distanceKey(distanceSquared) {
    return String(Math.round(distanceSquared * DISTANCE_KEY_SCALE));
  }

  function distanceSquaredFromKey(key) {
    return Number(key) / DISTANCE_KEY_SCALE;
  }

  function positiveMod(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
  }

  function coefficientKey(coeffs) {
    return coeffs.join(",");
  }

  function coefficientsFromKey(key) {
    return key.startsWith("alg:")
      ? key.slice(4).split(",").map((value) => Number(value))
      : null;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function clamp(min, value, max) {
    return Math.max(min, Math.min(max, value));
  }

  function colorWithAlpha(color, alpha) {
    if (!color || color[0] !== "#" || (color.length !== 7 && color.length !== 4)) {
      return color || "rgba(240, 160, 0, " + alpha + ")";
    }
    const full = color.length === 4
      ? "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      : color;
    const r = parseInt(full.slice(1, 3), 16);
    const g = parseInt(full.slice(3, 5), 16);
    const b = parseInt(full.slice(5, 7), 16);
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function distanceColor(row) {
    if (!row) return DISTANCE_COLORS[0];
    return DISTANCE_COLORS[hashString(row.key) % DISTANCE_COLORS.length];
  }

  function leaderEdgeStroke(row, alpha) {
    return colorWithAlpha(distanceColor(row), alpha);
  }

  function leaderEdgeLineWidth(multiplier) {
    const base = Math.pow(Math.max(1, state.scale) / 80, 0.9);
    return clamp(0.14 * multiplier, base * multiplier, 2.4 * multiplier);
  }

  function canonicalDifferenceKey(coeffs) {
    let sign = 1;
    for (const coefficient of coeffs) {
      if (coefficient < 0) {
        sign = -1;
        break;
      }
      if (coefficient > 0) break;
    }
    return coeffs.map((coefficient) => sign * coefficient).join(",");
  }

  function basisProductCoefficients(field, leftIndex, rightIndex) {
    const degree = fieldDegree(field);
    const coeffs = new Array(degree).fill(0);
    if (leftIndex === 0) {
      coeffs[rightIndex] = 1;
      return coeffs;
    }
    if (rightIndex === 0) {
      coeffs[leftIndex] = 1;
      return coeffs;
    }

    const direct = leftIndex + "," + rightIndex;
    const reverse = rightIndex + "," + leftIndex;
    const product = field.productTable[direct] || field.productTable[reverse];
    if (!product) {
      throw new Error("Missing product table entry for " + field.id + ": " + direct);
    }
    return product;
  }

  function multiplyBasisCoefficients(field, leftCoeffs, rightCoeffs) {
    const degree = fieldDegree(field);
    const coeffs = new Array(degree).fill(0);
    for (let i = 0; i < degree; i += 1) {
      const left = leftCoeffs[i];
      if (!left) continue;
      for (let j = 0; j < degree; j += 1) {
        const right = rightCoeffs[j];
        if (!right) continue;
        const product = basisProductCoefficients(field, i, j);
        const scale = left * right;
        for (let k = 0; k < degree; k += 1) {
          coeffs[k] += scale * product[k];
        }
      }
    }
    return coeffs;
  }

  function squaredDistanceCoefficientKey(field, diffCoeffs) {
    const degree = fieldDegree(field);
    const coeffs = new Array(degree).fill(0);

    if (field.productTable && field.conjugateSigns) {
      const conjugateCoeffs = diffCoeffs.map((coefficient, index) => {
        return coefficient * field.conjugateSigns[index];
      });
      return "alg:" + coefficientKey(multiplyBasisCoefficients(field, diffCoeffs, conjugateCoeffs));
    }

    for (let i = 0; i < degree; i += 1) {
      const left = diffCoeffs[i];
      if (!left) continue;
      for (let j = 0; j < degree; j += 1) {
        const right = diffCoeffs[j];
        if (!right) continue;
        const scale = left * right;
        const power = positiveMod(i - j, field.m);
        const reduced = reducePowerCoefficients(field, power);
        for (let k = 0; k < degree; k += 1) {
          coeffs[k] += scale * reduced[k];
        }
      }
    }

    return "alg:" + coefficientKey(coeffs);
  }

  function unitDistanceCoefficientKey(field) {
    const coeffs = new Array(fieldDegree(field)).fill(0);
    coeffs[0] = 1;
    return "alg:" + coefficientKey(coeffs);
  }

  function pairDistanceRaceKey(field, p, q, approximateDistanceSquared, cache) {
    if (!p.coeffs || !q.coeffs || p.coeffs.length !== q.coeffs.length) {
      return "num:" + distanceKey(approximateDistanceSquared);
    }

    const diffCoeffs = new Array(p.coeffs.length);
    for (let i = 0; i < p.coeffs.length; i += 1) {
      diffCoeffs[i] = p.coeffs[i] - q.coeffs[i];
    }

    const diffKey = canonicalDifferenceKey(diffCoeffs);
    let squaredKey = cache.get(diffKey);
    if (!squaredKey) {
      squaredKey = squaredDistanceCoefficientKey(field, diffCoeffs);
      cache.set(diffKey, squaredKey);
    }
    return squaredKey;
  }

  function formatDistanceSquared(value) {
    const nearestInteger = Math.round(value);
    if (Math.abs(value - nearestInteger) < 1e-6) return String(nearestInteger);
    const decimals = value < 10 ? 3 : value < 100 ? 2 : 1;
    return value.toFixed(decimals).replace(/\.?0+$/, "");
  }

  function formatDistanceDecimal(distanceSquared) {
    const distance = Math.sqrt(Math.max(0, distanceSquared));
    const nearestInteger = Math.round(distance);
    if (Math.abs(distance - nearestInteger) < 1e-6) return String(nearestInteger);
    const decimals = distance < 10 ? 4 : distance < 100 ? 3 : 2;
    return distance.toFixed(decimals).replace(/\.?0+$/, "");
  }

  function superscriptNumber(value) {
    const digits = {
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
    return String(value).split("").map((character) => digits[character] || character).join("");
  }

  function formatZetaPower(field, power) {
    const generator = field.id === "gaussian" ? "i" : "ζ";
    if (power === 1) return generator;
    return generator + superscriptNumber(power);
  }

  function formatBasisElement(field, index) {
    if (field.type === "cyclotomic") return formatZetaPower(field, index);
    return field.basisLabels && field.basisLabels[index] ? field.basisLabels[index] : "e" + index;
  }

  function formatFieldInteger(field, coeffs) {
    const terms = [];
    for (let i = 0; i < coeffs.length; i += 1) {
      const coefficient = coeffs[i];
      if (coefficient === 0) continue;

      const magnitude = Math.abs(coefficient);
      let body = "";
      if (i === 0) {
        body = String(magnitude);
      } else {
        const basis = formatBasisElement(field, i);
        body = magnitude === 1 ? basis : magnitude + " " + basis;
      }

      terms.push({
        sign: coefficient < 0 ? "-" : "+",
        body
      });
    }

    if (!terms.length) return "0";

    let expression = terms[0].sign === "-" ? "- " + terms[0].body : terms[0].body;
    for (let i = 1; i < terms.length; i += 1) {
      expression += " " + terms[i].sign + " " + terms[i].body;
    }
    return expression;
  }

  function plainIntegerCoefficient(coeffs) {
    if (!coeffs || !coeffs.length) return null;
    for (let i = 1; i < coeffs.length; i += 1) {
      if (coeffs[i] !== 0) return null;
    }
    return coeffs[0];
  }

  function exactDistanceText(field, row) {
    const coeffs = coefficientsFromKey(row.key);
    if (!coeffs) return null;

    const integerValue = plainIntegerCoefficient(coeffs);
    if (integerValue !== null && integerValue >= 0) {
      const root = Math.sqrt(integerValue);
      if (Math.abs(root - Math.round(root)) < 1e-9) return String(Math.round(root));
      return "√" + String(integerValue);
    }

    return null;
  }

  function distanceLabelHtml(field, row) {
    const exact = exactDistanceText(field, row);
    const decimal = formatDistanceDecimal(row.distanceSquared);
    const decimalText = "= " + decimal;
    if (!exact) {
      const title = "d " + decimalText + "; d^2 = " + formatDistanceSquared(row.distanceSquared);
      return "<span class=\"race-exact\" title=\"" + escapeAttribute(title) + "\">" +
        escapeHtml("d " + decimalText) + "</span>";
    }

    const exactHtml = escapeHtml("d = " + exact);
    const repeatsExact = exact === decimal;
    const title = repeatsExact
      ? "d = " + exact + "; d^2 = " + formatDistanceSquared(row.distanceSquared)
      : "d = " + exact + " " + decimalText + "; d^2 = " + formatDistanceSquared(row.distanceSquared);
    if (repeatsExact) {
      return "<span class=\"race-exact\" title=\"" + escapeAttribute(title) + "\">" + exactHtml + "</span>";
    }

    return (
      "<span class=\"race-exact\" title=\"" + escapeAttribute(title) + "\">" + exactHtml + "</span>" +
      "<span class=\"race-decimal\">" + escapeHtml(decimalText) + "</span>"
    );
  }

  function formatFieldLabelHtml(field) {
    const generator = field.generatorHtml || field.generator || "ζ<sub>" + field.m + "</sub>";
    return "<span class=\"field-label\"><strong>Q</strong>(" + generator + ")</span>";
  }

  function fieldRelationText(field) {
    return field.relationText || "Z[ζ], ζ" + superscriptNumber(field.m) + " = 1";
  }

  function zetaDefinitionText(field) {
    if (field.definitionText) return field.definitionText;
    if (field.id === "gaussian") return "i = √-1";
    return "ζ = exp(2πi/" + field.m + ")";
  }

  function reducePowerCoefficients(field, power) {
    const modulus = PHI[field.m];
    const degree = modulus.length - 1;
    const coeffs = new Array(Math.max(power + 1, degree)).fill(0);
    coeffs[power] = 1;

    for (let i = coeffs.length - 1; i >= degree; i -= 1) {
      const coefficient = coeffs[i] || 0;
      if (coefficient === 0) continue;
      const offset = i - degree;
      for (let j = 0; j <= degree; j += 1) {
        coeffs[offset + j] -= coefficient * modulus[j];
      }
    }

    return coeffs.slice(0, degree);
  }

  function rootPowerCoefficients(field) {
    if (rootPowerCoefficientCache.has(field.id)) {
      return rootPowerCoefficientCache.get(field.id);
    }

    const roots = [];
    for (let power = 0; power < field.m; power += 1) {
      roots.push({
        power,
        coeffs: reducePowerCoefficients(field, power)
      });
    }
    rootPowerCoefficientCache.set(field.id, roots);
    return roots;
  }

  function coefficientsEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function rootOfUnityPower(field, coeffs) {
    for (const root of rootPowerCoefficients(field)) {
      if (coefficientsEqual(coeffs, root.coeffs)) {
        return root.power;
      }
    }
    return null;
  }

  function tooltipHitRadius() {
    const pointRadius = Math.max(0.85, Math.min(3.8, state.scale * 0.018));
    return Math.max(7, pointRadius + 5);
  }

  function nearestPointAt(sx, sy) {
    const dataset = state.dataset;
    if (!dataset || !state.showPoints || state.dragging) return null;

    const world = screenToWorld(sx, sy);
    const maxWorldDistance = tooltipHitRadius() / state.scale;
    const maxWorldDistanceSquared = maxWorldDistance * maxWorldDistance;
    let nearest = null;
    let nearestDistanceSquared = maxWorldDistanceSquared;

    for (const point of dataset.points) {
      const dx = point.x - world.x;
      if (Math.abs(dx) > maxWorldDistance) continue;
      const dy = point.y - world.y;
      if (Math.abs(dy) > maxWorldDistance) continue;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= nearestDistanceSquared) {
        nearest = point;
        nearestDistanceSquared = distanceSquared;
      }
    }

    return nearest;
  }

  function hidePointTooltip() {
    const hadHoverPoint = Boolean(state.hoverPoint);
    state.hoverPoint = null;
    if (tooltipEl) {
      tooltipEl.classList.remove("visible");
      tooltipEl.setAttribute("aria-hidden", "true");
    }
    if (hadHoverPoint) {
      state.dirty = true;
      requestDraw();
    }
  }

  function positionPointTooltip(sx, sy) {
    if (!tooltipEl) return;
    const margin = 12;
    const offset = 14;
    const width = tooltipEl.offsetWidth;
    const height = tooltipEl.offsetHeight;
    let left = sx + offset;
    let top = sy + offset;

    if (left + width + margin > state.width) {
      left = sx - width - offset;
    }
    if (top + height + margin > state.height) {
      top = sy - height - offset;
    }

    left = Math.max(margin, Math.min(state.width - width - margin, left));
    top = Math.max(margin, Math.min(state.height - height - margin, top));
    tooltipEl.style.transform = "translate(" + Math.round(left) + "px, " + Math.round(top) + "px)";
  }

  function updatePointTooltip(event) {
    if (!tooltipEl) return;

    const point = nearestPointAt(event.clientX, event.clientY);
    if (!point || !point.coeffs) {
      hidePointTooltip();
      return;
    }

    const hoverChanged = state.hoverPoint !== point;
    if (hoverChanged) {
      const field = currentField();
      const expressionEl = document.createElement("div");
      const noteEl = document.createElement("div");
      expressionEl.className = "tooltip-expression";
      noteEl.className = "tooltip-note";
      expressionEl.textContent = formatFieldInteger(field, point.coeffs);
      noteEl.textContent = zetaDefinitionText(field);
      tooltipEl.replaceChildren(expressionEl, noteEl);
      state.hoverPoint = point;
      state.dirty = true;
      requestDraw();
    }

    tooltipEl.classList.add("visible");
    tooltipEl.setAttribute("aria-hidden", "false");
    positionPointTooltip(event.clientX, event.clientY);
  }

  function buildDistanceRace(field, points, pointIndices, selectedKey) {
    const n = pointIndices.length;
    const pairCount = n * (n - 1) / 2;
    if (n < 2) {
      return { exact: true, pointCount: n, pairCount, rows: [], unitCount: 0, leader: null };
    }
    if (pairCount > DISTANCE_RACE_PAIR_LIMIT) {
      return { exact: false, pointCount: n, pairCount, rows: [], unitCount: null, leader: null };
    }

    const counts = new Map();
    const keyCache = new Map();
    for (let a = 0; a < n; a += 1) {
      const p = points[pointIndices[a]];
      for (let b = a + 1; b < n; b += 1) {
        const q = points[pointIndices[b]];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distanceSquared = dx * dx + dy * dy;
        const key = pairDistanceRaceKey(field, p, q, distanceSquared, keyCache);
        let entry = counts.get(key);
        if (!entry) {
          entry = {
            key,
            distanceSquared,
            count: 0,
            rank: 0
          };
          counts.set(key, entry);
        }
        entry.count += 1;
      }
    }

    const entries = Array.from(counts.values()).sort((a, b) => (
      b.count - a.count ||
      a.distanceSquared - b.distanceSquared
    ));
    for (let i = 0; i < entries.length; i += 1) {
      entries[i].rank = i + 1;
    }

    const unitEntry = counts.get(unitDistanceCoefficientKey(field)) || counts.get("num:" + distanceKey(UNIT_DISTANCE_SQUARED)) || null;
    const selectedEntry = selectedKey ? counts.get(selectedKey) || null : null;
    const rows = entries.slice(0, DISTANCE_RACE_ROWS);
    if (unitEntry && !rows.includes(unitEntry)) {
      if (rows.length >= DISTANCE_RACE_ROWS) rows.pop();
      rows.push(unitEntry);
    }
    if (selectedEntry && !rows.includes(selectedEntry)) {
      if (rows.length >= DISTANCE_RACE_ROWS) {
        let replaceIndex = rows.length - 1;
        for (let i = rows.length - 1; i >= 0; i -= 1) {
          if (rows[i] !== unitEntry && rows[i] !== entries[0]) {
            replaceIndex = i;
            break;
          }
        }
        rows.splice(replaceIndex, 1);
      }
      rows.push(selectedEntry);
    }

    return {
      exact: true,
      pointCount: n,
      pairCount,
      rows,
      unitCount: unitEntry ? unitEntry.count : 0,
      leader: entries[0] || null,
      selected: selectedEntry
    };
  }

  function buildDistanceEdges(field, points, pointIndices, targetKey) {
    if (!targetKey) return [];
    const edges = [];
    const keyCache = new Map();

    for (let a = 0; a < pointIndices.length; a += 1) {
      const i = pointIndices[a];
      const p = points[i];
      for (let b = a + 1; b < pointIndices.length; b += 1) {
        const j = pointIndices[b];
        const q = points[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const distanceSquared = dx * dx + dy * dy;
        if (pairDistanceRaceKey(field, p, q, distanceSquared, keyCache) === targetKey) {
          edges.push([i, j]);
        }
      }
    }

    return edges;
  }

  function isUnitDistanceRow(row) {
    return row && Math.abs(row.distanceSquared - UNIT_DISTANCE_SQUARED) < 1 / DISTANCE_KEY_SCALE;
  }

  function distanceRaceHtml(field, race, selectedKey) {
    if (!race) return "";
    let html =
      "<div class=\"distance-race\">" +
      "<div class=\"race-heading\"><strong>distance race</strong><span>C(" +
      formatNumber(race.pointCount) + ", 2) = " + formatNumber(race.pairCount) + " pairs</span></div>";

    if (!race.exact) {
      return html +
        "<div class=\"race-note\">paused above " +
        formatNumber(DISTANCE_RACE_PAIR_LIMIT) + " pairs</div></div>";
    }

    if (!race.rows.length) {
      return html + "<div class=\"race-note\">no pairs in lens</div></div>";
    }

    const maxCount = Math.max(1, race.leader ? race.leader.count : 1);
    for (const row of race.rows) {
      const isUnit = isUnitDistanceRow(row);
      const width = Math.max(1.5, 100 * row.count / maxCount);
      const rowColor = distanceColor(row);
      html +=
        "<div class=\"race-row" +
        (row.rank === 1 ? " leader" : "") +
        (isUnit ? " unit" : "") +
        (row.key === selectedKey ? " selected" : "") +
        "\" data-distance-key=\"" + escapeAttribute(row.key) +
        "\" role=\"button\" tabindex=\"0\" aria-pressed=\"" + (row.key === selectedKey ? "true" : "false") +
        "\" title=\"" + (row.key === selectedKey ? "Show the winner again" : "Show this distance") +
        "\" style=\"--race-color:" + escapeAttribute(rowColor) +
        "\">" +
        "<span class=\"race-label\">" + distanceLabelHtml(field, row) + "</span>" +
        "<span class=\"race-track\"><span class=\"race-fill\" style=\"width:" +
        width.toFixed(1) + "%\"></span></span>" +
        "<strong class=\"race-count\">" + formatNumber(row.count) + "</strong>" +
        "</div>";
    }

    return html + "</div>";
  }

  function shownDistanceHtml(field, race, activeDistance) {
    if (!race || !race.exact || !activeDistance) return "";
    const mode = race.selected ? "selected" : "winner";
    const title = "showing " + (race.selected ? "selected distance" : "winner");
    return (
      "<div class=\"shown-distance" + (race.selected ? " selected" : "") +
      "\" title=\"" + escapeAttribute(title) +
      "\" style=\"--race-color:" + escapeAttribute(distanceColor(activeDistance)) + "\">" +
      "<span class=\"shown-label\">" + mode + "</span>" +
      "<span class=\"race-label\">" + distanceLabelHtml(field, activeDistance) + "</span>" +
      "</div>"
    );
  }

  function isMobileFieldDrawer() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  function setFieldPanelOpen(open) {
    if (!fieldPanelEl) return;
    const shouldOpen = Boolean(open);
    fieldPanelEl.classList.toggle("open", shouldOpen);
    if (fieldBackdropEl) {
      fieldBackdropEl.classList.toggle("visible", shouldOpen);
    }
    if (fieldPanelToggleButton) {
      fieldPanelToggleButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    }
    if (shouldOpen) {
      requestAnimationFrame(renderFieldPosetEdges);
    }
  }

  function toggleFieldPanel() {
    setFieldPanelOpen(!fieldPanelEl || !fieldPanelEl.classList.contains("open"));
  }

  function closeFieldPanel() {
    setFieldPanelOpen(false);
  }

  function lensScreenGeometry() {
    const margin = 16;
    let left = margin;
    let top = margin;
    let right = state.width - margin;
    let bottom = state.height - margin;

    if (toolbarEl) {
      const rect = toolbarEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        top = Math.max(top, Math.min(state.height - margin, rect.bottom + margin));
      }
    }

    if (fieldPanelEl && !isMobileFieldDrawer()) {
      const rect = fieldPanelEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.left <= margin * 2) {
          left = Math.max(left, Math.min(state.width - margin, rect.right + margin));
        }
      }
    }

    if (statusEl) {
      const rect = statusEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        bottom = Math.min(bottom, Math.max(margin, rect.top - margin));
      }
    }

    if (right - left < 96) {
      left = margin;
      right = state.width - margin;
    }
    if (bottom - top < 96) {
      top = margin;
      bottom = state.height - margin;
    }

    const radius = Math.max(24, Math.min((right - left) / 2, (bottom - top) / 2));
    return {
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      radius
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
    if (!isMobileFieldDrawer()) closeFieldPanel();
    state.dirty = true;
    requestAnimationFrame(renderFieldPosetEdges);
    requestDraw();
  }

  function placeWorldPointAtScreen(worldX, worldY, sx, sy) {
    state.centerX = worldX - (sx - state.width / 2) / state.scale;
    state.centerY = worldY + (sy - state.height / 2) / state.scale;
  }

  function placeOriginAtLensCenter() {
    const lens = lensScreenGeometry();
    placeWorldPointAtScreen(0, 0, lens.x, lens.y);
  }

  function fitInitial() {
    const field = currentField();
    state.scale = Math.max(22, Math.min(1200, lensScreenGeometry().radius / field.defaultLensWorldRadius));
    placeOriginAtLensCenter();
    state.autoFitPending = true;
    state.dirty = true;
    requestDraw();
  }

  function goHome() {
    placeOriginAtLensCenter();
    state.dirty = true;
    requestDraw();
  }

  function zoomAt(sx, sy, factor) {
    const before = screenToWorld(sx, sy);
    state.scale = Math.max(8, Math.min(1200, state.scale * factor));
    placeWorldPointAtScreen(before.x, before.y, sx, sy);
    state.dirty = true;
    requestDraw();
  }

  function zoomAtLensCenter(factor) {
    const lens = lensScreenGeometry();
    zoomAt(lens.x, lens.y, factor);
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

  function drawLensShade(lens) {
    ctx.save();
    ctx.fillStyle = "rgba(208, 211, 214, 0.34)";
    ctx.beginPath();
    ctx.rect(0, 0, state.width, state.height);
    ctx.arc(lens.x, lens.y, lens.radius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(22,24,29,0.46)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawEdgeSegments(edgeList, points, strokeStyle, lineWidth, predicate) {
    if (!edgeList.length) return 0;

    let drawn = 0;
    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    for (const [i, j] of edgeList) {
      if (predicate && !predicate(i, j)) continue;
      const p = points[i];
      const q = points[j];
      const ps = worldToScreen(p.x, p.y);
      const qs = worldToScreen(q.x, q.y);
      ctx.moveTo(ps.x, ps.y);
      ctx.lineTo(qs.x, qs.y);
      drawn += 1;
    }
    if (drawn > 0) ctx.stroke();
    ctx.restore();
    return drawn;
  }

  function drawHoverPointHalo(point) {
    if (!point) return;
    const ps = worldToScreen(point.x, point.y);
    const radius = Math.max(5, Math.min(9, state.scale * 0.034));
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.strokeStyle = "rgba(20, 20, 20, 0.86)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(ps.x, ps.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function captureRaceRowRects() {
    const rects = new Map();
    if (!statusEl) return rects;
    for (const row of statusEl.querySelectorAll(".race-row[data-distance-key]")) {
      rects.set(row.dataset.distanceKey, row.getBoundingClientRect());
    }
    return rects;
  }

  function animateRaceRows(previousRects) {
    if (!statusEl || !previousRects || !previousRects.size) return;

    for (const row of statusEl.querySelectorAll(".race-row[data-distance-key]")) {
      const previous = previousRects.get(row.dataset.distanceKey);
      if (!previous) {
        row.classList.add("entering");
        requestAnimationFrame(() => row.classList.remove("entering"));
        continue;
      }

      const next = row.getBoundingClientRect();
      const dx = previous.left - next.left;
      const dy = previous.top - next.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      row.style.transition = "none";
      row.style.transform = "translate(" + dx.toFixed(2) + "px, " + dy.toFixed(2) + "px)";
      row.style.zIndex = dy > 0 ? "2" : "1";
      row.getBoundingClientRect();
      requestAnimationFrame(() => {
        row.style.transition = "";
        row.style.transform = "";
        row.style.zIndex = "";
      });
    }
  }

  function render() {
    state.dirty = false;
    const field = currentField();
    const viewBounds = visibleBounds(24);
    const dataset = ensureDataset(field, state.windowRadius, viewBounds);
    const points = dataset.points;
    const edges = dataset.edges;

    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#f8f7f2";
    ctx.fillRect(0, 0, state.width, state.height);

    const drawBounds = visibleBounds(12);
    const lens = lensScreenGeometry();
    const lensRadiusSquared = lens.radius * lens.radius;
    const visible = new Uint8Array(points.length);
    const inLens = new Uint8Array(points.length);
    const lensIndices = [];
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
      const dx = ps.x - lens.x;
      const dy = ps.y - lens.y;
      if (dx * dx + dy * dy <= lensRadiusSquared) {
        inLens[i] = 1;
        lensIndices.push(i);
        lensPoints += 1;
      }
    }

    const drawEdgeLimit = 900000;
    const countEdgeLimit = 1600000;
    const distanceRace = buildDistanceRace(field, points, lensIndices, state.selectedDistanceKey);
    const activeDistance = distanceRace.selected || distanceRace.leader;
    const winningEdges = distanceRace.exact && activeDistance
      ? buildDistanceEdges(field, points, lensIndices, activeDistance.key)
      : [];
    let lensEdges = 0;

    if (distanceRace.exact) {
      lensEdges = distanceRace.unitCount;
    } else if (edges.length <= countEdgeLimit) {
      for (const [i, j] of edges) {
        if (inLens[i] && inLens[j]) lensEdges += 1;
      }
    }

    if (state.showEdges && winningEdges.length <= drawEdgeLimit) {
      drawEdgeSegments(
        winningEdges,
        points,
        leaderEdgeStroke(activeDistance, 0.58),
        leaderEdgeLineWidth(1.15)
      );
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

      const rootRadius = Math.max(pointRadius + 1.5, Math.min(6.5, pointRadius * 1.9));
      ctx.save();
      ctx.fillStyle = "#ffd84d";
      ctx.strokeStyle = "#111111";
      ctx.lineWidth = Math.max(1.1, Math.min(2.2, rootRadius * 0.28));
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 1) {
        if (!visible[i]) continue;
        const p = points[i];
        if (p.rootPower === null || p.rootPower === undefined) continue;
        const ps = worldToScreen(p.x, p.y);
        ctx.moveTo(ps.x + rootRadius, ps.y);
        ctx.arc(ps.x, ps.y, rootRadius, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (state.hoverPoint && state.showEdges && winningEdges.length) {
      const hoverPoint = state.hoverPoint;
      const highlightedEdges = drawEdgeSegments(
        winningEdges,
        points,
        leaderEdgeStroke(activeDistance, 0.94),
        leaderEdgeLineWidth(2.65),
        (i, j) => points[i] === hoverPoint || points[j] === hoverPoint
      );
      if (highlightedEdges > 0) drawHoverPointHalo(hoverPoint);
    }

    drawLensShade(lens);

    const lensWorldRadius = lens.radius / state.scale;
    const lensEdgeText = distanceRace.exact
      ? formatNumber(distanceRace.unitCount)
      : edges.length <= countEdgeLimit ? formatNumber(lensEdges) : "paused";

    const previousRaceRects = captureRaceRowRects();
    statusEl.innerHTML =
      "<div class=\"status-top\">" +
      "<div class=\"status-meta\">" +
      "<span class=\"field-heading\">" + formatFieldLabelHtml(field) + "</span><br>" +
      "visible points: <strong>" + formatNumber(lensPoints) + "</strong><br>" +
      "field radius: <strong>" + lensWorldRadius.toFixed(2) + "</strong>" +
      "</div>" +
      shownDistanceHtml(field, distanceRace, activeDistance) +
      "</div>" +
      distanceRaceHtml(field, distanceRace, state.selectedDistanceKey);
    animateRaceRows(previousRaceRects);
    statusEl.title =
      "computed viewport patch: " + formatNumber(points.length) + " points, " +
      formatNumber(edges.length) + " unit distances from " +
      formatNumber(dataset.candidateCount) + " coefficient candidates";

    if (state.autoFitPending) {
      state.autoFitPending = false;
      const targetScale = Math.max(22, Math.min(1200, lensScreenGeometry().radius / field.defaultLensWorldRadius));
      if (Math.abs(targetScale - state.scale) > 0.5) {
        state.scale = targetScale;
        placeOriginAtLensCenter();
        state.dirty = true;
        requestDraw();
      }
    }
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
    hidePointTooltip();
    state.fieldId = field.id;
    state.windowRadius = field.defaultWindow;
    state.selectedDistanceKey = null;
    windowInput.min = String(field.windowMin);
    windowInput.max = String(field.windowMax);
    windowInput.step = String(field.windowStep);
    windowInput.value = String(field.defaultWindow);
    windowInput.disabled = Boolean(field.fullRing);
    if (windowControl) {
      windowControl.classList.toggle("full-ring", Boolean(field.fullRing));
      windowControl.title = field.fullRing
        ? "Full ring of integers"
        : "Window radius W: larger values admit more points";
    }
    if (field.fullRing) {
      windowLabel.innerHTML = "full O<sub>K</sub>";
    } else {
      windowLabel.textContent = "W=" + state.windowRadius.toFixed(1);
    }
    updateFieldPoset();
    state.dataset = null;
    fitInitial();
  }

  function updateWindowRadius() {
    hidePointTooltip();
    state.windowRadius = Number(windowInput.value);
    windowLabel.textContent = "W=" + state.windowRadius.toFixed(1);
    state.dataset = null;
    state.dirty = true;
    requestDraw();
  }

  function initControls() {
    renderFieldPoset();
    setField(state.fieldId);
  }

  function renderFieldPoset() {
    if (!fieldPosetEl) return;

    const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    lines.classList.add("poset-lines");
    lines.setAttribute("aria-hidden", "true");
    fieldPosetEl.replaceChildren(lines);

    for (const node of FIELD_POSET_NODES) {
      const field = node.fieldId ? fieldById.get(node.fieldId) : null;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "field-node";
      button.dataset.posetNode = node.id;
      button.style.setProperty("--x", node.x + "%");
      button.style.setProperty("--y", node.y + "%");
      button.innerHTML = node.labelHtml || formatFieldLabelHtml(field);
      button.title = field ? fieldRelationText(field) : "Q";
      if (field) {
        button.dataset.fieldId = field.id;
        button.setAttribute("aria-label", field.label);
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          setField(field.id);
          if (isMobileFieldDrawer()) closeFieldPanel();
        });
      } else {
        button.disabled = true;
        button.setAttribute("aria-label", "Q");
      }
      fieldPosetEl.appendChild(button);
    }

    updateFieldPoset();
    requestAnimationFrame(renderFieldPosetEdges);
  }

  function renderFieldPosetEdges() {
    if (!fieldPosetEl) return;

    const svg = fieldPosetEl.querySelector(".poset-lines");
    if (!svg) return;

    const rect = fieldPosetEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    svg.replaceChildren();
    svg.setAttribute("viewBox", "0 0 " + rect.width + " " + rect.height);

    for (const [fromId, toId] of FIELD_POSET_EDGES) {
      const from = fieldPosetEl.querySelector("[data-poset-node=\"" + fromId + "\"]");
      const to = fieldPosetEl.querySelector("[data-poset-node=\"" + toId + "\"]");
      if (!from || !to) continue;

      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromRect.left + fromRect.width / 2 - rect.left);
      line.setAttribute("y1", fromRect.top + fromRect.height / 2 - rect.top);
      line.setAttribute("x2", toRect.left + toRect.width / 2 - rect.left);
      line.setAttribute("y2", toRect.top + toRect.height / 2 - rect.top);
      svg.appendChild(line);
    }
  }

  function updateFieldPoset() {
    if (!fieldPosetEl) return;
    const field = currentField();
    for (const button of fieldPosetEl.querySelectorAll(".field-node[data-field-id]")) {
      const selected = button.dataset.fieldId === field.id;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
  }

  function toggleSelectedDistance(key) {
    state.selectedDistanceKey = state.selectedDistanceKey === key ? null : key;
    state.dirty = true;
    requestDraw();
  }

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    hidePointTooltip();
    state.dragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    canvas.classList.add("dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging) {
      updatePointTooltip(event);
      return;
    }
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
    updatePointTooltip(event);
  });

  canvas.addEventListener("pointercancel", () => {
    state.dragging = false;
    canvas.classList.remove("dragging");
    hidePointTooltip();
  });

  canvas.addEventListener("pointerleave", () => {
    if (!state.dragging) hidePointTooltip();
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    hidePointTooltip();
    zoomAtLensCenter(Math.exp(-event.deltaY * 0.001));
  }, { passive: false });

  if (fieldPanelToggleButton) {
    fieldPanelToggleButton.addEventListener("click", toggleFieldPanel);
  }
  if (fieldPanelCloseButton) {
    fieldPanelCloseButton.addEventListener("click", closeFieldPanel);
  }
  if (fieldBackdropEl) {
    fieldBackdropEl.addEventListener("click", closeFieldPanel);
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeFieldPanel();
  });
  statusEl.addEventListener("click", (event) => {
    const row = event.target.closest(".race-row[data-distance-key]");
    if (!row || !statusEl.contains(row)) return;
    toggleSelectedDistance(row.dataset.distanceKey);
  });
  statusEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest(".race-row[data-distance-key]");
    if (!row || !statusEl.contains(row)) return;
    event.preventDefault();
    toggleSelectedDistance(row.dataset.distanceKey);
  });
  homeButton.addEventListener("click", goHome);
  zoomInButton.addEventListener("click", () => zoomAtLensCenter(1.25));
  zoomOutButton.addEventListener("click", () => zoomAtLensCenter(0.8));
  edgesButton.addEventListener("click", () => {
    state.showEdges = !state.showEdges;
    edgesButton.classList.toggle("active", state.showEdges);
    state.dirty = true;
    requestDraw();
  });
  pointsButton.addEventListener("click", () => {
    state.showPoints = !state.showPoints;
    pointsButton.classList.toggle("active", state.showPoints);
    if (!state.showPoints) hidePointTooltip();
    state.dirty = true;
    requestDraw();
  });
  gridButton.addEventListener("click", () => {
    state.showGrid = !state.showGrid;
    gridButton.classList.toggle("active", state.showGrid);
    state.dirty = true;
    requestDraw();
  });
  windowInput.addEventListener("input", updateWindowRadius);
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
