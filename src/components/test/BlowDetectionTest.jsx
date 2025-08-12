import React, { useState, useCallback, useEffect } from 'react';
import useBlowDetection from '@hooks/useBlowDetection';

const BlowDetectionTest = () => {
  const [anyBlowCount, setAnyBlowCount] = useState(0);
  const [doubleBlowCount, setDoubleBlowCount] = useState(0);
  const [longBlowCount, setLongBlowCount] = useState(0);
  const [xlBlowCount, setXLBlowCount] = useState(0);
  const [lastBlowType, setLastBlowType] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [customThreshold, setCustomThreshold] = useState(0.3);
  const [peakLevel, setPeakLevel] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  
  // Reset peak level periodically
  useEffect(() => {
    const resetPeakInterval = setInterval(() => {
      setPeakLevel(prev => prev * 0.8); // Gradually lower the peak
    }, 5000);
    
    return () => clearInterval(resetPeakInterval);
  }, []);
  
  // Update peak level when current level exceeds it
  useEffect(() => {
    if (currentLevel > peakLevel) {
      setPeakLevel(currentLevel);
    }
  }, [currentLevel, peakLevel]);
  
  // Define callbacks for each blow type
  const handleAnyBlow = useCallback(() => {
    setAnyBlowCount(prev => prev + 1);
    setLastBlowType('Any Blow');
  }, []);
  
  const handleDoubleBlow = useCallback(() => {
    setDoubleBlowCount(prev => prev + 1);
    setLastBlowType('Double Blow');
  }, []);
  
  const handleLongBlow = useCallback(() => {
    setLongBlowCount(prev => prev + 1);
    setLastBlowType('Long Blow');
  }, []);
  
  const handleXLBlow = useCallback(() => {
    setXLBlowCount(prev => prev + 1);
    setLastBlowType('XL Blow');
  }, []);
  
  // Level change callback to update audio level display
  const handleLevelChange = useCallback((level) => {
    setCurrentLevel(level);
  }, []);
  
  // Initialize the blow detection hook
  const { 
    permissionStatus,
    isListening,
    isBlowing,
    requestMicrophoneAccess,
    startListening,
    stopListening
  } = useBlowDetection({
    onAnyBlow: handleAnyBlow,
    onDoubleBlow: handleDoubleBlow,
    onLongBlow: handleLongBlow,
    onXLBlow: handleXLBlow,
    onLevelChange: handleLevelChange,
    blowThreshold: customThreshold,
    anyBlowMinDuration: 200,
    longBlowThreshold: 800,
    xlBlowThreshold: 1400,
    doubleBlowMaxGap: 650
  });
  
  // Handle starting/stopping microphone
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      if (permissionStatus !== 'granted') {
        await requestMicrophoneAccess();
      }
      startListening();
    }
  };
  
  // Reset counters
  const resetCounters = () => {
    setAnyBlowCount(0);
    setDoubleBlowCount(0);
    setLongBlowCount(0);
    setXLBlowCount(0);
    setLastBlowType(null);
    setPeakLevel(0);
  };
  
  // Color calculation based on threshold
  const getLevelColor = (level) => {
    if (level >= customThreshold * 1.5) return '#4CAF50'; // Well above threshold - green
    if (level >= customThreshold) return '#8BC34A'; // Just above threshold - light green
    if (level >= customThreshold * 0.7) return '#FFC107'; // Approaching threshold - yellow
    return '#E0E0E0'; // Below threshold - gray
  };
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Blow Detection Test</h1>
      
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px'
      }}>
        <h2>Microphone Status</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <p>
              <strong>Permission:</strong>{' '}
              <span style={{ 
                color: permissionStatus === 'granted' ? 'green' : 
                      permissionStatus === 'denied' ? 'red' : 'orange'
              }}>
                {permissionStatus}
              </span>
            </p>
            <p>
              <strong>Listening:</strong>{' '}
              <span style={{ color: isListening ? 'green' : 'red' }}>
                {isListening ? 'Yes' : 'No'}
              </span>
            </p>
            <p>
              <strong>Blow Detected:</strong>{' '}
              <span style={{ color: isBlowing ? 'green' : 'inherit' }}>
                {isBlowing ? 'Yes' : 'No'}
              </span>
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={toggleListening} 
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: isListening ? '#ff4d4d' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {isListening ? 'Stop Microphone' : 'Start Microphone'}
            </button>
            
            <button 
              onClick={resetCounters}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset Counters
            </button>
            
            <button 
              onClick={() => setShowDetails(!showDetails)}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#9E9E9E',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px'
      }}>
        <h2>Blow Threshold Configuration</h2>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <label htmlFor="threshold-slider">Threshold: </label>
            <strong>{customThreshold.toFixed(2)}</strong>
            <input 
              id="threshold-slider"
              type="range" 
              min="0.05" 
              max="0.5" 
              step="0.01" 
              value={customThreshold}
              onChange={(e) => setCustomThreshold(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Increase this value if normal sounds are triggering blows.
            Decrease it if blowing isn't being detected.
          </p>
        </div>
        
        <div style={{ marginTop: '1rem' }}>
          <h3>Current Audio Level: {(currentLevel * 100).toFixed(1)}%</h3>
          <div style={{
            height: '24px',
            width: '100%',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: '5px'
          }}>
            {/* Current level bar */}
            <div style={{
              height: '100%',
              width: `${currentLevel * 100}%`,
              backgroundColor: getLevelColor(currentLevel),
              transition: 'width 0.1s, background-color 0.2s',
            }} />
            
            {/* Peak indicator */}
            <div style={{
              position: 'absolute',
              left: `${peakLevel * 100}%`,
              top: 0,
              height: '100%',
              width: '2px',
              backgroundColor: '#FF5722',
              transform: 'translateX(-1px)'
            }} />
          </div>
          
          <div style={{
            height: '30px',
            width: '100%',
            position: 'relative',
          }}>
            {/* Threshold line */}
            <div style={{
              position: 'absolute',
              left: `${customThreshold * 100}%`,
              height: '12px',
              width: '2px',
              backgroundColor: '#E91E63',
              top: 0
            }} />
            <span style={{
              position: 'absolute',
              left: `${customThreshold * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '12px',
              top: '14px',
              color: '#E91E63',
              fontWeight: 'bold'
            }}>
              Threshold
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem',
        backgroundColor: '#f8f8f8',
        borderRadius: '8px'
      }}>
        <h2>Detection Results</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#E3F2FD', borderRadius: '4px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{anyBlowCount}</div>
            <div>Any Blow</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#E8F5E9', borderRadius: '4px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{doubleBlowCount}</div>
            <div>Double Blow</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#FFF8E1', borderRadius: '4px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{longBlowCount}</div>
            <div>Long Blow</div>
          </div>
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: '#FFEBEE', borderRadius: '4px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{xlBlowCount}</div>
            <div>XL Blow</div>
          </div>
        </div>
        <p style={{ marginTop: '1rem' }}>
          <strong>Last Detected:</strong> {lastBlowType || 'None'}
        </p>
      </div>
      
      {showDetails && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem',
          backgroundColor: '#f8f8f8',
          borderRadius: '8px'
        }}>
          <h2>Instructions</h2>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Any Blow:</strong> Blow into microphone for at least 200ms</li>
            <li><strong>Double Blow:</strong> Two blows in quick succession (within 650ms)</li>
            <li><strong>Long Blow:</strong> Blow for at least 800ms</li>
            <li><strong>XL Blow:</strong> Blow for at least 1.4 seconds</li>
          </ul>
          <p><strong>Note:</strong> Multiple detections can trigger from a single blow. For example, an XL blow will also count as a Long blow and an Any blow.</p>
          
          <h3 style={{ marginTop: '1rem' }}>Troubleshooting</h3>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>If normal sounds are triggering blows, increase the threshold</li>
            <li>If blowing isn't being detected, decrease the threshold</li>
            <li>Try positioning your microphone differently</li>
            <li>Reduce background noise if possible</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default BlowDetectionTest;