// Текущие настройки
let currentIconTheme = 'OriginOs_icon';
let currentWallpaper = './public/wallpapers/wallpaper_2.png';

// Обновление времени
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    document.getElementById('time').textContent = timeString;
    document.getElementById('timeStatus').textContent = timeString;
    document.getElementById('widgetTime').textContent = timeString;
}

// Обновление даты
function updateDate() {
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    
    const dateString = `${dayName}, ${day} ${month}`;
    document.getElementById('widgetDate').textContent = dateString;
}

// Инициализация времени и даты
updateTime();
updateDate();
setInterval(updateTime, 1000);

// Загрузка обоев
function loadWallpapers() {
    const wallpaperGrid = document.getElementById('wallpaperGrid');
    wallpaperGrid.innerHTML = '';
    
    // Создаем превью для обоев (2-35)
    for (let i = 2; i <= 35; i++) {
        const wallpaperPath = `./public/wallpapers/wallpaper_${i}.png`;
        const wallpaperDiv = document.createElement('div');
        wallpaperDiv.className = 'wallpaper-option';
        wallpaperDiv.style.backgroundImage = `url('${wallpaperPath}')`;
        wallpaperDiv.dataset.wallpaper = wallpaperPath;
        
        if (wallpaperPath === currentWallpaper) {
            wallpaperDiv.classList.add('active');
        }
        
        wallpaperDiv.addEventListener('click', function() {
            changeWallpaper(wallpaperPath);
        });
        
        wallpaperGrid.appendChild(wallpaperDiv);
    }
}

// Смена обоев
function changeWallpaper(wallpaperPath) {
    currentWallpaper = wallpaperPath;
    document.getElementById('wallpaper').style.backgroundImage = `url('${wallpaperPath}')`;
    
    // Обновление активного состояния
    document.querySelectorAll('.wallpaper-option').forEach(option => {
        if (option.dataset.wallpaper === wallpaperPath) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Смена темы иконок
function changeIconTheme(themeName) {
    currentIconTheme = themeName;
    
    // Обновление всех иконок в сетке
    const appIcons = document.querySelectorAll('.app-grid .app-icon');
    appIcons.forEach(icon => {
        const appName = icon.dataset.app;
        const img = icon.querySelector('.icon-img');
        if (img) {
            img.src = `./public/icons/${themeName}/${appName}.png`;
        }
    });
    
    // Обновление иконок в доке
    const dockIcons = document.querySelectorAll('.dock .dock-icon');
    dockIcons.forEach(icon => {
        const appName = icon.dataset.app;
        const img = icon.querySelector('.icon-img');
        if (img) {
            img.src = `./public/icons/${themeName}/${appName}.png`;
        }
    });
    
    // Обновление активной кнопки темы
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === themeName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Содержимое приложений
const appContents = {
    clock: {
        title: 'Часы',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 72px; font-weight: 300; color: #333; margin-bottom: 20px;" id="appClockTime">12:30</div>
                <div style="font-size: 18px; color: #666;">Мировое время</div>
            </div>
        `
    },
    calendar: {
        title: 'Календарь',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📅</div>
                <h2 style="color: #333; margin-bottom: 10px;">Календарь</h2>
                <p style="color: #666;">Ваши события и напоминания</p>
            </div>
        `
    },
    gallery: {
        title: 'Галерея',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🖼️</div>
                <h2 style="color: #333; margin-bottom: 10px;">Галерея</h2>
                <p style="color: #666;">Ваши фотографии и видео</p>
            </div>
        `
    },
    settings: {
        title: 'Настройки',
        content: `
            <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Wi-Fi</div>
                        <div style="font-size: 13px; color: #999;">Домашняя сеть</div>
                    </div>
                    <div style="font-size: 24px;">📡</div>
                </div>
                <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Bluetooth</div>
                        <div style="font-size: 13px; color: #999;">Выключен</div>
                    </div>
                    <div style="font-size: 24px;">📶</div>
                </div>
                <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Уведомления</div>
                        <div style="font-size: 13px; color: #999;">Включены</div>
                    </div>
                    <div style="font-size: 24px;">🔔</div>
                </div>
                <div style="padding: 16px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Звук и вибрация</div>
                        <div style="font-size: 13px; color: #999;">Настроить</div>
                    </div>
                    <div style="font-size: 24px;">🔊</div>
                </div>
                <div style="padding: 16px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Дисплей и яркость</div>
                        <div style="font-size: 13px; color: #999;">Автояркость включена</div>
                    </div>
                    <div style="font-size: 24px;">💡</div>
                </div>
            </div>
        `
    },
    messages: {
        title: 'Сообщения',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">💬</div>
                <h2 style="color: #333; margin-bottom: 10px;">Сообщения</h2>
                <p style="color: #666;">Нет новых сообщений</p>
            </div>
        `
    },
    phone: {
        title: 'Телефон',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📞</div>
                <h2 style="color: #333; margin-bottom: 10px;">Телефон</h2>
                <p style="color: #666;">Недавние звонки</p>
            </div>
        `
    },
    music: {
        title: 'Музыка',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎵</div>
                <h2 style="color: #333; margin-bottom: 10px;">Музыка</h2>
                <p style="color: #666;">Ваша музыкальная библиотека</p>
                <div style="margin-top: 20px; color: #999; font-size: 14px;">
                    Доступно треков: ${getMusicFiles().length}
                </div>
            </div>
        `
    },
    files: {
        title: 'Файлы',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">📁</div>
                <h2 style="color: #333; margin-bottom: 10px;">Файлы</h2>
                <p style="color: #666;">Файловый менеджер</p>
            </div>
        `
    },
    calculator: {
        title: 'Калькулятор',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🔢</div>
                <h2 style="color: #333; margin-bottom: 10px;">Калькулятор</h2>
                <p style="color: #666;">Выполняйте вычисления</p>
            </div>
        `
    },
    compass: {
        title: 'Компас',
        content: `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🧭</div>
                <h2 style="color: #333; margin-bottom: 10px;">Компас</h2>
                <p style="color: #666;">Навигация и направление</p>
            </div>
        `
    }
};

// Получить список музыкальных файлов (заглушка)
function getMusicFiles() {
    // В реальном приложении здесь был бы список из ./public/music
    return ['track1', 'track2', 'track3'];
}

// Открытие приложения
function openApp(appName) {
    const appScreen = document.getElementById('appScreen');
    const appTitle = document.getElementById('appTitle');
    const appContent = document.getElementById('appContent');
    
    if (appContents[appName]) {
        appTitle.textContent = appContents[appName].title;
        appContent.innerHTML = appContents[appName].content;
        appScreen.classList.add('active');
        
        // Запуск часов в приложении Часы
        if (appName === 'clock') {
            updateAppClock();
            window.appClockInterval = setInterval(updateAppClock, 1000);
        }
    }
}

// Обновление часов в приложении
function updateAppClock() {
    const clockElement = document.getElementById('appClockTime');
    if (clockElement) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}`;
    }
}

// Закрытие приложения
function closeApp() {
    const appScreen = document.getElementById('appScreen');
    appScreen.classList.remove('active');
    
    // Остановка часов
    if (window.appClockInterval) {
        clearInterval(window.appClockInterval);
    }
}

// Обработчики событий для иконок приложений
document.querySelectorAll('.app-icon, .dock-icon').forEach(icon => {
    icon.addEventListener('click', function() {
        const appName = this.getAttribute('data-app');
        if (appName) {
            openApp(appName);
        }
    });
});

// Обработчик кнопки "Назад"
document.getElementById('backButton').addEventListener('click', closeApp);

// Панель настроек
const settingsPanel = document.getElementById('settingsPanel');
const floatingSettings = document.getElementById('floatingSettings');
const closeSettingsBtn = document.getElementById('closeSettings');

floatingSettings.addEventListener('click', () => {
    settingsPanel.classList.add('active');
    loadWallpapers();
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
});

// Обработчики кнопок тем
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const theme = this.dataset.theme;
        changeIconTheme(theme);
    });
});

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Установка активной темы
    document.querySelector(`.theme-btn[data-theme="${currentIconTheme}"]`)?.classList.add('active');
});