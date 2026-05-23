from math import ceil, pi, sqrt


RHO = complex(-0.5, sqrt(3) / 2)

ROOT_STEPS = [
    (1, 0, 0, 0),
    (0, 0, 0, -1),
    (1, 0, 1, 0),
    (0, 1, 0, 0),
    (0, 0, 1, 0),
    (0, 1, 0, 1),
    (-1, 0, 0, 0),
    (0, 0, 0, 1),
    (-1, 0, -1, 0),
    (0, -1, 0, 0),
    (0, 0, -1, 0),
    (0, -1, 0, -1),
]


def physical(a, b, c, d):
    return a + b * 1j + c * RHO + d * 1j * RHO


def internal(a, b, c, d):
    return a - b * 1j + c * RHO - d * 1j * RHO


def model_patch(physical_radius, window_radius=4.0):
    # If both physical and internal coordinates are bounded, the coefficients are
    # bounded linearly. This simple bound is generous but keeps the script clear.
    bound = int(ceil(physical_radius + window_radius)) + 2
    pts = set()
    for a in range(-bound, bound + 1):
        for b in range(-bound, bound + 1):
            for c in range(-bound, bound + 1):
                for d in range(-bound, bound + 1):
                    z = physical(a, b, c, d)
                    star = internal(a, b, c, d)
                    if abs(z) <= physical_radius + 1e-9 and abs(star) <= window_radius + 1e-9:
                        pts.add((a, b, c, d))
    return pts


def unit_edges_from_root_steps(pts):
    edges = 0
    for p in pts:
        for step in ROOT_STEPS:
            q = tuple(p[i] + step[i] for i in range(4))
            if q in pts and p < q:
                edges += 1
    return edges


def unit_difference_certificate():
    # For z=a+bi+c*rho+d*i*rho, write Re(z)=A+B*sqrt(3), Im(z)=C+D*sqrt(3).
    # If |z|=1 then:
    #   A^2+3B^2+C^2+3D^2=1 and AB+CD=0.
    # In coefficient form this implies the positive equation below, so all
    # solutions are contained in {-2,...,2}^4.
    sols = []
    for a in range(-2, 3):
        for b in range(-2, 3):
            for c in range(-2, 3):
                for d in range(-2, 3):
                    z = physical(a, b, c, d)
                    if abs(abs(z) - 1) < 1e-9:
                        sols.append((a, b, c, d))
    return sorted(sols)


def main():
    print("All coefficient differences with physical length exactly 1:")
    for coeffs in unit_difference_certificate():
        print(" ", coeffs)
    print()

    print("Fixed internal window |star(z)| <= 4, growing physical crop:")
    for radius in [4, 8, 12, 16, 20]:
        pts = model_patch(radius, 4.0)
        edges = unit_edges_from_root_steps(pts)
        print(
            f"Rphys={radius:2d}  points={len(pts):5d}  "
            f"unit_edges={edges:6d}  edges/point={edges / len(pts):6.3f}"
        )


if __name__ == "__main__":
    main()
