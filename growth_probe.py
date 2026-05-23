from collections import Counter
from math import sqrt


RHO = complex(-0.5, sqrt(3) / 2)


def patch(radius):
    bound = int(radius) + 2
    pts = []
    for a in range(-bound, bound + 1):
        for b in range(-bound, bound + 1):
            for c in range(-bound, bound + 1):
                for d in range(-bound, bound + 1):
                    z = a + b * 1j + c * RHO + d * 1j * RHO
                    star = a - b * 1j + c * RHO - d * 1j * RHO
                    if abs(z) <= radius + 1e-9 and abs(star) <= radius + 1e-9:
                        pts.append((z, (a, b, c, d)))
    return pts


def unit_edge_stats(pts):
    edges = 0
    coefficient_differences = Counter()
    for i, (zi, ci) in enumerate(pts):
        for j in range(i + 1, len(pts)):
            zj, cj = pts[j]
            if abs(abs(zj - zi) - 1) < 1e-8:
                edges += 1
                dc = tuple(cj[k] - ci[k] for k in range(4))
                if dc < tuple(-x for x in dc):
                    dc = tuple(-x for x in dc)
                coefficient_differences[dc] += 1
    return edges, len(coefficient_differences)


def main():
    for radius in range(2, 11):
        pts = patch(radius)
        edges, directions = unit_edge_stats(pts)
        print(
            f"R={radius:2d}  points={len(pts):5d}  "
            f"unit_edges={edges:6d}  edges/point={edges / len(pts):6.3f}  "
            f"unit_difference_classes={directions}"
        )


if __name__ == "__main__":
    main()
