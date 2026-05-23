from collections import Counter
from math import atan2, cos, hypot, pi, sin, sqrt


RADIUS = 4.0
TOL = 1e-8


def physical(a, b, c, d):
    rho = complex(-0.5, sqrt(3) / 2)
    return a + b * 1j + c * rho + d * 1j * rho


def internal(a, b, c, d):
    rho = complex(-0.5, sqrt(3) / 2)
    return a - b * 1j + c * rho - d * 1j * rho


def points(radius=RADIUS):
    # The two disc inequalities bound all four integer coefficients by radius.
    bound = int(radius) + 1
    out = []
    for a in range(-bound, bound + 1):
        for b in range(-bound, bound + 1):
            for c in range(-bound, bound + 1):
                for d in range(-bound, bound + 1):
                    z = physical(a, b, c, d)
                    zs = internal(a, b, c, d)
                    if abs(z) <= radius + TOL and abs(zs) <= radius + TOL:
                        out.append((z, zs, (a, b, c, d)))
    return out


def unit_edges(pts):
    edges = []
    directions = Counter()
    for i, (zi, _, _) in enumerate(pts):
        for j in range(i + 1, len(pts)):
            dz = pts[j][0] - zi
            if abs(abs(dz) - 1.0) < TOL:
                angle = atan2(dz.imag, dz.real) % pi
                directions[round(angle / (pi / 12)) % 12] += 1
                edges.append((i, j))
    return edges, directions


def segment_crossings(pts, edges):
    coords = [(p[0].real, p[0].imag) for p in pts]
    packed = []
    for i, j in edges:
        x1, y1 = coords[i]
        x2, y2 = coords[j]
        packed.append(
            (
                i,
                j,
                x1,
                y1,
                x2,
                y2,
                min(x1, x2),
                max(x1, x2),
                min(y1, y2),
                max(y1, y2),
            )
        )

    def orient(ax, ay, bx, by, cx, cy):
        return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)

    total = 0
    for n, e in enumerate(packed):
        i, j, x1, y1, x2, y2, minx, maxx, miny, maxy = e
        for f in packed[n + 1 :]:
            k, l, x3, y3, x4, y4, minx2, maxx2, miny2, maxy2 = f
            if len({i, j, k, l}) < 4:
                continue
            if maxx < minx2 or maxx2 < minx or maxy < miny2 or maxy2 < miny:
                continue
            o1 = orient(x1, y1, x2, y2, x3, y3)
            o2 = orient(x1, y1, x2, y2, x4, y4)
            o3 = orient(x3, y3, x4, y4, x1, y1)
            o4 = orient(x3, y3, x4, y4, x2, y2)
            if o1 * o2 < -TOL and o3 * o4 < -TOL:
                total += 1
    return total


def root_directions():
    roots = []
    for a in range(-2, 3):
        for b in range(-2, 3):
            for c in range(-2, 3):
                for d in range(-2, 3):
                    if (a, b, c, d) == (0, 0, 0, 0):
                        continue
                    z = physical(a, b, c, d)
                    zs = internal(a, b, c, d)
                    if abs(abs(z) - 1) < TOL and abs(abs(zs) - 1) < TOL:
                        roots.append((atan2(z.imag, z.real) % (2 * pi), (a, b, c, d)))
    return sorted(roots)


def save_svg(pts, edges, filename="unit_distance_patch.svg"):
    width = height = 1200
    pad = 55
    scale = (width - 2 * pad) / (2 * RADIUS + 0.4)

    def xy(z):
        return (
            width / 2 + z.real * scale,
            height / 2 - z.imag * scale,
        )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(
            '<svg xmlns="http://www.w3.org/2000/svg" '
            f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n'
        )
        f.write('<rect width="100%" height="100%" fill="white"/>\n')
        f.write('<g stroke="#2339cc" stroke-width="0.55" stroke-opacity="0.45">\n')
        for i, j in edges:
            x1, y1 = xy(pts[i][0])
            x2, y2 = xy(pts[j][0])
            f.write(f'<line x1="{x1:.3f}" y1="{y1:.3f}" x2="{x2:.3f}" y2="{y2:.3f}"/>\n')
        f.write("</g>\n")
        f.write('<g fill="#f4a000" stroke="#b36f00" stroke-width="0.35">\n')
        for z, _, _ in pts:
            x, y = xy(z)
            f.write(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="2.5"/>\n')
        f.write("</g>\n")
        f.write("</svg>\n")


def main():
    pts = points()
    edges, directions = unit_edges(pts)
    degrees = [0] * len(pts)
    for i, j in edges:
        degrees[i] += 1
        degrees[j] += 1

    print(f"points: {len(pts)}")
    print(f"unit edges: {len(edges)}")
    print(f"degree histogram: {dict(sorted(Counter(degrees).items()))}")
    print(
        "undirected unit-edge directions:",
        {f"{15 * k} deg": v for k, v in sorted(directions.items())},
    )
    print(f"interior crossings among unit edges: {segment_crossings(pts, edges)}")
    print("12 unit directions in the Z[zeta_12] module:")
    for angle, coeffs in root_directions():
        print(f"  {angle * 180 / pi:6.1f} deg  {coeffs}")

    save_svg(pts, edges)
    print("wrote unit_distance_patch.svg")
    print()
    print("Identification:")
    print("  Z[i, rho] = Z[zeta_12], where zeta_12 = -i*rho = exp(pi*i/6).")
    print("  The second inequality is the star map sigma_7: zeta_12 -> zeta_12^7.")
    print("  Thus the displayed set is a finite crop of a dodecagonal cyclotomic model set")
    print("  with a circular acceptance window in internal space.")


if __name__ == "__main__":
    main()
