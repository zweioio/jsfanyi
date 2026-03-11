// ===================================
// 导航栏滚动效果
// ===================================

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===================================
// Background Ripple Effect
// ===================================

function initBackgroundRipple() {
    const rippleContainer = document.getElementById('backgroundRipple');
    const rows = 8;
    const cols = 27;
    const cellSize = 56;
    
    // 创建网格
    const grid = document.createElement('div');
    grid.className = 'ripple-grid';
    
    // 创建单元格
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'ripple-cell';
        
        // 点击效果
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCellClick(cell);
        });
        
        grid.appendChild(cell);
    }
    
    rippleContainer.appendChild(grid);
    
    // 阻止点击事件穿透到上层
    rippleContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function handleCellClick(clickedCell) {
    // 移除所有单元格的 clicked 类
    document.querySelectorAll('.ripple-cell').forEach(cell => {
        cell.classList.remove('clicked');
    });
    
    // 添加 clicked 类到当前单元格
    clickedCell.classList.add('clicked');
    
    // 计算涟漪效果
    const cells = document.querySelectorAll('.ripple-cell');
    const clickedIndex = Array.from(cells).indexOf(clickedCell);
    const clickedRow = Math.floor(clickedIndex / 27);
    const clickedCol = clickedIndex % 27;
    
    cells.forEach((cell, index) => {
        const row = Math.floor(index / 27);
        const col = index % 27;
        const distance = Math.hypot(clickedRow - row, clickedCol - col);
        const delay = Math.max(0, distance * 55);
        const duration = 200 + distance * 80;
        
        cell.style.setProperty('--delay', `${delay}ms`);
        cell.style.setProperty('--duration', `${duration}ms`);
        
        // 重新触发动画
        setTimeout(() => {
            cell.classList.add('clicked');
        }, delay);
    });
}

// ===================================
// Glowing Effect Cards - 鼠标跟踪发光效果
// ===================================

function initGlowingCards() {
    console.log('初始化发光卡片...');
    const cards = document.querySelectorAll('.card-glow');
    console.log('找到卡片数量:', cards.length);
    
    cards.forEach((card, index) => {
        console.log(`初始化卡片 ${index}`);
        
        // 鼠标移动时更新发光位置
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 设置 CSS 变量，控制发光位置
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            console.log(`鼠标位置：X=${x}, Y=${y}`);
        });
        
        // 鼠标离开时清除效果
        card.addEventListener('mouseleave', () => {
            console.log('鼠标离开卡片');
        });
    });
}

// ===================================
// 平滑滚动
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// Tab 切换功能
// ===================================

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有激活状态
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            
            // 添加激活状态
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ===================================
// 初始化
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initBackgroundRipple();
    initGlowingCards();
    initTabs();
    
    console.log('即时翻译官网已加载');
});
