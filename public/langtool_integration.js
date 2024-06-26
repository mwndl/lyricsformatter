var ignoredContainers = [];
var selectedLanguage;

function checkLanguage() {
    var text = document.getElementById('editor').value;
    const grammarContainer = document.getElementById('grammar_containers');
    var selectedLanguage = getParameterByName('language')
    
    if (!selectedLanguage) {
        console.error('No selected language.');
        return;
    }

    grammarContainer.innerHTML = '';
    errorPlaceholder("Loading...", 'grammar_containers');

    fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'text=' + encodeURIComponent(text) + '&language=' + selectedLanguage
    })
    .then(response => {
        const grammarContainer = document.getElementById('grammar_containers');
        grammarContainer.innerHTML = '';

        if (!response.ok) {
            if (response.status === 400) {
                errorPlaceholder("It looks like the transcription is in a different language than the one selected, please verify the selected language and try again.", 'grammar_containers');
            } else if (response.status === 500) {
                errorPlaceholder("It seems that LanguageTool is currently experiencing instabilities. Please try again in a few minutes.", 'grammar_containers');
            } else if (response.status === 429) {
                errorPlaceholder("Too many requests! Your IP has reached the limit of requests per minute established by LanguageTool, please try again in one minute.", 'grammar_containers');
            } else {
                errorPlaceholder("LanguageTool returned an unknown error, please try again later.", 'grammar_containers');
                throw new Error('Unexpected error: ' + response.status);
            }
        }
        return response.json();
    })
    .then(data => {
        if (data.matches.length === 0) {
            console.log('No matches found.');
            checkGrammarPlaceholder();
        } else {
            createMatchContainers(data.matches);
            checkGrammarPlaceholder();
        }

        updateTabCounters()
    })
    .catch(error => {
        const grammarContainer = document.getElementById('grammar_containers');
        grammarContainer.innerHTML = '';

        errorPlaceholder("LanguageTool returned an unknown error, please try again later.", 'grammar_containers');
        console.error('Error:', error.message);

        updateTabCounters()
    });
}

function createMatchContainers(matches) {
    var grammarContainer = document.getElementById('grammar_containers');
    grammarContainer.innerHTML = '';

    var container = document.getElementById('grammar_containers');

    matches.forEach(function(match, index) {

        if (match.sentence === "#INTRO" || match.sentence === "#VERSE" || match.sentence === "#PRE-CHORUS" 
        || match.sentence === "#CHORUS" || match.sentence === "#BRIDGE" || match.sentence === "#HOOK" 
        || match.sentence === "#OUTRO" || match.sentence === "#INSTRUMENTAL" ) {
            return; // Ignorar o loop e continuar com o próximo match
        }

        if (ignoredContainers.includes(`lt_${match.message}_${match.sentence}(${match.rule.id})`)) {
            return; 
        }

        // Verifica se o conteúdo está no dicionário pessoal do usuário
        var textareaContent = getTextareaContent(match.offset, match.length);
        if (isInDictionary(textareaContent, match.message)) {
            return; 
        }

        var matchContainer = document.createElement('div');
        matchContainer.classList.add('container');
        matchContainer.setAttribute('onclick', 'expandContainer(this)');
        matchContainer.id = `lt_${match.message}_${match.sentence}(${match.rule.id})`;
        
        // Adicionando o atributo lt-position
        matchContainer.setAttribute('lt-position', `${match.offset}:${match.length}`);

        var topDiv = document.createElement('div');
        topDiv.classList.add('grammar_top');

        var title = document.createElement('h2');
        title.textContent = match.rule.category.name;

        var content = document.createElement('div');
        content.classList.add('content');

        var description = document.createElement('p');
        description.classList.add('content_text');
        description.textContent = match.message;

        var contentOptions = document.createElement('div');
        contentOptions.classList.add('content_options_grammar');

        match.replacements.slice(0, 5).forEach(function(replacement) {
            var fixButton = document.createElement('div');
            fixButton.textContent = replacement.value;
            fixButton.classList.add('grammar_replace_btn');
            fixButton.addEventListener('click', function() {
                replaceText(match.offset, match.length, replacement.value);
            });
            contentOptions.appendChild(fixButton);
        });

        var ignoreBtn = document.createElement('div');
        ignoreBtn.textContent = 'Ignore';
        ignoreBtn.classList.add('grammar_ignore_btn');
        ignoreBtn.onclick = function() {
            ignoreButton(matchContainer);
        };

        var addToDictionaryBtn = document.createElement('div');
        addToDictionaryBtn.classList.add('add_to_dictionary_svg');
        addToDictionaryBtn.style.display = 'none';
        addToDictionaryBtn.title = 'Add to the dictionary';

        // Construindo o valor do atributo data
        var textareaContent = getTextareaContent(match.offset, match.length); // Função fictícia para obter o conteúdo do textarea

        addToDictionaryBtn.setAttribute('data-content', textareaContent);
        addToDictionaryBtn.setAttribute('data-message', match.message);

        addToDictionaryBtn.onclick = function() {
            addToDictionary(this);
        };

        contentOptions.appendChild(ignoreBtn);

        content.appendChild(description);
        content.appendChild(contentOptions);

        topDiv.appendChild(title);
        topDiv.appendChild(addToDictionaryBtn);

        matchContainer.appendChild(topDiv);
        matchContainer.appendChild(content);

        container.appendChild(matchContainer);

        // Adiciona o botão 'EXPORT' apenas se isLfExportToggleChecked retornar true
        if (isLfExportToggleChecked()) {
            var exportBtn = document.createElement('div');
            exportBtn.textContent = 'Export Object';
            exportBtn.classList.add('grammar_export_btn');
            exportBtn.onclick = function() {
                exportLTObject(match);
            };
            contentOptions.appendChild(exportBtn);
        }
    });
}


function replaceText(offset, length, replacement) {
    var editor = document.getElementById('editor');
    var editorValue = editor.value;
    var newText = editorValue.substring(0, offset) + replacement + editorValue.substring(offset + length);
    editor.value = newText;
    handleRefreshButtonClick();

    addToUndoStack()
}

function addToDictionary(button) {
    var content = button.getAttribute('data-content');
    var message = button.getAttribute('data-message');
    var selectedLanguage = getParameterByName('language')

    // Verificar se o item já está no dicionário
    if (!isInDictionary(content, message)) {
        // Adicionar o item ao cache do navegador
        var cachedItems = getCachedItems();
        var dictionary = {}; // Criar um objeto para representar o dicionário

        // Se já houver um dicionário armazenado, usá-lo
        if (cachedItems.hasOwnProperty(selectedLanguage)) {
            dictionary = cachedItems[selectedLanguage];
        }

        // Adicionar o novo item ao dicionário
        dictionary[content] = message;

        // Atualizar ou adicionar o dicionário ao cache do navegador
        cachedItems[selectedLanguage] = dictionary;
        localStorage.setItem('dictionaryCache', JSON.stringify(cachedItems));
    }

    handleRefreshButtonClick();
}

function isInDictionary(content, message) {
    var selectedLanguage = getParameterByName('language')
    var cachedItems = getCachedItems();
    var dictionary = cachedItems[selectedLanguage] || {};
    return dictionary.hasOwnProperty(content) && dictionary[content] === message;
}

function getCachedItems() {
    var cachedItems = localStorage.getItem('dictionaryCache');
    return cachedItems ? JSON.parse(cachedItems) : {};
}

function getTextareaContent(offset, length) {
    var editorTextarea = document.getElementById('editor');
    var content = editorTextarea.value;

    // Obtém o conteúdo com base no offset e length
    var textContent = content.substring(offset, offset + length);
    
    return textContent;
}

function exportLTObject(match) {
    // Obtendo o conteúdo do textarea
    var editorContent = document.getElementById('editor').value;

    // Obtendo a parte correspondente ao offset e length
    var content = editorContent.substring(match.offset, match.offset + match.length);

    // Construindo o objeto JSON modificado
    var modifiedMatch = {
        content: content,
        match: match
    };

    // Convertendo o objeto JavaScript para uma string JSON
    var matchString = JSON.stringify(modifiedMatch);
    
    // Chamar a função unificada para copiar para a área de transferência
    copyContentToClipboard(matchString, 'JSON object copied to clipboard!');
}

function copyContentToClipboard(content, message) {
    // Copiar o conteúdo para a área de transferência
    navigator.clipboard.writeText(content).then(function() {
        console.log('Content copied to clipboard:', content);
        notification(message);
    }, function(err) {
        console.error('Failed to copy content to clipboard: ', err);
        notification('Failed to copy, please try again');
    });
}

function detectBrowser() {
    // Obtém o user agent do navegador
    var userAgent = navigator.userAgent;
    
    // Verifica se o navegador é o Opera
    if (userAgent.indexOf("OPR") > -1 || userAgent.indexOf("Opera") > -1) {
        notification("You're using the Opera browser.");
        return;
    }
    
    // Verifica se o navegador é o Edge
    if (userAgent.indexOf("Edg") > -1) {
        notification("You're using the Microsoft Edge browser.");
        return;
    }
    
    // Verifica se o navegador é o Chrome
    if (userAgent.indexOf("Chrome") > -1) {
        notification("You're using the Google Chrome browser.");
        return;
    }
    
    // Verifica se o navegador é o Safari
    if (userAgent.indexOf("Safari") > -1 && userAgent.indexOf("Chrome") === -1) {
        notification("You're using the Safari browser.");
        return;
    }
    
    // Verifica se o navegador é o Firefox
    if (userAgent.indexOf("Firefox") > -1) {
        notification("You're using the Mozilla Firefox browser.");
        return;
    }
    
    return;
}

