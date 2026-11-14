# AstraVitals

**Hear the signal. Understand the change. Know what to check next.**

An offline-first astronaut health intelligence prototype. ASTRAVITALS compares simulated crew measurements with personal baselines, uses transparent Bayesian reasoning to rank possible contributors, and recommends one useful next check.

> **Safety notice:** This is a hackathon prototype using simulated data and illustrative likelihoods. It is not a medical device, diagnostic system, or substitute for qualified medical judgment. In a real mission, emergency protocols and medical authority always take precedence.

## Requirements
- Node.js 20+
- npm 10+

## Run the full project

From this folder:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API health: http://localhost:4000/api/health

The Vite development server proxies `/api` requests to the Express backend.

## Other commands

```bash
npm run build
npm test
npm start
```

`npm start` runs the API server. The built frontend is in `client/dist`; serve it with your preferred static host or reverse proxy.

## What's included
- Responsive React + Vite frontend in `client/`
- Node.js + Express backend in `server/`
- Explainable Bayesian posterior updates
- Shannon entropy / expected information gain per minute
- CO₂ safety-priority check override when cabin CO₂ is elevated
- Three simulated mission scenarios
- Investigation session endpoints
- Input validation and basic automated tests
- Browser local storage for demo investigation state

## Demo workflow
1. Choose a mission scenario in the left navigation.
2. Review the astronaut's measurements, baseline deviation, and mission context.
3. Start the recommended check.
4. Choose **Abnormal** or **Normal** to submit a simulated result.
5. Watch the candidate-cause probabilities and reasoning trail update.
6. Export a JSON investigation report.

## Project structure

```text
ASTRAVITALS/
├── client/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       └── data.js
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── index.js
│   │   ├── engine.js
│   │   ├── scenarios.js
│   │   └── store.js
│   └── test/
│       └── engine.test.js
└── README.md
```

## Scientific and implementation limitations
- All crew health values and scenario contexts are synthetic.
- Likelihood values are illustrative assumptions, not clinically calibrated probabilities.
- The simple Naive Bayes model assumes conditional independence between checks; real observations can be correlated.
- A probability bar is a model belief, not a diagnosis or measured medical risk.
- Radiation is shown as mission exposure context, not treated as a direct explanation for an acute heart-rate change.
- The prototype uses local in-memory API sessions; restarting the server clears them. Browser-side report history is stored locally.
- Offline behavior is represented by local-first UI state and cached scenario data. A production PWA/service worker and encrypted medical-grade storage would require additional engineering and review.
