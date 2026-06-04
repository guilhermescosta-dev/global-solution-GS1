const MODULES = {
    painel_solar: {
        name: "Painel Solar",
        levels: [
            { level: 1, name: "Básico", cost: { minerais: 15, componentes: 15 }, prod: { energia: 10 }, cons: {} },
            { level: 2, name: "Otimizado", cost: { minerais: 15, componentes: 20 }, prod: { energia: 14 }, cons: {} },
            { level: 3, name: "Avançado", cost: { minerais: 25, componentes: 25 }, prod: { energia: 18 }, cons: {} }
        ]
    },
    estufa: {
        name: "Estufa Hidropônica",
        levels: [
            { level: 1, name: "Básico", cost: { minerais: 15, biomassa: 20 }, prod: { alimentos: 10 }, cons: { agua: 4, energia: 2 } },
            { level: 2, name: "Otimizado", cost: { minerais: 15, biomassa: 20 }, prod: { alimentos: 14 }, cons: { agua: 4, energia: 2 } },
            { level: 3, name: "Avançado", cost: { minerais: 20, biomassa: 30 }, prod: { alimentos: 18 }, cons: { agua: 3, energia: 2 } }
        ]
    },
    reciclador_agua: {
        name: "Reciclador de Água",
        levels: [
            { level: 1, name: "Básico", cost: { minerais: 20, componentes: 15 }, prod: { agua: 10 }, cons: { energia: 3 } },
            { level: 2, name: "Otimizado", cost: { minerais: 20, componentes: 20 }, prod: { agua: 14 }, cons: { energia: 3 } },
            { level: 3, name: "Avançado", cost: { minerais: 30, componentes: 25 }, prod: { agua: 18 }, cons: { energia: 2 } }
        ]
    },
    gerador_oxigenio: {
        name: "Gerador de Oxigênio",
        levels: [
            { level: 1, name: "Básico", cost: { minerais: 20, componentes: 20 }, prod: { oxigenio: 10 }, cons: { energia: 4 } },
            { level: 2, name: "Otimizado", cost: { minerais: 20, componentes: 25 }, prod: { oxigenio: 14 }, cons: { energia: 4 } },
            { level: 3, name: "Avançado", cost: { minerais: 25, componentes: 30 }, prod: { oxigenio: 18 }, cons: { energia: 3 } }
        ]
    }
};
