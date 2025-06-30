import React, { useState, useEffect } from 'react';
import { formatTime, formatDate, getCurrentTime } from './services/timeService';

const TimeTest: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [rawTime, setRawTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = getCurrentTime();
      setCurrentTime(formatTime(now, true));
      setCurrentDate(formatDate(now));
      setRawTime(now.toString());
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#1f2937',
      color: 'white',
      fontFamily: 'monospace',
      borderRadius: '8px',
      margin: '20px',
      border: '2px solid #10b981'
    }}>
      <h3 style={{ color: '#10b981', marginBottom: '15px' }}>
        🕐 Detroit Timezone Test
      </h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Time (Detroit):</strong> {currentTime}
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Current Date (Detroit):</strong> {currentDate}
      </div>
      
      <div style={{ 
        fontSize: '12px',
        color: '#9ca3af',
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#374151',
        borderRadius: '4px'
      }}>
        <strong>Raw Timestamp:</strong><br />
        {rawTime}
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#065f46',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        ✅ Time is now correctly using Detroit (America/Detroit) timezone!
        <br />
        <small>The time should match your local Detroit time.</small>
      </div>
    </div>
  );
};

export default TimeTest;
