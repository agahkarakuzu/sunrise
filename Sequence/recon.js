/*
NOt RApid Honestly, JOyful NeverthelESs: NORAH JONES

This script is responsible for observing raw data,
reconstructing images and saving ks.

Waveforms exported by SpinBench and described by application.apd
determine the initial state of the sequence. For this 
application, initial parameters are fetched from: 

- [excitation] SincRF + Z (SlabSelect.spv)
- [echodelay] in us, to be exposed to GUI. (Not linked to a file)
- [readout] 3D Cartesian Readout (CartesianReadout3D.spv)
- [spoiler] Area Trapezoid  (SpoilerGradient.spv)

For now, base resolution components are hardcoded to be 
256X256mm (inplane) and 5mm (slab thickness) for the 
3D readout. 

TODO: These parameters are to be fetched from controller. 

If you happen to have RTHawk and would like to reproduce this
sequence (wow, that's a thing), just create a folder named 
SUNRISE on your Ubuntu desktop and the outputs will be saved there.

RTH version: 2.5.2-3423-g7edfaf413c

Adapted from qMRLab VFA-T1 pulse sequence: 
https://github.com/qMRLab/pulse_sequences 

Author:  Agah Karakuzu agahkarakuzu@gmail.com
Created: April 2021
// =================================================
*/

var sequenceId = rth.sequenceId();
var instanceName = rth.instanceName();

var observer = new RthReconRawObserver();
observer.setSequenceId(sequenceId);
observer.observeValueForKey("acquisition.samples", "samples");
// Disable button after observer is discond
observer.scanDisabled.connect(rth.deactivateScanButton);

function reconBlock(input) {
  
  var that  = this;
  //this.sort = new RthReconRawToImageSort();
  
  //this.sort.observeKeys(["acquisition.samples","reconstruction.phaseEncodes","reconstruction.partitions"]);
  //this.sort.observedKeysChanged.connect(function(keys){
   // that.sort.setPhaseEncodes(keys["reconstruction.phaseEncodes"]);
    //that.sort.setSamples(keys["acquisition.samples"]);
    //that.sort.setSliceEncodes(keys["reconstruction.zPartitions"]);
    //that.sort.setAccumulate(keys["reconstruction.phaseEncodes"]*keys["reconstruction.zPartitions"]);
  //});
  
 this.sort3d = new RthReconSort();
 this.sort3d.setIndexKeys(["acquisition.<Cartesian Readout>.index", "acquisition.<Repeat 1>.index"]);
 this.sort3d.setInput(input);
 this.sort3d.observeKeys(["mri.RunNumber"]);
 this.sort3d.observedKeysChanged.connect(
  function(keys) {
    that.sort3d.resetAccumulation();
    var yEncodes = keys["reconstruction.phaseEncodes"];
    var samples = keys["acquisition.samples"];
    //var coils = keys["acquisition.channels"];
    var zEncodes = keys["reconstruction.zPartitions"];
    //this.sort3d.extent = [samples, coils, yEncodes, zEncodes]; // if the input is [samples x coils]
    that.sort3d.extent = [samples, yEncodes, zEncodes]; // if the input is [samples]
    that.sort3d.accumulate = yEncodes * zEncodes;
  }
);

  this.rawSplit = new RthReconRawSplitter();
  this.rawSplit.objectName = "Split for TR ";
  this.rawSplit.setInput(this.sort3d.output());

  this.fft = new RthReconImageFFT();
  this.fft.objectName = "FFT(" + ")";
  this.fft.setInput(this.rawSplit.output(-1));

  this.output = function() {
  return this.fft.output();
  };

  this.rawOutput = function() {
    return this.rawSplit.output(-1);
  };



}

// For each `coil we need sort and FFT.

var sos = new RthReconImageSumOfSquares();
var pack = new RthReconImagePack();

var block  = [];

function connectCoils(coils){
  block = [];
  for (var i = 0; i<coils; i++){
    block[i] = new reconBlock(observer.output(i));
    sos.setInput(i,block[i].output());
    pack.setInput(i,block[i].rawOutput());
  }
 rth.collectGarbage();
}

observer.coilsChanged.connect(connectCoils);

rth.importJS("lib:RthImageThreePlaneOutput.js");

function ExportBlock(input,inputRaw){

  var that = this;

  //var imageExport = new RthReconToQmrlab();
  // This is a bit annoying, but the only option for now. 
  this.imageExport = new RthReconImageExport();

  this.changeInformation = new RthReconImageChangeInformation();

  var reconKeys = new Array();
  
  reconKeys = [
    // For now, addTag does not support type string. 
    "mri.SequenceName",
    "mri.ScanningSequence",
    "mri.SequenceVariant",
    "mri.MRAcquisitionType",
    "mri.NumberOfCoils",
    "mri.ExcitationTimeBandwidth",
    "mri.ExcitationDuration",
    "mri.ExcitationType",
    "mri.VoxelSpacing",
    "mri.EchoTime",
    "mri.RepetitionTime",
    "mri.FlipAngle1",
    "mri.FlipAngle2",
    "mri.FlipAngle", // Belonging to the current loop
    "mri.SliceThickness",
    "reconstruction.phaseEncodes",
    "acquisition.samples",
    "reconstruction.zPartitions",
    "mri.PreAcqDuration",
    "geometry.TranslationX",
    "geometry.TranslationY",
    "geometry.TranslationZ",
    "geometry.QuaternionW",
    "geometry.QuaternionX",
    "geometry.QuaternionY",
    "geometry.QuaternionZ",
    "geometry.FieldOfViewX",
    "geometry.FieldOfViewY",
    "geometry.FieldOfViewZ",
    "mri.RepeatIndex", // Ensured that this one will change per run.
    "mri.SubjectBIDS",
    "mri.SessionBIDS",
    "mri.AcquisitionBIDS",
    "equipment.device/manufacturer",
    "equipment.device/manufacturerModelName",
    "equipment.device/softwareVersions",
    "equipment.gradient/dcGain",
    "equipment.gradient/xMaximumAmplitude",
    "equipment.gradient/xRiseTime",
    "equipment.gradient/xDbdtDistance",
    "equipment.hostManufacturerModelName",
    "equipment.hostSoftwareVersions",
    "equipment.magnet/fieldStrength",
    "equipment.prescan/cf",
    "equipment.prescan/maxB1",
    "equipment.prescan/nucleus",
    "equipment.prescan/r1",
    "equipment.prescan/r2",
    "equipment.prescan/refPulseInGauss",
    "equipment.prescan/refVoltage",
    "equipment.prescan/status",
    "equipment.prescan/tg",
    "equipment.prescan/xs",
    "equipment.prescan/ys",
    "equipment.prescan/zs",
    "equipment.regulatory/peakSar",
  ];


  for (var i = 0; i<reconKeys.length; i++){
    this.imageExport.addInformationKey(reconKeys[i]);
  }


this.imageExport.observeKeys([
  "mri.SubjectBIDS",
  "mri.SessionBIDS",
  "mri.AcquisitionBIDS",
  "mri.RepeatIndex"
]);

this.imageExport.observedKeysChanged.connect(function(keys){

    var exportDirectory = "~/Desktop/SUNRISE/";
    var RepeatIndex = keys["mri.RepeatIndex"];
    var subjectBIDS  = "sub-" + keys["mri.SubjectBIDS"];
    var sessionBIDS = (keys["mri.SessionBIDS"]) ? "_ses-" + keys["mri.SessionBIDS"] : "";
    var acquisitionBIDS = (keys["mri.AcquisitionBIDS"]) ? "_acq-" + keys["mri.AcquisitionBIDS"] : "";
    var exportFileName  = exportDirectory + subjectBIDS + sessionBIDS + acquisitionBIDS + "_tr-" + RepeatIndex + "_NORAHJONES.dat";
    that.imageExport.setFileName(exportFileName);

  });

  this.imageExportRaw = new RthReconImageExport();
  this.imageExportRaw.objectName = "save_raw"

  this.imageExportRaw.observeKeys([
    "mri.SubjectBIDS",
    "mri.SessionBIDS",
    "mri.AcquisitionBIDS",
    "mri.RepeatIndex"
  ]);

  this.imageExportRaw.observedKeysChanged.connect(function(keys){
    var RepeatIndex = keys["mri.RepeatIndex"];
    var exportDirectory = "~/Desktop/SUNRISE/";
    var subjectBIDS  = "sub-" + keys["mri.SubjectBIDS"];
    var sessionBIDS = (keys["mri.SessionBIDS"]) ? "_ses-" + keys["mri.SessionBIDS"] : "";
    var acquisitionBIDS = (keys["mri.AcquisitionBIDS"]) ? "_acq-" + keys["mri.AcquisitionBIDS"] : "";
    var exportFileNameRaw  = exportDirectory + subjectBIDS + sessionBIDS + acquisitionBIDS + "_tr-" + RepeatIndex + "_NORAHJONES_raw.dat";
    that.imageExportRaw.setFileName(exportFileNameRaw);
  });
  
  this.imageExport.objectName = "save_image";
  
  this.imageExport.setInput(input);
  this.imageExportRaw.setInput(inputRaw);
  
  RTHLOGGER_WARNING("saving...");

  //this.imageExport.saveFileSeries(true);

  // This is a sink node, hence no output.
}


var splitter = RthReconSplitter();
splitter.objectName = "splitOutput";
splitter.setInput(sos.output());


var threePlane = new RthImageThreePlaneOutput();
threePlane.setInput(splitter.output(0));

var exporter  = new ExportBlock(splitter.output(1),pack.output());
