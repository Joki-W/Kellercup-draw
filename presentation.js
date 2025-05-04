document.addEventListener('DOMContentLoaded', () => {
    // --- Config ---
    const DRAW_DATA_KEY = 'gameDrawData';

    // --- DOM Elements ---
    const presentationContainer = document.querySelector('.presentation-container');
    const presentationTitle = document.getElementById('presentation-title');
    const slideContent = document.getElementById('slide-content');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const closeButton = document.getElementById('close-presentation-button');

    // --- State ---
    let drawnData = null;
    let presentationSteps = [];
    let currentSlideIndex = -1;

    // Add CUP_OPTIONS here for German display name lookup in the main title
    const CUP_OPTIONS = [
        { name: 'Final', german: 'Finale' },
        { name: 'Mini', german: 'Mini' },
        { name: 'Mikro', german: 'Mikro' },
        { name: 'Nano', german: 'Nano' },
        { name: 'Piko', german: 'Piko' }
    ];

    // --- Helper: Generate Presentation Steps (Original Game Names/Titles) ---
     function generatePresentationSteps(data) {
        console.log("Generating presentation steps for:", data);
        const steps = [];
        if (!data || !data.cup_type) {
             console.error("Invalid data received for presentation steps.");
             return [{ type: 'error', title: 'Error', text: 'Could not load presentation data.' }]; // Keep error text generic or translate if needed
        }

        const isFinal = data.cup_type === 'Final';

        // Step 1: Title Slide (Keep German Intro Text)
        const cupDisplayName = CUP_OPTIONS.find(c => c.name === data.cup_type)?.german || data.cup_type;
        steps.push({
            type: 'title_slide',
            title: `${cupDisplayName} Cup Draw`, // Main title uses German Cup Name
            text: 'Mach dich bereit für die Spielenthüllung!' // Intro text can be German
        });

        // Step 2: Fixed Games (Original Title)
        const fixedGamesWithoutDarts = (data.fixed_games || []).filter(game => game !== '1 Dart');
        if (fixedGamesWithoutDarts.length > 0) {
            steps.push({
                type: 'fixed_games',
                title: 'Fixed Games', // Original Title
                games: fixedGamesWithoutDarts
            });
        }

        // Step 3: Reveal Darts Game (Original Title)
        if (data.fixed_darts_game) {
             steps.push({
                 type: 'reveal_darts',
                 title: 'Drawn Darts Game', // Original Title
                 darts: data.fixed_darts_game
             });
        }

         if (data.cup_type !== 'Final') {
             steps.push({
                 type: 'pool_overview',
                 title: 'Pool-Spieleübersicht', // German title
                 pools: {
                     pool1: data.original_pool_1,
                     pool2: data.original_pool_2,
                     pool3: data.original_pool_3
                 }
             });
         }

        // Step 4 onwards: Original logic for pools/final (Original Titles)
        if (isFinal) {
             const drawnGames = data.drawn_pool_games || [];
             if (drawnGames.length > 0) {
                drawnGames.forEach((game, index) => {
                    steps.push({
                        type: 'reveal_final_game',
                        title: `Drawn Game ${index + 1}/${drawnGames.length}`, // Original Title
                        game: game, // Original Game Name
                        bigGameChoice: (game === 'Big Game') ? data.selected_big_game : null
                    });
                });
            } else {
                 steps.push({ type: 'message', title: 'Drawn Games', text: 'No games were drawn from the pools.' }); // Original Text
            }
        } else {
            const pool1Games = data.drawn_pool_1 || [];
            const pool2Games = data.drawn_pool_2 || [];
            const pool3Games = data.drawn_pool_3 || [];
            const counts = { pool1: pool1Games.length, pool2: pool2Games.length, pool3: pool3Games.length };
            const hasPoolGames = counts.pool1 > 0 || counts.pool2 > 0 || counts.pool3 > 0;

             if (hasPoolGames) {
                 steps.push({ type: 'pool_counts', title: 'Games Drawn per Pool', counts: counts }); // Original Title
                if (counts.pool1 > 0) steps.push({ type: 'reveal_pool', title: 'Pool 1 Games', pool: 1, games: pool1Games }); // Original Title
                if (counts.pool2 > 0) steps.push({ type: 'reveal_pool', title: 'Pool 2 Games', pool: 2, games: pool2Games }); // Original Title
                if (counts.pool3 > 0) steps.push({ type: 'reveal_pool', title: 'Pool 3 Games', pool: 3, games: pool3Games }); // Original Title
             } else {
                 steps.push({ type: 'message', title: 'Drawn Games', text: 'No additional games were drawn from the pools.' }); // Original Text
             }
        }
         steps.push({
             type: 'end',
             title: 'Draw Complete!', // Original Title
             text: 'Du kannst die Präsentation jetzt schließen.' // Keep German closing text
            });
        console.log("Generated steps:", steps);
        return steps;
    }

    // --- Helper: Display Slide Content (Uses original game names) ---
    function displaySlide(index) {
        if (!presentationSteps || index < 0 || index >= presentationSteps.length) {
            console.error("Invalid slide index or steps:", index, presentationSteps);
            return;
        }
        console.log(`Displaying slide ${index}`);
        currentSlideIndex = index;
        const step = presentationSteps[index];

        // Fade out content
        slideContent.classList.add('fade-out');

        setTimeout(() => {
            slideContent.innerHTML = ''; // Clear previous content

            const titleElement = document.createElement('h3');
            titleElement.textContent = step.title; // Use title from step object (now original)
            slideContent.appendChild(titleElement);

            const contentContainer = document.createElement('div');

            switch (step.type) {
                 case 'title_slide':
                 case 'message':
                 case 'end':
                 case 'error':
                    const pText = document.createElement('p');
                    pText.textContent = step.text || ''; // Use text from step object
                    if(step.type === 'error') pText.style.color = '#dc3545', pText.style.fontWeight = 'bold';
                    contentContainer.appendChild(pText);
                    break;

                case 'fixed_games':
                    const ulFixed = document.createElement('ul');
                    (step.games || []).forEach(game => {
                        const li = document.createElement('li');
                        li.textContent = game; // Display original game name
                        ulFixed.appendChild(li);
                    });
                     if (ulFixed.children.length === 0) {
                         contentContainer.appendChild(document.createElement('p')).textContent = "No other fixed games."; // Original Text
                     } else {
                         contentContainer.appendChild(ulFixed);
                     }
                    break;

                case 'reveal_darts':
                     const ulDarts = document.createElement('ul');
                     const liDarts = document.createElement('li');
                     liDarts.textContent = step.darts || 'N/A'; // Display original darts game name
                     liDarts.classList.add('darts-game-item');
                     ulDarts.appendChild(liDarts);
                     contentContainer.appendChild(ulDarts);
                     break;

                case 'pool_counts':
                    const ulCounts = document.createElement('ul');
                    const counts = step.counts || { pool1: 0, pool2: 0, pool3: 0 };
                    ['Pool 1', 'Pool 2', 'Pool 3'].forEach((poolName, i) => {
                        const count = counts[`pool${i + 1}`];
                        const li = document.createElement('li');
                        // Use original "Game/Games"
                        li.textContent = `${poolName}: ${count} ${count !== 1 ? 'Games' : 'Game'}`;
                        li.classList.add('pool-count-item');
                        ulCounts.appendChild(li);
                    });
                    contentContainer.appendChild(ulCounts);
                    break;

                case 'reveal_pool':
                    const ulPool = document.createElement('ul');
                    (step.games || []).forEach(game => {
                        const li = document.createElement('li');
                        li.textContent = game; // Display original game name
                        ulPool.appendChild(li);
                    });
                     if (ulPool.children.length === 0) {
                        contentContainer.appendChild(document.createElement('p')).textContent = "No games in this pool."; // Original Text
                     } else {
                        contentContainer.appendChild(ulPool);
                     }
                    break;

                case 'pool_overview':
                    const poolContainer = document.createElement('div');
                    poolContainer.classList.add('pool-overview-container'); // Add container class

                    const pools = [
                        { name: 'Pool 1', games: step.pools.pool1 },
                        { name: 'Pool 2', games: step.pools.pool2 },
                        { name: 'Pool 3', games: step.pools.pool3 }
                    ];

                    pools.forEach(pool => {
                        const poolColumn = document.createElement('div');
                        poolColumn.classList.add('pool-column');

                        const poolHeading = document.createElement('h4');
                        poolHeading.textContent = `${pool.name} Spiele`;
                        poolHeading.style.marginTop = '0';
                        poolColumn.appendChild(poolHeading);

                        const ul = document.createElement('ul');
                        ul.style.paddingLeft = '1.2rem'; // Reduce default padding
                        pool.games.forEach(game => {
                            const li = document.createElement('li');
                            li.textContent = game;
                            li.style.fontSize = '1.1rem';
                            li.style.marginBottom = '0.5rem';
                            ul.appendChild(li);
                        });

                        poolColumn.appendChild(ul);
                        poolContainer.appendChild(poolColumn);
                    });

                    contentContainer.appendChild(poolContainer);
                    break;

                case 'reveal_final_game':
                    const ulFinal = document.createElement('ul');
                    const liFinal = document.createElement('li');
                    liFinal.textContent = step.game; // Display original game name
                    ulFinal.appendChild(liFinal);
                    contentContainer.appendChild(ulFinal);
                    if (step.bigGameChoice) {
                        const bigGameDiv = document.createElement('div');
                        bigGameDiv.classList.add('big-game-reveal');
                        bigGameDiv.textContent = `Big Game: ${step.bigGameChoice}`; // Original Text
                        contentContainer.appendChild(bigGameDiv);
                    }
                    break;

                default:
                    console.error("Unknown step type:", step.type);
                    contentContainer.appendChild(document.createElement('p')).textContent = "Error displaying slide content."; // Original Text
            }
            slideContent.appendChild(contentContainer);

            // Update button states & text (Keep German UI Text)
            prevButton.classList.toggle('visually-hidden', index <= 0);
            prevButton.classList.toggle('hidden', index <= 0);
            nextButton.disabled = (index >= presentationSteps.length - 1);
            nextButton.innerHTML = (step.type === 'end') ? 'Fertig' : 'Weiter <span class="arrow">&rarr;</span>';
            prevButton.innerHTML = '<span class="arrow">&larr;</span> Zurück';

            // Fade in new content
            slideContent.classList.remove('fade-out');

        }, 200); // Match CSS fade duration
    }

    // --- Navigation ---
    function nextSlide() {
        if (currentSlideIndex < presentationSteps.length - 1) {
            displaySlide(currentSlideIndex + 1);
        }
    }
    function prevSlide() {
         if (currentSlideIndex > 0) {
             displaySlide(currentSlideIndex - 1);
         }
    }
    // --- FIX: Restore close functionality ---
    function closePresentation() {
        window.location.href = 'index.html'; // Navigate back
    }
    // --- End FIX ---

    // --- Initialization ---
    function initializePresentation() {
        try {
            const storedData = sessionStorage.getItem(DRAW_DATA_KEY);
            if (!storedData) {
                throw new Error("Keine Präsentationsdaten gefunden. Bitte starte auf der Auswahlseite."); // Keep German error
            }
            drawnData = JSON.parse(storedData);
            console.log("Retrieved data:", drawnData);

            if(!drawnData || typeof drawnData !== 'object' || !drawnData.cup_type) {
                throw new Error("Ungültiges Präsentationsdatenformat."); // Keep German error
            }

             // Use German cup name if available for the main title
            const cupDisplayName = CUP_OPTIONS.find(c => c.name === drawnData.cup_type)?.german || drawnData.cup_type;
             presentationTitle.textContent = `${cupDisplayName} Cup Auslosung`; // Set German title
             presentationSteps = generatePresentationSteps(drawnData); // Steps now have original titles/game names

             if(presentationSteps.length === 0 || (presentationSteps[0] && presentationSteps[0].type === 'error')) {
                 displaySlide(0);
                 prevButton.classList.add('hidden', 'visually-hidden');
                 nextButton.classList.add('hidden');
             } else {
                 displaySlide(0);
             }

        } catch (error) {
            console.error("Initialization failed:", error);
             // Keep German error display
            slideContent.innerHTML = `<h3>Fehler</h3><p style="color: #dc3545; font-weight: bold;">${error.message || 'Präsentation konnte nicht geladen werden.'}</p><p>Bitte kehre zur Auswahlseite zurück.</p>`;
            presentationTitle.textContent = "Fehler";
            prevButton.classList.add('hidden', 'visually-hidden');
            nextButton.classList.add('hidden');
        }
    }

    // --- Event Listeners ---
    prevButton.addEventListener('click', prevSlide);
    nextButton.addEventListener('click', nextSlide);
    closeButton.addEventListener('click', closePresentation); // Ensure this uses the fixed function

     document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closePresentation(); }
    });
     document.addEventListener('keydown', (event) => {
        if(document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (event.key === 'ArrowRight' && !nextButton.disabled) { nextSlide(); }
        else if (event.key === 'ArrowLeft' && !prevButton.classList.contains('hidden')) { prevSlide(); }
    });

    // --- Start ---
    initializePresentation();

}); // End DOMContentLoaded