import express from "express";
import cors from "cors";
import { scenarios, getScenario } from "./scenarios.js";
import { CHECKS, HYPOTHESES, LABELS, buildPriors, chooseNextCheck, createInvestigation, recordCheck, validateMeasurement } from "./engine.js";
import { getInvestigation, saveInvestigation, updateInvestigation } from "./store.js";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "AstraVitals API", timestamp: new Date().toISOString() }));
app.get("/api/scenarios", (_req, res) => res.json({ scenarios }));
app.get("/api/scenarios/:id", (req, res) => {
  const scenario = getScenario(req.params.id);
  if (!scenario) return res.status(404).json({ error: "Scenario not found." });
  return res.json({ scenario });
});
app.get("/api/model", (_req, res) => {
  const priors = buildPriors(scenarios[0].context);
  res.json({
    hypotheses: HYPOTHESES.map((id) => ({ id, label: LABELS[id] })),
    priors,
    checks: CHECKS.map(({ id, label, duration, reason }) => ({ id, label, duration, reason })),
    nextCheck: chooseNextCheck(priors, [], scenarios[0].context),
    modelNote: "Illustrative assumptions only; not clinically calibrated."
  });
});
app.post("/api/investigations/start", (req, res) => {
  const scenario = getScenario(req.body?.scenarioId);
  if (!scenario) return res.status(400).json({ error: "A valid scenarioId is required." });
  const investigation = saveInvestigation(createInvestigation(scenario));
  res.status(201).json({ investigation });
});
app.get("/api/investigations/:id", (req, res) => {
  const investigation = getInvestigation(req.params.id);
  if (!investigation) return res.status(404).json({ error: "Investigation not found." });
  res.json({ investigation });
});
app.post("/api/investigations/:id/check", (req, res) => {
  const investigation = getInvestigation(req.params.id);
  if (!investigation) return res.status(404).json({ error: "Investigation not found." });
  try {
    const scenario = getScenario(investigation.scenarioId);
    const updated = updateInvestigation(recordCheck(investigation, req.body?.checkId, req.body?.result, scenario.context));
    return res.json({ investigation: updated });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
app.post("/api/investigations/:id/summary", (req, res) => {
  const investigation = getInvestigation(req.params.id);
  if (!investigation) return res.status(404).json({ error: "Investigation not found." });
  const ranked = Object.entries(investigation.posterior).sort((a, b) => b[1] - a[1]);
  res.json({
    investigationId: investigation.id,
    status: investigation.status,
    checksCompleted: investigation.checks.length,
    leadingHypotheses: ranked.slice(0, 2).map(([id, probability]) => ({ id, label: LABELS[id], probability })),
    disclaimer: "These are illustrative model beliefs, not diagnoses."
  });
});
app.post("/api/measurements/validate", (req, res) => {
  const { value, min, max } = req.body || {};
  res.json(validateMeasurement(value, min, max));
});
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Unexpected server error." });
});

app.listen(PORT, () => console.log(`AstraVitals API listening on http://localhost:${PORT}`));
