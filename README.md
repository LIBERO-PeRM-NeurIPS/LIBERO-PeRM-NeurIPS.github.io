# LIBERO-PeRM project page

Static site for *LIBERO-PeRM: Benchmarking Personalized Robotic Manipulation* (NeurIPS 2026, Evaluations & Datasets Track).

```
index.html            page content
css/style.css         styles (navy rail and hero, cool paper body; the three level colours match the rendered curves)
js/main.js            hero lanes, preference board, task explorer, clip player; set the paper / code / dataset URLs in LINKS at the top
assets/figures/       figures from the paper
assets/reel/          square clips for the three hero lanes, one lane per preference level
assets/tasks/         one clip per task (rollouts + satisfaction curves), the per-step values behind its curves
                      (<task>.curves.json, offered as a download in the player) and tasks.js, the data the page reads
```

`assets/tasks/` and `assets/reel/` are generated from the main repository:

```bash
cd LIBERO
MUJOCO_GL=egl python scripts/render_task_gallery.py     # render every task that has demonstrations
python scripts/review_task_gallery.py                   # hold back clips whose curves need a look
python scripts/export_gallery_curves.py --manifest <gallery>/manifest.json --out <curves>   # per-step values of every curve
python scripts/build_page_assets.py --curves <curves>   # copy clips and curve data here, rewrite assets/tasks/tasks.js
```

Preview locally with a static file server in this directory. The page also opens from `file://`.

Two kinds of link open a specific clip: `#pref=<family>` (for example `#pref=2-3`) selects a preference on the board, and
`#task=<suite>/<task id>` (for example `#task=conflict/pp1_speed_062__joint`) opens a task in the explorer.
