// Variáveis Globais de Configuração
const CONFIG = {
    MAX_WEEKS: 10,
    INITIAL_VITAL: {
        energia: 60,
        agua: 60,
        oxigenio: 60,
        alimentos: 50
    },
    INITIAL_OPERATIONAL: {
        minerais: 10,
        componentes: 10,
        biomassa: 10
    },
    BASE_CONSUMPTION: {
        energia: 6,
        agua: 5,
        oxigenio: 5,
        alimentos: 6
    },
    REWARD_TYPES: ['minerais', 'componentes', 'biomassa'],
    REWARD_VALUES: {
        correct: 12,
        wrong: 3
    },
    // Posições dos ícones no mapa (porcentagem)
    MODULE_POSITIONS: {
        painel_solar: { top: '20%', left: '30%', icon: '☀️' },
        estufa: { top: '40%', left: '60%', icon: '🌱' },
        reciclador_agua: { top: '60%', left: '25%', icon: '💧' },
        gerador_oxigenio: { top: '75%', left: '55%', icon: '💨' }
    }
};

class LunarGame {
    constructor() {
        this.week = 1;
        this.vital = { ...CONFIG.INITIAL_VITAL };
        this.operational = { ...CONFIG.INITIAL_OPERATIONAL };
        this.activeModules = {
            painel_solar: 0,
            estufa: 0,
            reciclador_agua: 0,
            gerador_oxigenio: 0
        };
        this.gameState = 'START';
        this.currentQuizQuestions = [];
        this.currentQuizIndex = 0;
        this.correctAnswers = 0;
        this.isCritical = false;

        this.initMap();
        this.updateUI();
    }

    initMap() {
        const overlay = document.getElementById('map-overlay');
        overlay.innerHTML = '';
        
        for (let key in CONFIG.MODULE_POSITIONS) {
            const pos = CONFIG.MODULE_POSITIONS[key];
            const iconDiv = document.createElement('div');
            iconDiv.id = `icon-${key}`;
            iconDiv.className = 'module-icon';
            iconDiv.style.top = pos.top;
            iconDiv.style.left = pos.left;
            iconDiv.innerHTML = pos.icon;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.id = `tooltip-${key}`;
            iconDiv.appendChild(tooltip);
            
            overlay.appendChild(iconDiv);
            this.updateTooltip(key);
        }
    }

    updateTooltip(key) {
        const level = this.activeModules[key];
        const tooltip = document.getElementById(`tooltip-${key}`);
        const mod = MODULES[key];
        const iconDiv = document.getElementById(`icon-${key}`);
        
        if (level > 0) {
            iconDiv.classList.add('active');
            const data = mod.levels[level - 1];
            let benefitText = "";
            for (let res in data.prod) benefitText += `<p class="benefit">Produz: +${data.prod[res]} ${res}</p>`;
            
            let costText = "";
            for (let res in data.cons) costText += `<p class="cost">Consome: -${data.cons[res]} ${res}</p>`;
            
            tooltip.innerHTML = `
                <h4>${mod.name} (Nível ${level})</h4>
                ${benefitText}
                ${costText}
            `;
        } else {
            iconDiv.classList.remove('active');
            tooltip.innerHTML = `
                <h4>${mod.name}</h4>
                <p>Não construído</p>
                <p>Nível 1 produz: +${mod.levels[0].prod[Object.keys(mod.levels[0].prod)[0]]} ${Object.keys(mod.levels[0].prod)[0]}</p>
            `;
        }
    }

    updateModulesInfoPanel() {
        const panel = document.getElementById('map-info-panel');
        let content = '<h4>Informacoes dos Modulos</h4>';
        
        for (let key in MODULES) {
            const mod = MODULES[key];
            const level = this.activeModules[key];
            const isActive = level > 0;
            
            content += `<div class="module-info-item ${isActive ? 'active' : ''}">`;
            content += `<div class="module-name">${mod.name}</div>`;
            
            if (isActive) {
                const data = mod.levels[level - 1];
                content += `<div class="module-level">Nivel ${level}: ${data.name}</div>`;
                
                for (let res in data.prod) {
                    content += `<div class="module-detail benefit">Produz: +${data.prod[res]} ${res}</div>`;
                }
                
                for (let res in data.cons) {
                    content += `<div class="module-detail cost">Consome: -${data.cons[res]} ${res}</div>`;
                }
            } else {
                content += `<div class="module-level">Nao construido</div>`;
                const firstLevel = mod.levels[0];
                for (let res in firstLevel.prod) {
                    content += `<div class="module-detail">Nivel 1 produz: +${firstLevel.prod[res]} ${res}</div>`;
                }
            }
            
            content += '</div>';
        }
        
        panel.innerHTML = content;
    }

    updateUI() {
        document.getElementById('week-title').innerText = `Semana ${this.week}`;
        document.getElementById('stat-energia').innerText = Math.max(0, this.vital.energia);
        document.getElementById('stat-agua').innerText = Math.max(0, this.vital.agua);
        document.getElementById('stat-oxigenio').innerText = Math.max(0, this.vital.oxigenio);
        document.getElementById('stat-alimentos').innerText = Math.max(0, this.vital.alimentos);
        document.getElementById('stat-minerais').innerText = this.operational.minerais;
        document.getElementById('stat-componentes').innerText = this.operational.componentes;
        document.getElementById('stat-biomassa').innerText = this.operational.biomassa;

        const maxVital = { energia: 100, agua: 100, oxigenio: 100, alimentos: 100 };
        ['energia', 'agua', 'oxigenio', 'alimentos'].forEach(res => {
            const el = document.getElementById(`stat-${res}`);
            const barEl = document.getElementById(`bar-${res}`);
            const percentage = Math.max(0, Math.min(100, (this.vital[res] / maxVital[res]) * 100));
            
            if (barEl) barEl.style.width = percentage + '%';
            
            if (this.vital[res] <= 0) {
                el.style.color = 'var(--color-error)';
            } else if (this.vital[res] < 20) {
                el.style.color = 'var(--color-warning)';
            } else {
                el.style.color = 'var(--color-cyan)';
            }
        });

        // Atualizar tooltips sempre que o nível mudar
        for (let key in this.activeModules) {
            this.updateTooltip(key);
        }

        // Atualizar painel de informações dos módulos
        this.updateModulesInfoPanel();
    }

    renderMessage(title, text) {
        const area = document.getElementById('message-area');
        area.innerHTML = `<h2>${title}</h2><div>${text}</div>`;
    }

    renderActions(actions) {
        const area = document.getElementById('action-area');
        area.innerHTML = '';
        actions.forEach(act => {
            const btn = document.createElement('button');
            btn.className = act.primary ? 'btn-game-primary' : 'btn-game-secondary';
            if (act.disabled) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.onclick = () => {
                    const msg = document.createElement('p');
                    msg.style.color = 'var(--color-error)';
                    msg.style.fontSize = '0.8rem';
                    msg.innerText = "Recursos insuficientes!";
                    btn.parentElement.insertBefore(msg, btn.nextSibling);
                    setTimeout(() => msg.remove(), 2000);
                };
            } else {
                btn.onclick = act.fn;
            }
            btn.innerText = act.label;
            area.appendChild(btn);
        });
    }

    nextStep() {
        switch (this.gameState) {
            case 'START':
                this.startWeek();
                break;
            case 'CONSUMPTION':
                this.startQuiz();
                break;
            case 'QUIZ':
                break;
            case 'CONSTRUCTION':
                this.activateModules();
                break;
            case 'ACTIVATION':
                this.checkSurvival();
                break;
        }
    }

    startWeek() {
        this.gameState = 'CONSUMPTION';
        let consumptionText = "<p>Consumo básico da base aplicado:</p><table class='production-report-table'><tr><th>Recurso</th><th>Quantidade</th></tr>";
        for (let res in CONFIG.BASE_CONSUMPTION) {
            this.vital[res] -= CONFIG.BASE_CONSUMPTION[res];
            consumptionText += `<tr><td>${res.toUpperCase()}</td><td style='color:var(--color-error)'>-${CONFIG.BASE_CONSUMPTION[res]}</td></tr>`;
        }
        consumptionText += "</table>";

        this.updateUI();

        this.isCritical = Object.values(this.vital).some(v => v <= 0);
        if (this.isCritical) {
            consumptionText += "<br><strong style='color:var(--color-error)'>ESTADO CRÍTICO: Recupere seus recursos até o fim da semana!</strong>";
        }

        this.renderMessage(`Início da Semana ${this.week}`, consumptionText);
        this.renderActions([{ label: "Ir para o Quiz", fn: () => this.nextStep(), primary: true }]);
    }

    startQuiz() {
        this.gameState = 'QUIZ';
        // Selecionar 3 perguntas aleatórias da lista global
        const shuffled = [...QUESTIONS].sort(() => 0.5 - Math.random());
        this.currentQuizQuestions = shuffled.slice(0, 3);
        this.currentQuizIndex = 0;
        this.showQuestion();
    }

    showQuestion() {
        if (this.currentQuizIndex >= 3) {
            this.gameState = 'CONSTRUCTION';
            this.showConstructionOptions();
            return;
        }

        const question = this.currentQuizQuestions[this.currentQuizIndex];
        // Recompensa aleatória (tipo)
        const rewardType = CONFIG.REWARD_TYPES[Math.floor(Math.random() * CONFIG.REWARD_TYPES.length)];
        question.actualRewardType = rewardType;

        this.renderMessage(`Quiz - Pergunta ${this.currentQuizIndex + 1}/3`, `<p>Recompensa em jogo: <strong>${rewardType.toUpperCase()}</strong></p><br><p>${question.text}</p>`);
        
        const actions = question.options.map((opt, idx) => ({
            label: opt,
            fn: () => this.handleAnswer(idx)
        }));
        this.renderActions(actions);
    }

    handleAnswer(index) {
        const question = this.currentQuizQuestions[this.currentQuizIndex];
        const isCorrect = index === question.correct;
        const rewardValue = isCorrect ? CONFIG.REWARD_VALUES.correct : CONFIG.REWARD_VALUES.wrong;
        const rewardType = question.actualRewardType;
        
        this.operational[rewardType] += rewardValue;
        if (isCorrect) this.correctAnswers++;

        const resultText = isCorrect ? 
            `<p style="color:var(--color-success)">Correto!</p><p>Você ganhou +${rewardValue} ${rewardType}.</p>` : 
            `<p style="color:var(--color-error)">Incorreto.</p><p>Você ganhou apenas +${rewardValue} ${rewardType} (recompensa mínima).</p>`;

        this.renderMessage("Resultado do Quiz", resultText);
        this.updateUI();
        
        this.currentQuizIndex++;
        this.renderActions([{ label: "Próxima Pergunta", fn: () => this.showQuestion(), primary: true }]);
    }

    showConstructionOptions() {
        this.renderMessage("Construção e Upgrades", "<p>Escolha um módulo para construir ou melhorar. Você precisa ter os materiais necessários.</p>");
        
        const actions = [];
        
        for (let key in MODULES) {
            const mod = MODULES[key];
            const currentLevel = this.activeModules[key];
            
            if (currentLevel < 3) {
                const nextMod = mod.levels[currentLevel];
                const label = currentLevel === 0 ? `Construir ${mod.name}` : `Upgrade ${mod.name} (Nível ${currentLevel + 1})`;
                
                let canAfford = true;
                let costText = [];
                for (let res in nextMod.cost) {
                    costText.push(`${nextMod.cost[res]} ${res}`);
                    if (this.operational[res] < nextMod.cost[res]) canAfford = false;
                }

                actions.push({
                    label: `${label} [Custo: ${costText.join(', ')}]`,
                    fn: () => this.buildModule(key, nextMod.cost),
                    disabled: !canAfford
                });
            }
        }

        actions.push({ label: "Pular ação (Guardar recursos)", fn: () => this.nextStep(), primary: true });
        this.renderActions(actions);
    }

    buildModule(key, cost) {
        // Validação extra de segurança
        for (let res in cost) {
            if (this.operational[res] < cost[res]) return;
        }

        for (let res in cost) {
            this.operational[res] -= cost[res];
        }
        this.activeModules[key]++;
        this.updateUI();
        this.nextStep();
    }

    activateModules() {
        this.gameState = 'ACTIVATION';
        let report = "<p>Relatório de eficiência dos módulos instalados:</p>";
        let tableRows = "";
        let hasActive = false;
        
        for (let key in this.activeModules) {
            const level = this.activeModules[key];
            if (level > 0) {
                hasActive = true;
                const modData = MODULES[key].levels[level - 1];
                
                for (let res in modData.prod) {
                    this.vital[res] += modData.prod[res];
                    tableRows += `<tr><td>${MODULES[key].name}</td><td style='color:var(--color-success)'>+${modData.prod[res]} ${res}</td></tr>`;
                }
                for (let res in modData.cons) {
                    this.vital[res] -= modData.cons[res];
                    tableRows += `<tr><td>${MODULES[key].name}</td><td style='color:var(--color-error)'>-${modData.cons[res]} ${res}</td></tr>`;
                }
            }
        }

        if (!hasActive) {
            report += "<p>Nenhum módulo ativo esta semana.</p>";
        } else {
            report += `<table class='production-report-table'>
                <tr><th>Módulo</th><th>Impacto</th></tr>
                ${tableRows}
            </table>`;
        }

        this.updateUI();
        this.renderMessage("Relatório de Produção", report);
        this.renderActions([{ label: "Verificar Sobrevivência", fn: () => this.nextStep(), primary: true }]);
    }

    checkSurvival() {
        const failed = Object.values(this.vital).some(v => v <= 0);
        
        if (failed) {
            this.gameOver(false);
        } else if (this.week >= CONFIG.MAX_WEEKS) {
            this.gameOver(true);
        } else {
            this.week++;
            this.gameState = 'START';
            this.renderMessage("Semana Concluída", "<p>A base sobreviveu a mais uma semana. Prepare-se para o próximo ciclo.</p>");
            this.renderActions([{ label: "Próxima Semana", fn: () => this.nextStep(), primary: true }]);
        }
    }

    gameOver(victory) {
        if (victory) {
            let rank = "";
            let msg = "";
            const minVital = Math.min(...Object.values(this.vital));

            if (minVital >= 60) {
                rank = "Base Autossustentável";
                msg = "Parabéns! Sua base lunar alcançou um nível autossustentável. Os recursos foram bem administrados e a missão se tornou um exemplo de equilíbrio e planejamento.";
            } else if (minVital >= 30) {
                rank = "Missão Concluída";
                msg = "Missão concluída! Sua base sobreviveu às 10 semanas lunares. Alguns recursos ainda podem ser otimizados, mas a tripulação está segura.";
            } else {
                rank = "Missão em Risco";
                msg = "A missão chegou ao fim, mas a base operou em condição de risco. Alguns recursos ficaram críticos e exigiriam melhorias em uma próxima missão.";
            }

            this.renderMessage(`VITÓRIA: ${rank}`, `<p>${msg}</p>`);
        } else {
            this.renderMessage("FALHA NA MISSÃO", "<p>A base perdeu um recurso vital e não conseguiu manter a tripulação em segurança. Tente novamente com uma estratégia diferente.</p>");
        }
        
        this.renderActions([{ label: "Reiniciar Jogo", fn: () => location.reload(), primary: true }]);
    }
}

const game = new LunarGame();
