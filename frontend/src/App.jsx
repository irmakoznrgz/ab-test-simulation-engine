import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css'; 

function App() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("STOPPED");
  const [startTime, setStartTime] = useState(null);
  const [runningTime, setRunningTime] = useState("0h 0m");
  const [history, setHistory] = useState([]);

  const API_BASE = "http://localhost:8000/api";
  const TARGET_VISITORS = 16284;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/results`);
        setData(res.data);
        
        if (res.data && res.data.A && res.data.B) {
          const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric" });
          setHistory(prev => {
            const newHistory = [...prev, {
              time: now,
              crA: parseFloat((res.data.A.cr * 100).toFixed(2)),
              crB: parseFloat((res.data.B.cr * 100).toFixed(2))
            }];
            return newHistory.slice(-20);
          });
        }
      } catch (error) {
        console.error("Data fetch error:", error);
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE}/test-status`);
        setStatus(res.data.status);
      } catch (error) {
        console.error("Status fetch error:", error);
      }
    };

    fetchData();
    fetchStatus();
    
    const interval = setInterval(fetchData, 1500); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    if (status === "RUNNING") {
      if (!startTime) setStartTime(new Date());
      timer = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000); 
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        setRunningTime(`${hours}h ${minutes}m`);
      }, 60000);
    } else {
      setStartTime(null);
      setRunningTime("0h 0m");
    }
    return () => clearInterval(timer);
  }, [status, startTime]);

  const toggleStatus = async () => {
    const newStatus = status === "RUNNING" ? "STOPPED" : "RUNNING";
    await axios.post(`${API_BASE}/test-status`, { status: newStatus });
    setStatus(newStatus);
  };

  if (!data || !data.A) return <div style={{ textAlign: 'center', marginTop: '50px', color: '#a0a0a0', backgroundColor: '#161618', minHeight: '100vh', paddingTop: '50px' }}>Loading... (Make sure the simulator and API are running)</div>;

  const totalVisitors = data.A.visitors + data.B.visitors;
  const totalConversions = data.A.conversions + data.B.conversions;
  const progressPercent = Math.min((totalVisitors / TARGET_VISITORS) * 100, 100).toFixed(1);

  let winnerMessage = null;
  let winnerColor = "#a0a0a0";
  
  if (data.chi_square?.winner === "A" || data.chi_square?.winner === "B") {
    winnerMessage = `Winning: Group ${data.chi_square.winner}`;
    winnerColor = "#82ca9d"; 
  } else if (data.bayesian_analysis?.prob_B_is_better > 0.90) {
    winnerMessage = "Winning: Group B (90% Probability)";
    winnerColor = "#82ca9d";
  } else if (data.bayesian_analysis?.prob_B_is_better < 0.10) {
    winnerMessage = "Winning: Group A (90% Probability)";
    winnerColor = "#82ca9d";
  }

  const chartDataCR = [
    { name: 'Group A', value: parseFloat((data.A.cr * 100).toFixed(2)) },
    { name: 'Group B', value: parseFloat((data.B.cr * 100).toFixed(2)) },
  ];

  const chartDataAOV = [
    { name: 'Group A', value: data.A.aov },
    { name: 'Group B', value: data.B.aov },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#2a2b30', border: '1px solid #444', padding: '10px', borderRadius: '4px', color: '#fff' }}>
          <p style={{ margin: 0 }}>{`${payload[0].payload.name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ 
      backgroundColor: '#161618', 
      minHeight: '100vh', 
      padding: '40px 20px', 
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e1e1e1'
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '600', 
          color: '#a5a4a4', 
          marginBottom: '30px',
          letterSpacing: '0.5px',
          textAlign: 'center'

        }}>
          Dynamic A/B Test Simulator
        </h1>
        
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          backgroundColor: '#202124', 
          border: '1px solid #333',
          borderRadius: '8px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: status === "RUNNING" ? "#82ca9d" : "#ff4d4d",
                boxShadow: status === "RUNNING" ? "0 0 8px #82ca9d" : "0 0 8px #ff4d4d"
              }}></div>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>{status}</span>
              {status === "RUNNING" && <span style={{ color: '#888', fontSize: '0.9rem', marginLeft: '10px' }}>Running for: {runningTime}</span>}
            </div>
          </div>
          
          <button 
            onClick={toggleStatus} 
            style={{ 
              padding: '10px 20px', 
              fontSize: '14px', 
              fontWeight: '600',
              cursor: 'pointer', 
              backgroundColor: status === "RUNNING" ? "transparent" : "#fff", 
              color: status === "RUNNING" ? "#ff4d4d" : "#000", 
              border: status === "RUNNING" ? "1px solid #ff4d4d" : "none", 
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
          >
            {status === "RUNNING" ? "STOP TEST" : "START TEST"}
          </button>
        </div>

        {winnerMessage && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '20px', 
            backgroundColor: '#202124', 
            border: '1px solid #333', 
            borderLeft: `4px solid ${winnerColor}`,
            borderRadius: '8px', 
          }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '600' }}>{winnerMessage}</h2>
          </div>
        )}

        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          backgroundColor: '#202124', 
          border: '1px solid #333',
          borderRadius: '8px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#a0a0a0', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Test Progress (Target: 16284 Visitors)</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', backgroundColor: '#333', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${progressPercent}%`, backgroundColor: '#8884d8', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
          </div>
        </div>

        {data.bayesian_analysis && (
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            
            <div style={{ flex: 2, minWidth: '300px', padding: '24px', backgroundColor: '#202124', border: '1px solid #333', borderRadius: '8px' }}>
              <h2 style={{ margin: '0 0 20px 0', color: '#cdcbcb', fontSize: '1.2rem', fontWeight: '500' }}>Bayesian Test</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ color: '#a0a0a0' }}>Probability of B outperforming A:</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{parseFloat(data.bayesian_analysis.prob_B_is_better * 100).toFixed(1)}%</span>
              </div>
              
              <div style={{ width: '100%', backgroundColor: '#333', height: '6px', borderRadius: '3px', marginBottom: '20px', overflow: 'hidden' }}>
                <div style={{ width: `${data.bayesian_analysis.prob_B_is_better * 100}%`, backgroundColor: '#82ca9d', height: '100%' }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a0a0a0' }}>Expected Uplift in Sales:</span>
                <span style={{ color: '#8884d8', fontWeight: 'bold', fontSize: '1.1rem' }}>+{parseFloat(data.bayesian_analysis.expected_uplift * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ flex: 1, padding: '20px', backgroundColor: '#202124', border: '1px solid #333', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Visitors</span>
                <span style={{ fontSize: '2rem', fontWeight: '600', color: '#fff' }}>{totalVisitors.toLocaleString()}</span>
              </div>
              
              <div style={{ flex: 1, padding: '20px', backgroundColor: '#202124', border: '1px solid #333', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Conversions</span>
                <span style={{ fontSize: '2rem', fontWeight: '600', color: '#fff' }}>{totalConversions.toLocaleString()}</span>
              </div>
            </div>

          </div>
        )}

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '400px', height: '320px', backgroundColor: '#202124', border: '1px solid #333', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1rem', fontWeight: '500' }}>Conversion Rate (%)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartDataCR} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a2b30' }} />
                <Bar dataKey="value" fill="#82ca9d" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, minWidth: '400px', height: '320px', backgroundColor: '#202124', border: '1px solid #333', padding: '24px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1rem', fontWeight: '500' }}>Average Order Value (AOV)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartDataAOV} margin={{ top: 0, right: 0, left: -10, bottom: 0 }} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#2a2b30' }} />
                <Bar dataKey="value" fill="#ffc658" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ width: '100%', height: '350px', backgroundColor: '#202124', border: '1px solid #333', padding: '24px', borderRadius: '8px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1rem', fontWeight: '500' }}>Conversion Rate Trend Over Time</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#2a2b30', border: '1px solid #444', borderRadius: '4px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="crA" name="Group A" stroke="#82ca9d" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="crB" name="Group B" stroke="#ffc658" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default App;