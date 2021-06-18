// tHaT-rHYthM-tHiNG.js – Version 2, © 2021 Paul Pomeroy (R210616a)
// Licensed: GNU General Public License v3.0 or later License. (https://spdx.org/licenses/GPL-3.0-or-later.html)
// This code must run in a VCV PROTOTYPE module. (https://vcvrack.com/Prototype#manual) 

//PROTOTYPE settings
config.frameDivider = 32;
config.bufferSize = 0;

// ******
// DECLARATIONS
// ******
  var initialized = false;

  //various "pointers"
  const _trk1=0, _trk2=1;
  const _kTrk1Pattern = 0, _kTrk2Pattern = 1, _kStartPos = 2, _kReps = 3, _kMode = 4, _kSegment = 5;

  //  Actual Value,    Last Actual,     Face Value,     Last Face Value
  var kTrk1PatternA  , kTrk1PatternLA , kTrk1PatternF , kTrk1PatternLF;
  var kTrk2PatternA  , kTrk2PatternLA , kTrk2PatternF , kTrk2PatternLF;
  var kStartPosA     , kStartPosLA    , kStartPosF    , kStartPosLF;
  var kRepsA         , kRepsLA        , kRepsF        , kRepsLF;
  var kModeA         , kModeLA        , kModeF        , kModeLF;
  var kSegmentA      , kSegmentLA     , kSegmentF     , kSegmentLF;

  const modeText = ['*Paused/Edit OK','*Paused/No Edit','Running/No Edit','Running/Edit OK'];
  const _editDisabledMsg = 'Use K5 to enable Edit Mode.';
  var editAllowed = false;

  const _knobRate = 500, _switchRate = 175;
  var kProcessCount, sProcessCount; 

  var workingRepsCount; // which pass through cycle we've completed

  var displayTimer = 0;

  const _ledTrack1  = 0;
  const _ledTrack2  = 1;
  const _ledStartPos= 2;
  const _ledReps    = 3;
  const _ledMode    = 4;
  const _ledSegment = 5;

  const _outTrack1 = 0;
  const _outTrack2 = 1;
  const _outOR     = 2;
  const _outXOR    = 3;
  const _outNOR    = 4;
  const _outEOC    = 5;

  const _inClock = 0;
  const _inReset = 1;

  const _inputFloor = 4.5;
  const _inputCeiling = 7.0;

  var clockIsHigh = false;
  var resetIsHigh = false;

  const _triggerValue = 10.0;

  var t=true, n=false; // in the playback of the Patterns, t issues a trigger, n does not.

  const patternSet=[ // same pattern set used for both tracks
      [t,n,n,n,n,n, n,n,n,n,n,n,' 1: o----- ------'], // just the first
      [t,n,n,n,n,n, t,n,n,n,n,n,' 2: o----- o-----'], // on the sixes
      [t,n,n,n,t,n, n,n,t,n,n,n,' 3: o---o- --o---'], // 4/4 on the 1
      [t,t,n,n,t,t, n,n,t,t,n,n,' 4: oo--oo --oo--'], // 4/4 on the 1 and 2
      [t,n,t,n,t,n, t,n,t,n,t,n,' 5: o-o-o- o-o-o-'], // 4/4 on the 1 and 3  
      [t,t,n,t,t,t, n,t,t,t,n,t,' 6: oo-ooo -ooo-o'], // 4/4 on the 1, 2 and 4
      [t,n,t,t,t,n, t,t,t,n,t,t,' 7: o-ooo- ooo-oo'], // 4/4 on the 1, 3 and 4
      [t,t,t,n,t,t, t,n,t,t,t,n,' 8: ooo-oo o-ooo-'], // 4/4 on the 1, 2 and 3
      [n,t,n,n,n,t, n,n,n,t,n,n,' 9: -o---o ---o--'], // 4/4 on the 2
      [n,t,n,t,n,t, n,t,n,t,n,t,'10: -o-o-o -o-o-o'], // 4/4 on the 2 and 4
      [t,n,n,t,n,n, t,n,n,t,n,n,'11: o--o-- o--o--'], // 3/4 on the 1
      [n,t,n,n,t,n, n,t,n,n,t,n,'12: -o--o- -o--o-'], // 3/4 on the 2
      [n,n,t,n,n,t, n,n,t,n,n,t,'13: --o--o --o--o'], // 3/4 on the 3
      [t,t,n,t,t,n, t,t,n,t,t,n,'14: oo-oo- oo-oo-'], // 3/4 on the 1 and 2
      [t,n,t,t,n,t, t,n,t,t,n,t,'15: o-oo-o o-oo-o'], // 3/4 on the 1 and 3
      [n,t,t,n,t,t, n,t,t,n,t,t,'16: -oo-oo -oo-oo'], // 3/4 on the 2 and 3
      [t,n,n,t,t,n, t,n,n,t,t,n,'17: o--oo- o--oo-'], // 3/4 on the 1 then on the 1 and 2
      [t,n,t,n,t,t, n,t,n,t,n,t,'18: o-o-oo -o-o-o'], // standard bell pattern
      [n,t,n,t,n,t, n,n,t,n,t,n,'19: -o-o-o --o-o-'], // reversed inverse standard bell
      [t,n,t,n,t,t, n,t,t,n,t,n,'20: o-o-oo -oo-o-'], // bell pattern 2
      [t,t,n,t,t,n, t,n,t,t,n,t,'21: oo-oo- o-oo-o'], // bell pattern 3
      [t,t,t,n,t,t, n,t,n,t,t,n,'22: ooo-oo -o-oo-'], // Reich pattern
      [n,n,n,t,n,n, t,n,t,n,n,t,'23: ---o-- o-o--o'], // inverse Reich pattern
      [n,t,t,n,t,n, t,n,n,t,n,t,'24: -oo-o- o--o-o'], // reversed 2nd halves of 22 and 23
      [t,n,n,n,n,n, n,t,n,n,n,n,'25: o----- -o----'], // on the 1 and 8
      [t,n,t,n,n,n, n,t,n,t,n,n,'26: o-o--- -o-o--'], // on the 1, 3, 8, 10
      [n,t,t,n,t,n, t,n,n,n,t,n,'27: -oo-o- o---o-'], // primes (2,3,5,7,11)
      [t,n,n,t,n,t, n,t,t,t,n,t,'28: o--o-o -ooo-o'], // inverse prime (1,4,6,8,9,10,12)
      [n,t,n,n,n,t, n,t,n,t,t,n,'29: -o---o -o-oo-'], // reversed primes (2, 6, 8, 10, 11)
      [n,t,t,t,t,t, t,t,t,t,t,t,'30: -ooooo oooooo']  // every beat but the first
    ];
  const _stepsPerPattern = 12 // not zero-based
  const _patternCount = 30;

  const livePattern=[]; // holds clones of the two selected patterns
  const _segmentsCount = 4;

  const _repsCount = 12;
  const _modeCount = 4

  var segmentColors=[[0.0,0.0,0.6],[0.0,0.6,0.6],[0.6,0.6,0.0],[0.6,0.1,0.4]];

  const displayLines = [];
  const _dl1 = 0, _dl2 = 1, _dl3 = 2;
  const displayLine3label = "Trk2 start position ";
  const displayLine3pad = '             ';

  var playPositionTrack1, playPositionTrack2 = 1; // (min=1; max=12)
  var startPositionLockedTrack2 = false;
  var startPositionTrack2 = 1;
  const startPositionSymbolTrack2 = ['x','^'];

// ******
// FUNCTIONS
// ******

function setDisplayLine(l,txt) {
  displayLines[l] = txt;
}

function buildDisplayLine(l) {
  let txt = '';
  switch (l) {
    case _dl1:
      setDisplayLine(_dl1,'Mode: '+modeText[kModeF-1] + ' | Reps: '+ kRepsF);
      break;
      
    case _dl2:
      let x, b = 0;
      let beats = [];
      let beat = [["o","."],["O","-"]];
      
      let d = (kSegmentF == 1) ? 1 : 0;
      for (x=0;x<6;x++) {
        beats[b++] = (livePattern[_trk1][x]) ? beat[d][0] : beat[d][1];
      }
      beats[b++] = ' ';
      d = (kSegmentF == 2) ? 1 : 0;
      for (x=6;x<12;x++) {
        beats[b++] = (livePattern[_trk1][x]) ? beat[d][0] : beat[d][1];
      }
      beats[b++] = '|';
      d = (kSegmentF == 3) ? 1 : 0;
      for (x=0;x<6;x++) {
        beats[b++] = (livePattern[_trk2][x]) ? beat[d][0] : beat[d][1];
      }
      beats[b++] = ' ';
      d = (kSegmentF == 4) ? 1 : 0;
      for (x=6;x<12;x++) {
        beats[b++] = (livePattern[_trk2][x]) ? beat[d][0] : beat[d][1];
      }
      beats[b++] = ' ';
      txt = 'Seg.: ' + beats.join(''); 
      setDisplayLine(_dl2,txt);
      break;
      
    case _dl3:
      txt = displayLine3label; 
      let sym = (startPositionLockedTrack2) ? 0 : 1;
      sym = displayLine3pad + startPositionSymbolTrack2[sym];
      if (startPositionTrack2 < 7) 
        txt = txt + sym.slice(-(startPositionTrack2));
      else // there's a space between steps 6 and 7 so move symbol position ...
        txt = txt + sym.slice(-(startPositionTrack2+1)); // ... one space to the right      
      setDisplayLine(_dl3,txt);
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
function setIndicatorLight(light,r,g,b) {
  block.lights[light][0] = r;
  block.lights[light][1] = g;
  block.lights[light][2] = b;
}

// -*-*-*
// Advances play positions 
// -*-*-*
function advancePlayPositions() {
  if (++playPositionTrack1 > _stepsPerPattern) {
    handleEOC();
    playPositionTrack1 = 1;
  }
  if (++playPositionTrack2 > _stepsPerPattern)
    playPositionTrack2 = 1;
}

// -*-*-*
// EOC is when playPositionTrack1 is at the end of the sequence AND 
// the end of the requested # of repeats. The EOC trigger is sent 
// after the last step of the cycle is processed and BEFORE the first
// step of the new cycle. THIS IS ALSO WHERE TRACK 2 GETS SHIFTED AHEAD.
// -*-*-*
function handleEOC() {
  if (playPositionTrack1 > _stepsPerPattern) {
    if (++workingRepsCount >= kRepsF) { // EOC
      workingRepsCount = 0;
      if (!startPositionLockedTrack2) {
        if (++startPositionTrack2 > _stepsPerPattern) // EOC advance for Track 2 start position
          startPositionTrack2 = 1;
      }
      playPositionTrack2 = startPositionTrack2 - 1; // will be advanced before played again
        
      block.outputs[_outEOC][0] = _triggerValue; // Send EOC Trigger
      if (kRepsLF != kRepsF) {
        resetVariables(); // they changed the reps count
      }
      buildDisplayLine(_dl3);
      if (displayTimer < 250) updateDisplay(false);
    } 
  }
}

function loadPattern(t,p) {
  livePattern[t] = [].concat(patternSet[p]); // this CLONES the original array for the pattern
  
console.log('*** That-Rhythm-Thing : Pattern for Track '+ t+1 +' set to: ' + livePattern[t][12]);
  
  setDisplayLine(_dl3,'Trk ' + (t+1) + '-> Ptrn ' + livePattern[t][12]);
  displayTimer = Date.now() + 4000;
  buildDisplayLine(_dl2); 
  updateDisplay(false);
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
      block.knobs[_kTrk1Pattern] = 0.08; // pattern 3
      block.knobs[_kTrk2Pattern] = 0.08; // pattern 3
      block.knobs[_kStartPos] = 0.0 // track 2 position not fixed
      block.knobs[_kReps] = 0.22; // 2 reps per cycle
      block.knobs[_kSegment] = 0.1; // display segment 1
    }
  }
  
  // ----------------
  // Normal initialization
  // ----------------  
  kTrk1PatternA  = block.knobs[_kTrk1Pattern];
  kTrk1PatternLA = 99; // force sync with actual value
  kTrk1PatternF  = 1;
  kTrk1PatternLF = 1;
  livePattern[_trk1] = [].concat(patternSet[1]);
   
  kTrk2PatternA  = block.knobs[_kTrk2Pattern];
  kTrk2PatternLA = 99; // force sync with actual value
  kTrk2PatternF  = 1;
  kTrk2PatternLF = 1;
  livePattern[_trk2] = [].concat(patternSet[1]); 

  kStartPosA  = block.knobs[_kStartPos]; 
  kStartPosLA = 99; // force sync with actual value
  kStartPosF  = Math.trunc((kStartPosA) * _stepsPerPattern) + 1;
  kStartPosF = (kStartPosF>_stepsPerPattern) ? _stepsPerPattern : kStartPosF;
  kStartPosLF = 99; // force sync with actual value

  kSegmentA  = block.knobs[_kSegment];
  kSegmentLA = 99; // force sync with actual value
  kSegmentF  = 1;
  kSegmentLF = 99; // force sync with actual value

  kRepsA  = block.knobs[_kReps];
  kRepsLA = 99; // force sync with actual value
  kRepsLF = 0;
  kRepsF = Math.trunc((kRepsA) * _repsCount) + 1;
  kRepsF = (kRepsF>_repsCount) ? _repsCount : kRepsF;

  kModeA  = block.knobs[_kMode]; 
  kModeLA = 99; // force sync with actual value
  kModeF  = 3;
  kModeLF = 99; // force sync with actual value
  
  resetVariables();
  
  sProcessCount = _switchRate + 1; // force immediate sync with actual values of switches
  kProcessCount = _knobRate + 1; // force immediate sync with actual values of knobs 

  setIndicatorLight(_ledStartPos,0,0.9,0);
  setIndicatorLight(_ledReps,0,0.9,0); 

  initialized = true;
} // end of guiInit()

// -*-*-*
// Reinitialize variables and GUI
// -*-*-*
function resetVariables() {
  workingRepsCount = 0; // haven't played through pattern yet
  playPositionTrack1 = 0; // will be advanced to 1 before played again
  if (!startPositionLockedTrack2) {
    playPositionTrack2 = 0; // will be advanced to 1 before played again
    startPositionTrack2 = 1;
  }
  else {
    startPositionTrack2 = kStartPosF; // NOT zero-based
    playPositionTrack2 = startPositionTrack2 - 1; // will be advanced before played again
  }
  kProcessCount = 0; 
  sProcessCount = 0; 
  
  clockIsHigh = false;  
  resetIsHigh = false;
  
  block.outputs[_outTrack1][0] = 0;
  block.outputs[_outTrack2][0] = 0;
  block.outputs[_outOR][0] = 0;
  block.outputs[_outXOR][0] = 0;
  block.outputs[_outNOR][0] = 0;
  
  setIndicatorLight(_ledTrack1,0.0,0.0,0.0);
  setIndicatorLight(_ledTrack2,0.0,0.0,0.0);

  updateDisplay(true);
}

// ************************************************************
// VCV PROTOTYPE MAIN PROCESS
// ************************************************************
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
        resetIsHigh = true; // reset will occur on next cycle
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
        let out1 = (livePattern[_trk1][playPositionTrack1-1]) ? _triggerValue : 0;
        block.outputs[_outTrack1][0] = out1;
        if (out1==_triggerValue) 
          setIndicatorLight(_outTrack1,0.0,1.0,1.0);
        else
          setIndicatorLight(_outTrack1,0.0,0.0,0.0);
        
        // Track 2
        let out2 = (livePattern[_trk2][playPositionTrack2-1]) ? _triggerValue : 0;
        block.outputs[_outTrack2][0] = out2;
        if (out2==_triggerValue) 
          setIndicatorLight(_outTrack2,0.0,1.0,1.0);
        else
          setIndicatorLight(_outTrack2,0.0,0.0,0.0);

        //
        // Logical combinations of Tracks 1 and 2
        //
        let trackOuts = out1 + out2;
        
        // Track 1 NOR Track 2
        if (trackOuts == 0) { // neither fired
          block.outputs[_outNOR][0] = _triggerValue;
          block.outputs[_outOR][0] = 0;
          block.outputs[_outXOR][0] = 0;
        } 
        else { // at leat one fired
          block.outputs[_outNOR][0] = 0;
          // Track 1 OR Track 2
          if (trackOuts > 0) // one or both fired
            block.outputs[_outOR][0] = _triggerValue;
           // Track 1 XOR Track 2
          if (trackOuts == _triggerValue) // just one fired
            block.outputs[_outXOR][0] = _triggerValue;
        }
      }
    } 
    else   
    if (clockIsHigh && CLOCK < _inputCeiling) {
      clockIsHigh = false; // clock pulse turned low
      block.outputs[_outTrack1][0] = 0;
      block.outputs[_outTrack2][0] = 0;
      block.outputs[_outOR][0] = 0;
      block.outputs[_outXOR][0] = 0;
      block.outputs[_outNOR][0] = 0; // _triggerValue; <== ????
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
        let trk = (kSegmentF < 3) ? _trk1 : _trk2;
        let offset = (!(kSegmentF & 1)) ? 6 : 0;
        if (block.switches[s]) { // they're pressing this switch
          if (!editAllowed) {
            setDisplayLine(_dl3,_editDisabledMsg);
            displayTimer = Date.now() + 3000;
            updateDisplay(false);
            break checkSwitches;
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
          buildDisplayLine(_dl2);
          updateDisplay(false);
          sProcessCount -=125; // slow down the next process 
          break checkSwitches; // only one switch pressed at a time
        }
      }
    }
    // ------
    // process knob changes once every _knobRate cycles
    // ------
    if (++kProcessCount > _knobRate) { 
      kProcessCount = 0; // reset counter             
      //
      // First, clear temporary Display Line 3 messages if timed out
      //
      if (displayTimer > 0) {
        if ((Date.now() - displayTimer) > 0) {
          displayTimer = 0;
          buildDisplayLine(_dl3);
          updateDisplay(false);
        }
      }
      //
      // TRACK 1 Pattern
      //
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
      //
      // TRACK 2 Pattern
      //
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
      //
      // Fixed Position for Track 2
      //
      kStartPosA = block.knobs[_kStartPos];
      if (kStartPosA != kStartPosLA) {
        kStartPosLA = kStartPosA;
        kStartPosF = Math.trunc((kStartPosA) * _stepsPerPattern);
        kStartPosF = (kStartPosF > _stepsPerPattern) ? _stepsPerPattern : kStartPosF; // 0-12; 0 = not locked
        if (kStartPosF > 0) {
          startPositionLockedTrack2 = true;
          startPositionTrack2 = kStartPosF;
          setIndicatorLight(_ledStartPos,0.9,0,0); // red
          setIndicatorLight(_ledReps,0.9,0.7,0); // yellow
        }
        else {
          startPositionLockedTrack2 = false;
          // let startPositionTrack2 stay where it is
          setIndicatorLight(_ledStartPos,0,0.9,0); // green
          setIndicatorLight(_ledReps,0,0.9,0); // green
        }
        if (kStartPosF != kStartPosLF) {
          kStartPosLF = kStartPosF;
          buildDisplayLine(_dl3);
          updateDisplay(false);
        }
      }
      //
      // Run/Edit MODE
      //
      kModeA = block.knobs[_kMode];
      if (kModeA != kModeLA) {
        kModeLA = kModeA;
        kModeF = Math.trunc((kModeA) * _modeCount) + 1;
        kModeF = (kModeF>4) ? _modeCount : kModeF;
        editAllowed = (kModeF == 1 || kModeF == _modeCount);
        
        if (kModeF != kModeLF) {
          kModeLF = kModeF;
          let r, g, b;
          switch(kModeF) {
            case 1:
              r = 0.7; g = 0.7; b = 0.0;
              break;
            case 2:  
              r = 1.0; g = 0.0; b = 0.0;
              break;
            case 3:  
              r = 0.0; g = 1.0; b = 0.0;
              break;
            case 4:  
              r = 0.0; g = 0.7; b = 0.7;
              break;
            default:  
              r = 0.0; g = 0.0; b = 0.0;
          }
          setIndicatorLight(_ledMode,r,g,b);
          updateDisplay(true);
        }
      }
      //
      // REPETITION COUNT (# of iterations for each cycle)
      //
      kRepsA = block.knobs[_kReps];
      if (kRepsA != kRepsLA) {
        kRepsF = Math.trunc((kRepsA) * _repsCount) + 1;
        kRepsF = (kRepsF > _repsCount) ? _repsCount : kRepsF;
        kRepsLA = kRepsA;
      }
      if (kRepsF != kRepsLF) {
        updateDisplay(true);
        kRepsLF = kRepsF;
      }
      //
      // SEGMENT SELECT (to load swtiches so user can edit a pattern segment)
      //
      kSegmentA = block.knobs[_kSegment];
      if (kSegmentA != kSegmentLA) {
        kSegmentF = Math.trunc((kSegmentA) * _segmentsCount) + 1;
        kSegmentF = (kSegmentF>_segmentsCount) ? _segmentsCount : kSegmentF;
        kSegmentLA = kSegmentA;
        updateDisplay(true);

        let trk = (kSegmentF < 3) ? _trk1 : _trk2;
        let offset = (!(kSegmentF & 1)) ? 6 : 0;
        if (kSegmentF != kSegmentLF) {
          let s = kSegmentF-1;
          setIndicatorLight(_ledSegment,segmentColors[s][0],segmentColors[s][1],segmentColors[s][2]);
          for (let x=0;x<6;x++) {
            if (livePattern[trk][x+offset]) {
              for (let c=0;c<3;c++) {
                block.switchLights[x][c] = segmentColors[s][c];
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