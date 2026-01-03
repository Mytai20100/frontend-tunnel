'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
const loadSettings = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dashboardSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
  }
  return {
    fontSize: 14,
    seasonalEffects: true,
    fontFamily: 'system-ui',
    showMinerList: true,
    particleCount: 50,
    particleSize: 20,
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6'
  };
};

// Save settings to localStorage
const saveSettings = (settings) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
  }
};
// SVG Icons
const Icons = {
  Moon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Sun: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Cpu: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    </svg>
  ),
  Memory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="12" x2="2" y2="12"/>
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      <line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>
    </svg>
  ),
  Network: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  TrendDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  Minus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  Settings: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Snowflake: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" opacity="0.9">
      <path d="M12 2L12 22M12 2L9 5M12 2L15 5M12 22L9 19M12 22L15 19"/>
      <path d="M2 12L22 12M2 12L5 9M2 12L5 15M22 12L19 9M22 12L19 15"/>
      <path d="M5.64 5.64L18.36 18.36M5.64 5.64L7.76 8.35M5.64 5.64L8.35 7.76M18.36 18.36L16.24 15.65M18.36 18.36L15.65 16.24"/>
      <path d="M18.36 5.64L5.64 18.36M18.36 5.64L16.24 8.35M18.36 5.64L15.65 7.76M5.64 18.36L7.76 15.65M5.64 18.36L8.35 16.24"/>
      <circle cx="12" cy="12" r="1.5" fill="white"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ea580c" opacity="0.9">
      <path d="M12 2C12 2 4 6 4 14C4 18 6 22 12 22C18 22 20 18 20 14C20 6 12 2 12 2Z"/>
      <path d="M12 2C12 2 12 10 12 22" stroke="#92400e" strokeWidth="1" fill="none"/>
    </svg>
  ),
  Flower: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ec4899" opacity="0.9">
      <circle cx="12" cy="8" r="3"/><circle cx="8" cy="12" r="3"/><circle cx="16" cy="12" r="3"/>
      <circle cx="10" cy="16" r="3"/><circle cx="14" cy="16" r="3"/>
      <circle cx="12" cy="12" r="2" fill="#fbbf24"/>
    </svg>
  ),
  SunIcon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" opacity="0.8">
      <circle cx="12" cy="12" r="5"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#f59e0b" strokeWidth="2"/>
    </svg>
  )
};

// Seasonal particle component
const SeasonalParticle = memo(({ type, delay, duration, left, size = 20 }) => {
  const Icon = type === 'snowflake' ? Icons.Snowflake : 
               type === 'leaf' ? Icons.Leaf :
               type === 'flower' ? Icons.Flower : Icons.SunIcon;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: '-30px',
        left: `${left}%`,
        animation: `${type === 'flower' ? 'floatUp' : 'fallDown'} ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.9,
        willChange: 'transform',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Icon />
    </div>
  );
});

// Seasonal Effects Component
const SeasonalEffects = memo(({ season, month, enabled, particleCount, particleSize }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!enabled || !mounted) return null;
    
    let particleType = 'snowflake';
    
    if (month === 12 || month === 1 || month === 2) {
      particleType = 'snowflake';
    } else if (month >= 3 && month <= 5) {
      particleType = 'flower';
    } else if (month >= 6 && month <= 8) {
      particleType = 'sun';
    } else if (month >= 9 && month <= 11) {
      particleType = 'leaf';
    }
    
    return [...Array(particleCount)].map((_, i) => (
      <SeasonalParticle
        key={i}
        type={particleType}
        delay={Math.random() * 5}
        duration={particleType === 'flower' ? 4 + Math.random() * 6 : 5 + Math.random() * 10}
        left={Math.random() * 100}
        size={particleSize}
      />
    ));
  }, [enabled, month, mounted, particleCount, particleSize]);

  if (!enabled || !mounted) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      pointerEvents: 'none', 
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {particles}
      <style>{`
        @keyframes fallDown {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        @keyframes floatUp {
          to {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
});

// Settings Modal
const SettingsModal = memo(({ show, onClose, settings, setSettings, theme, setTheme, isDark }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!show && !isClosing) return null;

  const fontOptions = [
    { value: 'system-ui', label: 'System' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times' },
    { value: 'Courier New', label: 'Courier' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Tahoma', label: 'Tahoma' }
  ];

  return (
    <>
      <style>{`
        @keyframes modalSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes modalSlideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes overlayFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          animation: `${isClosing ? 'overlayFadeOut' : 'overlayFadeIn'} 0.3s ease-out`
        }} 
        onClick={handleClose}
      >
        <div 
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '400px',
            maxWidth: '90vw',
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.2)',
            overflowY: 'auto',
            animation: `${isClosing ? 'modalSlideOut' : 'modalSlideIn'} 0.3s ease-out`,
            padding: '24px'
          }} 
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Settings</h2>
            <button onClick={handleClose} style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: isDark ? '#ffffff' : '#111827',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#374151' : '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Font Size */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Font Size: {settings.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="20"
                value={settings.fontSize}
                onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? '#374151' : '#e5e7eb',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Font Family */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Font Family
              </label>
              <select
                value={settings.fontFamily}
                onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  backgroundColor: isDark ? '#111827' : '#f9fafb',
                  color: isDark ? '#ffffff' : '#111827',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: settings.fontFamily
                }}
              >
                {fontOptions.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Particle Count */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Particle Count: {settings.particleCount}
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={settings.particleCount}
                onChange={(e) => setSettings({ ...settings, particleCount: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? '#374151' : '#e5e7eb',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Particle Size */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Particle Size: {settings.particleSize}px
              </label>
              <input
                type="range"
                min="10"
                max="40"
                value={settings.particleSize}
                onChange={(e) => setSettings({ ...settings, particleSize: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  height: '6px',
                  borderRadius: '3px',
                  background: isDark ? '#374151' : '#e5e7eb',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Colors */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Primary Color
              </label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                style={{
                  width: '100%',
                  height: '50px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  cursor: 'pointer'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>
                Accent Color
              </label>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                style={{
                  width: '100%',
                  height: '50px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* Toggle Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.showMinerList}
                  onChange={(e) => setSettings({ ...settings, showMinerList: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px' }}>Show Miner List</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.seasonalEffects}
                  onChange={(e) => setSettings({ ...settings, seasonalEffects: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px' }}>Seasonal Effects</span>
              </label>
            </div>

            {/* Theme */}
            <div>
              <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '15px' }}>Theme</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  onClick={() => setTheme('light')}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: theme === 'light' ? `2px solid ${settings.primaryColor}` : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    backgroundColor: isDark ? '#111827' : '#f9fafb',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: theme === 'dark' ? `2px solid ${settings.primaryColor}` : `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    backgroundColor: isDark ? '#111827' : '#f9fafb',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                const defaultSettings = {
                  fontSize: 14,
                  seasonalEffects: true,
                  fontFamily: 'system-ui',
                  showMinerList: true,
                  particleCount: 50,
                  particleSize: 20,
                  primaryColor: '#3b82f6',
                  accentColor: '#8b5cf6'
                };
                setSettings(defaultSettings);
                saveSettings(defaultSettings);
              }}
              style={{
                padding: '14px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? '#ef4444' : '#fca5a5'}`,
                backgroundColor: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                marginTop: '16px'
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

// Trend Indicator
const TrendIndicator = memo(({ trend }) => {
  if (!trend || trend.direction === 'neutral' || trend.percentage === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.6 }}>
        <Icons.Minus />
        <span>0%</span>
      </div>
    );
  }
  
  const color = trend.direction === 'up' ? '#10b981' : '#ef4444';
  const Icon = trend.direction === 'up' ? Icons.TrendUp : Icons.TrendDown;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color }}>
      <Icon />
      <span>{trend.percentage.toFixed(1)}%</span>
    </div>
  );
});

// Metric Card
const MetricCard = memo(({ icon: Icon, title, value, subtitle, isDark, trend }) => (
  <div style={{
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = isDark ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 8px 16px rgba(0, 0, 0, 0.1)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)';
  }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ color: '#3b82f6' }}>
          <Icon />
        </div>
        <span style={{ fontSize: '14px', opacity: 0.7, fontWeight: '500' }}>{title}</span>
      </div>
      {trend && <TrendIndicator trend={trend} />}
    </div>
    <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{value}</p>
    <p style={{ fontSize: '13px', opacity: 0.6 }}>{subtitle}</p>
  </div>
));

// Utility function to safely convert to number
const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

export default function Dashboard() {
  const [wallet, setWallet] = useState('');
  const [savedWallet, setSavedWallet] = useState('');
  const [minerData, setMinerData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [previousMetrics, setPreviousMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [apiStatus, setApiStatus] = useState({ metrics: 'checking', miner: 'idle' });
  const [notification, setNotification] = useState(null);
  const [logs, setLogs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [settings, setSettings] = useState(loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);
  const [allMiners, setAllMiners] = useState([]);
  const [commitHash, setCommitHash] = useState('Loading...');

  const currentMonth = new Date().getMonth() + 1;
  const season = 'winter';
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);
  const logsContainerRef = useRef(null);
  const minersList = useMemo(() => {
  if (metrics && metrics.miners) {
    return metrics.miners.list || [];
  }
  return [];
}, [metrics?.miners?.active_count]);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetch('https://api.github.com/repos/Mytai20100/frontend-tunnel/commits/main')
      .then(res => res.json())
      .then(data => setCommitHash(data.sha?.substring(0, 7) || 'unknown'))
      .catch(() => setCommitHash('unknown'));
  }, []);

  const parseMetrics = useCallback((metricsText) => {
  const lines = metricsText.split('\n').filter(line => line && !line.startsWith('#'));
  const parsed = {
    system: {
      uptime_seconds: 0,
      cpu_cores: 0,
      cpu_usage_percent: 0,
      cpu_model: 'Unknown',
      ram_total_bytes: 0,
      ram_used_bytes: 0,
      disk_total_bytes: 0,
      disk_used_bytes: 0,
      public_ip: 'N/A'
    },
    miners: {
      active_count: 0,
      list: []  // THAY ĐỔI TỪ active_miners THÀNH list
    },
    network: {
      total_download_bytes: 0,
      total_upload_bytes: 0
    },
    pools: {}
  };

  const minerHashrates = new Map();
  const uniqueMiners = new Set();

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('mining_tunnel_uptime_seconds')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.uptime_seconds = safeNumber(value);
    } else if (trimmedLine.includes('mining_tunnel_cpu_usage_percent')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.cpu_usage_percent = safeNumber(value);
      console.log('CPU metric found:', trimmedLine, '-> parsed as:', parsed.system.cpu_usage_percent);
    } else if (trimmedLine.includes('mining_tunnel_cpu_cores')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.cpu_cores = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_ram_bytes{type="total"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.ram_total_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_ram_bytes{type="used"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.ram_used_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_disk_bytes{type="total"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.disk_total_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_disk_bytes{type="used"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.system.disk_used_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_bytes_total{direction="download"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.network.total_download_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_bytes_total{direction="upload"}')) {
      const value = trimmedLine.split(' ').pop();
      parsed.network.total_upload_bytes = parseInt(value) || 0;
    } else if (trimmedLine.includes('mining_tunnel_miner_hashrate')) {
      const match = trimmedLine.match(/wallet="([^"]+)",miner="([^"]+)",type="([^"]+)"/);
      if (match) {
        const [, wallet, miner, type] = match;
        const value = trimmedLine.split(' ').pop();
        const hashrate = safeNumber(value);
        
        if (type === 'current') {
          const key = `${wallet}:${miner}`;
          uniqueMiners.add(miner);
          
          if (!minerHashrates.has(key)) {
            minerHashrates.set(key, { wallet, miner, hashrate });
          }
        }
      }
    } else if (trimmedLine.includes('mining_tunnel_pool_')) {
      const poolMatch = trimmedLine.match(/pool="([^"]+)"/);
      if (poolMatch) {
        const poolName = poolMatch[1];
        if (!parsed.pools[poolName]) {
          parsed.pools[poolName] = {
            shares_accepted: 0,
            shares_rejected: 0,
            avg_accept_time_ms: 0
          };
        }
        if (trimmedLine.includes('shares_total') && trimmedLine.includes('status="accepted"')) {
          const value = trimmedLine.split(' ').pop();
          parsed.pools[poolName].shares_accepted = parseInt(value) || 0;
        } else if (trimmedLine.includes('shares_total') && trimmedLine.includes('status="rejected"')) {
          const value = trimmedLine.split(' ').pop();
          parsed.pools[poolName].shares_rejected = parseInt(value) || 0;
        } else if (trimmedLine.includes('accept_time_ms')) {
          const value = trimmedLine.split(' ').pop();
          parsed.pools[poolName].avg_accept_time_ms = safeNumber(value);
        }
      }
    }
  });

  parsed.miners.list = Array.from(minerHashrates.values()).map(m => {
    const minerName = m.miner.includes('.') ? m.miner.split('.').slice(1).join('.') : m.miner;
    
    return {
      wallet: m.wallet,
      miner_name: minerName,
      ip: 'N/A',
      hashrate: m.hashrate
    };
  });

  parsed.miners.active_count = uniqueMiners.size;
  parsed.miners.active_miners = parsed.miners.list;
  console.log('Parsed metrics:', parsed);
  console.log('Unique miners count:', uniqueMiners.size);
  console.log('Miners list:', parsed.miners.list);

  return parsed;
}, []);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const calculateTrend = useCallback((current, previous) => {
    if (!previous || previous === 0) return { direction: 'neutral', percentage: 0 };
    const diff = ((current - previous) / previous) * 100;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      percentage: Math.abs(diff)
    };
  }, []);
const fetchMetrics = useCallback(async () => {
  try {
    setApiStatus(prev => ({ ...prev, metrics: 'loading' }));
    const res = await fetch('/api/proxy/metrics');

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const contentType = res.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
      
      console.log('Raw JSON data:', data);
      
      // Parse lại miners list từ JSON API
      if (data.miners && Array.isArray(data.miners.list)) {
        data.miners.list = data.miners.list.map(miner => {
          const minerName = miner.name ? miner.name.split('.').slice(1).join('.') : 'Unknown';
          const hashrate = typeof miner.current_hashrate === 'string' 
            ? parseFloat(miner.current_hashrate.replace(' H/s', '')) 
            : parseFloat(miner.current_hashrate) || 0;
          
          return {
            wallet: miner.wallet || '',
            miner_name: minerName,
            ip: miner.ip || 'N/A',
            hashrate: hashrate
          };
        });
      }
      
      console.log('Processed miners list:', data.miners?.list);
    } else {
      const text = await res.text();
      data = parseMetrics(text);
    }

    setPreviousMetrics(metrics);
    setMetrics(data);
    setMetricsLoading(false);
    setApiStatus(prev => ({ ...prev, metrics: 'success' }));

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    setChartData(prev => {
      const newData = {
        time: timestamp,
        upload: Math.round((safeNumber(data.network.total_upload_bytes) / 1024 / 1024) * 100) / 100,
        download: Math.round((safeNumber(data.network.total_download_bytes) / 1024 / 1024) * 100) / 100,
        miners: safeNumber(data.miners.active_count),
        ramUsage: data.system.ram_total_bytes > 0 
          ? Math.round((safeNumber(data.system.ram_used_bytes) / safeNumber(data.system.ram_total_bytes)) * 100) 
          : 0
      };
      const updated = [...prev, newData];
      return updated.slice(-60);
    });
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    setApiStatus(prev => ({ ...prev, metrics: 'error' }));
    setMetricsLoading(false);
    showNotification('Failed to connect to Metrics API', 'error');
  }
}, [parseMetrics, showNotification]);

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('wss://n.snd.qzz.io/api/logs/stream');

      ws.onopen = () => {
        setWsConnected(true);
        showNotification('Connected to logs', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          setLogs(prev => [...prev, logData].slice(-100));
        } catch (err) {
          console.error('Failed to parse log:', err);
        }
      };

      ws.onerror = () => setWsConnected(false);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWebSocket, 5000);
      };
  wsRef.current = ws;
} catch (error) {
  console.error('Failed to connect WebSocket:', error);
  setWsConnected(false);
}
}, [showNotification]);
useEffect(() => {
fetchMetrics();
const interval = setInterval(fetchMetrics, 3000);
return () => clearInterval(interval);
}, [fetchMetrics]);
useEffect(() => {
connectWebSocket();
return () => {
if (wsRef.current) wsRef.current.close();
};
}, [connectWebSocket]);
useEffect(() => {
if (autoScroll && logsEndRef.current) {
logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
}
}, [logs, autoScroll]);
// useEffect(() => {
//   console.log('Metrics changed:', metrics);
//   if (metrics && metrics.miners) {
//     const minersList = useMemo(() => {
//   if (metrics && metrics.miners) {
//     return metrics.miners.list || [];
//   }
//   return [];
// }, [metrics?.miners?.active_count]);
//   }
// }, [metrics]);
const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
const formatUptime = (seconds) => {
if (!seconds) return '0s';
const days = Math.floor(seconds / 86400);
const hours = Math.floor((seconds % 86400) / 3600);
const minutes = Math.floor((seconds % 3600) / 60);
if (days > 0) return `${days}d ${hours}h`;
if (hours > 0) return `${hours}h ${minutes}m`;
return `${minutes}m`;
};
const getLogColor = (level) => {
switch (level) {
case 'error': return '#ef4444';
case 'warn': return '#f59e0b';
case 'info': return '#3b82f6';
case 'debug': return '#8b5cf6';
default: return isDark ? '#9ca3af' : '#6b7280';
}
};
const cpuTrend = previousMetrics ? calculateTrend(
  safeNumber(metrics?.system.cpu_usage_percent),
  safeNumber(previousMetrics.system.cpu_usage_percent)
) : { direction: 'neutral', percentage: 0 };
const ramTrend = previousMetrics && metrics?.system.ram_total_bytes > 0 ? calculateTrend(
(safeNumber(metrics?.system.ram_used_bytes) / safeNumber(metrics?.system.ram_total_bytes)) * 100,
(safeNumber(previousMetrics.system.ram_used_bytes) / safeNumber(previousMetrics.system.ram_total_bytes)) * 100
) : { direction: 'neutral', percentage: 0 };
const minersTrend = previousMetrics ? calculateTrend(
safeNumber(metrics?.miners.active_count),
safeNumber(previousMetrics.miners.active_count)
) : { direction: 'neutral', percentage: 0 };
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f1f5f9' : '#0f172a',
      transition: 'background-color 0.3s, color 0.3s',
      fontSize: `${settings.fontSize}px`,
      fontFamily: settings.fontFamily
    }}>
      <SeasonalEffects 
        season={season} 
        month={currentMonth} 
        enabled={settings.seasonalEffects}
        particleCount={settings.particleCount}
        particleSize={settings.particleSize}
      />
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        setSettings={setSettings}
        theme={theme}
        setTheme={setTheme}
        isDark={isDark}
      />
      <style>{`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { overflow-x: hidden; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: ${isDark ? '#1e293b' : '#f1f5f9'}; }
    ::-webkit-scrollbar-thumb { background: ${isDark ? '#475569' : '#cbd5e1'}; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#64748b' : '#94a3b8'}; }
  `}</style>

      {notification && (
        <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '8px',
      backgroundColor: notification.type === 'error' ? '#ef4444' : 
                      notification.type === 'success' ? '#10b981' : 
                      notification.type === 'warning' ? '#f59e0b' : '#3b82f6',
      color: '#ffffff',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      zIndex: 10001,
      fontWeight: '500',
      animation: 'slideIn 0.3s ease-out'
    }}>
          {notification.message}
        </div>
      )}

      <header style={{
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(8px)'
  }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img 
                src="https://r.snd.qzz.io/raw/Untitled.png" 
                alt="Logo" 
                style={{ width: '40px', height: '40px' }}
              />
              <h1 style={{ fontSize: '26px', fontWeight: '700', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Dashboard
              </h1>
              
              <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                <StatusIndicator status={apiStatus.metrics} label="Metrics" />
                {savedWallet && <StatusIndicator status={apiStatus.miner} label="Miner" />}
                <StatusIndicator status={wsConnected ? 'success' : 'error'} label="Logs" />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
              >
                <Icons.Settings />
              </button>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? '#334155' : '#f1f5f9',
                  border: 'none',
                  cursor: 'pointer',
                  color: isDark ? '#f1f5f9' : '#0f172a',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
              >
                {isDark ? <Icons.Sun /> : <Icons.Moon />}
              </button>
            </div>
          </div>

          {settings.showMinerList ? (
            <MinersList miners={minersList} isDark={isDark} />
          ) : (
            <WalletSearch 
              wallet={wallet}
              setWallet={setWallet}
              loading={loading}
              isDark={isDark}
              onSubmit={() => {
                if (wallet.trim()) {
                  setSavedWallet(wallet);
                }
              }}
            />
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 20px' }}>
        {metricsLoading ? (
          <LoadingSkeletons isDark={isDark} />
        ) : metrics && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <MetricCard
                icon={Icons.Cpu}
                title="CPU"
                value={`${safeNumber(metrics.system.cpu_usage_percent).toFixed(1)}%`}
                subtitle={`${safeNumber(metrics.system.cpu_cores)} cores`}
                isDark={isDark}
                trend={cpuTrend}
              />
              <MetricCard
                icon={Icons.Memory}
                title="RAM"
                value={metrics.system.ram_total_bytes > 0 
                  ? `${Math.round((safeNumber(metrics.system.ram_used_bytes) / safeNumber(metrics.system.ram_total_bytes)) * 100)}%`
                  : '0%'}
                subtitle={`${formatBytes(metrics.system.ram_used_bytes)} / ${formatBytes(metrics.system.ram_total_bytes)}`}
                isDark={isDark}
                trend={ramTrend}
              />
              <MetricCard
                icon={Icons.Network}
                title="Active Miners"
                value={safeNumber(metrics.miners.active_count)}
                subtitle="connected"
                isDark={isDark}
                trend={minersTrend}
              />
              <MetricCard
               icon={Icons.Activity}
               title="Uptime"
               value={formatUptime(metrics.system.uptime_seconds)}
               subtitle={`IP: ${metrics.system.public_ip}`}  
               isDark={isDark}
            />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              <ChartCard title="Network Traffic" isDark={isDark}>
                <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="time" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} label={{ value: 'MB', position: 'insideTopLeft' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} MB`, '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={2} fill="url(#downloadGrad)" name="Download" />
                  <Area type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={2} fill="url(#uploadGrad)" name="Upload" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Miners & RAM" isDark={isDark}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="time" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      name === 'ramUsage' ? `${value}%` : value,
                      name === 'miners' ? 'Active Miners' : 'RAM Usage'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="miners" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Miners" />
                  <Line type="monotone" dataKey="ramUsage" stroke="#f59e0b" strokeWidth={3} dot={false} name="RAM %" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {metrics?.pools && Object.keys(metrics.pools).length > 0 && (
            <PoolStats pools={metrics.pools} isDark={isDark} />
          )}

          <LogsPanel
            logs={logs}
            wsConnected={wsConnected}
            autoScroll={autoScroll}
            isDark={isDark}
            logsContainerRef={logsContainerRef}
            logsEndRef={logsEndRef}
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.target;
              setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
            }}
            getLogColor={getLogColor}
          />
          </>
        )}
      </main>

      <footer style={{
        borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        padding: '24px 20px',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="https://r.snd.qzz.io/raw/Untitled.png" alt="Logo" style={{ width: '28px', height: '28px' }} />
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>Dashboard</div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                v1.0.0 • commit{' '}
                <a 
                  href={`https://github.com/Mytai20100/frontend-tunnel/commit/${commitHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#3b82f6', 
                    textDecoration: 'none',
                    fontFamily: 'monospace'
                  }}
                >
                  {commitHash}
                </a>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', opacity: 0.7 }}>
            <div>
              Powered by{' '}
              <a 
                href="https://github.com/servernotdie"
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  fontWeight: '600', 
                  color: '#3b82f6',
                  textDecoration: 'none'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Servernotdie
              </a>
            </div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>© 2025 All rights reserved</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
// Helper Components
const StatusIndicator = ({ status, label }) => (
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    fontSize: '12px'
  }}>
    <div style={{ 
      width: '8px', 
      height: '8px', 
      borderRadius: '50%',
      backgroundColor: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#f59e0b',
      animation: status === 'loading' ? 'pulse 2s infinite' : 'none'
    }}></div>
    <span style={{ opacity: 0.9, fontWeight: '500' }}>{label}</span>
  </div>
);
const MinersList = memo(({ miners, isDark }) => {
  console.log('MinersList render with miners:', miners);
  
  return (
    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '8px', backgroundColor: isDark ? '#334155' : '#f8fafc', border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}` }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
        Active Miners ({Array.isArray(miners) ? miners.length : 0})
      </h3>
      <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {Array.isArray(miners) && miners.length > 0 ? (
          miners.map((miner, idx) => (
            <div key={`${miner.wallet}-${miner.miner_name}-${idx}`} style={{
              padding: '12px',
              marginBottom: '8px',
              borderRadius: '6px',
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '13px' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <span style={{ opacity: 0.6 }}>Worker: </span>
                  <span style={{ fontWeight: '600' }}>{miner.miner_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <span style={{ opacity: 0.6 }}>IP: </span>
                    <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{miner.ip}</span>
                  </div>
                  <div>
                    <span style={{ opacity: 0.6 }}>Hashrate: </span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>{safeNumber(miner.hashrate).toFixed(2)} H/s</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                    <span style={{ color: '#10b981', fontSize: '12px' }}>Online</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>
            No miners available
          </div>
        )}
      </div>
    </div>
  );
});
const WalletSearch = memo(({ wallet, setWallet, loading, isDark, onSubmit }) => (
  <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
    <input
      type="text"
      value={wallet}
      onChange={(e) => setWallet(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      placeholder="Enter wallet address..."
      style={{
        flex: 1,
        padding: '10px 16px',
        borderRadius: '8px',
        backgroundColor: isDark ? '#334155' : '#f8fafc',
        border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
        color: isDark ? '#f1f5f9' : '#0f172a',
        outline: 'none',
        fontSize: '14px'
      }}
    />
    <button
      onClick={onSubmit}
      disabled={loading}
      style={{
        padding: '10px 20px',
        backgroundColor: loading ? '#64748b' : '#3b82f6',
        color: '#ffffff',
        borderRadius: '8px',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px'
      }}
    >
      <Icons.Search />
      {loading ? 'Checking...' : 'Check'}
    </button>
  </div>
));
const LoadingSkeletons = memo(({ isDark }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
    {[1, 2, 3, 4].map((i) => (
      <div key={i} style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
      }}>
        <div style={{ width: '100px', height: '16px', backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '4px', marginBottom: '12px' }}></div>
        <div style={{ width: '60%', height: '24px', backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '4px', marginBottom: '8px' }}></div>
        <div style={{ width: '40%', height: '14px', backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '4px' }}></div>
      </div>
    ))}
  </div>
));
const ChartCard = memo(({ title, children, isDark }) => (
  <div style={{
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
  }}>
    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>{title}</h3>
    {children}
  </div>
));
const PoolStats = memo(({ pools, isDark }) => (
  <div style={{
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
    marginBottom: '24px'
  }}>
    <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Pool Statistics</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
      {Object.entries(pools).map(([poolName, pool]) => (
        <div key={poolName} style={{
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: isDark ? '#334155' : '#f8fafc',
          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`
        }}>
          <h4 style={{ fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>{poolName}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Accept Time:</span>
              <span style={{ fontWeight: '600' }}>{safeNumber(pool.avg_accept_time_ms).toFixed(2)} ms</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Accepted:</span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>{safeNumber(pool.shares_accepted).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Rejected:</span>
              <span style={{ color: '#ef4444', fontWeight: '600' }}>{safeNumber(pool.shares_rejected).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));
const LogsPanel = memo(({ logs, wsConnected, autoScroll, isDark, logsContainerRef, logsEndRef, onScroll, getLogColor }) => (
  <div style={{
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Live Logs</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%',
            backgroundColor: wsConnected ? '#10b981' : '#ef4444'
          }}></div>
          <span style={{ fontSize: '13px', opacity: 0.7 }}>
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {!autoScroll && (
          <span style={{ 
            fontSize: '11px', 
            padding: '3px 10px',
            borderRadius: '4px',
            backgroundColor: '#f59e0b',
            color: '#ffffff',
            fontWeight: '600'
          }}>
            Paused
          </span>
        )}
      </div>
    </div>
    <div 
      ref={logsContainerRef}
      onScroll={onScroll}
      style={{
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderRadius: '8px',
        padding: '16px',
        height: '400px',
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.6'
      }}
    >
      {logs.length === 0 ? (
        <div style={{ opacity: 0.5, textAlign: 'center', paddingTop: '180px' }}>
          Waiting for logs...
        </div>
      ) : (
        logs.map((log, idx) => (
          <div 
            key={idx} 
            style={{ 
              marginBottom: '2px',
              padding: '6px 10px',
              borderRadius: '4px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderLeft: `3px solid ${getLogColor(log.level)}`
            }}
          >
            <span style={{ opacity: 0.5 }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            {' '}
            <span style={{ color: getLogColor(log.level), fontWeight: '600' }}>
              [{log.level.toUpperCase()}]
            </span>
            {' '}
            <span>{log.message}</span>
          </div>
        ))
      )}
      <div ref={logsEndRef} />
    </div>
  </div>
));
