export const translations = {
  pt: {
    // Navegação
    home: "Início",
    agenda: "Agenda",
    pomodoro: "Pomodoro",
    sono: "Sono",
    perfil: "Perfil",

    // Header
    tagline: "organize seu dia com diversão",

    // Home Screen
    welcome: "Bem-vindo ao",
    subtitle: "seu hub de estudos gamificado",
    clickToOpen: "Clique para abrir",
    onboardingTitle: "Vamos preparar seu MinDay",
    onboardingIntro: "Personalize seu espaço de estudos. Você pode pular esta etapa.",
    optional: "opcional",
    sleepRange: "Faixa de sono",
    dailyGoal: "Meta diária de XP",
    dailyGoalHelp: "Escolha uma meta que combine com sua rotina. Ela pode ser alterada depois.",
    defaultOption: "padrão",
    skipSetup: "Pular por enquanto",
    finishSetup: "Salvar e começar",
    setupSaveError: "Não foi possível salvar. Tente novamente.",
    goalActiveToday: "Meta em vigor hoje:",
    goalStartsTomorrow: "A nova meta começa no próximo dia local:",
    goalChangeHelp: "Alterações feitas aqui passam a valer no próximo dia local.",
    goalInvalid: "Escolha uma meta válida.",
    goalSaveError: "Não foi possível salvar a nova meta. Tente novamente.",
    goalUsingCurrent: "A meta atual foi mantida; a alteração pendente foi cancelada.",
    goalScheduled: "Nova meta programada para o próximo dia local.",
    dailyMissionsTitle: "Missões de hoje",
    dailyMissionsHelp: "Complete as três para ganhar +10 XP bônus. As missões são opcionais.",
    dailyMissionsBonusReceived: "Bônus de +10 XP recebido!",
    dailyMissionsBonusToast: "Três missões concluídas",
    missionFocusOne: "Conclua 1 foco",
    missionFocusTwo: "Conclua 2 focos",
    missionTaskOne: "Conclua 1 tarefa",
    missionTaskTwo: "Conclua 2 tarefas",
    missionSleepIdeal: "Registre uma noite dentro da faixa de sono recomendada",
    missionXp20: "Ganhe 20 XP",
    missionCompleted: "Concluída",

    // Agenda Screen
    classes: "Aulas",
    addClass: "Adicionar aula",
    className: "Nome da aula",
    classTime: "08:00",
    tasks: "Tarefas",
    addTask: "Adicionar tarefa",
    newTask: "Nova tarefa",
    nextStatus: "Próximo status",
    status: "Status",
    category: "Categoria",
    all: "Todos",
    allCategories: "Todas as categorias",
    search: "Buscar tarefas...",
    sortByDate: "Ordenar por data",
    sortByStatus: "Ordenar por status",
    sortByCategory: "Ordenar por categoria",
    noTasksFound: "Nenhuma tarefa encontrada.",
    timeStudied: "Tempo estudado",

    // Status das tarefas
    pending: "Pendente",
    inProgress: "Em andamento",
    completed: "Concluída",

    // Pomodoro Screen
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    study: "Estudo",
    break: "Descanso",
    pause: "Pausar",
    start: "Iniciar",
    reset: "Resetar",
    cyclesCompleted: "Ciclos concluídos",
    quickTip: "Dica rápida",
    pomodoroTip: "Use os ciclos para estudar focado e faça pequenas pausas para recuperar energia. No modo Difícil, aumente a água e reduza distrações.",
    taskForFocus: "Tarefa deste foco (opcional)",
    noTaskSelected: "Sem tarefa selecionada",
    noTasksForFocus: "Adicione uma tarefa na Agenda para vinculá-la ao foco.",
    markTaskCompleteQuestion: "Marcar esta tarefa como concluída?",
    markTaskComplete: "Marcar como concluída",
    notNow: "Agora não",
    taskStudySaveError: "O foco foi concluído, mas não foi possível salvar o tempo estudado.",

    // Sleep Screen
    sleep: "Sono",
    readyToRecord: "Pronto para registrar",
    recordingInProgress: "Registro em andamento",
    recordSleep: "Registrar sono",
    endRecording: "Encerrar registro",
    records: "Registros",
    noRecordsYet: "Sem registros ainda.",
    startTime: "Início",
    endTime: "Fim",
    duration: "Duração",
    recording: "gravando...",
    sleepQuality: "Qualidade do sono",
    sleepQualityTip: "Depois de registrar uma noite de sono, você pode adicionar notas como 'dormi bem' ou 'acordei cedo'.",

    // Profile Screen
    profile: "Perfil",
    editProfile: "Editar Perfil",
    name: "Nome",
    about: "Sobre",
    profileTip: "Dica: personalize seu apelido para o mascote chamar você!",
    settings: "Configurações",
    logout: "Sair",
    language: "Idioma",
    languageSaved: "A língua é salva neste dispositivo.",

    // Botões e ações
    save: "Salvar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Remover",

    // Qualidade do sono
    inadequado: "Abaixo do ideal",
    adequado: "Dentro do ideal",
    excessivo: "Acima do ideal",

    // Tempo
    minutes: "min",
    hours: "h",

    // Mensagens
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso",

    // Placeholders
    enterName: "Digite seu nome",
    enterBio: "Digite uma descrição sobre você",
    enterTask: "Digite uma tarefa",
    enterClassName: "Digite o nome da aula",
    enterTime: "Digite o horário",
  },
};

export type Language = 'pt';
export type TranslationKey = keyof typeof translations.pt;