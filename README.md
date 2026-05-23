# Erdos Unit Distance: Dodecagonal Cut-and-Project Explorer

This repository contains a static, interactive explorer for the 12-fold symmetric point set that came up while looking at a low-dimensional toy version of recent unit-distance constructions.

Open `index.html` in a browser. There is no build step and no external dependency.

This project was created entirely by Codex with GPT-5.5 Pro.

## What It Draws

The displayed point set is the finite viewport of the infinite model set

```text
Lambda_W = { z in Z[zeta_12] : |z*| <= W }.
```

Writing `rho = exp(2 pi i / 3)`, a point is represented by four integers:

```text
z  = a + b i + c rho + d i rho
z* = a - b i + c rho - d i rho
```

The canvas draws the physical coordinate `z`, while `z*` is the internal-space coordinate used for the cut-and-project window. Keeping `|z*| <= W` and projecting `z` gives a locally finite dodecagonal model set. This is the quasicrystal object; projecting the whole 4D lattice without the window would be dense.

## Unit Edges

The blue segments are all pairs at physical distance 1 within the visible patch. In this `Z[zeta_12]` case, the only coefficient differences with `|Delta z| = 1` are the 12 root-of-unity directions, so the explorer checks those finite neighbor steps instead of doing an all-pairs search.

The independent script `model_set_window_probe.py` verifies this certificate and prints growth statistics for larger physical windows.

## Files

- `index.html` - self-contained interactive canvas explorer.
- `dodecagonal_probe.py` - reconstructs the original radius-4 screenshot-style patch and writes an SVG.
- `reconstruct_12fold.py` - writes a clean static SVG reconstruction.
- `model_set_window_probe.py` - verifies the model-set interpretation and unit-difference classes.
- `growth_probe.py` - checks that fixed 4D/window growth has linear unit-edge density.

## Controls

- Drag to pan.
- Mouse wheel or trackpad scroll to zoom.
- Use the toolbar to reset, zoom, toggle unit edges/grid, change the internal window radius, or export a PNG.

## Mathematical Context

This 4D example is a cut-and-project dodecagonal model set, closely related to standard 12-fold quasicrystal and square-triangle tiling constructions. It should not be confused with the full asymptotic unit-distance theorem, whose proof uses projected lattices from number fields of growing degree.
