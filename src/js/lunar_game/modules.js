const MODULES = {
  // Cada level define: custo operacional, producao vital e consumo vital semanal.
  // Para rebalancear o jogo, prefira mexer primeiro em cost/prod/cons aqui.
  painel_solar: {
    name: "Painel Solar",
    levels: [
      { level: 1, name: "B\u00e1sico", cost: { minerais: 14, componentes: 14 }, prod: { energia: 10 }, cons: {} },
      { level: 2, name: "Otimizado", cost: { minerais: 12, componentes: 16 }, prod: { energia: 14 }, cons: {} },
      { level: 3, name: "Avan\u00e7ado", cost: { minerais: 14, componentes: 20 }, prod: { energia: 18 }, cons: {} },
    ],
  },
  estufa: {
    name: "Estufa Hidrop\u00f4nica",
    levels: [
      { level: 1, name: "B\u00e1sico", cost: { minerais: 14, biomassa: 14 }, prod: { alimentos: 10 }, cons: { agua: 4, energia: 2 } },
      { level: 2, name: "Otimizado", cost: { minerais: 12, biomassa: 18 }, prod: { alimentos: 14 }, cons: { agua: 5, energia: 3 } },
      { level: 3, name: "Avan\u00e7ado", cost: { minerais: 14, biomassa: 22 }, prod: { alimentos: 18 }, cons: { agua: 4, energia: 4 } },
    ],
  },
  reciclador_agua: {
    name: "Reciclador de \u00c1gua",
    levels: [
      { level: 1, name: "B\u00e1sico", cost: { componentes: 14, biomassa: 14 }, prod: { agua: 10 }, cons: { energia: 3 } },
      { level: 2, name: "Otimizado", cost: { minerais: 14, componentes: 16 }, prod: { agua: 14 }, cons: { energia: 4 } },
      { level: 3, name: "Avan\u00e7ado", cost: { minerais: 16, componentes: 20 }, prod: { agua: 18 }, cons: { energia: 5 } },
    ],
  },
  gerador_oxigenio: {
    name: "Gerador de Oxig\u00eanio",
    levels: [
      { level: 1, name: "B\u00e1sico", cost: { minerais: 14, componentes: 14 }, prod: { oxigenio: 10 }, cons: { energia: 3 } },
      { level: 2, name: "Otimizado", cost: { minerais: 14, componentes: 16 }, prod: { oxigenio: 14 }, cons: { energia: 4 } },
      { level: 3, name: "Avan\u00e7ado", cost: { minerais: 16, componentes: 20 }, prod: { oxigenio: 18 }, cons: { energia: 5 } },
    ],
  },
};
