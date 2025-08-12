import React, { useState, useEffect } from 'react';
import useBlowDetection from '@hooks/useBlowDetection';

const BlowDetectionDebug = () => {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [blowCount, setBlowCount] = useState(0);
  const [logs, setLogs] = useState([]);

  // Log with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 19)]);
  };

  const handleBlowDetected = () => {
    setBlowCount(prev => prev + 1);
    addLog(`Blow detected! Level: ${audioLevel.toFixed(2)}`);
  };

  const {
    permissionStatus,
    startListening,
    stopListening,
    isListening,
    requestMicrophoneAccess
  } = useBlowDetection({
    onAnyBlow: handleBlowDetected,
    onLevelChange: setAudioLevel,
    // Lower threshold for testing
    blowThreshold: 0.2
  });

  useEffect(() => {
    if (isActive) {
      addLog('Starting blow detection...');
      startListening().then(success => {
        if (success) {
          addLog('Blow detection activated successfully');
        } else {
          addLog('Failed to activate blow detection');
        }
      });
    } else {
      if (isListening) {
        addLog('Stopping blow detection');
        stopListening();
      }
    }

    return () => {
      if (isListening) {
        stopListening();
      }
    };
  }, [isActive, startListening, stopListening, isListening]);

  // Styles for the debugger
  const styles = {
    container: {
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '600px',
      margin: '20px auto',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5'
    },
    header: {
      marginTop: 0,
      marginBottom: '20px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '10px'
    },
    controls: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      gap: '10px',
    },
    button: {
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      flex: 1
    },
    disabledButton: {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed',
    },
    levelContainer: {
      height: '24px',
      backgroundColor: '#e9ecef',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '20px',
      position: 'relative'
    },
    levelBar: {
      height: '100%',
      backgroundColor: audioLevel > 0.2 ? '#28a745' : '#007bff',
      width: `${Math.min(audioLevel * 100, 100)}%`,
      transition: 'width 0.1s ease-out'
    },
    levelText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#212529',
      fontSize: '12px'
    },
    statusContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '20px',
      fontSize: '14px'
    },
    status: {
      padding: '4px 8px',
      borderRadius: '4px',
      backgroundColor: '#e9ecef'
    },
    logsContainer: {
      height: '200px',
      overflowY: 'auto',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '10px',
      backgroundColor: '#fff',
      fontSize: '12px'
    },
    logEntry: {
      margin: '4px 0',
      borderBottom: '1px solid #f0f0f0',
      paddingBottom: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Blow Detection Debugger</h2>

      <div style={styles.controls}>
        <button
          style={{ ...styles.button, ...(isActive ? styles.disabledButton : {}) }}
          onClick={() => {
            requestMicrophoneAccess().then(success => {
              if (success) {
                setIsActive(true);
                addLog('Microphone access granted');
              } else {
                addLog('Failed to get microphone access');
              }
            });
          }}
          disabled={isActive}
        >
          Start
        </button>
        <button
          style={{ ...styles.button, ...(!isActive ? styles.disabledButton : {}) }}
          onClick={() => {
            setIsActive(false);
          }}
          disabled={!isActive}
        >
          Stop
        </button>
      </div>

      <div style={styles.levelContainer}>
        <div style={styles.levelBar}></div>
        <div style={styles.levelText}>Level: {audioLevel.toFixed(2)}</div>
      </div>

      <div style={styles.statusContainer}>
        <div>
          <strong>Status:</strong> <span style={styles.status}>{isListening ? 'Listening' : 'Inactive'}</span>
        </div>
        <div>
          <strong>Permission:</strong> <span style={styles.status}>{permissionStatus}</span>
        </div>
        <div>
          <strong>Blows:</strong> <span style={styles.status}>{blowCount}</span>
        </div>
      </div>

      <div>
        <h3>Debug Logs</h3>
        <div style={styles.logsContainer}>
          {logs.map((log, i) => (
            <div key={i} style={styles.logEntry}>{log}</div>
          ))}
          {logs.length === 0 && <div style={styles.logEntry}>No logs yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default BlowDetectionDebug;
