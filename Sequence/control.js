/*
==================
This is the controller script which is responsible for 
passing the variables between the GUI (control.ui) and 
RTHawk's sequencing engine.

NOt RApid Honestly, JOyful NeverthelESs: NORAH JONES

This is a simple RTHawk application that loops over 4 TRs 
to acquire a single slice at each iteration. TRs and TE are 
adjusted such that the acoustic noise resembles the key signatures 
of 4 chords in Sunrise by Norah Jones. TE is set to 5ms: 
- A#2 (added 7th minor) at 116Hz ~ 13.9ms TR 
- C3  (major) at 130Hz ~ 11.1ms  TR 
- G#2 (major) at 103Hz ~ 14.45ms TR
- D#2 (major) at 155Hz ~ 9.6ms   TR

I literally played it by ear. Figuring our chords from a power spectrum
analysis is a really tricky business. If only Fazil Say was an MRI scientist though...
In addition, songs are not forgiving about messing up their time signature. 
If MRI is about resonance in freq domain, songs are about consonance in time domain.

To play different notes, I changed TRs, which changes chord durations per bar
(bar=TR of a music). But that's the whole point, because this experimental 
sequence is intended for producing teachning material for a Python 
course. Some array slicing, ffts and pitch corrections. Time to put your DSP skills
in good use! Besides, if it is OK for singers to use autotune, it is more than OK for us
to use Python to pitch correct acoustic noise our scanners make.

Waveforms exported by SpinBench and described by application.apd
determine the initial state of the sequence. For this 
application, initial parameters are fetched from: 

- [excitation] SincRF + Z (SlabSelect.spv)
- [echodelay] in us, to be exposed to GUI. (Not linked to a file)
- [readout] 3D Cartesian Readout (CartesianReadout3D.spv)
- [spoiler] Area Trapezoid  (SpoilerGradient.spv)

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

// Get sequence ID
var sequenceId  = rth.sequenceId();

// Fetch initial parameters described in CartesianReadout3D.spv 
var xPixels = SB.readout["<Cartesian Readout>.xRes"]; // Number of samples, no need for this, acquisition emits this. 
var phaseEncodes = SB.readout["<Cartesian Readout>.yRes"]; // Number of repeats 
var zPartitions = SB.readout["<Phase Encode Gradient>.res"]; // Number of partitions (has attr fov as well)

// These values are changed in the SB only.
rth.addCommand(new RthUpdateChangeReconstructionParameterCommand(sequenceId, {
  phaseEncodes: phaseEncodes,
  zPartitions: zPartitions
}));

// Get the sequence parameters from the sequencer.
var scannerParameters = new RthUpdateGetParametersCommand(sequenceId);
rth.addCommand(scannerParameters);
var parameterList = scannerParameters.receivedData();

var instanceName = rth.instanceName();

rth.addSeriesDescription(instanceName);

rth.informationInsert(sequenceId, "mri.SequenceName", "qMRLab " + instanceName);
rth.informationInsert(sequenceId, "mri.ScanningSequence", "GR");
rth.informationInsert(sequenceId, "mri.SequenceVariant", "SS, SP");
rth.informationInsert(sequenceId, "mri.ScanOptions", "");
rth.informationInsert(sequenceId, "mri.MRAcquisitionType", "3D");
rth.informationInsert(sequenceId, "mri.NumberOfAverages", 1);
rth.informationInsert(sequenceId, "mri.NumberOfCoils", parameterList[2]);
rth.informationInsert(sequenceId, "mri.EchoTrainLength", 1);
rth.informationInsert(sequenceId,"mri.ExcitationTimeBandwidth",SB.excitation["<Sinc RF>.timeBandwidth"]);
rth.informationInsert(sequenceId,"mri.ExcitationDuration",SB.excitation["<Sinc RF>.duration"]);
rth.informationInsert(sequenceId,"mri.ExcitationType","Sinc Hamming");

// Get minimum TR
var scannerTR = new RthUpdateGetTRCommand(sequenceId, [], []);
rth.addCommand(scannerTR);
var minTR = scannerTR.tr();
var startingTR = minTR;
RTHLOGGER_WARNING("Minimum TR: " + minTR);

// Starting FOV also depends on CartesianReadout3D.spv
// In SpinBench, FOV is defined in cm. xFOV = yFOV always. 
var startingFOV = SB.readout["<Cartesian Readout>.fov"]; // cm
var startingZFOV = SB.readout["<Phase Encode Gradient>.fov"]; //cm

// Slice thickness depends on SlabSelect.spv
// In SpinBench, SliceThickness is defined in mm.
// RF pulse is associated with the gradient. Changes in SSG updates RF as well. 
var startingThickness = SB.excitation["<Slice Select Gradient>.thickness"]; // mm
// Insert metadata
rth.informationInsert(sequenceId,"mri.SliceThickness",startingThickness);
var startingResolution = startingFOV/xPixels* 10; // mm

rth.informationInsert(sequenceId,"mri.VoxelSpacing",[startingResolution*10,startingResolution*10,startingZFOV/zPartitions*10]);
// Specify TE delay interval 
var minTE = SB.excitation['<Sinc RF>.end'] - SB.excitation['<Sinc RF>.peak'] + SB.readout['<Cartesian Readout>.readoutCenter'];
var startingTE = minTE + rth.apdKey("echodelay/duration")/1000; //ms
rth.informationInsert(sequenceId,"mri.EchoTime",startingTE);

// Assume FA from SB as the smaller.
var startingFA2 = SB.excitation["<Sinc RF>.tip"]; //20
// FA should be in decreasing order (FA1 > FA2)
var startingFA1 = startingFA2 - 17;

// To store the current values 
var sliceThickness = startingThickness;
var fieldOfView = startingFOV;

//FIXME: This is temporary. Fix the order
var flipAngle1 = startingFA2;
var flipAngle2 = startingFA1;

var echoTime = startingTE;
var repetitionTime = startingTR;

// Import display tool

rth.importJS("lib:RthDisplayThreePlaneTools.js");
var displayTools = new RthDisplayThreePlaneTools();

// Change functions

function changeFOV(fov){
  if (fov<startingFOV) fov = startingFOV; 
  var scale = startingFOV/fov;
  // Scale gradients (x,y,z) assuming in-plane isometry
  rth.addCommand(new RthUpdateScaleGradientsCommand(sequenceId,"readout",scale,scale, startingThickness/sliceThickness));
  // Waveforms are not affected by the below: 
  rth.addCommand(new RthUpdateChangeResolutionCommand(sequenceId,startingResolution/scale));
  rth.addCommand(new RthUpdateChangeFieldOfViewCommand(sequenceId, fov*10,fov*10,startingThickness));
  // Annotation
  displayTools.setFOV(fov * 10);
  //displayTool.setResolution(startingResolution/scale,startingResolution/scale);
  // Update
  fieldOfView = fov;
}



function changeSliceThickness(thickness){
  if (thickness < startingThickness) thickness = startingThickness;

  // Scale SS gradient
  // The scaling is always performed with respect to the STARTING VALUE (1). Factors must be always smaller than 1.
  rth.addCommand(new RthUpdateFloatParameterCommand(sequenceId,"excitation","scaleGradients","",startingThickness/thickness));

  // If the slice thickness is increased, so should the zFOV (by scaling down z-grad)
  rth.addCommand(new RthUpdateScaleGradientsCommand(sequenceId,"readout",startingFOV/fieldOfView,startingFOV/fieldOfView,startingThickness/thickness));

  // Update slice prescription UI tools (the green lines in the UI)
  displayTools.setSliceThickness(thickness);
  // Update metadata.
  rth.informationInsert(sequenceId,"mri.SliceThickness",thickness);
  rth.addCommand(new RthUpdateChangeFieldOfViewCommand(sequenceId, fieldOfView*10,fieldOfView*10,thickness));
  rth.addCommand(new RthUpdateChangeSliceThicknessCommand(sequenceId, thickness));
  // zFOV is not equal to the slice thickness, it has a padding of 10mm. Not sure why, but this 
  // was the convention in other 3D waveforms I saw, so I followed. 
  rth.informationInsert(sequenceId,"mri.VoxelSpacing",[fieldOfView/xPixels*10,fieldOfView/phaseEncodes*10,(startingZFOV*thickness/startingThickness)/zPartitions*10]);
  sliceThickness = thickness;

}

function changeTR(tr) {
  if (tr < minTR) {
    tr = minTR;
  }
  // TR is a generic integer parameter, so to be updated by RthUpdateIntParameterCommand
  // Method name is given by "setDesiredTR", defined in microseconds!

  var value = tr * 1000; // Convert from milisec to microsec
  var trCommand = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", value);

  rth.addCommand(trCommand);
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId, "RepetitionTime", tr));

  repetitionTime = tr;

}

function changeFlipAngle1(angle1) {
  //var flipCommand = RthUpdateFloatParameterCommand(sequenceId, "sequence", "scaleRF", "", angle / startingFA1);
  //rth.addCommand(flipCommand);
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId, "FlipAngle1", angle1));

  flipAngle1 = angle1;
}

function changeFlipAngle2(angle2){
  // Just referencing global var here.
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId, "FlipAngle2", angle2));

  flipAngle2 = angle2;
}

function changeTE(te)
{
  
  rth.informationInsert(sequenceId,"mri.EchoTime",te);
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId, "EchoTime", te));

  var echoDelay = (te - minTE) * 1000; // Convert to usec
  rth.addCommand(new RthUpdateIntParameterCommand(sequenceId, "echodelay", "setDelay", "", echoDelay));
  
}


/* Define UI element settings and link outputs from change events to the respective vars
  inputWidget_FOV (Done)
  inputWidget_SliceThickness (Done)
  inputWidget_FA1 (Done)
  inputWidget_FA2 (Done)
  inputWidget_TR  (Done)
*/

// Send metadata to recon
rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId,{
  ExcitationTimeBandwidth: SB.excitation["<Sinc RF>.timeBandwidth"],
  ExcitationDuration: SB.excitation["<Sinc RF>.duration"],
  NumberOfCoils: parameterList[2],
  FlipAngle1:flipAngle1,
  FlipAngle2: flipAngle2,
  FlipAngle: 20,
  PreAcqDuration: SB.readout["<Preacquisitions>.duration"]
}));


controlWidget.inputWidget_SliceThickness.minimum = startingThickness;
controlWidget.inputWidget_SliceThickness.maximum = startingThickness*2;
controlWidget.inputWidget_SliceThickness.value   = startingThickness;

controlWidget.inputWidget_FOV.minimum = startingFOV;
controlWidget.inputWidget_FOV.maximum = startingFOV*2;
controlWidget.inputWidget_FOV.value   = startingFOV;

controlWidget.inputWidget_TR.minimum = minTR;
controlWidget.inputWidget_TR.maximum = minTR + 30;
controlWidget.inputWidget_TR.value   = minTR;

//FIXME: FA param names  
controlWidget.inputWidget_FA1.minimum = startingFA1;
controlWidget.inputWidget_FA1.maximum = 90;
controlWidget.inputWidget_FA1.value   = startingFA2;
//FIXME: FA param names 
controlWidget.inputWidget_FA2.minimum = startingFA1;
controlWidget.inputWidget_FA2.maximum = startingFA1+5;
controlWidget.inputWidget_FA2.value   = startingFA1;

controlWidget.inputWidget_TE.minimum = minTE;
controlWidget.inputWidget_TE.maximum = 8;
controlWidget.inputWidget_TE.value   = 5;


function sessionClicked(chck){

  if (chck){
    controlWidget.sessionBIDS.enabled = true;
    controlWidget.sessionBIDS.setText("00");
  }else{
    controlWidget.sessionBIDS.enabled = false;
    controlWidget.sessionBIDS.text = "";
    controlWidget.sessionBIDS.placeholderText = "_ses-<index>";
  }
}

function acqClicked(chck){

  if (chck){
    controlWidget.acqBIDS.enabled = true;
    controlWidget.acqBIDS.setText("freeform");
  }else{
    controlWidget.acqBIDS.enabled = false;
    controlWidget.acqBIDS.text = "";
    controlWidget.acqBIDS.placeholderText = "_acq-<label>";
  }
}

var acqLabel = "";
function acqTextChanged(txt){
  acqLabel = txt;
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId,"AcquisitionBIDS",acqLabel));

}

var sesIndex = "";
function sesTextChanged(txt){
  sesIndex = txt;
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId,"SessionBIDS",sesIndex));

}

var subIndex = "";
function subTextChanged(txt){
  subIndex = txt;
  rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId,"SubjectBIDS",subIndex));


}

// Connect UI elements to the callback functions.

controlWidget.acqBIDS.textChanged.connect(acqTextChanged);
acqTextChanged(controlWidget.acqBIDS.text);

controlWidget.sessionBIDS.textChanged.connect(sesTextChanged);
sesTextChanged(controlWidget.sessionBIDS.text);

controlWidget.subjectBIDS.textChanged.connect(subTextChanged);
subTextChanged(controlWidget.subjectBIDS.text);

controlWidget.isSessionBIDS.toggled.connect(sessionClicked);
sessionClicked(controlWidget.isSessionBIDS.checked)

controlWidget.isAcqBIDS.toggled.connect(acqClicked);
acqClicked(controlWidget.isAcqBIDS.checked)

controlWidget.inputWidget_FOV.valueChanged.connect(changeFOV);
changeFOV(controlWidget.inputWidget_FOV.value);

controlWidget.inputWidget_TR.valueChanged.connect(changeTR);
changeTR(controlWidget.inputWidget_TR.value);

controlWidget.inputWidget_FA1.valueChanged.connect(changeFlipAngle1);
changeFlipAngle1(controlWidget.inputWidget_FA1.value);

controlWidget.inputWidget_FA2.valueChanged.connect(changeFlipAngle2);
changeFlipAngle2(controlWidget.inputWidget_FA2.value);

controlWidget.inputWidget_TE.valueChanged.connect(changeTE);
changeTE(controlWidget.inputWidget_TE.value);

controlWidget.inputWidget_SliceThickness.valueChanged.connect(changeSliceThickness);
changeSliceThickness(controlWidget.inputWidget_SliceThickness.value);

// ADD LOOP COMMANDS

var bigAngleCommand = new  RthUpdateFloatParameterCommand(sequenceId, "excitation", "scaleRF", "", 1);
// Following sets FlipAngle to 3 when FA1 = 30 and FA2=25 
var smallAngleCommand = new  RthUpdateFloatParameterCommand(sequenceId, "excitation", "scaleRF", "", flipAngle2/flipAngle1);

var tr1Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 11100);
var tr2Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 13900);
var tr3Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 0.9600);
var tr4Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 14450);
var tr5Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 11100);
var tr6Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 13900);
var tr7Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 0.9600);
var tr8Command = new RthUpdateIntParameterCommand(sequenceId, "", "setDesiredTR", "", 14450);


//rth.addCommand(new RthUpdateChangeMRIParameterCommand(sequenceId,{
//  SubjectBIDS: controlWidget.subjectBIDS.text,
//  SessionBIDS: controlWidget.sessionBIDS.text,
//  AcquisitionBIDS: controlWidget.acqBIDS.text
//}));


var infoCommand1 = new RthUpdateChangeMRIParameterCommand(sequenceId,{RepetitionTime: 13.1, RepeatIndex: "01"});
var infoCommand2 = new RthUpdateChangeMRIParameterCommand(sequenceId,{RepetitionTime: 12.9, RepeatIndex: "02"});
var infoCommand3 = new RthUpdateChangeMRIParameterCommand(sequenceId,{RepetitionTime: 9.60, RepeatIndex: "03"});
var infoCommand4 = new RthUpdateChangeMRIParameterCommand(sequenceId,{RepetitionTime: 14.45, RepeatIndex: "04"});


var updateGroup1 = new RthUpdateGroup([tr1Command, infoCommand1]);
var updateGroup2 = new RthUpdateGroup([tr2Command, infoCommand2]);
var updateGroup3 = new RthUpdateGroup([tr3Command, infoCommand3]);
var updateGroup4 = new RthUpdateGroup([tr4Command, infoCommand4]);
var updateGroup5 = new RthUpdateGroup([tr5Command, infoCommand1]);
var updateGroup6 = new RthUpdateGroup([tr6Command, infoCommand2]);
var updateGroup7 = new RthUpdateGroup([tr7Command, infoCommand3]);
var updateGroup8 = new RthUpdateGroup([tr8Command, infoCommand4]);


var loopCommands = [updateGroup1, updateGroup2,updateGroup3,updateGroup4,updateGroup5,updateGroup6,updateGroup7,updateGroup8];

rth.setLoopCommands(sequenceId, "trloop", loopCommands);
