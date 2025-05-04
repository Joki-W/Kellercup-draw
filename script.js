document.addEventListener('DOMContentLoaded', () => {
    // --- Game Data & Config ---
    const CUP_OPTIONS = [
        { name: 'Final', german: 'Finale' }, // Use German name for display
        { name: 'Mini', german: 'Mini' },
        { name: 'Mikro', german: 'Mikro' },
        { name: 'Nano', german: 'Nano' },
        { name: 'Piko', german: 'Piko' }
    ];
    const DRAW_DATA_KEY = 'gameDrawData'; // Key for sessionStorage

    // --- DOM Elements ---
    const cupButtonsContainer = document.getElementById('cup-buttons-container');
    const startDrawButton = document.getElementById('start-draw-button');
    const errorArea = document.getElementById('error-area');

    // --- State ---
    let selectedCup = null;

    // --- Helper Functions ---
    function showError(message) {
        errorArea.textContent = message;
        errorArea.classList.remove('hidden');
    }
    function hideError() {
        errorArea.textContent = '';
        errorArea.classList.add('hidden');
    }

    // --- Core Drawing Logic ---
    function getPoolsForCup(cupType) {
        const BASE_POOL_1 = ["Waffenspiel", "Schneeball", "Super Smash Bros", "Elytren"];
        const BASE_POOL_2 = ["MP Minispiele", "Beat", "Square off", "Boccia", "Wii Bowling"];
        const BASE_POOL_3 = ["200ccm", "Dobble", "Hosn obi", "Ultimat Chicken Horse run"];

        const pool_1 = [...BASE_POOL_1];
        const pool_2 = [...BASE_POOL_2];
        const pool_3 = [...BASE_POOL_3];
        let fixed_games = ['Minigolf', '1 Dart', 'Party', '150ccm'];

        if (['Mini', 'Mikro', 'Final'].includes(cupType)) {
            pool_1.push('MC Kampf');
        }
        if (['Mini', 'Final'].includes(cupType)) {
            pool_2.push('2tes Darts');
        }
        if (cupType === 'Final') {
            const hosnObiIndex = pool_3.indexOf('Hosn obi');
            if (hosnObiIndex > -1) {
                pool_3.splice(hosnObiIndex, 1);
            }
            fixed_games.push('Hosn obi');
            const all_games = [...pool_1, ...pool_2, ...pool_3, 'Big Game'];
            return {
                type: 'final',
                all_potential_games: all_games,
                fixed_games: fixed_games
            };
        } else {
            return {
                type: 'pooled',
                pool_1: pool_1,
                pool_2: pool_2,
                pool_3: pool_3,
                fixed_games: fixed_games
            };
        }
    }
    function drawGames(cupType) {
        const BASE_DARTS = ['Around the Clock', '501'];
        const BASE_PRO_POOL = [1, 1, 1, 2, 2, 2, 3, 3, 3];
        const BIG_GAME = ['Siedler', 'Scrabble'];

        const cupData = getPoolsForCup(cupType);
        if (!cupData || !cupData.type) {
            console.error("Invalid data structure from getPoolsForCup");
            return null;
        }

        const drawnGamesResult = {
            cup_type: cupType,
            fixed_games: cupData.fixed_games || [],
            fixed_darts_game: getRandomElement(BASE_DARTS)
        };

        try {
            if (cupData.type === 'final') {
                const games_to_draw_count = 11;
                const potential_games = cupData.all_potential_games || [];
                drawnGamesResult.drawn_pool_games = sample(potential_games, games_to_draw_count);
                if (drawnGamesResult.drawn_pool_games.includes('Big Game')) {
                    drawnGamesResult.selected_big_game = getRandomElement(BIG_GAME);
                } else {
                    drawnGamesResult.selected_big_game = null;
                }
            } else {
                const pool_1 = cupData.pool_1 || [];
                const pool_2 = cupData.pool_2 || [];
                const pool_3 = cupData.pool_3 || [];
                // Inside the drawGames function, else block (non-Final cups)
                drawnGamesResult.original_pool_1 = pool_1; // Add original pool data
                drawnGamesResult.original_pool_2 = pool_2;
                drawnGamesResult.original_pool_3 = pool_3;
                const pro_pool_dist = [...BASE_PRO_POOL];
                const numSamples = (cupType === 'Mini') ? 4 : 3;
                const anzahlSamples = sample(pro_pool_dist, numSamples);
                let count_pool_1 = anzahlSamples.filter(p => p === 1).length + 1;
                let count_pool_2 = anzahlSamples.filter(p => p === 2).length + 1;
                let count_pool_3 = anzahlSamples.filter(p => p === 3).length + 1;
                count_pool_1 = Math.min(count_pool_1, pool_1.length);
                count_pool_2 = Math.min(count_pool_2, pool_2.length);
                count_pool_3 = Math.min(count_pool_3, pool_3.length);
                drawnGamesResult.drawn_pool_1 = sample(pool_1, count_pool_1);
                drawnGamesResult.drawn_pool_2 = sample(pool_2, count_pool_2);
                drawnGamesResult.drawn_pool_3 = sample(pool_3, count_pool_3);
            }
        } catch (err) {
            console.error("Error occurred during game drawing:", err);
            return null;
        }
        return drawnGamesResult;
    }
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    function sample(array, count) {
        if (count < 0) count = 0;
        const len = array ? array.length : 0;
        if (count > len) count = len;
        const shuffled = array ? [...array] : [];
        shuffleArray(shuffled);
        return shuffled.slice(0, count);
    }
    function getRandomElement(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    // --- UI Setup ---
    function createCupButtons() {
        cupButtonsContainer.innerHTML = ''; // Clear existing
        CUP_OPTIONS.forEach(cup => {
            const button = document.createElement('button');
            button.classList.add('cup-button');
            button.dataset.cup = cup.name; // Internal name stored in data attribute

            const textSpan = document.createElement('span');
            textSpan.textContent = cup.german; // Display German name
            button.appendChild(textSpan);

            button.addEventListener('click', handleCupSelection);
            cupButtonsContainer.appendChild(button);
        });
         console.log("Cup buttons created (German).");
    }

    function handleCupSelection(event) {
        hideError();
        const clickedButton = event.currentTarget;
        const cupName = clickedButton.dataset.cup; // Get internal name from data attribute

        cupButtonsContainer.querySelectorAll('.cup-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        clickedButton.classList.add('selected');

        selectedCup = cupName; // Store the internal English name for logic
        startDrawButton.disabled = false;
        startDrawButton.textContent = 'Präsentation starten'; // Ensure button text is correct
        console.log("Selected cup (internal):", selectedCup);
    }

    // --- Event Listeners ---
    startDrawButton.addEventListener('click', () => {
        if (!selectedCup) {
            showError("Bitte wähle zuerst einen Cup aus."); // German Error
            return;
        }

        console.log(`Starte Auslosung für: ${selectedCup}`);
        hideError();
        startDrawButton.disabled = true;
        startDrawButton.textContent = 'Lose aus...'; // German Text

        try {
            const drawResult = drawGames(selectedCup); // Use internal name for drawing logic

            if (!drawResult) {
                throw new Error("Auslosung fehlgeschlagen. Prüfe die Konsole."); // German Error
            }
            console.log("Draw Result:", drawResult);
            sessionStorage.setItem(DRAW_DATA_KEY, JSON.stringify(drawResult));
            window.location.href = 'presentation.html';

        } catch (error) {
            console.error("Error during draw or navigation:", error);
            showError(`Fehler: ${error.message}`); // German Error
            startDrawButton.disabled = false;
            startDrawButton.textContent = 'Präsentation starten'; // Reset text
        }
    });

    // --- Initial Setup ---
    createCupButtons();
    startDrawButton.textContent = 'Präsentation starten'; // Set initial button text

}); // End DOMContentLoaded