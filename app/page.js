'use client';

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Moon, Sun, Activity, Cpu, HardDrive, Wifi, TrendingUp, TrendingDown, Search, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function MiningDashboard() {
  const [theme, setTheme] = useState('light');
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
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);
  const logsContainerRef = useRef(null);
  const logws = "wss://n.snd.qzz.io/api/logs/stream";
  useEffect(() => {
    const savedTheme = theme;
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (savedWallet) {
      const interval = setInterval(() => fetchMinerData(savedWallet), 5000);
      return () => clearInterval(interval);
    }
  }, [savedWallet]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current && logsContainerRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const handleLogsScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(logws);
      
      ws.onopen = () => {
        setWsConnected(true);
        showNotification('Connected to logs', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const logData = JSON.parse(event.data);
          setLogs(prev => [...prev.slice(-99), logData]);
        } catch (err) {
          console.error('Failed to parse log:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        setWsConnected(false);
        showNotification('Disconnected from logs', 'warning');
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setWsConnected(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { direction: 'neutral', percentage: 0 };
    const diff = ((current - previous) / previous) * 100;
    return {
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
      percentage: Math.abs(diff)
    };
  };

  const fetchMetrics = async () => {
    try {
      setApiStatus(prev => ({ ...prev, metrics: 'loading' }));
      const res = await fetch('/api/proxy/metrics');
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setPreviousMetrics(metrics);
      setMetrics(data);
      setMetricsLoading(false);
      setApiStatus(prev => ({ ...prev, metrics: 'success' }));
      
      const timestamp = new Date().toLocaleTimeString();
      setChartData(prev => {
        const newData = [...prev, {
          time: timestamp,
          upload: Math.round((data.network.total_upload_bytes / 1024 / 1024) * 100) / 100,
          download: Math.round((data.network.total_download_bytes / 1024 / 1024) * 100) / 100,
          miners: data.miners.active_count,
          ramUsage: Math.round((data.system.ram_used_bytes / data.system.ram_total_bytes) * 100)
        }];
        return newData.slice(-20);
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setApiStatus(prev => ({ ...prev, metrics: 'error' }));
      setMetricsLoading(false);
      if (metrics === null) {
        showNotification('Failed to connect to Metrics API', 'error');
      }
    }
  };

  const fetchMinerData = async (walletAddr) => {
    setLoading(true);
    setApiStatus(prev => ({ ...prev, miner: 'loading' }));
    try {
      const res = await fetch(`/api/proxy/miner/${walletAddr}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      setMinerData(data);
      setApiStatus(prev => ({ ...prev, miner: 'success' }));
      
      if (data.active_miner) {
        showNotification('Miner information found!', 'success');
      } else {
        showNotification('No active miner found', 'warning');
      }
    } catch (error) {
      console.error('Failed to fetch miner data:', error);
      setApiStatus(prev => ({ ...prev, miner: 'error' }));
      if (minerData === null) {
        showNotification('Failed to connect to Miner API', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (wallet.trim()) {
      setSavedWallet(wallet);
      fetchMinerData(wallet);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatHashrate = (shares, uptime) => {
    if (!shares || !uptime) return '0 H/s';
    const hashrate = (shares * 1000000) / uptime;
    if (hashrate > 1000000) return `${(hashrate / 1000000).toFixed(2)} MH/s`;
    if (hashrate > 1000) return `${(hashrate / 1000).toFixed(2)} KH/s`;
    return `${hashrate.toFixed(2)} H/s`;
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

  const getLogBackground = (level) => {
    const isDark = theme === 'dark';
    switch (level) {
      case 'error': return isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)';
      case 'warn': return isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)';
      case 'info': return isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)';
      case 'debug': return isDark ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)';
      default: return 'transparent';
    }
  };

  const TrendIndicator = ({ trend }) => {
    if (trend.direction === 'neutral' || trend.percentage === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.6 }}>
          <Minus style={{ width: '14px', height: '14px' }} />
          <span>0%</span>
        </div>
      );
    }
    
    const color = trend.direction === 'up' ? '#10b981' : '#ef4444';
    const Icon = trend.direction === 'up' ? ArrowUp : ArrowDown;
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color }}>
        <Icon style={{ width: '14px', height: '14px' }} />
        <span>{trend.percentage.toFixed(1)}%</span>
      </div>
    );
  };

  const isDark = theme === 'dark';

  const ramTrend = previousMetrics ? calculateTrend(
    (metrics?.system.ram_used_bytes / metrics?.system.ram_total_bytes) * 100,
    (previousMetrics.system.ram_used_bytes / previousMetrics.system.ram_total_bytes) * 100
  ) : { direction: 'neutral', percentage: 0 };

  const minersTrend = previousMetrics ? calculateTrend(
    metrics?.miners.active_count,
    previousMetrics.miners.active_count
  ) : { direction: 'neutral', percentage: 0 };

  const uploadTrend = previousMetrics ? calculateTrend(
    metrics?.network.total_upload_bytes,
    previousMetrics.network.total_upload_bytes
  ) : { direction: 'neutral', percentage: 0 };

  const downloadTrend = previousMetrics ? calculateTrend(
    metrics?.network.total_download_bytes,
    previousMetrics.network.total_download_bytes
  ) : { direction: 'neutral', percentage: 0 };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#111827' : '#ffffff',
      color: isDark ? '#ffffff' : '#111827',
      transition: 'all 0.2s'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        .skeleton {
          background: linear-gradient(
            90deg,
            ${isDark ? '#1f2937' : '#f3f4f6'} 0%,
            ${isDark ? '#374151' : '#e5e7eb'} 50%,
            ${isDark ? '#1f2937' : '#f3f4f6'} 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
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
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          animation: 'slideIn 0.3s ease-out',
          maxWidth: '400px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {notification.message}
        </div>
      )}

      <header style={{
        borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        position: 'sticky',
        top: 0,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <img 
                src="https://r.snd.qzz.io/raw/Untitled.png" 
                alt="Logo" 
                style={{ width: '32px', height: '32px' }}
              />
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard</h1>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                  fontSize: '12px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: apiStatus.metrics === 'success' ? '#10b981' : 
                                   apiStatus.metrics === 'error' ? '#ef4444' : '#f59e0b',
                    animation: apiStatus.metrics === 'loading' ? 'pulse 2s infinite' : 'none'
                  }}></div>
                  <span style={{ opacity: 0.8 }}>Metrics</span>
                </div>
                {savedWallet && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                    fontSize: '12px'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%',
                      backgroundColor: apiStatus.miner === 'success' ? '#10b981' : 
                                     apiStatus.miner === 'error' ? '#ef4444' : '#f59e0b',
                      animation: apiStatus.miner === 'loading' ? 'pulse 2s infinite' : 'none'
                    }}></div>
                    <span style={{ opacity: 0.8 }}>Miner</span>
                  </div>
                )}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                  fontSize: '12px'
                }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%',
                    backgroundColor: wsConnected ? '#10b981' : '#ef4444',
                    animation: wsConnected ? 'pulse 2s infinite' : 'none'
                  }}></div>
                  <span style={{ opacity: 0.8 }}>Logs</span>
                </div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              style={{
                padding: '8px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isDark ? <Sun style={{ width: '20px', height: '20px' }} /> : <Moon style={{ width: '20px', height: '20px' }} />}
            </button>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter wallet address..."
              style={{
                flex: 1,
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                color: isDark ? '#ffffff' : '#111827',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                padding: '8px 16px',
                backgroundColor: loading ? '#6b7280' : '#3b82f6',
                color: '#ffffff',
                borderRadius: '8px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Search style={{ width: '16px', height: '16px' }} />
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>

          {minerData?.active_miner && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.6 }}>Wallet</p>
                  <p style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px' }}>{minerData.active_miner.wallet}</p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.6 }}>Miner Name</p>
                  <p style={{ fontWeight: '600' }}>{minerData.active_miner.miner_name}</p>
                </div>
                <div>
                  <p style={{ fontSize: '14px', opacity: 0.6 }}>Hashrate</p>
                  <p style={{ fontWeight: '600', color: '#10b981' }}>
                    {formatHashrate(minerData.active_miner.shares_accepted, minerData.active_miner.uptime_seconds)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div>
                  <span style={{ fontSize: '14px', color: '#10b981' }}>Online</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        {metricsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }}></div>
                </div>
                <div className="skeleton" style={{ width: '60%', height: '20px', borderRadius: '4px', marginBottom: '8px' }}></div>
                <div className="skeleton" style={{ width: '40%', height: '14px', borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        ) : metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <MetricCard
              icon={<Cpu style={{ width: '20px', height: '20px' }} />}
              title="CPU"
              value={metrics.system.cpu_model.split(' ').slice(0, 3).join(' ')}
              subtitle={`${metrics.system.cpu_cores} cores`}
              isDark={isDark}
            />
            <MetricCard
              icon={<HardDrive style={{ width: '20px', height: '20px' }} />}
              title="RAM"
              value={`${Math.round((metrics.system.ram_used_bytes / metrics.system.ram_total_bytes) * 100)}%`}
              subtitle={`${formatBytes(metrics.system.ram_used_bytes)} / ${formatBytes(metrics.system.ram_total_bytes)}`}
              isDark={isDark}
              trend={ramTrend}
            />
            <MetricCard
              icon={<Wifi style={{ width: '20px', height: '20px' }} />}
              title="Active Miners"
              value={metrics.miners.active_count}
              subtitle="connected"
              isDark={isDark}
              trend={minersTrend}
            />
            <MetricCard
              icon={<Activity style={{ width: '20px', height: '20px' }} />}
              title="Uptime"
              value={formatUptime(metrics.system.uptime_seconds)}
              subtitle={metrics.system.public_ip}
              isDark={isDark}
            />
          </div>
        )}

        {metricsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {[1, 2].map((i) => (
              <div key={i} style={{
                padding: '24px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
              }}>
                <div className="skeleton" style={{ width: '200px', height: '18px', borderRadius: '4px', marginBottom: '16px' }}></div>
                <div className="skeleton" style={{ width: '100%', height: '250px', borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Network Traffic (MB)</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
                    <span>Download</span>
                    <TrendIndicator trend={downloadTrend} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                    <span>Upload</span>
                    <TrendIndicator trend={uploadTrend} />
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="time" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `${value} MB`}
                  />
                  <Area type="monotone" dataKey="download" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="upload" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: isDark ? '#1f2937' : '#f9fafb',
              border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Active Miners & RAM Usage (%)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="time" stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      name === 'ramUsage' ? `${value}%` : value,
                      name === 'miners' ? 'Active Miners' : 'RAM Usage'
                    ]}
                  />
                  <Line type="monotone" dataKey="miners" stroke="#8b5cf6" strokeWidth={2} dot={false} name="miners" />
                  <Line type="monotone" dataKey="ramUsage" stroke="#f59e0b" strokeWidth={2} dot={false} name="ramUsage" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {loading && savedWallet ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1f2937' : '#f9fafb',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }}></div>
                  <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '50%' }}></div>
                </div>
                <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '4px' }}></div>
              </div>
            ))}
          </div>
        ) : minerData?.active_miner && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard
              title="Shares Accepted"
              value={minerData.active_miner.shares_accepted}
              icon={<TrendingUp style={{ width: '20px', height: '20px', color: '#10b981' }} />}
              isDark={isDark}
            />
            <StatCard
              title="Shares Rejected"
              value={minerData.active_miner.shares_rejected}
              icon={<TrendingDown style={{ width: '20px', height: '20px', color: '#ef4444' }} />}
              isDark={isDark}
            />
            <StatCard
              title="Downloaded"
              value={formatBytes(minerData.active_miner.bytes_download)}
              isDark={isDark}
            />
            <StatCard
              title="Uploaded"
              value={formatBytes(minerData.active_miner.bytes_upload)}
              isDark={isDark}
            />
          </div>
        )}

        {metrics?.pools && Object.keys(metrics.pools).length > 0 && (
          <div style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Pool Statistics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {Object.entries(metrics.pools).map(([poolName, pool]) => (
                <div key={poolName} style={{
                  padding: '16px',
                  borderRadius: '8px',
                  border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
                }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>{poolName}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.6 }}>Accept Time:</span>
                      <span style={{ fontFamily: 'monospace' }}>{pool.avg_accept_time_ms.toFixed(2)} ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.6 }}>Accepted:</span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>{pool.shares_accepted}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ opacity: 0.6 }}>Rejected:</span>
                      <span style={{ color: '#ef4444', fontWeight: '600' }}>{pool.shares_rejected}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {minerData?.historical_data && minerData.historical_data.length > 0 && (
          <div style={{
            padding: '24px',
            borderRadius: '8px',
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Mining History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Miner Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>IP</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px' }}>Pool</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Accepted</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Rejected</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px' }}>Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {minerData.historical_data.map((miner, idx) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{miner.miner_name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{miner.ip}</td>
                      <td style={{ padding: '12px 16px' }}>{miner.pool_name}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#10b981' }}>{miner.shares_accepted}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: '#ef4444' }}>{miner.shares_rejected}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatUptime(miner.uptime_seconds)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{
          padding: '24px',
          borderRadius: '8px',
          backgroundColor: isDark ? '#1f2937' : '#f9fafb',
          border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Live Logs</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                backgroundColor: wsConnected ? '#10b981' : '#ef4444',
                animation: wsConnected ? 'pulse 2s infinite' : 'none'
              }}></div>
              <span style={{ fontSize: '14px', opacity: 0.6 }}>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
              {!autoScroll && (
                <span style={{ 
                  fontSize: '12px', 
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  fontWeight: '500'
                }}>
                  Paused
                </span>
              )}
            </div>
          </div>
          <div 
            ref={logsContainerRef}
            onScroll={handleLogsScroll}
            style={{
              backgroundColor: isDark ? '#0f1419' : '#f9fafb',
              borderRadius: '6px',
              padding: '16px',
              height: '400px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: '13px',
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
                    marginBottom: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getLogBackground(log.level),
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
      </main>

      <footer style={{
        borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        padding: '32px 16px',
        backgroundColor: isDark ? '#111827' : '#ffffff'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <img 
                  src="https://r.snd.qzz.io/raw/Untitled.png" 
                  alt="Logo" 
                  style={{ width: '24px', height: '24px' }}
                />
                <span style={{ fontWeight: '600', fontSize: '16px' }}>Dashboard</span>
              </div>
              <p style={{ fontSize: '14px', opacity: 0.6 }}>Version 1.0.0 beta</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', opacity: 0.6 }}>
                Powered by <span style={{ fontWeight: '600', color: '#3b82f6' }}>Servernotdie</span>
              </p>
              <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
                © 2025 All rights reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MetricCard({ icon, title, value, subtitle, isDark, trend }) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icon}
          <span style={{ fontSize: '14px', opacity: 0.6 }}>{title}</span>
        </div>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: trend.direction === 'up' ? '#10b981' : trend.direction === 'down' ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280' }}>
            {trend.direction === 'up' ? <ArrowUp style={{ width: '14px', height: '14px' }} /> : 
             trend.direction === 'down' ? <ArrowDown style={{ width: '14px', height: '14px' }} /> : 
             <Minus style={{ width: '14px', height: '14px' }} />}
            <span>{trend.percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p style={{ fontSize: '20px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      <p style={{ fontSize: '14px', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, icon, isDark }) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '8px',
      backgroundColor: isDark ? '#1f2937' : '#f9fafb',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', opacity: 0.6 }}>{title}</span>
        {icon}
      </div>
      <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</p>
    </div>
  );
}

function formatUptime(seconds) {
  if (!seconds) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}