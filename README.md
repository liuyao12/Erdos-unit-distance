# Cyclotomic Point-Set Explorer

Interactive browser explorer for planar point sets obtained from rings of cyclotomic integers and simple cut-and-project windows.

[Open the interactive explorer](https://liuyao12.github.io/Erdos-unit-distance/)

![Screenshot of the cyclotomic point-set explorer](docs/screenshot.png)

The page is entirely browser-side JavaScript. Viewing or using it does not require Python, a local server, or a build step.

## What It Draws

Choose a cyclotomic field from the dropdown:

- `Q(i)` and `Q(ζ_3)` draw the full planar lattices `Z[i]` and `Z[ζ_3]`.
- `Q(ζ_m)` for higher-degree fields draws a finite visible patch of a cut-and-project point set from `Z[ζ_m]`.

For a selected `m`, each element is represented in the power basis

$$
z=a_0+a_1\zeta_m+\cdots+a_{\varphi(m)-1}\zeta_m^{\varphi(m)-1}.
$$

The canvas uses the first complex embedding as physical space. For fields with additional complex embeddings, the app keeps only points whose internal embeddings lie inside radius-`W` disks. This window makes the projected point set locally finite; projecting the whole higher-dimensional ring without a window would be dense.

## Distance Edges

The circular lens defines the finite point set currently being measured. Inside that lens, the app counts all pair distances, groups equal distances by the exact cyclotomic coefficient vector for

$$
\Delta z\,\overline{\Delta z},
$$

and shows a live distance race. Rows animate into their new order as pan and zoom change the lens. Labels show decimal distance, plus an exact `√k` label when `d²` is an integer.

The canvas draws edges for the current race leader, with color tied to the active distance. Clicking a race row pins that distance until the row is clicked again or another distance is selected. Unit distance appears in the race even when it is not the leader. Hovering a point shows its element in the selected ring and highlights the active distance edges incident to that point.

This is an illustration tool for cyclotomic point sets. It is not trying to beat, compare with, or reproduce the Erdős square-lattice construction.

## Controls

- Home button: center the viewport back at the origin while preserving zoom.
- Drag to pan.
- Mouse wheel or trackpad scroll to zoom.
- Use the toolbar to change fields, toggle leader-distance edges, toggle points/grid, change the internal window radius, or export a PNG.

## Files

- `index.html` - GitHub Pages entry point and UI styles.
- `app.js` - self-contained cyclotomic reconstruction, drawing, interaction, exact distance grouping, and visible-edge counting.
- `docs/screenshot.png` - README preview screenshot.
- `dodecagonal_probe.py`, `reconstruct_12fold.py`, `model_set_window_probe.py`, and `growth_probe.py` - exploratory Python probes for earlier 12-fold and model-set checks.
- `finite_comparison.html` and `finite_comparison.js` - older auxiliary finite point-set page, separate from the main cyclotomic explorer.

## Mathematical Context

The app is a visual sandbox for rings such as `Z[i]`, `Z[ζ_3]`, `Z[ζ_5]`, and related cut-and-project model sets. It helps inspect repeated distances, local density, and the geometry of visible patches across different cyclotomic fields. It should not be read as a proof experiment for the asymptotic Erdős unit-distance problem.
