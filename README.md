# LIBERO-PeRM Project Page

Static project page for **LIBERO-PeRM: Benchmarking Personalized Robotic Manipulation**.

Adapted from the [Nerfies](https://nerfies.github.io/) / [Academic Project Page Template](https://github.com/eliahuhorwitz/Academic-project-page-template) (CC BY-SA 4.0), with layout inspiration from [VLA Interpretability](https://cwru-aism.github.io/vla-interp-page/) and [Drive My Way](https://dmw-cvpr.github.io/), used with permission.

## Structure

```
index.html              # single-page site
static/css/index.css    # all custom styles
static/js/index.js      # navbar burger, bibtex copy
static/videos/          # drop demo mp4s here (placeholders in index.html marked TODO)
static/images/          # drop figures here (placeholders in index.html marked TODO)
```

## Replacing placeholders

Every media placeholder in `index.html` is a `div.media-placeholder` preceded by a
`<!-- TODO: replace ... -->` comment showing the exact `<video>`/`<img>` tag to swap in.

## Local preview

```
python3 -m http.server 8000
# open http://localhost:8000
```

## License

CC BY-SA 4.0 (inherited from the template).
