import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Brain, Check, CheckCircle2,
  ChevronDown, CircleHelp, Clock3, Cloud, Download, Droplet, FileText,
  Gauge, Heart, Home, Menu, Moon, Radio, Radiation, RefreshCw, Search,
  Settings, ShieldCheck, Signal, Sparkles, Sun, Thermometer, Users,
  Waves, WifiOff, X, Zap
} from "lucide-react";
import { fallbackScenarios, navItems } from "./data";

const API = "/api";
const iconFor = (name) => ({
  Home, Search, Users, FileText, Settings
}[name] || CircleHelp);

function percent(value) {
  return `${Math.round(value)}%`;
}

function App() {
  const [scenarios, setScenarios] = useState(fallbackScenarios);
  const [scenarioId, setScenarioId] = useState("night-41");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [session, setSession] = useState(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Local systems operational");
  const [showCheck, setShowCheck] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const posterior = session?.posterior || model?.priors || {};
  const ranked = Object.entries(posterior).sort((a, b) => b[1] - a[1]);
  const topCause = ranked[0] || ["sleepDebt", 0.28];
  const secondCause = ranked[1] || ["spaceWeather", 0.28];
  const nextCheck = session?.nextCheck || model?.nextCheck;
  const checksDone = session?.checks?.length || 0;
  const maxChecks = 5;
  const checkNames = {
    sleepDebt: "Sleep Debt",
    spaceWeather: "Space Weather Impact",
    cabinCO2: "CO₂ Levels",
    dehydration: "Dehydration",
    psychologicalStrain: "Stress",
    sensorError: "Sensor Error",
    other: "Other / Unexplained"
  };
  const checkIcons = {
    sleepDebt: Moon, spaceWeather: Sun, cabinCO2: Cloud,
    dehydration: Droplet, psychologicalStrain: Brain,
    sensorError: Settings, other: CircleHelp
  };

  useEffect(() => {
    fetch(`${API}/scenarios`).then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { if (data.scenarios?.length) setScenarios(data.scenarios); })
      .catch(() => setNotice("Offline demo mode · using cached scenario data"));
    fetch(`${API}/model`).then((r) => r.ok ? r.json() : Promise.reject())
      .then(setModel).catch(() => {});
  }, []);

  useEffect(() => {
    setSession(null);
    setShowCheck(false);
  }, [scenarioId]);

  const contextCards = useMemo(() => [
    { label: "Space Weather", value: scenario.context.spaceWeatherRecent ? "Active" : "Quiet", sub: scenario.context.spaceWeatherRecent ? "(22h ago)" : "No recent event", icon: Sun, tone: "amber" },
    { label: "CO₂ Level", value: `${scenario.co2} ppm`, sub: scenario.context.elevatedCO2 ? "Above threshold" : "Within demo range", icon: Cloud, tone: scenario.context.elevatedCO2 ? "red" : "blue" },
    { label: "Radiation Dose", value: "Low", sub: `(${scenario.radiation} mSv)`, icon: Radiation, tone: "amber" },
    { label: "Sleep Trend", value: `${scenario.sleepHours}h`, sub: "(24h)", icon: Moon, tone: scenario.sleepHours < 6 ? "amber" : "green" }
  ], [scenario]);

  async function startInvestigation() {
    setLoading(true);
    try {
      const response = await fetch(`${API}/investigations/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId })
      });
      if (!response.ok) throw new Error("API unavailable");
      const data = await response.json();
      setSession(data.investigation);
      setShowCheck(true);
      setNotice("Investigation started · reasoning engine online");
    } catch {
      setNotice("Backend unavailable · showing read-only demo");
      setShowCheck(true);
    } finally { setLoading(false); }
  }

  async function submitCheck(result) {
    if (!session?.id || !nextCheck) {
      setNotice("Connect the backend to run an investigation.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API}/investigations/${session.id}/check`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkId: nextCheck.id, result })
      });
      if (!response.ok) throw new Error("Could not submit check");
      const data = await response.json();
      setSession(data.investigation);
      setNotice(`Evidence recorded · ${result.toLowerCase()}`);
    } catch (error) { setNotice(error.message); }
    finally { setLoading(false); }
  }

  function exportReport() {
    const report = {
      project: "AstraVitals",
      generatedAt: new Date().toISOString(),
      scenario,
      investigation: session,
      safety: "Simulated hackathon prototype; not a medical diagnosis."
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `astravitals-report-${scenario.id}.json`; link.click();
    URL.revokeObjectURL(url);
  }

  function changeNav(item) {
    setActiveNav(item);
    setMobileNav(false);
    if (item === "Dashboard") return;
    setNotice(`${item} workspace selected · dashboard preview remains active`);
  }

  const NavIcon = ({ name }) => {
    const Icon = iconFor(name);
    return <Icon size={18} />;
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="astravitals-mark"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><span className="astravitals-word">ASTRAVITALS</span></div>
          <p>Hear the Signal.<br />Know What to Check.</p>
        </div>
        <nav className="side-nav">
          {navItems.map((item) => (
            <button key={item} className={`nav-link ${activeNav === item ? "active" : ""}`} onClick={() => changeNav(item)}>
              <NavIcon name={item} /><span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-status">
          <div className="status-line"><span className="pulse-dot" /> Offline Mode</div>
          <small><Signal size={12} /> All systems operational</small>
        </div>
        <div className="nasa-lockup"><div className="nasa-roundel">NASA</div><span>NASA Space Apps<br />Challenge 2026</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(!mobileNav)}><Menu /></button>
          <div className="page-heading">
            <h1>PROJECT <span>ASTRAVITALS</span></h1>
            <p>Astronaut Health Intelligence System</p>
          </div>
          <div className="top-actions">
            <span className="top-pill online"><CheckCircle2 size={15} /> Offline Mode</span>
            <span className="top-pill"><Zap size={15} /> Mission: {scenario.mission}</span>
            <span className="top-pill"><Clock3 size={15} /> Sol: {scenario.sol}</span>
            <button className="avatar" title="Crew profile">AR</button>
          </div>
        </header>

        <section className="scenario-strip">
          <div className="scenario-label"><Radio size={15} /> ACTIVE SIMULATION</div>
          <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
            {scenarios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <span className="demo-tag">SIMULATED CREW DATA</span>
          <span className="notice"><span className="pulse-dot" /> {notice}</span>
        </section>

        <section className="metrics-grid">
          <div className="panel crew-card">
            <div className="astronaut-art"><div className="helmet"><div className="helmet-glass"><span /></div><div className="suit" /></div></div>
            <div className="crew-info"><span className="eyebrow">ASTRONAUT</span><h2>{scenario.astronaut}</h2><p>{scenario.role}</p><span className="health-chip"><Activity size={14} /> Monitoring</span></div>
          </div>
          <Metric icon={Heart} label="Heart Rate" value={`${scenario.heartRate} bpm`} status={`↑ ${Math.round((scenario.heartRate / scenario.heartRateBaseline - 1) * 100)}%`} tone="pink" />
          <Metric icon={Droplet} label="SpO₂" value={`${scenario.spo2}%`} status={scenario.spo2 < 95 ? "Review" : "Normal"} tone="cyan" />
          <Metric icon={Thermometer} label="Temperature" value={`${scenario.temperature}°C`} status="Normal" tone="teal" />
          <Metric icon={Moon} label="Sleep (24h)" value={`${scenario.sleepHours}h`} status={scenario.sleepHours < 6 ? "Low" : "In range"} tone="violet" />
        </section>

        <section className="dashboard-grid">
          <div className="panel overview-panel">
            <PanelTitle icon={Activity} title="Health Overview" meta="Last 24h" />
            <div className="chart-legend"><span><i className="legend-pink" /> HR</span><span><i className="legend-dash" /> Baseline</span></div>
            <HealthChart current={scenario.heartRate} baseline={scenario.heartRateBaseline} />
          </div>

          <div className="panel next-panel">
            <div className="next-title"><div><Sparkles size={21} /><h2>Next Best Check</h2></div><span>STEP {Math.min(checksDone + 1, 5)} OF 5</span></div>
            <div className="check-recommendation">
              <div className="test-icon"><FlaskIcon /></div>
              <div><h3>{nextCheck?.label || (session?.complete ? "Investigation complete" : "Start an investigation")}</h3><p>{nextCheck?.reason || "ASTRAVITALS will select the most informative next check using mission context and the current evidence."}</p></div>
            </div>
            {!session ? (
              <button className="primary-button" onClick={startInvestigation} disabled={loading}>{loading ? "Starting..." : "Start Investigation"} <ArrowRight size={17} /></button>
            ) : session.complete ? (
              <div className="complete-note"><CheckCircle2 size={17} /> Investigation reached its stopping rule</div>
            ) : showCheck ? (
              <div className="check-actions">
                <span className="check-prompt">What was the result?</span>
                <button className="result-button normal" onClick={() => submitCheck("normal")} disabled={loading}><Check size={15} /> Normal</button>
                <button className="result-button abnormal" onClick={() => submitCheck("abnormal")} disabled={loading}><AlertTriangle size={15} /> Abnormal</button>
              </div>
            ) : <button className="primary-button" onClick={() => setShowCheck(true)}>Continue Check <ArrowRight size={17} /></button>}
            <div className="engine-caption"><ShieldCheck size={13} /> Explainable reasoning · No black-box diagnosis</div>
          </div>

          <div className="panel causes-panel">
            <PanelTitle icon={Gauge} title="Possible Causes" meta="LIVE MODEL" />
            <div className="cause-list">
              {ranked.map(([key, value]) => {
                const Icon = checkIcons[key] || CircleHelp;
                return <div className="cause-row" key={key}><Icon className={`cause-icon ${key}`} size={17} /><span>{checkNames[key] || key}</span><div className="bar-track"><div className={`bar-fill ${key}`} style={{ width: `${Math.max(2, value * 100)}%` }} /></div><b>{percent(value * 100)}</b></div>;
              })}
            </div>
            <div className="cause-foot">Illustrative model beliefs · not medical probabilities</div>
          </div>

          <div className="panel reasoning-panel">
            <PanelTitle icon={Brain} title="Reasoning Trail" action="View Details" />
            <div className="timeline">
              {(session?.reasoning || scenario.observations.map((label) => ({ label, done: true }))).map((item, index) => (
                <div className="timeline-item" key={`${item.label}-${index}`}><span className={`timeline-dot ${item.done === false ? "pending" : ""}`}>{item.done === false ? <Clock3 size={12} /> : <Check size={12} />}</span><p>{item.label}</p></div>
              ))}
              {session && <div className="timeline-item current"><span className="timeline-dot pending"><Sparkles size={12} /></span><p>Selected next check: {nextCheck?.label || "Stopping rule reached"}</p></div>}
            </div>
          </div>

          <div className="panel context-panel">
            <PanelTitle icon={Zap} title="Mission Context" meta="LIVE CONTEXT" />
            <div className="context-grid">
              {contextCards.map((item) => <div className="context-tile" key={item.label}><item.icon className={item.tone} size={22} /><span>{item.label}</span><b>{item.value}</b><small>{item.sub}</small></div>)}
            </div>
          </div>

          <div className="panel conclusion-panel">
            <div className="conclusion-head"><CheckCircle2 size={19} /><h2>Current Assessment</h2></div>
            <div className="probable-chip">{session ? checkNames[topCause[0]] : "Awaiting investigation"} · {percent(topCause[1] * 100)}</div>
            <p className="assessment-copy">{session ? (session.complete ? "The stopping rule has been reached. Review the evidence and follow mission medical protocol." : "Evidence is being gathered. This is a working hypothesis, not a diagnosis.") : "Start an investigation to see how ASTRAVITALS updates its working hypotheses."}</p>
            <div className="action-line"><span>Recommended focus</span><b>{session ? (nextCheck?.label || "Review evidence and escalate as needed") : "Begin with the highest-value check"}</b></div>
            <div className="uncertainty"><CircleHelp size={14} /> Runner-up: {checkNames[secondCause[0]]} ({percent(secondCause[1] * 100)})</div>
            <button className="report-button" onClick={exportReport}><Download size={14} /> Export Mission Report</button>
          </div>
        </section>

        <footer className="footer"><span><span className="footer-star">✦</span> AstraVitals <i /> Next Best Check Engine</span><div className="ecg-line"><Waves size={18} /></div><em>Because in space, every next check counts.</em></footer>
        <div className="safety-note"><AlertTriangle size={12} /> Prototype only · Simulated data · Not for clinical use · Follow approved mission medical protocols</div>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value, status, tone }) {
  return <div className={`panel metric-card ${tone}`}><div className="metric-top"><Icon size={24} /><span>{label}</span></div><strong>{value}</strong><small>{status}</small><div className="sparkline"><svg viewBox="0 0 150 28" preserveAspectRatio="none"><path d="M0 19 C10 18 12 8 22 14 S38 25 48 15 S63 7 75 14 S92 22 103 12 S122 7 132 14 S142 18 150 8" /></svg></div></div>;
}

function PanelTitle({ icon: Icon, title, meta, action }) {
  return <div className="panel-title"><div><Icon size={19} /><h2>{title}</h2></div>{action ? <button className="text-action">{action} <ArrowRight size={13} /></button> : <span>{meta}</span>}</div>;
}

function HealthChart({ current, baseline }) {
  const delta = current - baseline;
  return <div className="chart-wrap"><div className="chart-y"><span>120</span><span>100</span><span>80</span><span>60</span></div><svg className="health-chart" viewBox="0 0 520 190" preserveAspectRatio="none">
    {[20, 62, 104, 146].map((y) => <line key={y} x1="0" x2="520" y1={y} y2={y} className="grid-line" />)}
    {[0, 86, 172, 258, 344, 430, 520].map((x) => <line key={x} x1={x} x2={x} y1="0" y2="160" className="grid-line vertical" />)}
    <line x1="0" x2="520" y1="112" y2="112" className="baseline-line" />
    <path d={`M0 118 C35 112 38 89 70 101 S115 130 145 111 S190 93 220 112 S265 128 300 110 S342 100 372 115 S420 129 448 105 S490 ${Math.max(20, 90 - delta * 2)} 520 ${Math.max(15, 70 - delta * 2)}`} className="chart-path" />
    <circle cx="520" cy={Math.max(15, 70 - delta * 2)} r="6" className="chart-point" />
  </svg><div className="chart-x"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div></div>;
}

function FlaskIcon() {
  return <div className="flask-drawing"><div className="flask-neck" /><div className="flask-body"><span /></div></div>;
}

export default App;
