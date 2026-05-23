# Erdos Unit Distance: Dodecagonal Cut-and-Project Explorer

Interactive browser explorer for the 12-fold symmetric point set that came up while looking at a low-dimensional toy version of recent unit-distance constructions.

[Open the interactive explorer](https://liuyao12.github.io/Erdos-unit-distance/)

![Screenshot of the dodecagonal cut-and-project explorer](docs/screenshot.svg)

This project was created entirely by Codex with GPT-5.5 Pro.

## What It Draws

The hosted page is a static JavaScript app. It reconstructs the visible part of the infinite model set

```text
Lambda_W = { z in Z[zeta_12] : |z*| <= W }.
```

Writing `rho = exp(2 pi i / 3)`, a point is represented by four integers:

```text
z  = a + b i + c rho + d i rho
z* = a - b i + c rho - d i rho
```

The canvas draws the physical coordinate `z`, while `z*` is the internal-space coordinate used for the cut-and-project window. Keeping `|z*| <= W` and projecting `z` gives a locally finite dodecagonal model set. Projecting the whole 4D lattice without the window would be dense.

## Unit Edges

The blue segments are all visible pairs at physical distance 1. In this `Z[zeta_12]` case, the only coefficient differences with `|Delta z| = 1` are the 12 root-of-unity directions, so the JavaScript checks those finite neighbor steps instead of doing an all-pairs search.

The optional Python scripts are probes used to verify and reproduce the same construction; the interactive page itself only needs `index.html` and `app.js`.

## Controls

- Home button: center the viewport back at the origin while preserving zoom.
- Drag to pan.
- Mouse wheel or trackpad scroll to zoom.
- Use the toolbar to zoom, toggle unit edges/grid, change the internal window radius, or export a PNG.

## Metrics

The status panel reports the graph induced by the points currently visible on screen:

- `n`: visible points.
- `m`: visible unit-distance pairs.
- `m / C(n, 2)`: the proportion of all visible point pairs that are unit distances.
- `2m / n`: the average visible unit-distance degree.
- `log m/log n`: a local exponent proxy for the growth question.

For the unit-distance problem, the asymptotic object of interest is not really the pair proportion by itself. The question is how large `m` can be as a function of `n`; a construction with `m ~ n^(1 + delta)` still has `m / C(n, 2)` tending to 0. The proportion is a useful screen-density diagnostic, while average degree and `log m/log n` are closer to the growth behavior one wants to watch.

## Files

- `index.html` - GitHub Pages entry point.
- `app.js` - self-contained JavaScript reconstruction, drawing, interaction, and visible-edge counting.
- `docs/screenshot.svg` - README preview generated from the same model-set formula.
- `dodecagonal_probe.py` - reconstructs the original radius-4 screenshot-style patch and writes an SVG.
- `reconstruct_12fold.py` - writes a clean static SVG reconstruction.
- `model_set_window_probe.py` - verifies the model-set interpretation and unit-difference classes.
- `growth_probe.py` - checks that fixed 4D/window growth has linear unit-edge density.

## Mathematical Context

This 4D example is a cut-and-project dodecagonal model set, closely related to standard 12-fold quasicrystal and square-triangle tiling constructions. It should not be confused with the full asymptotic unit-distance theorem, whose proof uses projected lattices from number fields of growing degree.
