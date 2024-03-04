function checkLanguage() {
    var text = document.getElementById('editor').value;
    var selectedLanguage = localStorage.getItem('selectedLanguage')
    
    if (!selectedLanguage) {
        console.error('Nenhum idioma selecionado.');
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
        // Aqui você pode manipular a resposta do servidor LanguageTool
    })
    .catch(error => {
        console.error('Error:', error);
    });
}