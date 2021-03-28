## Intro

The variable flip angle (VFA) implementation of [qMRLab](https://qmrlab.org) takes following as input:
* Data
     * `VFAData`: [vol X N] image data where N is # of FAs.
     * `B1map`: [vol] b1 transmit field map
     * `Mask`: [vol] binary ROI mask
* Parameters
    * `FA`: [1 X N] array
    * `TR`: [1 X N] array

For details you can see the interactive [`vfa_t1`](https://qmrlab.readthedocs.io/en/master/vfa_t1_batch.html) tutorial [executable online](https://qmrlab.org/jekyll/2018/12/11/T1-mapping-variable-flip-angle.html).

For creating B1map, double angle method is also available in qMRLab: [`b1_dam`](https://qmrlab.readthedocs.io/en/master/b1_dam_batch.html).

***

## Pulse sequence implementation 

### Sequence components 

### Scan control 

### Reconstruction 


***





