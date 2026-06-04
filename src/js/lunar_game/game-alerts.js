Object.assign(LunarGameUI.prototype, {
  getRiskResources() {
    return Object.entries(this.state.vital)
      .filter(([, value]) => value > 0 && value < CONFIG.RISK_THRESHOLD)
      .map(([resource, value]) => ({
        resource,
        value,
        label: VITAL_LABELS[resource],
      }));
  },

  createRiskAlerts() {
    const riskResources = this.getRiskResources();

    if (!riskResources.length) {
      return "";
    }

    return `
      <aside class="risk-alert" role="status" aria-live="polite">
        <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
        <div>
          <strong>Atenção aos recursos críticos</strong>
          <p>
            ${riskResources
              .map(({ label, value }) => `${label}: ${value}`)
              .join(" · ")}
          </p>
        </div>
      </aside>
    `;
  },
});
