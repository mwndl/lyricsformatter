var typingTimer;
var autoSaveTimer;

var undoStack = [];
var redoStack = [];
let undoCursorPositionsStack = [];
var redoCursorPositionsStack = [];
var maxStackSize = 100;

var lf_version = '2.18.0';
var lf_release_date = '20/04/2024'

document.addEventListener('DOMContentLoaded', function () {
    var returnArrow = document.getElementById('return_arrow');
    var lyricsBox = document.getElementById('lyrics_box');
    var textArea = document.getElementById('editor');
    var textarea = document.querySelector('.editor');
    const selector = document.querySelector('.language_selector');
    const selectedLanguage = document.querySelector('.selected_language');
    const languageList = document.querySelector('.language_list_div');
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

    document.getElementById('paste_button').addEventListener('click', function() { // paste
        pasteFromClipboard();
        autoSave();
    });    

    document.getElementById('refresh_button').addEventListener('click', function() {
        autoFormat();
        handleRefreshButtonClick();
    });

    document.getElementById('mxm_icon_div').addEventListener('click', function() {
         getMxmLyrics(currentIsrc, 'xleU8AVcuM9iS99upAs0RfWjvty6Vjn7') // 10 requests per hour token (public)
    });    

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
        addToUndoStack()
    });

    textarea.addEventListener('input', updateSidebar);
    textarea.addEventListener('input', checkContent);
    textarea.addEventListener('scroll', syncScroll);

    
    function checkContent() {

        const doneTypingInterval = 3000;
        const editor = document.getElementById('editor');
        const content = editor.value;
    
        const checkboxIds = [
            'copyTransferToggle',
            'pasteTransferToggle',
            'autoCapToggle',
            'autoFormatToggle',
            'saveDraft',
            'mxmPersonalTokenToggle',
            'autoSuggestion',
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

        if (isDraftChecked()) {
            autoSave();
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
        displayTokenField()
        addToUndoStack(); // add o texto vazio como undo inicial
        updateMemoryUsage();
        draftsCounter()
        checkExpiredDrafts();

    
    // Adicione um evento de clique ao botão de cópia
    var copyButton = document.querySelector('.content_copy_btn');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            if (isDraftChecked()) {
                saveDraft();
            }
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

    const copyDiffButton = document.getElementById('copy_diff_link');
    copyDiffButton.addEventListener('click', function() {
        diffLink = document.getElementById('diff_link_output').textContent
        copyContentToClipboard(diffLink, 'Link copied to clipboard')
    });

    // Botão enter no editor, função para previnir comportamento de scroll automático
    document.getElementById('editor').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            // Salva a posição atual do cursor
            var startPos = this.selectionStart;
            var endPos = this.selectionEnd;
        
            // Insere uma quebra de linha
            var currentValue = this.value;
            var newValue = currentValue.substring(0, startPos) + '\n' + currentValue.substring(endPos, currentValue.length);
            this.value = newValue;
        
            // Move o cursor para a posição correta após a quebra de linha
            this.selectionStart = this.selectionEnd = startPos + 1;
        
            updateSidebar();
            autoSave();
            // Impede o comportamento padrão do Enter
            event.preventDefault();
          }
    });

    document.addEventListener('keydown', function (event) {

        var editor = document.getElementById('editor');
        var mxmTokenField = document.getElementById('mxm_token_input');
        var isEditorFocused = editor === document.activeElement;
        var isMxmTokenFieldFocused = mxmTokenField === document.activeElement;

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
                    autoFormat()
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
            autoFormat()
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
        

        } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === 'Z' || event.key === 'z') && !isMxmTokenFieldFocused) { // desfazer
            event.preventDefault();
            undo();
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'Z' || event.key === 'z')) { // refazer
            event.preventDefault();
            redo();
        } else if ((event.ctrlKey || event.metaKey) && !event.shiftKey && (event.key === 'S' || event.key === 's')) { // salvar rascunho
            event.preventDefault();
            if (isDraftChecked()) {
                saveDraft();
            } else {
                notification('Please enable the "Local Draft" toggle in the settings')
            }
        } else if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'E' || event.key === 'e')) {
            event.preventDefault();
            addOrRemoveParentheses()
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
    if (isDraftChecked()) {
        autoSave();
    }
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

        if (isDraftChecked()) {
            autoSave();
        }
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
            const selectionStart = editor.selectionStart;
            const selectionEnd = editor.selectionEnd;
            const currentText = editor.value;


            // Verifica se há texto selecionado
            if (selectionStart !== selectionEnd) {
                // Substitui o texto selecionado com o novo texto
                const newText = currentText.substring(0, selectionStart) + text + currentText.substring(selectionEnd);
                editor.value = newText;
                // Move o cursor para o final do novo texto adicionado
                editor.setSelectionRange(selectionStart + text.length, selectionStart + text.length);
            } else {
                // Dividir o texto em linhas
                const lines = currentText.split('\n');

                // Encontrar a linha onde o cursor está
                let lineStart = 0;
                let lineEnd = 0;
                let lineIndex = -1; // Índice da linha onde o cursor está
                for (let i = 0; i < lines.length; i++) {
                    lineEnd = lineStart + lines[i].length;
                    if (selectionStart >= lineStart && selectionStart <= lineEnd) {
                        // Adicionar o texto na linha onde o cursor está
                        lines[i] += text;
                        lineIndex = i; // Salva o índice da linha onde o cursor está
                        break;
                    }
                    lineStart = lineEnd + 1; // +1 para contar o caractere de nova linha (\n)
                }

                // Atualizar o valor do textarea com as linhas modificadas
                editor.value = lines.join('\n');

                // Definir a nova posição do cursor
                if (lineIndex !== -1) {
                    const newCursorPosition = selectionStart + text.length;
                    editor.setSelectionRange(newCursorPosition, newCursorPosition);
                }
            }

            addToUndoStack();
            updateSidebar();
            autoSave();
            autoFormat();
        }

        function addOrRemoveParentheses() {
            const languageParam = getParameterByName('language');
            if (languageParam === 'fr' || languageParam === 'it') {
                addParenthesesAlt();
                removeDuplicatePunctuations();
                autoSave();
            } else {
                addParentheses();
                removeDuplicatePunctuations();
                autoSave();
            }
        }

        // Adiciona ou remove parentesis - idiomas onde é permitido abrir e fechar parentesis em linhas diferentes
        function addParenthesesAlt() {
            const editor = document.getElementById('editor');
            const selectionStart = editor.selectionStart;
            const selectionEnd = editor.selectionEnd;
            const currentText = editor.value;

            // Verifica se há texto selecionado
            if (selectionStart !== selectionEnd) {
                const selectedText = currentText.substring(selectionStart, selectionEnd);
                
                // Verifica se o texto selecionado faz parte de uma linha com valores específicos
                const lineMarkers = ['#INTRO', '#VERSE', '#PRE-CHORUS', '#CHORUS', '#HOOK', '#BRIDGE', '#OUTRO', '#INSTRUMENTAL'];
                const lineContainingMarker = lineMarkers.find(marker => {
                    const index = selectedText.indexOf(marker);
                    return index !== -1 && (index === 0 || selectedText[index - 1] === '\n');
                });
                if (lineContainingMarker) {
                    notification(`Selected text is part of a line containing "${lineContainingMarker}".`);
                    return; // Retorna com erro
                }
                
                // Verifica se o texto selecionado já está entre parênteses
                if (selectedText.startsWith('(') && selectedText.endsWith(')')) {
                    // Remove os parênteses do texto selecionado
                    const newText = selectedText.substring(1, selectedText.length - 1);
                    editor.setRangeText(newText, selectionStart, selectionEnd, 'end');
                } else {
                    // Adiciona parênteses ao redor do texto selecionado
                    const newText = '(' + selectedText + ')';
                    editor.setRangeText(newText, selectionStart, selectionEnd, 'end');
                }
            } else {
                // Se não houver texto selecionado, insere parênteses ao redor do próximo caractere
                const nextChar = currentText.charAt(selectionStart);
                if (!nextChar.trim()) {
                    // Notifica erro se não houver próximo caractere
                    notification('No text selected, you need to select something');
                    return;
                }
                const newText = '(' + nextChar + ')';
                editor.setRangeText(newText, selectionStart, selectionStart + 1, 'end');
            }

            addToUndoStack();
            updateSidebar();
        }

        function addParentheses() {
            const editor = document.getElementById('editor');
            const selectionStart = editor.selectionStart;
            const selectionEnd = editor.selectionEnd;
            const currentText = editor.value;
        
            // Verifica se há texto selecionado
            if (selectionStart === selectionEnd) {
                notification('No text selected, you need to select something');
                return; // Retorna com erro
            }
        
            // Verifica se há mais de uma linha selecionada
            const selectedTextLines = currentText.substring(selectionStart, selectionEnd).split('\n');
            if (selectedTextLines.length > 1) {
                notification('Multiple lines selected, select one at a time');
                return; // Retorna com erro
            }
        
            const selectedText = selectedTextLines[0];
        
            // Verifica se o texto selecionado faz parte de uma linha com valores específicos
            const lineMarkers = ['#INTRO', '#VERSE', '#PRE-CHORUS', '#CHORUS', '#HOOK', '#BRIDGE', '#OUTRO', '#INSTRUMENTAL'];
            const lineContainingMarker = lineMarkers.find(marker => {
                const index = selectedText.indexOf(marker);
                return index !== -1 && (index === 0 || selectedText[index - 1] === '\n');
            });
            if (lineContainingMarker) {
                notification(`Selected text is part of a line containing "${lineContainingMarker}".`);
                return; // Retorna com erro
            }
        
            // Verifica se o texto selecionado já está entre parênteses
            if (selectedText.startsWith('(') && selectedText.endsWith(')')) {
                // Remove os parênteses do texto selecionado
                const newText = selectedText.substring(1, selectedText.length - 1);
                editor.setRangeText(newText, selectionStart, selectionEnd, 'end');
            } else {
                // Adiciona parênteses ao redor do texto selecionado
                const newText = '(' + selectedText + ')';
                editor.setRangeText(newText, selectionStart, selectionEnd, 'end');
            }
        
            addToUndoStack();
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
                'nl': 'Dutch',
                'nl-BE': 'Dutch (BE)',
                'en-AU': 'English (AU)',
                'en-CA': 'English (CA)',
                'en-NZ': 'English (NZ)',
                'en-GB': 'English (UK)',
                'en-US': 'English (US)',
                'en-ZA': 'English (ZA)',
                'fr': 'French',
                'fr-BE': 'French (BE)',
                'fr-CA': 'French (CA)',
                'fr-CH': 'French (CH)',
                'de-AT': 'German (AT)',
                'de-DE': 'German (DE)',
                'de-CH': 'German (CH)',
                'it': 'Italian',
                'ja-JP': 'Japanese',
                'pt-AO': 'Portuguese (AO)',
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
            var selectedLanguageCode = getParameterByName('language')

            if (textArea.value === '') {
                fetchCurrentlyPlayingData();
                notification("The editor is empty, there's nothing to be checked here");
                return;
            }

            updateSidebar();
            resetLineIssues();
            clearTimeout(typingTimer); // auto 3s
            fetchCurrentlyPlayingData();
            

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

            checkLanguage();

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

        function autoFormat() {
            var textArea = document.getElementById('editor');
            var autoFormatToggle = document.getElementById('autoFormatToggle');
            var selectedLanguageCode = getParameterByName('language');
            const cursorPosition = editor.selectionStart; // Obtém a posição atual do cursor

            if (autoFormatToggle.checked) {

                if (selectedLanguageCode === 'pt-BR' || selectedLanguageCode === 'pt-PT') {
                    replaceX();
                }

                if (selectedLanguageCode === 'pt-BR' || selectedLanguageCode === 'pt-PT'|| 
                selectedLanguageCode === 'en-US' || selectedLanguageCode === 'en-GB'|| 
                selectedLanguageCode === 'es' || selectedLanguageCode === 'it'||
                selectedLanguageCode === 'fr') {
                    fixPunctuation();
                }

                replaceSpecialTags(); // auto replace tags
                trimEditorContent(); // linhas antes ou depois da letra (1)
                removeExcessInstrumental(); // remove tags instrumentais duplicadas
                removeInstrumentalStardEnd(); // remove instrumentais no início/fim da letra
                addSpaceAboveTags(); // add (caso não haja) espaços acima de todas as tags
                removeSpacesAroundInstrumental(); // espaços ao redor de tags instrumentais
                trimEditorContent(); // linhas antes ou depois da letra (2)
                removeEOL(); // remove pontuações EOL
                autoTrim(); // espaços extras no início ou fim 
                removeDuplicateSpaces(); // espaços duplos entre palavras
                removeDuplicateEmptyLines(); // linhas vazias duplicadas entre estrofes

                // Encontre o índice do início da próxima linha
                var nextLineIndex = textArea.value.indexOf("\n", cursorPosition);
                if (nextLineIndex === -1) {
                    nextLineIndex = textArea.value.length; // Se for a última linha, vá até o final do texto
                }
                // Defina a posição do cursor para o final da linha onde estava o cursor antes da formatação automática
                textArea.setSelectionRange(nextLineIndex, nextLineIndex);

                updateSidebar();
                resetLineIssues();
            }
        }

/* ****************************************** */

/* FUNÇÃO PARA OBTER DADOS DA MUSIXMATCH APENAS */

        function getMxmLyrics(isrc, userToken) {

            document.getElementById('mxm_white_logo').style.display = 'none';
            document.getElementById('mxm_loading_spinner').style.display = 'block';

            // Get the value of localHostToggle from localStorage
            const localHostToggle = localStorage.getItem('localHostToggle');


            // Check the value of localHostToggle and set window.serverPath
            if (localHostToggle === 'true') {
                window.serverPath = 'http://localhost:3000';
            } else {
                window.serverPath = 'https://datamatch-backend.onrender.com';
            }

            const privateMxmToken = localStorage.getItem('mxm_token');
            const privateTokenToggle = document.getElementById('mxmPersonalTokenToggle')

            // Check the value of localHostToggle and set window.serverPath
            let tokenPath;
            if (privateMxmToken !== null && privateTokenToggle.checked === true) {
                tokenPath = `access_mode=2&user_token=${privateMxmToken}`;

            // caso o usuário tenha definido a opção de token privado mas o campo esteja em branco
            } else if (privateMxmToken === null && privateTokenToggle.checked === true) {
                document.getElementById('mxmPersonalTokenToggle').checked = false; 
                tokenPath = `access_mode=1&user_token=${userToken}`;
            } else {
                tokenPath = `access_mode=1&user_token=${userToken}`;
            }

            // Constructing the request URL
            const url = `${window.serverPath}/mxm/get_track?isrc=${isrc}&${tokenPath}`;

            // Making the GET request using fetch API
            fetch(url)
                .then(response => {

                    document.getElementById('mxm_white_logo').style.display = 'block';
                    document.getElementById('mxm_loading_spinner').style.display = 'none';

                    // Checking the response status code
                    if (response.status === 500) {
                        notification('Something went wrong, please try again later')
                        throw new Error('Internal Server Error (500)');
                    } else if (response.status === 400) {
                        notification('This track is not available on Musixmatch')
                        throw new Error('Bad Request (400)');
                    } else if (response.status === 429) {
                        notification('Too many requests, please try again later')
                        throw new Error('Too Many Requests (429)');
                    } else if (!response.ok) {
                        notification('An unexpected error has occurred')
                        throw new Error('Error making request to server');
                    }
                    // Converting the response to JSON
                    return response.json();
                })
                .then(data => {
                    // Handling the received data
                    console.log(data);

                    const trackId = data.track_id;
                    const redirectUrl = `http://mxmt.ch/t/${trackId}`;
                    window.open(redirectUrl, '_blank');
                })
                .catch(error => {
                    // Capturing and handling errors
                    console.error('An error occurred:', error);
                });
        }


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
        
        function isDraftChecked() {
            const saveDraft = document.getElementById('saveDraft');
            return saveDraft.checked;
        }

        function isAutoSuggestionsChecked() {
            const autoSuggestions = document.getElementById('autoSuggestion');
            return autoSuggestions.checked;
        }

        function isDisplayPlaybackToggleChecked() {
            const showPlaybackTabToggle = document.getElementById('displayPlaybackTabToggle');
            return showPlaybackTabToggle.checked;
        }

        function isMxmPersonalTokenToggleChecked() {
            const mxmTokenToggle = document.getElementById('mxmPersonalTokenToggle');
            return mxmTokenToggle.checked;
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

        function removeDuplicatePunctuations() {
            var editor = document.getElementById('editor');
            var content = editor.value;
            
            // Definir padrões de pontuações duplicadas
            var duplicatePunctuations = /([,!?()])\1+/g; // Detecta repetições de vírgulas, pontos de exclamação, interrogação, parênteses abertos e fechados
            
            // Substituir pontuações duplicadas por apenas uma repetição
            content = content.replace(duplicatePunctuations, '$1');
            
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
        function fixPunctuation() {
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

        function removeEOL() {
            var editor = document.getElementById('editor');
            var content = editor.value;
        
            // Remove pontuações específicas no final das linhas, exceto quando seguidas por '...'
            content = content.replace(/(?<!\.{3})[:,;]+(?!\.{2,})\s*$/gm, '');
        
            // Atualizar o conteúdo do editor
            editor.value = content;
        }

/* ****************************************** */

/* NOTIFICAÇÕES TEMPORÁRIAS */

        function notification(customMessage) {
            const notification_div = document.getElementById("notification");
            const message = document.getElementById("notification-message");
            message.textContent = customMessage;
            message.style = 'margin: 0 15px'
            notification_div.style.opacity = 1;
            notification_div.classList.remove("hidden");

            setTimeout(() => {
                notification_div.style.opacity = 0;
                setTimeout(() => {
                    notification_div.classList.add("hidden");
                    message.textContent = ''
                    message.style = ''
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

/* VERIFICAR PRESENÇA DE TOKEN DA MUSIXMATCH */

        function checkMxmToken() {
            // Obtendo o elemento input
            var inputElement = document.getElementById('mxm_token_input');

            // Verificando se o campo de texto está vazio
            if (inputElement.value.trim() === '') {
                // Se estiver vazio, remova o item 'mxm_token' do cache, se existir
                localStorage.removeItem('mxm_token');
            } else {
                // Se não estiver vazio, salve o conteúdo do campo de texto no cache
                localStorage.setItem('mxm_token', inputElement.value.trim());
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
                'saveDraft',
                'mxmPersonalTokenToggle',
                'autoSuggestion',
                'localHostToggle'
            ];

            checkboxIds.forEach(function (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                const checkboxState = localStorage.getItem(checkboxId);

                if (checkboxState !== null) {
                    checkbox.checked = JSON.parse(checkboxState);
                } else {
                    // Se não houver informação em cache, defina os estados padrão
                    if (checkboxId === 'autoCapToggle' || checkboxId === 'autoFormatToggle' || checkboxId === 'autoSuggestion' /*|| checkboxId === 'saveDraft'*/) { 
                        checkbox.checked = true; // Ativado
                    } else {
                        checkbox.checked = false; // Desativado
                    }
                }
            });

            // Verificando se há um token salvo em cache e preenchendo o campo de texto com ele, se existir
            const cachedToken = localStorage.getItem('mxm_token');
            if (cachedToken !== null) {
                document.getElementById('mxm_token_input').value = cachedToken;
            }

            draftToggle = isDraftChecked()
            if (!draftToggle) {
                document.getElementById('manage_drafts_div').style.display = 'none'
                document.getElementById('set_drafts_duration').style.display = 'none'
                document.getElementById('set_drafts_limit').style.display = 'none'
                document.getElementById('drafts_line_sep').style.display = 'none'
            }
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
            var langList = document.getElementById("language_list_div");

            var settingsOption = document.getElementById("settings_option");
            var creditsOption = document.getElementById("credits_option");
            var shortcutsOption = document.getElementById("shortcuts_option");
            var aboutOption = document.getElementById("about_option");

            var settingsPopup = document.getElementById("settings_popup");
            var creditsPopup = document.getElementById("credits_popup");
            var shortcutsPopup = document.getElementById("shortcuts_popup");
            var aboutPopup = document.getElementById("about_popup");

            var manageDictionaryPopup = document.getElementById("manage_dictionary_popup");
            var manageDraftPopup = document.getElementById("manage_draft_popup");
            var diffcheckerPopup = document.getElementById("diffchecker_popup");

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
                
                updateMemoryUsage();
                draftsCounter()
            });

            // Show Credits
            creditsOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                creditsPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Show Suggestions
            shortcutsOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                shortcutsPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Show About Info
            aboutOption.addEventListener("click", function () {
                miniMenu.style.display = "none";
                aboutPopup.style.display = "block";
                overlay.style.display = "block";
            });

            // Hide About Info
            overlay.addEventListener("click", function () {
                settingsPopup.style.display = "none";
                creditsPopup.style.display = "none";
                shortcutsPopup.style.display = "none";
                aboutPopup.style.display = "none";

                overlay.style.display = "none";

                manageDictionaryPopup.style.display = "none";
                manageDraftPopup.style.display = "none";
                diffcheckerPopup.style.display = "none"

            });

            // format e grammar
            const formatButton = document.getElementById('lf_option');
            const grammarButton = document.getElementById('lt_option');

            formatButton.addEventListener("click", function (event) {
                showFormatTab()
            });

            grammarButton.addEventListener("click", function (event) {
                showGrammarTab()
            });

            // settings submenus
            const playbackButton = document.getElementById('playback_sub');
            const prefButton = document.getElementById('pref_sub');
            const storageButton = document.getElementById('storage_sub');
            const DevToolsButton = document.getElementById('dev_sub');

            playbackButton.addEventListener("click", function (event) {
                showPlaybackTab()
            });

            prefButton.addEventListener("click", function (event) {
                showPreferencesTab()
            });

            storageButton.addEventListener("click", function (event) {
                showStorageTab();
                updateMemoryUsage();
                draftsCounter()
            });

            DevToolsButton.addEventListener("click", function (event) {
                showDevToolsTab()
            });


            // shortcuts: keyboard e numpad
            const keyboardButton = document.getElementById('op_keyboard');
            const numpadButton = document.getElementById('op_numpad');

            keyboardButton.addEventListener("click", function (event) {
                showKeyboardTab()
            });

            numpadButton.addEventListener("click", function (event) {
                showNumpadTab()
            });


        });

        function showPreferencesTab() {
            const prefButton = document.getElementById('pref_sub');
            const playbackButton = document.getElementById('playback_sub');
            const storageButton = document.getElementById('storage_sub');
            const DevToolsButton = document.getElementById('dev_sub');
        
            const prefContainer = document.getElementById('preferences_menu');
            const playbackContainer = document.getElementById('playback_menu');
            const storageContainer = document.getElementById('storage_menu');
            const DevToolsContainer = document.getElementById('devtools_menu');
        
            prefButton.className = 'impr_menu_true'
            playbackButton.className = 'impr_menu_false'
            storageButton.className = 'impr_menu_false'
            DevToolsButton.className = 'impr_menu_false'
        
            prefContainer.style = 'display:block'
            playbackContainer.style = 'display:none'
            storageContainer.style = 'display:none'
            DevToolsContainer.style = 'display:none'

            resetLineIssues();
            closeContainers();
        }

        function showPlaybackTab() {
            const prefButton = document.getElementById('pref_sub');
            const playbackButton = document.getElementById('playback_sub');
            const storageButton = document.getElementById('storage_sub');
            const DevToolsButton = document.getElementById('dev_sub');
        
            const prefContainer = document.getElementById('preferences_menu');
            const playbackContainer = document.getElementById('playback_menu');
            const storageContainer = document.getElementById('storage_menu');
            const DevToolsContainer = document.getElementById('devtools_menu');
        
            prefButton.className = 'impr_menu_false'
            playbackButton.className = 'impr_menu_true'
            storageButton.className = 'impr_menu_false'
            DevToolsButton.className = 'impr_menu_false'
        
            prefContainer.style = 'display:none'
            playbackContainer.style = 'display:block'
            storageContainer.style = 'display:none'
            DevToolsContainer.style = 'display:none'

            resetLineIssues();
            closeContainers();
        }

        function showStorageTab() {
            const prefButton = document.getElementById('pref_sub');
            const playbackButton = document.getElementById('playback_sub');
            const storageButton = document.getElementById('storage_sub');
            const DevToolsButton = document.getElementById('dev_sub');
        
            const prefContainer = document.getElementById('preferences_menu');
            const playbackContainer = document.getElementById('playback_menu');
            const storageContainer = document.getElementById('storage_menu');
            const DevToolsContainer = document.getElementById('devtools_menu');
        
            prefButton.className = 'impr_menu_false'
            playbackButton.className = 'impr_menu_false'
            storageButton.className = 'impr_menu_true'
            DevToolsButton.className = 'impr_menu_false'
        
            prefContainer.style = 'display:none'
            playbackContainer.style = 'display:none'
            storageContainer.style = 'display:block'
            DevToolsContainer.style = 'display:none'

            resetLineIssues();
            closeContainers();
        }

        function showDevToolsTab() {
            const prefButton = document.getElementById('pref_sub');
            const playbackButton = document.getElementById('playback_sub');
            const storageButton = document.getElementById('storage_sub');
            const DevToolsButton = document.getElementById('dev_sub');
        
            const prefContainer = document.getElementById('preferences_menu');
            const playbackContainer = document.getElementById('playback_menu');
            const storageContainer = document.getElementById('storage_menu');
            const DevToolsContainer = document.getElementById('devtools_menu');
        
            prefButton.className = 'impr_menu_false'
            playbackButton.className = 'impr_menu_false'
            storageButton.className = 'impr_menu_false'
            DevToolsButton.className = 'impr_menu_true'
        
            prefContainer.style = 'display:none'
            playbackContainer.style = 'display:none'
            storageContainer.style = 'display:none'
            DevToolsContainer.style = 'display:block'

            resetLineIssues();
            closeContainers();
        }


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
                
                // Fecha o elemento 'add_to_dictionary_svg' dentro do contêiner
                const svgElement = container.querySelector('.add_to_dictionary_svg');
                if (svgElement) {
                    svgElement.style.display = 'none';
                }
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
                const svgElement = container.querySelector('.add_to_dictionary_svg');
        
                if (svgElement) {
                    svgElement.style.display = 'block';
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
            const regex = new RegExp('(^|\\s|[,.;:!?\\-¿¡(])' + escapedTerm + '(?=\\s|[,.;:!?\\-¿¡)\\-]|$)', 'g');
            content = content.replace(regex, '$1' + cleanCorrection);
        
            // Define o conteúdo do textarea como o texto modificado
            editor.value = content;

            saveDraft()
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

            autoFormat();
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

            autoFormat();
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

                if (transferPlaybackToggle === true && currentSongId !== '' && currentDeviceId === deviceId && altDeviceId) {
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
            checkTextarea();
            saveDraft();
        }

        function pasteFromClipboard() {
            const textArea = document.getElementById('editor');

            if (textArea.value.trim() !== '') {
                notification('Please delete the current transcript before pasting a new one')
                return
            }

            navigator.clipboard.readText().then(function(text) {
                const textArea = document.getElementById('editor');
                textArea.value = text;
                checkTextarea()
                updateSidebar()
                addToUndoStack();

                const transferPlaybackToggle = isPasteTransferTottleChecked()
                const accessToken = localStorage.getItem('accessToken');

                if (transferPlaybackToggle === true && currentSongId !== '' && currentDeviceId !== deviceId) {
                    transferPlayback(accessToken, deviceId)
                    notification('Content pasted and playback transferred successfully!');
                } else {
                    notification('Pasted from clipboard!');
                }

                saveDraft(text)
                
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
                        popupDescription.textContent = "The people who made this happen 🚀";

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

        // Adiciona os valores manualmente antes dos dados do servidor
        const lfVersionElement = document.createElement('p');
        lfVersionElement.innerHTML = `<span>LyricsFormatter version: </span><span class="bold">${lf_version}</span>`;
        serverInfoContainer.appendChild(lfVersionElement);

        const lfReleaseDateElement = document.createElement('p');
        lfReleaseDateElement.innerHTML = `<span>Release date: </span><span class="bold">${lf_release_date}</span>`;
        serverInfoContainer.appendChild(lfReleaseDateElement);

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
            const devButton = document.getElementById('dev_sub');
            const devMode = localStorage.getItem('devMode') === 'true'; // Obtém o estado atual do modo de desenvolvimento

            // Alterna entre exibir e ocultar a div
            if (devMode) {
                devButton.style.display = 'none';
            } else {
                devButton.style.display = 'flex';
            }

            // Salva a escolha em cache invertendo o valor atual
            localStorage.setItem('devMode', (!devMode).toString());
        }

        // Carrega a escolha do modo de desenvolvimento do cache e exibe/oculta a div conforme necessário
        function loadDevMode() {
            const devMode = localStorage.getItem('devMode') === 'true';
            const devButton = document.getElementById('dev_sub');

            if (devMode) {
                devButton.style.display = 'flex';
            } else {
                devButton.style.display = 'none';
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
                } else if (ltExportParam === '0') {
                    document.getElementById('lfExportToggle').checked = false;
                }
            }
        }


        function displayTokenField() {
            checked = isMxmPersonalTokenToggleChecked()
            if (checked === true) {
                document.getElementById('mxm_token_field').style.display = 'flex'
            } else {
                document.getElementById('mxm_token_field').style.display = 'none'
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

        function displayPlaybackTabToggle() {
            checked = isDisplayPlaybackToggleChecked()
            if (checked === true) {
                showSpMenuDiv();
            } else {
                hideSpMenuDiv();
            }
        }

        // Função para exibir a div
        function showSpMenuDiv() {
            const spMenu = document.getElementById('playback_sub');
            const showPlaybackTabToggle = document.getElementById('displayPlaybackTabToggle');
            spMenu.style.display = 'flex';
            localStorage.setItem('spMenu', 'true');
            showPlaybackTabToggle.checked = true;
            document.getElementById('unavailable_overlay').style = 'z-index:-1'
        }

        // Função para ocultar a div
        function hideSpMenuDiv() {
            const spMenu = document.getElementById('playback_sub');
            const showPlaybackTabToggle = document.getElementById('displayPlaybackTabToggle');
            spMenu.style.display = 'none';
            localStorage.setItem('spMenu', 'false');
            showPlaybackTabToggle.checked = false;
            document.getElementById('unavailable_overlay').style = 'z-index:1';
            document.getElementById('saveDraft').checked = false;
            checkContent()
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

/* FUNÇÕES PARA IMPORTAR E EXPORTAR O DICIONÁRIO */

    // importa o arquivo do dicionário
    function importDictionary() {
        // Abre a biblioteca do PC filtrando apenas arquivos JSON
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
    
        input.onchange = function (event) {
            const file = event.target.files[0];
            const reader = new FileReader();
    
            reader.onload = function () {
                try {
                    const newData = JSON.parse(reader.result);
    
                    // Verifica se o arquivo tem a estrutura correta
                    if (isValidDictionary(newData)) {
                        let dictionaryCache = localStorage.getItem('dictionaryCache');
                        if (dictionaryCache) {
                            dictionaryCache = JSON.parse(dictionaryCache);
                            // Mescla os dados existentes com os novos dados
                            for (const lang in newData) {
                                if (newData.hasOwnProperty(lang)) {
                                    if (dictionaryCache.hasOwnProperty(lang)) {
                                        Object.assign(dictionaryCache[lang], newData[lang]);
                                    } else {
                                        dictionaryCache[lang] = newData[lang];
                                    }
                                }
                            }
                        } else {
                            dictionaryCache = newData;
                        }
    
                        // Salva os dados mesclados em cache
                        localStorage.setItem('dictionaryCache', JSON.stringify(dictionaryCache));
                        notification('Dictionary imported successfully!');
                        updateMemoryUsage()
                    } else {
                        notification('The file does not have the correct structure');
                    }
                } catch (error) {
                    notification('Error reading the file');
                    console.error(error);
                }
            };
    
            reader.readAsText(file);
        };
    
        input.click();
    }

    // verifica se os dados do arquivo são válidos na estrutura esperada
    function isValidDictionary(data) {
        // Verifica se o objeto possui a estrutura correta
        if (!data || typeof data !== 'object') {
            return false;
        }
    
        // Verifica se as chaves correspondem a idiomas suportados
        for (const key of Object.keys(data)) {
            if (!getLanguageFullName(key)) {
                return false;
            }
        }
    
        // Verifica se cada valor dentro do objeto é um par chave-valor simples
        for (const languageData of Object.values(data)) {
            for (const value of Object.values(languageData)) {
                if (typeof value !== 'string') {
                    return false; // Valor não é uma string
                }
            }
        }
    
        return true; // Estrutura válida
    }
    
    // verifica se o idioma(s) do dicionário são suportados pela versão atual do LF
    function isValidLanguageData(languageData) {
        // Verifica se cada valor dentro do objeto é uma string
        for (const key in languageData) {
            if (typeof languageData[key] !== 'string') {
                return false; // Valor não é uma string
            }
        }
    
        return true; // Dados da linguagem válidos
    }

    // exporta o dicionário em um arquivo backup
    function exportDictionary() {
        const dictionaryCache = localStorage.getItem('dictionaryCache');
    
        if (dictionaryCache) {
            const data = JSON.parse(dictionaryCache);
            const filename = `lf${lf_version}_dictionarybackup_${getCurrentDate()}.json`;
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
    
            // Cria um link temporário para fazer o download do arquivo
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
    
            notification('Dictionary exported successfully!');
        } else {
            notification('No dictionary data found.');
        }
    }

    // obtem a data atual
    function getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

/* ****************************************** */

/* FUNÇÕES PARA GERENCIAR OS DADOS EM CACHÊ */

    // limpa apenas os toggles de preferências
    function deletePreferences() {
        localStorage.removeItem('localHostToggle');
        localStorage.removeItem('lfExportToggle');
        localStorage.removeItem('maxUndoRedoActions');
        localStorage.removeItem('pasteTransferToggle');
        localStorage.removeItem('spAutoPlay');
        localStorage.removeItem('autoCapToggle');
        localStorage.removeItem('copyTransferToggle');
        localStorage.removeItem('characterCounterToggle');
        localStorage.removeItem('forwardValue');
        localStorage.removeItem('rewindValue');
        localStorage.removeItem('draftDuration');
        localStorage.removeItem('draftLimit');
        localStorage.removeItem('autoFormatToggle');
        localStorage.removeItem('saveDraft');
        localStorage.removeItem('devMode');
        localStorage.removeItem('autoSuggestion');
        localStorage.removeItem('selectedLanguage');
        addParamToURL('language', 'null')

        updateMemoryUsage()
        notification('Preferences deleted successfully!');
    }

    // limpa todos os dados em cachê (inclusive rascunhos)
    function clearCache() {
        localStorage.clear();
        cancelClearCache()
        updateMemoryUsage()
        draftsCounter()
        notification('Cache cleared successfully!');
    }

    // Adiciona um event listener para capturar o clique no corpo do documento
    document.body.addEventListener('click', function(event) {
        const confirmPopup = document.querySelector('.confirm_popup');
        // Verifica se o clique ocorreu fora do popup
        if (confirmPopup && !confirmPopup.contains(event.target)) {
            confirmPopup.remove(); // Fecha o popup
        }
    });

    function confirmClearCache() {
        const confirmPopup = document.createElement('div');
        confirmPopup.innerHTML = `
            <div class="confirm_popup">
                <p>Are you sure you want to delete all local data? This can't be undone! 😕</p>
                <div class="button_container">
                    <div class="cancel_button" onclick="cancelClearCache()">Cancel</div>
                    <div class="confirm_button" onclick="clearCache()">Confirm</div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmPopup);
    }
    
    function cancelClearCache() {
        const confirmPopup = document.querySelector('.confirm_popup');
        if (confirmPopup) {
            confirmPopup.remove();
        }
    }

/* ****************************************** */

/* IMPORTAR OU EXPORTAR TODOS OS DADOS EM CACHÊ (OCULTO) */
    function importCacheData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
    
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.readAsText(file);
    
            reader.onload = (event) => {
                const data = event.target.result;
                try {
                    const parsedData = JSON.parse(data);
                    for (const key in parsedData) {
                        localStorage.setItem(key, parsedData[key]);
                    }
                    notification('Cache data imported successfully!');
                    updateMemoryUsage()
                    draftsCounter()
                } catch (error) {
                    notification('Error importing cache data: Invalid JSON format.');
                }
            };
    
            reader.onerror = () => {
                notification('Error reading file.');
            };
        };
    
        input.click();
    }

    function exportCacheData() {
        const cacheData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            cacheData[key] = value;
        }
    
        if (Object.keys(cacheData).length > 0) {
            const filename = `lf${lf_version}_localdata_${getCurrentDate()}.json`;
            const json = JSON.stringify(cacheData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
    
            // Cria um link temporário para fazer o download do arquivo
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
    
            notification('Cache data exported successfully!');
        } else {
            notification('No cache data found.');
        }
    }


/* ****************************************** */

/* ATUALIZA OS CONTADORES DE MEMÓRIA  */

    function updateMemoryUsage() {
        totalUsage = calculateCacheSize();
        dictionaryUsage = calculateCacheSize('dictionaryCache');
        draftUsage = calculateCacheSize('localDrafts');

        document.getElementById('memory_usage').textContent = totalUsage;
        document.getElementById('dictionary_memory').textContent = `Memory usage: ${dictionaryUsage}`;
        document.getElementById('draft_memory').textContent = `Memory usage: ${draftUsage}`;
    }

    function draftsCounter() {
        var localDrafts = localStorage.getItem('localDrafts');
        var totalLimit = localStorage.getItem('draftLimit');
        var counter = 0;

        if (localDrafts) {
            var draftsObject = JSON.parse(localDrafts);
            counter = Object.keys(draftsObject).length;
        }

        if (totalLimit === '0') {
            document.getElementById('draft_items').textContent = `Total drafts: ${counter}`;
        } else {
            document.getElementById('draft_items').textContent = `Total drafts: ${counter} / ${totalLimit}`;
        }
    }

function calculateCacheSize(hostID) {
    let totalSize = 0;

    // Se hostID for fornecido, calcula apenas para esse ID
    if (hostID) {
        const hostData = localStorage.getItem(hostID);
        if (hostData) {
            // Usando Blob para calcular o tamanho do valor
            const blob = new Blob([hostData]);
            totalSize += blob.size;
        }
    } else {
        // Calcula o tamanho total de todos os dados no armazenamento local
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            // Usando JSON.stringify para calcular o tamanho do valor
            const sizeInBytes = new Blob([JSON.stringify(value)]).size;
            totalSize += sizeInBytes;
        }
    }

    // Convertendo bytes para KB ou MB
    if (totalSize < 1024) {
        return totalSize.toFixed(2) + ' bytes';
    } else if (totalSize < 1048576) { // 1024 * 1024 (1 MB)
        return (totalSize / 1024).toFixed(2) + ' KB';
    } else {
        return (totalSize / 1048576).toFixed(2) + ' MB';
    }
}

/* ****************************************** */

/* POPUP DE GERENCIAMENTO DO DICIONÁRIO  */

    function showDictionaryManagement() {
        // Salvando o conteúdo atual da settings_tab
        var originalContent = document.querySelector('.settings_tab').innerHTML;

        // Criando o conteúdo da tela de gerenciamento do dicionário
        var dictionaryManagementContent = `
            <div class="dictionary_management">
                <!-- Conteúdo da tela de gerenciamento do dicionário -->
                <button onclick="showSettingsMenu()">Voltar</button>
            </div>
        `;

        // Substituindo o conteúdo da settings_tab pelo conteúdo da tela de gerenciamento do dicionário
        document.querySelector('.settings_tab').innerHTML = dictionaryManagementContent;
    }

    function showSettingsMenu() {
        // Restaurando o conteúdo original da settings_tab
        var originalContent = document.querySelector('.settings_tab').innerHTML;
        
        // Substituindo o conteúdo da settings_tab pelo conteúdo original
        document.querySelector('.settings_tab').innerHTML = originalContent;
    }


/* ****************************************** */

/* SISTEMA DE GERENCIAMENTO DE RASCUNHOS  */

    function checkExpiredDrafts() {
        var draftDuration = localStorage.getItem('draftDuration');
        if (!draftDuration || draftDuration === '0') {
            return; // Se não houver configuração de duração, ou caso ela seja '0' (nunca), não faça nada
        }
        draftDuration = parseInt(draftDuration);

        var localDrafts = localStorage.getItem('localDrafts');
        if (!localDrafts) {
            return; // Não há rascunhos salvos
        }

        var draftsObject = JSON.parse(localDrafts);
        var currentDateTime = new Date();

        for (var key in draftsObject) {
            if (draftsObject.hasOwnProperty(key)) {
                var draftDateTime = new Date(draftsObject[key].datetime);
                var diffTime = Math.abs(currentDateTime - draftDateTime);
                var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > draftDuration) {
                    delete draftsObject[key];
                }
            }
        }

        // Atualiza os rascunhos no localStorage
        localStorage.setItem('localDrafts', JSON.stringify(draftsObject));
    }

    function saveDraft(text) {

        saveDraftToggle = isDraftChecked()
        if (!saveDraftToggle) {
            return
        }

        var editorValue = document.getElementById('editor').value;
        var draftStatus = document.getElementById('draft_status');
    
        if (editorValue === '') {
            return;
        }
    
        if (currentSongId === '' || currentIsrc === '') {
            return;
        }
    
        draftStatus.textContent = 'Saving draft...';
    
        // Verifica se há algum draft salvo
        var localDrafts = localStorage.getItem('localDrafts');
        var draftsObject = localDrafts ? JSON.parse(localDrafts) : {};
    
        // Adiciona data e hora atual
        var currentDateTime = new Date().toISOString();
    
        // Verifica se o rascunho já existe
        var existingDraft = draftsObject[currentIsrc];
    
        // Se o rascunho existir e createOriginalTranscription for verdadeiro,
        // verifica se o campo original_transcription já está presente e mantém seu valor
        if (existingDraft) {
            if (text && existingDraft.original_transcription) {
                var originalTranscription = existingDraft.original_transcription;
            } else {
                if (existingDraft.original_transcription) {
                    var originalTranscription = existingDraft.original_transcription;
                } else {
                    var originalTranscription = '';
                }
            }
        } else {
            if (text) {
                var originalTranscription = text;
            } else {
                var originalTranscription = '';
            }
        }
    
        // Atualiza ou adiciona o draft atual
        var draft = {
            "track_name": trackName,
            "artist_name": artistName,
            "track_id": currentSongId,
            "datetime": currentDateTime,
            "transcription": editorValue,
            "original_transcription": originalTranscription
        };
    
        draftsObject[currentIsrc] = draft;
    
        // Verifica o limite de rascunhos
        var draftLimit = localStorage.getItem('draftLimit') || 100; // Limite padrão se não estiver definido
    
        // Verifica se o limite é ilimitado
        if (draftLimit !== '0') {
            draftLimit = parseInt(draftLimit);
    
            var draftKeys = Object.keys(draftsObject);
            if (draftKeys.length > draftLimit) {
                // Encontra o item mais antigo com base na datetime
                var oldestKey = draftKeys.reduce(function (a, b) {
                    return draftsObject[a].datetime < draftsObject[b].datetime ? a : b;
                });
    
                // Exclui o item mais antigo
                delete draftsObject[oldestKey];
            }
        }
    
        // Salva o draft no localStorage
        localStorage.setItem('localDrafts', JSON.stringify(draftsObject));
        // Define a função para atualizar o textContent após 1.5 segundos
        setTimeout(function () {
            draftStatus.textContent = 'Draft saved';
        }, 1500);
    
        // Define a função para atualizar o textContent após 1.5 segundos
        setTimeout(function () {
            draftStatus.textContent = '';
        }, 5000);
    }

    function recoverDraft() {
        var localDrafts = localStorage.getItem('localDrafts');
        var draftsObject = localDrafts ? JSON.parse(localDrafts) : {};

        var currentDraft = draftsObject[currentIsrc];

        if (currentDraft && currentDraft.transcription) {
            // Exibindo o popup
            document.getElementById('draft_content').style.display = 'flex';
            document.getElementById('draft_overlay').style.display = 'block';

            // Exibir a data se estiver disponível
            if (currentDraft.datetime) {
                var draftSavedDate = new Date(currentDraft.datetime);
                var formattedDate = draftSavedDate.toLocaleString(); // Você pode personalizar o formato conforme necessário
                document.getElementById('draft_saved_date').textContent = "Saved on: " + formattedDate;
            }
        }
    }
    function recoverConfirmed() {
        var localDrafts = localStorage.getItem('localDrafts');
        var draftsObject = localDrafts ? JSON.parse(localDrafts) : {};
        var currentDraft = draftsObject[currentIsrc];

        // Recuperando o rascunho
        document.getElementById('editor').value = currentDraft.transcription;
        notification("Draft successfully recovered!");

        updateSidebar()
        // Escondendo o popup
        document.getElementById('draft_content').style.display = 'none';
        document.getElementById('draft_overlay').style.display = 'none';
    }

    function discardDraft() {
        // Descartando o rascunho
        notification("Draft discarded");

        // Escondendo o popup
        document.getElementById('draft_content').style.display = 'none';
        document.getElementById('draft_overlay').style.display = 'none';
    }

    function autoSave() {
        const editor = document.getElementById('editor');
        const content = editor.value;

        if (content.trim() === '') {
            return;
        } else {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(saveDraft, 3000);
        }
    }

    function manageDictionary() {
        document.getElementById('settings_popup').style.display = 'none';
        document.getElementById('manage_dictionary_popup').style.display = 'block';
        populateDictionaryPopupFromCache()
    }

    function closeManageDictionary() {
        document.getElementById('settings_popup').style.display = 'block';
        document.getElementById('manage_dictionary_popup').style.display = 'none';
    }

    function manageDraft() {
        document.getElementById('settings_popup').style.display = 'none';
        document.getElementById('manage_draft_popup').style.display = 'block';
        populateDraftsPopupFromCache()
    }

    function closeManageDraft() {
        document.getElementById('settings_popup').style.display = 'block';
        document.getElementById('manage_draft_popup').style.display = 'none';
    }

    function diffcheckerPopup() {
        document.getElementById('manage_draft_popup').style.display = 'none';
        document.getElementById('diffchecker_popup').style.display = 'block';
        document.getElementById('diff_link_div').style.display = 'none'; // oculta o output do link
        document.getElementById('get_diff_link').style.display = 'flex'
    }

    function closeDiff() {
        document.getElementById('manage_draft_popup').style.display = 'block';
        document.getElementById('diffchecker_popup').style.display = 'none';
        document.getElementById('diff_link_div').style.display = 'none';
        document.getElementById('get_diff_link').style.display = 'flex'
    }


/* ****************************************** */

/* POPULA AS TABELAS DO DICIONÁRIO COM OS DADOS EM CACHÊ  */

    function populateDictionaryPopupFromCache() {
        // Recupera os dados do cache
        const cacheData = localStorage.getItem('dictionaryCache');

        // Verifica se existem dados no cache
        if (cacheData) {
            const dictionaryCache = JSON.parse(cacheData);

            // Obtém o elemento popup_content dentro do manage_dictionary_popup
            const popupContent = document.querySelector('#manage_dictionary_popup .popup_content');

            // Cria a tabela
            const table = document.createElement('table');
            table.setAttribute('border', '1');
            table.setAttribute('id', 'dictionary_table');

            // Cria o cabeçalho da tabela
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th onclick="sortTable(0, 'dictionary_table')">Content</th>
                    <th onclick="sortTable(1, 'dictionary_table')">Description</th>
                    <th onclick="sortTable(2, 'dictionary_table')">Language</th>
                    <th>Delete</th>
                </tr>
            `;
            table.appendChild(thead);

            // Cria o corpo da tabela
            const tbody = document.createElement('tbody');

            // Preenche o corpo da tabela com os dados do cache
            Object.keys(dictionaryCache).forEach(language => {
                Object.entries(dictionaryCache[language]).forEach(([word, description]) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${word}</td>
                        <td>${description}</td>
                        <td>${language}</td>
                        <td><span class="delete_button" onclick="deleteRow(this)">
                            <svg fill="#ffffff" width="25px" height="25px" viewBox="-3.5 0 19 19" xmlns="http://www.w3.org/2000/svg" class="cf-icon-svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.383 13.644A1.03 1.03 0 0 1 9.928 15.1L6 11.172 2.072 15.1a1.03 1.03 0 1 1-1.455-1.456l3.928-3.928L.617 5.79a1.03 1.03 0 1 1 1.455-1.456L6 8.261l3.928-3.928a1.03 1.03 0 0 1 1.455 1.456L7.455 9.716z"></path></g></svg>
                        </span></td>
                    `;
                    tbody.appendChild(row);
                });
            });

            // Adiciona o corpo da tabela à tabela
            table.appendChild(tbody);
            

            // Limpa o conteúdo atual do popup_content
            popupContent.innerHTML = '';

            // Adiciona a tabela ao popup_content
            popupContent.appendChild(table);

            // Atualiza o número total de linhas
            const rowCount = tbody.querySelectorAll('tr').length;
            const dictionaryRows = document.getElementById('dictionary_rows');
            dictionaryRows.textContent = `Total rows: ${rowCount}`;
        }
    }

    function deleteRow(element) {
        // Obtém a linha pai do botão "Delete"
        const row = element.closest('tr');

        // Obtém a palavra e o idioma da linha
        const word = row.cells[0].textContent;
        const language = row.cells[2].textContent;

        // Recupera os dados do cache
        const cacheData = localStorage.getItem('dictionaryCache');

        // Verifica se existem dados no cache
        if (cacheData) {
            const dictionaryCache = JSON.parse(cacheData);

            // Verifica se a palavra existe no cache para o idioma correspondente
            if (dictionaryCache[language] && dictionaryCache[language][word]) {
                // Remove a entrada do cache
                delete dictionaryCache[language][word];

                // Atualiza os dados no cache
                localStorage.setItem('dictionaryCache', JSON.stringify(dictionaryCache));

                // Remove a linha da tabela
                row.parentNode.removeChild(row);

                // Atualiza a contagem de linhas
                const rowCount = document.querySelectorAll('#manage_dictionary_popup tbody tr').length;
                const dictionaryRows = document.getElementById('dictionary_rows');
                dictionaryRows.textContent = `Total rows: ${rowCount}`;

                updateMemoryUsage()
            }
        }
    }

/* ****************************************** */

/* POPULA AS TABELAS DO RASCUNHO COM OS DADOS EM CACHÊ  */

function populateDraftsPopupFromCache() {
    // Recupera os dados do cache
    const cacheData = localStorage.getItem('localDrafts');

    // Verifica se existem dados no cache
    if (cacheData) {
        const draftsCache = JSON.parse(cacheData);

        // Obtém o elemento popup_content dentro do manage_drafts_popup
        const popupContent = document.querySelector('#manage_draft_popup .popup_content');

        // Cria a tabela
        const table = document.createElement('table');
        table.setAttribute('border', '1');
        table.setAttribute('id', 'draft_table');

        // Cria o cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th onclick="sortTable(0, 'draft_table')">Date</th>
                <th onclick="sortTable(1, 'draft_table')">Track Name</th>
                <th onclick="sortTable(2, 'draft_table')">Artist Name</th>
                <th>Play</th>
                <th>Original</th>
                <th>Final</th>
                <th>Compare</th>
                <th>Export</th>
                <th>Delete</th>
            </tr>
        `;
        table.appendChild(thead);

        // Cria o corpo da tabela
        const tbody = document.createElement('tbody');

        // Preenche o corpo da tabela com os dados do cache
        Object.keys(draftsCache).forEach(isrcCode => {
            const draft = draftsCache[isrcCode];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(draft.datetime).toLocaleDateString()}</td>
                <td>${draft.track_name}</td>
                <td>${draft.artist_name}</td>
                <td><span title='Play "${draft.track_name}" by "${draft.artist_name}"' class="table_svg_icon" onclick="draftStartPlayback('${draft.track_id}')">
                    <svg fill="#ffffff" width="25px" height="25px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.92 24.096q0 1.088 0.928 1.728 0.512 0.288 1.088 0.288 0.448 0 0.896-0.224l16.16-8.064q0.48-0.256 0.8-0.736t0.288-1.088-0.288-1.056-0.8-0.736l-16.16-8.064q-0.448-0.224-0.896-0.224-0.544 0-1.088 0.288-0.928 0.608-0.928 1.728v16.16z"></path> </g></svg>
                </span></td>
                <td>${draft.original_transcription ? 
                        `<span title="Copy transcription" class="table_svg_icon" onclick="copyTranscriptionFromCache('original_transcription', '${isrcCode}')">
                            <svg width="25px" height="25px" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5H8.25005ZM9.00005 8.267H9.75006L9.75004 8.26283L9.00005 8.267ZM9.93892 5.96432L10.4722 6.49171L9.93892 5.96432ZM12.2311 5V4.24999L12.2269 4.25001L12.2311 5ZM16.269 5L16.2732 4.25H16.269V5ZM18.5612 5.96432L18.0279 6.49171V6.49171L18.5612 5.96432ZM19.5 8.267L18.75 8.26283V8.267H19.5ZM19.5 12.233H18.75L18.7501 12.2372L19.5 12.233ZM18.5612 14.5357L18.0279 14.0083L18.5612 14.5357ZM16.269 15.5V16.25L16.2732 16.25L16.269 15.5ZM16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5C15.25 15.9142 15.5858 16.25 16 16.25V14.75ZM9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5C9.75005 8.08579 9.41426 7.75 9.00005 7.75V9.25ZM8.73105 8.5V7.74999L8.72691 7.75001L8.73105 8.5ZM6.43892 9.46432L6.97218 9.99171L6.43892 9.46432ZM5.50005 11.767H6.25006L6.25004 11.7628L5.50005 11.767ZM5.50005 15.734L6.25005 15.7379V15.734H5.50005ZM8.73105 19L8.72691 19.75H8.73105V19ZM12.769 19V19.75L12.7732 19.75L12.769 19ZM15.0612 18.0357L14.5279 17.5083L15.0612 18.0357ZM16 15.733H15.25L15.2501 15.7372L16 15.733ZM16.75 15.5C16.75 15.0858 16.4143 14.75 16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5H16.75ZM9.00005 7.75C8.58584 7.75 8.25005 8.08579 8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25V7.75ZM12.7691 8.5L12.7732 7.75H12.7691V8.5ZM15.0612 9.46432L15.5944 8.93694V8.93694L15.0612 9.46432ZM16.0001 11.767L15.2501 11.7628V11.767H16.0001ZM15.2501 15.5C15.2501 15.9142 15.5858 16.25 16.0001 16.25C16.4143 16.25 16.7501 15.9142 16.7501 15.5H15.2501ZM9.75005 8.5V8.267H8.25005V8.5H9.75005ZM9.75004 8.26283C9.74636 7.60005 10.0061 6.96296 10.4722 6.49171L9.40566 5.43694C8.65985 6.19106 8.24417 7.21056 8.25006 8.27117L9.75004 8.26283ZM10.4722 6.49171C10.9382 6.02046 11.5724 5.75365 12.2352 5.74999L12.2269 4.25001C11.1663 4.25587 10.1515 4.68282 9.40566 5.43694L10.4722 6.49171ZM12.2311 5.75H16.269V4.25H12.2311V5.75ZM16.2649 5.74999C16.9277 5.75365 17.5619 6.02046 18.0279 6.49171L19.0944 5.43694C18.3486 4.68282 17.3338 4.25587 16.2732 4.25001L16.2649 5.74999ZM18.0279 6.49171C18.494 6.96296 18.7537 7.60005 18.7501 8.26283L20.25 8.27117C20.2559 7.21056 19.8402 6.19106 19.0944 5.43694L18.0279 6.49171ZM18.75 8.267V12.233H20.25V8.267H18.75ZM18.7501 12.2372C18.7537 12.8999 18.494 13.537 18.0279 14.0083L19.0944 15.0631C19.8402 14.3089 20.2559 13.2894 20.25 12.2288L18.7501 12.2372ZM18.0279 14.0083C17.5619 14.4795 16.9277 14.7463 16.2649 14.75L16.2732 16.25C17.3338 16.2441 18.3486 15.8172 19.0944 15.0631L18.0279 14.0083ZM16.269 14.75H16V16.25H16.269V14.75ZM9.00005 7.75H8.73105V9.25H9.00005V7.75ZM8.72691 7.75001C7.6663 7.75587 6.65146 8.18282 5.90566 8.93694L6.97218 9.99171C7.43824 9.52046 8.07241 9.25365 8.73519 9.24999L8.72691 7.75001ZM5.90566 8.93694C5.15985 9.69106 4.74417 10.7106 4.75006 11.7712L6.25004 11.7628C6.24636 11.1001 6.50612 10.463 6.97218 9.99171L5.90566 8.93694ZM4.75005 11.767V15.734H6.25005V11.767H4.75005ZM4.75006 15.7301C4.73847 17.9382 6.51879 19.7378 8.72691 19.75L8.7352 18.25C7.35533 18.2424 6.2428 17.1178 6.25004 15.7379L4.75006 15.7301ZM8.73105 19.75H12.769V18.25H8.73105V19.75ZM12.7732 19.75C13.8338 19.7441 14.8486 19.3172 15.5944 18.5631L14.5279 17.5083C14.0619 17.9795 13.4277 18.2463 12.7649 18.25L12.7732 19.75ZM15.5944 18.5631C16.3402 17.8089 16.7559 16.7894 16.75 15.7288L15.2501 15.7372C15.2537 16.3999 14.994 17.037 14.5279 17.5083L15.5944 18.5631ZM16.75 15.733V15.5H15.25V15.733H16.75ZM9.00005 9.25H12.7691V7.75H9.00005V9.25ZM12.7649 9.24999C13.4277 9.25365 14.0619 9.52046 14.5279 9.99171L15.5944 8.93694C14.8486 8.18282 13.8338 7.75587 12.7732 7.75001L12.7649 9.24999ZM14.5279 9.99171C14.994 10.463 15.2537 11.1001 15.2501 11.7628L16.75 11.7712C16.7559 10.7106 16.3402 9.69106 15.5944 8.93694L14.5279 9.99171ZM15.2501 11.767V15.5H16.7501V11.767H15.2501Z" fill="#ffffff"></path> </g></svg>
                        </span>` : '-'}</td>
                <td><span title="Copy transcription" class="table_svg_icon" onclick="copyTranscriptionFromCache('transcription', '${isrcCode}')">
                    <svg width="25px" height="25px" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5H8.25005ZM9.00005 8.267H9.75006L9.75004 8.26283L9.00005 8.267ZM9.93892 5.96432L10.4722 6.49171L9.93892 5.96432ZM12.2311 5V4.24999L12.2269 4.25001L12.2311 5ZM16.269 5L16.2732 4.25H16.269V5ZM18.5612 5.96432L18.0279 6.49171V6.49171L18.5612 5.96432ZM19.5 8.267L18.75 8.26283V8.267H19.5ZM19.5 12.233H18.75L18.7501 12.2372L19.5 12.233ZM18.5612 14.5357L18.0279 14.0083L18.5612 14.5357ZM16.269 15.5V16.25L16.2732 16.25L16.269 15.5ZM16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5C15.25 15.9142 15.5858 16.25 16 16.25V14.75ZM9.00005 9.25C9.41426 9.25 9.75005 8.91421 9.75005 8.5C9.75005 8.08579 9.41426 7.75 9.00005 7.75V9.25ZM8.73105 8.5V7.74999L8.72691 7.75001L8.73105 8.5ZM6.43892 9.46432L6.97218 9.99171L6.43892 9.46432ZM5.50005 11.767H6.25006L6.25004 11.7628L5.50005 11.767ZM5.50005 15.734L6.25005 15.7379V15.734H5.50005ZM8.73105 19L8.72691 19.75H8.73105V19ZM12.769 19V19.75L12.7732 19.75L12.769 19ZM15.0612 18.0357L14.5279 17.5083L15.0612 18.0357ZM16 15.733H15.25L15.2501 15.7372L16 15.733ZM16.75 15.5C16.75 15.0858 16.4143 14.75 16 14.75C15.5858 14.75 15.25 15.0858 15.25 15.5H16.75ZM9.00005 7.75C8.58584 7.75 8.25005 8.08579 8.25005 8.5C8.25005 8.91421 8.58584 9.25 9.00005 9.25V7.75ZM12.7691 8.5L12.7732 7.75H12.7691V8.5ZM15.0612 9.46432L15.5944 8.93694V8.93694L15.0612 9.46432ZM16.0001 11.767L15.2501 11.7628V11.767H16.0001ZM15.2501 15.5C15.2501 15.9142 15.5858 16.25 16.0001 16.25C16.4143 16.25 16.7501 15.9142 16.7501 15.5H15.2501ZM9.75005 8.5V8.267H8.25005V8.5H9.75005ZM9.75004 8.26283C9.74636 7.60005 10.0061 6.96296 10.4722 6.49171L9.40566 5.43694C8.65985 6.19106 8.24417 7.21056 8.25006 8.27117L9.75004 8.26283ZM10.4722 6.49171C10.9382 6.02046 11.5724 5.75365 12.2352 5.74999L12.2269 4.25001C11.1663 4.25587 10.1515 4.68282 9.40566 5.43694L10.4722 6.49171ZM12.2311 5.75H16.269V4.25H12.2311V5.75ZM16.2649 5.74999C16.9277 5.75365 17.5619 6.02046 18.0279 6.49171L19.0944 5.43694C18.3486 4.68282 17.3338 4.25587 16.2732 4.25001L16.2649 5.74999ZM18.0279 6.49171C18.494 6.96296 18.7537 7.60005 18.7501 8.26283L20.25 8.27117C20.2559 7.21056 19.8402 6.19106 19.0944 5.43694L18.0279 6.49171ZM18.75 8.267V12.233H20.25V8.267H18.75ZM18.7501 12.2372C18.7537 12.8999 18.494 13.537 18.0279 14.0083L19.0944 15.0631C19.8402 14.3089 20.2559 13.2894 20.25 12.2288L18.7501 12.2372ZM18.0279 14.0083C17.5619 14.4795 16.9277 14.7463 16.2649 14.75L16.2732 16.25C17.3338 16.2441 18.3486 15.8172 19.0944 15.0631L18.0279 14.0083ZM16.269 14.75H16V16.25H16.269V14.75ZM9.00005 7.75H8.73105V9.25H9.00005V7.75ZM8.72691 7.75001C7.6663 7.75587 6.65146 8.18282 5.90566 8.93694L6.97218 9.99171C7.43824 9.52046 8.07241 9.25365 8.73519 9.24999L8.72691 7.75001ZM5.90566 8.93694C5.15985 9.69106 4.74417 10.7106 4.75006 11.7712L6.25004 11.7628C6.24636 11.1001 6.50612 10.463 6.97218 9.99171L5.90566 8.93694ZM4.75005 11.767V15.734H6.25005V11.767H4.75005ZM4.75006 15.7301C4.73847 17.9382 6.51879 19.7378 8.72691 19.75L8.7352 18.25C7.35533 18.2424 6.2428 17.1178 6.25004 15.7379L4.75006 15.7301ZM8.73105 19.75H12.769V18.25H8.73105V19.75ZM12.7732 19.75C13.8338 19.7441 14.8486 19.3172 15.5944 18.5631L14.5279 17.5083C14.0619 17.9795 13.4277 18.2463 12.7649 18.25L12.7732 19.75ZM15.5944 18.5631C16.3402 17.8089 16.7559 16.7894 16.75 15.7288L15.2501 15.7372C15.2537 16.3999 14.994 17.037 14.5279 17.5083L15.5944 18.5631ZM16.75 15.733V15.5H15.25V15.733H16.75ZM9.00005 9.25H12.7691V7.75H9.00005V9.25ZM12.7649 9.24999C13.4277 9.25365 14.0619 9.52046 14.5279 9.99171L15.5944 8.93694C14.8486 8.18282 13.8338 7.75587 12.7732 7.75001L12.7649 9.24999ZM14.5279 9.99171C14.994 10.463 15.2537 11.1001 15.2501 11.7628L16.75 11.7712C16.7559 10.7106 16.3402 9.69106 15.5944 8.93694L14.5279 9.99171ZM15.2501 11.767V15.5H16.7501V11.767H15.2501Z" fill="#ffffff"></path> </g></svg>
                </span></td>
                <td>${draft.original_transcription ? 
                    `<span title="Compare versions" class="table_svg_icon" onclick="compareDrafts('${isrcCode}','original_transcription', 'transcription')">
                    <svg fill="#ffffff" width="25px" height="25px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M1,8A1,1,0,0,1,2,7H9.586L7.293,4.707A1,1,0,1,1,8.707,3.293l4,4a1,1,0,0,1,0,1.414l-4,4a1,1,0,1,1-1.414-1.414L9.586,9H2A1,1,0,0,1,1,8Zm21,7H14.414l2.293-2.293a1,1,0,0,0-1.414-1.414l-4,4a1,1,0,0,0,0,1.414l4,4a1,1,0,0,0,1.414-1.414L14.414,17H22a1,1,0,0,0,0-2Z"></path></g></svg>
                    </span>` : '-'}</td>
                <td><span title="Export this draft" class="table_svg_icon" onclick="exportDraft('${isrcCode}')">
                    <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Interface / Download"> <path id="Vector" d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>
                </span></td>
                <td><span title="Delete this draft" class="table_svg_icon" onclick="deleteDraft('${isrcCode}')">
                <svg fill="#ffffff" width="25px" height="25px" viewBox="-3.5 0 19 19" xmlns="http://www.w3.org/2000/svg" class="cf-icon-svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M11.383 13.644A1.03 1.03 0 0 1 9.928 15.1L6 11.172 2.072 15.1a1.03 1.03 0 1 1-1.455-1.456l3.928-3.928L.617 5.79a1.03 1.03 0 1 1 1.455-1.456L6 8.261l3.928-3.928a1.03 1.03 0 0 1 1.455 1.456L7.455 9.716z"></path></g></svg>
                </span></td>
            `;
            tbody.appendChild(row);
        });

        // Adiciona o corpo da tabela à tabela
        table.appendChild(tbody);

        // Limpa o conteúdo atual do popup_content
        popupContent.innerHTML = '';

        // Adiciona a tabela ao popup_content
        popupContent.appendChild(table);
    }
}

    function copyTranscriptionFromCache(transcriptionVersion, trackId) {
        // Recupera os dados do cache
        const cacheData = localStorage.getItem('localDrafts');
    
        // Verifica se existem dados no cache
        if (cacheData) {
            const draftsCache = JSON.parse(cacheData);
    
            // Verifica se o rascunho existe no cache
            if (draftsCache[trackId]) {
                const transcription = draftsCache[trackId][transcriptionVersion] || draftsCache[trackId].transcription;
                // Copia a transcrição para a área de transferência
                navigator.clipboard.writeText(transcription)
                    .then(() => {
                        notification('Transcription copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Failed to copy transcription: ', err);
                        notification('Failed to copy transcription, please try again');
                    });
            } else {
                console.error('Draft not found in cache');
                notification('Draft not found in cache, please try again');
            }
        } else {
            console.error('Cache is empty');
            notification('Cache is empty, please try again');
        }
    }

    function draftStartPlayback(trackId) {

        if (deviceId !== undefined) {
            console.log(deviceId)
            playTrack(trackId, deviceId);

            document.getElementById("overlay").style.display = "none";
            document.getElementById('manage_draft_popup').style.display = "none";
            document.getElementById('manage_dictionary_popup').style.display = "none";
        } else {
            console.error('deviceId is undefined. Make sure to initialize it before calling draftStartPlayback or playTrack.');
            notification("An error occurred, please refresh the page")
        }
    }

    function importDrafts() {
        // Abre a biblioteca do PC filtrando apenas arquivos JSON
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function (event) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = function () {
                try {
                    const newDrafts = JSON.parse(reader.result);

                    // Verifica se o arquivo tem a estrutura correta
                    if (isValidDrafts(newDrafts)) {
                        // Recupera os rascunhos existentes do armazenamento local
                        const existingDrafts = JSON.parse(localStorage.getItem('localDrafts')) || {};

                        // Mescla os novos rascunhos com os existentes
                        const mergedDrafts = { ...existingDrafts, ...newDrafts };

                        // Salva a lista mesclada de volta no armazenamento local
                        localStorage.setItem('localDrafts', JSON.stringify(mergedDrafts));

                        populateDraftsPopupFromCache()

                        updateMemoryUsage() 
                        draftsCounter()

                        notification('Drafts imported successfully!');
                    } else {
                        notification('The file does not have the correct structure');
                    }
                } catch (error) {
                    notification('Error reading the file');
                    console.error(error);
                }
            };

            reader.readAsText(file);
        };

        input.click();
    }

    function isValidDrafts(drafts) {
        // Verifica se drafts é um objeto não vazio
        if (typeof drafts !== 'object' || drafts === null || Object.keys(drafts).length === 0) {
            return false;
        }

        // Verifica se cada entrada é válida
        for (const draftId in drafts) {
            if (!drafts.hasOwnProperty(draftId)) {
                continue;
            }

            const draft = drafts[draftId];

            // Verifica se cada rascunho tem a estrutura necessária
            if (
                typeof draft !== 'object' ||
                draft === null ||
                !draft.hasOwnProperty('track_name') ||
                !draft.hasOwnProperty('artist_name') ||
                !draft.hasOwnProperty('track_id') ||
                !draft.hasOwnProperty('datetime') ||
                !draft.hasOwnProperty('transcription')
            ) {
                return false;
            }
        }

        return true;
    }

    function exportDraft(trackId) {
        console.log('Exporting draft with trackId:', trackId);
        
        // Recupera os dados do cache
        const cacheData = localStorage.getItem('localDrafts');
        console.log('Cache data:', cacheData);

        // Verifica se existem dados no cache
        if (cacheData) {
            const draftsCache = JSON.parse(cacheData);
            console.log('Drafts cache:', draftsCache);

            // Verifica se o rascunho existe no cache
            if (draftsCache[trackId]) {
                console.log('Draft found in cache:', draftsCache[trackId]);

                // Cria um objeto com o trackId como chave e o objeto de rascunho como valor
                const draftToExport = { [trackId]: draftsCache[trackId] };
                
                // Cria um blob com os dados do rascunho
                const blob = new Blob([JSON.stringify(draftToExport)], { type: 'application/json' });
                
                // Cria um objeto URL para o blob
                const url = URL.createObjectURL(blob);
                
                // Cria um link para o objeto URL
                const link = document.createElement('a');
                link.href = url;
                
                // Define o nome do arquivo
                const fileName = draftsCache[trackId].track_name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_draft.json';
                link.download = fileName;
                
                // Simula o clique no link para iniciar o download
                link.click();
                
                // Libera o objeto URL
                URL.revokeObjectURL(url);
            } else {
                console.error('Draft not found in cache');
                notification('Draft not found in cache, please try again');
            }
        } else {
            console.error('Cache is empty');
            notification('Cache is empty, please try again');
        }
    }

    function exportAllDrafts() {
        console.log('Exporting all drafts from cache');

        // Recupera os dados do cache
        const cacheData = localStorage.getItem('localDrafts');
        console.log('Cache data:', cacheData);

        // Verifica se existem dados no cache
        if (cacheData) {
            const draftsCache = JSON.parse(cacheData);
            console.log('Drafts cache:', draftsCache);

            // Verifica se há algum rascunho no cache
            if (Object.keys(draftsCache).length > 0) {
                // Cria um blob com todos os dados do cache
                const blob = new Blob([JSON.stringify(draftsCache)], { type: 'application/json' });

                // Cria um objeto URL para o blob
                const url = URL.createObjectURL(blob);

                // Cria um link para o objeto URL
                const link = document.createElement('a');
                link.href = url;

                // Define o nome do arquivo
                const fileName = `lf${lf_version}_draftbackup.json`;
                link.download = fileName;

                // Simula o clique no link para iniciar o download
                link.click();

                // Libera o objeto URL
                URL.revokeObjectURL(url);
            } else {
                console.error('No drafts found in cache');
                notification('No drafts found in cache, please try again');
            }
        } else {
            console.error('Cache is empty');
            notification('Cache is empty, please try again');
        }
    }

    function deleteDraft(trackId) {
        // Recupera os dados do cache
        const cacheData = localStorage.getItem('localDrafts');

        // Verifica se existem dados no cache
        if (cacheData) {
            const draftsCache = JSON.parse(cacheData);

            // Verifica se o rascunho existe no cache
            if (draftsCache[trackId]) {
                // Remove o rascunho com base no trackId
                delete draftsCache[trackId];
                
                // Atualiza os dados do cache após a remoção do rascunho
                localStorage.setItem('localDrafts', JSON.stringify(draftsCache));

                // Recarrega a tabela de rascunhos para refletir as mudanças
                populateDraftsPopupFromCache();
                updateMemoryUsage() 
                draftsCounter()

                notification('Draft deleted successfully!');
            } else {
                console.error('Draft not found in cache');
                notification('Draft not found in cache, please try again');
            }
        } else {
            console.error('Cache is empty');
            notification('Cache is empty, please try again.');
        }
    }

/* ****************************************** */

/* FUNÇÃO DE ORDENAÇÃO DE TABELA */

function sortTable(columnIndex, tableId) {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById(tableId);
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[columnIndex];
            y = rows[i + 1].getElementsByTagName("td")[columnIndex];
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                shouldSwitch= true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

async function compareDrafts(trackId) {
    // Recupera os dados do cache
    const cacheData = localStorage.getItem('localDrafts');

    // Verifica se existem dados no cache
    if (cacheData) {
        const draftsCache = JSON.parse(cacheData);

        // Verifica se o rascunho existe no cache
        if (draftsCache[trackId]) {
            const transcription1 = draftsCache[trackId].original_transcription;
            const transcription2 = draftsCache[trackId].transcription;

            const url = `https://api.diffchecker.com/public/text?output_type=html&email=${userEmail}`;
            const data = {
                "left": transcription1,
                "right": transcription2,
                "diff_level": "word"
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.text();
                    // Remove o elemento <style> da tabela retornada pela API
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(result, 'text/html');
                    const styleElement = doc.querySelector('style');
                    if (styleElement) {
                        styleElement.remove();
                    }
                    const table = doc.querySelector('.diff-table');

                    // Adiciona cabeçalhos à tabela
                    const headersRow = table.querySelector('thead tr');
                    headersRow.innerHTML = `
                        <td class="line-number-header" style="font-size: 11px; color: #747474"></td>
                        <td class="side-content-header" style="font-size: 11px; color: #747474">Original Transcription</td>
                        <td class="line-number-header" style="font-size: 11px; color: #747474"></td>
                        <td class="side-content-header" style="font-size: 11px; color: #747474">Final Transcription</td>
                    `;

                    document.getElementById('diffchecker_table').innerHTML = table.outerHTML;

                    document.getElementById('copyDiffLeft').onclick = function() {
                        copyTranscriptionFromCache('original_transcription', trackId);
                    };
                    
                    document.getElementById('copyDiffRight').onclick = function() {
                        copyTranscriptionFromCache('transcription', trackId);
                    };

                    document.getElementById('get_diff_link').onclick = function() {
                        fetchAndModifyTranscriptions(trackId)
                    };

                    diffcheckerPopup()
                } else {
                    console.error('Request failed:', response.statusText);
                    notification("Request failed, please try again later")
                }
            } catch (error) {
                console.error('Request failed:', error);
                notification("Request failed, please try again later")
            }
        } else {
            console.error('Draft not found in cache');
            notification('Draft not found in cache, please try again');
        }
    } else {
        console.error('Cache is empty');
        notification('Cache is empty, please try again');
    }
}

// Função para fazer a solicitação à API e comparar as transcrições
async function fetchAndModifyTranscriptions(trackId) {
    // Recupera os dados do cache
    const cacheData = localStorage.getItem('localDrafts');

    // Verifica se existem dados no cache
    if (cacheData) {
        const draftsCache = JSON.parse(cacheData);

        // Verifica se o rascunho existe no cache
        if (draftsCache[trackId]) {
            const originalTranscription = draftsCache[trackId].original_transcription;
            const transcription = draftsCache[trackId].transcription;
            const diffTitle = `${draftsCache[trackId].track_name} - ${draftsCache[trackId].artist_name}`

            // Dados a serem enviados para a API
            const requestData = {
                left: originalTranscription,
                right: transcription,
                title: diffTitle
            };

            try {
                // Obter o valor de localHostToggle do localStorage
                const localHostToggle = localStorage.getItem('localHostToggle');

                // Verificar o valor de localHostToggle e definir window.serverPath
                if (localHostToggle === 'true') {
                    window.serverPath = 'http://localhost:3000'; 
                } else {
                    window.serverPath = 'https://datamatch-backend.onrender.com';
                }

                const response = await fetch(`${window.serverPath}/diff/compare`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                if (response.ok) {
                    const diffData = await response.json();
                    // Faça algo com os dados da diferença, se necessário
                    console.log(diffData);
                    document.getElementById('diff_link_div').style.display = 'flex'
                    document.getElementById('diff_link_output').textContent = `https://www.diffchecker.com/${diffData.slug}/`
                    document.getElementById('get_diff_link').style.display = 'none'
                } else {
                    console.error('Request failed:', response.statusText);
                    notification("Request failed, please try again later")
                }
            } catch (error) {
                console.error('Request failed:', error);
                notification("Request failed, please try again later")
            }

        } else {
            console.error('Draft not found in cache');
            notification('Draft not found in cache, please try again');
        }
    } else {
        console.error('Cache is empty');
        notification('Cache is empty, please try again');
    }
}
