// Configuration de base
const emojis = ['🍒', '🍇', '🍉', '🍋', '🍊', '7️⃣', '🔔', '🍓', '❤️'];
const slots = document.querySelectorAll('.slot');
const spinButton = document.getElementById('spin');
const resultDisplay = document.getElementById('result');
const balanceDisplay = document.getElementById('balance');
const betAmountInput = document.getElementById('betAmount');

let userBalance = 1000; // Solde initial

// Affiche le solde
function updateBalance() {
    fetch('/api/user/balance')
        .then(response => response.json())
        .then(data => {
            userBalance = data.balance;
            balanceDisplay.textContent = `Solde: ${userBalance}`;
        })
        .catch(error => console.error('Erreur lors de la récupération du solde:', error));
}

// Fonction pour vérifier les combinaisons gagnantes
function checkWin(results) {
    const [symbol1, symbol2, symbol3] = results;

    // Conditions de gains avec multiplicateurs
    if (symbol1 === '7️⃣' && symbol2 === '7️⃣' && symbol3 === '7️⃣') {
        return 10; // Jackpot
    } else if (symbol1 === symbol2 && symbol2 === symbol3) {
        return 5; // Big Win
    } else if ((symbol1 === '❤️' && symbol2 === '❤️') || (symbol1 === '🔔' && symbol2 === '🔔') ||
        (symbol2 === '❤️' && symbol3 === '❤️') || (symbol1 === '❤️' && symbol3 === '❤️')) {
        return 3; // Double Pair
    } else if (symbol1 === symbol2 || symbol2 === symbol3 || symbol1 === symbol3) {
        return 2; // Small Win
    } else {
        return 0; // Perte
    }
}

// Fonction pour faire tourner les rouleaux
spinButton.addEventListener('click', () => {
    const betAmount = parseInt(betAmountInput.value);

    // Vérifie si l'utilisateur a assez d'argent
    if (betAmount > userBalance) {
        alert("Vous n'avez pas assez d'argent pour parier ce montant !");
        return;
    }

    userBalance -= betAmount; // Déduit le montant du pari
    updateBalance(); // Met à jour le solde

    const results = [];

    // Désactiver le bouton pendant l'animation
    spinButton.disabled = true;

    // Démarre l'animation de spinning
    let animationDuration = 2000;
    let animationInterval = setInterval(() => {
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });
    }, 100);

    // Arrête l'animation et affiche les résultats réels
    setTimeout(() => {
        clearInterval(animationInterval);

        // Génère les résultats finaux des rouleaux
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            results.push(randomEmoji);
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });

        // Vérifie les gains
        const winMultiplier = checkWin(results);
        const score = {
            result: results.join(', '),
            win: winMultiplier > 0
        };

        // Calcule les gains
        if (winMultiplier > 0) {
            const winnings = betAmount * winMultiplier;
            userBalance += winnings;
            resultDisplay.textContent = `Bravo ! Vous avez gagné ${winnings} !`;
        } else {
            resultDisplay.textContent = `Désolé ! Vous avez perdu.`;
        }

        updateBalance(); // Met à jour le solde

        // Réactive le bouton après l'animation
        spinButton.disabled = false;

        // Enregistre le score
        saveScore(score);
    }, animationDuration);
});

// Mettre à jour le solde affiché en fonction de la base de données
function updateBalance() {
    fetch('/api/user/balance')
        .then(response => response.json())
        .then(data => {
            userBalance = data.balance;
            balanceDisplay.textContent = `Solde: ${userBalance}`;
        })
        .catch(error => console.error('Erreur lors de la récupération du solde:', error));
}

// Mettre à jour le solde dans la base de données
function updateServerBalance(newBalance) {
    fetch('/api/user/update-balance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ balance: newBalance })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erreur lors de la mise à jour du solde:', data.error);
            } else {
                userBalance = data.balance;
                balanceDisplay.textContent = `Solde: ${userBalance}`;
            }
        })
        .catch(error => console.error('Erreur lors de la mise à jour du solde:', error));
}

// Fonction pour faire tourner les rouleaux
spinButton.addEventListener('click', () => {
    const betAmount = parseInt(betAmountInput.value);

    if (betAmount > userBalance) {
        alert("Vous n'avez pas assez d'argent pour parier ce montant !");
        return;
    }

    userBalance -= betAmount;
    updateBalance();

    const results = [];

    spinButton.disabled = true;

    let animationDuration = 2000;
    let animationInterval = setInterval(() => {
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });
    }, 100);

    setTimeout(() => {
        clearInterval(animationInterval);

        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            results.push(randomEmoji);
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });

        const winMultiplier = checkWin(results);

        if (winMultiplier > 0) {
            const winnings = betAmount * winMultiplier;
            userBalance += winnings;

            resultDisplay.textContent = `Bravo ! Vous avez gagné ${winnings} !`;
        } else {
            userBalance -= betAmount;
            resultDisplay.textContent = `Désolé ! Vous avez perdu.`;
        }

        updateServerBalance(userBalance); // Envoie le nouveau solde au serveur

        spinButton.disabled = false;
    }, animationDuration);
});