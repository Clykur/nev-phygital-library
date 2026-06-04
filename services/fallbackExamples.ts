export const FALLBACK_EXAMPLES = [
  {
    id: "cassette-deck",
    name: "Retro Cassette Player",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sleek Retro Tape Deck</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background: linear-gradient(135deg, #18181b 0%, #09090b 100%);
            color: #fafafa;
            font-family: ui-sans-serif, system-ui, sans-serif;
        }
        @keyframes rotate-spindle {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinning {
            animation: rotate-spindle 2.5s linear infinite;
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <!-- Cassette Frame Outer -->
        <h2 class="text-xs uppercase font-mono tracking-widest text-blue-500 mb-3 text-center">TAPE SYNTHESIZER DX-7</h2>
        
        <!-- Inner Shell -->
        <div class="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
            
            <!-- Tape Label Area -->
            <input id="labelInput" type="text" value="Lofi Sunset Beats Vol 1" class="text-center bg-zinc-800 border-b border-zinc-700 text-sm font-mono text-amber-200 outline-none w-full py-1 rounded placeholder-zinc-600 mb-4 max-w-[280px]">

            <!-- Reels Box -->
            <div class="w-full h-24 bg-[#141416] border border-zinc-900 rounded-xl relative flex items-center justify-around overflow-hidden px-8">
                <!-- Center Window Glass reflections -->
                <div class="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/[0.1] pointer-events-none"></div>
                
                <!-- Spindle Left -->
                <div class="relative w-14 h-14 bg-zinc-900 border-2 border-zinc-800 rounded-full flex items-center justify-center">
                    <div id="spindleL" class="w-10 h-10 bg-zinc-800 border border-dashed border-zinc-600 rounded-full flex items-center justify-center">
                        <div class="w-4 h-4 bg-zinc-950 rounded"></div>
                    </div>
                </div>

                <!-- Central Tape Spool (Visible Magnetic Band representation) -->
                <div class="h-1 bg-amber-900/40 w-16 absolute left-1/2 -translate-x-1/2 bottom-8"></div>

                <!-- Spindle Right -->
                <div class="relative w-14 h-14 bg-zinc-900 border-2 border-zinc-800 rounded-full flex items-center justify-center">
                    <div id="spindleR" class="w-10 h-10 bg-zinc-800 border border-dashed border-zinc-600 rounded-full flex items-center justify-center">
                        <div class="w-4 h-4 bg-zinc-950 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Dynamic Track LCD -->
            <div class="w-full flex items-center justify-between mt-4 bg-black/40 p-2 rounded border border-zinc-800/40">
                <span class="text-[10px] uppercase font-mono text-zinc-500">Track 02</span>
                <span id="timestate" class="text-xs font-mono text-amber-500">00:00 / 04:20</span>
            </div>

            <!-- Real-Time Visualizer Wave blocks -->
            <div class="flex items-end gap-[3px] h-6 mt-3">
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 10%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 25%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 40%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 70%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 50%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 90%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 30%"></div>
                <div class="w-[6px] rounded-t bg-blue-500/30 dynamic-bar" style="height: 15%"></div>
            </div>
        </div>

        <!-- Sleek Buttons Rail -->
        <div class="grid grid-cols-5 gap-2 mt-6">
            <button onclick="playTape()" class="py-2 px-1 bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] tracking-wider uppercase rounded-xl transition shadow flex flex-col items-center justify-center text-white">
                <span>▶</span>
                <span class="text-[8px] opacity-70">Play</span>
            </button>
            <button onclick="pauseTape()" class="py-2 px-1 bg-amber-600 hover:bg-amber-500 font-bold text-[10px] tracking-wider uppercase rounded-xl transition shadow flex flex-col items-center justify-center text-white">
                <span>❚❚</span>
                <span class="text-[8px] opacity-70">Pause</span>
            </button>
            <button onclick="stopTape()" class="py-2 px-1 bg-red-600 hover:bg-red-500 font-bold text-[10px] tracking-wider uppercase rounded-xl transition shadow flex flex-col items-center justify-center text-white">
                <span>■</span>
                <span class="text-[8px] opacity-70">Stop</span>
            </button>
            <button onclick="rewindTape()" class="py-2 px-1 bg-zinc-800 hover:bg-zinc-700 font-bold text-[10px] tracking-wider uppercase rounded-xl transition shadow flex flex-col items-center justify-center text-white">
                <span>◀◀</span>
                <span class="text-[8px] opacity-70">Rew</span>
            </button>
            <button onclick="fastforwardTape()" class="py-2 px-1 bg-zinc-800 hover:bg-zinc-700 font-bold text-[10px] tracking-wider uppercase rounded-xl transition shadow flex flex-col items-center justify-center text-white">
                <span>▶▶</span>
                <span class="text-[8px] opacity-70">FFwd</span>
            </button>
        </div>
    </div>

    <script>
        let isTapePlaying = false;
        let playInterval;
        let secondsPassed = 0;

        function playTape() {
            if (isTapePlaying) return;
            isTapePlaying = true;
            document.getElementById('spindleL').classList.add('spinning');
            document.getElementById('spindleR').classList.add('spinning');
            
            playInterval = setInterval(() => {
                secondsPassed++;
                updateTimer();
                animateVisualizer();
            }, 1000);
        }

        function pauseTape() {
            clearInterval(playInterval);
            isTapePlaying = false;
            document.getElementById('spindleL').classList.remove('spinning');
            document.getElementById('spindleR').classList.remove('spinning');
        }

        function stopTape() {
            pauseTape();
            secondsPassed = 0;
            updateTimer();
            resetVisualizer();
        }

        function rewindTape() {
            pauseTape();
            secondsPassed = Math.max(0, secondsPassed - 10);
            updateTimer();
        }

        function fastforwardTape() {
            pauseTape();
            secondsPassed = Math.min(260, secondsPassed + 10);
            updateTimer();
        }

        function updateTimer() {
            const min = Math.floor(secondsPassed / 60);
            const sec = secondsPassed % 60;
            const formatted = \`\${String(min).padStart(2, '0')}:\${String(sec).padStart(2, '0')} / 04:20\`;
            document.getElementById('timestate').innerText = formatted;
        }

        function animateVisualizer() {
            const bars = document.querySelectorAll('.dynamic-bar');
            bars.forEach(bar => {
                const randHeight = Math.floor(Math.random() * 80) + 15;
                bar.style.height = \`\${randHeight}%\`;
                bar.style.backgroundColor = 'rgb(59, 130, 246)';
            });
        }

        function resetVisualizer() {
            const bars = document.querySelectorAll('.dynamic-bar');
            bars.forEach(bar => {
                bar.style.height = '10%';
                bar.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
            });
        }
    </script>
</body>
</html>`,
    timestamp: new Date()
  },
  {
    id: "chess-game",
    name: "Chess Game Sandbox",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retro Chess Sandbox</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: ui-sans-serif, system-ui, sans-serif;
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4">
    <div class="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <h1 class="text-2xl font-bold text-center text-indigo-400 mb-2">Chess Sandbox</h1>
        <p class="text-xs text-slate-400 text-center mb-6">A fully playable localized chess canvas</p>
        <!-- Board -->
        <div id="board" class="grid grid-cols-8 gap-0 border-2 border-slate-700 rounded overflow-hidden aspect-square w-full"></div>
        <!-- Status -->
        <div class="mt-4 flex justify-between items-center text-sm font-mono text-slate-300">
            <span id="turn">Turn: Whites ⚪</span>
            <button onclick="resetBoard()" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-semibold text-white">Reset</button>
        </div>
        <div id="logs" class="mt-4 text-xs font-mono text-slate-500 max-h-20 overflow-y-auto bg-slate-950 p-2 rounded border border-slate-800">
            Game started. Selected piece dragging is active.
        </div>
    </div>
    <script>
        const initialPieces = [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
        let boardState = JSON.parse(JSON.stringify(initialPieces));
        let selectedSquare = null;
        let isWhiteTurn = true;

        function updateLogs(msg) {
            const logs = document.getElementById('logs');
            logs.innerHTML += '<br>' + msg;
            logs.scrollTop = logs.scrollHeight;
        }

        function drawBoard() {
            const boardEl = document.getElementById('board');
            boardEl.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const cell = document.createElement('div');
                    const isDark = (r + c) % 2 === 1;
                    cell.className = \`flex items-center justify-center text-3xl select-none cursor-pointer aspect-square \${
                        selectedSquare && selectedSquare.r === r && selectedSquare.c === c ? 'bg-amber-500/80 animate-pulse' :
                        isDark ? 'bg-slate-800 hover:bg-slate-700/80 text-white' : 'bg-slate-300 hover:bg-slate-200/80 text-slate-900'
                    }\`;
                    cell.innerText = boardState[r][c] || '';
                    cell.onclick = () => onCellClick(r, c);
                    boardEl.appendChild(cell);
                }
            }
            document.getElementById('turn').innerText = isWhiteTurn ? "Turn: Whites ⚪" : "Turn: Blacks ⚫";
        }

        function onCellClick(r, c) {
            const piece = boardState[r][c];
            if (selectedSquare) {
                if (selectedSquare.r === r && selectedSquare.c === c) {
                    selectedSquare = null;
                    drawBoard();
                    return;
                }
                const movedPiece = boardState[selectedSquare.r][selectedSquare.c];
                boardState[selectedSquare.r][selectedSquare.c] = '';
                boardState[r][c] = movedPiece;
                updateLogs(\`Moved: \${movedPiece} [\${selectedSquare.r},\${selectedSquare.c}] → [\${r},\${c}]\`);
                selectedSquare = null;
                isWhiteTurn = !isWhiteTurn;
                drawBoard();
            } else {
                if (piece) {
                    selectedSquare = { r, c };
                    drawBoard();
                }
            }
        }

        function resetBoard() {
            boardState = JSON.parse(JSON.stringify(initialPieces));
            selectedSquare = null;
            isWhiteTurn = true;
            updateLogs(\`Board pattern reset.\`);
            drawBoard();
        }

        drawBoard();
    </script>
</body>
</html>`,
    timestamp: new Date()
  },
  {
    id: "bento-hub",
    name: "Modern Bento Hub",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Bento Hub</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background-color: #0c0a09;
            color: #f5f5f4;
            font-family: ui-sans-serif, system-ui, sans-serif;
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 text-white">
    <div class="max-w-4xl w-full">
        <!-- Header -->
        <header class="mb-8 flex justify-between items-center border-b border-stone-800 pb-4">
            <div>
                <h1 class="text-3xl font-extrabold tracking-tight text-white mb-1">VibeCode Hub</h1>
                <p class="text-xs text-stone-500 font-mono">BENTO PORTFOLIO & DYNAMIC LOGS</p>
            </div>
            <div class="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-3 py-1 rounded-full">
                ● CORE_SERVER_ONLINE
            </div>
        </header>

        <!-- Search Input -->
        <div class="relative mb-6">
            <input id="searchInput" oninput="filterGrid()" type="text" placeholder="Type key term to query hub... (e.g. 'design', 'interactive')" class="w-full bg-stone-900 border border-stone-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-stone-600 transition tracking-wide text-stone-100 placeholder-stone-600">
        </div>

        <!-- Bento Grid Layout -->
        <div id="grid-container" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <!-- Box 1 -->
            <div class="md:col-span-2 bg-stone-900 rounded-2xl p-6 border border-stone-800 relative hover:border-stone-700 transition block text-stone-100" data-tags="design dynamic">
                <span class="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded border border-blue-500/20">Design Concept</span>
                <h3 class="text-lg font-bold mt-4 mb-2">Beautiful Spatial Bento Interfaces</h3>
                <p class="text-stone-400 text-sm leading-relaxed mb-4">Building high-fidelity grids with micro-interactions, dark aesthetic pairings, and flexible column spans.</p>
                <button onclick="sayHi('Grid System')" class="text-xs font-semibold text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded transition">Read More</button>
            </div>

            <!-- Box 2 (Mono Shell) -->
            <div class="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-stone-700 transition flex flex-col justify-between text-stone-100" data-tags="interactive mono">
                <div>
                    <span class="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20">Active VM</span>
                    <h3 class="text-lg font-bold mt-4 mb-2">Interactive Terminal</h3>
                    <div id="vm-screen" class="p-2 bg-black font-mono text-[10px] text-zinc-400 rounded h-24 overflow-y-auto border border-stone-800">
                        user@vibecode:~$ system readiness high
                    </div>
                </div>
                <div class="flex gap-2 mt-4 flex-wrap">
                    <button onclick="vmCmd('about')" class="px-2 py-1 bg-stone-800 hover:bg-stone-700 font-mono text-[10px] rounded text-stone-400 hover:text-white transition">About</button>
                    <button onclick="vmCmd('status')" class="px-2 py-1 bg-stone-800 hover:bg-stone-700 font-mono text-[10px] rounded text-stone-400 hover:text-white transition font-bold">Status</button>
                    <button onclick="vmCmd('clear')" class="px-2 py-1 bg-stone-800 hover:bg-stone-700 font-mono text-[10px] rounded text-stone-400 hover:text-white transition">Reset</button>
                </div>
            </div>

            <!-- Box 3 -->
            <div class="bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-stone-700 transition text-stone-100" data-tags="interactive">
                <span class="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded border border-indigo-500/20">Telemetry</span>
                <h3 class="text-lg font-bold mt-4 mb-2">Click Tracker</h3>
                <p class="text-stone-400 text-sm mb-4">Click below to generate high-entropy counters in the localized state.</p>
                <div class="flex items-center gap-4">
                    <button onclick="incrementClicks()" class="text-xs font-bold bg-white text-stone-950 px-3 py-2 rounded-xl hover:bg-stone-200 transition">Tap Tracker</button>
                    <span id="click-qty" class="text-lg font-mono font-bold text-zinc-100">0</span>
                </div>
            </div>

            <!-- Box 4 -->
            <div class="md:col-span-2 bg-stone-900 rounded-2xl p-6 border border-stone-800 hover:border-stone-700 transition text-stone-100" data-tags="design coding">
                <span class="text-[10px] font-mono uppercase bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded border border-pink-500/20">Engineering Log</span>
                <h3 class="text-lg font-bold mt-4 mb-2">Refactoring Client State Structures</h3>
                <p class="text-stone-400 text-sm leading-relaxed mb-3">Exploring elegant fallback layers to render immersive mockups even when network calls are fully isolated or throttled in sandboxed preview contexts.</p>
                <div class="text-[10px] font-mono text-stone-500">TAGS: #client-fallback #offline-first</div>
            </div>
            
        </div>
    </div>

    <script>
        let counter = 0;
        function filterGrid() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const elements = document.querySelectorAll('#grid-container > div');
            elements.forEach(el => {
                const tags = el.getAttribute('data-tags') || '';
                const title = el.querySelector('h3') ? el.querySelector('h3').innerText.toLowerCase() : '';
                const desc = el.querySelector('p') ? el.querySelector('p').innerText.toLowerCase() : '';
                if (tags.includes(query) || title.includes(query) || desc.includes(query)) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            });
        }

        function incrementClicks() {
            counter++;
            document.getElementById('click-qty').innerText = counter;
        }

        function sayHi(context) {
            alert("Inside " + context + ": Full article viewer can be dynamically expanded using state logic!");
        }

        function vmCmd(type) {
            const screen = document.getElementById('vm-screen');
            if (type === 'about') {
                screen.innerHTML += '<br>user@vibecode:~$ VibeCode V2.1. Powered by reactive JS.';
            } else if (type === 'status') {
                screen.innerHTML += '<br>user@vibecode:~$ Status: Offline Sandbox 100% Operational.';
            } else if (type === 'clear') {
                screen.innerHTML = 'user@vibecode:~$ system readiness high';
            }
            screen.scrollTop = screen.scrollHeight;
        }
    </script>
</body>
</html>`,
    timestamp: new Date()
  }
];
