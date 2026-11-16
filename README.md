# ViewNeXt: Diffusion-Based View Synthesis Revisited

Jian Zhang<sup>1*</sup>, Bangya Liu<sup>2,3*</sup>, Nuo Chen<sup>1</sup>, Hao Wang<sup>1,4</sup>, Sisong Bei<sup>5</sup>, Xinyu Gong<sup>6</sup>, Gordon Wetzstein<sup>7</sup>, Yipeng Wang<sup>2</sup>, Zhiwen Fan<sup>1†</sup>

<sup>1</sup>PHAI Lab, TAMU · <sup>2</sup>2077AI · <sup>3</sup>UW-Madison · <sup>4</sup>Google DeepMind · <sup>5</sup>Amazon · <sup>6</sup>Adobe · <sup>7</sup>Stanford<br>
<sup>*</sup>Equal contribution · <sup>†</sup>Corresponding author

[Project page](https://phai-lab.github.io/ViewNext/) · arXiv (coming soon) · Hugging Face (coming soon)

ViewNeXt generates novel views that accurately follow target cameras from a few posed images. A single model, fine-tuned from a pretrained video diffusion model, produces either sparse novel views or a dense video along a camera trajectory. For a trajectory, it first generates sparse anchor views, then the dense video between them.

## Code

Code and model weights are coming soon.

## Citation

```bibtex
@misc{zhang2026diffusion,
  title        = {Diffusion-Based View Synthesis Revisited},
  author       = {Zhang, Jian and Liu, Bangya and Chen, Nuo and Wang, Hao and Bei, Sisong and
                  Gong, Xinyu and Wetzstein, Gordon and Wang, Yipeng and Fan, Zhiwen},
  year         = {2026},
  url          = {https://github.com/phai-lab/ViewNext}
}
```

## Sources

Reference images for the results on the project page come from [DL3DV](https://dl3dv-10k.github.io/DL3DV-10K/), [Mip-NeRF 360](https://jonbarron.info/mipnerf360/), [DROID](https://droid-dataset.github.io/), [Tanks and Temples](https://www.tanksandtemples.org/), museum CC0 photographs, a photo by James St. John (CC BY 2.0), a public-domain painting, generated images, and the YouTube videos below. Music in the trailer: "Mountain Emperor" by Kevin MacLeod ([incompetech.com](https://incompetech.com)), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

<details>
<summary>YouTube videos</summary>

[QVMKFeLtCkE](https://www.youtube.com/watch?v=QVMKFeLtCkE) · [2FWVCcMP3xo](https://www.youtube.com/watch?v=2FWVCcMP3xo) · [9o1nz9bhBHo](https://www.youtube.com/watch?v=9o1nz9bhBHo) · [IXRTOlTFwIo](https://www.youtube.com/watch?v=IXRTOlTFwIo) · [q1rxxuuLA3I](https://www.youtube.com/watch?v=q1rxxuuLA3I) · [hWxHvEDkelk](https://www.youtube.com/watch?v=hWxHvEDkelk) · [BjnBo37YHgQ](https://www.youtube.com/watch?v=BjnBo37YHgQ) · [CrHfhU_yNHg](https://www.youtube.com/watch?v=CrHfhU_yNHg) · [KV0xI7UL8UI](https://www.youtube.com/watch?v=KV0xI7UL8UI) · [Kc9zf7SgcCo](https://www.youtube.com/watch?v=Kc9zf7SgcCo) · [a4vEMlaGtWE](https://www.youtube.com/watch?v=a4vEMlaGtWE) · [oH404OO9ZI0](https://www.youtube.com/watch?v=oH404OO9ZI0)

</details>

## License

This project page is licensed under [CC BY 4.0](LICENSE), except third-party material listed under Sources, which remains under its original licenses.
