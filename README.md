# LIBERO-PeRM project page

Static site for *LIBERO-PeRM: Benchmarking Personalized Robotic Manipulation* (NeurIPS 2026, Evaluations & Datasets Track).

```
index.html            page content
css/style.css         styles
js/main.js            interactions; set the paper / code / dataset URLs in LINKS at the top
assets/figures/       figures from the paper
assets/reel/          square clips for the hero video wall
assets/tasks/         one clip per task (rollouts + satisfaction curves) and tasks.js, the data the page reads
```

`assets/tasks/` and `assets/reel/` are generated from the main repository:

```bash
cd LIBERO
MUJOCO_GL=egl python scripts/render_task_gallery.py     # render every task that has demonstrations
python scripts/review_task_gallery.py                   # hold back clips whose curves need a look
python scripts/build_page_assets.py                     # copy clips here and rewrite assets/tasks/tasks.js
```

Preview locally with a static file server in this directory. The page also opens from `file://`.

Layout modeled on the [LIBERO-Recover](https://liulin815.github.io/LIBERO-Recovery/) project page.
