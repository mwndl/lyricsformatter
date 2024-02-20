<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="google" value="notranslate">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link rel="stylesheet" href="lyricsformatter.css">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="script_formatter.js"></script>
    <link rel="icon" href="/images/favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha384-e3b0a8b1e4095176f4a6f42c37b4efb51337fba6c937e281a5f3800f76475893" crossorigin="anonymous">
    <title>LyricsFormatter</title>
</head>

    <body>
        <div class="top">
            <div class="return">
                <img class="return_arrow" id="return_arrow" src="images\arrow.svg" alt="Return Arrow" title="Return to Home" draggable="false" style="display:none">
            </div>
            <div class="page_title">LyricsFormatter</div>
            <div class="settings">
                <img class="options_dots" id="settings_dots" src="images\options.svg" alt="Options" title="Options" draggable="false" style="display:block">
                <!-- Mini menu -->
                <div id="mini_menu" class="mini-menu">
                    <ul>
                        <li id="settings_option" style="display:block; border-radius: 10px;">
                            <p>Settings</p>
                        </li>
                        <li id="credits_option" style="display:block; border-radius: 10px;">
                            <p>Credits</p>
                        </li>
                        <li id="suggest_option" style="display:none; border-radius: 10px;">
                            <p>Suggest a Feature</p>
                        </li>
                        <li id="about_option" style="display:block; border-radius: 10px;">
                            <p>About This Tool</p>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    
        <div class="main">
            <div class="main_content">
                <div class="main_left">
                    <div class="lyrics_box" id="lyrics_box">
                        <div class="editor-container">
                            <div class="line_issues" id="line_issues"></div>
                            <div class="character_counter"></div>
                            <textarea class="editor" id="editor" placeholder="Paste the lyrics here..." oninput="checkContent();"></textarea>
                        </div>
                    </div>
                </div>
                <div class="main_right">
                    <div class="language_selector">
                        <div class="lang_selector_div" title="Tap to see list of supported languages">
                            <div class="selected_language">Select Language</div>
                            <div class="mobile_footer_arrow">
                                <img class="lang_expand_arrow" id="lang_expand_arrow" src="images/expand_arrow.svg" alt="Expand Arrow" draggable="false">
                            </div>
                        </div>
                        <ul class="language_list" id="language_list">
                            <li data-lang="en-UK">English (UK)</li>
                            <li data-lang="en-US">English (US)</li>
                            <li data-lang="nl" style="display:none">Dutch</li>
                            <li data-lang="fr">French<span class="new_tag">new</span></li>
                            <li data-lang="de" style="display:none">German<span class="new_tag">new</span></li>
                            <li data-lang="it">Italian<span class="beta_tag">beta</span></li>
                            <li data-lang="pt-BR">Portuguese (BR)</li>
                            <li data-lang="pt-PT">Portuguese (PT)</li>
                            <li data-lang="es">Spanish<span class="new_tag">new</span></li>
                            <p>More languages soon...</p>
                        </ul>
                    </div>
                    <div class="improvements_box">
                        <div class="improvements_box_top">
                            <div class="improvements_box_text">
                                <p>Suggestions</p>
                            </div>
                            <div class="improvements_box_buttons" style="">
                                <div class="reset_div">
                                    <button class="reset_button" id="reset_button" style="display:none" title="Reset transcription" onclick="resetTranscription()">
                                        <div class="reset_symbol"></div>
                                    </button>
                                </div>
                                <div class="refresh_div">
                                    <button class="refresh_button" id="refresh_button" style="display:none" title="Refresh suggestions" onclick="handleRefreshButtonClick()">
                                        <div class="refresh_symbol"></div>
                                    </button>
                                    <div class="loading_spinner_loop" id="loading_spinner" style="display:none">
                                        <div class="loading_spinner">
                                          <div></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="improvements_box_content">
                            <div class="improvements" id="improvements_containers">
                                <div class="improvements_placeholder_div" id="improvements_placeholder_div">
                                    <div class="improvements_placeholder" id="improvements_placeholder">Type something or paste your transcription to start...</div>
                                </div>
                            </div>                            
                        </div>
                    </div>
                    <div class="sp_player_div">
                        <div class="sp_player_div_content">
                            <div class="sp_search">
                                <div class="search-container">
                                    <input type="text" placeholder="Paste a Spotify track ID or URL" id="search_input">
                                    <button type="submit" style="" id="search_btn">Search</button>
                                    <div class="loading_spinner_loop" id="loading_spinner" style="display:none">
                                      <div class="loading_spinner">
                                        <div></div>
                                      </div>
                                    </div>
                                </div>
                            </div>
                            <div class="sp_player">
                                <div class="spotify_preview" style="border-radius: 12px; overflow: hidden; user-select: none;">
                                    <iframe id="spotify_iframe_preview" border-radius: 12px user-select: none src="" width="100%"
                                      height="100%" frameBorder="0" allowfullscreen=""
                                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                      loading="lazy"></iframe>
                                  </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mobile_expanded_content" id="mobile_expanded_content">
                <div class="main_right">
                    <div class="language_selector"></div>
                    <div class="improvements_box"></div>
                    <div class="sp_player_div"></div>
                </div>
            </div>
        </div>
        <div id="notification" class="hidden">
            <div class="notification-content">
              <p id="notification-message"></p>
            </div>
        </div>
        <div class="footer" id="footer">
            <div class="footer_message">Please note that this tool only provides suggestions based on your current transcription. It is still essential to thoroughly review all the content before sending.</div>
        </div>    
        <div class="development_message">
            <h2>Mobile Interface Under Development</h2>
            <p>The interface for mobile devices is still under development. Please use a PC for the best experience.</p>
        </div>

        <div id="overlay"></div>

        <div id="settings_popup" class="popup">
            <div id="closeButton" onclick="closeSettings()">&#215;</div>
            <div class="popup_title">
                <h2 onclick="handleSettingsClick()">Settings</h2>
            </div>
            <div class="popup_content">
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Spotify account</p>
                        <p class="popup_option_description">Connect your Spotify account to LyricsFormatter</p>
                    </div>
                    <div class="spotify_login" id="spotify_login_button" style="display:block">
                        <button class="spotify_button" onclick="window.location.href='https://accounts.spotify.com/pt-BR/authorize?client_id=51a45f01c96645e386611edf4a345b50&redirect_uri=http://localhost:3000/formatter/sp_callback&response_type=code&scope=user-read-playback-state%20user-modify-playback-state%20user-modify-playback-state%20user-read-currently-playing%20user-read-email%20user-read-playback-state'">
                            <img src="images/spotify_logo.webp" alt="Spotify Logo" class="spotify_logo">
                            Login with Spotify
                        </button>
                    </div>
                    <div class="user-profile" id="user_profile" style="display:none">
                        <img class="user-photo" id="sp_user_pic" src="#" alt="User Photo" title="User Photo" draggable="false">
                        <div id="user_menu" class="user-menu">
                            <ul>
                                <li id="disconnect_option" style="border-radius: 10px;">
                                    <p>Disconnect account</p>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <hr style="border-top: 1px solid rgb(100, 100, 100); border-right: none; border-bottom: none; border-left: none; border-image: initial;">
                <div class="popup_option" style="display:none">
                    <div class="popup_title">
                        <p class="popup_option_title">Character counter</p>
                        <p class="popup_option_description">Select this option for the character counter</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="characterCounterToggle" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Auto capitalization</p>
                        <p class="popup_option_description">Select this option to automatically capitalize the first letter of the lines</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoCapToggle" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Auto trim lines</p>
                        <p class="popup_option_description">Select this option to automatically trim the lines</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoTrimToggle" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Remove duplicate lines and spaces</p>
                        <p class="popup_option_description">Select this option to automatically remove duplicate spaces and lines</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="removeDoubleSpacesAndLinesToggle" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Auto capitalize tags</p>
                        <p class="popup_option_description">Select this option to automatically capitalize tags</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoCapTagsToggle" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Automatic suggestions</p>
                        <p class="popup_option_description">Select this option for automatic format suggestions</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="autoSuggestions" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="dev_hided_div" id="dev_hided_div" style="display:none">
                    <hr style="border-top: 1px solid rgb(100, 100, 100); border-right: none; border-bottom: none; border-left: none; border-image: initial;">
                    <div class="popup_option">
                        <div class="popup_title">
                            <p class="popup_option_title">Development mode</p>
                            <p class="popup_option_description">Select this option to switch to the local server</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="localHostToggle" onclick="checkContent()">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div id="credits_popup" class="popup">
            <div id="closeButton" onclick="closeCredits()">&#215;</div>
            <div class="popup_title">
                <h2>Credits</h2>
            </div>
            <div class="popup_description">
                <p></p>
            </div>
            <div class="popup_content" style="display: flex; align-items: center;">
                <div class="loading_container" id="loading_container">
                    <div class="loading_spinner_loop" id="loading_spinner_credits" style="display:block">
                        <div class="loading_spinner">
                            <div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="suggest_popup" class="popup">
            <div id="closeButton" onclick="closeSuggestions()">&#215;</div>
            <div class="popup_title">
                <h2>Suggest a feature</h2>
            </div>
            <div class="popup_description">
                <p></p>
            </div>
            <div class="popup_content" style="display: flex; align-items: center;">
                <form>
                    <select name="select_menu" id="select_menu" onchange="updateOptions()">
                        <option value="" disabled selected>Select an option</option>
                        <option value="option1">Suggest word for the dictionary</option>
                        <option value="option2">Suggest a new format alert</option>
                        <option value="option3">Send a feedback</option>
                        <option value="option4">Report a bug</option>
                    </select>
                    <br>
                    <input type="text" name="text1" style="display: none;">
                    <br>
                    <input type="text" name="text2" style="display: none;">
                    <br>
                    <input type="text" name="text3" style="display: none;">
                    <br>
                    <textarea type="text" name="text4" style="display: none; word-wrap: break-word;"></textarea>
                </form>
            </div>
        </div>

        <div id="about_popup" class="popup">
            <div id="closeButton" onclick="closeAboutInfo()">&#215;</div>
            <div class="popup_title">
                <h2>About this tool</h2>
            </div>
            <div class="popup_description">
            </div>
            <div class="popup_content" id="aboutContent" style="display: flex; align-items: center;">
                <div class="loading_container" id="loading_container">
                    <div class="loading_spinner_loop" id="loading_spinner_credits" style="display:block">
                        <div class="loading_spinner">
                            <div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>

                function checkContent() {

                        const checkboxIds = [
                            'characterCounterToggle',
                            'autoCapToggle',
                            'autoTrimToggle',
                            'removeDoubleSpacesAndLinesToggle',
                            'autoCapTagsToggle',
                            'autoSuggestions',
                            'localHostToggle'
                        ];

                        checkboxIds.forEach(function (checkboxId) {
                            const checkbox = document.getElementById(checkboxId);
                            localStorage.setItem(checkboxId, checkbox.checked);
                        });
                        setCheckboxStates();
                }

                function handleSettingsClick() {
                    clickCount++;

                    // Se o usuário clicou 5 vezes, exibir a div e reiniciar a contagem
                    if (clickCount === 5) {
                        displayDevModeDiv();
                        clickCount = 0;
                    }
                }

                // Função para exibir/ocultar a div e salvar a escolha em cache
                function displayDevModeDiv() {
                    const devHidedDiv = document.getElementById('dev_hided_div');
                    const devMode = localStorage.getItem('devMode') === 'true'; // Obtém o estado atual do modo de desenvolvimento

                    // Alterna entre exibir e ocultar a div
                    if (devMode) {
                        devHidedDiv.style.display = 'none';
                    } else {
                        devHidedDiv.style.display = 'block';
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
                loadDevMode();


                document.addEventListener('DOMContentLoaded', function () {
                    var expandArrow = document.getElementById('expand_arrow');
                    var footer = document.getElementById('footer');
                    var footerHidedContent = document.getElementById('footer_hided_content');
                    var mobileFooterDiv = document.getElementById('mobile_footer_div');

                    expandArrow.addEventListener('click', function (event) {
                        event.stopPropagation(); // Impede que o clique seja propagado para o corpo/documento
                        footer.classList.toggle('expanded');

                        if (footer.classList.contains('expanded')) {
                            footerHidedContent.style.display = "block";
                            mobileFooterDiv.style.height = "8%";
                            expandArrow.style.transform = "rotate(180deg)";
                        } else {
                            footerHidedContent.style.display = "none";
                            mobileFooterDiv.style.height = "100%";
                            expandArrow.style.transform = "rotate(0deg)";
                        }
                    });

                    // Adiciona um ouvinte de eventos ao corpo/documento para fechar o footer quando clicar fora dele
                    document.body.addEventListener('click', function (event) {
                        if (!footer.contains(event.target)) {
                            // Se o clique ocorreu fora do footer, oculta o conteúdo e recolhe o footer
                            footerHidedContent.style.display = "none";
                            mobileFooterDiv.style.height = "100%";
                            expandArrow.style.transform = "rotate(0deg)";
                            footer.classList.remove('expanded');
                        }
                    });
                });
                function closeSettings() {
                    var settingsPopup = document.getElementById("settings_popup");
                    var overlay = document.getElementById("overlay");
                    settingsPopup.style.display = "none";
                    overlay.style.display = "none";
                }
                function closeCredits() {
                    var creditsPopup = document.getElementById("credits_popup");
                    var overlay = document.getElementById("overlay");
                    creditsPopup.style.display = "none";
                    overlay.style.display = "none";
                }
                function closeSuggestions() {
                    var suggestPopup = document.getElementById("suggest_popup");
                    var overlay = document.getElementById("overlay");
                    suggestPopup.style.display = "none";
                    overlay.style.display = "none";
                }
                function closeAboutInfo() {
                    var aboutPopup = document.getElementById("about_popup");
                    var overlay = document.getElementById("overlay");
                    aboutPopup.style.display = "none";
                    overlay.style.display = "none";
                }


                // Função para atualizar as opções abaixo com base na seleção do menu seletor
                function updateOptions() {
                    var selectMenu = document.getElementById("select_menu");
                    var text1 = document.getElementsByName("text1")[0];
                    var text2 = document.getElementsByName("text2")[0];
                    var text3 = document.getElementsByName("text3")[0];
                    var text4 = document.getElementsByName("text4")[0];

                    // Verifica a opção selecionada
                    var selectedOption = selectMenu.value;

                    // Remove todas as classes dos elementos de texto
                    text1.classList.remove("option1", "option2", "option3", "option4");
                    text2.classList.remove("option1", "option2", "option3", "option4");
                    text3.classList.remove("option1", "option2", "option3", "option4");
                    text4.classList.remove("option1", "option2", "option3", "option4");

                    // Adiciona as classes apropriadas com base na opção selecionada
                    switch (selectedOption) {
                        case "option1": // Suggest word for the dictionary
                            text1.classList.add("option1");
                            text1.placeholder = "Digite o seu nome";
                            text1.style.display = "block"

                            text2.classList.add("option1");
                            text2.placeholder = "Digite aqui as palavras incorretas (separe cada uma usando uma '/')";
                            text2.style.display = "block"; 

                            text3.classList.add("option1");
                            text3.placeholder = "Digite aqui a correção";
                            text3.style.display = "block"; 

                            text4.classList.add("popup_details");
                            text4.placeholder = "Observações";
                            text4.style.display = "block"; 
                            break;
                        case "option2": // Suggest a new format alert
                            text1.classList.add("option2");
                            text1.placeholder = "Digite o seu nome";
                            text1.style.display = "block"

                            text2.classList.add("option2");
                            text2.placeholder = "Format suggestion";
                            text2.style.display = "block"; 

                            text3.classList.add("option2");
                            text3.placeholder = "Digite aqui a correção";
                            text3.style.display = "block"; 

                            text4.classList.add("popup_details");
                            text4.placeholder = "Observações";
                            text4.style.display = "block"; 
                            break;
                        case "option3": // Send a feedback
                            text1.classList.add("option3");
                            text1.placeholder = "Digite o seu nome";
                            text1.style.display = "block"

                            text2.classList.add("option3");
                            text2.placeholder = "Enter your feedback";
                            text2.style.display = "block"; 

                            text3.classList.add("option3");
                            text3.placeholder = "Digite aqui a correção";
                            text3.style.display = "none"; 

                            text4.classList.add("popup_details");
                            text4.placeholder = "Observações";
                            text4.style.display = "none"; 
                            break;
                        case "option4": // Report a bug
                            text1.classList.add("option4");
                            text1.placeholder = "Digite o seu nome";
                            text1.style.display = "block"

                            text2.classList.add("option4");
                            text2.placeholder = "Enter the bug details";
                            text2.style.display = "block"; // Exibe o segundo campo de texto

                            
                            text3.classList.add("option4");
                            text3.placeholder = "Digite aqui a correção";
                            text3.style.display = "none"; 

                            text4.classList.add("popup_details");
                            text4.placeholder = "Observações";
                            text4.style.display = "none"; 
                            break;
                        default:
                            break;
                    }
                }
        </script>
    </body>
</html>


