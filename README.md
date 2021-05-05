[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/agahkarakuzu/sunrise/HEAD)

## 📥 Installation instructions 

<details><summary> <b>💻 Install locally</b> </font> </summary><br>

### MATLAB

You can execute the scripts in this repository in MATLAB > `R2016b`. Tested in `R2018b`.

Required toolboxes: 
- Image processing toolbox

### Octave

The scripts in this repository are Octave >`v4.0.3` compatible. Tested in `v4.2.2.`. 
Required packages:
- Image 

#### Octave installation instructions 

##### OSX 

1. Open your terminal. Skip steps 2 and 3 if you have  [`Homebrew`](https://brew.sh/) 
installed already.
2. `sudo xcode-select --install`
3. Follow [Homebrew's installation instructions](https://brew.sh/).
4. Ensure that the `brew` is up to date:
   `brew update`
5. Install Octave 
   `brew install octave` 

If you prefer other package managers such as MacPorts or Spack, please visit 
[Octave's official wiki page](http://wiki.octave.org/Octave_for_macOS) for instructions.

##### Ubuntu 

You can simply install Octave by 

```
sudo apt-add-repository ppa:octave/stable
sudo apt-get update
sudo apt-get install octave
```

Detailed instructions are available at [Octave's official wiki page](https://wiki.octave.org/Octave_for_Debian_systems).

##### Windows

Please follow the instructions on [Octave's official wiki page](https://wiki.octave.org/Octave_for_Microsoft_Windows#:~:text=Installers%20for%20Microsoft%20Windows,html%20under%20the%20Windows%20tab.).

#### To use Octave in Jupyter Notebooks 

1. Make sure that you have Octave installed. 
2. If you have Conda/Jupyter/pip installed, go to step 4.
3. Download the [Anaconda Installer](https://www.anaconda.com/products/individual) and install it.
4. Install [Octave kernel](https://pypi.org/project/octave-kernel/): 
   ```
   pip install octave_kernel
   ```
5. Run `jupyter notebook` in your terminal. `Octave` should appear on the list
   for creating a new notebook. 

#### To use MATLAB in Jupyter Notebooks 

1. If you dont have Anaconda installed, please download the [Anaconda Installer](https://www.anaconda.com/products/individual) and install it.
2. Setup the MATLAB Engine API for Python 
   * Open a terminal 
   * Navigate to your MATLAB root folder. To find out the root dir, you can run 
     `matlabroot` command in MATLAB. 
   * In the MATLAB root directory:
     ```
     cd extern/engines/python
     python setup.py install
     ```
3. In terminal run:
   
   ```
   pip install imatlab
   python -mimatlab install
   ```
4. Run `jupyter notebook` in your terminal. `MATLAB` should appear on the list
   for creating a new notebook. 

</details>

<details><summary> <b>🐳 Use with Docker</b> </font> </summary><br>

If you have Docker installed on your computer and running, you can run the code 
in the same environment described in this repository. 

### Option-1: Use `repo2docker` 

1. Simply install `repo2docker` from pyPI: 
```
pip install jupyter-repo2docker
```
2. Run the following command in your terminal:
```
jupyter-repo2docker https://github.com/agahkarakuzu/eda_organized
```

After building (it might take a while!), it should output in your terminal 
something like:

```
Copy/paste this URL into your browser when you connect for the first time,
    to login with a token:
        http://0.0.0.0:36511/?token=f94f8fabb92e22f5bfab116c382b4707fc2cade56ad1ace0
```

This should start a Jupyter session on your browser and make all the resources 
you see when you [launch a Binder](https://mybinder.org/v2/gh/agahkarakuzu/eda_organized/master) for this repository. 

To re-use your container built by repo2docker, do the following: 

1. Run `docker images` command and copy the `IMAGE ID` to your clipboard 
2. Run the following command to start the container:
```
docker run -it --rm -p 8888:8888 `PASTE IMAGE ID HERE` jupyter notebook --ip 0.0.0.0
```

### Option 2: Use Docker image built by this repo

This repository builds and pushes its own Docker images on every release! 

You can see the available versions [here](https://hub.docker.com/r/agahkarakuzu/brainhack20). I will give the instructions for the 
latest version: 

1. Pull the docker image
```
docker pull agahkarakuzu/brainhack20:latest
```
2. Start the container
```
docker run -it --rm -p 8888:8888 agahkarakuzu/brainhack20:latest
```

</details>

<details><summary> <b>☁️ Execute online</b> </font> </summary><br>

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/agahkarakuzu/eda_organized/master)

</details>
