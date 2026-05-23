from math import ceil, sqrt


RHO = complex(-0.5, sqrt(3) / 2)


def physical(a, b, c, d):
    return a + b * 1j + c * RHO + d * 1j * RHO


def internal(a, b, c, d):
    return a - b * 1j + c * RHO - d * 1j * RHO


def reconstruct(display_radius=4.0, window_radius=4.0):
    bound = int(ceil(display_radius + window_radius)) + 2
    pts = []
    for a in range(-bound, bound + 1):
        for b in range(-bound, bound + 1):
            for c in range(-bound, bound + 1):
                for d in range(-bound, bound + 1):
                    z = physical(a, b, c, d)
                    star = internal(a, b, c, d)
                    if abs(z) <= display_radius + 1e-9 and abs(star) <= window_radius + 1e-9:
                        pts.append((z, (a, b, c, d)))
    return pts


def unit_edges(pts):
    edges = []
    for i, (zi, _) in enumerate(pts):
        for j in range(i + 1, len(pts)):
            if abs(abs(pts[j][0] - zi) - 1.0) < 1e-8:
                edges.append((i, j))
    return edges


def write_svg(pts, edges, path):
    width = 1800
    height = 1800
    margin = 118
    plot_min = -4.45
    plot_max = 4.45
    scale = (width - 2 * margin) / (plot_max - plot_min)

    def xy(z):
        return (
            margin + (z.real - plot_min) * scale,
            height - margin - (z.imag - plot_min) * scale,
        )

    def sx(x):
        return margin + (x - plot_min) * scale

    def sy(y):
        return height - margin - (y - plot_min) * scale

    with open(path, "w", encoding="utf-8") as f:
        f.write(
            '<svg xmlns="http://www.w3.org/2000/svg" '
            f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">\n'
        )
        f.write('<rect width="100%" height="100%" fill="#ffffff"/>\n')
        f.write(
            '<text x="900" y="52" text-anchor="middle" '
            'font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#111">'
            "All z = a + bi + c rho + di rho with |z| &lt; 4 and |z*| &lt; 4"
            "</text>\n"
        )

        f.write('<g stroke="#e9e9e9" stroke-width="1.1">\n')
        for k in range(-4, 5):
            f.write(f'<line x1="{sx(k):.3f}" y1="{sy(plot_min):.3f}" x2="{sx(k):.3f}" y2="{sy(plot_max):.3f}"/>\n')
            f.write(f'<line x1="{sx(plot_min):.3f}" y1="{sy(k):.3f}" x2="{sx(plot_max):.3f}" y2="{sy(k):.3f}"/>\n')
        f.write("</g>\n")

        f.write('<g stroke="#111" stroke-width="2.4" fill="none">\n')
        f.write(f'<rect x="{sx(plot_min):.3f}" y="{sy(plot_max):.3f}" width="{(plot_max-plot_min)*scale:.3f}" height="{(plot_max-plot_min)*scale:.3f}"/>\n')
        f.write("</g>\n")

        f.write('<g font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#111">\n')
        for k in range(-4, 5):
            f.write(f'<text x="{sx(k):.3f}" y="{sy(plot_min)+40:.3f}" text-anchor="middle">{k}</text>\n')
            if k != 0:
                f.write(f'<text x="{sx(plot_min)-28:.3f}" y="{sy(k)+8:.3f}" text-anchor="end">{k}</text>\n')
        f.write(f'<text x="900" y="1765" text-anchor="middle" font-size="32">Re(z)</text>\n')
        f.write(
            '<text x="42" y="900" text-anchor="middle" font-size="32" '
            'transform="rotate(-90 42 900)">Im(z)</text>\n'
        )
        f.write("</g>\n")

        f.write('<g stroke="#1c22d8" stroke-opacity="0.42" stroke-width="0.85">\n')
        for i, j in edges:
            x1, y1 = xy(pts[i][0])
            x2, y2 = xy(pts[j][0])
            f.write(f'<line x1="{x1:.3f}" y1="{y1:.3f}" x2="{x2:.3f}" y2="{y2:.3f}"/>\n')
        f.write("</g>\n")

        f.write('<g fill="#f0a000" stroke="#bd7100" stroke-width="0.55">\n')
        for z, _ in pts:
            x, y = xy(z)
            f.write(f'<circle cx="{x:.3f}" cy="{y:.3f}" r="4.1"/>\n')
        f.write("</g>\n")
        f.write("</svg>\n")


def main():
    pts = reconstruct()
    edges = unit_edges(pts)
    write_svg(pts, edges, "reconstructed_12fold.svg")
    print(f"points: {len(pts)}")
    print(f"unit edges: {len(edges)}")
    print("wrote reconstructed_12fold.svg")


if __name__ == "__main__":
    main()
