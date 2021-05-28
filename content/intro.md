### Introduction

**From acoustic dissonance to magnetic resonance**

This interactive book will teach you `NumPy` and `SciPy` in the context of signal processing. The main exercise is to make some magnetic music by harmoniously mixing MRI acoustic noise with guitar melodies and vocal tracks. I have a special **intro**duction to motivate you:

<center><iframe width="560" height="315" src="https://www.youtube.com/embed/XX0UGblIwMM" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></center>


```{admonition} ISMRM Innovation in MRI Education
<h5>🥈 This course is the silver award winner! </h5>
```

`````{admonition} Listen, interact and re-run
:class: tip
All the interactive content (audio and interactive figures) has been embedded in this Jupyter Book, so you can use interactive features without running a single line of code.
`````

## Why?

```{epigraph}
This would have been a sunrise session if it were a physical meeting.

-- Dan and Miki
```

I prepared this `NumPy` and `SciPy` course for a software engineering educational session at ISMRM 2021 Annual Virtual meeting. There are thousands of great resources to learn about these fundamental Python modules online, but this course is special because: 

* 👨‍🎤 It is artfully tailored for MRI scientists. You make music using MRI sounds as you learn Python.
* 🌅 Despite that the conference is virtual, it is still about sunrise no matter where you are
* 🧲 It comes with a publicly available pulse sequence
* 💽 It teaches scientific computing with Python using community data standards: ISMRM-RD and BIDS 
* 🎚 It includes interactive visualizations
* It is equipped to ensure reproducibility

## Scientific computing with a cooking analogy

All the notebooks are presented in the context of a typical image processing workflow, with an analogy to cooking!

`````{admonition} An overarching theme
:class: tip
Use the tabs below to find out about the culinary skills you will obtain in this course to cook a scientifically nutritious Pythonic dinner! 
`````

````{tabbed} 1 - Shopping
<h3>Know your file formats and data standards</h3>

Most high-level programming languages have a `native` way for packing and unpacking their own objects, such as MATLAB (`*.mat`), Python (`*.pkl`), Julia (`*.jld`) and such. 

<code style="background:yellow;color:black">But when we go to community markets for <code>data shopping</code> to cook a nutritious meal, we usually don't find ingredients available in such formats. </code>

<center><b>Imagine that we'd like to bake a `Pythonic pizza 🍕`,  and we need tomatoes `🍅`</b></center><br>

```{image} ../assets/tomato.png
:class: bg-primary mb-1
:width: 600px
:align: center
```

<center><b>See what a world-class master chef has to say about that</b></center><br>

```{image} ../assets/gordon.png
:class: bg-primary mb-1
:width: 500px
:align: center
```

```{admonition} Fresh MRI ingredients
:class: tip
ISMRM-RD for k-space data and BIDS for reconstructed images. For dealing with audio processing, we will be working with 16-bit `.wav` files, which is frequently used by professional music studios.
```

````

````{tabbed} 2 - Mise en place
<h3>Put everything in place with <code>NumPy</code></h3>
Depending on our research question or application, we often need to dice and slice our data in different ways. `NumPy` is the brand of our chef's knife and all the utensils to put everything in place.

```{image} ../assets/numpy_step2.png
:class: bg-primary mb-1
:width: 500px
:align: center
```

````

````{tabbed} 3 - Call a Python chef
<h3>Let professionals cook for you!</h3>
You can imagine <code>SciPy</code> (or any other Python package) as a culinary academy of Michelin Star Chefs, who are willing to cook your meal for free, if you did the preparation.
<br><br>

```{image} ../assets/scipy_chefs.png
:class: bg-primary mb-1
:width: 500px
:align: center
```
````

````{tabbed} 4 - Share
<h3>Everything tastes better when you share.</h3>

IMHO, sharing our MRI processing recipe with others is a requirement rather than a choice.

<center>It is always good to know what you eat!</center><br>

```{image} https://i.pinimg.com/originals/f9/f0/1b/f9f01bc7b3436efece0c29cca44cc1e1.gif
:class: bg-primary mb-1
:width: 500px
:align: center
```
<br><center>To that end, I equipped this repository with some tools to foster transparency & reproducibility.</center>
````

## What you'll learn

```{image} ../assets/summary.png
:class: bg-primary mb-1
:width: 800px
:align: center
```


#### 1D Data 🎼

Samples from different MRI sequences (including `NORAH JONES`) and some guitar melodies to compose magnetic melodies in Python. Files are in `*.wav` format, storing audio sampled at `44.1kHz` sampling frequency (or `framerate`) 💿. Respecting Nyquist sampling theorem, this `framerate` allows us to digitize analog sound at the highest frequency audiable to human ear (`20kHz`).    

> There are so many Python modules that can load a `*.wav` in a single line, such as `scipy`, `librosa`, `soundfile`, `scikits` etc. 

For demonstration, we will use Python's standard `wave` library and convert data from `byte` array to `numpy` array. 

#### 2D Data 🌅

Images acquired using the `NORAH JONES` sequence at 4 TRs. Each image is `100x100`, organized in [Brain Imaging Data Structure (BIDS)](https://bids-specification.readthedocs.io/en/stable/). We will use `pyBIDS` to query and load this data.

#### 3D Data 🎆

K-space data acquired using the `NORAH JONES` sequence at 4 TRs. Each file contains `100x100x1x16` data (`16` receive channels), organized in [ISMRM Raw Data - ISMRM-RD](https://github.com/ismrmrd/ismrmrd) format. We will use [`ismrmd-python`](https://github.com/ismrmrd/ismrmrd-python) to load this data.