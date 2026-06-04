const LUNAR_STORAGE_KEY = "operacao-selene-state";

const CONFIG = {
  MAX_WEEKS: 10,
  QUESTIONS_PER_WEEK: 3,
  RESOURCE_CAP: 100,
  RISK_THRESHOLD: 30,
  INITIAL_VITAL: {
    energia: 60,
    agua: 60,
    oxigenio: 60,
    alimentos: 50,
  },
  INITIAL_OPERATIONAL: {
    minerais: 10,
    componentes: 10,
    biomassa: 10,
  },
  // Ajuste principal de dificuldade: quanto a base consome ao fechar cada semana.
  BASE_CONSUMPTION: {
    energia: 6,
    agua: 5,
    oxigenio: 5,
    alimentos: 6,
  },
  // Recompensa do quiz: altera o ritmo de ganho de recursos operacionais.
  REWARD_VALUES: {
    correct: 12,
    wrong: 3,
  },
};

const RESOURCE_META = {
  minerais: {
    label: "Minerais Lunares",
    icon: "bi-gem",
    cardClass: "resource-minerals",
  },
  componentes: {
    label: "Componentes Eletrônicos",
    icon: "bi-cpu",
    cardClass: "resource-components",
  },
  biomassa: {
    label: "Biomassa",
    icon: "bi-flower1",
    cardClass: "resource-biomass",
  },
};

const VITAL_LABELS = {
  energia: "Energia",
  agua: "Água",
  oxigenio: "Oxigênio",
  alimentos: "Alimentos",
};

const VITAL_META = {
  energia: {
    label: VITAL_LABELS.energia,
    icon: "bi-lightning-charge-fill",
  },
  agua: {
    label: VITAL_LABELS.agua,
    icon: "bi-droplet-fill",
  },
  oxigenio: {
    label: VITAL_LABELS.oxigenio,
    icon: "bi-wind",
  },
  alimentos: {
    label: VITAL_LABELS.alimentos,
    icon: "bi-basket-fill",
  },
};

const MODULE_ICONS = {
  painel_solar: "bi-sun",
  estufa: "bi-flower1",
  reciclador_agua: "bi-droplet-half",
  gerador_oxigenio: "bi-wind",
};

function clampBarValue(value) {
  return Math.max(0, Math.min(100, value));
}

function formatResourceName(resource) {
  return RESOURCE_META[resource]?.label ?? resource;
}

function getResourceMeta(resource) {
  return RESOURCE_META[resource] ?? RESOURCE_META.minerais;
}

function getVitalMeta(resource) {
  return VITAL_META[resource] ?? {
    label: VITAL_LABELS[resource] ?? resource,
    icon: "bi-circle-fill",
  };
}

function getVitalClass(resource) {
  const classMap = {
    agua: "water",
    oxigenio: "oxygen",
    alimentos: "food",
    energia: "energy",
  };

  return classMap[resource] ?? "energy";
}

function formatCostList(cost) {
  const entries = Object.entries(cost);

  if (!entries.length) {
    return "Sem custo";
  }

  return entries.map(([resource, value]) => `${value} ${formatResourceName(resource)}`).join(" · ");
}

function formatVitalDelta(resource, value, signal = "+") {
  return `${signal}${value} ${VITAL_LABELS[resource]}`;
}
