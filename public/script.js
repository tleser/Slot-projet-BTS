// Configuration de base
const emojis = ['🍒', '🍇', '🍉', '🍋', '🍊', '7️⃣', '🔔', '🍓', '❤️'];
const slots = document.querySelectorAll('.slot');
const spinButton = document.getElementById('spin');
const resultMessage = document.getElementById('resultMessage'); // Nouveau conteneur pour les messages
const balanceDisplay = document.getElementById('balance');
const betAmountInput = document.getElementById('betAmount');
const betButtons = document.querySelectorAll('.bet-button'); // Boutons de mise fixe

let userBalance = 100; // Solde initial
let isSpinning = false; // Indicateur si les rouleaux tournent (pour éviter les clics multiples)

const SPIN_DELAY = 2000; // Temps d'attente avant de réactiver les boutons (en millisecondes)

// Fonction pour afficher le solde actuel
function updateBalanceDisplay() {
    balanceDisplay.textContent = `Solde: ${userBalance}`;
}

// Fonction pour mettre à jour le message de résultat
function updateResultMessage(message, isWin = false) {
    resultMessage.innerHTML = `
        <p style="color: ${isWin ? '#28a745' : '#dc3545'}; font-weight: bold;">
            ${message}
        </p>`;
}

// Fonction pour vérifier les combinaisons gagnantes et animer les symboles gagnants
function checkWin(grid) {
    let totalMultiplier = 0;
    let winningSymbols = []; // Stocke les symboles gagnants pour l'animation

    // Vérifier chaque ligne
    for (let i = 0; i < 3; i++) {
        const [symbol1, symbol2, symbol3] = grid[i];

        if (symbol1 === symbol2 && symbol2 === symbol3) {
            if (symbol1 === '7️⃣') {
                totalMultiplier += 10; // Jackpot (3x 7️⃣)
            } else {
                totalMultiplier += 5; // Big Win (3 symboles identiques)
            }
            winningSymbols.push([i, 0], [i, 1], [i, 2]); // Ajoute toute la ligne
        }
        else if ((symbol1 === symbol2)) {
            totalMultiplier += 2;
            winningSymbols.push([i, 0], [i, 1]); // Ajoute les deux symboles gagnants
        }
        else if ((symbol2 === symbol3)) {
            totalMultiplier += 2;
            winningSymbols.push([i, 1], [i, 2]); // Ajoute les deux symboles gagnants
        }
    }

    // Appliquer l'animation sur les symboles gagnants
    animateWinningSymbols(winningSymbols);

    return totalMultiplier;
}

// Fonction pour animer les symboles gagnants
function animateWinningSymbols(winningSymbols) {
    slots.forEach(slot => slot.classList.remove("win-animation")); // Supprime l'animation précédente

    setTimeout(() => {
        winningSymbols.forEach(([row, col]) => {
            const index = row * 3 + col; // Convertir les coordonnées en index 1D
            slots[index].classList.add("win-animation");
        });
    }, 100); // Légère pause avant d'ajouter l'effet
}

// Fonction principale pour faire tourner les rouleaux
function spinSlots(betAmount) {
    if (betAmount > userBalance) {
        alert("Vous n'avez pas assez d'argent pour parier ce montant !");
        return;
    }

    // Déduit la mise
    userBalance -= betAmount;
    updateBalanceDisplay();

    const results = [[], [], []]; // 3 lignes x 3 colonnes
    spinButton.disabled = true;

    // Animation des rouleaux
    let animationInterval = setInterval(() => {
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });
    }, 100);

    setTimeout(() => {
        clearInterval(animationInterval);

        // Génération des résultats finaux (3x3 grid)
        slots.forEach((slot, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            results[row][col] = randomEmoji;
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });

        // Vérification des gains sur toutes les lignes
        const winMultiplier = checkWin(results);
        if (winMultiplier > 0) {
            const winnings = betAmount * winMultiplier;
            userBalance += winnings;
            updateResultMessage(`🎉 GG ! Vous avez gagné ${winnings} !`, true);
        } else {
            updateResultMessage(`❌ Désolé ! Vous avez perdu.`);
        }

        // Mise à jour du solde côté serveur
        updateServerBalance(userBalance);

        // Réactiver le bouton
        spinButton.disabled = false;
    }, 2000);
}

// Mise à jour du solde côté serveur
function updateServerBalance(newBalance) {
    fetch('/api/user/update-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: newBalance }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erreur serveur:', data.error);
            } else {
                userBalance = data.balance;
                updateBalanceDisplay();
            }
        })
        .catch(error => console.error('Erreur réseau:', error));
}

// Gérer le bouton "SPIN" avec la mise saisie
spinButton.addEventListener('click', () => {
    const betAmount = parseInt(betAmountInput.value, 10);
    spinSlots(betAmount);
});

// Gérer les boutons de mise fixe
betButtons.forEach(button => {
    button.addEventListener('click', () => {
        const betAmount = parseInt(button.getAttribute('data-amount'), 10);
        if (isSpinning) return; // Empêche les clics multiples pendant l'animation
        isSpinning = true;
        spinSlots(betAmount);
        setTimeout(() => {
            isSpinning = false; // Permet à l'utilisateur de cliquer après le délai
        }, SPIN_DELAY); // Le délai de réactivation est le même que celui de l'animation
    });
});