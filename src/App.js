import React, { useState } from 'react';  
import './App.css';

function App() {
  const [mode, setMode] = useState('drug');
  const [tablets, setTablets] = useState([""]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading,setLoading] = useState(false);

  function severityLevel(interactionText) {
    if (!interactionText) return 'none';
    const t = interactionText.toLowerCase();
    if (t.includes('no known interaction') || t.includes('no interaction') || t.includes('no known')) {
      return 'none';
    }
    const high = ['severe', 'avoid', 'contra', 'contraindicat', 'life-threatening', 'fatal', 'cardiotoxic'];
    if (high.some(k => t.includes(k))) return 'high';
    const medium = ['monitor', 'caution', 'dose', 'reduce', 'may increase', 'risk', 'increase'];
    if (medium.some(k => t.includes(k))) return 'medium';
    return 'low';
  }

  const removeTablet = (index) => {
    const newTablets = tablets.filter((_, i) => i !== index);
    setTablets(newTablets.length ? newTablets : ['']);
  };

  const handleChange = (index, value) => {
    const newTablets = [...tablets];
    newTablets[index] = value;
    setTablets(newTablets);
  };

  const addTablet = () => setTablets([...tablets, ""]);

  const checkInteraction = async () => {
    setError(""); setResults([]); setLoading(true);
    try {
      const cleaned = tablets.map(s => s.trim()).filter(Boolean);
      if (cleaned.length < 1) { setError('Enter at least one name.'); setLoading(false); return; }
      const res = await fetch("https://druginteractionbackend.onrender.com/api/sendInteractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tablets: cleaned }),
      });
      const data = await res.json();
      if (res.ok) setResults(data.results || []);
      else setError(data.error || 'Server error');
    } catch (err) {
      console.log(err);
      setError("Server not reachable");
    } finally { setLoading(false); }
  };

  const foodInteraction = async () => {
    setError(""); setResults([]); setLoading(true);
    try {
      const cleaned = tablets.map(s => s.trim()).filter(Boolean);
      if (cleaned.length < 1) { setError('Enter at least one tablet.'); setLoading(false); return; }
      const res = await fetch("https://druginteractionbackend.onrender.com/api/sendFoodInteractions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tablets: cleaned }),
      });
      const data = await res.json();
      if (res.ok) setResults(data.results || []);
      else setError(data.error || 'Server error');
    } catch (err) {
      console.log(err);
      setError("Server not reachable");
    } finally { setLoading(false); }
  };

  const handleCheck = () => {
    if (mode === 'drug') checkInteraction();
    else foodInteraction();
  };

  return (
    <div className="app-container">
      <div className="mode-toggle" style={{ marginBottom: 12 }}>
        <button className={`btn ${mode === 'drug' ? 'active' : ''}`} onClick={() => setMode('drug')} disabled={loading}>Drug</button>
        <button className={`btn ${mode === 'food' ? 'active' : ''}`} onClick={() => setMode('food')} disabled={loading}>Food</button>
      </div>
      {mode === 'drug' ? (
        <section className="drug-panel">
          <h1>💊 Drug Interaction Checker</h1>

          {tablets.map((t, i) => (
            <div key={i} className="tablet-row">
              <input
                type="text"
                value={t}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder="Enter tablet name (e.g. Metrol)"
                onKeyDown={(e) => { if (e.key === 'Enter') addTablet(); }}
                aria-label={`Tablet ${i + 1}`}
              />
              <button className="remove-btn" onClick={() => removeTablet(i)} aria-label="Remove tablet">✖</button>
            </div>
          ))}

          <div className="button-group">
            <button className="btn" onClick={addTablet} disabled={loading}>Add</button>
            <button className="btn" onClick={checkInteraction} disabled={loading}>
              {loading ? '⏳ Checking...' : '🔍 Check'}
            </button>
            <button className="btn" onClick={() => { setTablets(['']); setResults([]); setError(''); }} disabled={loading}>Clear</button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="results">
            {results.length === 0 && !loading && <p className="no-results">No results yet.</p>}
            {results.map((r, i) => {
              const interactionText = r.interaction || '';
              const level = severityLevel(interactionText);
              const label = level === 'high' ? 'Severe' : level === 'medium' ? 'Caution' : level === 'none' ? 'No interaction' : 'Low';
              return (
                <div key={i} className={`result-card ${level}`}>
                  <div>
                    <strong>{r.drug1} {r.drug2 ? `+ ${r.drug2}` : ''}</strong>
                    <p title={interactionText}>{interactionText}</p>
                  </div>
                  <div className="badge-wrap">
                    <span className={`status-tag ${level}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="food-panel">
          <h1>🥗 Food to Avoid</h1>

          {tablets.map((t, i) => (
            <div key={i} className="tablet-row">
              <input
                type="text"
                value={t}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder="Enter tablet name to check what food to avoid"
                onKeyDown={(e) => { if (e.key === 'Enter') addTablet(); }}
                aria-label={`Medication ${i + 1}`}
              />
              <button className="remove-btn" onClick={() => removeTablet(i)} aria-label="Remove medication">✖</button>
            </div>
          ))}

          <div className="button-group">
            <button className="btn" onClick={addTablet} disabled={loading}>➕ Add</button>
            <button className="btn" onClick={foodInteraction} disabled={loading}>
              {loading ? '⏳ Checking...' : '🔍 Check Food'}
            </button>
            <button className="btn" onClick={() => { setTablets(['']); setResults([]); setError(''); }} disabled={loading}>Clear</button>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="results">
            {results.length === 0 && !loading && <p className="no-results">No results yet.</p>}
            {results.map((r, i) => {
              const interactionText = r.food_interactions || r.interaction || r.food_interaction || '';
              const level = severityLevel(interactionText);
              const label = level === 'high' ? 'Severe' : level === 'medium' ? 'Caution' : level === 'none' ? 'No interaction' : 'Low';
              return (
                <div key={i} className={`result-card ${level}`}>
                  <div>
                    <strong>{r.drug || r.drug1 || ''}</strong>
                    <p title={interactionText}>{interactionText}</p>
                  </div>
                  <div className="badge-wrap">
                    <span className={`status-tag ${level}`}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
