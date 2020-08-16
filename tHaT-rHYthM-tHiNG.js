// tHaT-rHYthM-tHiNG.js © 2020 Paul Pomeroy
// This work is licensed under a GNU General Public License v3.0 or later License. (https://spdx.org/licenses/GPL-3.0-or-later.html)
// This code is designed to run in the VCV PROTOTYPE module. (https://vcvrack.com/Prototype#manual) 

//PROTOTYPE settings
config.frameDivider = 32;
config.bufferSize = 0;

// ******
// DECLARATIONS
// ******

  var initialized = false;

  //track and segment pointers
  const _trk1=0, _trk2=1;
  const _seg1=2, _seg2=3, _seg3=4, _seg4=5;

  const _kTrk1Pattern = 0, _kTrk2Pattern = 1, _kReps = 3, _kMode = 4, _kSegment = 5;
  // Actual Value, Last Actual Value, Face Value, Last Face Value
  var kTrk1PatternA, kTrk1PatternLA, kTrk1PatternF, kTrk1PatternLF;
  var kTrk2PatternA, kTrk2PatternLA, kTrk2PatternF, kTrk2PatternLF;

  var kRepsA, kRepsLA, kRepsF, kRepsLF;
  var kSegmentA, kSegmentLA, kSegmentF, kSegmentLF;

  var kModeA, kModeLA, kModeF, kModeLF;
  const modeText = ['Stopped/Edit OK','Stopped/No Edit','Running/No Edit','Running/Edit OK'];
  const _editDisabledMsg = 'Use K5 to enable Edit Mode.';
  var editAllowed = false;

  const _knobRate = 500, _switchRate = 175;
  var kProcessCount, sProcessCount; 

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

  var t=true, n=false; // in the playback of the Patterns, t issues a trigger, n does not.

  const patternSet1=[ // TRACK 1
        [t,n,n,n,n,n, n,n,n,n,n,n,' 0: o----- ------'], // for testing 
        [t,n,n,n,t,n, n,n,t,n,n,n,' 1: o---o- --o---'], // on the 1s (4/4) *
        [t,n,n,t,n,n, t,n,n,t,n,n,' 5: o--o-- o--o--'], // on the 1s (3/4) *
        [n,t,n,n,n,t, n,n,n,t,n,n,' 2: -o---o ---o--'], // on the 2s (4/4)
        [t,n,t,n,t,n, t,n,t,n,t,n,' 3: o-o-o- o-o-o-'], // on the 1s & 3s (4/4) 
        [n,t,n,t,n,t, n,t,n,t,n,t,' 4: -o-o-o -o-o-o'], // on the 2s & 4s (4/4)
        [t,n,t,n,t,t, n,t,n,t,n,t,' 6: o-o-oo -o-o-o'], // std. bell pattern
        [t,n,t,n,t,t, n,t,t,n,t,n,' 7: o-o-oo -oo-o-'], // bell pattern
        [t,t,n,t,t,n, t,n,t,t,n,t,' 8: oo-oo- o-oo-o'], // bell pattern
        [n,t,t,n,t,n, n,t,n,t,t,t,' 9: -oo-o- -o-ooo'], // reverse of Reich pattern
        [t,t,t,n,t,n, n,t,n,t,t,n,'10: ooo-o- -o-oo-'], // Reich pattern *
        [t,n,t,n,t,n, t,t,n,t,n,t,'11: o-o-o- oo-o-o']  // flipped std. bell
    ];
  const patternSet2=[ // TRACK 2
        [t,n,n,n,n,n, n,n,n,n,n,t,' 0: o----- -----o'], // for testing 
        [t,n,n,n,t,n, n,n,t,n,n,n,' 1: o---o- --o---'], // on the 1s (4/4) *
        [t,n,n,t,n,n, t,n,n,t,n,n,' 2: o--o-- o--o--'], // on the 1s (3/4) *
        [t,n,t,n,n,n, t,n,t,n,n,t,' 3: o-o--- o-o--o'], 
        [n,n,t,t,n,n, n,t,n,n,t,t,' 4: --oo-- -o--oo'], 
        [n,t,t,n,t,n, t,n,n,n,t,n,' 5: -oo-o- o---o-'], // primes'], 
        [t,n,t,n,t,t, n,t,n,t,n,n,' 6: o-o-oo -o-o--'], // inverse of standard bell
        [t,n,t,n,t,n, t,t,n,t,n,t,' 7: o-o-o- oo-o-o'], // reverse of standard bell
        [t,n,t,n,t,n, n,t,n,t,n,n,' 8: o-o-o- -o-o--'], // divisive rhythm pattern
        [t,t,n,n,t,n, t,n,n,t,t,n,' 9: oo--o- o--oo-'], 
        [t,t,t,n,t,n, n,t,n,t,t,n,'10: ooo-o- -o-oo-'], // Reich pattern *
        [t,n,n,t,n,t, t,n,n,t,n,n,'11: o--o-o o--o--']  // 3/4 feel']  
    ];
  const _patternCount = 12;
  const livePattern=[]; // holds references to the two selected patterns

  const _repsCount = 8;
  const _modeCount = 4
  const _segmentsCount = 4;

  const _seqLength = 11; // zero-based

  var segmentColors=[[0.0,0.0,0.6],[0.0,0.6,0.6],[0.6,0.6,0.0],[0.6,0.1,0.4]];

  const displayLines = [];
  const _dl1 = 0, _dl2 = 1, _dl3 = 2;

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
      setDisplayLine(_dl1,'Mode: '+modeText[kModeF-1]+' Reps('+kRepsF+')');
      break;
    case 2:
      txt = 'Seg.: ';
      for (let x=1;x<5;x++) {
        if (kSegmentF == x) txt += 'oooooo'; else
          txt += '......';
        if (x==2) txt += ' ';
      }
      setDisplayLine(_dl2,txt);
      break;
    case 3:
      setDisplayLine(_dl3,'');
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
// Change an indicator light
// -*-*-*
function setIndicatorLight(sw,r,g,b) {
  block.lights[sw][0] = r;
  block.lights[sw][1] = g;
  block.lights[sw][2] = b;
}

// -*-*-*
// Advances play positions 
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

function loadPattern(t,p) {
  livePattern[t] = (t==_trk1) ? patternSet1[p] : patternSet2[p];
  setDisplayLine(_dl3,livePattern[t][12]); updateDisplay(false);
  if (t==_trk1 && kSegmentF > 2) return;
  if (t==_trk2 && kSegmentF < 3) return;
  let offset = (!(kSegmentF & 1)) ? 6 : 0;
  for (let x=0;x<6;x++) {
    if (livePattern[t][x+offset]) {
      for (let c=0;c<3;c++) {
        block.switchLights[x][c] = segmentColors[(kSegmentF-1)][c];
      }
    } else {
      for (let c=0;c<3;c++) {
        block.switchLights[x][c] = 0.0;
      }
    }
  }
}

// -*-*-*
// Initialize variables and GUI
// -*-*-*
function guiInit() {
  // ----------------
  // Set some knob values if the script was just loaded into a new module instance
  // (Assumes that if all knobs are 0.5 then this is a new module.)
  // ----------------
  newInit: {
    let newInstance = true;
    test: for (let i=0;i<6;i++) {
      if (block.knobs[i] != 0.5) {
        newInstance = false;
        break test;
      }
    }
    if (newInstance) {
      block.knobs[_kTrk1Pattern] = 0.87; // pattern 10
      block.knobs[_kTrk2Pattern] = 0.87; // pattern 10
      block.knobs[_kSegment] = 0.1; // display segment 1
      block.knobs[_kReps] = 0.22; // 2 reps per cycle
    }
  }
  
  // ----------------
  // Normal initialization
  // ----------------  
  kTrk1PatternA  = block.knobs[_kTrk1Pattern];
  kTrk1PatternLA = 10.1; // force sync with actual value
  kTrk1PatternF  = 1;
  kTrk1PatternLF = 1;
   
  kTrk2PatternA  = block.knobs[_kTrk2Pattern];
  kTrk2PatternLA = 10.1; // force sync with actual value
  kTrk2PatternF  = 1;
  kTrk2PatternLF = 1;

  kSegmentA  = block.knobs[_kSegment];
  kSegmentLA = 10.1; // force sync with actual value
  kSegmentF  = 1;
  kSegmentLF = 1;

  kRepsA  = block.knobs[_kReps];
  kRepsLA = 10.1; // force sync with actual value
  kRepsLF = 0;
  kRepsF = Math.trunc((kRepsA) * 8) + 1;
  kRepsF = (kRepsF>8) ? 8 : kRepsF;
  workingRepsCount = kRepsF;

  kModeA  = block.knobs[_kMode]; 
  kModeLA = 0.625;
  kModeF  = 3;
  kModeLF = 3;
  
  setIndicatorLight(_seg1,1.0,1.0,0.0); // segment 1 displayed
  
  block.knobs[2] = 0.0; // not used
  
  resetVariables();
  kProcessCount = 500; // force immediate sync with actual values of knobs 
  
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
            setDisplayLine(_dl3,_editDisabledMsg);
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

      kTrk1PatternA = block.knobs[_kTrk1Pattern];
      if (kTrk1PatternA != kTrk1PatternLA) {
        kTrk1PatternLA = kTrk1PatternA;
        kTrk1PatternF = Math.trunc((kTrk1PatternA) * _patternCount) + 1;
        kTrk1PatternF = (kTrk1PatternF>_patternCount) ? _patternCount : kTrk1PatternF;
        if (kTrk1PatternF != kTrk1PatternLF) {
          loadPattern(_trk1,(kTrk1PatternF-1));
          kTrk1PatternLF = kTrk1PatternF;
        }
      }

      kTrk2PatternA = block.knobs[_kTrk2Pattern];
      if (kTrk2PatternA != kTrk2PatternLA) {
        kTrk2PatternLA = kTrk2PatternA;
        kTrk2PatternF = Math.trunc((kTrk2PatternA) * _patternCount) + 1;
        kTrk2PatternF = (kTrk2PatternF>_patternCount) ? _patternCount : kTrk2PatternF;
        if (kTrk2PatternF != kTrk2PatternLF) {
          loadPattern(_trk2,(kTrk2PatternF-1));
          kTrk2PatternLF = kTrk2PatternF;
        }
      }

      kModeA = block.knobs[_kMode];
      if (kModeA != kModeLA) {
         kModeLA = kModeA;
        kModeF = Math.trunc((kModeA) * _modeCount) + 1;
        kModeF = (kModeF>4) ? _modeCount : kModeF;
        editAllowed = (kModeF == 1 || kModeF == _modeCount);
        if (kModeF != kModeLF) {
          updateDisplay(true);
          kModeLF = kModeF;
        }
        let r, g, b;
        for (let i=2;i<6;i++) {
          r = 0.0; g = 0.0; b = 0.0;
          if (i==2) {
            if (kModeF < 3) r = 1.0; else g = 1.0;
          } else
          if (i==3) {
            if (!editAllowed) {
              g=0.0;r=0.8;b=0.3;
            } else {
              g=0.8;r=1.0;b=0.0;
            }
          }
          setIndicatorLight(i,r,g,b);
        }
      }

      kRepsA = block.knobs[_kReps];
      if (kRepsA != kRepsLA) {
         kRepsLA = kRepsA;
        kRepsF = Math.trunc((kRepsA) * _repsCount) + 1;
        kRepsF = (kRepsF>_repsCount) ? _repsCount : kRepsF;
        if (kRepsF != kRepsLF) {
          updateDisplay(true);
          kRepsLF = kRepsF;
        }
      }

      kSegmentA = block.knobs[_kSegment];
      if (kSegmentA != kSegmentLA) {
        kSegmentF = Math.trunc((kSegmentA) * 7) + 1;
        kSegmentF = (kSegmentF>4) ? 4 : kSegmentF;
        kSegmentLA = kSegmentA;

        updateDisplay(true);

        for (let x=2;x<6;x++) {
          if (x-1<=kSegmentF) 
            setIndicatorLight(x,1.0,1.0,0.0);
          else 
            setIndicatorLight(x,0.0,0.0,0.0);
        }
        let t = (kSegmentF < 3) ? _trk1 : _trk2;
        let offset = (!(kSegmentF & 1)) ? 6 : 0;
        if (kSegmentF != kSegmentLF) {
          for (let x=0;x<6;x++) {
            if (livePattern[t][x+offset]) {
              for (let c=0;c<3;c++) {
                block.switchLights[x][c] = segmentColors[(kSegmentF-1)][c];
              }
            } else {
              for (let c=0;c<3;c++) {
                block.switchLights[x][c] = 0.0;
              }
            }
          }
          kSegmentLF = kSegmentF;
        }
      } // end of: if (kSegmentA != kSegmentLA) ...
    } // end of: if (++kProcessCount > _knobRate) ...
  } // end of: processInputs ...
} // end of function process(block) ...