(() => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d", { alpha: false });
  const toolbarEl = document.querySelector(".toolbar");
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

  const PHI = {
    12: [1, 0, -1, 0, 1],
    18: [1, 0, 0, -1, 0, 0, 1],
    24: [1, 0, 0, 0, -1, 0, 0, 0, 1],
    30: [1, 1, 0, -1, -1, -1, 0, 1, 1]
  };

  const FIELDS = [
    {
      id: "zeta12",
      type: "cyclotomic",
      label: "Q(zeta_12)",
      shortLabel: "Z[zeta_12]",
      m: 12,
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
      type: "cyclotomic",
      label: "Q(zeta_18)",
      shortLabel: "Z[zeta_18]",
      m: 18,
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
      type: "cyclotomic",
      label: "Q(zeta_24)",
      shortLabel: "Z[zeta_24]",
      m: 24,
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
      type: "cyclotomic",
      label: "Q(zeta_30)",
      shortLabel: "Z[zeta_30]",
      m: 30,
      defaultLensWorldRadius: 0.4,
      defaultWindow: 4,
      windowMin: 1,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#5d74cf",
      pointStroke: "rgba(35, 54, 139, 0.7)",
      edgeStroke: "rgba(57, 84, 184, 0.28)"
    },
    {
      id: "sawin0",
      type: "multiquadratic",
      label: "Sawin ambient r=0",
      shortLabel: "Z[i]",
      primes: [],
      defaultLensWorldRadius: 5,
      defaultWindow: 1,
      windowMin: 0.5,
      windowMax: 4,
      windowStep: 0.1,
      pointFill: "#225f9c",
      pointStroke: "rgba(25, 76, 128, 0.7)",
      edgeStroke: "rgba(25, 76, 128, 0.32)"
    },
    {
      id: "sawin1",
      type: "multiquadratic",
      label: "Sawin ambient r=1",
      shortLabel: "Z[i,sqrt3]",
      primes: [3],
      defaultLensWorldRadius: 5,
      defaultWindow: 3,
      windowMin: 0.3,
      windowMax: 4,
      windowStep: 0.1,
      pointFill: "#8f5b2c",
      pointStroke: "rgba(103, 61, 25, 0.72)",
      edgeStroke: "rgba(116, 74, 33, 0.3)"
    },
    {
      id: "sawin2",
      type: "multiquadratic",
      label: "Sawin ambient r=2",
      shortLabel: "Z[i,sqrt3,sqrt5]",
      primes: [3, 5],
      defaultLensWorldRadius: 5,
      defaultWindow: 3,
      windowMin: 0.2,
      windowMax: 3,
      windowStep: 0.1,
      pointFill: "#6d6fb7",
      pointStroke: "rgba(64, 66, 139, 0.72)",
      edgeStroke: "rgba(72, 76, 160, 0.28)"
    },
    {
      id: "sawin3",
      type: "multiquadratic",
      label: "Sawin ambient r=3",
      shortLabel: "Z[i,sqrt3,sqrt5,sqrt7]",
      primes: [3, 5, 7],
      defaultLensWorldRadius: 5,
      defaultWindow: 3,
      windowMin: 0.2,
      windowMax: 5,
      windowStep: 0.1,
      pointFill: "#b35478",
      pointStroke: "rgba(130, 50, 83, 0.72)",
      edgeStroke: "rgba(158, 58, 96, 0.28)"
    }
  ];

  const fieldById = new Map(FIELDS.map((field) => [field.id, field]));
  const embeddingGeometryCache = new Map();
  const multiquadraticRealGeometryCache = new Map();
  const squareDiskBenchmarkCache = new Map();
  const UNIT_DISTANCE_SQUARED = 1;
  const UNIT_DISTANCE_TOLERANCE = 1e-8;
  const DATA_BUFFER_AREA_FACTOR = 10;
  const DATA_BUFFER_LINEAR_FACTOR = Math.sqrt(DATA_BUFFER_AREA_FACTOR);
  const DATA_BUFFER_EXTRA_WORLD = 1.25;
  const MAX_DYNAMIC_CANDIDATES = 8000000;
  const MAX_MULTIQ_SCALAR_CANDIDATES = 1000000;

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    centerX: 0,
    centerY: 0,
    scale: 80,
    fieldId: "zeta12",
    windowRadius: 4,
    showEdges: true,
    showPoints: true,
    showGrid: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
    autoFitPending: false,
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

  function multiquadraticEmbeddingValues(primes) {
    const level = primes.length;
    const realDegree = 1 << level;
    const degree = 2 * realDegree;
    const roots = primes.map((prime) => Math.sqrt(prime));
    const basisValues = [];

    for (let mask = 0; mask < realDegree; mask += 1) {
      let value = 1;
      for (let bit = 0; bit < level; bit += 1) {
        if (mask & (1 << bit)) {
          value *= roots[bit];
        }
      }
      basisValues.push(value);
    }

    const embeddings = [];
    for (let signMask = 0; signMask < realDegree; signMask += 1) {
      const powers = new Array(degree);
      for (let mask = 0; mask < realDegree; mask += 1) {
        let value = basisValues[mask];
        for (let bit = 0; bit < level; bit += 1) {
          if ((mask & (1 << bit)) && (signMask & (1 << bit))) {
            value = -value;
          }
        }
        powers[mask] = { re: value, im: 0 };
        powers[realDegree + mask] = { re: 0, im: value };
      }
      embeddings.push(powers);
    }

    return embeddings;
  }

  function fieldDegree(field) {
    if (field.type === "multiquadratic") {
      return 2 * (1 << field.primes.length);
    }
    return PHI[field.m].length - 1;
  }

  function fieldEmbeddingValues(field) {
    if (field.type === "multiquadratic") {
      return multiquadraticEmbeddingValues(field.primes);
    }
    return embeddingValues(field.m);
  }

  function multiquadraticRealGeometry(field) {
    if (multiquadraticRealGeometryCache.has(field.id)) {
      return multiquadraticRealGeometryCache.get(field.id);
    }

    const realDegree = 1 << field.primes.length;
    const embeddings = fieldEmbeddingValues(field);
    const matrix = embeddings.map((powers) => powers.slice(0, realDegree).map((power) => power.re));
    const geometry = {
      matrix,
      inverse: invertMatrix(matrix)
    };
    multiquadraticRealGeometryCache.set(field.id, geometry);
    return geometry;
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
    const factors = [DATA_BUFFER_LINEAR_FACTOR, 2.5, 2, 1.6, 1.3, 1.1, 1];
    let fallback = null;
    const maxCandidates = field.type === "multiquadratic" ? MAX_MULTIQ_SCALAR_CANDIDATES : MAX_DYNAMIC_CANDIDATES;

    for (const factor of factors) {
      const bounds = expandBounds(viewBounds, factor, DATA_BUFFER_EXTRA_WORLD);
      let ranges = null;
      let candidateCount = 0;
      if (field.type === "multiquadratic") {
        candidateCount = multiquadraticPlanCandidateCount(field, windowRadius, bounds);
      } else {
        const rangeInfo = coefficientRangesForRegion(field, windowRadius, bounds);
        ranges = rangeInfo.ranges;
        candidateCount = rangeInfo.candidateCount;
      }
      const plan = { bounds, ranges, candidateCount };
      if (!fallback || candidateCount < fallback.candidateCount) {
        fallback = plan;
      }
      if (candidateCount <= maxCandidates) {
        return plan;
      }
    }

    return fallback;
  }

  function multiquadraticPlanCandidateCount(field, windowRadius, bounds) {
    const xRanges = scalarRangesForMultiquadratic(
      field,
      { min: bounds.xMin, max: bounds.xMax },
      windowRadius
    );
    const yRanges = scalarRangesForMultiquadratic(
      field,
      { min: bounds.yMin, max: bounds.yMax },
      windowRadius
    );
    return xRanges.candidateCount + yRanges.candidateCount;
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

  function scalarRangesForMultiquadratic(field, scalarBounds, windowRadius) {
    const realDegree = 1 << field.primes.length;
    const geometry = multiquadraticRealGeometry(field);
    const intervals = [[scalarBounds.min, scalarBounds.max]];
    for (let i = 1; i < realDegree; i += 1) {
      intervals.push([-windowRadius, windowRadius]);
    }

    const ranges = [];
    let candidateCount = 1;
    for (let coeffIndex = 0; coeffIndex < realDegree; coeffIndex += 1) {
      let minValue = 0;
      let maxValue = 0;
      for (let row = 0; row < realDegree; row += 1) {
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

  function enumerateMultiquadraticScalars(field, scalarBounds, windowRadius) {
    const realDegree = 1 << field.primes.length;
    const geometry = multiquadraticRealGeometry(field);
    const { ranges, candidateCount } = scalarRangesForMultiquadratic(field, scalarBounds, windowRadius);
    const coeffs = new Array(realDegree).fill(0);
    const values = new Array(realDegree).fill(0);
    const candidates = [];

    for (let code = 0; code < candidateCount; code += 1) {
      let value = code;
      for (let i = 0; i < realDegree; i += 1) {
        coeffs[i] = ranges[i].min + (value % ranges[i].size);
        value = Math.floor(value / ranges[i].size);
      }

      let accepted = true;
      for (let row = 0; row < realDegree; row += 1) {
        let embedded = 0;
        for (let col = 0; col < realDegree; col += 1) {
          embedded += coeffs[col] * geometry.matrix[row][col];
        }
        values[row] = embedded;
        if (row === 0) {
          if (embedded < scalarBounds.min - 1e-9 || embedded > scalarBounds.max + 1e-9) {
            accepted = false;
            break;
          }
        } else if (Math.abs(embedded) > windowRadius + 1e-9) {
          accepted = false;
          break;
        }
      }

      if (accepted) {
        candidates.push(values.slice());
      }
    }

    return { candidates, candidateCount };
  }

  function buildMultiquadraticDataset(field, windowRadius, plan) {
    const started = performance.now();
    const xSearch = enumerateMultiquadraticScalars(
      field,
      { min: plan.bounds.xMin, max: plan.bounds.xMax },
      windowRadius
    );
    const ySearch = enumerateMultiquadraticScalars(
      field,
      { min: plan.bounds.yMin, max: plan.bounds.yMax },
      windowRadius
    );
    const points = [];
    const windowRadiusSquared = windowRadius * windowRadius;
    let pairTests = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const xCandidate of xSearch.candidates) {
      const remaining = [];
      let possible = true;
      for (let i = 1; i < xCandidate.length; i += 1) {
        const room = windowRadiusSquared - xCandidate[i] * xCandidate[i];
        if (room < -1e-9) {
          possible = false;
          break;
        }
        remaining.push(room);
      }
      if (!possible) continue;

      for (const yCandidate of ySearch.candidates) {
        pairTests += 1;
        let accepted = true;
        for (let i = 1; i < yCandidate.length; i += 1) {
          if (yCandidate[i] * yCandidate[i] > remaining[i - 1] + 1e-9) {
            accepted = false;
            break;
          }
        }
        if (!accepted) continue;

        const x = xCandidate[0];
        const y = yCandidate[0];
        points.push({ x, y });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    const edges = buildUnitDistanceEdges(points);
    return {
      field,
      windowRadius,
      points,
      edges,
      queryBounds: plan.bounds,
      candidateCount: xSearch.candidateCount + ySearch.candidateCount + pairTests,
      bounds: { minX, minY, maxX, maxY },
      buildMs: performance.now() - started,
      exactPhysicalCrop: false
    };
  }

  function buildDataset(field, windowRadius, plan) {
    if (field.type === "multiquadratic") {
      return buildMultiquadraticDataset(field, windowRadius, plan);
    }

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
        points.push({ x, y });
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

  function benchmarkPreview(title, points) {
    if (!points.length) {
      return "<div class=\"benchmark-preview\"><svg viewBox=\"0 0 88 88\" aria-hidden=\"true\"></svg><span>" + title + "</span></div>";
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const pad = 8;
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const scale = Math.min((88 - 2 * pad) / spanX, (88 - 2 * pad) / spanY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const pointRadius = Math.max(0.7, Math.min(1.55, 9 / Math.sqrt(points.length)));
    const maxDrawn = 1600;
    const stride = Math.max(1, Math.ceil(points.length / maxDrawn));
    let circles = "";

    for (let i = 0; i < points.length; i += stride) {
      const point = points[i];
      const x = 44 + (point.x - centerX) * scale;
      const y = 44 + (point.y - centerY) * scale;
      circles += "<circle cx=\"" + x.toFixed(2) + "\" cy=\"" + y.toFixed(2) + "\" r=\"" + pointRadius.toFixed(2) + "\"></circle>";
    }

    return (
      "<div class=\"benchmark-preview\">" +
      "<svg viewBox=\"0 0 88 88\" aria-hidden=\"true\">" +
      "<g fill=\"#2f3b52\" fill-opacity=\"0.72\">" + circles + "</g>" +
      "</svg><span>" + title + "</span></div>"
    );
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
    state.dirty = true;
    requestDraw();
  }

  function fitInitial() {
    const field = currentField();
    state.centerX = 0;
    state.centerY = 0;
    state.scale = Math.max(22, Math.min(1200, lensScreenGeometry().radius / field.defaultLensWorldRadius));
    state.autoFitPending = true;
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
        lensPoints += 1;
      }
    }

    const drawEdgeLimit = 900000;
    const countEdgeLimit = 1600000;
    const drawEdges = state.showEdges && edges.length <= drawEdgeLimit;
    const countEdges = edges.length <= countEdgeLimit;
    let lensEdges = 0;

    if (drawEdges || countEdges) {
      if (drawEdges) {
        ctx.save();
        ctx.strokeStyle = field.edgeStroke;
        ctx.lineWidth = Math.max(0.35, Math.min(1.05, state.scale * 0.0045));
        ctx.beginPath();
      }

      for (const [i, j] of edges) {
        const lensEdge = inLens[i] && inLens[j];
        if (lensEdge) {
          lensEdges += 1;
          if (drawEdges) {
            const p = points[i];
            const q = points[j];
            const ps = worldToScreen(p.x, p.y);
            const qs = worldToScreen(q.x, q.y);
            ctx.moveTo(ps.x, ps.y);
            ctx.lineTo(qs.x, qs.y);
          }
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

    drawLensShade(lens);

    const diskBenchmark = lensPoints > 3 ? squareDiskBenchmark(lensPoints) : null;
    const lensWorldRadius = lens.radius / state.scale;
    const lensEdgeText = countEdges ? formatNumber(lensEdges) : "paused";
    const diskText = diskBenchmark
      ? (diskBenchmark.exact ? formatNumber(diskBenchmark.edges) : "paused")
      : "0";
    const diskPreview = diskBenchmark && diskBenchmark.exact
      ? benchmarkPreview("circular disk", squareDiskPoints(lensPoints))
      : benchmarkPreview("circular disk", []);

    statusEl.innerHTML =
      "<div class=\"status-grid\"><div>" +
      "<strong>" + field.label + "</strong><br>" +
      "visible points: <strong>" + formatNumber(lensPoints) + "</strong><br>" +
      "unit edges: <strong>" + lensEdgeText + "</strong><br>" +
      "field radius: <strong>" + lensWorldRadius.toFixed(2) + "</strong><br>" +
      "square lattice, circular disk: <strong>" + diskText + "</strong>" +
      "</div><div class=\"benchmark-previews\">" + diskPreview + "</div></div>";
    statusEl.title =
      "computed viewport patch: " + formatNumber(points.length) + " points, " +
      formatNumber(edges.length) + " unit edges from " +
      formatNumber(dataset.candidateCount) + " coefficient candidates";

    if (state.autoFitPending) {
      state.autoFitPending = false;
      const targetScale = Math.max(22, Math.min(1200, lensScreenGeometry().radius / field.defaultLensWorldRadius));
      if (Math.abs(targetScale - state.scale) > 0.5) {
        state.scale = targetScale;
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
    state.fieldId = field.id;
    state.windowRadius = field.defaultWindow;
    windowInput.min = String(field.windowMin);
    windowInput.max = String(field.windowMax);
    windowInput.step = String(field.windowStep);
    windowInput.value = String(field.defaultWindow);
    windowLabel.textContent = "W " + state.windowRadius.toFixed(1);
    fieldSelect.value = field.id;
    state.dataset = null;
    fitInitial();
  }

  function updateWindowRadius() {
    const field = currentField();
    state.windowRadius = Number(windowInput.value);
    windowLabel.textContent = "W " + state.windowRadius.toFixed(1);
    state.dataset = null;
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
