var ignoredContainers = [];

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
    })
    .catch(error => {
        const grammarContainer = document.getElementById('grammar_containers');
        grammarContainer.innerHTML = '';

        errorPlaceholder("LanguageTool returned an unknown error, please try again later.", 'grammar_containers');
        console.error('Error:', error.message);
    });
}

function createMatchContainers(matches) {
    var grammarContainer = document.getElementById('grammar_containers');
    grammarContainer.innerHTML = '';

    var container = document.getElementById('grammar_containers');

    matches.forEach(function(match, index) {

        if (match.sentence === "#INTRO" || match.sentence === "#VERSE" || match.sentence === "#PRE-CHORUS" 
        || match.sentence === "#CHORUS" || match.sentence === "#BRIDGE" || match.sentence === "#HOOK" 
        || match.sentence === "#OUTRO" || match.sentence === "#INSTRUMENTAL") {
            return; // Ignorar o loop e continuar com o próximo match
        }

        if (ignoredContainers.includes(`lt_${match.message}_${match.sentence}(${match.rule.id})`)) {
            return; 
        }

        var matchContainer = document.createElement('div');
        matchContainer.classList.add('container');
        matchContainer.setAttribute('onclick', 'expandContainer(this)');
        matchContainer.id = `lt_${match.message}_${match.sentence}(${match.rule.id})`;
        
        // Adicionando o atributo lt-position
        matchContainer.setAttribute('lt-position', `${match.offset}:${match.length}`);

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

        contentOptions.appendChild(ignoreBtn);

        content.appendChild(description);
        content.appendChild(contentOptions);

        matchContainer.appendChild(title);
        matchContainer.appendChild(content);

        container.appendChild(matchContainer);
    });
}

function replaceText(offset, length, replacement) {
    var editor = document.getElementById('editor');
    var editorValue = editor.value;
    var newText = editorValue.substring(0, offset) + replacement + editorValue.substring(offset + length);
    editor.value = newText;
    handleRefreshButtonClick();
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

