# QuasiLab

円形容器内の配向依存粒子を可視化し、12回対称準周期構造の候補を探索するブラウザベースの研究ダッシュボードです。

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Included prototype workflows

- Seeded particle simulation with circular-wall reflection and selectable 3–12 fold patch rendering
- Live structure-factor, rotational-order, score, energy, and history diagnostics
- Potential inspector for radial wells and angular periodicity
- Auto Search configuration and staged-search progress interface
- Ranked result candidates, verification queue, and CSV export
- Reproducible JSON configuration import/export

The live browser visualization is an interactive research-interface prototype. Candidate scores shown in the initial state are illustrative and are explicitly presented as candidate diagnostics rather than proof of quasicrystallinity.
