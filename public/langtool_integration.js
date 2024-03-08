var ignoredContainers = [];

function checkLanguage() {
    var text = document.getElementById('editor').value;
    var selectedLanguage = localStorage.getItem('selectedLanguage')
    
    if (!selectedLanguage) {
        console.error('No selected language.');
        return;
    }

    fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'text=' + encodeURIComponent(text) + '&language=' + selectedLanguage
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        createMatchContainers(data.matches);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function createMatchContainers(matches) {
    var grammarContainer = document.getElementById('grammar_containers');
    grammarContainer.innerHTML = '';
    // Verifica se o div_id já está armazenado em ignoredContainers
    if (ignoredContainers.includes(matches.div_id)) {
        return null; // Retorna null se o div_id já estiver na lista de ignoredContainers
    }

    var container = document.getElementById('grammar_containers');

    matches.forEach(function(match, index) {
        if (ignoredContainers.includes(match.div_id)) return;

        var matchContainer = document.createElement('div');
        matchContainer.classList.add('container');
        matchContainer.setAttribute('onclick', 'expandContainer(this)');
        matchContainer.id = match.div_id;

        var title = document.createElement('h2');
        title.textContent = match.shortMessage;

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

        var ignoreButton = document.createElement('div');
        ignoreButton.textContent = 'Ignore';
        ignoreButton.classList.add('grammar_ignore_btn');
        ignoreButton.addEventListener('click', function() {
            ignoreButton(matchContainer);
        });

        contentOptions.appendChild(ignoreButton);

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
}

function ignoreButton(button) {
    var container = button.closest('.container');
    var containerId = container.id; // Obter o ID da DIV container
    ignoredContainers.push(containerId); // Adicionar o ID ao array ignoredContainers
    container.style.display = 'none';
} 

// Usage: Assuming 'data' contains the response JSON provided in your question
createMatchContainers(data.matches);
