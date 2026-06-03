(() => {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d", { alpha: false });
  const toolbarEl = document.querySelector(".toolbar");
  const statusEl = document.getElementById("status");
  const tooltipEl = document.getElementById("pointTooltip");
  const fieldPanelEl = document.querySelector(".field-panel");
  const fieldInfoEl = document.getElementById("fieldInfo");
  const fieldPosetEl = document.getElementById("fieldPoset");
  const latticeOptionsEl = document.getElementById("latticeOptions");
  const fieldPanelToggleButton = document.getElementById("fieldPanelToggle");
  const fieldPanelCloseButton = document.getElementById("fieldPanelClose");
  const fieldBackdropEl = document.getElementById("fieldBackdrop");
  const windowControl = document.querySelector(".slider-wrap");
  const homeButton = document.getElementById("home");
  const zoomInButton = document.getElementById("zoomIn");
  const zoomOutButton = document.getElementById("zoomOut");
  const edgesButton = document.getElementById("edges");
  const tilesButton = document.getElementById("tiles");
  const pointsButton = document.getElementById("points");
  const gridButton = document.getElementById("grid");
  const saveButton = document.getElementById("save");
  const saveSvgButton = document.getElementById("saveSvg");
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
    24: [1, 0, 0, 0, -1, 0, 0, 0, 1],
    30: [1, 1, 0, -1, -1, -1, 0, 1, 1]
  };

  const SQRT3 = Math.sqrt(3);
  const SQRT11 = Math.sqrt(11);
  const ZETA3_VALUE = { re: -0.5, im: SQRT3 / 2 };
  const OMEGA1_VALUE = { re: 0.5, im: SQRT3 / 2 };
  const ETA11_PLUS = { re: 0.5, im: SQRT11 / 2 };
  const ETA11_MINUS = { re: 0.5, im: -SQRT11 / 2 };
  const OMEGA3_PLUS = { re: 5 / 6, im: SQRT11 / 6 };
  const OMEGA3_MINUS = { re: 5 / 6, im: -SQRT11 / 6 };

  const SQRT_MINUS2_ZETA3_EXACT_ALGEBRA = {
    // Basis order: [1, sqrt(-2), zeta_3, sqrt(-2) zeta_3].
    productTable: {
      "1,1": [-2, 0, 0, 0],
      "1,2": [0, 0, 0, 1],
      "1,3": [0, 0, -2, 0],
      "2,2": [-1, 0, -1, 0],
      "2,3": [0, -1, 0, -1],
      "3,3": [2, 0, 2, 0]
    },
    conjugateMatrix: [
      [1, 0, 0, 0],
      [0, -1, 0, 0],
      [-1, 0, -1, 0],
      [0, 1, 0, 1]
    ]
  };

  const MOSER_BASIS_EXACT_ALGEBRA = {
    // Basis order: [1, omega_1, omega_3, omega_1 omega_3].
    productTable: {
      "1,1": [-1, 1, 0, 0],
      "1,2": [0, 0, 0, 1],
      "1,3": [0, 0, -1, 1],
      "2,2": [-1, 0, "5/3", 0],
      "2,3": [0, -1, 0, "5/3"],
      "3,3": [1, -1, "-5/3", "5/3"]
    },
    conjugateMatrix: [
      [1, 0, 0, 0],
      [1, -1, 0, 0],
      ["5/3", 0, -1, 0],
      ["5/3", "-5/3", -1, 1]
    ]
  };

  const MOSER_OK_EXACT_ALGEBRA = {
    // Basis order: [1, zeta_3, eta, zeta_3 eta], eta = (1 + sqrt(-11)) / 2.
    productTable: {
      "1,1": [-1, -1, 0, 0],
      "1,2": [0, 0, 0, 1],
      "1,3": [0, 0, -1, -1],
      "2,2": [-3, 0, 1, 0],
      "2,3": [0, -3, 0, 1],
      "3,3": [3, 3, -1, -1]
    },
    conjugateMatrix: [
      [1, 0, 0, 0],
      [-1, -1, 0, 0],
      [1, 0, -1, 0],
      [-1, -1, 1, 1]
    ]
  };

  function complexProduct(left, right) {
    return {
      re: left.re * right.re - left.im * right.im,
      im: left.re * right.im + left.im * right.re
    };
  }

  const FIELDS = [
    {
      id: "gaussian",
      type: "cyclotomic",
      label: "Q(i)",
      shortLabel: "Z[i]",
      generator: "i",
      latticeLabelHtml: "O<sub>K</sub> = Z[i]",
      latticeNoteHtml: "full ring of integers",
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
      label: "Q(zeta_3) = Q(sqrt(-3))",
      shortLabel: "Z[zeta_3]",
      generator: "ζ",
      generatorHtml: "ζ_3",
      aliasHtml: "<span class=\"field-label\"><strong>Q</strong>(&radic;-3)</span>",
      latticeLabelHtml: "O<sub>K</sub> = Z[ζ_3]",
      latticeNoteHtml: "full ring of integers",
      latticeX: 50,
      latticeY: 24,
      definitionText: "Q(ζ_3) = Q(√-3), and O_K = Z[ζ_3]",
      relationText: "O_K = Z[ζ_3]; Q(ζ_3) = Q(√-3)",
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
      id: "sqrtMinus3Order",
      fieldGroup: "eisenstein",
      type: "basis",
      label: "Q(zeta_3) = Q(sqrt(-3))",
      shortLabel: "Z[sqrt(-3)]",
      generatorHtml: "ζ_3",
      aliasHtml: "<span class=\"field-label\"><strong>Q</strong>(&radic;-3)</span>",
      latticeLabelHtml: "Z[&radic;-3]",
      latticeNoteHtml: "index 2 suborder of O<sub>K</sub>",
      latticeParentId: "eisenstein",
      latticeX: 50,
      latticeY: 76,
      windowLabelHtml: "full Z[β]",
      windowTitle: "Full displayed order Z[β]",
      basisLabels: ["1", "β"],
      definitionText: "β = √-3; Z[β] is an index 2 suborder of O_K = Z[ζ_3]",
      relationText: "Z[β] ⊂ O_K = Z[ζ_3], β² = -3",
      degree: 2,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: SQRT3 }
        ]
      ],
      conjugateSigns: [1, -1],
      productTable: {
        "1,1": [-3, 0]
      },
      fullRing: true,
      defaultLensWorldRadius: 8,
      defaultWindow: 0,
      windowMin: 0,
      windowMax: 1,
      windowStep: 1,
      pointFill: "#547b8f",
      pointStroke: "rgba(54, 87, 104, 0.72)",
      edgeStroke: "rgba(70, 104, 122, 0.3)"
    },
    {
      id: "sqrtMinus2",
      type: "basis",
      label: "Q(sqrt(-2))",
      shortLabel: "Z[sqrt(-2)]",
      generatorHtml: "√-2",
      latticeLabelHtml: "O<sub>K</sub> = Z[&radic;-2]",
      latticeNoteHtml: "full ring of integers",
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
      latticeLabelHtml: "O<sub>K</sub> = Z[ζ_8]",
      latticeNoteHtml: "full ring of integers",
      latticeX: 50,
      latticeY: 24,
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
      id: "zeta8Suborder",
      fieldGroup: "zeta8",
      type: "basis",
      label: "Q(zeta_8)",
      shortLabel: "Z[i,sqrt(2)]",
      generatorHtml: "ζ_8",
      latticeLabelHtml: "Z[i,&radic;2]",
      latticeNoteHtml: "index 2, generated by subfields",
      latticeParentId: "zeta8",
      latticeX: 50,
      latticeY: 76,
      basisLabels: ["1", "i", "r", "ir"],
      definitionText: "r = √2; Z[i,r] is an index 2 suborder of O_K = Z[ζ_8]",
      relationText: "Z[i,√2] ⊂ O_K = Z[ζ_8]",
      degree: 4,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: 1 },
          { re: Math.SQRT2, im: 0 },
          { re: 0, im: Math.SQRT2 }
        ],
        [
          { re: 1, im: 0 },
          { re: 0, im: 1 },
          { re: -Math.SQRT2, im: 0 },
          { re: 0, im: -Math.SQRT2 }
        ]
      ],
      conjugateSigns: [1, -1, 1, -1],
      productTable: {
        "1,1": [-1, 0, 0, 0],
        "1,2": [0, 0, 0, 1],
        "1,3": [0, 0, -1, 0],
        "2,2": [2, 0, 0, 0],
        "2,3": [0, 2, 0, 0],
        "3,3": [-2, 0, 0, 0]
      },
      defaultLensWorldRadius: 3,
      defaultWindow: 2,
      windowMin: 0.8,
      windowMax: 5,
      windowStep: 0.1,
      pointFill: "#6b719f",
      pointStroke: "rgba(70, 72, 122, 0.72)",
      edgeStroke: "rgba(85, 88, 140, 0.3)"
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
      latticeLabelHtml: "O<sub>K</sub> = Z[ζ_12]",
      latticeNoteHtml: "full ring of integers",
      latticeX: 50,
      latticeY: 24,
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
      id: "zeta12Suborder",
      fieldGroup: "zeta12",
      type: "basis",
      label: "Q(zeta_12)",
      shortLabel: "Z[i,sqrt(3)]",
      generatorHtml: "ζ_12",
      latticeLabelHtml: "Z[i,&radic;3]",
      latticeNoteHtml: "index 2, generated by subfields",
      latticeParentId: "zeta12",
      latticeX: 50,
      latticeY: 76,
      basisLabels: ["1", "i", "r", "ir"],
      definitionText: "r = √3; Z[i,r] is an index 2 suborder of O_K = Z[ζ_12]",
      relationText: "Z[i,√3] ⊂ O_K = Z[ζ_12]",
      degree: 4,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: 1 },
          { re: SQRT3, im: 0 },
          { re: 0, im: SQRT3 }
        ],
        [
          { re: 1, im: 0 },
          { re: 0, im: 1 },
          { re: -SQRT3, im: 0 },
          { re: 0, im: -SQRT3 }
        ]
      ],
      conjugateSigns: [1, -1, 1, -1],
      productTable: {
        "1,1": [-1, 0, 0, 0],
        "1,2": [0, 0, 0, 1],
        "1,3": [0, 0, -1, 0],
        "2,2": [3, 0, 0, 0],
        "2,3": [0, 3, 0, 0],
        "3,3": [-3, 0, 0, 0]
      },
      defaultLensWorldRadius: 2.5,
      defaultWindow: 2.6,
      windowMin: 1,
      windowMax: 8,
      windowStep: 0.1,
      pointFill: "#c4891a",
      pointStroke: "rgba(142, 91, 0, 0.76)",
      edgeStroke: "rgba(174, 114, 12, 0.35)"
    },
    {
      id: "sqrtMinus2SqrtMinus3OK",
      fieldGroup: "sqrtMinus2SqrtMinus3",
      type: "basis",
      label: "Q(sqrt(-2), sqrt(-3))",
      shortLabel: "O_K",
      generatorHtml: "&radic;-2,ζ_3",
      latticeLabelHtml: "O<sub>K</sub> = Z[&radic;-2,ζ_3]",
      latticeNoteHtml: "full ring of integers",
      latticeX: 50,
      latticeY: 24,
      basisLabels: ["1", "a", "z", "az"],
      definitionText: "a = sqrt(-2), z = zeta_3; O_K = Z[a,z]",
      relationText: "O_K = Z[sqrt(-2), zeta_3]",
      degree: 4,
      exactAlgebra: SQRT_MINUS2_ZETA3_EXACT_ALGEBRA,
      embeddings: [
        [
          { re: 1, im: 0 },
          { re: 0, im: Math.SQRT2 },
          { re: -0.5, im: SQRT3 / 2 },
          { re: -Math.sqrt(6) / 2, im: -Math.SQRT2 / 2 }
        ],
        [
          { re: 1, im: 0 },
          { re: 0, im: Math.SQRT2 },
          { re: -0.5, im: -SQRT3 / 2 },
          { re: Math.sqrt(6) / 2, im: -Math.SQRT2 / 2 }
        ]
      ],
      defaultLensWorldRadius: 2.7,
      defaultWindow: 2.4,
      windowMin: 0.8,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#697c34",
      pointStroke: "rgba(73, 88, 35, 0.72)",
      edgeStroke: "rgba(93, 119, 42, 0.32)"
    },
    {
      id: "sqrtMinus2SqrtMinus3",
      fieldGroup: "sqrtMinus2SqrtMinus3",
      type: "basis",
      label: "Q(sqrt(-2), zeta_3)",
      shortLabel: "Z[sqrt(-2), sqrt(-3)]",
      generatorHtml: "&radic;-2,ζ_3",
      aliasHtml: "<span class=\"field-label\"><strong>Q</strong>(&radic;-2,&radic;-3)</span>",
      latticeLabelHtml: "Z[&radic;-2,&radic;-3]",
      latticeNoteHtml: "index 2 suborder",
      latticeParentId: "sqrtMinus2SqrtMinus3OK",
      latticeX: 50,
      latticeY: 76,
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
      id: "moserRing",
      fieldGroup: "moser",
      type: "basis",
      label: "Q(sqrt(-3), sqrt(-11))",
      shortLabel: "Moser ring",
      generatorHtml: "&radic;-3,&radic;-11",
      latticeLabelHtml: "Z[ω_1,ω_3]",
      latticeNoteHtml: "not contained in O_K",
      statusSourceHtml: "Moser ring = Z[ω_1,ω_3]",
      statusSourceNoteHtml: "not in O_K",
      latticeParentId: "moserAmbient",
      latticeX: 30,
      latticeY: 52,
      basisLabels: ["1", "ω_1", "ω_3", "ω_1ω_3"],
      definitionText: "ω_1=(1+√-3)/2, ω_3=(5+√-11)/6; ω_3 is not integral",
      relationText: "Z[ω_1,ω_3] is a subring of K, but it is not contained in O_K",
      degree: 4,
      exactAlgebra: MOSER_BASIS_EXACT_ALGEBRA,
      sampleKind: "moserRing",
      sampleBaseWindow: 1.8,
      embeddings: [
        [
          { re: 1, im: 0 },
          OMEGA1_VALUE,
          OMEGA3_PLUS,
          complexProduct(OMEGA1_VALUE, OMEGA3_PLUS)
        ],
        [
          { re: 1, im: 0 },
          OMEGA1_VALUE,
          OMEGA3_MINUS,
          complexProduct(OMEGA1_VALUE, OMEGA3_MINUS)
        ]
      ],
      defaultLensWorldRadius: 2,
      defaultWindow: 3,
      windowMin: 0,
      windowMax: 6,
      windowStep: 1,
      windowLabelPrefix: "D",
      windowValueFormat: "integer",
      windowTitle: "Moser sample depth D: larger D adds rotated copies; the spindle highlight is always shown in full",
      statusWindowLabel: "sample depth",
      statusWindowValue: "window",
      highlightGraph: "moserChain",
      pointFill: "#c07a36",
      pointStroke: "rgba(125, 70, 24, 0.72)",
      edgeStroke: "rgba(176, 92, 31, 0.32)"
    },
    {
      id: "moserOK",
      fieldGroup: "moser",
      type: "basis",
      label: "Q(sqrt(-3), sqrt(-11))",
      shortLabel: "O_K",
      generatorHtml: "&radic;-3,&radic;-11",
      latticeLabelHtml: "O<sub>K</sub> = Z[ζ_3,η]",
      latticeNoteHtml: "ring of integers; integral",
      statusSourceNoteHtml: "η=(1+&radic;-11)/2",
      latticeParentId: "moserAmbient",
      latticeX: 72,
      latticeY: 52,
      basisLabels: ["1", "ζ", "η", "ζη"],
      definitionText: "η = (1+√-11)/2; O_K = Z[ζ_3,η]",
      relationText: "O_K = Z[ζ_3,(1+√-11)/2]",
      degree: 4,
      exactAlgebra: MOSER_OK_EXACT_ALGEBRA,
      embeddings: [
        [
          { re: 1, im: 0 },
          ZETA3_VALUE,
          ETA11_PLUS,
          complexProduct(ZETA3_VALUE, ETA11_PLUS)
        ],
        [
          { re: 1, im: 0 },
          ZETA3_VALUE,
          ETA11_MINUS,
          complexProduct(ZETA3_VALUE, ETA11_MINUS)
        ]
      ],
      defaultLensWorldRadius: 2,
      defaultWindow: 2.2,
      windowMin: 0.8,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#6f6a9d",
      pointStroke: "rgba(68, 64, 112, 0.72)",
      edgeStroke: "rgba(91, 84, 148, 0.3)"
    },
    {
      id: "moserLattice",
      fieldGroup: "moser",
      type: "basis",
      label: "Q(sqrt(-3), sqrt(-11))",
      shortLabel: "Moser lattice",
      generatorHtml: "&radic;-3,&radic;-11",
      latticeLabelHtml: "Z&langle;1,ω_1,ω_3,ω_1ω_3&rangle;",
      latticeNoteHtml: "rank-4 additive span; not ring",
      statusSourceHtml: "Moser lattice = Z&langle;1,ω_1,ω_3,ω_1ω_3&rangle;",
      latticeParentId: "moserRing",
      latticeX: 30,
      latticeY: 88,
      basisLabels: ["1", "ω_1", "ω_3", "ω_1ω_3"],
      definitionText: "ω_1=(1+√-3)/2, ω_3=(5+√-11)/6; this is a lattice, not O_K",
      relationText: "Moser lattice Z⟨1,ω_1,ω_3,ω_1ω_3⟩ inside Q(√-3,√-11)",
      degree: 4,
      exactAlgebra: MOSER_BASIS_EXACT_ALGEBRA,
      embeddings: [
        [
          { re: 1, im: 0 },
          OMEGA1_VALUE,
          OMEGA3_PLUS,
          complexProduct(OMEGA1_VALUE, OMEGA3_PLUS)
        ],
        [
          { re: 1, im: 0 },
          OMEGA1_VALUE,
          OMEGA3_MINUS,
          complexProduct(OMEGA1_VALUE, OMEGA3_MINUS)
        ]
      ],
      defaultLensWorldRadius: 2,
      defaultWindow: 1.3,
      windowMin: 0.8,
      windowMax: 6,
      windowStep: 0.1,
      pointFill: "#c07a36",
      pointStroke: "rgba(125, 70, 24, 0.72)",
      edgeStroke: "rgba(176, 92, 31, 0.32)"
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
    { id: "rational", labelHtml: "<span class=\"field-label\"><strong>Q</strong></span>", x: 50, degree: 1, disabled: true },
    { id: "gaussian", fieldId: "gaussian", x: 26 },
    { id: "eisenstein", fieldId: "eisenstein", x: 50 },
    { id: "sqrtMinus2", fieldId: "sqrtMinus2", x: 80 },
    { id: "zeta5", fieldId: "zeta5", x: 22 },
    { id: "zeta8", fieldId: "zeta8", x: 39 },
    { id: "zeta12", fieldId: "zeta12", x: 54 },
    { id: "moser", fieldId: "moserRing", labelHtml: "<span class=\"field-label\">Moser</span>", x: 72 },
    { id: "sqrtMinus2SqrtMinus3", fieldId: "sqrtMinus2SqrtMinus3OK", x: 92 },
    { id: "zeta7", fieldId: "zeta7", x: 26 },
    { id: "zeta9", fieldId: "zeta9", x: 54 },
    { id: "zeta30", fieldId: "zeta30", x: 42 },
    { id: "zeta24", fieldId: "zeta24", x: 69 }
  ];
  const FIELD_POSET_TOP_Y = 14;
  const FIELD_POSET_BOTTOM_Y = 90;

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
    ["eisenstein", "moser"],
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
  function fieldGroupId(field) {
    return field.fieldGroup || field.id;
  }

  function fieldVariants(field) {
    const groupId = fieldGroupId(field);
    return FIELDS.filter((candidate) => fieldGroupId(candidate) === groupId);
  }

  const FIELD_POSET_MIN_DEGREE = Math.min(...FIELD_POSET_NODES.map(fieldPosetNodeDegree));
  const FIELD_POSET_MAX_DEGREE = Math.max(...FIELD_POSET_NODES.map(fieldPosetNodeDegree));
  const FIELD_POSET_DEGREES = [...new Set(FIELD_POSET_NODES.map(fieldPosetNodeDegree))]
    .sort((a, b) => b - a);
  const embeddingGeometryCache = new Map();
  const rootPowerCoefficientCache = new Map();
  const exactAlgebraCache = new Map();
  const UNIT_DISTANCE_SQUARED = 1;
  const UNIT_DISTANCE_TOLERANCE = 1e-8;
  const DATA_BUFFER_AREA_FACTOR = 10;
  const DATA_BUFFER_LINEAR_FACTOR = Math.sqrt(DATA_BUFFER_AREA_FACTOR);
  const DATA_BUFFER_EXTRA_WORLD = 1.25;
  const MAX_DYNAMIC_CANDIDATES = 8000000;
  const DISTANCE_RACE_PAIR_LIMIT = 1600000;
  const DISTANCE_RACE_ROWS = 6;
  const MOBILE_DISTANCE_RACE_ROWS = 4;
  const DISTANCE_KEY_SCALE = 1000000;
  const RHOMB_TILE_CANDIDATE_LIMIT = 1200000;
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
  const MOSER_SPINDLE_DEPTH = 1;
  const MOSER_GRAPH_BASE_COEFFS = [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [1, 1, 0, 0]
  ];
  const LOWER_BOUND_DATA = window.UNIT_DISTANCE_LOWER_BOUNDS || null;
  const LOWER_BOUND_ENTRIES = LOWER_BOUND_DATA
    ? Object.keys(LOWER_BOUND_DATA.bounds || {})
      .map((n) => ({ n: Number(n), lowerBound: Number(LOWER_BOUND_DATA.bounds[n]) }))
      .filter((entry) => Number.isFinite(entry.n) && Number.isFinite(entry.lowerBound))
      .sort((a, b) => a.n - b.n)
    : [];
  const LOWER_BOUND_EXACT = new Map(LOWER_BOUND_ENTRIES.map((entry) => [entry.n, entry.lowerBound]));
  const LOWER_BOUND_CACHE = [null];

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
    showTiles: true,
    showPoints: true,
    showGrid: true,
    dragging: false,
    lastX: 0,
    lastY: 0,
    autoFitPending: false,
    dirty: true,
    dataset: null,
    rhombOverlayCache: null,
    rhombBitmapCache: null,
    rhombViewMoving: false,
    rhombViewMotionTimer: 0,
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

  function bigintAbs(value) {
    return value < 0n ? -value : value;
  }

  function bigintGcd(a, b) {
    let x = bigintAbs(a);
    let y = bigintAbs(b);
    while (y) {
      const next = x % y;
      x = y;
      y = next;
    }
    return x || 1n;
  }

  function rational(numerator, denominator) {
    let n = BigInt(numerator);
    let d = denominator === undefined ? 1n : BigInt(denominator);
    if (d === 0n) throw new Error("Zero rational denominator");
    if (n === 0n) return { n: 0n, d: 1n };
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const divisor = bigintGcd(n, d);
    return { n: n / divisor, d: d / divisor };
  }

  function rationalFromLiteral(value) {
    if (value && typeof value === "object" && "n" in value && "d" in value) {
      return rational(value.n, value.d);
    }
    if (typeof value === "bigint") return rational(value, 1n);
    if (typeof value === "number") {
      if (!Number.isInteger(value)) {
        throw new Error("Exact algebra literals must be integers or fraction strings");
      }
      return rational(BigInt(value), 1n);
    }
    const text = String(value).trim();
    if (text.includes("/")) {
      const [n, d] = text.split("/");
      return rational(BigInt(n), BigInt(d));
    }
    return rational(BigInt(text), 1n);
  }

  function rationalIsZero(value) {
    return value.n === 0n;
  }

  function rationalAdd(left, right) {
    return rational(left.n * right.d + right.n * left.d, left.d * right.d);
  }

  function rationalNeg(value) {
    return value.n === 0n ? value : { n: -value.n, d: value.d };
  }

  function rationalSub(left, right) {
    return rationalAdd(left, rationalNeg(right));
  }

  function rationalMul(left, right) {
    if (rationalIsZero(left) || rationalIsZero(right)) return rational(0n, 1n);
    return rational(left.n * right.n, left.d * right.d);
  }

  function rationalKey(value) {
    return value.d === 1n ? String(value.n) : String(value.n) + "/" + String(value.d);
  }

  function rationalVectorFromLiterals(values, degree) {
    const coeffs = new Array(degree);
    for (let i = 0; i < degree; i += 1) {
      coeffs[i] = rationalFromLiteral(i < values.length ? values[i] : 0);
    }
    return coeffs;
  }

  function rationalVectorFromIntegerCoefficients(coeffs) {
    return coeffs.map((coefficient) => rationalFromLiteral(coefficient));
  }

  function rationalZeroVector(degree) {
    return rationalVectorFromLiterals([], degree);
  }

  function rationalUnitVector(degree, index) {
    const coeffs = rationalZeroVector(degree);
    coeffs[index] = rational(1n, 1n);
    return coeffs;
  }

  function rationalVectorKey(coeffs) {
    return coeffs.map(rationalKey).join(",");
  }

  function canonicalRationalVectorKey(coeffs) {
    let sign = 1;
    for (const coefficient of coeffs) {
      if (coefficient.n < 0n) {
        sign = -1;
        break;
      }
      if (coefficient.n > 0n) break;
    }
    const normalized = sign < 0 ? coeffs.map(rationalNeg) : coeffs;
    return rationalVectorKey(normalized);
  }

  function exactAlgebraForField(field) {
    if (!field.exactAlgebra) return null;
    if (exactAlgebraCache.has(field.id)) return exactAlgebraCache.get(field.id);

    const degree = fieldDegree(field);
    const productTable = new Map();
    for (const [key, value] of Object.entries(field.exactAlgebra.productTable || {})) {
      productTable.set(key, rationalVectorFromLiterals(value, degree));
    }
    const conjugateMatrix = field.exactAlgebra.conjugateMatrix.map((row) => {
      return rationalVectorFromLiterals(row, degree);
    });
    const algebra = { degree, productTable, conjugateMatrix };
    exactAlgebraCache.set(field.id, algebra);
    return algebra;
  }

  function hasExactDistanceAlgebra(field) {
    return Boolean(field && field.exactAlgebra);
  }

  function exactBasisProductCoefficients(field, leftIndex, rightIndex) {
    const algebra = exactAlgebraForField(field);
    if (leftIndex === 0) return rationalUnitVector(algebra.degree, rightIndex);
    if (rightIndex === 0) return rationalUnitVector(algebra.degree, leftIndex);

    const direct = leftIndex + "," + rightIndex;
    const reverse = rightIndex + "," + leftIndex;
    const product = algebra.productTable.get(direct) || algebra.productTable.get(reverse);
    if (!product) {
      throw new Error("Missing exact product table entry for " + field.id + ": " + direct);
    }
    return product;
  }

  function addScaledExactVector(out, scale, vector) {
    if (rationalIsZero(scale)) return;
    for (let i = 0; i < out.length; i += 1) {
      if (rationalIsZero(vector[i])) continue;
      out[i] = rationalAdd(out[i], rationalMul(scale, vector[i]));
    }
  }

  function multiplyExactCoefficients(field, leftCoeffs, rightCoeffs) {
    const algebra = exactAlgebraForField(field);
    const coeffs = rationalZeroVector(algebra.degree);
    for (let i = 0; i < algebra.degree; i += 1) {
      const left = leftCoeffs[i];
      if (rationalIsZero(left)) continue;
      for (let j = 0; j < algebra.degree; j += 1) {
        const right = rightCoeffs[j];
        if (rationalIsZero(right)) continue;
        const product = exactBasisProductCoefficients(field, i, j);
        addScaledExactVector(coeffs, rationalMul(left, right), product);
      }
    }
    return coeffs;
  }

  function conjugateExactCoefficients(field, coeffs) {
    const algebra = exactAlgebraForField(field);
    const conjugate = rationalZeroVector(algebra.degree);
    for (let i = 0; i < algebra.degree; i += 1) {
      addScaledExactVector(conjugate, coeffs[i], algebra.conjugateMatrix[i]);
    }
    return conjugate;
  }

  function exactPointCoefficients(point) {
    if (!point) return null;
    if (point.exactCoeffs) return point.exactCoeffs;
    if (!point.coeffs) return null;
    if (!point.exactCoeffCache) {
      point.exactCoeffCache = rationalVectorFromIntegerCoefficients(point.coeffs);
    }
    return point.exactCoeffCache;
  }

  function exactDifferenceCoefficients(left, right) {
    const diff = new Array(left.length);
    for (let i = 0; i < left.length; i += 1) {
      diff[i] = rationalSub(left[i], right[i]);
    }
    return diff;
  }

  function exactSquaredDistanceKey(field, diffCoeffs) {
    const conjugateCoeffs = conjugateExactCoefficients(field, diffCoeffs);
    return "algq:" + rationalVectorKey(multiplyExactCoefficients(field, diffCoeffs, conjugateCoeffs));
  }

  function exactPowerCoefficients(field, generatorIndex, depth) {
    const algebra = exactAlgebraForField(field);
    if (!algebra) return null;
    const powers = [rationalUnitVector(algebra.degree, 0)];
    const generator = rationalUnitVector(algebra.degree, generatorIndex);
    for (let i = 1; i <= depth; i += 1) {
      powers.push(multiplyExactCoefficients(field, powers[i - 1], generator));
    }
    return powers;
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

  function fieldPosetNodeDegree(node) {
    if (node.degree) return node.degree;
    const field = node.fieldId ? fieldById.get(node.fieldId) : null;
    return field ? fieldDegree(field) : 1;
  }

  function fieldPosetYForDegree(degree) {
    if (FIELD_POSET_MAX_DEGREE === FIELD_POSET_MIN_DEGREE) return 50;
    const boundedDegree = clamp(FIELD_POSET_MIN_DEGREE, degree, FIELD_POSET_MAX_DEGREE);
    const t = (boundedDegree - FIELD_POSET_MIN_DEGREE) /
      (FIELD_POSET_MAX_DEGREE - FIELD_POSET_MIN_DEGREE);
    return FIELD_POSET_BOTTOM_Y - t * (FIELD_POSET_BOTTOM_Y - FIELD_POSET_TOP_Y);
  }

  function fieldPosetNodePosition(node) {
    const degree = fieldPosetNodeDegree(node);
    return {
      x: node.x,
      y: fieldPosetYForDegree(degree),
      degree
    };
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
      matrix,
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

  function rotatePointByUnit(x, y, unit) {
    return {
      x: x * unit.re - y * unit.im,
      y: x * unit.im + y * unit.re
    };
  }

  function complexUnitPowers(unit, depth) {
    const powers = [{ re: 1, im: 0 }];
    for (let i = 1; i <= depth; i += 1) {
      powers.push(complexProduct(powers[i - 1], unit));
    }
    return powers;
  }

  function roundedPointKey(x, y) {
    return Math.round(x * 1e9) + "," + Math.round(y * 1e9);
  }

  function pointInsideBounds(x, y, bounds) {
    return (
      x >= bounds.xMin - 1e-9 &&
      x <= bounds.xMax + 1e-9 &&
      y >= bounds.yMin - 1e-9 &&
      y <= bounds.yMax + 1e-9
    );
  }

  function sampleDepth(field, windowRadius) {
    return clamp(field.windowMin || 0, Math.round(windowRadius), field.windowMax || 0);
  }

  function moserRingPhysicalPowers(field, depth) {
    const embeddings = fieldEmbeddingValues(field);
    return complexUnitPowers(embeddings[0][2], depth);
  }

  function moserRingExactPowerCoefficients(field, depth) {
    return hasExactDistanceAlgebra(field) ? exactPowerCoefficients(field, 2, depth) : null;
  }

  function inverseRotatedBoundsForPowers(bounds, powers) {
    const corners = [
      [bounds.xMin, bounds.yMin],
      [bounds.xMin, bounds.yMax],
      [bounds.xMax, bounds.yMin],
      [bounds.xMax, bounds.yMax]
    ];
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;

    for (const power of powers) {
      const inverse = { re: power.re, im: -power.im };
      for (const [x, y] of corners) {
        const p = rotatePointByUnit(x, y, inverse);
        xMin = Math.min(xMin, p.x);
        yMin = Math.min(yMin, p.y);
        xMax = Math.max(xMax, p.x);
        yMax = Math.max(yMax, p.y);
      }
    }

    return { xMin, yMin, xMax, yMax };
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
    const isMoserRingSample = field.sampleKind === "moserRing";
    const depth = isMoserRingSample ? sampleDepth(field, windowRadius) : null;
    const powers = isMoserRingSample ? moserRingPhysicalPowers(field, depth) : null;
    const exactPowers = isMoserRingSample ? moserRingExactPowerCoefficients(field, depth) : null;
    const basisWindowRadius = isMoserRingSample ? field.sampleBaseWindow : windowRadius;
    let fallback = null;

    for (const factor of factors) {
      const queryBounds = expandBounds(viewBounds, factor, extraWorld);
      const bounds = isMoserRingSample
        ? inverseRotatedBoundsForPowers(queryBounds, powers)
        : queryBounds;
      const { ranges, candidateCount } = coefficientRangesForRegion(field, basisWindowRadius, bounds);
      const plan = {
        bounds,
        queryBounds,
        ranges,
        candidateCount,
        sampleDepth: depth,
        samplePowers: powers,
        sampleExactPowers: exactPowers,
        baseWindowRadius: basisWindowRadius
      };
      if (!fallback || candidateCount < fallback.candidateCount) {
        fallback = plan;
      }
      if (candidateCount <= MAX_DYNAMIC_CANDIDATES) {
        return plan;
      }
    }

    return fallback;
  }

  function isUnitDistance(p, q, field, exactUnitKey, keyCache) {
    const dx = p.x - q.x;
    const dy = p.y - q.y;
    const distanceSquared = dx * dx + dy * dy;
    if (field && hasExactDistanceAlgebra(field)) {
      const key = pairDistanceRaceKey(field, p, q, distanceSquared, keyCache || new Map());
      return key === exactUnitKey || key === "num:" + distanceKey(UNIT_DISTANCE_SQUARED);
    }
    return Math.abs(distanceSquared - UNIT_DISTANCE_SQUARED) <= UNIT_DISTANCE_TOLERANCE;
  }

  function buildUnitDistanceEdges(points, field) {
    const cellSize = 1;
    const neighborRange = 2;
    const grid = new Map();
    const edges = [];
    const exactUnitKey = field && hasExactDistanceAlgebra(field) ? unitDistanceCoefficientKey(field) : null;
    const keyCache = new Map();

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
            if (isUnitDistance(p, points[j], field, exactUnitKey, keyCache)) {
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

  function buildBasisDataset(field, windowRadius, plan) {
    const started = performance.now();
    const degree = fieldDegree(field);
    const total = plan.candidateCount;
    const geometry = embeddingGeometry(field);
    const embeddings = geometry.embeddings;
    const matrix = geometry.matrix;
    const internalRadiusSquared = windowRadius * windowRadius;
    const coeffs = new Array(degree).fill(0);
    const realCoords = new Array(degree).fill(0);
    const intervals = [
      [plan.bounds.xMin, plan.bounds.xMax],
      [plan.bounds.yMin, plan.bounds.yMax]
    ];
    for (let row = 2; row < degree; row += 1) {
      intervals.push([-windowRadius, windowRadius]);
    }
    const suffixMin = Array.from({ length: degree + 1 }, () => new Array(degree).fill(0));
    const suffixMax = Array.from({ length: degree + 1 }, () => new Array(degree).fill(0));
    const points = [];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let testedCandidateCount = 0;

    for (let coeffIndex = degree - 1; coeffIndex >= 0; coeffIndex -= 1) {
      for (let row = 0; row < degree; row += 1) {
        const coefficient = matrix[row][coeffIndex];
        const low = plan.ranges[coeffIndex].min;
        const high = plan.ranges[coeffIndex].max;
        const contributionMin = coefficient >= 0 ? coefficient * low : coefficient * high;
        const contributionMax = coefficient >= 0 ? coefficient * high : coefficient * low;
        suffixMin[coeffIndex][row] = suffixMin[coeffIndex + 1][row] + contributionMin;
        suffixMax[coeffIndex][row] = suffixMax[coeffIndex + 1][row] + contributionMax;
      }
    }

    const canComplete = (nextCoeffIndex) => {
      for (let row = 0; row < degree; row += 1) {
        if (realCoords[row] + suffixMax[nextCoeffIndex][row] < intervals[row][0] - 1e-9) return false;
        if (realCoords[row] + suffixMin[nextCoeffIndex][row] > intervals[row][1] + 1e-9) return false;
      }
      return true;
    };

    const visit = (coeffIndex) => {
      if (coeffIndex < degree) {
        const range = plan.ranges[coeffIndex];
        for (let value = range.min; value <= range.max; value += 1) {
          coeffs[coeffIndex] = value;
          for (let row = 0; row < degree; row += 1) {
            realCoords[row] += value * matrix[row][coeffIndex];
          }
          if (canComplete(coeffIndex + 1)) visit(coeffIndex + 1);
          for (let row = 0; row < degree; row += 1) {
            realCoords[row] -= value * matrix[row][coeffIndex];
          }
        }
        return;
      }

      testedCandidateCount += 1;
      let accepted = true;
      const x = realCoords[0];
      const y = realCoords[1];
      if (
        x < plan.bounds.xMin - 1e-9 ||
        x > plan.bounds.xMax + 1e-9 ||
        y < plan.bounds.yMin - 1e-9 ||
        y > plan.bounds.yMax + 1e-9
      ) {
        accepted = false;
      }

      for (let embeddingIndex = 1; accepted && embeddingIndex < embeddings.length; embeddingIndex += 1) {
        const row = embeddingIndex * 2;
        const re = realCoords[row];
        const im = realCoords[row + 1];
        if (re * re + im * im > internalRadiusSquared + 1e-9) {
          accepted = false;
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
    };

    if (canComplete(0)) visit(0);

    const edges = buildUnitDistanceEdges(points, field);

    const dataset = {
      field,
      windowRadius,
      points,
      edges,
      coefficientIndex: buildIntegerCoefficientIndex(points),
      queryBounds: plan.queryBounds || plan.bounds,
      candidateCount: total,
      testedCandidateCount,
      bounds: { minX, minY, maxX, maxY },
      buildMs: performance.now() - started,
      exactPhysicalCrop: false
    };
    return dataset;
  }

  function samplePowerExpression(field, coeffs, powerIndex) {
    const base = formatFieldInteger(field, coeffs);
    if (powerIndex === 0 || base === "0") return base;
    const power = powerIndex === 1 ? "ω_3" : "ω_3^" + powerIndex;
    return base === "1" ? power : power + " · (" + base + ")";
  }

  function physicalPointFromCoefficients(field, coeffs) {
    const powers = fieldEmbeddingValues(field)[0];
    let x = 0;
    let y = 0;
    for (let i = 0; i < coeffs.length; i += 1) {
      x += coeffs[i] * powers[i].re;
      y += coeffs[i] * powers[i].im;
    }
    return { x, y };
  }

  function moserChainGraph(field, depthValue) {
    if (field.highlightGraph !== "moserChain") return null;

    const depth = sampleDepth(field, depthValue);
    const powers = moserRingPhysicalPowers(field, depth);
    const exactPowers = moserRingExactPowerCoefficients(field, depth);
    const points = [];
    const seen = new Map();

    for (let powerIndex = 0; powerIndex < powers.length; powerIndex += 1) {
      const power = powers[powerIndex];
      for (const coeffs of MOSER_GRAPH_BASE_COEFFS) {
        const basePoint = physicalPointFromCoefficients(field, coeffs);
        const point = rotatePointByUnit(basePoint.x, basePoint.y, power);
        const exactCoeffs = exactPowers
          ? multiplyExactCoefficients(field, exactPowers[powerIndex], rationalVectorFromIntegerCoefficients(coeffs))
          : null;
        const key = exactCoeffs ? rationalVectorKey(exactCoeffs) : roundedPointKey(point.x, point.y);
        if (seen.has(key)) continue;

        seen.set(key, points.length);
        points.push({
          x: point.x,
          y: point.y,
          coeffs: powerIndex === 0 ? coeffs.slice() : null,
          exactCoeffs,
          expression: samplePowerExpression(field, coeffs, powerIndex)
        });
      }
    }

    return {
      depth,
      name: depth === 1 ? "Moser spindle" : "Moser chain",
      points,
      edges: buildUnitDistanceEdges(points, field)
    };
  }

  function buildMoserRingDataset(field, windowRadius, plan) {
    const started = performance.now();
    const depth = Number.isFinite(plan.sampleDepth)
      ? plan.sampleDepth
      : sampleDepth(field, windowRadius);
    const powers = plan.samplePowers || moserRingPhysicalPowers(field, depth);
    const exactPowers = plan.sampleExactPowers || moserRingExactPowerCoefficients(field, depth);
    const baseWindowRadius = Number.isFinite(plan.baseWindowRadius)
      ? plan.baseWindowRadius
      : field.sampleBaseWindow;
    const baseDataset = buildBasisDataset(field, baseWindowRadius, plan);
    const points = [];
    const seen = new Set();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let powerIndex = 0; powerIndex < powers.length; powerIndex += 1) {
      const power = powers[powerIndex];
      for (const basePoint of baseDataset.points) {
        const p = rotatePointByUnit(basePoint.x, basePoint.y, power);
        if (!pointInsideBounds(p.x, p.y, plan.queryBounds)) continue;

        const exactCoeffs = exactPowers
          ? multiplyExactCoefficients(field, exactPowers[powerIndex], exactPointCoefficients(basePoint))
          : null;
        const key = exactCoeffs ? rationalVectorKey(exactCoeffs) : roundedPointKey(p.x, p.y);
        if (seen.has(key)) continue;
        seen.add(key);

        const coeffs = powerIndex === 0 ? basePoint.coeffs.slice() : null;
        points.push({
          x: p.x,
          y: p.y,
          coeffs,
          exactCoeffs,
          expression: samplePowerExpression(field, basePoint.coeffs, powerIndex),
          rootPower: null
        });
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    }

    const edges = buildUnitDistanceEdges(points, field);
    return {
      field,
      windowRadius,
      points,
      edges,
      queryBounds: plan.queryBounds,
      candidateCount: baseDataset.candidateCount * powers.length,
      testedCandidateCount: baseDataset.testedCandidateCount * powers.length,
      bounds: { minX, minY, maxX, maxY },
      buildMs: performance.now() - started,
      exactPhysicalCrop: false,
      candidateLabel: "sampled ring elements"
    };
  }

  function buildDataset(field, windowRadius, plan) {
    if (field.sampleKind === "moserRing") {
      return buildMoserRingDataset(field, windowRadius, plan);
    }
    return buildBasisDataset(field, windowRadius, plan);
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
    clearRhombOverlayCache();
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

  function rationalCoefficientsFromKey(key) {
    if (key.startsWith("algq:")) {
      return key.slice(5).split(",").map(rationalFromLiteral);
    }
    if (key.startsWith("alg:")) {
      return key.slice(4).split(",").map(rationalFromLiteral);
    }
    return null;
  }

  function plainRationalCoefficient(coeffs) {
    if (!coeffs || !coeffs.length) return null;
    for (let i = 1; i < coeffs.length; i += 1) {
      if (!rationalIsZero(coeffs[i])) return null;
    }
    return coeffs[0];
  }

  function integerSquareRoot(value) {
    if (value < 0n) return null;
    if (value < 2n) return value;
    let low = 1n;
    let high = value;
    while (low <= high) {
      const mid = (low + high) / 2n;
      const square = mid * mid;
      if (square === value) return mid;
      if (square < value) {
        low = mid + 1n;
      } else {
        high = mid - 1n;
      }
    }
    return high;
  }

  function perfectSquareRoot(value) {
    const root = integerSquareRoot(value);
    return root !== null && root * root === value ? root : null;
  }

  function rationalSquareRootText(value) {
    if (!value || value.n < 0n) return null;
    const numeratorRoot = perfectSquareRoot(value.n);
    const denominatorRoot = perfectSquareRoot(value.d);
    if (numeratorRoot !== null && denominatorRoot !== null) {
      return denominatorRoot === 1n
        ? String(numeratorRoot)
        : String(numeratorRoot) + "/" + String(denominatorRoot);
    }
    const body = value.d === 1n
      ? String(value.n)
      : String(value.n) + "/" + String(value.d);
    return "sqrt(" + body + ")";
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

  function svgColor(color, fallback) {
    if (!color) return fallback;
    if (color.startsWith("#")) return color;
    const rgba = color.match(/rgba?\(([^)]+)\)/i);
    if (!rgba) return fallback;
    const parts = rgba[1].split(",").map((part) => part.trim());
    if (parts.length < 3) return fallback;
    const r = Math.max(0, Math.min(255, Math.round(Number(parts[0]))));
    const g = Math.max(0, Math.min(255, Math.round(Number(parts[1]))));
    const b = Math.max(0, Math.min(255, Math.round(Number(parts[2]))));
    const hex = (value) => value.toString(16).padStart(2, "0");
    return "#" + hex(r) + hex(g) + hex(b);
  }

  function svgOpacity(color, fallback) {
    if (!color) return fallback;
    const rgba = color.match(/rgba\(([^)]+)\)/i);
    if (!rgba) return fallback;
    const parts = rgba[1].split(",").map((part) => part.trim());
    if (parts.length < 4) return fallback;
    const alpha = Number(parts[3]);
    return Number.isFinite(alpha) ? clamp(0, alpha, 1) : fallback;
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
    if (hasExactDistanceAlgebra(field)) {
      return "algq:" + rationalVectorKey(rationalUnitVector(fieldDegree(field), 0));
    }
    if (field.numericDistanceOnly) {
      return "num:" + distanceKey(UNIT_DISTANCE_SQUARED);
    }
    const coeffs = new Array(fieldDegree(field)).fill(0);
    coeffs[0] = 1;
    return "alg:" + coefficientKey(coeffs);
  }

  function pairDistanceRaceKey(field, p, q, approximateDistanceSquared, cache) {
    if (hasExactDistanceAlgebra(field)) {
      const pExactCoeffs = exactPointCoefficients(p);
      const qExactCoeffs = exactPointCoefficients(q);
      if (pExactCoeffs && qExactCoeffs && pExactCoeffs.length === qExactCoeffs.length) {
        const diffCoeffs = exactDifferenceCoefficients(pExactCoeffs, qExactCoeffs);
        const diffKey = "exact:" + canonicalRationalVectorKey(diffCoeffs);
        let squaredKey = cache.get(diffKey);
        if (!squaredKey) {
          squaredKey = exactSquaredDistanceKey(field, diffCoeffs);
          cache.set(diffKey, squaredKey);
        }
        return squaredKey;
      }
    }

    if (field.numericDistanceOnly) {
      return "num:" + distanceKey(approximateDistanceSquared);
    }
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
    const coeffs = rationalCoefficientsFromKey(row.key);
    if (!coeffs) return null;

    return rationalSquareRootText(plainRationalCoefficient(coeffs));
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
    const generator = field.generatorHtml || field.generator || "ζ_" + field.m;
    return "<span class=\"field-label\"><strong>Q</strong>(" + generator + ")</span>";
  }

  function fieldHeadingHtml(field) {
    const alias = field.aliasHtml
      ? " <span class=\"field-alias-inline\">= " + field.aliasHtml + "</span>"
      : "";
    return formatFieldLabelHtml(field) +
      " <span class=\"field-degree-inline\">degree " + fieldDegree(field) + "</span>" +
      alias;
  }

  function latticeStatusHtml(field) {
    return "<span class=\"status-lattice\">source: " + latticeLabelHtml(field) + "</span>";
  }

  function sourceStatusHtml(field) {
    const label = field.statusSourceHtml || latticeLabelHtml(field);
    const note = field.statusSourceNoteHtml || "";
    return "<span class=\"status-source\">" + label +
      (note ? " <span class=\"status-source-note\">" + note + "</span>" : "") +
      "</span>";
  }

  function windowControlValueText(field, value) {
    const prefix = field.windowLabelPrefix || "W";
    const formatted = field.windowValueFormat === "integer"
      ? String(Math.round(value))
      : value.toFixed(1);
    return prefix + "=" + formatted;
  }

  function statusWindowMeasureHtml(field, value) {
    const label = field.statusWindowLabel || "field radius";
    const formatted = field.windowValueFormat === "integer"
      ? String(Math.round(value))
      : value.toFixed(2);
    return escapeHtml(label) + ": <strong>" + escapeHtml(formatted) + "</strong>";
  }

  function graphMeasureHtml(graph) {
    if (!graph) return "";
    return "<span>" + escapeHtml(graph.name) + ": <strong>" +
      formatNumber(graph.points.length) + "v / " +
      formatNumber(graph.edges.length) + "e</strong></span>";
  }

  function rhombMeasureHtml(field, rhombOverlay) {
    if (!field || field.type !== "cyclotomic") return "";
    if (!state.showTiles) return "<span>rhombs: <strong>off</strong></span>";
    if (!rhombOverlay) return "";
    const total = rhombOverlay.limitExceeded || rhombOverlay.suspended
      ? "paused"
      : formatNumber(rhombOverlay.drawn);
    return "<span>rhombs cached: <strong>" + total + "</strong></span>";
  }

  function fieldPanelInfoHtml(field) {
    return (
      "<div class=\"field-info-kicker\">field</div>" +
      "<div class=\"field-info-main\">" + fieldHeadingHtml(field) + "</div>"
    );
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

  function integerCoefficientKey(coeffs) {
    return coeffs.join(",");
  }

  function addIntegerCoefficientVectors(left, right) {
    const out = new Array(left.length);
    for (let i = 0; i < left.length; i += 1) {
      out[i] = left[i] + right[i];
    }
    return out;
  }

  function cyclicSeparation(left, right, modulus) {
    const delta = Math.abs(left - right) % modulus;
    return Math.min(delta, modulus - delta);
  }

  function cyclotomicRhombColor(shapeIndex) {
    return DISTANCE_COLORS[(Math.max(1, shapeIndex) - 1) % DISTANCE_COLORS.length];
  }

  function buildIntegerCoefficientIndex(points) {
    const indexByCoefficients = new Map();
    for (let i = 0; i < points.length; i += 1) {
      if (points[i].coeffs) {
        indexByCoefficients.set(integerCoefficientKey(points[i].coeffs), i);
      }
    }
    return indexByCoefficients;
  }

  function cyclotomicRhombPairs(field) {
    const directions = rootPowerCoefficients(field);
    const candidatePairs = [];
    for (let i = 0; i < directions.length; i += 1) {
      for (let j = i + 1; j < directions.length; j += 1) {
        const shapeIndex = cyclicSeparation(directions[i].power, directions[j].power, field.m);
        if (shapeIndex === 0) continue;
        if (field.m % 2 === 0 && shapeIndex === field.m / 2) continue;
        candidatePairs.push({ left: directions[i], right: directions[j], shapeIndex });
      }
    }
    return candidatePairs;
  }

  function rhombOverlayCacheKey(field, windowRadius) {
    return field.id + "|" + windowRadius;
  }

  function clearRhombBitmapCache() {
    state.rhombBitmapCache = null;
  }

  function clearRhombOverlayCache() {
    state.rhombOverlayCache = null;
    clearRhombBitmapCache();
  }

  function beginRhombViewMotion() {
    state.rhombViewMoving = true;
    if (state.rhombViewMotionTimer) {
      clearTimeout(state.rhombViewMotionTimer);
      state.rhombViewMotionTimer = 0;
    }
  }

  function finishRhombViewMotion() {
    if (state.rhombViewMotionTimer) {
      clearTimeout(state.rhombViewMotionTimer);
      state.rhombViewMotionTimer = 0;
    }
    state.rhombViewMoving = false;
  }

  function settleRhombViewMotion(delay = 160) {
    beginRhombViewMotion();
    state.rhombViewMotionTimer = setTimeout(() => {
      state.rhombViewMotionTimer = 0;
      state.rhombViewMoving = false;
      state.dirty = true;
      requestDraw();
    }, delay);
  }

  function boundsForView(centerX, centerY, scale, width, height, extra) {
    return {
      xMin: centerX + (-extra - width / 2) / scale,
      xMax: centerX + (width + extra - width / 2) / scale,
      yMin: centerY - (height + extra - height / 2) / scale,
      yMax: centerY - (-extra - height / 2) / scale
    };
  }

  function buildCyclotomicRhombTileCache(field, dataset, key) {
    const points = dataset.points;
    const indexByCoefficients = dataset.coefficientIndex;
    const candidatePairs = cyclotomicRhombPairs(field);
    if (points.length * candidatePairs.length > RHOMB_TILE_CANDIDATE_LIMIT) {
      return { key, tiles: [], limitExceeded: true };
    }

    const seen = new Set();
    const tiles = [];
    for (let baseIndex = 0; baseIndex < points.length; baseIndex += 1) {
      const basePoint = points[baseIndex];
      if (!basePoint.coeffs) continue;

      for (const pair of candidatePairs) {
        const leftCoeffs = addIntegerCoefficientVectors(basePoint.coeffs, pair.left.coeffs);
        const rightCoeffs = addIntegerCoefficientVectors(basePoint.coeffs, pair.right.coeffs);
        const farCoeffs = addIntegerCoefficientVectors(leftCoeffs, pair.right.coeffs);
        const leftIndex = indexByCoefficients && indexByCoefficients.get(integerCoefficientKey(leftCoeffs));
        const rightIndex = indexByCoefficients && indexByCoefficients.get(integerCoefficientKey(rightCoeffs));
        const farIndex = indexByCoefficients && indexByCoefficients.get(integerCoefficientKey(farCoeffs));
        if (leftIndex === undefined || rightIndex === undefined || farIndex === undefined) continue;

        const vertexKey = [baseIndex, leftIndex, farIndex, rightIndex]
          .slice()
          .sort((a, b) => a - b)
          .join(",");
        if (seen.has(vertexKey)) continue;
        seen.add(vertexKey);

        const leftPoint = points[leftIndex];
        const farPoint = points[farIndex];
        const rightPoint = points[rightIndex];
        tiles.push({
          shapeIndex: pair.shapeIndex,
          vertices: [
            { x: basePoint.x, y: basePoint.y },
            { x: leftPoint.x, y: leftPoint.y },
            { x: farPoint.x, y: farPoint.y },
            { x: rightPoint.x, y: rightPoint.y }
          ],
          minX: Math.min(basePoint.x, leftPoint.x, farPoint.x, rightPoint.x),
          maxX: Math.max(basePoint.x, leftPoint.x, farPoint.x, rightPoint.x),
          minY: Math.min(basePoint.y, leftPoint.y, farPoint.y, rightPoint.y),
          maxY: Math.max(basePoint.y, leftPoint.y, farPoint.y, rightPoint.y)
        });
      }
    }

    return { key, tiles, limitExceeded: false };
  }

  function ensureCyclotomicRhombTileCache(field, dataset) {
    const key = rhombOverlayCacheKey(field, dataset.windowRadius);
    if (state.rhombOverlayCache && state.rhombOverlayCache.key === key) {
      return state.rhombOverlayCache;
    }
    state.rhombOverlayCache = buildCyclotomicRhombTileCache(field, dataset, key);
    return state.rhombOverlayCache;
  }

  function rhombBitmapCacheMatches(cache, key) {
    return cache &&
      cache.key === key &&
      cache.dpr === state.dpr &&
      cache.width === state.width &&
      cache.height === state.height &&
      Math.abs(cache.centerX - state.centerX) < 1e-9 &&
      Math.abs(cache.centerY - state.centerY) < 1e-9 &&
      Math.abs(cache.scale - state.scale) < 1e-9;
  }

  function drawRhombBitmapCache(cache) {
    const scaleRatio = state.scale / cache.scale;
    const sourceWidth = cache.width + cache.margin * 2;
    const sourceHeight = cache.height + cache.margin * 2;
    const x = state.width / 2 +
      (-cache.margin - cache.width / 2) * scaleRatio +
      (cache.centerX - state.centerX) * state.scale;
    const y = state.height / 2 +
      (-cache.margin - cache.height / 2) * scaleRatio -
      (cache.centerY - state.centerY) * state.scale;
    ctx.drawImage(cache.canvas, x, y, sourceWidth * scaleRatio, sourceHeight * scaleRatio);
  }

  function buildRhombBitmapCache(tileCache, key) {
    const margin = Math.max(180, Math.min(420, Math.max(state.width, state.height) * 0.32));
    const cssWidth = state.width + margin * 2;
    const cssHeight = state.height + margin * 2;
    const bitmapCanvas = document.createElement("canvas");
    bitmapCanvas.width = Math.ceil(cssWidth * state.dpr);
    bitmapCanvas.height = Math.ceil(cssHeight * state.dpr);
    const bitmapCtx = bitmapCanvas.getContext("2d");
    bitmapCtx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    bitmapCtx.clearRect(0, 0, cssWidth, cssHeight);
    bitmapCtx.lineJoin = "round";
    bitmapCtx.lineWidth = Math.max(0.35, Math.min(0.85, state.scale * 0.007));

    const view = {
      centerX: state.centerX,
      centerY: state.centerY,
      scale: state.scale,
      width: state.width,
      height: state.height,
      margin
    };
    const bitmapBounds = boundsForView(view.centerX, view.centerY, view.scale, view.width, view.height, margin);
    let drawn = 0;

    for (const tile of tileCache.tiles) {
      if (
        tile.maxX < bitmapBounds.xMin ||
        tile.minX > bitmapBounds.xMax ||
        tile.maxY < bitmapBounds.yMin ||
        tile.minY > bitmapBounds.yMax
      ) {
        continue;
      }

      const first = tile.vertices[0];
      bitmapCtx.beginPath();
      bitmapCtx.moveTo(
        view.margin + view.width / 2 + (first.x - view.centerX) * view.scale,
        view.margin + view.height / 2 - (first.y - view.centerY) * view.scale
      );
      for (let i = 1; i < tile.vertices.length; i += 1) {
        const vertex = tile.vertices[i];
        bitmapCtx.lineTo(
          view.margin + view.width / 2 + (vertex.x - view.centerX) * view.scale,
          view.margin + view.height / 2 - (vertex.y - view.centerY) * view.scale
        );
      }
      bitmapCtx.closePath();

      const color = cyclotomicRhombColor(tile.shapeIndex);
      bitmapCtx.fillStyle = colorWithAlpha(color, 0.04);
      bitmapCtx.strokeStyle = colorWithAlpha(color, 0.13);
      bitmapCtx.fill();
      bitmapCtx.stroke();
      drawn += 1;
    }

    return {
      key,
      canvas: bitmapCanvas,
      drawn,
      margin,
      width: state.width,
      height: state.height,
      dpr: state.dpr,
      centerX: state.centerX,
      centerY: state.centerY,
      scale: state.scale
    };
  }

  function drawCyclotomicRhombTiles(field, dataset) {
    if (!field || field.type !== "cyclotomic" || !dataset.points.length) {
      return { drawn: 0, limitExceeded: false, suspended: false };
    }

    const key = rhombOverlayCacheKey(field, dataset.windowRadius);
    if (state.rhombViewMoving) {
      if (state.rhombBitmapCache && state.rhombBitmapCache.key === key) {
        drawRhombBitmapCache(state.rhombBitmapCache);
        return {
          drawn: state.rhombBitmapCache.drawn,
          limitExceeded: false,
          suspended: false
        };
      }
      return { drawn: 0, limitExceeded: false, suspended: true };
    }

    const cache = ensureCyclotomicRhombTileCache(field, dataset);
    if (cache.limitExceeded) {
      return { drawn: 0, limitExceeded: true, suspended: false };
    }

    if (!rhombBitmapCacheMatches(state.rhombBitmapCache, key)) {
      state.rhombBitmapCache = buildRhombBitmapCache(cache, key);
    }
    drawRhombBitmapCache(state.rhombBitmapCache);

    return {
      drawn: state.rhombBitmapCache.drawn,
      limitExceeded: false,
      suspended: false
    };
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
    if (!point || (!point.coeffs && !point.expression)) {
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
      expressionEl.textContent = point.expression || formatFieldInteger(field, point.coeffs);
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
    const rowLimit = distanceRaceRowLimit();
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
    const rows = entries.slice(0, rowLimit);
    if (unitEntry && !rows.includes(unitEntry)) {
      if (rows.length >= rowLimit) rows.pop();
      rows.push(unitEntry);
    }
    if (selectedEntry && !rows.includes(selectedEntry)) {
      if (rows.length >= rowLimit) {
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

  function buildIncidentDistanceEdges(field, points, sourceIndex, targetKey) {
    if (!targetKey || sourceIndex < 0 || sourceIndex >= points.length) return [];
    const edges = [];
    const keyCache = new Map();
    const p = points[sourceIndex];

    for (let j = 0; j < points.length; j += 1) {
      if (j === sourceIndex) continue;
      const q = points[j];
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const distanceSquared = dx * dx + dy * dy;
      if (pairDistanceRaceKey(field, p, q, distanceSquared, keyCache) === targetKey) {
        edges.push(sourceIndex < j ? [sourceIndex, j] : [j, sourceIndex]);
      }
    }

    return edges;
  }

  function graphPointCountFromEdges(edges) {
    if (!edges.length) return 0;
    const vertices = new Set();
    for (const [i, j] of edges) {
      vertices.add(i);
      vertices.add(j);
    }
    return vertices.size;
  }

  function isUnitDistanceRow(row) {
    return row && Math.abs(row.distanceSquared - UNIT_DISTANCE_SQUARED) < 1 / DISTANCE_KEY_SCALE;
  }

  function distanceRaceRowLimit() {
    return isMobileFieldDrawer() ? MOBILE_DISTANCE_RACE_ROWS : DISTANCE_RACE_ROWS;
  }

  function distanceRaceHtml(field, race, selectedKey) {
    if (!race) return "";
    let html =
      "<div class=\"distance-race\">" +
      "<div class=\"race-heading\" title=\"The race counts every pair of points in the disk; n above counts only vertices incident to the selected distance.\">" +
      "<strong>visible distance race</strong><span>C(" +
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

  function lowerBoundForPointCount(pointCount) {
    const n = Math.max(0, Math.floor(pointCount));
    ensureLowerBoundCache(n);
    return LOWER_BOUND_CACHE[n] || null;
  }

  function ensureLowerBoundCache(maxN) {
    if (!LOWER_BOUND_DATA) return;

    for (let n = LOWER_BOUND_CACHE.length; n <= maxN; n += 1) {
      let best = null;
      const exactLowerBound = LOWER_BOUND_EXACT.get(n);
      if (Number.isFinite(exactLowerBound)) {
        best = {
          n,
          lowerBound: exactLowerBound,
          exact: true,
          method: "table"
        };
      }

      const previous = LOWER_BOUND_CACHE[n - 1];
      if (n >= 3 && previous && previous.lowerBound > 0) {
        best = betterLowerBound(best, {
          n,
          lowerBound: previous.lowerBound + 2,
          exact: false,
          method: "apex",
          source: previous
        });
      }

      for (let leftN = 2; leftN <= Math.floor(n / 2); leftN += 1) {
        const rightN = n - leftN;
        const left = LOWER_BOUND_CACHE[leftN];
        const right = LOWER_BOUND_CACHE[rightN];
        if (!left || !right || left.lowerBound <= 0 || right.lowerBound <= 0) continue;
        best = betterLowerBound(best, {
          n,
          lowerBound: left.lowerBound + right.lowerBound + 2,
          exact: false,
          method: "glue",
          left,
          right
        });
      }

      LOWER_BOUND_CACHE[n] = best;
    }
  }

  function betterLowerBound(current, candidate) {
    if (!candidate) return current;
    if (!current) return candidate;
    if (candidate.lowerBound !== current.lowerBound) {
      return candidate.lowerBound > current.lowerBound ? candidate : current;
    }
    if (candidate.exact !== current.exact) return candidate.exact ? candidate : current;
    if (candidate.method === "apex" && current.method !== "apex") return candidate;
    return current;
  }

  function lowerBoundTitle(entry) {
    const sourceName = LOWER_BOUND_DATA.sourceName || "Unit distance lower-bound table";
    const modifiedText = LOWER_BOUND_DATA.lastModified
      ? "; table last modified " + LOWER_BOUND_DATA.lastModified.slice(0, 10)
      : "";
    if (entry.exact) {
      return sourceName + modifiedText;
    }
    if (entry.method === "apex") {
      return "Derived from the table and generic rules: u(" + entry.source.n + ") >= " +
        formatNumber(entry.source.lowerBound) +
        ", then add one point making two new unit distances; source " + sourceName + modifiedText;
    }
    if (entry.method === "glue") {
      return "Derived from the table and generic rules: u(" + entry.left.n + ") >= " +
        formatNumber(entry.left.lowerBound) + " and u(" + entry.right.n + ") >= " +
        formatNumber(entry.right.lowerBound) +
        ", then glue two configurations with two cross unit distances; source " + sourceName + modifiedText;
    }
    return sourceName + modifiedText;
  }

  function lowerBoundCardHtml(pointCount) {
    const entry = lowerBoundForPointCount(pointCount);
    if (!entry || !LOWER_BOUND_DATA) return "";

    const sourceUrl = LOWER_BOUND_DATA.pageUrl || LOWER_BOUND_DATA.sourceUrl;
    const title = lowerBoundTitle(entry);
    const ariaLabel = "Source for lower bound u(n) at least " + formatNumber(entry.lowerBound) +
      (entry.exact ? "" : ", derived from generic construction rules");
    return "<a class=\"lower-bound-card\" href=\"" + escapeAttribute(sourceUrl) +
      "\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"" + escapeAttribute(title) +
      "\" aria-label=\"" + escapeAttribute(ariaLabel) + "\">" +
      "<span class=\"lower-bound-label\">" + (entry.exact ? "known record" : "derived bound") + "</span>" +
      "<span class=\"lower-bound-value\">u(n) &ge; " + formatNumber(entry.lowerBound) +
      "<svg class=\"lower-bound-info\" viewBox=\"0 0 24 24\" aria-hidden=\"true\">" +
      "<circle cx=\"12\" cy=\"12\" r=\"9\"></circle>" +
      "<path d=\"M12 11v5\"></path>" +
      "<path d=\"M12 8h.01\"></path>" +
      "</svg></span>" +
      "</a>";
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

  function expandedObstacleRect(element, gap, bounds) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const left = Math.max(bounds.left, rect.left - gap);
    const top = Math.max(bounds.top, rect.top - gap);
    const right = Math.min(bounds.right, rect.right + gap);
    const bottom = Math.min(bounds.bottom, rect.bottom + gap);
    if (right <= left || bottom <= top) return null;
    return { left, top, right, bottom };
  }

  function pointToRectDistance(x, y, rect) {
    const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
    return Math.hypot(dx, dy);
  }

  function lensClearance(x, y, bounds, obstacles) {
    let clearance = Math.min(x - bounds.left, bounds.right - x, y - bounds.top, bounds.bottom - y);
    if (clearance <= 0) return -1;
    for (const obstacle of obstacles) {
      const distance = pointToRectDistance(x, y, obstacle);
      if (distance <= 0) return -1;
      clearance = Math.min(clearance, distance);
    }
    return clearance;
  }

  function largestClearLens(bounds, obstacles) {
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    let best = {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
      radius: -1
    };

    const xSteps = 22;
    const ySteps = 16;
    for (let yi = 0; yi <= ySteps; yi += 1) {
      const y = bounds.top + height * yi / ySteps;
      for (let xi = 0; xi <= xSteps; xi += 1) {
        const x = bounds.left + width * xi / xSteps;
        const radius = lensClearance(x, y, bounds, obstacles);
        if (radius > best.radius) best = { x, y, radius };
      }
    }

    let step = Math.max(width, height) / 8;
    for (let iteration = 0; iteration < 7; iteration += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const x = clamp(bounds.left, best.x + dx * step, bounds.right);
          const y = clamp(bounds.top, best.y + dy * step, bounds.bottom);
          const radius = lensClearance(x, y, bounds, obstacles);
          if (radius > best.radius) best = { x, y, radius };
        }
      }
      step *= 0.5;
    }

    if (best.radius >= 24) return best;
    return {
      x: (bounds.left + bounds.right) / 2,
      y: (bounds.top + bounds.bottom) / 2,
      radius: Math.max(24, Math.min(width / 2, height / 2))
    };
  }

  function lensScreenGeometry() {
    const margin = 16;
    const bounds = {
      left: margin,
      top: margin,
      right: state.width - margin,
      bottom: state.height - margin
    };
    const obstacles = [];

    if (fieldPanelEl && !isMobileFieldDrawer()) {
      const rect = expandedObstacleRect(fieldPanelEl, margin, bounds);
      if (rect) obstacles.push(rect);
    }

    if (toolbarEl) {
      const rect = expandedObstacleRect(toolbarEl, margin, bounds);
      if (rect) obstacles.push(rect);
    }
    if (statusEl) {
      const rect = expandedObstacleRect(statusEl, margin, bounds);
      if (rect) obstacles.push(rect);
    }

    const lens = largestClearLens(bounds, obstacles);
    return { x: lens.x, y: lens.y, radius: Math.max(24, lens.radius) };
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
    clearRhombBitmapCache();
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
    clearRhombBitmapCache();
    state.autoFitPending = true;
    state.dirty = true;
    requestDraw();
  }

  function goHome() {
    placeOriginAtLensCenter();
    clearRhombBitmapCache();
    state.dirty = true;
    requestDraw();
  }

  function zoomAt(sx, sy, factor) {
    settleRhombViewMotion();
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

  function drawMoserGraphOverlay(graph) {
    if (!graph || !graph.points.length) return 0;

    const edgeWidth = clamp(2.1, state.scale * 0.018, 4.6);
    const pointRadius = clamp(4.2, state.scale * 0.033, 8);
    let drawnEdges = 0;
    let drawnPoints = 0;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = edgeWidth + 3.8;
    ctx.beginPath();
    for (const [i, j] of graph.edges) {
      const p = worldToScreen(graph.points[i].x, graph.points[i].y);
      const q = worldToScreen(graph.points[j].x, graph.points[j].y);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      drawnEdges += 1;
    }
    if (drawnEdges > 0) ctx.stroke();

    ctx.strokeStyle = "rgba(9, 24, 70, 0.94)";
    ctx.lineWidth = edgeWidth;
    ctx.beginPath();
    for (const [i, j] of graph.edges) {
      const p = worldToScreen(graph.points[i].x, graph.points[i].y);
      const q = worldToScreen(graph.points[j].x, graph.points[j].y);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
    }
    if (drawnEdges > 0) ctx.stroke();

    ctx.fillStyle = "#ffe04d";
    ctx.strokeStyle = "rgba(9, 24, 70, 0.98)";
    ctx.lineWidth = Math.max(1.3, Math.min(2.3, pointRadius * 0.32));
    ctx.beginPath();
    for (let i = 0; i < graph.points.length; i += 1) {
      const p = worldToScreen(graph.points[i].x, graph.points[i].y);
      ctx.moveTo(p.x + pointRadius, p.y);
      ctx.arc(p.x, p.y, pointRadius, 0, Math.PI * 2);
      drawnPoints += 1;
    }
    if (drawnPoints > 0) {
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
    return drawnPoints;
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

  function lensPointSnapshot() {
    const field = currentField();
    const viewBounds = visibleBounds(24);
    const dataset = ensureDataset(field, state.windowRadius, viewBounds);
    const points = dataset.points;
    const lens = lensScreenGeometry();
    const center = screenToWorld(lens.x, lens.y);
    const radius = lens.radius / state.scale;
    const radiusSquared = radius * radius;
    const indices = [];

    for (let i = 0; i < points.length; i += 1) {
      const p = points[i];
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      if (dx * dx + dy * dy <= radiusSquared + 1e-12) {
        indices.push(i);
      }
    }

    return { field, dataset, points, lens, center, radius, indices };
  }

  function currentLensDistanceEdges(snapshot) {
    const distanceRace = buildDistanceRace(
      snapshot.field,
      snapshot.points,
      snapshot.indices,
      state.selectedDistanceKey
    );
    const activeDistance = distanceRace.selected || distanceRace.leader;
    const edges = distanceRace.exact && activeDistance
      ? buildDistanceEdges(snapshot.field, snapshot.points, snapshot.indices, activeDistance.key)
      : [];
    const graphPointCount = distanceRace.exact && activeDistance
      ? graphPointCountFromEdges(edges)
      : null;
    return {
      distanceRace,
      activeDistance,
      edges,
      graphPointCount
    };
  }

  function pointToLensExport(point, snapshot, exportSize, padding) {
    const scale = (exportSize - padding * 2) / (snapshot.radius * 2);
    return {
      x: padding + (point.x - snapshot.center.x + snapshot.radius) * scale,
      y: padding + (snapshot.radius - (point.y - snapshot.center.y)) * scale
    };
  }

  function exportLensSvg() {
    const snapshot = lensPointSnapshot();
    const { activeDistance, edges, graphPointCount } = currentLensDistanceEdges(snapshot);
    const highlightedGraph = moserChainGraph(snapshot.field, MOSER_SPINDLE_DEPTH);
    const exportSize = 1200;
    const padding = 36;
    const radius = (exportSize - padding * 2) / 2;
    const center = exportSize / 2;
    const pointRadius = Math.max(1.6, Math.min(5.5, radius / Math.max(60, snapshot.indices.length * 0.7)));
    const lineWidth = Math.max(0.75, Math.min(2.25, pointRadius * 0.48));
    const edgeStroke = activeDistance
      ? svgColor(distanceColor(activeDistance), snapshot.field.edgeStroke)
      : svgColor(snapshot.field.edgeStroke, "#6f7f93");
    const edgeOpacity = 0.58;
    const pointFill = svgColor(snapshot.field.pointFill, "#242424");
    const pointStroke = svgColor(snapshot.field.pointStroke, "#111111");
    const pointStrokeOpacity = svgOpacity(snapshot.field.pointStroke, 0.72);
    const parts = [
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
      "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + exportSize + "\" height=\"" + exportSize +
        "\" viewBox=\"0 0 " + exportSize + " " + exportSize + "\" role=\"img\" aria-label=\"" +
        escapeAttribute(snapshot.field.label + " point set inside lens") + "\">",
      "<metadata>" +
        escapeHtml(JSON.stringify({
          field: snapshot.field.label,
          points: snapshot.indices.length,
          graphPoints: graphPointCount,
          edges: edges.length,
          highlightedGraph: highlightedGraph ? {
            name: highlightedGraph.name,
            vertices: highlightedGraph.points.length,
            edges: highlightedGraph.edges.length
          } : null,
          radius: Number(snapshot.radius.toFixed(6))
        })) +
        "</metadata>",
      "<defs><clipPath id=\"lens\"><circle cx=\"" + center + "\" cy=\"" + center + "\" r=\"" + radius + "\"/></clipPath></defs>",
      "<g clip-path=\"url(#lens)\">"
    ];

    if (edges.length) {
      parts.push("<g fill=\"none\" stroke=\"" + escapeAttribute(edgeStroke) + "\" stroke-opacity=\"" +
        edgeOpacity + "\" stroke-width=\"" + lineWidth.toFixed(3) + "\" stroke-linecap=\"round\">");
      for (const [i, j] of edges) {
        const p = pointToLensExport(snapshot.points[i], snapshot, exportSize, padding);
        const q = pointToLensExport(snapshot.points[j], snapshot, exportSize, padding);
        parts.push("<path d=\"M " + p.x.toFixed(3) + " " + p.y.toFixed(3) +
          " L " + q.x.toFixed(3) + " " + q.y.toFixed(3) + "\"/>");
      }
      parts.push("</g>");
    }

    parts.push("<g fill=\"" + escapeAttribute(pointFill) + "\" stroke=\"" + escapeAttribute(pointStroke) +
      "\" stroke-opacity=\"" + pointStrokeOpacity + "\" stroke-width=\"" + Math.max(0.4, pointRadius * 0.22).toFixed(3) + "\">");
    for (const index of snapshot.indices) {
      const p = pointToLensExport(snapshot.points[index], snapshot, exportSize, padding);
      parts.push("<circle cx=\"" + p.x.toFixed(3) + "\" cy=\"" + p.y.toFixed(3) +
        "\" r=\"" + pointRadius.toFixed(3) + "\"/>");
    }
    parts.push("</g>");

    parts.push("</g>");

    if (highlightedGraph) {
      const graphEdgeWidth = Math.max(2.6, lineWidth * 1.6);
      parts.push("<g fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\"0.9\" stroke-width=\"" +
        (graphEdgeWidth + 4).toFixed(3) + "\" stroke-linecap=\"round\" stroke-linejoin=\"round\">");
      for (const [i, j] of highlightedGraph.edges) {
        const p = pointToLensExport(highlightedGraph.points[i], snapshot, exportSize, padding);
        const q = pointToLensExport(highlightedGraph.points[j], snapshot, exportSize, padding);
        parts.push("<path d=\"M " + p.x.toFixed(3) + " " + p.y.toFixed(3) +
          " L " + q.x.toFixed(3) + " " + q.y.toFixed(3) + "\"/>");
      }
      parts.push("</g><g fill=\"none\" stroke=\"#091846\" stroke-opacity=\"0.94\" stroke-width=\"" +
        graphEdgeWidth.toFixed(3) + "\" stroke-linecap=\"round\" stroke-linejoin=\"round\">");
      for (const [i, j] of highlightedGraph.edges) {
        const p = pointToLensExport(highlightedGraph.points[i], snapshot, exportSize, padding);
        const q = pointToLensExport(highlightedGraph.points[j], snapshot, exportSize, padding);
        parts.push("<path d=\"M " + p.x.toFixed(3) + " " + p.y.toFixed(3) +
          " L " + q.x.toFixed(3) + " " + q.y.toFixed(3) + "\"/>");
      }
      parts.push("</g><g fill=\"#ffe04d\" stroke=\"#091846\" stroke-width=\"" +
        Math.max(1.3, graphEdgeWidth * 0.7).toFixed(3) + "\">");
      for (let i = 0; i < highlightedGraph.points.length; i += 1) {
        const p = pointToLensExport(highlightedGraph.points[i], snapshot, exportSize, padding);
        parts.push("<circle cx=\"" + p.x.toFixed(3) + "\" cy=\"" + p.y.toFixed(3) +
          "\" r=\"" + Math.max(pointRadius * 1.65, 5).toFixed(3) + "\"/>");
      }
      parts.push("</g>");
    }

    parts.push("</svg>");

    const blob = new Blob([parts.join("\n")], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = snapshot.field.id + "-lens-" + snapshot.indices.length + "-points.svg";
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
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
    const highlightedGraph = moserChainGraph(field, MOSER_SPINDLE_DEPTH);
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
    const rhombOverlay = state.showTiles
      ? drawCyclotomicRhombTiles(field, dataset)
      : { drawn: 0, limitExceeded: false };
    const distanceRace = buildDistanceRace(field, points, lensIndices, state.selectedDistanceKey);
    const activeDistance = distanceRace.selected || distanceRace.leader;
    const winningEdges = distanceRace.exact && activeDistance
      ? buildDistanceEdges(field, points, lensIndices, activeDistance.key)
      : [];
    const graphPointCount = distanceRace.exact && activeDistance
      ? graphPointCountFromEdges(winningEdges)
      : null;
    const hoverPointIndex = state.hoverPoint ? points.indexOf(state.hoverPoint) : -1;
    const hoverEdges = activeDistance && hoverPointIndex >= 0
      ? buildIncidentDistanceEdges(field, points, hoverPointIndex, activeDistance.key)
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

    drawLensShade(lens);
    drawMoserGraphOverlay(highlightedGraph);

    if (state.hoverPoint && hoverEdges.length) {
      const hoverInsideEdges = [];
      const hoverOutsideEdges = [];
      for (const edge of hoverEdges) {
        const [i, j] = edge;
        if (inLens[i] && inLens[j]) {
          hoverInsideEdges.push(edge);
        } else {
          hoverOutsideEdges.push(edge);
        }
      }
      drawEdgeSegments(
        hoverEdges,
        points,
        "rgba(255, 255, 255, 0.82)",
        leaderEdgeLineWidth(4.1)
      );
      drawEdgeSegments(
        hoverOutsideEdges,
        points,
        "rgba(84, 89, 96, 0.72)",
        leaderEdgeLineWidth(2.15)
      );
      drawEdgeSegments(
        hoverInsideEdges,
        points,
        leaderEdgeStroke(activeDistance, 0.96),
        leaderEdgeLineWidth(2.65)
      );
      drawHoverPointHalo(state.hoverPoint);
    }

    const lensWorldRadius = lens.radius / state.scale;
    const graphPointCountText = graphPointCount === null ? "paused" : formatNumber(graphPointCount);

    const previousRaceRects = captureRaceRowRects();
    statusEl.innerHTML =
      "<div class=\"status-top\">" +
      "<div class=\"status-meta\">" +
      sourceStatusHtml(field) +
      "<div class=\"status-measures\">" +
      "<span>graph points: n=<strong>" + graphPointCountText + "</strong></span>" +
      "<span>" + statusWindowMeasureHtml(
        field,
        field.statusWindowValue === "window" ? state.windowRadius : lensWorldRadius
      ) + "</span>" +
      rhombMeasureHtml(field, rhombOverlay) +
      graphMeasureHtml(highlightedGraph) +
      "</div>" +
      "</div>" +
      (graphPointCount === null ? "" : lowerBoundCardHtml(graphPointCount)) +
      shownDistanceHtml(field, distanceRace, activeDistance) +
      "</div>" +
      distanceRaceHtml(field, distanceRace, state.selectedDistanceKey);
    animateRaceRows(previousRaceRects);
    const candidateLabel = dataset.candidateLabel || "coefficient candidates";
    const candidateText = dataset.testedCandidateCount < dataset.candidateCount
      ? "tested " + formatNumber(dataset.testedCandidateCount) + " of " +
        formatNumber(dataset.candidateCount) + " " + candidateLabel
      : formatNumber(dataset.candidateCount) + " " + candidateLabel;
    const activeGraphTitle = graphPointCount === null
      ? "active distance graph paused above pair limit"
      : "active distance graph: " + formatNumber(graphPointCount) + " non-isolated points, " +
        formatNumber(winningEdges.length) + " edges";
    statusEl.title =
      activeGraphTitle + "; lens has " + formatNumber(lensPoints) +
      " points; computed viewport patch: " +
      formatNumber(points.length) + " points, " +
      formatNumber(edges.length) + " unit distances" +
      (field.type === "cyclotomic"
        ? ", " + (!state.showTiles
          ? "rhomb overlay off"
          : rhombOverlay.limitExceeded || rhombOverlay.suspended
            ? "rhomb overlay paused"
            : formatNumber(rhombOverlay.drawn) + " cached rhombs")
        : "") +
      "; " + candidateText;

    if (state.autoFitPending) {
      state.autoFitPending = false;
      const targetScale = Math.max(22, Math.min(1200, lensScreenGeometry().radius / field.defaultLensWorldRadius));
      if (Math.abs(targetScale - state.scale) > 0.5) {
        state.scale = targetScale;
        placeOriginAtLensCenter();
        clearRhombBitmapCache();
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
    finishRhombViewMotion();
    clearRhombOverlayCache();
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
      windowControl.title = field.windowTitle || (field.fullRing
        ? "Full ring of integers"
        : "Window radius W: larger values admit more points");
    }
    if (field.fullRing) {
      windowLabel.innerHTML = field.windowLabelHtml || "full O<sub>K</sub>";
    } else {
      windowLabel.textContent = windowControlValueText(field, state.windowRadius);
    }
    if (fieldInfoEl) {
      fieldInfoEl.innerHTML = fieldPanelInfoHtml(field);
      fieldInfoEl.title = fieldRelationText(field);
    }
    if (tilesButton) {
      const hasCyclotomicRhombs = field.type === "cyclotomic";
      tilesButton.disabled = !hasCyclotomicRhombs;
      tilesButton.classList.toggle("active", hasCyclotomicRhombs && state.showTiles);
      tilesButton.title = hasCyclotomicRhombs
        ? "Toggle projected square-face rhombs"
        : "Rhomb tiles are available for cyclotomic fields";
    }
    updateFieldPoset();
    renderLatticeOptions();
    state.dataset = null;
    fitInitial();
  }

  function updateWindowRadius() {
    hidePointTooltip();
    const field = currentField();
    finishRhombViewMotion();
    clearRhombOverlayCache();
    state.windowRadius = Number(windowInput.value);
    windowLabel.textContent = windowControlValueText(field, state.windowRadius);
    state.dataset = null;
    state.dirty = true;
    requestDraw();
  }

  function latticeLabelHtml(field) {
    if (field.latticeLabelHtml) return field.latticeLabelHtml;
    if (field.type === "cyclotomic") {
      const generator = field.generatorHtml || field.generator || "ζ_" + field.m;
      return "O<sub>K</sub> = Z[" + generator + "]";
    }
    return field.fullRing ? "O<sub>K</sub>" : escapeHtml(field.shortLabel || field.label);
  }

  function latticeNoteHtml(field) {
    if (field.latticeNoteHtml) return field.latticeNoteHtml;
    if (field.type === "cyclotomic") {
      return field.fullRing ? "full ring of integers" : "full ring, windowed projection";
    }
    return field.fullRing ? "full ring of integers" : "cut-and-project lattice";
  }

  function latticeNodePosition(variant, index, count) {
    if (Number.isFinite(variant.latticeX) && Number.isFinite(variant.latticeY)) {
      return { x: variant.latticeX, y: variant.latticeY };
    }
    if (count <= 1) return { x: 50, y: 50 };
    return {
      x: 50,
      y: 24 + index * (52 / Math.max(1, count - 1))
    };
  }

  function latticeEdgePath(parentPosition, childPosition) {
    const top = parentPosition.y <= childPosition.y ? parentPosition : childPosition;
    const bottom = parentPosition.y <= childPosition.y ? childPosition : parentPosition;
    const gap = Math.abs(bottom.y - top.y);
    const verticalInset = clamp(5, gap * 0.28, 14);
    const bend = clamp(7, gap * 0.45, 32);
    return "M " + top.x.toFixed(2) + " " + (top.y + verticalInset).toFixed(2) +
      " C " + top.x.toFixed(2) + " " + (top.y + bend).toFixed(2) +
      ", " + bottom.x.toFixed(2) + " " + (bottom.y - bend).toFixed(2) +
      ", " + bottom.x.toFixed(2) + " " + (bottom.y - verticalInset).toFixed(2);
  }

  function renderLatticeOptions() {
    if (!latticeOptionsEl) return;

    const field = currentField();
    const variants = fieldVariants(field);
    const isMoserDiagram = fieldGroupId(field) === "moser";
    latticeOptionsEl.replaceChildren();
    latticeOptionsEl.classList.toggle("moser-diagram", isMoserDiagram);
    latticeOptionsEl.style.minHeight = isMoserDiagram
      ? "176px"
      : variants.length > 1 ? "116px" : "52px";

    const positions = new Map();
    if (isMoserDiagram) {
      positions.set("moserAmbient", { x: 50, y: 9 });
    }
    variants.forEach((variant, index) => {
      positions.set(variant.id, latticeNodePosition(variant, index, variants.length));
    });

    const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    lines.classList.add("lattice-lines");
    lines.setAttribute("viewBox", "0 0 100 100");
    lines.setAttribute("preserveAspectRatio", "none");
    lines.setAttribute("aria-hidden", "true");
    latticeOptionsEl.appendChild(lines);

    if (isMoserDiagram) {
      const ambientPosition = positions.get("moserAmbient");
      const ambientNode = document.createElement("div");
      ambientNode.className = "lattice-ambient";
      ambientNode.style.setProperty("--x", ambientPosition.x + "%");
      ambientNode.style.setProperty("--y", ambientPosition.y + "%");
      ambientNode.innerHTML =
        "<span class=\"lattice-name\">K = <strong>Q</strong>(&radic;-3,&radic;-11)</span>" +
        "<span class=\"lattice-note\">ambient field</span>";
      ambientNode.title = "K contains both O_K and the non-integral Moser ring";
      latticeOptionsEl.appendChild(ambientNode);
    }

    for (const variant of variants) {
      if (!variant.latticeParentId || !positions.has(variant.latticeParentId)) continue;
      const parentPosition = positions.get(variant.latticeParentId);
      const childPosition = positions.get(variant.id);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", latticeEdgePath(parentPosition, childPosition));
      if (variant.id === field.id || variant.latticeParentId === field.id) {
        path.classList.add("selected-lattice");
      }
      lines.appendChild(path);
    }

    for (const variant of variants) {
      const position = positions.get(variant.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lattice-option";
      button.classList.toggle("selected", variant.id === field.id);
      button.style.setProperty("--x", position.x + "%");
      button.style.setProperty("--y", position.y + "%");
      button.innerHTML =
        "<span class=\"lattice-name\">" + latticeLabelHtml(variant) + "</span>" +
        "<span class=\"lattice-note\">" + latticeNoteHtml(variant) + "</span>";
      button.title = variant.relationText || variant.label;
      button.setAttribute("aria-pressed", variant.id === field.id ? "true" : "false");
      button.addEventListener("click", () => {
        if (variant.id !== state.fieldId) setField(variant.id);
      });
      latticeOptionsEl.appendChild(button);
    }
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

    for (const degree of FIELD_POSET_DEGREES) {
      const marker = document.createElement("div");
      marker.className = "degree-marker";
      marker.style.setProperty("--y", fieldPosetYForDegree(degree).toFixed(2) + "%");
      marker.textContent = "degree " + degree;
      fieldPosetEl.appendChild(marker);
    }

    for (const node of FIELD_POSET_NODES) {
      const field = node.fieldId ? fieldById.get(node.fieldId) : null;
      const position = fieldPosetNodePosition(node);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "field-node";
      button.dataset.posetNode = node.id;
      button.dataset.degree = String(position.degree);
      button.style.setProperty("--x", position.x + "%");
      button.style.setProperty("--y", position.y.toFixed(2) + "%");
      button.innerHTML = node.labelHtml || formatFieldLabelHtml(field);
      button.title = (field ? fieldRelationText(field) : "Q") + "; degree " + position.degree;
      if (field) {
        button.dataset.fieldId = field.id;
        button.setAttribute("aria-label", field.label + ", degree " + position.degree);
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          setField(field.id);
          if (isMobileFieldDrawer()) closeFieldPanel();
        });
      } else {
        button.disabled = true;
        button.setAttribute("aria-label", "Q, degree " + position.degree);
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

    const selectedDownEdges = selectedFieldDownEdgeKeys();
    const nodeBoxes = new Map();
    for (const node of FIELD_POSET_NODES) {
      const element = fieldPosetEl.querySelector("[data-poset-node=\"" + node.id + "\"]");
      if (!element) continue;
      const box = element.getBoundingClientRect();
      nodeBoxes.set(node.id, {
        left: box.left - rect.left,
        top: box.top - rect.top,
        right: box.right - rect.left,
        bottom: box.bottom - rect.top,
        width: box.width,
        height: box.height,
        cx: box.left + box.width / 2 - rect.left,
        cy: box.top + box.height / 2 - rect.top
      });
    }

    function verticalPort(box, targetY, gap) {
      const towardTop = targetY < box.cy;
      return {
        x: box.cx,
        y: towardTop ? box.top - gap : box.bottom + gap
      };
    }

    for (let edgeIndex = 0; edgeIndex < FIELD_POSET_EDGES.length; edgeIndex += 1) {
      const [fromId, toId] = FIELD_POSET_EDGES[edgeIndex];
      const edgeKey = fieldPosetEdgeKey(fromId, toId);
      const fromBox = nodeBoxes.get(fromId);
      const toBox = nodeBoxes.get(toId);
      if (!fromBox || !toBox) continue;

      const start = verticalPort(fromBox, toBox.cy, 3);
      const end = verticalPort(toBox, fromBox.cy, 3);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const verticalDirection = dy === 0 ? -1 : Math.sign(dy);
      const terminal = clamp(26, Math.abs(dy) * 0.42 + Math.abs(dx) * 0.06, Math.min(86, length * 0.7));
      const c1x = start.x;
      const c1y = start.y + verticalDirection * terminal;
      const c2x = end.x;
      const c2y = end.y - verticalDirection * terminal;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        "M " + start.x.toFixed(1) + " " + start.y.toFixed(1) +
        " C " + c1x.toFixed(1) + " " + c1y.toFixed(1) +
        ", " + c2x.toFixed(1) + " " + c2y.toFixed(1) +
        ", " + end.x.toFixed(1) + " " + end.y.toFixed(1)
      );
      path.dataset.edgeKey = edgeKey;
      path.classList.toggle("selected-down", selectedDownEdges.has(edgeKey));
      svg.appendChild(path);
    }
  }

  function fieldPosetEdgeKey(fromId, toId) {
    return fromId + ">" + toId;
  }

  function selectedFieldPosetNodeId() {
    const field = currentField();
    const groupId = fieldGroupId(field);
    const node = FIELD_POSET_NODES.find((candidate) => {
      const candidateField = candidate.fieldId ? fieldById.get(candidate.fieldId) : null;
      return candidateField && fieldGroupId(candidateField) === groupId;
    });
    return node ? node.id : null;
  }

  function selectedFieldDownEdgeKeys() {
    const selectedNodeId = selectedFieldPosetNodeId();
    const edgeKeys = new Set();
    if (!selectedNodeId) return edgeKeys;

    const stack = [selectedNodeId];
    const seen = new Set(stack);
    while (stack.length) {
      const nodeId = stack.pop();
      for (const [lowerId, upperId] of FIELD_POSET_EDGES) {
        if (upperId !== nodeId) continue;
        edgeKeys.add(fieldPosetEdgeKey(lowerId, upperId));
        if (!seen.has(lowerId)) {
          seen.add(lowerId);
          stack.push(lowerId);
        }
      }
    }
    return edgeKeys;
  }

  function updateFieldPoset() {
    if (!fieldPosetEl) return;
    const field = currentField();
    const groupId = fieldGroupId(field);
    for (const button of fieldPosetEl.querySelectorAll(".field-node[data-field-id]")) {
      const buttonField = fieldById.get(button.dataset.fieldId);
      const selected = buttonField && fieldGroupId(buttonField) === groupId;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }

    const selectedDownEdges = selectedFieldDownEdgeKeys();
    for (const path of fieldPosetEl.querySelectorAll(".poset-lines path[data-edge-key]")) {
      path.classList.toggle("selected-down", selectedDownEdges.has(path.dataset.edgeKey));
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
    beginRhombViewMotion();
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
    finishRhombViewMotion();
    canvas.releasePointerCapture(event.pointerId);
    canvas.classList.remove("dragging");
    updatePointTooltip(event);
    state.dirty = true;
    requestDraw();
  });

  canvas.addEventListener("pointercancel", () => {
    state.dragging = false;
    finishRhombViewMotion();
    canvas.classList.remove("dragging");
    hidePointTooltip();
    state.dirty = true;
    requestDraw();
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
  if (tilesButton) {
    tilesButton.addEventListener("click", () => {
      if (tilesButton.disabled) return;
      state.showTiles = !state.showTiles;
      tilesButton.classList.toggle("active", state.showTiles);
      state.dirty = true;
      requestDraw();
    });
  }
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
  if (saveSvgButton) {
    saveSvgButton.addEventListener("click", exportLensSvg);
  }

  window.addEventListener("resize", resize);
  resize();
  initControls();
})();
