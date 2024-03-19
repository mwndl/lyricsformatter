document.addEventListener('DOMContentLoaded', function () {
    // Adicionar evento de clique à div com id 'disconnect_option'
    document.getElementById('disconnect_option').addEventListener('click', disconnectSpotify);

    // Selecionar o botão pelo ID
    var spotifyButton = document.getElementById('spotify_button');

    // Adicionar um event listener para lidar com o clique
    spotifyButton.addEventListener('click', function() {
        openSpotifyAuthorization();
    });
});

document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // ações a executar quando a página ficar ativa novamente
        fetchCurrentlyPlayingData()
    }
});

window.addEventListener('message', receiveMessage, false);

function openSpotifyAuthorization() {
    // Obter o valor de localHostToggle do localStorage
    const localHostToggle = localStorage.getItem('localHostToggle');

    // Verificar o valor de localHostToggle e definir window.serverPath
    if (localHostToggle === 'true') {
        window.serverPath = 'http://localhost:3000'; 
    } else {
        window.serverPath = 'https://datamatch-backend.onrender.com';
    }

    var currentDomain = window.location.hostname;

    // Extrai o prefixo após 'lyricsformatter' usando uma expressão regular
    var match = currentDomain.match(/lyricsformatter-(\w+)\.onrender\.com/);
    
    if (match && match[1]) {
        if (localHostToggle === 'true') {
            callbackPath = 'sp_callback_local_' + match[1];
        } else {
            callbackPath = 'sp_callback_' + match[1];
        }
    } else {
        // padrão
        callbackPath = 'sp_callback_production';
    }
    
    console.log('Callback Path:', callbackPath);

    var spotifyAuthorizationUrl = `https://accounts.spotify.com/pt-BR/authorize?client_id=51a45f01c96645e386611edf4a345b50&redirect_uri=${window.serverPath}/formatter/${callbackPath}&response_type=code&scope=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20user-read-email%20user-read-playback-state%20streaming%20app-remote-control%20user-follow-modify%20user-follow-read%20user-read-playback-position%20user-top-read%20user-read-recently-played%20user-library-read%20user-library-modify%20user-read-private&show_dialog=true&current_domain=${currentDomain}`;

    // Abrir a URL de autorização do Spotify em uma nova janela pop-up
    var popup = window.open(spotifyAuthorizationUrl, 'Spotify Authorization', 'width=600,height=700');

    // Verificar se a janela pop-up foi aberta corretamente
    if (!popup || popup.closed || typeof popup.closed == 'undefined') {
        alert('Por favor, permita janelas pop-up para continuar.');
    } else {
        // Adicionar um intervalo para verificar a URL do popup
        var interval = setInterval(function() {
            try {
                if (popup.location.href.includes('access_token') && popup.location.href.includes('refresh_token')) {
                    clearInterval(interval);
                    // Extrair os tokens da URL do popup
                    var urlParams = new URLSearchParams(popup.location.search);
                    var accessToken = urlParams.get('access_token');
                    var refreshToken = urlParams.get('refresh_token');
                    // Enviar os tokens para a função que os processará
                    processSpotifyTokens(accessToken, refreshToken);
                    // Fechar a janela pop-up
                    popup.close();
                }
            } catch (error) {
                // Ignorar erros de segurança devido à política de mesma origem
            }
        }, 1000);
    }
}

function receiveMessage(event) {

    // Verificar se os dados da mensagem estão presentes
    if (event.data && event.data.accessToken && event.data.refreshToken) {
        // Processar os tokens recebidos
        var accessToken = event.data.accessToken;
        var refreshToken = event.data.refreshToken;
        console.log('Access Token recebido:', accessToken);
        console.log('Refresh Token recebido:', refreshToken);

        // Chamar a função para processar os tokens (adaptada para a janela principal)
        processSpotifyTokens(accessToken, refreshToken);
    }
}

// Função para processar os tokens do Spotify (adaptada para a janela principal)
function processSpotifyTokens(accessToken, refreshToken) {
    // Armazenar os tokens em cache
    const tokenRenewal = new Date().toISOString();
    cacheSpotifyTokens(accessToken, refreshToken, tokenRenewal);

    // Fazer a solicitação para obter dados do usuário
    fetchUserData();
    checkTrackIdParams();
}

// Função para armazenar os tokens do Spotify em cache
function cacheSpotifyTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}


// Função para desconectar o Spotify e atualizar a interface do usuário
function disconnectSpotify() {
    // Remover os tokens do armazenamento local do navegador
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenRenewal');

    // Exibir o botão de login e ocultar a foto do perfil
    document.getElementById('spotify_login_button').style.display = 'block';
    document.getElementById('user_profile').style.display = 'none';

    // Remover o listener 'ready' do player atual, se houver
    if (player) {
        player.removeListener('ready');
        player.disconnect();
    }

}


async function fetchUserData() {
    try {
        // Verificar se é necessário renovar o token
        const tokenRenewalTime = localStorage.getItem('tokenRenewal');
        if (tokenRenewalTime) {
            const currentTime = new Date();
            const lastRenewalTime = new Date(tokenRenewalTime);
            const timeDifferenceMinutes = (currentTime - lastRenewalTime) / (1000 * 60);

            // Se o tempo desde a última renovação for maior que 55 minutos, renovar o token
            if (timeDifferenceMinutes > 55) {
                await spotifyRenewAuth();
            }
        }

        // Recuperar os tokens do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Verificar se os tokens estão em cache
        if (!accessToken || !refreshToken) {
            return; // sair da função porque não há tokens do Spotify
        }

        showSpMenuDiv() // exibir o menu de configs do spotify

        // Fazer uma solicitação fetch para a rota /user no servidor do Spotify
        const response = await fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            if (response.status === 401) {
                // Se o status for 401 (não autorizado), renovar a autorização do Spotify
                await spotifyRenewAuth();
            } else {
                throw new Error(`An error occurred when communicating with Spotify's servers`);
            }
        }

        // Extrair os dados do usuário da resposta
        const userData = await response.json();

        // Exibir a foto de perfil do usuário e ocultar o botão de login
        const spotifyLoginButton = document.getElementById('spotify_login_button');
        const userProfileDiv = document.getElementById('user_profile');
        const userProfileImage = document.getElementById('sp_user_pic');

        if (userProfileImage && userData.images.length > 0) {
            userProfileImage.src = userData.images[0].url;
        }

        if (spotifyLoginButton && userProfileDiv) {
            spotifyLoginButton.style.display = 'none';
            userProfileDiv.style.display = 'block';
        }

    } catch (error) {
        console.error('Error getting user data from Spotify: ', error.message);
    }
}

async function spotifyRenewAuth() {
    try {
        // Recuperar o refreshToken do armazenamento local do navegador
        const refreshToken = localStorage.getItem('refreshToken');

        // Verificar se há refreshToken em cache
        if (!refreshToken) {
            throw new Error('No refresh token found, please reconnect your Spotify account on the settings pop-up.');
        }

        // Obter o valor de localHostToggle do localStorage
        const localHostToggle = localStorage.getItem('localHostToggle');

        // Verificar o valor de localHostToggle e definir window.serverPath
        if (localHostToggle === 'true') {
            window.serverPath = 'http://localhost:3000'; 
        } else {
            window.serverPath = 'https://datamatch-backend.onrender.com';
        }

        // Fazer uma solicitação para a rota /reauth do seu servidor para renovar o accessToken usando refreshToken
        const response = await fetch(`${window.serverPath}/formatter/reauth`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error('Error renewing Spotify authorization.');
        }

        // Extrair o novo accessToken da resposta
        const { accessToken } = await response.json();

        // Atualizar o accessToken no armazenamento local do navegador
        localStorage.setItem('accessToken', accessToken);

        // Definir o item 'tokenRenewal' com a data e hora atual
        const tokenRenewalTime = new Date().toISOString();
        localStorage.setItem('tokenRenewal', tokenRenewalTime);

        console.log('Spotify authorization renewed successfully!');
        fetchCurrentlyPlayingData();
    } catch (error) {
        notification('Spotify authentication failed, please refresh the page');
        console.error('Error renewing Spotify authorization.', error.message);
    }
}

let currentSongId = '';

async function fetchCurrentlyPlayingData() {
    try {
        // Verificar se é necessário renovar o token
        const tokenRenewalTime = localStorage.getItem('tokenRenewal');
        if (tokenRenewalTime) {
            const currentTime = new Date();
            const lastRenewalTime = new Date(tokenRenewalTime);
            const timeDifferenceMinutes = (currentTime - lastRenewalTime) / (1000 * 60);

            // Se o tempo desde a última renovação for maior que 55 minutos, renovar o token
            if (timeDifferenceMinutes > 55) {
                await spotifyRenewAuth();
            }
        }

        // Obter o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            return; // Sair da função porque não há token do Spotify
        }

        // Fazer uma solicitação fetch para a rota /me/player/currently-playing do Spotify
        const response = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a resposta indica que não há música sendo reproduzida (código 204)
        if (response.status === 204) {
            document.getElementById('sp_player_div').style.display = ''; // Exibir elemento
            document.getElementById('sp_connect').style.display = 'none'; // Ocultar elemento
            document.getElementById('sp_fast_transfer').style.display = 'none'
            document.getElementById('playback_info').style.display = 'none'; // Ocultar elemento
            document.getElementById('no_playback').style.display = 'block'; // Ocultar elemento
            currentSongId = '';
            return; // Sair da função

        } else if (response.status === 200) {
            document.getElementById('sp_player_div').style.display = ''; // Exibir elemento
            document.getElementById('sp_connect').style.display = 'block'; // exibir elemento
            document.getElementById('playback_info').style.display = 'flex'; // exibir elemento
            document.getElementById('no_playback').style.display = 'none'; // exibir elemento

        } else if (response.status === 401) {
            spotifyRenewAuth()
            currentSongId = '';
        } else {
            document.getElementById('sp_player_div').style.display = 'none'; // ocultar elemento
            return; // Sair da função
        }

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`An error occurred when communicating with Spotify's servers`);
        }

        // Extrair os dados da música atualmente reproduzida da resposta
        const currentlyPlayingData = await response.json();

        // definir o ID na variável
        currentSongId = currentlyPlayingData.item.id;

        /*  quick transfer */

                spTransferIcon = document.getElementById('sp_fast_transfer');
                altDeviceId = getParameterByName('alt_device_id')

                if (currentlyPlayingData.device.id === deviceId && altDeviceId === null) {
                    spTransferIcon.style.display = 'none'
                } else {

                    if (currentlyPlayingData.device.id === deviceId) {
                        spTransferIcon.title = `Transfer the song back`;
                    } else {
                        addParamToURL('alt_device_id', currentlyPlayingData.device.id);
                        spTransferIcon.style.display = '';
                        spTransferIcon.title = 'Transfer the song to LyricsFormatter';
                    }
                }

                if (altDeviceId) {
                    spTransferIcon.style.display = 'block'
                }

        /*  quick transfer */

        // Atualizar os elementos HTML com as informações da música atualmente reproduzida
        const albumArtElement = document.getElementById('sp_album_art');
        const titleElement = document.getElementById('sp_title');
        const albumElement = document.getElementById('sp_album');
        const artistElement = document.getElementById('sp_artist');

        if (albumArtElement && currentlyPlayingData.item.album.images.length > 0) {
            albumArtElement.innerHTML = `<img src="${currentlyPlayingData.item.album.images[0].url}" alt="album art" title="${currentlyPlayingData.item.name} | ${currentlyPlayingData.item.artists[0].name}">`;
        }

        if (titleElement) {
            titleElement.innerHTML = `<a href="https://open.spotify.com/track/${currentlyPlayingData.item.id}" target="_blank">${currentlyPlayingData.item.name}</a>`;
        }

        if (artistElement) {
            const artistLinks = currentlyPlayingData.item.artists.map(artist => `<a href="https://open.spotify.com/artist/${artist.id}" target="_blank">${artist.name}</a>`);
            artistElement.innerHTML = artistLinks.join(', ');
        }

        if (albumElement) {
            albumElement.innerHTML = `<a href="https://open.spotify.com/album/${currentlyPlayingData.item.album.id}" target="_blank">${currentlyPlayingData.item.album.name}</a>`;
        }

        // Atualizar o estado do botão play/pause e o tracker da música
        if (currentlyPlayingData.is_playing) {
            // reproduzindo
        } else {
           // pausado
        }

        return currentlyPlayingData;

    } catch (error) {
        console.error('Error getting data from currently playing song: ', error.message);
    }
}

// Função para obter os dados de análise de áudio uma vez quando a música é carregada
async function loadAudioAnalysis(accessToken, songId) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/audio-analysis/${songId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`An error occurred when fetching audio analysis`);
        }

        const audioAnalysisData = await response.json();
        const starts = audioAnalysisData.sections.map(section => section.start);
        return starts;

    } catch (error) {
        console.error('Error loading audio analysis: ', error.message);
        return null; // Return null if there's an error
    }
}

// Função para obter a posição da próxima seção de áudio em MS
function nextSection(currentPosition, sectionStartTimes) {
    if (!currentPosition || !Array.isArray(sectionStartTimes)) {
        console.error('Invalid position or audio analysis data');
        return null;
    }

    const nextSection = sectionStartTimes.find(section => section > currentPosition);
    
    if (nextSection !== undefined) {
        return nextSection * 1000;
    } else {
        return null;
    }
}

// Função para obter a posição da última seção de áudio em MS
function repeatSection(currentPosition, sectionStartTimes) {
    if (!currentPosition || !Array.isArray(sectionStartTimes)) {
        console.error('Invalid position or audio analysis data');
        return null;
    }

    const reversedSectionStartTimes = sectionStartTimes.slice().reverse(); // Inverte o array
    const lastSection = reversedSectionStartTimes.find(section => section < currentPosition);

    if (lastSection !== undefined) {
        return lastSection * 1000;
    } else {
        return null;
    }
}

// Função para obter a posição da seção antes da última de áudio em MS
function beforeLastSection(currentPosition, sectionStartTimes) {
    if (!currentPosition || !Array.isArray(sectionStartTimes) || sectionStartTimes.length < 2) {
        console.error('Invalid position or audio analysis data');
        return null;
    }

    let beforeLastSectionTime = null;

    for (let i = sectionStartTimes.length - 1; i >= 0; i--) {
        if (sectionStartTimes[i] < currentPosition) {
            if (i > 0) {
                beforeLastSectionTime = sectionStartTimes[i - 1];
            }
            break;
        }
    }

    if (beforeLastSectionTime !== null) {
        return beforeLastSectionTime * 1000;
    } else {
        return 0;
    }
}


// Função para curtir/descurtir uma música com base no ID da música
async function toggleLikeSong() {
    try {
        // Obter o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            return; // Sair da função porque não há token do Spotify
        }

        // Verificar se o ID da música atual está na biblioteca do usuário
        const isSongInLibrary = await checkIfSongInLibrary(accessToken, currentSongId);

        // URL da API do Spotify para adicionar ou remover músicas da biblioteca
        const apiURL = isSongInLibrary
            ? `https://api.spotify.com/v1/me/tracks?ids=${currentSongId}`
            : `https://api.spotify.com/v1/me/tracks?ids=${currentSongId}`;

        // Método HTTP para adicionar ou remover músicas da biblioteca
        const method = isSongInLibrary ? 'DELETE' : 'PUT';

        // Fazer a solicitação fetch para adicionar ou remover a música da biblioteca
        const response = await fetch(apiURL, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`An error occurred when updating user's library`);
        }

        // Atualizar o estado da curtida/descurtida conforme necessário
        if (isSongInLibrary) {
            console.log(`Música com ID ${currentSongId} removida da biblioteca.`);
        } else {
            console.log(`Música com ID ${currentSongId} adicionada à biblioteca.`);
        }

    } catch (error) {
        console.error('Error toggling like for the current song: ', error.message);
    }
}

// Função para verificar se uma música está na biblioteca do usuário
async function checkIfSongInLibrary(accessToken, songId) {
    try {
        // Fazer a solicitação fetch para verificar se a música está na biblioteca
        const response = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${songId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`An error occurred when checking if the song is in the user's library`);
        }

        // Extrair e retornar o resultado (true se a música estiver na biblioteca, false se não estiver)
        const result = await response.json();
        return result[0];

    } catch (error) {
        console.error('Error checking if the song is in the user\'s library: ', error.message);
        return false; // Retornar false em caso de erro
    }
}

async function fetchAvailableDevices() {
    try {
        // Obter o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            return; // Sair da função porque não há token do Spotify
        }

        // Fazer uma solicitação fetch para a rota /me/player/devices do Spotify
        const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`An error occurred when communicating with Spotify's servers`);
        }

        // Extrair os dados dos dispositivos disponíveis da resposta
        const devicesData = await response.json();

        // Atualizar o menu com os nomes dos dispositivos disponíveis e definir o 'data-id' como o ID do dispositivo
        const devicesOptionsElement = document.getElementById('devices_options');
        
        if (devicesOptionsElement) {
            devicesOptionsElement.innerHTML = ''; // Limpar o conteúdo atual do menu
            devicesData.devices.forEach(device => {
                const deviceElement = document.createElement('div');
                deviceElement.classList.add('sp_device');
                deviceElement.textContent = device.name;
                deviceElement.setAttribute('data-id', device.id); // Definir o 'data-id' como o ID do dispositivo
                devicesOptionsElement.appendChild(deviceElement);
            });
            devicesOptionsElement.style.display = 'none'; 

            // Adicionar event listeners aos novos elementos
            const deviceElements = devicesOptionsElement.querySelectorAll('.sp_device');
            deviceElements.forEach(deviceElement => {
                deviceElement.addEventListener('click', function() {
                    devicesOptionsElement.style.display = 'none'; 
                    const deviceID = this.getAttribute('data-id');
                    const accessToken = localStorage.getItem('accessToken');
                    transferPlayback(accessToken, deviceID);
                });
            });
        }

    } catch (error) {
        console.error('Error fetching available devices: ', error.message);
    }
}

// Function to transfer playback between available devices
async function transferPlayback(accessToken, deviceID) {
    try {

        const response = await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_ids: [deviceID]
            })
        });
        
        if (!response.ok) {
            throw new Error('response not ok');
        }

        console.log('Playback transferred successfully.');

    } catch (error) {
        console.error('Error transferring playback: ', error.message);
        fetchAvailableDevices().then(() => {
            fetchCurrentlyPlayingData()
        });
        const urlWithoutAltDevice = removeParameterFromURL('alt_device_id');
        history.replaceState(null, '', urlWithoutAltDevice);
        notification("Unable to switch playback, the device is unavailable")
    }
}

async function playTrack(trackId, deviceId) {
    try {
        // Recuperar o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            console.log('Access token not found. Cannot play track.');
            return;
        }

        // Fazer uma solicitação fetch para reproduzir a faixa
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: [`spotify:track:${trackId}`]
            })
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Failed to play track. Status: ${response.status}`);
        }

        console.log(`Track ${trackId} playback started successfully.`);
    } catch (error) {
        console.error('Error playing track: ', error.message);
    }
}


async function pausePlayback() {
    try {
        // Recuperar o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            console.log('Access token not found. Cannot pause playback.');
            return;
        }

        // Fazer uma solicitação fetch para pausar a reprodução
        const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Failed to pause playback. Status: ${response.status}`);
        }

        console.log('Playback paused successfully.');
    } catch (error) {
        console.error('Error pausing playback: ', error.message);
    }
}

async function resumePlayback() {
    try {
        // Recuperar o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            console.log('Access token not found. Cannot resume playback.');
            return;
        }

        // Fazer uma solicitação fetch para retomar a reprodução
        const response = await fetch('https://api.spotify.com/v1/me/player/play', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        fetchCurrentlyPlayingData()

        // Verificar se a solicitação foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Failed to resume playback. Status: ${response.status}`);
        }

        console.log('Playback resumed successfully.');
    } catch (error) {
        console.error('Error resuming playback: ', error.message);
    }
}
