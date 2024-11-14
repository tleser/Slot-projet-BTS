const emojis = ['🍒', '🍇', '🍉', '🍋', '🍊', '7️⃣', '🔔', '🍓', '❤️'];
const slots = document.querySelectorAll('.slot');
const spinButton = document.getElementById('spin');
const resultDisplay = document.getElementById('result');
const balanceDisplay = document.getElementById('balance');
const betAmountInput = document.getElementById('betAmount');

let userBalance = 1000; // Solde initial

// Afficher le solde
function updateBalance() {
    fetch('/api/user/balance')
        .then(response => response.json())
        .then(data => {
            userBalance = data.balance;
            balanceDisplay.textContent = `Solde: ${userBalance}`;
        })
        .catch(error => console.error('Erreur lors de la récupération du solde:', error));
}

// Fonction pour faire tourner les rouleaux
spinButton.addEventListener('click', () => {
    const betAmount = parseInt(betAmountInput.value);

    // Vérifier si l'utilisateur a suffisamment d'argent
    if (betAmount > userBalance) {
        alert("Vous n'avez pas assez d'argent pour parier ce montant !");
        return;
    }

    userBalance -= betAmount; // Déduire le montant du pari du solde
    updateBalance(); // Mettre à jour l'affichage du solde

    const results = [];

    // Désactiver le bouton pendant l'animation
    spinButton.disabled = true;

    // Démarrer l'animation pour simuler le spinning
    let animationDuration = 2000; // Durée de l'animation en millisecondes (2 secondes)
    let animationInterval = setInterval(() => {
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });
    }, 100); // Changement des émojis toutes les 100 ms

    // Arrêter l'animation après 2 secondes et afficher les résultats réels
    setTimeout(() => {
        clearInterval(animationInterval); // Stopper l'animation

        // Générer les résultats finaux des rouleaux
        slots.forEach((slot) => {
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            results.push(randomEmoji);
            slot.innerHTML = `<span class="emoji">${randomEmoji}</span>`;
        });

        // Vérifier les gains
        const winMultiplier = checkWin(results);
        const score = {
            result: results.join(', '),
            win: winMultiplier > 0 // Vrai si un gain est trouvé
        };

        // Calculer le gain
        if (winMultiplier > 0) {
            const winnings = betAmount * winMultiplier; // L'utilisateur gagne
            userBalance += winnings; // Ajouter les gains au solde
            resultDisplay.textContent = `Bravo ! Vous avez gagné ${winnings} !`;
        } else {
            resultDisplay.textContent = `Désolé ! Vous avez perdu.`;
        }

        updateBalance(); // Mettre à jour le solde après le tour

        // Réactiver le bouton après l'animation
        spinButton.disabled = false;

        // Enregistrer le score
        saveScore(score);
    }, animationDuration); // Animation dure 2 secondes
});