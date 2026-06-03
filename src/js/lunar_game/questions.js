const QUESTIONS = [
    // Semana 1
    {
        resource: 'minerais',
        text: 'Qual é o principal componente do solo lunar (regolito) que pode ser usado para construção?',
        options: ['Oxigênio e Silício', 'Ouro puro', 'Plástico espacial', 'Madeira lunar'],
        correct: 0
    },
    {
        resource: 'componentes',
        text: 'Qual fonte de energia é a mais viável para uma base lunar sustentável inicial?',
        options: ['Carvão mineral', 'Energia Solar', 'Vento lunar', 'Petróleo'],
        correct: 1
    },
    {
        resource: 'biomassa',
        text: 'O que é necessário para cultivar plantas em ambientes extremos como a Lua?',
        options: ['Apenas luz artificial', 'Solo comum da Terra', 'Controle de temperatura, água e nutrientes', 'Nada, plantas crescem no vácuo'],
        correct: 2
    },
    // Semana 2
    {
        resource: 'minerais',
        text: 'Por que a reciclagem de materiais é vital em uma missão espacial?',
        options: ['Para ocupar o tempo dos astronautas', 'Porque recursos são limitados e caros de transportar', 'Não é vital', 'Apenas por estética'],
        correct: 1
    },
    {
        resource: 'componentes',
        text: 'Qual a função de um sistema de suporte à vida (ECLSS)?',
        options: ['Jogar videogame', 'Controlar a iluminação externa', 'Fornecer ar respirável e água limpa', 'Aumentar a gravidade'],
        correct: 2
    },
    {
        resource: 'biomassa',
        text: 'O que é hidroponia?',
        options: ['Cultivo de plantas em água com nutrientes, sem solo', 'Criação de peixes no vácuo', 'Estudo de rochas lunares', 'Um tipo de combustível'],
        correct: 0
    },
    // Adicionando mais perguntas para completar as 10 semanas (3 por semana = 30)
    // Semana 3
    { resource: 'minerais', text: 'Onde se acredita que exista gelo de água na Lua?', options: ['No centro da Lua', 'Em crateras permanentemente sombreadas nos polos', 'Na superfície ensolarada', 'Não existe água na Lua'], correct: 1 },
    { resource: 'componentes', text: 'Qual a principal vantagem de usar impressoras 3D na Lua?', options: ['Fazer brinquedos', 'Construir peças usando o próprio solo lunar', 'Imprimir comida real', 'Não há vantagem'], correct: 1 },
    { resource: 'biomassa', text: 'Qual gás as plantas produzem que é essencial para os humanos?', options: ['Nitrogênio', 'Gás Carbônico', 'Oxigênio', 'Hélio'], correct: 2 },
    // Semana 4
    { resource: 'minerais', text: 'O que é sustentabilidade?', options: ['Gastar tudo agora', 'Usar recursos de forma que não faltem no futuro', 'Ignorar o meio ambiente', 'Viver apenas de tecnologia'], correct: 1 },
    { resource: 'componentes', text: 'O que protege os astronautas da radiação solar na Lua?', options: ['Protetor solar comum', 'Camadas de solo lunar ou escudos metálicos', 'Apenas o traje espacial', 'A atmosfera lunar'], correct: 1 },
    { resource: 'biomassa', text: 'Qual o papel da biomassa em um sistema fechado?', options: ['Produzir lixo', 'Reciclar nutrientes e produzir alimento', 'Gerar eletricidade por magnetismo', 'Nenhuma das anteriores'], correct: 1 },
    // Semana 5
    { resource: 'minerais', text: 'Qual o principal desafio de minerar na Lua?', options: ['Falta de gravidade e poeira abrasiva', 'Excesso de oxigênio', 'Muitas árvores no caminho', 'Chuva constante'], correct: 0 },
    { resource: 'componentes', text: 'Como a energia é armazenada para a noite lunar?', options: ['Em baldes', 'Em baterias de alta capacidade ou células de combustível', 'Não é armazenada', 'Usando espelhos'], correct: 1 },
    { resource: 'biomassa', text: 'Por que usamos luz LED nas estufas espaciais?', options: ['Porque são coloridas', 'Para economizar energia e fornecer as cores certas para as plantas', 'Porque são mais baratas', 'Não usamos LED'], correct: 1 },
    // Semana 6
    { resource: 'minerais', text: 'O que pode ser extraído do regolito lunar além de minerais?', options: ['Água líquida', 'Oxigênio', 'Madeira', 'Petróleo'], correct: 1 },
    { resource: 'componentes', text: 'Qual a importância da manutenção preventiva?', options: ['Nenhuma', 'Evitar falhas críticas nos sistemas vitais', 'Gastar recursos extras', 'Deixar a base mais bonita'], correct: 1 },
    { resource: 'biomassa', text: 'Como os resíduos orgânicos são tratados na base?', options: ['Jogados no espaço', 'Compostados para virar nutrientes para as plantas', 'Queimados', 'Enterrados'], correct: 1 },
    // Semana 7
    { resource: 'minerais', text: 'Qual o metal mais comum encontrado na crosta lunar?', options: ['Ouro', 'Alumínio', 'Ferro', 'Prata'], correct: 1 },
    { resource: 'componentes', text: 'O que é um sistema de malha fechada?', options: ['Um sistema onde nada se perde, tudo se recicla', 'Um sistema quebrado', 'Um sistema sem portas', 'Um sistema de internet'], correct: 0 },
    { resource: 'biomassa', text: 'Qual a vantagem da spirulina (alga) no espaço?', options: ['É saborosa', 'Alta produção de oxigênio e nutrientes em pouco espaço', 'Serve como combustível de foguete', 'Não tem vantagem'], correct: 1 },
    // Semana 8
    { resource: 'minerais', text: 'Como a poeira lunar afeta os equipamentos?', options: ['Lubrifica as engrenagens', 'É altamente abrasiva e pode danificar selos e juntas', 'Não afeta', 'Limpa os sensores'], correct: 1 },
    { resource: 'componentes', text: 'O que acontece se a energia da base acabar?', options: ['Os astronautas dormem mais', 'Sistemas de suporte à vida param de funcionar', 'A base muda de cor', 'Nada acontece'], correct: 1 },
    { resource: 'biomassa', text: 'Qual o benefício psicológico das plantas para a tripulação?', options: ['Nenhum', 'Redução do estresse e sensação de conexão com a Terra', 'Aumenta o cansaço', 'Nenhuma das anteriores'], correct: 1 },
    // Semana 9
    { resource: 'minerais', text: 'Por que o hélio-3 lunar é interessante?', options: ['Para encher balões', 'Potencial combustível para fusão nuclear limpa', 'Para fazer gelo seco', 'Não é interessante'], correct: 1 },
    { resource: 'componentes', text: 'O que é redundância em sistemas espaciais?', options: ['Ter sistemas de reserva caso o principal falhe', 'Falar a mesma coisa várias vezes', 'Gastar o dobro de energia', 'Não ter planos de emergência'], correct: 0 },
    { resource: 'biomassa', text: 'Como a água é recuperada da respiração e suor?', options: ['Não é recuperada', 'Através de sistemas de condensação e filtragem', 'Usando esponjas', 'Saindo da base'], correct: 1 },
    // Semana 10
    { resource: 'minerais', text: 'Qual o maior objetivo de uma base lunar?', options: ['Turismo de luxo apenas', 'Ciência, exploração e teste de tecnologias sustentáveis', 'Esconder tesouros', 'Construir estádios'], correct: 1 },
    { resource: 'componentes', text: 'O que define o sucesso de uma missão lunar sustentável?', options: ['A quantidade de fotos tiradas', 'A capacidade de manter a vida com o mínimo de recursos da Terra', 'O tamanho da base', 'A velocidade do foguete'], correct: 1 },
    { resource: 'biomassa', text: 'Qual o futuro da colonização espacial?', options: ['Viver apenas em naves', 'Bases autossustentáveis em outros corpos celestes', 'Voltar para as cavernas', 'Não há futuro'], correct: 1 }
];
