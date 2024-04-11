document.addEventListener('DOMContentLoaded', function () {
    var returnArrow = document.querySelector('#return_arrow');
    var lyricsBox = document.getElementById('lyrics_box');
    var textArea = document.getElementById('editor');
    var textarea = document.querySelector('.editor');
    var characterCounter = document.querySelector('.character_counter');
    const selector = document.querySelector('.language_selector');
    const selectedLanguage = document.querySelector('.selected_language');
    const languageList = document.querySelector('.language_list');
    const languageArrow = document.querySelector('.lang_expand_arrow');
    const langButtonContent = document.querySelector('.lang_selector_div');

    var resetButton = document.getElementById('reset_button');

    var refreshButton = document.getElementById('refresh_button');
    var loadingSpinner = document.getElementById('loading_spinner');

    var improvementsPlaceholder = document.getElementById('improvements_placeholder')

    const searchBtn = document.querySelector('#search_btn');
    const search_input = document.querySelector('#search_input');
    const loading_spinner = document.querySelector('#loading_spinner');
    const spotifyIframePreview = document.querySelector('#spotify_iframe_preview');

    const notification_div = document.getElementById("notification");
    const message = document.getElementById("notification-message");

    var miniMenu = document.getElementById("mini_menu");

    var ignoredContainers = []; // aqui ficam guardados temporariamente os IDs ignorados, ao limpar o texto, tocar em 'Copy' ou então ao tocar no botão de lixo, esse array será resetado

 // Add this function to your existing code
function handleRefreshButtonClick() {

    // Auto trim (se ativo)
    var autoTrimToggle = document.getElementById('autoTrimToggle');
    var removeDoubleSpacesAndLinesToggle = document.getElementById('removeDoubleSpacesAndLinesToggle');
    var autoCapTagsToggle = document.getElementById('autoCapTagsToggle');

    if (autoTrimToggle.checked) {
        autoTrim();
    }
    if (removeDoubleSpacesAndLinesToggle.checked) {
        removeDuplicateSpaces();
        removeDuplicateEmptyLines();
    }
    if (autoCapTagsToggle.checked) {
        replaceSpecialTags();
    }

    resetLineIssues();
    updateSidebar();
    clearTimeout(typingTimer); // auto 3s

    // Get references to the elements
    // Hide the refresh button and show the loading spinner
    refreshButton.style.display = 'none';
    loadingSpinner.style.display = 'block';

    // Get the language code from the selected language element
    var selectedLanguageCode = localStorage.getItem('selectedLanguage');

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
                    notification("Language not supported: ", 'info');
                } else {
                    // Handle other errors here
                    console.error('Error with API request. Status:', response.status);
                    notification('We are experiencing internal issues, please try again later. 🔧');
                }
            }
            return response.json();
        })
        .then(data => {
            // Handle the API response here
            console.log('API Response:', data);

            // Remove existing HTML elements inside the improvements_containers
            const improvementsContainer = document.getElementById('improvements_containers');
            improvementsContainer.innerHTML = '';
    
            if (data.result.issues === false) {
                // Create and append the "No issues found" div
                const noIssuesDiv = document.createElement('div');
                noIssuesDiv.className = 'container_no_issues';
                noIssuesDiv.id = 'container_no_issues';
                noIssuesDiv.style.display = 'block';

                const contentDiv = document.createElement('div');
                contentDiv.className = 'content_ok';

                const h2 = document.createElement('h2');
                h2.textContent = 'No issues found! ✨';

                const copyBtn = document.createElement('div');
                copyBtn.className = 'content_copy_btn';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = copyToClipboard;

                contentDiv.appendChild(h2);
                contentDiv.appendChild(copyBtn);
                noIssuesDiv.appendChild(contentDiv);

                improvementsContainer.appendChild(noIssuesDiv);
            } else {
                // Adiciona os containers HTML ao contêiner "improvements_containers"
                for (const alertaKey in data.result.containers.alerts) {
                    const alerta = data.result.containers.alerts[alertaKey];
                    const container = createContainer(alerta.container);
                    
                    // Verifica se o container não é null antes de adicioná-lo
                    if (container !== null) {
                        improvementsContainer.appendChild(container);
                    }
                    checkAndShowPlaceholder();
                }
            }

        })
        .catch(error => {
            // Handle errors here
            console.error('Error sending data to API:', error);
            notification('We are experiencing internal issues, please try again later. 🔧');
        })
        .finally(() => {
            // Show the refresh button and hide the loading spinner after the request is complete
            refreshButton.style.display = 'block';
            loadingSpinner.style.display = 'none';
        });
}

    resetButton.addEventListener('click', function() {
    
        textArea.value = ''; // apaga a transcrição
        updateSidebar(); // reseta os contadores de caracteres e a barra lateral
        ignoredContainers = []; // limpa a memória de alertas ignorados
        checkContent();
        clearTimeout(typingTimer);
    });


    refreshButton.addEventListener('click', handleRefreshButtonClick);

    // Função para lidar com a pesquisa
    const handleSearch = () => {

        const inputVal = search_input.value.trim();
        const trackUrlRegex = /^(https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?)?track\/(.+)$/;
        const studioUrlRegex = /(?:&|\?)player=spotify&(?:.*&)?track_id=([^&\s]+)/;
        const idRegex = /^[a-zA-Z0-9]{22}$/;

        let trackId = '';

        if (trackUrlRegex.test(inputVal)) {
            const url = new URL(inputVal);
            search_value = url.pathname.split('/').pop();
            trackId = search_value;
        } else if (idRegex.test(inputVal)) {
            search_value = inputVal;
            trackId = search_value;
        } else if (studioUrlRegex.test(inputVal)) {
            const match = inputVal.match(studioUrlRegex);
            if (match) {
                search_value = match[1];
                trackId = search_value;
            } else if (idRegex.test(inputVal)) {
                search_value = inputVal;
                trackId = search_value;
            } else {
                notification("Please enter Studio or Spotify track URL");
                search_input.value = "";
                return;
            }
        } else {
            notification("Please enter Studio or Spotify track URL");
            search_input.value = "";
            return;
        }

        search_input.value = "";
        spotifyIframePreview.src = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
    }

    function notification(customMessage) {
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

    // Add event listener for search button
    searchBtn.addEventListener('click', handleSearch);

    // Add event listener for Enter key press
    search_input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
        }
    });


    var returnArrow = document.querySelector('#return_arrow');

    returnArrow.addEventListener('click', function() {
        window.location.href = 'index.html';
    });


    var lyricsBox = document.getElementById('lyrics_box');
    var textArea = document.getElementById('editor');

    lyricsBox.addEventListener('click', function() {
        textArea.focus();
    });


    textarea.addEventListener('input', updateSidebar);
    textarea.addEventListener('input', checkContent);
    textarea.addEventListener('scroll', syncScroll);

    let typingTimer;
    const doneTypingInterval = 3000;

    function checkContent() {
        var editor = document.getElementById('editor');
        var resetButton = document.getElementById('reset_button')
        var refreshButton = document.getElementById('refresh_button');
        var refreshButtonMob = document.getElementById('refresh_button_mob');
        var improvementsPlaceholder = document.getElementById('improvements_placeholder');

        var content = editor.value;

        const checkboxIds = [
            'characterCounterToggle',
            'autoCapToggle',
            'autoTrimToggle',
            'removeDoubleSpacesAndLinesToggle',
            'autoCapTagsToggle',
            'autoSuggestions'
        ];

        checkboxIds.forEach(function (checkboxId) {
            const checkbox = document.getElementById(checkboxId);
            localStorage.setItem(checkboxId, checkbox.checked);
        });

        if (content.trim() === '') {
            resetButton.style.display = 'none';
            refreshButton.style.display = 'none';
            improvementsPlaceholder.textContent = 'Type something or paste your transcription to start...';
            improvementsPlaceholder.onclick = '';
        } else {

            var autoCapToggle = document.getElementById('autoCapToggle'); 

            if (autoCapToggle.checked) {
                autoCap();
            };

            resetButton.style.display = 'block';
            refreshButton.style.display = 'block';
            improvementsPlaceholder.innerHTML = 'Tap the <span class="hightlight_text">Refresh</span> icon to update the suggestions.';
        }

        if (autoSuggestions.checked) {
            // atualiza as sugestões após 3s
            clearTimeout(typingTimer);
            typingTimer = setTimeout(function() {
                handleRefreshButtonClick();
            }, doneTypingInterval);
        };
    }

    function autoCap() {
        var editor = document.getElementById('editor');
        var content = editor.value;

        // Split the content into lines
        var lines = content.split('\n');

        // Capitalize the first character of each line
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].charAt(0).toUpperCase() + lines[i].slice(1);
        }

        // Join the lines back together
        content = lines.join('\n');

        // Update the editor's content
        editor.value = content;
    }

    function autoTrim() {
        var editor = document.getElementById('editor');
        var content = editor.value;

        // Split the content into lines
        var lines = content.split('\n');

        // Trim extra spaces at the end of each line
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trimRight();
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

        // Substituir padrões específicos
        content = content.replace(/#i\s*\/?(?=\n|$)/ig, '#INTRO ');
        content = content.replace(/#v\s*\/?(?=\n|$)/ig, '#VERSE ');
        content = content.replace(/#p\s*\/?(?=\n|$)/ig, '#PRE-CHORUS ');
        content = content.replace(/#c\s*\/?(?=\n|$)/ig, '#CHORUS ');
        content = content.replace(/#b\s*\/?(?=\n|$)/ig, '#BRIDGE ');
        content = content.replace(/#h\s*\/?(?=\n|$)/ig, '#HOOK ');
        content = content.replace(/#o\s*\/?(?=\n|$)/ig, '#OUTRO ');
        content = content.replace(/##\s*\/?(?=\n|$)/ig, '#INSTRUMENTAL ');

        content = content.replace(/#intro\s*\/?(?=\n|$)/ig, '#INTRO ');
        content = content.replace(/#verse\s*\/?(?=\n|$)/ig, '#VERSE ');
        content = content.replace(/#pre-chorus\s*\/?(?=\n|$)/ig, '#PRE-CHORUS ');
        content = content.replace(/#chorus\s*\/?(?=\n|$)/ig, '#CHORUS ');
        content = content.replace(/#bridge\s*\/?(?=\n|$)/ig, '#BRIDGE ');
        content = content.replace(/#hook\s*\/?(?=\n|$)/ig, '#HOOK ');
        content = content.replace(/#outro\s*\/?(?=\n|$)/ig, '#OUTRO ');
        content = content.replace(/#instrumental\s*\/?(?=\n|$)/ig, '#INSTRUMENTAL ');

        // Atualizar o conteúdo do editor
        editor.value = content;
    }

    function updateSidebar() {


        function updateCharacterCounter() {
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
        
                    var selectedLanguageCode = localStorage.getItem('selectedLanguage');
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
        

        function resetImprovementsBoxes() {
            // Obtém a referência ao contêiner de melhorias
            const improvementsContainer = document.getElementById('improvements_containers');
        
            // Obtém a referência ao textarea com o ID 'editor'
            const editorTextarea = document.getElementById('editor');
        
            // Remove todas as divs dentro do contêiner de melhorias
            improvementsContainer.innerHTML = '';
        
            // Cria a div de espaço reservado para melhorias
            const improvementsPlaceholderDiv = document.createElement('div');
            improvementsPlaceholderDiv.className = 'improvements_placeholder_div';
            improvementsPlaceholderDiv.id = 'improvements_placeholder_div';
        
            // Cria a div de espaço reservado para melhorias com base no conteúdo do textarea
            const improvementsPlaceholder = document.createElement('div');
            improvementsPlaceholder.className = 'improvements_placeholder';
            improvementsPlaceholder.id = 'improvements_placeholder';
        
            // Verifica se o textarea está vazio
            if (editorTextarea.value.trim() === '') {
                improvementsPlaceholder.innerHTML = 'Type something or paste your transcription to start...';
                ignoredContainers = []; // reseta o conteúdo ignorado
                clearTimeout(typingTimer);

            } else {
                improvementsPlaceholder.innerHTML = 'Tap the <span class="highlight_text">Refresh</span> icon to update the suggestions.';
            }
        
            // Adiciona a div de espaço reservado para melhorias ao contêiner de melhorias
            improvementsPlaceholderDiv.appendChild(improvementsPlaceholder);
            improvementsContainer.appendChild(improvementsPlaceholderDiv);
        }

        updateCharacterCounter();

        function updateLineIssues() {
            var textarea = document.getElementById('editor');
            var lineIssuesContainer = document.getElementById('line_issues');
        
            if (!textarea || !lineIssuesContainer) {
                console.error('Textarea or line issues container not found.');
                return;
            }
        
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
        
        // Exemplo de uso
        updateLineIssues();

    }
    
    updateSidebar();
    

    function syncScroll() {
        var textarea = document.getElementById('editor'); // Substitua 'editor' pelo ID correto
        var characterCounter = document.querySelector('.character_counter'); // Use o seletor correto
        var lineIssues = document.querySelector('.line_issues'); // Use o seletor correto
    
        if (textarea && characterCounter && lineIssues) {
            characterCounter.scrollTop = textarea.scrollTop;
            lineIssues.scrollTop = textarea.scrollTop;
        }
    }


   // Função para verificar e definir o idioma padrão ao carregar a página
    function setDefaultLanguage() {
        const storedLanguage = localStorage.getItem('selectedLanguage');

        if (storedLanguage) {
            // Se houver um idioma armazenado em cache, defina-o como padrão
            selectedLanguage.textContent = getLanguageFullName(storedLanguage);
            // Adicione integração do idioma aqui
        }
    }
    

    // Função para obter o nome completo do idioma com base no código
    function getLanguageFullName(code) {
        const languageMap = {
            'en-UK': 'English (UK)',
            'en-US': 'English (US)',
            'nl': 'Dutch',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt-BR': 'Portuguese (BR)',
            'pt-PT': 'Portuguese (PT)',
            'es': 'Spanish'
                
            // Adicione mais idiomas conforme necessário
        };

        return languageMap[code] || code; // Retorna o nome completo se estiver mapeado, senão retorna o código
    }

    // Adicione um evento de clique ao seletor de idioma
    languageList.addEventListener('click', function (e) {
        if (e.target.tagName === 'LI') {
            const selected = e.target.dataset.lang;
            selectedLanguage.textContent = getLanguageFullName(selected);
            languageList.style.display = 'none';

            // Armazene o idioma selecionado em cache
            localStorage.setItem('selectedLanguage', selected);
            updateSidebar() // resetar sugestões e caracteres
            ignoredContainers = []; // limpa a memória de alertas ignorados
        }
    });

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

    // Evento de clique em qualquer lugar no documento para ocultar a lista de idiomas
    document.addEventListener('click', function (event) {
        if (!selector.contains(event.target)) {
            languageList.style.display = 'none';
            languageArrow.style.transform = "rotate(180deg)";
            langButtonContent.title = "Tap to edit the language";
        }
    });

    // Função para verificar e definir o estado dos checkboxes ao carregar a página
    function setCheckboxStates() {
        // Adicione IDs aos seus elementos de checkbox para tornar a manipulação mais fácil
        const checkboxIds = [
            'characterCounterToggle',
            'autoCapToggle',
            'autoTrimToggle',
            'removeDoubleSpacesAndLinesToggle',
            'autoCapTagsToggle',
            'autoSuggestions'
        ];

        checkboxIds.forEach(function (checkboxId) {
            const checkbox = document.getElementById(checkboxId);
            const checkboxState = localStorage.getItem(checkboxId);

            if (checkboxState !== null) {
                checkbox.checked = JSON.parse(checkboxState);
            }
        });
    }

    // Configurar o idioma padrão ao carregar a página
    setDefaultLanguage();
    setCheckboxStates();
    
    // Adicione um evento de clique ao botão de cópia
    var copyButton = document.querySelector('.content_copy_btn');
    copyButton.addEventListener('click', copyToClipboard);

    function ignoreButton(button) {
        var container = button.closest('.container');
        var containerId = container.id; // Obter o ID da DIV container
        ignoredContainers.push(containerId); // Adicionar o ID ao array ignoredContainers
        container.style.display = 'none';
        checkAndShowPlaceholder();
        resetLineIssues();
    } 
    
    var ignoreButtons = document.querySelectorAll('.content_ignore_btn');
    ignoreButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            ignoreButton(event.target);
        });
    });

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
        checkAndShowPlaceholder();
        resetLineIssues();
        handleRefreshButtonClick()
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
                console.error('Formato de trigger inválido:', trigger);
            }
        } catch (error) {
            console.error('Erro ao interpretar e executar o trigger:', error);
        }
    }
    
    var fixButtons = document.querySelectorAll('.content_fix_btn');
    fixButtons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            fixButton(event.target);
        });
    });

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

    function copyToClipboard() {
        if (textArea.value.trim() === '') {
            notification("Sorry, there's no content to be copied here");
            return;
        }
    
        textArea.select();
        
        try {
            // Copia o conteúdo para a área de transferência
            var successful = document.execCommand('copy');
            var message = successful ? 'Copied to your clipboard!' : 'Something went wrong, please try again.';
            notification(message);
            

            textArea.value = ''; // apaga a transcrição
            updateSidebar(); // reseta os contadores de caracteres e a barra lateral
            ignoredContainers = []; // limpa a memória de alertas ignorados

        } catch (err) {
            console.error('An error occurred while copying the text: ', err);
            notification('An error occurred while copying the text.');
        }
    
        // Deseleciona a textarea
        window.getSelection().removeAllRanges();

    }

    // Função para verificar e exibir a div placeholder
    function checkAndShowPlaceholder() {
        var improvementsContainers = document.getElementById('improvements_containers');

        // Verificar se há containers visíveis
        var visibleContainers = Array.from(improvementsContainers.querySelectorAll('.container')).filter(container => container.style.display !== 'none');

        // Se já houver algum container visível, não faz nada
        if (visibleContainers.length > 0) {
            console.log('> 0');
            return;
        }

        // Create and append the "No issues found" div
        const noIssuesDiv = document.createElement('div');
        noIssuesDiv.className = 'container_no_issues';
        noIssuesDiv.id = 'container_no_issues';
        noIssuesDiv.style.display = 'block';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content_ok';

        const h2 = document.createElement('h2');
        h2.textContent = 'No issues found! ✨';

        const copyBtn = document.createElement('div');
        copyBtn.className = 'content_copy_btn';
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = copyToClipboard;

        contentDiv.appendChild(h2);
        contentDiv.appendChild(copyBtn);
        noIssuesDiv.appendChild(contentDiv);

        improvementsContainers.appendChild(noIssuesDiv);
    }

    checkAndShowPlaceholder();

    function selectText(linesToSelect) { // SELECIONA LINHAS ESPECIFICAS
        // Selecionar todo o texto no textarea
        textArea.select();
    
        // Desfazer a seleção para que possamos selecionar apenas as linhas desejadas
        document.execCommand('unselect', false, null);
    
        var lines = textArea.value.split('\n');
        var selectedRanges = [];
    
        // Calcular a posição inicial e final para cada linha desejada
        for (var i = 0; i < linesToSelect.length; i++) {
            var lineIndex = linesToSelect[i] - 1; // Ajuste para começar do índice 0
    
            if (lineIndex >= 0 && lineIndex < lines.length) {
                var start = 0;
    
                for (var j = 0; j < lineIndex; j++) {
                    start += lines[j].length + 1; // +1 para a quebra de linha
                }
    
                var end = start + lines[lineIndex].length;
    
                selectedRanges.push({ start, end });
            }
        }
    
        // Selecionar o texto no textarea para cada intervalo desejado
        if (selectedRanges.length > 0) {
            // Use o primeiro intervalo como o intervalo inicial
            var initialRange = selectedRanges[0];
            textArea.setSelectionRange(initialRange.start, initialRange.end);
    
            // Adicione os intervalos restantes como seleções adicionais
            for (var i = 1; i < selectedRanges.length; i++) {
                var range = selectedRanges[i];
                textArea.addRange(new Range(range.start, range.end));
            }
        }
    }
});

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
        updateLineIssues(color, lines);
    }
}

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


document.addEventListener("DOMContentLoaded", function () {
    var optionsDots = document.getElementById("settings_dots");
    var miniMenu = document.getElementById("mini_menu");
    var langList = document.getElementById("language_list");

    var settingsOption = document.getElementById("settings_option");
    var betaOption = document.getElementById("redirect_beta");
    var creditsOption = document.getElementById("credits_option");
    var suggestOption = document.getElementById("suggest_option");
    var aboutOption = document.getElementById("about_option");

    var settingsPopup = document.getElementById("settings_popup");
    var creditsPopup = document.getElementById("credits_popup");
    var suggestPopup = document.getElementById("suggest_popup");
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

    // redirect to beta
    betaOption.addEventListener("click", function () {
        window.location.href = 'https://lyricsformatter-beta.onrender.com/?referrer=https://lyricsformatter.onrender.com/';
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
    suggestOption.addEventListener("click", function () {
        miniMenu.style.display = "none";
        suggestPopup.style.display = "block";
        overlay.style.display = "block";
    });

    // Hide Suggestions
    overlay.addEventListener("click", function () {
        suggestPopup.style.display = "none";
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
});
/* 
window.serverPath = 'http://localhost:3000'; 
window.serverPath = 'https://datamatch-backend.onrender.com';
*/

window.serverPath = 'https://datamatch-backend.onrender.com';

// Função para fazer uma solicitação AJAX
function fetchCreditsData() {
    fetch(`${window.serverPath}/formatter/credits`)
    .then(response => response.json())
    .then(data => updateCredits(data.credits))
    .catch(error => console.error('Erro ao buscar dados da API:', error));
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

// Chama a função para buscar dados da API quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', fetchCreditsData);

// Função para fechar o popup de informações
function closeAboutInfo() {
    document.getElementById('about_popup').style.display = 'none';
}

// Função para buscar dados do servidor
function fetchServerInfo() {
    fetch(`${window.serverPath}/formatter/about`)
        .then(response => response.json())
        .then(data => updateServerInfo(data))
        .catch(error => console.error('Erro ao buscar dados do servidor:', error));
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

        // Adiciona a descrição acima das informações do servidor
        const descriptionElement = document.createElement('p');
        descriptionElement.textContent = serverInfo.description;
        popupContent.appendChild(descriptionElement);

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

// Chama a função para buscar dados do servidor quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', fetchServerInfo);
