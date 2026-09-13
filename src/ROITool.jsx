import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { Car, Gauge, TrendingUp, Wrench, Fuel, Calculator } from "lucide-react";

// ---------- helpers ----------
const eur = (n, digits = 0) =>
  n.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits }) + " €";

const pct = (n, digits = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: digits }) + " %";

// ---------- field primitives ----------
function Field({ label, unit, value, onChange, min, max, step, help, signColor }) {
  const signClass = signColor ? (value > 0 ? "pos" : value < 0 ? "neg" : "") : "";
  return (
    <div className="field">
      <div className="field-top">
        <label>{label}</label>
        <div className="field-value">
          <input
            type="number"
            className={signClass}
            value={value}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="unit">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`slider${signColor ? " slider-centered" : ""}`}
      />
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="section">
      <div className="section-title">
        {icon}
        <span>{title}</span>
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export default function ROITool() {
  // Achat comptant
  const [carPrice, setCarPrice] = useState(20000);

  // Location GetAround
  const [dailyRate, setDailyRate] = useState(45);
  const [occupancyDays, setOccupancyDays] = useState(10);
  const [commissionPct, setCommissionPct] = useState(15);

  // Charges récurrentes
  const [insuranceMonthly, setInsuranceMonthly] = useState(60);
  const [maintenanceAnnual, setMaintenanceAnnual] = useState(800);
  const [fixedMonthlyOther, setFixedMonthlyOther] = useState(30);

  // Valorisation à la revente (dépréciation ou plus-value) & horizon
  const [valueChangeAnnual, setValueChangeAnnual] = useState(0);
  const [horizonYears, setHorizonYears] = useState(3);

  const calc = useMemo(() => {
    const downPayment = carPrice; // achat comptant : l'investissement initial est le prix total

    const revenueMonthly = dailyRate * occupancyDays * (1 - commissionPct / 100);
    const costsMonthly = insuranceMonthly + maintenanceAnnual / 12 + fixedMonthlyOther;
    const netMonthly = revenueMonthly - costsMonthly;

    const horizonMonths = horizonYears * 12;

    // cumulative operational cash flow, month by month
    const series = [];
    let cumulative = 0;
    let breakevenMonth = null;
    for (let m = 1; m <= horizonMonths; m++) {
      cumulative += netMonthly;
      if (breakevenMonth === null && cumulative >= downPayment) breakevenMonth = m;
      if (m % 1 === 0) {
        series.push({ month: m, cumulative: Math.round(cumulative) });
      }
    }

    const resaleValue = Math.max(0, carPrice * Math.pow(1 + valueChangeAnnual / 100, horizonYears));
    const netEquityAtSale = resaleValue; // pas de prêt : aucune dette à déduire

    const totalGain = cumulative + netEquityAtSale - downPayment;
    const roiPct = downPayment > 0 ? (totalGain / downPayment) * 100 : 0;
    const annualizedRoi = horizonYears > 0 ? (Math.pow(1 + totalGain / downPayment, 1 / horizonYears) - 1) * 100 : 0;

    return {
      downPayment,
      revenueMonthly,
      costsMonthly,
      netMonthly,
      series,
      breakevenMonth,
      resaleValue,
      netEquityAtSale,
      totalGain,
      roiPct,
      annualizedRoi,
      horizonMonths,
    };
  }, [
    carPrice,
    dailyRate,
    occupancyDays,
    commissionPct,
    insuranceMonthly,
    maintenanceAnnual,
    fixedMonthlyOther,
    valueChangeAnnual,
    horizonYears,
  ]);

  const barData = [
    { name: "Revenus", value: Math.round(calc.revenueMonthly), fill: "#E8B93A" },
    { name: "Charges", value: Math.round(calc.costsMonthly), fill: "#C0564A" },
  ];

  const positive = calc.netMonthly >= 0;

  return (
    <div className="wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

        :root {
          --bg: #12151A;
          --panel: #1B1F26;
          --panel-alt: #20242C;
          --border: #2A2F38;
          --text: #E9ECF1;
          --muted: #8A93A3;
          --amber: #E8B93A;
          --amber-dim: #7A6626;
          --red: #C0564A;
          --green: #6FBF8B;
        }
        * { box-sizing: border-box; }
        .wrap {
          background: var(--bg);
          color: var(--text);
          font-family: 'Public Sans', sans-serif;
          padding: 28px 20px 40px;
          min-height: 100%;
          border-radius: 12px;
        }
        .mono { font-family: 'IBM Plex Mono', monospace; }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border);
        }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-left h1 {
          font-size: 19px;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .header-left p { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
        .header-icon {
          width: 38px; height: 38px;
          background: var(--panel-alt);
          border: 1px solid var(--border);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--amber);
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .grid { grid-template-columns: 380px 1fr; align-items: start; }
        }

        .panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px;
        }

        .section { margin-bottom: 20px; }
        .section:last-child { margin-bottom: 0; }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          color: var(--amber);
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .section-title svg { width: 15px; height: 15px; }

        .field { margin-bottom: 14px; }
        .field:last-child { margin-bottom: 0; }
        .field-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 6px;
        }
        .field-top label { font-size: 13px; color: var(--text); }
        .field-value { display: flex; align-items: baseline; gap: 4px; }
        .field-value input[type="number"] {
          width: 66px;
          background: var(--panel-alt);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          text-align: right;
          padding: 3px 6px;
          border-radius: 6px;
        }
        .field-value input[type="number"]:focus { outline: 1px solid var(--amber); }
        .field-value input[type="number"].pos { color: var(--green); }
        .field-value input[type="number"].neg { color: var(--red); }
        .unit { color: var(--muted); font-size: 12px; }
        .field-help { font-size: 11px; color: var(--muted); margin-top: 4px; }

        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          background: var(--border);
        }
        input[type="range"].slider-centered {
          background: linear-gradient(
            to right,
            var(--red) 0%,
            var(--border) 50%,
            var(--green) 100%
          );
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--amber);
          cursor: pointer;
          border: 2px solid #12151A;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--amber);
          cursor: pointer;
          border: 2px solid #12151A;
        }

        .dash-top {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        @media (min-width: 640px) {
          .dash-top { grid-template-columns: 1.3fr 1fr 1fr; }
        }

        .hero {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-label {
          font-size: 11.5px; color: var(--muted); text-transform: none;
          margin-bottom: 6px;
        }
        .hero-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 44px;
          font-weight: 600;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .hero-value.pos { color: var(--green); }
        .hero-value.neg { color: var(--red); }
        .hero-sub { color: var(--muted); font-size: 12.5px; margin-top: 8px; }

        .stat {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .stat-label { font-size: 11.5px; color: var(--muted); margin-bottom: 6px; }
        .stat-value {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 22px;
          font-weight: 600;
        }
        .stat-value.pos { color: var(--green); }
        .stat-value.neg { color: var(--red); }
        .stat-sub { font-size: 11.5px; color: var(--muted); margin-top: 4px; }

        .chart-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px;
          margin-bottom: 16px;
        }
        .chart-header {
          display: flex; align-items: baseline; justify-content: space-between;
          margin-bottom: 4px;
        }
        .chart-title { font-size: 13.5px; font-weight: 600; }
        .chart-caption { font-size: 11.5px; color: var(--muted); margin-bottom: 10px; }

        .two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .two-col { grid-template-columns: 1fr 1fr; }
        }

        .breakdown-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
        }
        .breakdown-row:last-child { border-bottom: none; }
        .breakdown-row .val { font-family: 'IBM Plex Mono', monospace; }

        .tooltip-box {
          background: #0F1216;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          font-family: 'IBM Plex Mono', monospace;
        }
      `}</style>

      <div className="header">
        <div className="header-left">
          <div className="header-icon"><Car size={19} /></div>
          <div>
            <h1>Analyse ROI — Achat & location GetAround</h1>
            <p>Simulez la rentabilité d'un véhicule mis en location</p>
          </div>
        </div>
      </div>

      <div className="grid">
        {/* ---------- INPUTS ---------- */}
        <div className="panel">
          <Section icon={<Car />} title="Achat comptant">
            <Field label="Prix du véhicule" unit="€" value={carPrice} onChange={setCarPrice} min={5000} max={60000} step={500}
              help="investissement initial, payé cash" />
          </Section>

          <Section icon={<Gauge />} title="Location GetAround">
            <Field label="Tarif journalier" unit="€/j" value={dailyRate} onChange={setDailyRate} min={15} max={150} step={1} />
            <Field label="Jours loués / mois" unit="j" value={occupancyDays} onChange={setOccupancyDays} min={0} max={30} step={1} />
            <Field label="Commission GetAround" unit="%" value={commissionPct} onChange={setCommissionPct} min={0} max={40} step={1}
              help="prélevée sur chaque location" />
          </Section>

          <Section icon={<Wrench />} title="Charges récurrentes">
            <Field label="Assurance véhicule" unit="€/mois" value={insuranceMonthly} onChange={setInsuranceMonthly} min={0} max={300} step={5} />
            <Field label="Entretien" unit="€/an" value={maintenanceAnnual} onChange={setMaintenanceAnnual} min={0} max={3000} step={50} />
            <Field label="Autres charges fixes" unit="€/mois" value={fixedMonthlyOther} onChange={setFixedMonthlyOther} min={0} max={200} step={5}
              help="stationnement, carte grise, etc." />
          </Section>

          <Section icon={<Fuel />} title="Valorisation à la revente & horizon">
            <Field
              label="Évolution de valeur"
              unit="%/an"
              value={valueChangeAnnual}
              onChange={setValueChangeAnnual}
              min={-30}
              max={30}
              step={1}
              signColor
              help={
                valueChangeAnnual < 0
                  ? "dépréciation du véhicule chaque année"
                  : valueChangeAnnual > 0
                  ? "plus-value du véhicule chaque année"
                  : "valeur stable (curseur à gauche = dépréciation, à droite = plus-value)"
              }
            />
            <Field label="Horizon de revente" unit="ans" value={horizonYears} onChange={setHorizonYears} min={1} max={10} step={1} />
          </Section>
        </div>

        {/* ---------- DASHBOARD ---------- */}
        <div>
          <div className="dash-top">
            <div className="hero">
              <div className="hero-label">ROI total à {horizonYears} an{horizonYears > 1 ? "s" : ""} (revente incluse)</div>
              <div className={`hero-value ${calc.roiPct >= 0 ? "pos" : "neg"}`}>{pct(calc.roiPct, 0)}</div>
              <div className="hero-sub">≈ {pct(calc.annualizedRoi, 1)} par an · gain net {eur(calc.totalGain)}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Cash-flow mensuel net</div>
              <div className={`stat-value ${positive ? "pos" : "neg"}`}>{eur(calc.netMonthly)}</div>
              <div className="stat-sub">revenus locatifs − charges</div>
            </div>
            <div className="stat">
              <div className="stat-label">Point mort (prix récupéré)</div>
              <div className="stat-value">
                {calc.breakevenMonth ? `${calc.breakevenMonth} mois` : `> ${calc.horizonMonths} mois`}
              </div>
              <div className="stat-sub">
                {calc.breakevenMonth
                  ? `soit ${(calc.breakevenMonth / 12).toFixed(1)} an(s)`
                  : "non atteint sur l'horizon choisi"}
              </div>
            </div>
          </div>

          <div className="chart-panel">
            <div className="chart-header">
              <div className="chart-title">Cash-flow cumulé</div>
            </div>
            <div className="chart-caption">
              Ligne pointillée = prix d'achat ({eur(calc.downPayment)}) à récupérer par les loyers nets
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={calc.series} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8B93A" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E8B93A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F38" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#8A93A3", fontSize: 11 }}
                  tickFormatter={(m) => `${m}m`}
                  axisLine={{ stroke: "#2A2F38" }}
                  tickLine={false}
                  interval={Math.max(Math.floor(calc.horizonMonths / 6), 1)}
                />
                <YAxis
                  tick={{ fill: "#8A93A3", fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 100) / 10}k€`}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload && payload.length ? (
                      <div className="tooltip-box">
                        <div>Mois {label}</div>
                        <div style={{ color: "#E8B93A" }}>{eur(payload[0].value)}</div>
                      </div>
                    ) : null
                  }
                />
                <ReferenceLine y={calc.downPayment} stroke="#8A93A3" strokeDasharray="4 4" />
                <ReferenceLine y={0} stroke="#2A2F38" />
                <Area type="monotone" dataKey="cumulative" stroke="#E8B93A" strokeWidth={2} fill="url(#cashGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="two-col">
            <div className="chart-panel" style={{ marginBottom: 0 }}>
              <div className="chart-title" style={{ marginBottom: 10 }}>Revenus vs charges / mois</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#E9ECF1", fontSize: 12.5 }} axisLine={false} tickLine={false} width={70} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={26}>
                    <LabelList dataKey="value" position="right" formatter={(v) => eur(v)} fill="#E9ECF1" fontSize={12.5} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-panel" style={{ marginBottom: 0 }}>
              <div className="chart-title" style={{ marginBottom: 10 }}>Détail à la revente (an {horizonYears})</div>
              <div className="breakdown-row">
                <span>Valeur de revente estimée</span>
                <span className="val">{eur(calc.resaleValue)}</span>
              </div>
              <div className="breakdown-row">
                <span>Cash-flow cumulé (location)</span>
                <span className="val">{eur(calc.series.length ? calc.series[calc.series.length - 1].cumulative : 0)}</span>
              </div>
              <div className="breakdown-row">
                <span>Prix d'achat initial</span>
                <span className="val">− {eur(calc.downPayment)}</span>
              </div>
              <div className="breakdown-row">
                <span>Gain net total</span>
                <span className="val">{eur(calc.totalGain)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
