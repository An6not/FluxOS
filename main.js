const UI = {
    startBtn: document.getElementById('btn-start'),
    fullBtn: document.getElementById('btn-fullscreen'),
    menu: document.getElementById('ui-overlay'),
    gameUI: document.getElementById('game-ui'),
    nodeName: document.getElementById('node-name'),
    nodePass: document.getElementById('node-pass')
};

UI.fullBtn.onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

UI.startBtn.onclick = () => {
    const name = UI.nodeName.value || "Survival";
    const pass = UI.nodePass.value;

    // Инициализация хоста (улучшено: проверка 1488)
    const hostSession = new HostSystem(name, pass);
    
    UI.menu.style.display = 'none';
    UI.gameUI.style.display = 'block';

    // Запуск ядра игры
    window.gameEngine = new MinecraftGame(hostSession);
    window.gameEngine.init();
};
