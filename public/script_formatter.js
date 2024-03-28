var typingTimer;

var undoStack = [];
var redoStack = [];
let undoCursorPositionsStack = [];
var redoCursorPositionsStack = [];
var maxStackSize = 100;


document.addEventListener('DOMContentLoaded', function () {
    var returnArrow = document.getElementById('return_arrow');
    var lyricsBox = document.getElementById('lyrics_box');
    var textArea = document.getElementById('editor');
    var textarea = document.querySelector('.editor');
    const selector = document.querySelector('.language_selector');
    const selectedLanguage = document.querySelector('.selected_language');
    const languageList = document.querySelector('.language_list');
    const languageArrow = document.querySelector('.lang_expand_arrow');
    const langButtonContent = document.querySelector('.lang_selector_div');

    var miniMenu = document.getElementById("mini_menu");

    var ignoredContainers = []; // aqui ficam guardados temporariamente os IDs ignorados, ao limpar o texto, tocar em 'Copy' ou então ao tocar no botão de lixo, esse array será resetado


    // verificar parametro de autoplay
    var referrer = getParameterByName('referrer');
    if (referrer !== null) {
        referrerUrlValue = referrer;
        returnArrow.style.display = 'flex'
    }

    /* FUNÇÕES AO MENU DE AÇÕES */

    var undoButton = document.getElementById('undo_button');
    undoButton.addEventListener('click', undo); // undo

    var redoButton = document.getElementById('redo_button'); 
    redoButton.addEventListener('click', redo); // redo

    var resetButton = document.getElementById('reset_button');
    resetButton.addEventListener('click', resetTranscription); // reset

    var copyButton = document.getElementById('copy_button');
    copyButton.addEventListener('click', copyToClipboard); // copy

    var pasteButton = document.getElementById('paste_button');
    pasteButton.addEventListener('click', pasteFromClipboard); // paste

    var refreshButton = document.getElementById('refresh_button');
    refreshButton.addEventListener('click', handleRefreshButtonClick); // refresh

    /* ****************************************** */

    var returnArrow = document.querySelector('#return_arrow');
    returnArrow.addEventListener('click', function() {
        // Verificar se referrerUrlValue começa com "http://" ou "https://"
        if (!referrerUrlValue.startsWith('http://') && !referrerUrlValue.startsWith('https://')) {
            // Se não começar com um protocolo, acrescente "http://" como padrão
            referrerUrlValue = 'http://' + referrerUrlValue;
        }
        window.location.replace(referrerUrlValue);
    });


    var lyricsBox = document.getElementById('lyrics_box');
    var textArea = document.getElementById('editor');

    lyricsBox.addEventListener('click', function() {
        textArea.focus();
    });

    // mantem o scroll na posição atual quando há input (para ele não subir ao topo)
    textarea.addEventListener("input", function() {
        // salva a posição atual do scroll
        var scrollTop = textarea.scrollTop;
        var scrollLeft = textarea.scrollLeft;
    
        // restaura a posição do scroll
        textarea.scrollTop = scrollTop;
        textarea.scrollLeft = scrollLeft;
        resetLineIssues()
    });

    textarea.addEventListener('input', function() {
        const content = editor.value;
        const cursorPosition = editor.selectionStart;
        updateCursorPosition(content, cursorPosition);
    });

    textarea.addEventListener('input', updateSidebar);
    textarea.addEventListener('input', checkContent);
    textarea.addEventListener('scroll', syncScroll);

    
    function checkContent() {

        const doneTypingInterval = 3000;
        const editor = document.getElementById('editor');
        const content = editor.value;

        addToUndoStack()
    
        const checkboxIds = [
            'copyTransferToggle',
            'pasteTransferToggle',
            'autoCapToggle',
            'autoFormatToggle',
            'autoSuggestion',
            'lfExportToggle',
            'localHostToggle'
        ];
    
        checkboxIds.forEach(function (checkboxId) {
            const checkbox = document.getElementById(checkboxId);
            localStorage.setItem(checkboxId, checkbox.checked);
        });

        checkTextarea()

    
        if (isAutoSuggestionsChecked()) {
            clearTimeout(typingTimer);

            typingTimer = setTimeout(autoSuggestion, doneTypingInterval);
        }
    }


    // Evento de clique no seletor de idiomas
    selector.addEventListener('click', function (event) {
        event.stopPropagation();

        if (languageList.style.display === 'block') {
            languageList.style.display = 'none';
            languageArrow.style.transform = "rotate(180deg)";
            langButtonContent.title = "Tap to edit the language";
        } else {
            languageList.style.display = 'block';
            languageArrow.style.transform = "rotate(0)";
            langButtonContent.title = "Tap to hide the list of supported languages";
            miniMenu.style.display = "none";
            
        }
    });

    // Adicione um evento de clique ao seletor de idioma
    languageList.addEventListener('click', function (e) {
        if (e.target.tagName === 'LI') {
            const selected = e.target.dataset.lang;
            selectedLanguage.textContent = getLanguageFullName(selected);
            languageList.style.display = 'none';

            // Armazene o idioma selecionado em cache
            localStorage.setItem('selectedLanguage', selected);
            addParamToURL('language', selected)
            updateSidebar() // resetar sugestões e caracteres
            ignoredContainers = []; // limpa a memória de alertas ignorados
        }
    });

    // Evento de clique em qualquer lugar no documento para ocultar a lista de idiomas
    document.addEventListener('click', function (event) {
        if (!selector.contains(event.target)) {
            languageList.style.display = 'none';
            languageArrow.style.transform = "rotate(180deg)";
            langButtonContent.title = "Tap to edit the language";
        }
    });

        // config inicial
        updateSidebar();
        setDefaultLanguage();
        setCheckboxStates();
        setMaxStackValue();
        loadDevMode();
        loadSpMenu();
        checkTrackIdParams();
        checkSpotifyParams();
        checkLTExportParams();
        fetchCreditsData();
        fetchServerInfo();
        checkMobileTestingParams();
        updateShortcutIcon();
        checkDeviceType();
        addToUndoStack(); // add o texto vazio como undo inicial

    
    // Adicione um evento de clique ao botão de cópia
    var copyButton = document.querySelector('.content_copy_btn');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            copyToClipboard();
            resetTranscription();
        });
    }
    
    var ignoreButtons = document.querySelectorAll('.content_ignore_btn');
    ignoreButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            ignoreButton(event.target);
        });
    });
    
    var fixButtons = document.querySelectorAll('.content_fix_btn');
    fixButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            fixButton(event.target);
        });
    });

    document.addEventListener('keydown', function (event) {

        var editor = document.getElementById('editor');
        var isEditorFocused = editor === document.activeElement;

        var numericKeys = ['7', '8', '9'];

        // verifica se a tecla pressionada está no numpad
        var isNumpadKey = (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD);

        if (numericKeys.includes(event.key) && isNumpadKey && !event.shiftKey) {
            event.preventDefault();
            switch (event.key) {
                case '7':
                    showFormatTab()
                    break;
                case '8':
                    handleRefreshButtonClick()
                    break;
                case '9':
                    showGrammarTab()
                    break;
                default:
                    // outras teclas (não são tratadas)
                    break;
            }

        } else if ((event.ctrlKey || event.metaKey) && event.key === '.') { // Ctrl/Cmd + .
            event.preventDefault();
            toggleTab()
        } else if ((event.ctrlKey || event.metaKey) && event.key === ',') { // Ctrl/Cmd + ,
            event.preventDefault();
            handleRefreshButtonClick()
        // tags
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'I' || event.key === 'i') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#INTRO");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'V' || event.key === 'v') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#VERSE");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'P' || event.key === 'p') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#PRE-CHORUS");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'C' || event.key === 'c') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#CHORUS");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'B' || event.key === 'b') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#BRIDGE");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'H' || event.key === 'h') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#HOOK");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'O' || event.key === 'o') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#OUTRO");
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'X' || event.key === 'x') && isEditorFocused) { 
            event.preventDefault();
            addTextToSelectedLine("#INSTRUMENTAL");
        

        } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === 'Z' || event.key === 'z')) { // desfazer
            event.preventDefault();
            undo();
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'Z' || event.key === 'z')) { // refazer
            event.preventDefault();
            redo();
        } else if ((event.ctrlKey || event.metaKey) && (event.key === 'C' || event.key === 'c') && !isEditorFocused) {
            event.preventDefault();
            copyToClipboard();
        } else if ((event.ctrlKey || event.metaKey) && (event.key === 'V' || event.key === 'v') && !isEditorFocused) {
            event.preventDefault();
            pasteFromClipboard();
        } else if ((event.ctrlKey || event.metaKey) && (event.key === 'X' || event.key === 'x') && !isEditorFocused) {
            event.preventDefault();
            resetTranscription();
        }
    });
});

/* FUNÇÕES PARA DESFAZER E REFAZER ALTERAÇÕES */

// Função para desfazer
function undo() {
    const editor = document.getElementById('editor');

    if (undoStack.length > 1) {
        const previousContent = undoStack.pop();
        redoStack.push(previousContent);

        const cursorPosition = undoCursorPositionsStack.pop();
        redoCursorPositionsStack.push(cursorPosition); // Salva a posição do cursor para refazer

        const newCursorPosition = Math.max(0, cursorPosition - 1); // Definir o cursor para uma posição anterior
        const content = undoStack[undoStack.length - 1]; // Obter o conteúdo desfeito diretamente do stack
        editor.value = content;
        editor.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    updateSidebar();
    updateTabCounters();
}

// função refazer ação
function redo() {
    const editor = document.getElementById('editor');

    if (redoStack.length > 0) { // executar apenas caso a pilha 'redoStack' tenha conteúdo
        // retirar o topo da 'redo'
        const nextContent = redoStack.pop(); 
        // definir o conteúdo do topo da 'redo' como topo da 'undo'
        undoStack.push(nextContent); 

        // retirar o topo da 'redoCursor'
        const nextCursorPosition = redoCursorPositionsStack.pop(); 
        // definir o conteúdo do topo da 'redoCursor' como topo da 'undoCursor'
        undoCursorPositionsStack.push(nextCursorPosition);

        // atualizar conteúdo e calcular nova posição do cursor
        const content = nextContent;
        editor.value = content;
        const redoCursorPosition = nextCursorPosition + (nextContent.length - content.length);

        // definir a posição do cursor após atualizar o conteúdo do editor
        editor.setSelectionRange(redoCursorPosition, redoCursorPosition);

        // atualizar a barra lateral
        updateSidebar();
        updateTabCounters();
    }
}

// Função para atualizar o conteúdo do editor e a posição do cursor
function updateCursorPosition() {
    const editor = document.getElementById('editor');
    const cursorPosition = editor.selectionStart;

    // Armazenar a posição do cursor
    undoCursorPositionsStack.push(cursorPosition);

    // Limpar o redoCursorPositionsStack porque estamos fazendo uma nova alteração
    redoCursorPositionsStack = [];

    // Atualizar a barra lateral
    updateSidebar();
}

// Essa função adiciona a transcrição atual e a posição do cursor às pilhas do undo
function addToUndoStack() {
    let editor = document.getElementById('editor');
    let value = editor.value;
    let cursorPosition = editor.selectionStart; // Captura a posição do cursor
    undoStack.push(value); // Adiciona valor à pilha do undo
    undoCursorPositionsStack.push(cursorPosition); // Adiciona posição do cursor à pilha de posições
    if (undoStack.length > maxStackSize) {
        undoStack.shift(); // Remove o item mais antigo da pilha de transcrição
        undoCursorPositionsStack.shift(); // Remove a posição do cursor correspondente
    }
    redoStack = []; // Limpa a pilha de refazer
    redoCursorPositionsStack = []; // Limpa a pilha de refazer
    updateTabCounters();
}


/* ****************************************** */

/* FUNÇÃO PRA ADICIONAR TEXTO NO EDITOR (COM BASE NO CURSOR) */

        function addTextToSelectedLine(text) {
            const editor = document.getElementById('editor');
            const cursorPosition = editor.selectionStart; // Obtém a posição atual do cursor
            const currentText = editor.value;

            // Dividir o texto em linhas
            const lines = currentText.split('\n');

            // Encontrar a linha onde o cursor está
            let lineStart = 0;
            let lineEnd = 0;
            let lineIndex = -1; // Índice da linha onde o cursor está
            for (let i = 0; i < lines.length; i++) {
                lineEnd = lineStart + lines[i].length;
                if (cursorPosition >= lineStart && cursorPosition <= lineEnd) {
                    // Adicionar o texto na linha onde o cursor está
                    lines[i] += text;
                    lineIndex = i; // Salva o índice da linha onde o cursor está
                    break;
                }
                lineStart = lineEnd + 1; // +1 para contar o caractere de nova linha (\n)
            }

            // Atualizar o valor do textarea com as linhas modificadas
            editor.value = lines.join('\n');

            // adiciona a edição no undo stack
            addToUndoStack()

            // Definir a nova posição do cursor
            if (lineIndex !== -1) {
                const newCursorPosition = cursorPosition + text.length;
                editor.setSelectionRange(newCursorPosition, newCursorPosition);
            }

            updateSidebar();
        }

/* ****************************************** */

/* DEFINIR IDIOMA PADRÃO */

        // Função para verificar e definir o idioma padrão ao carregar a página
        function setDefaultLanguage() {

            const selectedLanguage = document.querySelector('.selected_language');
            const storedLanguage = localStorage.getItem('selectedLanguage');
            const languageParam = getParameterByName('language');
            let languageToDisplay = null;

            if (languageParam) {
                languageToDisplay = getLanguageFullName(languageParam);
            } else if (storedLanguage) {
                languageToDisplay = getLanguageFullName(storedLanguage);
                addParamToURL('language', storedLanguage)
            }

            if (languageToDisplay) {
                selectedLanguage.textContent = languageToDisplay;
                localStorage.setItem('selectedLanguage', languageParam); // Corrigido: armazenar o idioma, não o elemento DOM
            } else {
                selectedLanguage.textContent = 'Select Language';
                if (storedLanguage) {
                    localStorage.removeItem('selectedLanguage');
                }
            }
        }

        // Função para obter o nome completo do idioma com base no código
        function getLanguageFullName(code) {
            const languageMap = {
                'en-AU': 'English (Australian)',
                'en-CA': 'English (Canadian)',
                'en-NZ': 'English (New Zealand)',
                'en-GB': 'English (UK)',
                'en-US': 'English (US)',
                'nl': 'Dutch',
                'fr': 'French',
                'fr-CA': 'French (Canada)',
                'de-AT': 'German (Austria)',
                'de-DE': 'German (Germany)',
                'de-CH': 'German (Swiss)',
                'it': 'Italian',
                'pt-BR': 'Portuguese (BR)',
                'pt-PT': 'Portuguese (PT)',
                'es': 'Spanish',
            };

            return languageMap[code];
        }

/* ****************************************** */

/* CARREGAR SUGESTÕES DE FORMATO */

        // Add this function to your existing code
        function handleRefreshButtonClick() {
            var refreshButton = document.getElementById('refresh_button');
            var loadingSpinner = document.getElementById('loading_spinner');
            var textArea = document.getElementById('editor');
            var autoFormatToggle = document.getElementById('autoFormatToggle');
            var selectedLanguageCode = getParameterByName('language')
            const cursorPosition = editor.selectionStart; // Obtém a posição atual do cursor

            if (textArea.value === '') {
                fetchCurrentlyPlayingData();
                notification("The editor is empty, there's nothing to be checked here");
                return;
            }

            // Obter número da linha onde estava o cursor
            var cursorLine = textArea.value.substr(0, cursorPosition).split("\n").length;

            // EXECUTAR AUTO FORMAT
            if (autoFormatToggle.checked) {

                if (selectedLanguageCode === 'pt-BR' || selectedLanguageCode === 'pt-PT') {
                    replaceX();
                }

                if (selectedLanguageCode === 'pt-BR' || selectedLanguageCode === 'pt-PT'|| 
                selectedLanguageCode === 'en-US' || selectedLanguageCode === 'en-GB'|| 
                selectedLanguageCode === 'es' || selectedLanguageCode === 'it'||
                selectedLanguageCode === 'fr') {
                    fixPunctuation1();
                }

                replaceSpecialTags(); // auto replace tags
                trimEditorContent(); // linhas antes ou depois da letra (1)
                removeExcessInstrumental(); // remove tags instrumentais duplicadas
                removeInstrumentalStardEnd(); // remove instrumentais no início/fim da letra
                addSpaceAboveTags(); // add (caso não haja) espaços acima de todas as tags
                removeSpacesAroundInstrumental(); // espaços ao redor de tags instrumentais
                trimEditorContent(); // linhas antes ou depois da letra (2)
                autoTrim(); // espaços extras no início ou fim 
                removeDuplicateSpaces(); // espaços duplos entre palavras
                removeDuplicateEmptyLines(); // linhas vazias duplicadas entre estrofes
            }

            // Encontre o índice do início da próxima linha
            var nextLineIndex = textArea.value.indexOf("\n", cursorPosition);
            if (nextLineIndex === -1) {
                nextLineIndex = textArea.value.length; // Se for a última linha, vá até o final do texto
            }
            // Defina a posição do cursor para o final da linha onde estava o cursor antes da formatação automática
            textArea.setSelectionRange(nextLineIndex, nextLineIndex);

            updateSidebar();
            resetLineIssues();
            clearTimeout(typingTimer); // auto 3s
            fetchCurrentlyPlayingData();
            checkLanguage();
            

            // Get references to the elements
            // Hide the refresh button and show the loading spinner
            refreshButton.style.display = 'none';
            loadingSpinner.style.display = 'block';

            // Check if a language is selected
            if (!selectedLanguageCode) {
                notification('Please select a language to start.', 'info');
                // Show the refresh button and hide the loading spinner
                refreshButton.style.display = 'block';
                loadingSpinner.style.display = 'none';
                return;
            }

            // Prepare the data to send to the API
            var requestData = {
                text: textArea.value,
            };

            // Obter o valor de localHostToggle do localStorage
            const localHostToggle = localStorage.getItem('localHostToggle');

            // Verificar o valor de localHostToggle e definir window.serverPath
            if (localHostToggle === 'true') {
                window.serverPath = 'http://localhost:3000'; 
            } else {
                window.serverPath = 'https://datamatch-backend.onrender.com';
            }

            fetch(`${window.serverPath}/formatter/${selectedLanguageCode}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 404) {
                            // Show notification for language not selected
                            notification("An error occurred, please select the language again");
                            localStorage.removeItem('selectedLanguage');
                            document.querySelector('.selected_language').textContent = 'Select Language';
                        } else {
                            // Handle other errors here
                            console.error('Error with API request. Status:', response.status);
                            errorPlaceholder("We are experiencing internal issues, please try again later.", 'format_containers');
                        }
                        updateTabCounters()
                    }
                    return response.json();
                })
                .then(data => {
                    // Handle the API response here
                    // Remove existing HTML elements inside the format_containers
                    const formatContainer = document.getElementById('format_containers');
                    formatContainer.innerHTML = '';
            
                    if (data.result.issues === false) {
                        checkFormatPlaceholder();
                    } else {
                        // add os containers na box "format_containers"
                        for (const alertaKey in data.result.containers.alerts) {
                            const alerta = data.result.containers.alerts[alertaKey];
                            const container = createContainer(alerta.container);
                            
                            // verifica se o container recebido não é null antes de adicioná-lo
                            if (container !== null) {
                                formatContainer.appendChild(container);
                            }
                        }
                        checkFormatPlaceholder();
                    }
                    updateTabCounters()

                })
                .catch(error => {
                    updateTabCounters()
                    // Handle errors here
                    const formatContainer = document.getElementById('format_containers');
                    formatContainer.innerHTML = '';

                    console.error('Error sending data to API:', error);
                    errorPlaceholder("Something went wrong, please try again in a few seconds.", 'format_containers');
                })
                .finally(() => {
                    updateTabCounters()
                    // Show the refresh button and hide the loading spinner after the request is complete
                    refreshButton.style.display = 'block';
                    loadingSpinner.style.display = 'none';
                });
        }

/* ****************************************** */

/* SELECIONAR TEXTO COM BASE NO OFFSET E LENGTH */

        function selectText(offset, length) {
            var textArea = document.getElementById('editor'); // Substitua 'seuTextAreaId' pelo ID do seu textarea

            // Selecionar todo o texto no textarea
            textArea.select();

            // Desfazer a seleção para que possamos selecionar apenas as linhas desejadas
            document.execCommand('unselect', false, null);

            var text = textArea.value;

            // Validar offset e length para garantir que não ultrapassem os limites do texto
            if (offset < 0) {
                offset = 0;
            }
            if (length < 0) {
                length = 0;
            }
            if (offset + length > text.length) {
                length = text.length - offset;
            }

            // Selecionar o texto no textarea usando offset e length
            textArea.setSelectionRange(offset, offset + length);

        }

/* ****************************************** */

/* EXIBIR OU OCULTAR OS BOTÕES SUPERIORES DO IMPROVEMENTS CONTAINER */

        function hideOptionsAndButtons() {
            const improvementsPlaceholder1 = document.getElementById('improvements_placeholder1');
            const improvementsPlaceholder2 = document.getElementById('improvements_placeholder2');

            improvementsPlaceholder1.textContent = 'Type something or paste your current transcription to check the format...';
            improvementsPlaceholder2.textContent = 'Type something or paste your current transcription to check the grammar...';
            improvementsPlaceholder1.onclick = '';
            improvementsPlaceholder2.onclick = '';
            updateTabCounters()
        }

        function showOptionsAndButtons() {
            const improvementsPlaceholder1 = document.getElementById('improvements_placeholder1');
            const improvementsPlaceholder2 = document.getElementById('improvements_placeholder2');

            improvementsPlaceholder1.innerHTML = 'Tap the <span class="highlight_text">Refresh</span> icon to update the format suggestions.';
            improvementsPlaceholder2.innerHTML = 'Tap the <span class="highlight_text">Refresh</span> icon to update the grammar suggestions.';
            updateTabCounters()
        }

        function checkTextarea() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            if (content.trim() === '') {
                clearTimeout(typingTimer);
                hideOptionsAndButtons();
            } else {
                showOptionsAndButtons();
                if (isAutoCapChecked()) {
                    autoCap();
                }
            }
        }

/* ****************************************** */

/* FUNÇÕES TRUE/FALSE PARA VERIFICAR SE TOGGLES ESTÃO ATIVADOS */

        function isCopyTransferTottleChecked() {
            const copyTransferToggle = document.getElementById('copyTransferToggle');
            return copyTransferToggle.checked;
        }

        function isPasteTransferTottleChecked() {
            const pasteTransferToggle = document.getElementById('pasteTransferToggle');
            return pasteTransferToggle.checked;
        }

        function isAutoCapChecked() {
            const autoCapToggle = document.getElementById('autoCapToggle');
            return autoCapToggle.checked;
        }

        function isAutoFormatChecked() {
            const autoFormatToggle = document.getElementById('autoFormatToggle');
            return autoFormatToggle.checked;
        }
        
        function isAutoSuggestionsChecked() {
            const autoSuggestions = document.getElementById('autoSuggestion');
            return autoSuggestions.checked;
        }

        function isLfExportToggleChecked() {
            const lfExportToggle = document.getElementById('lfExportToggle');
            return lfExportToggle.checked;
        }

        function isLocalHostChecked() {
            const localHostToggle = document.getElementById('localHostToggle');
            return localHostToggle.checked;
        }

/* ****************************************** */

/* FUNÇÕES DE FORMATO DO MENU SETTINGS */

        function autoCap() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // salvar a posição do cursor
            var startPos = editor.selectionStart;
            var endPos = editor.selectionEnd;

            // separa a letra em linhas
            var lines = content.split('\n');

            // capitaliza a primeira letra de cada linha
            for (var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].charAt(0).toUpperCase() + lines[i].slice(1);
            }

            // reune as linhas novamente
            content = lines.join('\n');

            // atualiza o editor
            editor.value = content;

            // restaura a posição do cursor
            editor.setSelectionRange(startPos, endPos);
        }

        function removeInstrumentalStardEnd() {
            var editor = document.getElementById('editor');
            var content = editor.value;
        
            // salvar a posição do cursor
            var startPos = editor.selectionStart;
            var endPos = editor.selectionEnd;
        
            // separa as linhas
            var lines = content.split('\n');
        
            // verifica se a primeira linha contém '#INSTRUMENTAL'
            if (lines[0].trim() === '#INSTRUMENTAL') {
                lines.shift(); // remove a primeira linha
            }
        
            // verifica se a última linha contém '#INSTRUMENTAL'
            if (lines[lines.length - 1].trim() === '#INSTRUMENTAL') {
                lines.pop(); // remove a última linha
            }
        
            // reune as linhas novamente
            content = lines.join('\n');
        
            // atualiza o editor
            editor.value = content;
        
            // restaura a posição do cursor
            editor.setSelectionRange(startPos, endPos);
        }

        function removeExcessInstrumental() {
            var editor = document.getElementById('editor');
            var content = editor.value;
        
            // salvar a posição do cursor
            var startPos = editor.selectionStart;
            var endPos = editor.selectionEnd;
        
            // separa as linhas
            var lines = content.split('\n');
        
            var cleanedLines = [];
            var prevLineWasInstrumental = false;
        
            // percorre todas as linhas
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
        
                // verifica se a linha atual é '#INSTRUMENTAL'
                if (line === '#INSTRUMENTAL') {
                    // verifica se a linha anterior também era '#INSTRUMENTAL'
                    if (!prevLineWasInstrumental) {
                        cleanedLines.push(line);
                        prevLineWasInstrumental = true;
                    }
                } else {
                    cleanedLines.push(line);
                    prevLineWasInstrumental = false;
                }
            }
        
            // reune as linhas novamente
            content = cleanedLines.join('\n');
        
            // atualiza o editor
            editor.value = content;
        
            // restaura a posição do cursor
            editor.setSelectionRange(startPos, endPos);
        }

        function autoTrim() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Split the content into lines
            var lines = content.split('\n');

            // Trim extra spaces at the beginning and end of each line
            for (var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].trim();
            }

            // Join the lines back together
            content = lines.join('\n');

            // Update the editor's content
            editor.value = content;
        }


        function removeDuplicateSpaces() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Dividir o conteúdo em linhas
            var lines = content.split('\n');

            // Iterar sobre cada linha e substituir espaços duplicados por um único espaço
            for (var i = 0; i < lines.length; i++) {
                lines[i] = lines[i].replace(/\s+/g, ' ');
            }

            // Juntar as linhas de volta
            content = lines.join('\n');

            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function removeDuplicateEmptyLines() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Dividir o conteúdo em linhas
            var lines = content.split('\n');

            // Filtrar linhas não vazias e adicionar uma linha vazia no final
            lines = lines.filter(function(line, index, self) {
                return line.trim() !== '' || index === self.length - 1 || line.trim() !== self[index + 1].trim();
            });

            // Juntar as linhas de volta
            content = lines.join('\n');

            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function replaceSpecialTags() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // substituir atalhos
            content = content.replace(/#i\s*\/?(?=\n|$)/ig, '#INTRO');
            content = content.replace(/#v\s*\/?(?=\n|$)/ig, '#VERSE');
            content = content.replace(/#p\s*\/?(?=\n|$)/ig, '#PRE-CHORUS');
            content = content.replace(/#c\s*\/?(?=\n|$)/ig, '#CHORUS');
            content = content.replace(/#b\s*\/?(?=\n|$)/ig, '#BRIDGE');
            content = content.replace(/#h\s*\/?(?=\n|$)/ig, '#HOOK');
            content = content.replace(/#o\s*\/?(?=\n|$)/ig, '#OUTRO');
            content = content.replace(/##\s*\/?(?=\n|$)/ig, '#INSTRUMENTAL');

            // capitalizar tags
            content = content.replace(/#intro\s*\/?(?=\n|$)/ig, '#INTRO');
            content = content.replace(/#verse\s*\/?(?=\n|$)/ig, '#VERSE');
            content = content.replace(/#pre-chorus\s*\/?(?=\n|$)/ig, '#PRE-CHORUS');
            content = content.replace(/#chorus\s*\/?(?=\n|$)/ig, '#CHORUS');
            content = content.replace(/#bridge\s*\/?(?=\n|$)/ig, '#BRIDGE');
            content = content.replace(/#hook\s*\/?(?=\n|$)/ig, '#HOOK');
            content = content.replace(/#outro\s*\/?(?=\n|$)/ig, '#OUTRO');
            content = content.replace(/#instrumental\s*\/?(?=\n|$)/ig, '#INSTRUMENTAL');

            // substituir linhas como 'intro' pela tag (website)
            content = content.replace(/^verse\s*\/?(?=\n|$)/igm, '#VERSE');
            content = content.replace(/^intro\s*\/?(?=\n|$)/igm, '#INTRO');
            content = content.replace(/^pre-chorus\s*\/?(?=\n|$)/igm, '#PRE-CHORUS');
            content = content.replace(/^chorus\s*\/?(?=\n|$)/igm, '#CHORUS');
            content = content.replace(/^bridge\s*\/?(?=\n|$)/igm, '#BRIDGE');
            content = content.replace(/^hook\s*\/?(?=\n|$)/igm, '#HOOK');
            content = content.replace(/^outro\s*\/?(?=\n|$)/igm, '#OUTRO');


            // substituir linhas como 'Intro' pela tag (website) - autocap ativado
            content = content.replace(/^Verse\s*\/?(?=\n|$)/igm, '#VERSE');
            content = content.replace(/^Intro\s*\/?(?=\n|$)/igm, '#INTRO');
            content = content.replace(/^Pre-chorus\s*\/?(?=\n|$)/igm, '#PRE-CHORUS');
            content = content.replace(/^Chorus\s*\/?(?=\n|$)/igm, '#CHORUS');
            content = content.replace(/^Bridge\s*\/?(?=\n|$)/igm, '#BRIDGE');
            content = content.replace(/^Hook\s*\/?(?=\n|$)/igm, '#HOOK');
            content = content.replace(/^Outro\s*\/?(?=\n|$)/igm, '#OUTRO');
            

            // atualiza o conteúdo
            editor.value = content;
        }

        function addSpaceAboveTags() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Adicionar espaço acima das tags de estrofes se não existir
            content = content.replace(/\n*(#INTRO|#VERSE|#PRE-CHORUS|#CHORUS|#BRIDGE|#HOOK|#OUTRO)/ig, '\n\n$1');

            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function trimEditorContent() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Remover linhas em branco no início do conteúdo
            content = content.replace(/^\s+/, '');

            // Remover linhas em branco no final do conteúdo
            content = content.replace(/\s+$/, '');

            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function removeSpacesAroundInstrumental() {
            var editor = document.getElementById('editor');
            var content = editor.value;

            // Remover espaços em branco abaixo das tags #INSTRUMENTAL
            content = content.replace(/#INSTRUMENTAL\s*\n+\s*/ig, '#INSTRUMENTAL\n');

            // Remover espaços em branco acima das tags #INSTRUMENTAL
            content = content.replace(/\s*\n+\s*#INSTRUMENTAL/ig, '\n#INSTRUMENTAL');

            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function autoSuggestion() {
            const editor = document.getElementById('editor');
            const content = editor.value;
        
            if (content.trim() === '') {
                return;
            } else {
                handleRefreshButtonClick();
            }
        }

        // corretor padrão
        function fixPunctuation1() {
            var editor = document.getElementById('editor');
            var content = editor.value;
        
            content = content.replace(/([:;,?!])(?=[^\s"])/g, '$1 '); // Adiciona espaço após outras pontuações
            content = content.replace(/\((\s+)/g, '('); // Remove espaço após '('
            content = content.replace(/¿\s+/g, '¿'); // Remove espaço após '¿'
            content = content.replace(/¡\s+/g, '¡'); // Remove espaço após '¡'
            content = content.replace(/([^"\s])((?:¿|¡))/g, '$1 $2'); // Adiciona espaço antes de '¿' e '¡' se não houver espaço ou " antes
            content = content.replace(/(?<!\")\(([^ \t])/g, ' ($1'); // Adiciona espaço antes de '(' se não houver espaço ou " antes
            content = content.replace(/(\s*)\)(?!\")/g, '$1) ');    // Remove espaço antes de ')' e adiciona espaço após ')' se não houver espaço ou " depois
            content = content.replace(/\s+([!?,:;\)])/g, '$1'); // Remove espaços antes de !?,:; e )
            
            // Atualizar o conteúdo do editor
            editor.value = content;
        }

        function replaceX() {
            var editor = document.getElementById('editor');
            var content = editor.value;
        
            // Substituir termos número + x + número por número + × + número
            content = content.replace(/(\d+)\s*x\s*(\d+)/gi, '$1×$2');
        
            // Atualizar o conteúdo do editor
            editor.value = content;
        }


/* ****************************************** */

/* NOTIFICAÇÕES TEMPORÁRIAS */

        function notification(customMessage) {
            const notification_div = document.getElementById("notification");
            const message = document.getElementById("notification-message");
            message.textContent = customMessage;
            notification_div.style.opacity = 1;
            notification_div.classList.remove("hidden");

            setTimeout(() => {
                notification_div.style.opacity = 0;
                setTimeout(() => {
                    notification_div.classList.add("hidden");
                }, 500);
            }, 4000); // Tempo de exibição
        };

/* ****************************************** */


/* FUNÇÃO PARA DAR UM 'REFRESH' NA BARRA LATERAL (caracteres e line issues) */

        function updateSidebar() {
            updateCharacterCounter();
            resetLineIssues();

            function resetLineIssues() {
                var textarea = document.getElementById('editor');
                var lineIssuesContainer = document.getElementById('line_issues');
            
                // Remova todas as linhas existentes antes de recriar
                lineIssuesContainer.innerHTML = '';
            
                var lines = textarea.value.split('\n');
                var lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
            
                for (var i = 0; i < lines.length; i++) {
                    var lineIssueContainer = document.createElement('div');
                    lineIssueContainer.id = 'L' + (i + 1) + '_container'; // Adicionado '_container' ao ID para distinguir das linhas
            
                    // Calcule a posição relativa dentro da div mãe
                    var topPosition = i * lineHeight;
            
                    // Defina o tamanho da div para coincidir com o tamanho da linha do textarea
                    lineIssueContainer.style.width = '100%';
                    lineIssueContainer.style.height = lineHeight + 'px';
            
                    // Defina a posição relativa dentro da div mãe
                    lineIssueContainer.style.top = topPosition + 'px';
            
                    // Adicione a div ao container de line_issues
                    lineIssuesContainer.appendChild(lineIssueContainer);
            
                    // Adicione as classes de estilo diretamente à div interna
                    var lineIssue = document.createElement('div');
                    lineIssue.className = 'status-1';
                    lineIssue.style.width = (1/3) * lineHeight + 'px';
                    lineIssue.style.height = (1/3) * lineHeight + 'px';
                    lineIssue.style.margin = 'auto'; // Centraliza horizontalmente e verticalmente
            
                    // Adicione a div interna ao container de line_issues
                    lineIssueContainer.appendChild(lineIssue);
                }
            }

        }

/* ****************************************** */

/* FUNÇÃO PARA LIMPAR AS BOXES FORMAT_CONTAINERS E GRAMMAR_CONTAINERS */

        function resetImprovementsBoxes() {
            // Obtém a referência ao contêiner de melhorias
            const formatContainer = document.getElementById('format_containers');
            const grammarContainer = document.getElementById('grammar_containers');

            // Obtém a referência ao textarea com o ID 'editor'
            const editorTextarea = document.getElementById('editor');

            // Remove todas as divs dentro do contêiner de melhorias
            formatContainer.innerHTML = '';
            grammarContainer.innerHTML = '';

            // Cria a div de espaço reservado para melhorias
            const improvementsPlaceholderDiv1 = document.createElement('div');
            improvementsPlaceholderDiv1.className = 'improvements_placeholder_div';
            improvementsPlaceholderDiv1.id = 'improvements_placeholder_div1';

            // Cria a div de espaço reservado para melhorias com base no conteúdo do textarea
            const improvementsPlaceholder1 = document.createElement('div');
            improvementsPlaceholder1.className = 'improvements_placeholder';
            improvementsPlaceholder1.id = 'improvements_placeholder1';

            // Cria a div de espaço reservado para melhorias
            const improvementsPlaceholderDiv2 = document.createElement('div');
            improvementsPlaceholderDiv2.className = 'improvements_placeholder_div';
            improvementsPlaceholderDiv2.id = 'improvements_placeholder_div2';

            // Cria a div de espaço reservado para melhorias com base no conteúdo do textarea
            const improvementsPlaceholder2 = document.createElement('div');
            improvementsPlaceholder2.className = 'improvements_placeholder';
            improvementsPlaceholder2.id = 'improvements_placeholder2';

            // Verifica se o textarea está vazio
            if (editorTextarea.value.trim() === '') {
                improvementsPlaceholder1.innerHTML = 'Type something or paste your current transcription to check the format...';
                improvementsPlaceholder2.innerHTML = 'Type something or paste your current transcription to check the grammar...';
                ignoredContainers = []; // reseta o conteúdo ignorado
                clearTimeout(typingTimer);

            } else {
                improvementsPlaceholder1.innerHTML = 'Tap the <span class="highlight_text">Refresh</span> icon to update the format suggestions.';
                improvementsPlaceholder2.innerHTML = 'Tap the <span class="highlight_text">Refresh</span> icon to update the grammar suggestions.';
            }

            // Adiciona a div de espaço reservado para melhorias ao contêiner de melhorias
            improvementsPlaceholderDiv1.appendChild(improvementsPlaceholder1);
            formatContainer.appendChild(improvementsPlaceholderDiv1);

            improvementsPlaceholderDiv2.appendChild(improvementsPlaceholder2);
            grammarContainer.appendChild(improvementsPlaceholderDiv2);
        }

/* ****************************************** */

/* CONTADOR DE CARACTERES */

        function updateCharacterCounter() {
            var textarea = document.getElementById('editor');
            var characterCounter = document.querySelector('.character_counter');
            
            var lines = textarea.value.split('\n');
            characterCounter.innerHTML = '';

            for (var i = 0; i < lines.length; i++) {
                var line = document.createElement('div');
                var lowercaseLine = lines[i].trim().toLowerCase();
                var lineLength = lines[i].trim().length;

                if (lowercaseLine === '' || /^#instrumental$/.test(lowercaseLine) || /^#intro$/.test(lowercaseLine) || /^#verse$/.test(lowercaseLine) || /^#pre-chorus$/.test(lowercaseLine) || /^#chorus$/.test(lowercaseLine) || /^#hook$/.test(lowercaseLine) || /^#bridge$/.test(lowercaseLine) || /^#outro$/.test(lowercaseLine)) {
                    line.textContent = " ";
                } else {
                    line.textContent = lineLength;

                    var selectedLanguageCode = getParameterByName('language')
                    if (selectedLanguageCode === 'pt-BR' || selectedLanguageCode === 'pt-PT') {
                        if (lineLength > 50) {
                            line.style.fontWeight = 'bold';
                            line.style.color = 'yellow';
                        }
                        if (lineLength > 55) {
                            line.style.fontWeight = 'bold';
                            line.style.color = 'red';
                        }
                    } else {
                        if (lineLength > 65) {
                            line.style.fontWeight = 'bold';
                            line.style.color = 'yellow';
                        }
                        if (lineLength > 70) {
                            line.style.fontWeight = 'bold';
                            line.style.color = 'red';
                        }
                    }
                }

                // Adicione a linha ao DOM antes de calcular a altura
                characterCounter.appendChild(line);

                // Obtenha a altura da linha após ela ter sido adicionada ao DOM
                var lineHeight = line.getBoundingClientRect().height;

                // Ajustar a altura da linha para a altura calculada
                line.style.height = lineHeight + 'px';
            }

            resetLineIssues();
            closeContainers();
            resetImprovementsBoxes();
            syncScroll()
        }

/* ****************************************** */

/* SINCRONIZAR SCROLL DE ELEMENTOS DO LYRICS BOX */

        function syncScroll() {
            var textarea = document.getElementById('editor'); // Substitua 'editor' pelo ID correto
            var characterCounter = document.querySelector('.character_counter'); // Use o seletor correto
            var lineIssues = document.querySelector('.line_issues'); // Use o seletor correto

            if (textarea && characterCounter && lineIssues) {
                characterCounter.scrollTop = textarea.scrollTop;
                lineIssues.scrollTop = textarea.scrollTop;
            }
        }

/* ****************************************** */

/* DEFINIR TOGGLES COM BASE NO LOCALSTORAGE */

        // Função para verificar e definir o estado dos checkboxes ao carregar a página
        function setCheckboxStates() {
            // Adicione IDs aos seus elementos de checkbox para tornar a manipulação mais fácil
            const checkboxIds = [
                'copyTransferToggle',
                'pasteTransferToggle',
                'autoCapToggle',
                'autoFormatToggle',
                'autoSuggestion',
                'lfExportToggle',
                'localHostToggle'
            ];

            checkboxIds.forEach(function (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                const checkboxState = localStorage.getItem(checkboxId);

                if (checkboxState !== null) {
                    checkbox.checked = JSON.parse(checkboxState);
                } else {
                    // Se não houver informação em cache, defina os estados padrão
                    if (checkboxId === 'autoCapToggle' || checkboxId === 'autoFormatToggle') {
                        checkbox.checked = true; // Ativado
                    } else {
                        checkbox.checked = false; // Desativado
                    }
                }
            });
        }

        // Função para verificar e definir o valor selecionado do select ao carregar a página
        function setMaxStackValue() {
            const selectElement = document.getElementById('maxUndoRedoActions');
            const selectedValue = localStorage.getItem('maxUndoRedoActions');

            if (selectedValue !== null) {
                selectElement.value = selectedValue;
            } else {
                // Se não houver informação em cache, defina o valor padrão como 100
                selectElement.value = '100';
            }


            // Atualizar o valor de maxStackSize com o valor selecionado
            maxStackSize = selectElement.value;
            
            // Retornar o valor selecionado para ser usado em outras partes do código
            return selectElement.value;
        }

/* ****************************************** */

/* CARREGAR POPUPS E AÇÕES */

        document.addEventListener("DOMContentLoaded", function () {
            var optionsDots = document.getElementById("settings_dots");
            var miniMenu = document.getElementById("mini_menu");
            var langList = document.getElementById("language_list");

            var settingsOption = document.getElementById("settings_option");
            var creditsOption = document.getElementById("credits_option");
            var shortcutsOption = document.getElementById("shortcuts_option");
            var aboutOption = document.getElementById("about_option");

            var settingsPopup = document.getElementById("settings_popup");
            var creditsPopup = document.getElementById("credits_popup");
            var shortcutsPopup = document.getElementById("shortcuts_popup");
            var aboutPopup = document.getElementById("about_popup");

            var overlay = document.getElementById("overlay");

            // Exibir ou ocultar mini menu ao clicar nos 'options_dots'
            optionsDots.addEventListener("click", function (event) {
                event.stopPropagation();
                if (miniMenu.style.display === "block") {
                    miniMenu.style.display = "none";
                } else {
                    miniMenu.style.display = "block";
                    langList.style.display = "none";
                }
            });

            // Ocultar mini menu ao clicar fora dele
            document.addEventListener("click", function () {
                miniMenu.style.display = "none";
            });

            // Evitar que o clique no mini menu propague para o documento
            miniMenu.addEventListener("click", function (event) {
                event.stopPropagation();
            });

            // Show Settings
            settingsOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                settingsPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Hide Settings
            overlay.addEventListener("click", function () {
                settingsPopup.style.display = "none";
                overlay.style.display = "none";
            });

            // Show Credits
            creditsOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                creditsPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Hide Credits
            overlay.addEventListener("click", function () {
                creditsPopup.style.display = "none";
                overlay.style.display = "none";
            });

            // Show Suggestions
            shortcutsOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                shortcutsPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Hide Suggestions
            overlay.addEventListener("click", function () {
                shortcutsPopup.style.display = "none";
                overlay.style.display = "none";
            });

            // Show About Info
            aboutOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                aboutPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Hide About Info
            overlay.addEventListener("click", function () {
                aboutPopup.style.display = "none";
                overlay.style.display = "none";
            });


            const formatButton = document.getElementById('lf_option');
            const grammarButton = document.getElementById('lt_option');

            const keyboardButton = document.getElementById('op_keyboard');
            const numpadButton = document.getElementById('op_numpad');

            formatButton.addEventListener("click", function (event) {
                showFormatTab()
            });

            grammarButton.addEventListener("click", function (event) {
                showGrammarTab()
            });

            keyboardButton.addEventListener("click", function (event) {
                showKeyboardTab()
            });

            numpadButton.addEventListener("click", function (event) {
                showNumpadTab()
            });
        });

/* ****************************************** */

function showKeyboardTab() {
    const keyboardButton = document.getElementById('op_keyboard');
    const numpadButton = document.getElementById('op_numpad');

    const keyboardContainer = document.getElementById('shortcutsKeyboardContent');
    const numpadContainer = document.getElementById('shortcutsNumpadContent');

    keyboardButton.className = 'impr_menu_true'
    numpadButton.className = 'impr_menu_false'
    keyboardButton.title = ''
    numpadButton.title = 'Show numpad shortcuts'

    keyboardContainer.style = 'display:flex'
    numpadContainer.style = 'display:none'
    resetLineIssues();
    closeContainers();
}

function showNumpadTab() {
    const keyboardButton = document.getElementById('op_keyboard');
    const numpadButton = document.getElementById('op_numpad');

    const keyboardContainer = document.getElementById('shortcutsKeyboardContent');
    const numpadContainer = document.getElementById('shortcutsNumpadContent');

    numpadButton.className = 'impr_menu_true'
    keyboardButton.className = 'impr_menu_false'
    numpadButton.title = ''
    keyboardButton.title = 'Show keyboard shortcuts'

    numpadContainer.style = 'display:flex'
    keyboardContainer.style = 'display:none'
    resetLineIssues();
    closeContainers();
}

/* FUNÇÕES PARA EXIBIR ABA DE FORMATO OU GRAMÁTICA */

function toggleTab() {
    const formatButton = document.getElementById('lf_option');
    const formatVisible = formatButton.className === 'impr_menu_true';

    // Se a aba do teclado estiver visível, alterna para a aba do numpad
    if (formatVisible) {
        showGrammarTab()
    } 
    // Se a aba do numpad estiver visível, alterna para a aba do teclado
    else {
        showFormatTab()
    }
}

function showFormatTab() {
    const formatButton = document.getElementById('lf_option');
    const grammarButton = document.getElementById('lt_option');

    const formatContainer = document.getElementById('format_containers');
    const grammarContainer = document.getElementById('grammar_containers');

    formatButton.className = 'impr_menu_true'
    grammarButton.className = 'impr_menu_false'
    formatButton.title = ''
    grammarButton.title = 'Show grammar suggestions'

    formatContainer.style = 'display:flex'
    grammarContainer.style = 'display:none'
    resetLineIssues();
    closeContainers();
}

function showGrammarTab() {
    const formatButton = document.getElementById('lf_option');
    const grammarButton = document.getElementById('lt_option');

    const formatContainer = document.getElementById('format_containers');
    const grammarContainer = document.getElementById('grammar_containers');

    grammarButton.className = 'impr_menu_true'
    formatButton.className = 'impr_menu_false'
    grammarButton.title = ''
    formatButton.title = 'Show format suggestions'

    grammarContainer.style = 'display:flex'
    formatContainer.style = 'display:none'
    resetLineIssues();
    closeContainers();
}

/* ****************************************** */

/* LÓGICA PARA LINE ISSUES POSITIONS */

function updateLineIssues(color, lines) {
    // Itera sobre as linhas fornecidas
    lines.forEach((line) => {
        // Obtém o ID da div da linha
        const lineId = `L${line}_container`;

        // Obtém a div da linha pelo ID
        const lineDiv = document.getElementById(lineId);

        if (lineDiv) {
            // Atualiza a classe da div da linha com base na cor fornecida
            switch (color) {
                case 'red':
                    lineDiv.querySelector('.status-1').className = 'status-1 status-red';
                    break;
                case 'blue':
                    lineDiv.querySelector('.status-1').className = 'status-1 status-blue';
                    break;
                case 'yellow':
                    lineDiv.querySelector('.status-1').className = 'status-1 status-yellow';
                    break;
                default:
                    // Se a cor não for reconhecida, mantenha a classe padrão
                    lineDiv.querySelector('.status-1').className = 'status-1 status-blue';
                    break;
            }
        }
    });
}

/* ****************************************** */

function countFormatContainers() {
    var divFormatContainers = document.getElementById('format_containers');
    
    if (divFormatContainers) {
        var containers = divFormatContainers.getElementsByClassName('container');
        
        return containers.length;
    } else {
        return 0;
    }
}

function countGrammarContainers() {
    var divFormatContainers = document.getElementById('grammar_containers');
    
    if (divFormatContainers) {
        var containers = divFormatContainers.getElementsByClassName('content');
    
        return containers.length;
    } else {
        return 0;
    }
}

function updateTabCounters() {
    const formatContainers = countFormatContainers()
    const grammarContainers = countGrammarContainers()

    if (formatContainers > 0) {
        document.getElementById('format_tab_text').textContent = `${formatContainers} · Format`;
    } else {
        document.getElementById('format_tab_text').textContent = `Format`;
    }

    if (grammarContainers > 0) {
        document.getElementById('grammar_tab_text').textContent = `${grammarContainers} · Grammar`;
    } else {
        document.getElementById('grammar_tab_text').textContent = `Grammar`;
    }
}

/* FUNÇÕES PARA SUGESTÕES DE FORMATO */

        // Função auxiliar para criar um container HTML com base nos dados da API
        function createContainer(containerData) {

            // Verifica se o div_id já está armazenado em ignoredContainers
            if (ignoredContainers.includes(containerData.div_id)) {
                return null; // Retorna null se o div_id já estiver na lista de ignoredContainers
            }

            // Content
            const container = document.createElement('div');
            container.classList.add('container');
            container.setAttribute('onclick', 'expandContainer(this)');
            container.id = containerData.div_id;

            // Adiciona os atributos de dados ao container
            container.setAttribute('data-color', containerData.position.color);
            container.setAttribute('data-lines', JSON.stringify(containerData.position.lines));

            const title = document.createElement('h2');
            title.textContent = containerData.title;

            const content = document.createElement('div');
            content.classList.add('content');

            const contentText = document.createElement('p');
            contentText.classList.add('content_text');
            contentText.innerHTML = containerData.description;

            const contentObs = document.createElement('p'); // Criando o elemento para obs_text
            contentObs.classList.add('content_obs');
            contentObs.innerHTML = containerData.obs_text || ''; // Verificando se obs_text está presente

            const contentOptions = document.createElement('div');
            contentOptions.classList.add('content_options');

            // Learn More
            const contentLearnMore = document.createElement(containerData.learn_more && containerData.learn_more.type === 'url' ? 'a' : 'p');
            contentLearnMore.classList.add('content_learn_more');
            
            if (containerData.learn_more) {
                if (containerData.learn_more.type === 'url') {
                    // Se o tipo for URL, adicione o atributo href ao link
                    contentLearnMore.href = containerData.learn_more.url;
                    contentLearnMore.target = '_blank'; // Abre o link em uma nova guia/janela
                    contentLearnMore.textContent = containerData.learn_more.title || 'Learn More';
                } else {
                    // Se o tipo não for URL, use o texto como conteúdo do parágrafo
                    contentLearnMore.textContent = containerData.learn_more.title || '';
                }
            } else {
                // Se learn_more não estiver presente, adicione uma string vazia como conteúdo
                contentLearnMore.textContent = '';
            }
            
            contentOptions.appendChild(contentLearnMore);


            // Ignore and Fix buttons
            const contentButtons = document.createElement('div');
            contentButtons.classList.add('content_buttons');

            if (containerData.placeholder_text) {
                const placeholderText = document.createElement('p');
                placeholderText.textContent = containerData.placeholder_text;
                placeholderText.style.textAlign = 'center'; // Adiciona o estilo text-align: center;
                contentButtons.appendChild(placeholderText);
            }

            if (containerData.fix_button) {
                const contentFixBtn = document.createElement('div');
                contentFixBtn.classList.add('content_fix_btn');
                contentFixBtn.textContent = 'Fix';
                contentFixBtn.onclick = function() {
                    fixButton(container, containerData.trigger);
                };
                contentButtons.appendChild(contentFixBtn);
            }

            if (containerData.ignore_button) {
                const contentIgnoreBtn = document.createElement('div');
                contentIgnoreBtn.classList.add('content_ignore_btn');
                contentIgnoreBtn.textContent = 'Ignore';
                contentIgnoreBtn.onclick = function() {
                    ignoreButton(container);
                };
                contentButtons.appendChild(contentIgnoreBtn);
            }

            contentOptions.appendChild(contentButtons);

            content.appendChild(contentText);
            content.appendChild(contentObs);
            content.appendChild(contentOptions);

            container.appendChild(title);
            container.appendChild(content);

            return container;
        }



        function closeContainers() {
            const allContainers = document.querySelectorAll('.container');
            allContainers.forEach((container) => {
                container.classList.remove('expanded');
                container.querySelector('.content').style.display = 'none';
            });

            resetLineIssues();
        }

        function expandContainer(container) {
            const content = container.querySelector('.content');

            if (container.classList.contains('expanded')) {
            } else {
                closeContainers(); // Fecha todos os containers antes de expandir o novo

                container.classList.add('expanded');
                content.style.display = 'block';

                // Adiciona console.log para exibir 'color' e 'lines'
                const color = container.getAttribute('data-color');
                const lines = JSON.parse(container.getAttribute('data-lines'));
                resetLineIssues();

                // Verifica se o ID do elemento se inicia com 'lt_'
                if (!container.id.startsWith('lt_')) {
                    updateLineIssues(color, lines);
                }

                // Verifica se o atributo lt-position está presente no container
                const ltPosition = container.getAttribute('lt-position');
                if (ltPosition) {
                    // Extrai offset e length do atributo lt-position
                    const [offset, length] = ltPosition.split(':').map(Number);
                    // Aciona a função selectText com os parâmetros offset e length
                    selectText(offset, length);
                }
            }
        }

        // Definindo a função findAndReplace
        function findAndReplace(incorrectTerm, correction) {
            // Remove os colchetes dos termos
            const cleanIncorrectTerm = incorrectTerm.replace(/\[|\]/g, '');
            const cleanCorrection = correction.replace(/\[|\]/g, '');

            // Obtém o conteúdo do textarea com ID 'editor'
            const editor = document.getElementById('editor');
            let content = editor.value;

            // Escapa caracteres especiais da palavra de busca
            const escapedTerm = cleanIncorrectTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Substitui todas as ocorrências de incorrectTerm por correction
            const regex = new RegExp('(^|\\s|[,.;:!?\\-¿¡])' + escapedTerm + '(?=\\s|[,.;:!?\\-¿¡]|$)', 'g');
            content = content.replace(regex, '$1' + cleanCorrection);

            // Define o conteúdo do textarea como o texto modificado
            editor.value = content;
        }


        function resetLineIssues() {
            // Obtém todas as divs das linhas dentro do elemento com ID 'line_issues'
            const lineDivs = document.querySelectorAll('.line_issues > div');

            // Itera sobre todas as divs das linhas e redefine a classe para 'status-1 status-gray'
            lineDivs.forEach((lineDiv) => {
                lineDiv.querySelector('.status-1').className = 'status-1';
            });
        }

        function ignoreButton(button) {
            var container = button.closest('.container');
            var containerId = container.id; // Obter o ID da DIV container
            ignoredContainers.push(containerId); // Adicionar o ID ao array ignoredContainers
            container.style.display = 'none';
            resetLineIssues();
            handleRefreshButtonClick();
        } 

        function fixButton(container, trigger) {
            // Add if else para ocultar apenas se a correção for bem sucedida
            if (typeof trigger === 'function') {
                // Se o trigger for uma função, chame-a
                trigger();
            } else if (typeof trigger === 'string') {
                // Se o trigger for uma string, interprete-a e execute a ação apropriada
                interpretAndExecuteTrigger(trigger);
            }

            // Oculta o container após a correção (ou tentativa de correção)
            container.style.display = 'none';
            resetLineIssues();
            checkFormatPlaceholder(); // verifica se há containers, se não tiver, exibe o 'copy'
            handleRefreshButtonClick();

            addToUndoStack();
        }

        // Definindo a função para interpretar e executar o trigger
        function interpretAndExecuteTrigger(trigger) {
            try {
                // Extrai os termos entre colchetes usando uma expressão regular
                const match = trigger.match(/\[(.*?)\], \[(.*?)\]/);

                // Verifica se a correspondência foi bem-sucedida
                if (match && match.length === 3) {
                    const incorrectTerm = match[1];
                    const correction = match[2];

                    // Chamando a função findAndReplace com os termos extraídos
                    findAndReplace(incorrectTerm, correction);
                } else {
                    console.error('Invalid trigger format:', trigger);
                }
            } catch (error) {
                console.error('An error occurred when interpreting and executing the trigger:', error);
            }
        }

        function resetTranscription() {
            var editor = document.getElementById('editor');

            if (editor.value.trim() === '') {
                notification('The textarea is already empty')
                return
            }

            addToUndoStack()

            editor.value = ''; // apaga a transcrição
            updateSidebar(); // reseta os contadores de caracteres e a barra lateral
            ignoredContainers = []; // limpa a memória de alertas ignorados
            checkContent();
            clearTimeout(typingTimer);
            updateTabCounters();
            checkTextarea()
            notification('Textarea cleared successfully!');
        }


        function copyToClipboard() {
            const textArea = document.getElementById('editor');
            if (textArea.value.trim() === '') {
                notification("Sorry, there's no content to be copied here");
                return;
            }

            textArea.select();
            
            try {
                // Copia o conteúdo para a área de transferência
                document.execCommand('copy');
                
                updateSidebar(); // reseta os contadores de caracteres e a barra lateral
                ignoredContainers = []; // limpa a memória de alertas ignorados

                const transferPlaybackToggle = isCopyTransferTottleChecked()
                const altDeviceId = getParameterByName('alt_device_id');
                const accessToken = localStorage.getItem('accessToken');

                if (transferPlaybackToggle === true && currentSongId !== '') {
                    transferPlayback(accessToken, altDeviceId)
                    notification('Content copied and playback transferred successfully!');
                } else {
                    notification('Content copied to your clipboard!');
                }

            } catch (err) {
                console.error('An error occurred while copying the text: ', err);
                notification('An error occurred while copying the text.');
            }

            // Deseleciona a textarea
            window.getSelection().removeAllRanges();
            updateTabCounters();
            checkTextarea()
        }

        function pasteFromClipboard() {
            const textArea = document.getElementById('editor');

            if (textArea.value.trim() !== '') {
                notification('Please delete the current transcript before pasting a new one')
                return
            }

            addToUndoStack()

            navigator.clipboard.readText().then(function(text) {
                const textArea = document.getElementById('editor');
                textArea.value = text;
                checkTextarea()
                updateSidebar()

                const transferPlaybackToggle = isPasteTransferTottleChecked()
                const accessToken = localStorage.getItem('accessToken');

                if (transferPlaybackToggle === true && currentSongId !== '') {
                    transferPlayback(accessToken, deviceId)
                    notification('Content pasted and playback transferred successfully!');
                } else {
                    notification('Pasted from clipboard!');
                }
                
                // Aqui você pode adicionar qualquer outra ação que deseja realizar após colar
            }).catch(function(err) {
                console.error('An error occurred while pasting from the clipboard: ', err);
                notification('An error occurred while pasting from the clipboard.');
            });
        }

        // Função para verificar e exibir a div placeholder
        function checkFormatPlaceholder() {
            var formatContainer = document.getElementById('format_containers');

            // Verificar se há containers visíveis
            var visibleContainers = Array.from(formatContainer.querySelectorAll('.container')).filter(container => container.style.display !== 'none');

            // Se já houver algum container visível, não faz nada
            if (visibleContainers.length > 0) {
                return;
            }

            // Create and append the "No issues found" div
            const noIssuesDiv = document.createElement('div');
            noIssuesDiv.className = 'container_no_issues';
            noIssuesDiv.id = 'container_no_issues';
            noIssuesDiv.style.display = 'flex';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'content_ok';
            contentDiv.style.display = 'flex';
            contentDiv.style.alignItems = 'center'; // Align items vertically

            const h2 = document.createElement('h2');

            const copyBtn = document.createElement('div');
            copyBtn.className = 'content_copy_btn';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = copyToClipboard;

            // Create a span for the SVG
            const svgSpan = document.createElement('span');
            svgSpan.style.display = 'flex';
            svgSpan.innerHTML = `
            <svg fill="#ffffff" width="18px" height="18px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M208.8584,144a15.85626,15.85626,0,0,1-10.46778,15.01367l-52.16015,19.2168-19.2168,52.16015a16.00075,16.00075,0,0,1-30.02734,0l-19.2168-52.16015-52.16015-19.2168a16.00075,16.00075,0,0,1,0-30.02734l52.16015-19.2168,19.2168-52.16015a16.00075,16.00075,0,0,1,30.02734,0l19.2168,52.16015,52.16015,19.2168A15.85626,15.85626,0,0,1,208.8584,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z"></path>
            </svg>
            `;

            h2.textContent = 'No format issues!'; // Add the text to h2
            h2.appendChild(svgSpan); // Append the span containing the SVG after the text
            contentDiv.appendChild(h2);
            contentDiv.appendChild(copyBtn);
            noIssuesDiv.appendChild(contentDiv);

            formatContainer.appendChild(noIssuesDiv);
        }

        // Função para verificar e exibir a div placeholder
        function checkGrammarPlaceholder() {
            var formatContainer = document.getElementById('grammar_containers');

            // Verificar se há containers visíveis
            var visibleContainers = Array.from(formatContainer.querySelectorAll('.container')).filter(container => container.style.display !== 'none');

            // Se já houver algum container visível, não faz nada
            if (visibleContainers.length > 0) {
                console.log('> 0');
                return;
            }

            // Create and append the "No issues found" div
            const noIssuesDiv = document.createElement('div');
            noIssuesDiv.className = 'container_no_issues';
            noIssuesDiv.id = 'container_no_issues';
            noIssuesDiv.style.display = 'flex';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'content_ok';
            contentDiv.style.display = 'flex';
            contentDiv.style.alignItems = 'center'; // Align items vertically

            const h2 = document.createElement('h2');

            const copyBtn = document.createElement('div');
            copyBtn.className = 'content_copy_btn';
            copyBtn.textContent = 'Copy';
            copyBtn.onclick = copyToClipboard;
            const svgSpan = document.createElement('span');
            svgSpan.innerHTML = `
            <svg fill="#ffffff" width="18px" height="18px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                <path d="M208.8584,144a15.85626,15.85626,0,0,1-10.46778,15.01367l-52.16015,19.2168-19.2168,52.16015a16.00075,16.00075,0,0,1-30.02734,0l-19.2168-52.16015-52.16015-19.2168a16.00075,16.00075,0,0,1,0-30.02734l52.16015-19.2168,19.2168-52.16015a16.00075,16.00075,0,0,1,30.02734,0l19.2168,52.16015,52.16015,19.2168A15.85626,15.85626,0,0,1,208.8584,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z"></path>
            </svg>
            `;

            h2.textContent = 'No grammar issues!';
            h2.appendChild(svgSpan);

            contentDiv.appendChild(h2);
            contentDiv.appendChild(copyBtn);
            noIssuesDiv.appendChild(contentDiv);

            formatContainer.appendChild(noIssuesDiv);
        }

        // Função para verificar e exibir a div placeholder
        function errorPlaceholder(message, destContainer) {
            var formatContainer = document.getElementById(destContainer);

            // Verificar se há containers visíveis
            var visibleContainers = Array.from(formatContainer.querySelectorAll('.container')).filter(container => container.style.display !== 'none');

            // Se já houver algum container visível, não faz nada
            if (visibleContainers.length > 0) {
                console.log('> 0');
                return;
            }

            // Create and append the "No issues found" div
            const noIssuesDiv = document.createElement('div');
            noIssuesDiv.className = 'improvements_placeholder_div';
            noIssuesDiv.id = 'error_placeholder';
            noIssuesDiv.style.display = 'flex';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'improvements_placeholder';

            const h2 = document.createElement('p');
            h2.textContent = message;

            contentDiv.appendChild(h2);
            noIssuesDiv.appendChild(contentDiv);

            formatContainer.appendChild(noIssuesDiv);
        }

/* ****************************************** */


/* POPUP 'CREDITS' */

        // Função para fazer uma solicitação AJAX
        function fetchCreditsData() {

            // Obter o valor de localHostToggle do localStorage
            const localHostToggle = localStorage.getItem('localHostToggle');

            // Verificar o valor de localHostToggle e definir window.serverPath
            if (localHostToggle === 'true') {
                window.serverPath = 'http://localhost:3000'; 
            } else {
                window.serverPath = 'https://datamatch-backend.onrender.com';
            }

            fetch(`${window.serverPath}/formatter/credits`)
            .then(response => response.json())
            .then(data => updateCredits(data.credits))
            .catch(error => console.error('Error fetching data from server:', error));
        }

        // Função para atualizar os elementos HTML com os novos dados
        function updateCredits(credits) {
            const popupContent = document.querySelector('#credits_popup .popup_content'); // Seleciona o popup_content dentro de credits_popup
            const loadingContainer = document.getElementById('loading_container')

            loadingContainer.style = 'display:none'

            // Define o texto de descrição
            const popupDescription = document.querySelector('.popup_description p');
            popupDescription.textContent = "Here's the list of contributors who made this project real in each language. 🚀";

            credits.forEach(credit => {

                const colaboratorElement = document.createElement('a');
                colaboratorElement.href = credit.mxm_profile;
                colaboratorElement.className = 'colaborator';
                colaboratorElement.target = '_blank'; // Abre o link em uma nova aba

                const colaboratorImage = document.createElement('div');
                colaboratorImage.className = 'colaborator_image';

                const imageElement = document.createElement('img');
                imageElement.src = credit.image;
                imageElement.alt = credit.name;

                const countryElement = document.createElement('div');
                countryElement.className = 'colaborator_country';
                countryElement.textContent = credit.country;

                colaboratorImage.appendChild(imageElement);
                colaboratorImage.appendChild(countryElement);

                const colaboratorInfo = document.createElement('div');
                colaboratorInfo.className = 'colaborator_info';

                const nameElement = document.createElement('div');
                nameElement.className = 'colaborator_name';
                nameElement.textContent = credit.name;

                // Adicionando o nome do colaborador antes de outros elementos
                colaboratorInfo.appendChild(nameElement);

                // Criar os elementos de colaborator_role
                credit.roles.forEach(role => {
                    const roleElement = document.createElement('div');
                    roleElement.className = 'colaborator_role';
                    roleElement.textContent = role;
                    colaboratorInfo.appendChild(roleElement);
                });

                // Criar os elementos de colaborator_languages
                credit.languages.forEach(language => {
                    const languageElement = document.createElement('div');
                    languageElement.className = 'colaborator_languages';
                    languageElement.textContent = language;
                    colaboratorInfo.appendChild(languageElement);
                });

                colaboratorElement.appendChild(colaboratorImage);
                colaboratorElement.appendChild(colaboratorInfo);

                popupContent.appendChild(colaboratorElement);
            });
        }

/* ****************************************** */


/* POPUP 'ABOUT THIS TOOL' */

        // Função para fechar o popup de informações
        function closeAboutInfo() {
            document.getElementById('about_popup').style.display = 'none';
        }

        // Função para buscar dados do servidor
        function fetchServerInfo() {

            // Obter o valor de localHostToggle do localStorage
            const localHostToggle = localStorage.getItem('localHostToggle');

            // Verificar o valor de localHostToggle e definir window.serverPath
            if (localHostToggle === 'true') {
                window.serverPath = 'http://localhost:3000'; 
            } else {
                window.serverPath = 'https://datamatch-backend.onrender.com';
            }

            fetch(`${window.serverPath}/formatter/about`)
            .then(response => response.json())
            .then(data => updateServerInfo(data))
            .catch(error => console.error('Error fetching data from server:', error));
        }

        // Função para atualizar os elementos HTML com os novos dados do servidor
        function updateServerInfo(data) {
            // Selecione os elementos HTML onde você deseja atualizar as informações do servidor
            const popupContent = document.querySelector('#aboutContent'); // Seleciona o popup_content dentro de about_popup

            // Limpe o conteúdo antigo antes de adicionar novas informações
            popupContent.innerHTML = '';

            // Verifica se há dados do servidor
            if (data.serverInfo) {
                const serverInfo = data.serverInfo;

                // Adiciona o título How to use acima da descrição
                const howToUseTitleElement = document.createElement('h3');
                howToUseTitleElement.textContent = 'How to use';
                popupContent.appendChild(howToUseTitleElement);

                // Divide o texto How to use em parágrafos usando '\n\n\n'
                const howToUseParagraphs = serverInfo.howToUseText.split('\n\n\n');

                // Adiciona cada parágrafo como um elemento <p>
                howToUseParagraphs.forEach((paragraph, index) => {
                    const paragraphElement = document.createElement('p');
                    paragraphElement.textContent = paragraph;
                    
                    // Adiciona margem inferior de 10px entre os parágrafos, exceto para o último parágrafo
                    if (index !== howToUseParagraphs.length - 1) {
                        paragraphElement.style.marginBottom = '10px';
                    }
                    
                    popupContent.appendChild(paragraphElement);
                });

                // Adiciona uma barra fina cinza horizontal abaixo do how to use
                const howToUseDividerElement = document.createElement('hr');
                howToUseDividerElement.style.border = 'none';
                howToUseDividerElement.style.borderTop = '1px solid #646464';
                popupContent.appendChild(howToUseDividerElement);

                // Adiciona o título Changelog acima da descrição
                const changelogTitleElement = document.createElement('h3');
                changelogTitleElement.textContent = 'Changelog';
                popupContent.appendChild(changelogTitleElement);

                // Divide o texto Changelog em parágrafos usando '\n\n\n'
                const changelogParagraphs = serverInfo.description.split('\n\n\n');

                // Adiciona cada parágrafo como um elemento <p>
                changelogParagraphs.forEach((paragraph, index) => {
                    const paragraphElement = document.createElement('p');
                    paragraphElement.textContent = paragraph;
                    
                    // Adiciona margem inferior de 10px entre os parágrafos, exceto para o último parágrafo
                    if (index !== changelogParagraphs.length - 1) {
                        paragraphElement.style.marginBottom = '10px';
                    }
                    
                    popupContent.appendChild(paragraphElement);
                });

                // Adiciona uma barra fina cinza horizontal abaixo da descrição
                const dividerElement = document.createElement('hr');
                dividerElement.style.border = 'none';
                dividerElement.style.borderTop = '1px solid #646464';
                popupContent.appendChild(dividerElement);

                // Cria o contêiner para as informações do servidor
                const serverInfoContainer = document.createElement('div');
                serverInfoContainer.classList.add('server_info'); // Adiciona a classe 'server_info'

                // Adiciona o título das informações do servidor
                const titleElement = document.createElement('h3');
                titleElement.textContent = serverInfo.title;
                serverInfoContainer.appendChild(titleElement);

                // Itera sobre os dados do servidor
                for (const item of serverInfo.data) {
                    const itemElement = document.createElement('p');

                    // Adiciona a classe 'bold' apenas ao valor
                    itemElement.innerHTML = `<span>${item.label}: </span><span class="bold">${item.value}</span>`;
                    serverInfoContainer.appendChild(itemElement);
                }
            // Adiciona o contêiner das informações do servidor ao popupContent
            popupContent.appendChild(serverInfoContainer);
            }
        }

/* ****************************************** */

/* EXIBIR OU OCULTAR MENU DE DESENVOLVIMENTO */

        // Função para exibir/ocultar a div e salvar a escolha em cache
        function displayDevModeDiv() {
            const devHidedDiv = document.getElementById('dev_hided_div');
            const devMode = localStorage.getItem('devMode') === 'true'; // Obtém o estado atual do modo de desenvolvimento

            // Alterna entre exibir e ocultar a div
            if (devMode) {
                devHidedDiv.style.display = 'none';
            } else {
                devHidedDiv.style.display = 'block';
                showSpMenuDiv()
            }

            // Salva a escolha em cache invertendo o valor atual
            localStorage.setItem('devMode', (!devMode).toString());
        }

        // Carrega a escolha do modo de desenvolvimento do cache e exibe/oculta a div conforme necessário
        function loadDevMode() {
            const devMode = localStorage.getItem('devMode') === 'true';
            const devHidedDiv = document.getElementById('dev_hided_div');

            if (devMode) {
                devHidedDiv.style.display = 'block';
            } else {
                devHidedDiv.style.display = 'none';
            }
        }

/* ****************************************** */

/* REDIRECTIONAR O USUÁRIO AUTOMATICAMENTE PARA A ATENTICAÇÃO NO CASO DE PARAMETROS TRACK ID NA URL */

        // Função para redirecionar o usuário para a página de autorização caso haja um track id sem autenticação
        function checkTrackIdParams() {
            const trackIdParam = getParameterByName('track_id');
            const accessToken = localStorage.getItem('accessToken');

            if (trackIdParam !== null) {
                if (!accessToken) {
                    openSpotifyAuthorization()
                }
            }
        }

/* ****************************************** */

        // Função para redirecionar o usuário para a página de autorização caso haja um track id sem autenticação
        function checkMobileTestingParams() {
            const mobileTestingParam = getParameterByName('mobile_ui');
            if (mobileTestingParam === '1') {
                var element = document.getElementById('development_message');
                if (element) {
                    element.remove();
                }
            }
        }

        // Função para verificar os parâmetros da URL e acionar a função correspondente
        function checkLTExportParams() {
            const ltExportParam = getParameterByName('lt_export');
            
            if (ltExportParam !== null) {
                if (ltExportParam === '1') {
                    document.getElementById('lfExportToggle').checked = true;
                    removeParameterFromURL('lt_export')
                } else if (ltExportParam === '0') {
                    document.getElementById('lfExportToggle').checked = false;
                    removeParameterFromURL('lt_export')
                }
            }
        }

/* EXIBIR OU OCULTAR CONFIGURAÇÕES DO SPOTIFY */

        // Função para verificar os parâmetros da URL e acionar a função correspondente
        function checkSpotifyParams() {
            const spMenuParam = getParameterByName('sp_menu');
            
            if (spMenuParam !== null) {
                if (spMenuParam === '1') {
                    showSpMenuDiv();
                    removeParameterFromURL('sp_menu')
                } else if (spMenuParam === '0') {
                    hideSpMenuDiv();
                    removeParameterFromURL('sp_menu')
                }
            }
        }

        // Função para exibir a div
        function showSpMenuDiv() {
            const spHidedDiv = document.getElementById('sp_hided_div');
            spHidedDiv.style.display = 'block';
            localStorage.setItem('spMenu', 'true');
        }

        // Função para ocultar a div
        function hideSpMenuDiv() {
            const spHidedDiv = document.getElementById('sp_hided_div');
            spHidedDiv.style.display = 'none';
            localStorage.setItem('spMenu', 'false');
        }

        function showSpShortcuts() {
            document.getElementById('audio_controls_numpad').style = 'margin-bottom: 15px;'
            document.getElementById('additional_features_numpad').style = ""
            document.getElementById('audio_controls_keyboard').style = 'margin-bottom: 15px;'
            document.getElementById('additional_features_keyboard').style = "margin-bottom: 15px;"
            document.getElementById('navegation_keyboard').style = "margin-bottom: 15px;"
            document.getElementById('navegation_numpad').style = "margin-bottom: 15px;"
        }

        function hideSpShortcuts() {
            document.getElementById('audio_controls_numpad').style = 'margin-bottom: 15px; display:none'
            document.getElementById('additional_features_numpad').style = "display:none"
            document.getElementById('audio_controls_keyboard').style = 'margin-bottom: 15px; display:none'
            document.getElementById('additional_features_keyboard').style = "margin-bottom: 15px; display:none"
            document.getElementById('navegation_keyboard').style = ""
            document.getElementById('navegation_numpad').style = ""
        }

        // exibe / oculta o menu do spotify
        function loadSpMenu() {
            const spMenu = localStorage.getItem('spMenu');

            if (spMenu === 'true') {
                showSpMenuDiv();
                showSpShortcuts()
            } else if (spMenu === 'false') {
                hideSpMenuDiv();
                hideSpShortcuts()
            }
        }

/* ****************************************** */

/* FUNÇÕES PARA INTERPRETAR PARAMETROS DA URL */

        // Função para obter parâmetros da URL
        function getParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        function addParamToURL(paramName, paramValue) {
            var url = window.location.href;
            var newUrl;
            
            // Verificar se o parâmetro já existe na URL
            if (url.indexOf(paramName + '=') !== -1) {
                // Substituir o valor do parâmetro
                var regex = new RegExp('(' + encodeURIComponent(paramName) + '=)[^&]*');
                newUrl = url.replace(regex, '$1' + encodeURIComponent(paramValue));
            } else {
                // Adicionar o parâmetro à URL
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                newUrl = url + separator + encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
            }
            
            history.pushState(null, '', newUrl);
        }

        // Função para remover um parâmetro da URL
        function removeParameterFromURL(parameterKey) {
            var url = window.location.href;
            var urlParts = url.split('?');

            if (urlParts.length >= 2) {
                var prefix = encodeURIComponent(parameterKey) + '=';
                var parts = urlParts[1].split(/[&;]/g);

                // Percorrer todos os parâmetros
                for (var i = parts.length; i-- > 0;) {
                    // Se encontrar o parâmetro a ser removido, removê-lo da lista de parâmetros
                    if (parts[i].lastIndexOf(prefix, 0) !== -1) {
                        parts.splice(i, 1);
                    }
                }

                // Reconstituir a URL sem o parâmetro removido
                url = urlParts[0] + (parts.length > 0 ? '?' + parts.join('&') : '');
            }
            return url;
        }

/* ****************************************** */

/* ALTERAR BOTÕES CTRL PARA ÍCONE CMD EM MACS */

        function updateShortcutIcon() {
            const operatingSystem = checkOperatingSystem();
            const shortcutElements = document.querySelectorAll('.shortcut_icon_larger[data="ctrl_meta_key"]');
            
            if (operatingSystem === 'macOS') {
                shortcutElements.forEach(function(element) {
                    // Criar um elemento <svg> e definir seu conteúdo interno como o SVG do ícone
                    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svgElement.setAttribute("fill", "#ffffff");
                    svgElement.setAttribute("width", "28px");
                    svgElement.setAttribute("height", "28px");
                    svgElement.setAttribute("viewBox", "0 0 24 24");
                    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                    svgElement.setAttribute("stroke", "#ffffff");
                    svgElement.setAttribute("stroke-width", "0.00024000000000000003");
                    svgElement.innerHTML = '<path style="transform: none; transition: none;" d="M18.5,9A3.5,3.5,0,1,0,15,5.5V7H9V5.5A3.5,3.5,0,1,0,5.5,9H7v6H5.5A3.5,3.5,0,1,0,9,18.5V17h6v1.5A3.5,3.5,0,1,0,18.5,15H17V9ZM17,5.5A1.5,1.5,0,1,1,18.5,7H17ZM7,18.5A1.5,1.5,0,1,1,5.5,17H7ZM7,7H5.5A1.5,1.5,0,1,1,7,5.5Zm8,8H9V9h6Zm3.5,2A1.5,1.5,0,1,1,17,18.5V17Z"></path>';
    
                    // Substituir o conteúdo do elemento original pelo elemento <svg>
                    element.innerHTML = '';
                    element.appendChild(svgElement);
                });
            }
        }

/* ****************************************** */     

/* FUNÇÕES PARA IDENTIFICAR OS E TIPO DE DISPOSITIVO */

        function checkOperatingSystem() {
            const platform = navigator.platform.toUpperCase();
            
            if (platform.indexOf('WIN') !== -1) {
                return 'Windows';
            } else if (platform.indexOf('MAC') !== -1) {
                return 'macOS';
            } else {
                return 'Unknown';
            }
        }

        function checkDeviceType() {
            const userAgent = navigator.userAgent.toLowerCase();
        
            if (/(android|webos|iphone|ipad|ipod|blackberry|windows phone)/.test(userAgent)) {
                document.getElementById('development_message').style = 'display:flex'
                return 'Mobile';
            } else {
                document.getElementById('development_message').style = ''
                return 'PC';
            }
        }

/* ****************************************** */

    // teste para botão de expanção de funções do player no mobile (não terminado)
    document.getElementById('toggle_options').addEventListener('click', function() {
        var extendedOptions = document.querySelector('.extended-options');
        this.classList.toggle('active');
        if (extendedOptions.style.display === 'flex') {
            extendedOptions.style.display = 'none';
        } else {
            extendedOptions.style.display = 'flex';
        }
    });
