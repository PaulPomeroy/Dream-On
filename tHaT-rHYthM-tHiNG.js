// tHaT-rHYthM-tHiNG.js © 2020 Paul Pomeroy
// This work is licensed under a GNU General Public License v3.0 or later License. (https://spdx.org/licenses/GPL-3.0-or-later.html)
// This code is designed to run in the VCV PROTOTYPE module. (https://vcvrack.com/Prototype#manual) 

//PROTOTYPE settings
config.frameDivider = 32;
config.bufferSize = 0;

//variable declarations and inits

let testing = false;

var initialized = false;

//track and segment pointers
const _trk1=0, _trk2=1;
const _seg1=2, _seg2=3, _seg3=4, _seg4=5;

const _kReps = 0, _kSegment = 3, _kMode = 4;
// Actual Value, Last Actual Value, Functional Value, Last Functional Value
var kRepsA, kRepsLA, kRepsF, kRepsLF;
var kSegmentA, kSegmentLA, kSegmentF, kSegmentLF;

var kModeA, kModeLA, kModeF, kModeLF;
const modeText = ['Stopped/Edit OK','Stopped/No Edit','Running/No Edit','Running/Edit OK'];
var editAllowed = false;

const _knobRate = 500, _switchRate = 175;
var kProcessCount = 0, sProcessCount = 0; 

var kRepsCount, workingRepsCount; // Rep# knob

const _outTrack1 = 0;
const _outTrack2 = 1;
const _outEOC = 5;

const _inClock = 0;
const _inReset = 1;

const _inputFloor = 4.5;
const _inputCeiling = 7.0;
var clockIsHigh = false;
var resetIsHigh = false;

const _triggerValue = 10.0;

var playpositionTrack1, playpositionTrack2;

var t=true, f=false;

var TESTPATTERN=[[t,t,t,f,f,f, f,f,f,f,f,f],
                 [f,f,f,t,f,f, f,f,t,f,t,f]];

var initPattern=[[t,f,t,f,t,t, f,t,f,t,f,t],
                 [t,f,t,f,t,t, f,t,f,t,f,t]];

var livePattern=[];

const _seqLength = 11; // zero-based

var segmentColors=[[0.0,0.0,0.6],[0.0,0.6,0.6],[0.6,0.0,0.6],[0.6,0.6,0.0]];

const displayLines = [];
const _l1 = 0, _l2 = 1, l3 = 2;

// ******
// FUNCTIONS
// ******

function setDisplayLine(l,txt) {
  displayLines[l] = txt;
}

function buildDisplayLine(l) {
  let txt = '';
  switch (l) {
    case 1:
      setDisplayLine(0,'Mode: '+modeText[kModeF-1]+' Reps('+kRepsF+')');
      break;
    case 2:
      txt = 'Seg.: ';
      for (let x=1;x<5;x++) {
        if (kSegmentF == x) txt += 'oooooo'; else
          txt += '......';
        if (x==2) txt += ' ';
      }
      setDisplayLine(1,txt);
      break;
    case 3:
      setDisplayLine(2,'');
      break;
    default:
      for (let l=1;l<4;l++) {setDisplayLine(l,'')};
 }
}
  
function updateDisplay(reset) {
  if (reset) {
    for (let l=0;l<3;l++) {buildDisplayLine(l)}
  }
  let txt = displayLines.join('\n');
  display(txt);
}

// -*-*-*
// Deep-copy a nested array
// -*-*-*
const deepCopy = (src) => {
  let key,val,copy;
  if (typeof src !== "object" || src === null) return src;
  copy=Array.isArray(src) ? [] : {};
  for (key in src) {val=src[key];copy[key]=deepCopy(val);}
  return copy;
}

// -*-*-*
// Change an indicator light
// -*-*-*
function setIndicatorLight(sw,r,g,b) {
  block.lights[sw][0] = r;
  block.lights[sw][1] = g;
  block.lights[sw][2] = b;
}

// -*-*-*
// Advances play positions and returns true if trk 1 is back to start of sequence 
// -*-*-*
function advancePlayPositions() {
  if (++playpositionTrack2 > _seqLength)
    playpositionTrack2 = 0;
  if (++playpositionTrack1 > _seqLength) {
    playpositionTrack1 = 0;
  }
}

// -*-*-*
// EOC is when playpositionTrack1 is at the end of the sequence AND 
// the end of the requested # of repeats. The EOC trigger is sent 
// after the last step of the cycle is processed and BEFORE the first
// step of the new cycle. THIS IS ALSO WHERE TRACK 2 GETS SHIFTED AHEAD.
// -*-*-*
function handleEOC() {
  if (playpositionTrack1 == _seqLength) { 
    if (kRepsCount == workingRepsCount) { // EOC
      if (++playpositionTrack2 > _seqLength) // EOC advance for Track 2
        playpositionTrack2 = 0;
      block.outputs[_outEOC][0] = _triggerValue;
      kRepsCount = 1;
      if (workingRepsCount != kRepsF) {
        workingRepsCount = kRepsF;
        resetVariables(); // they changed the reps count
      }
    } else
    ++kRepsCount;
  }
}

// -*-*-*
// Initialize variables and GUI
// -*-*-*
function guiInit() {
  
  kSegmentLF = 1;
  kSegmentF  = 1;
  kSegmentLA = 0;
  kSegmentA  = 0;

  kRepsLF = 2;
  kRepsF  = 2;
  kRepsLA = 0.16;
  kRepsA  = 0.16;

  kModeLF = 3;
  kModeF  = 3;
  kModeLA = 0.625;
  kModeA  = 0.625;
  
  setIndicatorLight(_seg1,1.0,1.0,0.0); // segment 1 displayed
  
  for (let x=0;x<5;x++) {
    block.knobs[x] = 0.0;
  }
    
  block.knobs[_kReps] = kRepsA;
  workingRepsCount = kRepsF;
  
  block.knobs[_kMode] = kModeA;
  
  livePattern = (testing) ? livePattern=deepCopy(TESTPATTERN) 
                          : livePattern=deepCopy(initPattern);
  
  for (let x=0;x<6;x++) {  // Set the lights (switches) for all 4 segments
    if (livePattern[0][x]) {
      for (let c=0;c<3;c++) {
        block.switchLights[x][c] = segmentColors[0][c];
      }
    } else {
      for (let c=0;c<3;c++) {
        block.switchLights[x][c] = 0.0;
      }
    }
  }
  
  resetVariables();
  
  updateDisplay(true);
  initialized = true;
} // end of guiInit()

// -*-*-*
// Initialize variables and GUI
// -*-*-*
function resetVariables() {
  kRepsCount = 1;
  playpositionTrack1 = -1;
  playpositionTrack2 = -1;
  kProcessCount = 0; 
  sProcessCount = 0; 
  clockIsHigh = false;  
  resetIsHigh = false;
}

// ============================================================
// PROTOTYPE MAIN PROCESS
// ============================================================
function process(block) {
  if (!initialized) guiInit();
  
// 
// process clock and reset pulses every cycle
// 
  processInputs: {
    // ------
    // Process Reset signal
    // ------
    let RESET = block.inputs[_inReset];
    if (resetIsHigh) {
      if (RESET < _inputCeiling) 
        resetVariables(); // will set resetIsHigh to false
    }
    else { // reset was not high
      if (RESET > _inputFloor)
        resetIsHigh = true;
    }
    // ------
    // Process Clock pulse
    // ------
    let CLOCK = block.inputs[_inClock];
    if ((kModeF > 2) && !clockIsHigh && (CLOCK > _inputFloor)) {
      clockIsHigh = true; // clock pulse turned high
      
      advancePlayPositions();
      
      sendOutputs: {
        // Track 1
        let out = (livePattern[_trk1][playpositionTrack1]) ? _triggerValue : 0;
        block.outputs[_outTrack1][0] = out;
        if (out==_triggerValue) 
          setIndicatorLight(_outTrack1,0.0,1.0,1.0);
        else
          setIndicatorLight(_outTrack1,0.0,0.0,0.0);
        // Track 2
        out = (livePattern[_trk2][playpositionTrack2]) ? _triggerValue : 0;
        block.outputs[_outTrack2][0] = out;
        if (out==_triggerValue) 
          setIndicatorLight(_outTrack2,0.0,1.0,1.0);
        else
          setIndicatorLight(_outTrack2,0.0,0.0,0.0);
      }
      handleEOC(); // will send EOC trigger and bump playpositionTrack2
    } 
    else   
    if (clockIsHigh && CLOCK < _inputCeiling) {
      clockIsHigh = false; // clock pulse turned low
      block.outputs[_outTrack1][0] = 0;
      block.outputs[_outTrack2][0] = 0;
      block.outputs[_outEOC][0] = 0;
      setIndicatorLight(_outTrack1,0.0,0.0,0.0);
      setIndicatorLight(_outTrack2,0.0,0.0,0.0);
    }  
    // ------
    // process switch clicks once every _switchRate cycles
    // ------
    checkSwitches: if (++sProcessCount > _switchRate) {
      sProcessCount = 0;
      for (let s=0;s<6;s++) {
        let trk, offset;
        if (block.switches[s]) { // they're pressing this switch
          if (!editAllowed) {
            setDisplayLine(2,'You are not in Edit Mode.');
            updateDisplay(false);
            break checkSwitches;
          }
          if (kSegmentA <= 0.15) {
            trk = 0; offset=0;
          } else 
          if (kSegmentA <= 0.3) {
            trk = 0; offset=6;
          } else 
          if (kSegmentA <= 0.45) {
            trk = 1; offset=0;
          } else {
            trk = 1; offset=6;
          }
          offset += s;
          livePattern[trk][offset] = !livePattern[trk][offset]; // toggle it
          if (livePattern[trk][offset]) {
            for (let c=0;c<3;c++) {
              block.switchLights[s][c] = segmentColors[kSegmentF-1][c]; // turn it on
            }
          } else
          for (let c=0;c<3;c++) {
            block.switchLights[s][c] = 0; // turn ot off
          }
          sProcessCount -=200; // slow down the next process 
          break checkSwitches; // only one switch pressed at a time
        }
      }
    }
    // ------
    // process knob changes once every _knobRate cycles
    // ------
    if (++kProcessCount > _knobRate) { 
      kProcessCount = 0;

      kModeA = block.knobs[_kMode];
      if (kModeA != kModeLA) {
         kModeLA = kModeA;
        kModeF = Math.trunc((kModeA) * 4) + 1;
        kModeF = (kModeF>4) ? 4 : kModeF;
        editAllowed = (kModeF == 1 || kModeF == 4);
        if (kModeF != kModeLF) {
          updateDisplay(true);
          kModeLF = kModeF;
        }
        let r, g;
        for (let i=2;i<6;i++) {
          r = 0.0, g = 0.0;
          if (i-1 <= kModeF) {
            if (editAllowed) {g=1.0} else {r=1.0}}
          setIndicatorLight(i,r,g,0.0);
        }
      }

      kRepsA = block.knobs[_kReps];
      if (kRepsA != kRepsLA) {
         kRepsLA = kRepsA;
        kRepsF = Math.trunc((kRepsA) * 8) + 1;
        kRepsF = (kRepsF>8) ? 8 : kRepsF;
        if (kRepsF != kRepsLF) {
          updateDisplay(true);
          kRepsLF = kRepsF;
        }
      }

      kSegmentA = block.knobs[_kSegment];
      if (kSegmentA != kSegmentLA) {
        let trk, offset; let txt = '';
        kSegmentLA = kSegmentA;
        if (kSegmentA <= 0.15) {
          kSegmentF = 1; trk = 0; offset=0;
        } else 
        if (kSegmentA <= 0.3) {
          kSegmentF = 2; trk = 0; offset = 6;
       } else 
        if (kSegmentA <= 0.45) {
          kSegmentF = 3; trk = 1; offset = 0;
        } else {
          kSegmentF = 4; trk = 1; offset=6;
        }
        updateDisplay(true);

        for (let x=2;x<6;x++) {
          if (x-1<=kSegmentF) 
            setIndicatorLight(x,1.0,1.0,0.0);
          else 
            setIndicatorLight(x,0.0,0.0,0.0);
        }
        if (kSegmentF != kSegmentLF) {
          for (let x=0;x<6;x++) {  
            if (livePattern[trk][x+offset]) {
              for (let c=0;c<3;c++) {
                block.switchLights[x][c] = segmentColors[kSegmentF-1][c];
              }
            } else {
              for (let c=0;c<3;c++) {
                block.switchLights[x][c] = 0.0;
              }
            }
          }
          kSegmentLF = kSegmentF;
        }
      }
    }
  }
}
