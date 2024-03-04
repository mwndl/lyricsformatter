document.addEventListener('DOMContentLoaded', function () {
    // Adicionar evento de clique à div com id 'disconnect_option'
    document.getElementById('disconnect_option').addEventListener('click', disconnectSpotify);
    processSpotifyTokensFromURL();

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

function processSpotifyTokensFromURL() {
    // Verificar se há tokens do Spotify na URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    // Se os tokens estiverem presentes, armazená-los em cache e fazer a solicitação para obter dados do usuário
    if (accessToken && refreshToken) {
        // Armazenar os tokens em cache
        cacheSpotifyTokens(accessToken, refreshToken);

        // Remover os parâmetros da URL
        window.history.replaceState({}, document.title, window.location.pathname);

        // Fazer a solicitação para obter dados do usuário
        fetchUserData()
            .then(() => {
                player.connect();
            })
            .catch(error => {
                console.error('Error processing Spotify tokens:', error);
            });
    }
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

    // Exibir o botão de login e ocultar a foto do perfil
    document.getElementById('spotify_login_button').style.display = 'block';
    document.getElementById('user_profile').style.display = 'none';
}


async function fetchUserData() {
    try {
        // Recuperar os tokens do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        // Verificar se os tokens estão em cache
        if (!accessToken || !refreshToken) {
            return; // sair da função porque não há tokens do Spotify
        }

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

        // Exibir os dados do usuário no console (você pode fazer outra coisa com eles)
        console.log('User data from Spotify: ', userData);

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

        console.log('Spotify authorization renewed successfully!');
        fetchCurrentlyPlayingData()
    } catch (error) {
        notification('Spotify authentication failed, please refresh the page');
        console.error('Error renewing Spotify authorization.', error.message);
    }
}

async function fetchCurrentlyPlayingData() {
    try {
        // Obter o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            return; // Sair da função porque não há token do Spotify
        }

        // Fazer uma solicitação fetch para a rota /me/player/currently-playing do Spotify
        const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Verificar se a resposta indica que não há música sendo reproduzida (código 204)
        if (response.status === 204) {
            document.getElementById('sp_player_div').style.display = ''; // Exibir elemento
            document.getElementById('sp_connect').style.display = 'none'; // Ocultar elemento
            document.getElementById('playback_info').style.display = 'none'; // Ocultar elemento
            document.getElementById('no_playback').style.display = 'block'; // Ocultar elemento
            return; // Sair da função
        } else if (response.status === 200) {
            document.getElementById('sp_player_div').style.display = ''; // Exibir elemento
            document.getElementById('sp_connect').style.display = 'block'; // exibir elemento
            document.getElementById('playback_info').style.display = 'flex'; // exibir elemento
            document.getElementById('no_playback').style.display = 'none'; // exibir elemento
        } else if (response.status === 401) {
            spotifyRenewAuth()
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

        // Atualizar os elementos HTML com as informações da música atualmente reproduzida
        const albumArtElement = document.getElementById('sp_album_art');
        const titleElement = document.getElementById('sp_title');
        const albumElement = document.getElementById('sp_album');
        const artistElement = document.getElementById('sp_artist');
        const trackerElement = document.getElementById('tracker');
        const controlContainer = document.getElementById('play_pause');
        const svg1 = controlContainer.querySelector('svg:nth-child(1)');
        const svg2 = controlContainer.querySelector('svg:nth-child(2)');

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
            const progress_ms = currentlyPlayingData.progress_ms;
            const duration_ms = currentlyPlayingData.item.duration_ms;
            const progressPercent = (progress_ms / duration_ms) * 100;
            updatePlaybackState(false, progressPercent); // Atualiza o estado de reprodução como reproduzindo
        } else {
            const progress_ms = currentlyPlayingData.progress_ms;
            const duration_ms = currentlyPlayingData.item.duration_ms;
            const progressPercent = (progress_ms / duration_ms) * 100;
            updatePlaybackState(true, 0); // Atualiza o estado de reprodução como pausado
        }

    } catch (error) {
        console.error('Error getting data from currently playing song: ', error.message);
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
                    transferPlayback(deviceID);
                });
            });
        }

    } catch (error) {
        console.error('Error fetching available devices: ', error.message);
    }
}

// Função para transferir a reprodução para um dispositivo específico
async function transferPlayback(deviceID) {
    try {
        // Obter o token de acesso do armazenamento local do navegador
        const accessToken = localStorage.getItem('accessToken');

        // Verificar se o token de acesso está em cache
        if (!accessToken) {
            return; // Sair da função porque não há token do Spotify
        }

        // Fazer uma solicitação fetch para o endpoint /me/player do Spotify com o dispositivo específico
        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_ids: [deviceID]
            })
        });

        console.log('Playback transferido para o dispositivo com sucesso.');
        fetchAvailableDevices()

    } catch (error) {
        console.error('Error transferring playback: ', error.message);
        fetchAvailableDevices()
    }
}


function togglePlayPause() {
    const svg1 = document.getElementById('svg1'); // Botão de play
    const svg2 = document.getElementById('svg2'); // Botão de pause

    // Verifica se o svg1 está visível, o que indica que a música está pausada
    if (window.getComputedStyle(svg1).display === 'block') {
        // Se o svg1 está visível, esconde ele e mostra o svg2
        svg1.style.display = 'none';
        svg2.style.display = 'block';
    } else {
        // Se o svg1 não está visível, mostra ele e esconde o svg2
        svg1.style.display = 'block';
        svg2.style.display = 'none';
    }
}


// Função para atualizar o slider da música conforme o tocador toca
function updateTracker(positionMs, durationMs) {
    const percentage = (positionMs / durationMs) * 100;
    trackerElement.style.width = `${percentage}%`;

    setInterval(() => {
        // Substitua trackPositionMs e trackDurationMs pelos valores reais
        updateTracker(trackPositionMs, trackDurationMs);
    }, 1000);
}


// Atualize o estado do botão play/pause e o tracker da música
function updatePlaybackState(isPaused, progressPercent) {
    const svg1 = controlContainer.querySelector('svg:nth-child(1)');
    const svg2 = controlContainer.querySelector('svg:nth-child(2)');
    const trackerElement = document.getElementById('tracker');

    if (isPaused) {
        svg1.style.display = 'none';
        svg2.style.display = 'block';
    } else {
        svg1.style.display = 'block';
        svg2.style.display = 'none';
        trackerElement.value = progressPercent; // Atualiza a posição do tracker
    }
}


// Obter o estado atual do player
player.getCurrentState().then(state => {
    if (!state) {
        console.error('O usuário não está reproduzindo música através do Web Playback SDK');
        return;
    }

    const current_track = state.track_window.current_track;
    const next_track = state.track_window.next_tracks[0];

    console.log('Atualmente tocando:', current_track);
    console.log('Próxima música:', next_track);

}).catch(error => {
    console.error('Erro ao obter estado atual do player:', error);
});

setInterval(checkPlayerState, 2000);



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