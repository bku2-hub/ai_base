const bugs = [
    { id: 'cockroach', icon: '🪳', name: '바퀴벌레' },
    { id: 'bat', icon: '🦇', name: '박쥐' },
    { id: 'fly', icon: '🪰', name: '파리' },
    { id: 'toad', icon: '🐸', name: '두꺼비' },
    { id: 'rat', icon: '🐀', name: '쥐' },
    { id: 'scorpion', icon: '🦂', name: '전갈' },
    { id: 'stinkbug', icon: '🦨', name: '노린재' },
    { id: 'spider', icon: '🕷️', name: '거미' }
];

let playerHand = [];
let opponentHand = [];
let tableCard = null;
let declaredBug = null;
let currentTurn = 'player'; // 'player' or 'opponent'
let gameOver = false;

// DOM Elements
const playerHandEl = document.getElementById('playerHand');
const opponentHandEl = document.getElementById('opponentHand');
const tableSlotEl = document.getElementById('tableSlot');
const overlayEl = document.getElementById('overlay');
const declareModalEl = document.getElementById('declareModal');
const guessModalEl = document.getElementById('guessModal');
const resultModalEl = document.getElementById('resultModal');
const gameOverModalEl = document.getElementById('gameOverModal');
const bugOptionsEl = document.getElementById('bugOptions');
const opponentStatusEl = document.getElementById('opponentStatus');
const resultTitleEl = document.getElementById('resultTitle');
const resultMessageEl = document.getElementById('resultMessage');
const nextTurnBtn = document.getElementById('nextTurnBtn');
const guessPromptEl = document.getElementById('guessPrompt');
const turnIndicatorEl = document.getElementById('turnIndicator');
const playerAvatarEl = document.getElementById('playerAvatar');
const opponentAvatarEl = document.getElementById('opponentAvatar');

// Initialization
function initGame() {
    playerHand = generateHandArray(5);
    opponentHand = generateHandArray(5);
    renderBugOptions();
    updateUI();
    startTurn();
}

function getRandomBug() {
    return bugs[Math.floor(Math.random() * bugs.length)];
}

function generateHandArray(count) {
    let arr = [];
    for(let i=0; i<count; i++) {
        arr.push({ id: Date.now() + Math.random(), bug: getRandomBug() });
    }
    return arr;
}

function updateUI() {
    renderPlayerHand();
    renderOpponentHand();
    playerAvatarEl.textContent = `👤 플레이어 (${playerHand.length}장)`;
    opponentAvatarEl.textContent = `🤖 상대방 (${opponentHand.length}장)`;
    
    if(currentTurn === 'player') {
        turnIndicatorEl.textContent = "👤 내 턴입니다!";
        turnIndicatorEl.style.color = "var(--primary)";
        turnIndicatorEl.style.borderColor = "var(--primary)";
    } else {
        turnIndicatorEl.textContent = "🤖 상대방 턴입니다!";
        turnIndicatorEl.style.color = "#e74c3c";
        turnIndicatorEl.style.borderColor = "#e74c3c";
    }
}

function startTurn() {
    if(checkGameOver()) return;
    
    if(currentTurn === 'opponent') {
        setTimeout(opponentPlay, 1500);
    }
}

function checkGameOver() {
    if(playerHand.length === 0) {
        showGameOver("🎉 축하합니다! 카드를 모두 소진하여 승리했습니다!");
        return true;
    }
    if(opponentHand.length === 0) {
        showGameOver("💀 상대방이 카드를 모두 소진하여 패배했습니다.");
        return true;
    }
    return false;
}

function showGameOver(msg) {
    gameOver = true;
    document.getElementById('gameOverMessage').textContent = msg;
    document.getElementById('gameOverTitle').textContent = playerHand.length === 0 ? "승리!" : "패배";
    hideAllModals();
    showModal(gameOverModalEl);
}

function renderPlayerHand() {
    playerHandEl.innerHTML = '';
    playerHand.forEach((cardData, index) => {
        const cardEl = createCardElement(cardData, true);
        cardEl.style.zIndex = index;
        cardEl.addEventListener('click', () => {
            if(currentTurn === 'player' && !tableCard && !gameOver) {
                playCardFromPlayer(cardData, cardEl);
            }
        });
        playerHandEl.appendChild(cardEl);
    });
}

function renderOpponentHand() {
    opponentHandEl.innerHTML = '';
    opponentHand.forEach((cardData, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card flipped';
        cardEl.innerHTML = `<div class="card-face card-back"></div><div class="card-face card-front"></div>`;
        cardEl.style.zIndex = index;
        opponentHandEl.appendChild(cardEl);
    });
}

function createCardElement(cardData, isFront=false) {
    const card = document.createElement('div');
    card.className = 'card';
    if(!isFront) card.classList.add('flipped');
    card.innerHTML = `
        <div class="card-face card-front">
            <div class="bug-icon">${cardData.bug.icon}</div>
            <div class="bug-name">${cardData.bug.name}</div>
        </div>
        <div class="card-face card-back"></div>
    `;
    return card;
}

function renderBugOptions() {
    bugOptionsEl.innerHTML = '';
    bugs.forEach(bug => {
        const btn = document.createElement('button');
        btn.className = 'bug-btn';
        btn.innerHTML = `<span class="icon">${bug.icon}</span><span class="name">${bug.name}</span>`;
        btn.onclick = () => playerDeclareCard(bug);
        bugOptionsEl.appendChild(btn);
    });
}

// Player Turn logic
function playCardFromPlayer(cardData, cardEl) {
    animateCardToTable(cardEl, () => {
        tableCard = { data: cardData, element: cardEl, sender: 'player' };
        playerHand = playerHand.filter(c => c.id !== cardData.id);
        updateUI();
        showModal(declareModalEl);
    });
}

function playerDeclareCard(bug) {
    declaredBug = bug;
    hideAllModals();
    opponentStatusEl.innerHTML = `상대방: <br>"음... ${bug.name}라고?"`;
    opponentStatusEl.classList.add('active');

    setTimeout(() => {
        const aiBelieves = Math.random() > 0.5;
        opponentStatusEl.textContent = aiBelieves ? '"진실이다!"' : '"거짓말!"';
        setTimeout(() => {
            resolvePlay(aiBelieves);
        }, 1500);
    }, 2000);
}

// Opponent Turn logic
function opponentPlay() {
    if(gameOver) return;
    const randomIndex = Math.floor(Math.random() * opponentHand.length);
    const cardData = opponentHand[randomIndex];
    
    // Pick visual card
    const cardEl = opponentHandEl.children[randomIndex];
    
    // Animate
    animateCardToTable(cardEl, () => {
        cardEl.innerHTML = `
            <div class="card-face card-front">
                <div class="bug-icon">${cardData.bug.icon}</div>
                <div class="bug-name">${cardData.bug.name}</div>
            </div>
            <div class="card-face card-back"></div>
        `;
        tableCard = { data: cardData, element: cardEl, sender: 'opponent' };
        opponentHand.splice(randomIndex, 1);
        updateUI();
        
        const isLying = Math.random() < 0.3;
        declaredBug = isLying ? getRandomBug() : cardData.bug;
        
        opponentStatusEl.innerHTML = `상대방: <br>"이것은 [${declaredBug.name}] 이다."`;
        opponentStatusEl.classList.add('active');
        
        guessPromptEl.textContent = `상대방: "이것은 [${declaredBug.name}] 입니다."`;
        showModal(guessModalEl);
    });
}

window.playerGuess = function(believes) {
    hideAllModals();
    resolvePlay(believes);
}

function animateCardToTable(cardEl, onComplete) {
    const rect = cardEl.getBoundingClientRect();
    const tableRect = tableSlotEl.getBoundingClientRect();

    cardEl.style.position = 'fixed';
    cardEl.style.left = rect.left + 'px';
    cardEl.style.top = rect.top + 'px';
    cardEl.classList.add('playing');
    cardEl.classList.add('flipped');
    
    document.body.appendChild(cardEl);

    setTimeout(() => {
        cardEl.style.left = tableRect.left + 'px';
        cardEl.style.top = tableRect.top + 'px';
    }, 50);

    setTimeout(() => {
        cardEl.style.position = 'absolute';
        cardEl.style.left = '0';
        cardEl.style.top = '0';
        cardEl.classList.remove('playing');
        cardEl.classList.add('on-table');
        tableSlotEl.appendChild(cardEl);
        onComplete();
    }, 600);
}

function resolvePlay(receiverBelieves) {
    tableCard.element.classList.add('revealed');
    
    const actualBug = tableCard.data.bug;
    const isTruth = actualBug.id === declaredBug.id;
    const receiverCorrect = receiverBelieves === isTruth;
    
    const sender = tableCard.sender;
    
    setTimeout(() => {
        if((sender === 'player' && !receiverCorrect) || (sender === 'opponent' && receiverCorrect)) {
            resultTitleEl.textContent = "🎉 나의 이득!";
        } else {
            resultTitleEl.textContent = "💀 상대방의 이득!";
        }
        
        let msg = `실제 카드는 [${actualBug.name}] 였습니다.<br><br>`;
        if(sender === 'player') {
            msg += `당신은 ${isTruth ? '진실을 말했고' : '거짓을 말했고'}, 상대는 ${receiverBelieves ? '믿었습니다.' : '의심했습니다.'}<br>`;
            msg += `결과: <b>${receiverCorrect ? '상대방이 맞췄으므로 당신(2장) 페널티 뽑기' : '상대방이 틀렸으므로 상대방(1장) 페널티 뽑기'}</b>`;
            if(receiverCorrect) playerHand.push(...generateHandArray(2));
            else opponentHand.push(...generateHandArray(1));
        } else {
            msg += `상대방은 ${isTruth ? '진실을 말했고' : '거짓을 말했고'}, 당신은 ${receiverBelieves ? '믿었습니다.' : '의심했습니다.'}<br>`;
            msg += `결과: <b>${receiverCorrect ? '당신이 맞췄으므로 상대방(2장) 페널티 뽑기' : '당신이 틀렸으므로 당신(1장) 페널티 뽑기'}</b>`;
            if(receiverCorrect) opponentHand.push(...generateHandArray(2));
            else playerHand.push(...generateHandArray(1));
        }
        
        resultMessageEl.innerHTML = msg;
        updateUI(); // update cards immediately before modal showing the new amount
        showModal(resultModalEl);
        opponentStatusEl.classList.remove('active');
    }, 800);
}

nextTurnBtn.onclick = () => {
    hideAllModals();
    tableSlotEl.innerHTML = '';
    tableCard = null;
    declaredBug = null;
    
    if(!checkGameOver()) {
        currentTurn = currentTurn === 'player' ? 'opponent' : 'player';
        updateUI();
        startTurn();
    }
};

function showModal(modalEl) {
    overlayEl.classList.remove('hidden');
    modalEl.classList.remove('hidden');
}

function hideAllModals() {
    overlayEl.classList.add('hidden');
    declareModalEl.classList.add('hidden');
    guessModalEl.classList.add('hidden');
    resultModalEl.classList.add('hidden');
    gameOverModalEl.classList.add('hidden');
}

initGame();
