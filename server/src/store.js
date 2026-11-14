const investigations = new Map();

export function saveInvestigation(investigation) {
  investigations.set(investigation.id, investigation);
  return investigation;
}

export function getInvestigation(id) {
  return investigations.get(id);
}

export function updateInvestigation(investigation) {
  investigations.set(investigation.id, investigation);
  return investigation;
}
