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
                    <div class="improvements_box" style="height: calc(90% - 100px);">
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
                    <div class="sp_player_div" id="sp_player_div" style="display:none; margin: 0 0 0 0">
                        <div class="sp_player_div_content">
                            <div class="sp_search" style="display:none">
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
                                <div class="spotify_player">
                                    <div class="sp_web_player">
                                        <div class="sp_up">
                                            <div class="button-container">
                                                <div class="round-button"></div>
                                                <div class="round-button" id="player_refresh">
                                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4.39502 12.0014C4.39544 12.4156 4.73156 12.751 5.14577 12.7506C5.55998 12.7502 5.89544 12.4141 5.89502 11.9999L4.39502 12.0014ZM6.28902 8.1116L6.91916 8.51834L6.91952 8.51777L6.28902 8.1116ZM9.33502 5.5336L9.0396 4.84424L9.03866 4.84464L9.33502 5.5336ZM13.256 5.1336L13.4085 4.39927L13.4062 4.39878L13.256 5.1336ZM16.73 7.0506L16.1901 7.57114L16.1907 7.57175L16.73 7.0506ZM17.7142 10.2078C17.8286 10.6059 18.2441 10.8358 18.6422 10.7214C19.0403 10.607 19.2703 10.1915 19.1558 9.79342L17.7142 10.2078ZM17.7091 9.81196C17.6049 10.2129 17.8455 10.6223 18.2464 10.7265C18.6473 10.8307 19.0567 10.5901 19.1609 10.1892L17.7091 9.81196ZM19.8709 7.45725C19.9751 7.05635 19.7346 6.6469 19.3337 6.54272C18.9328 6.43853 18.5233 6.67906 18.4191 7.07996L19.8709 7.45725ZM18.2353 10.7235C18.6345 10.8338 19.0476 10.5996 19.1579 10.2004C19.2683 9.80111 19.034 9.38802 18.6348 9.2777L18.2353 10.7235ZM15.9858 8.5457C15.5865 8.43537 15.1734 8.66959 15.0631 9.06884C14.9528 9.46809 15.187 9.88119 15.5863 9.99151L15.9858 8.5457ZM19.895 11.9999C19.8946 11.5856 19.5585 11.2502 19.1443 11.2506C18.7301 11.251 18.3946 11.5871 18.395 12.0014L19.895 11.9999ZM18.001 15.8896L17.3709 15.4829L17.3705 15.4834L18.001 15.8896ZM14.955 18.4676L15.2505 19.157L15.2514 19.1566L14.955 18.4676ZM11.034 18.8676L10.8815 19.6019L10.8839 19.6024L11.034 18.8676ZM7.56002 16.9506L8.09997 16.4301L8.09938 16.4295L7.56002 16.9506ZM6.57584 13.7934C6.46141 13.3953 6.04593 13.1654 5.64784 13.2798C5.24974 13.3942 5.01978 13.8097 5.13421 14.2078L6.57584 13.7934ZM6.58091 14.1892C6.6851 13.7884 6.44457 13.3789 6.04367 13.2747C5.64277 13.1705 5.23332 13.4111 5.12914 13.812L6.58091 14.1892ZM4.41914 16.544C4.31495 16.9449 4.55548 17.3543 4.95638 17.4585C5.35727 17.5627 5.76672 17.3221 5.87091 16.9212L4.41914 16.544ZM6.05478 13.2777C5.65553 13.1674 5.24244 13.4016 5.13212 13.8008C5.02179 14.2001 5.25601 14.6132 5.65526 14.7235L6.05478 13.2777ZM8.30426 15.4555C8.70351 15.5658 9.11661 15.3316 9.22693 14.9324C9.33726 14.5331 9.10304 14.12 8.70378 14.0097L8.30426 15.4555ZM5.89502 11.9999C5.89379 10.7649 6.24943 9.55591 6.91916 8.51834L5.65889 7.70487C4.83239 8.98532 4.3935 10.4773 4.39502 12.0014L5.89502 11.9999ZM6.91952 8.51777C7.57513 7.50005 8.51931 6.70094 9.63139 6.22256L9.03866 4.84464C7.65253 5.4409 6.47568 6.43693 5.65852 7.70544L6.91952 8.51777ZM9.63045 6.22297C10.7258 5.75356 11.9383 5.62986 13.1059 5.86842L13.4062 4.39878C11.9392 4.09906 10.4158 4.25448 9.0396 4.84424L9.63045 6.22297ZM13.1035 5.86793C14.2803 6.11232 15.3559 6.7059 16.1901 7.57114L17.27 6.53006C16.2264 5.44761 14.8807 4.70502 13.4085 4.39927L13.1035 5.86793ZM16.1907 7.57175C16.9065 8.31258 17.4296 9.21772 17.7142 10.2078L19.1558 9.79342C18.8035 8.5675 18.1557 7.44675 17.2694 6.52945L16.1907 7.57175ZM19.1609 10.1892L19.8709 7.45725L18.4191 7.07996L17.7091 9.81196L19.1609 10.1892ZM18.6348 9.2777L15.9858 8.5457L15.5863 9.99151L18.2353 10.7235L18.6348 9.2777ZM18.395 12.0014C18.3963 13.2363 18.0406 14.4453 17.3709 15.4829L18.6312 16.2963C19.4577 15.0159 19.8965 13.5239 19.895 11.9999L18.395 12.0014ZM17.3705 15.4834C16.7149 16.5012 15.7707 17.3003 14.6587 17.7786L15.2514 19.1566C16.6375 18.5603 17.8144 17.5643 18.6315 16.2958L17.3705 15.4834ZM14.6596 17.7782C13.5643 18.2476 12.3517 18.3713 11.1842 18.1328L10.8839 19.6024C12.3508 19.9021 13.8743 19.7467 15.2505 19.157L14.6596 17.7782ZM11.1865 18.1333C10.0098 17.8889 8.93411 17.2953 8.09997 16.4301L7.02008 17.4711C8.06363 18.5536 9.40936 19.2962 10.8815 19.6019L11.1865 18.1333ZM8.09938 16.4295C7.38355 15.6886 6.86042 14.7835 6.57584 13.7934L5.13421 14.2078C5.48658 15.4337 6.13433 16.5545 7.02067 17.4718L8.09938 16.4295ZM5.12914 13.812L4.41914 16.544L5.87091 16.9212L6.58091 14.1892L5.12914 13.812ZM5.65526 14.7235L8.30426 15.4555L8.70378 14.0097L6.05478 13.2777L5.65526 14.7235Z" fill="#ffffff"></path> </g></svg>
                                                </div>
                                                <div class="round-button" id="sp_connect">
                                                    <div id="sp_connect_icon_green" style="display:block">
                                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="0.00024000000000000003">
                                                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.096"></g>
                                                            <g id="SVGRepo_iconCarrier"> 
                                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93417 2L9 2L15.0658 2C15.9523 1.99995 16.7161 1.99991 17.3278 2.08215C17.9833 2.17028 18.6117 2.36902 19.1213 2.87868C19.631 3.38835 19.8297 4.0167 19.9179 4.67221C20.0001 5.28387 20.0001 6.04769 20 6.93417V17.0658C20.0001 17.9523 20.0001 18.7161 19.9179 19.3278C19.8297 19.9833 19.631 20.6117 19.1213 21.1213C18.6117 21.631 17.9833 21.8297 17.3278 21.9179C16.7161 22.0001 15.9523 22.0001 15.0658 22H8.9342C8.0477 22.0001 7.28388 22.0001 6.67221 21.9179C6.0167 21.8297 5.38835 21.631 4.87868 21.1213C4.36902 20.6117 4.17028 19.9833 4.08215 19.3278C3.99991 18.7161 3.99995 17.9523 4 17.0658L4 7L4 6.93417C3.99995 6.04769 3.99991 5.28387 4.08215 4.67221C4.17028 4.0167 4.36902 3.38835 4.87868 2.87868C5.38835 2.36902 6.0167 2.17028 6.67221 2.08215C7.28387 1.99991 8.04769 1.99995 8.93417 2ZM12 12C10.8954 12 10 12.8954 10 14C10 15.1046 10.8954 16 12 16C13.1046 16 14 15.1046 14 14C14 12.8954 13.1046 12 12 12ZM8 14C8 11.7909 9.79086 10 12 10C14.2091 10 16 11.7909 16 14C16 16.2091 14.2091 18 12 18C9.79086 18 8 16.2091 8 14ZM13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7V7.01123C11 7.56352 11.4477 8.01123 12 8.01123C12.5523 8.01123 13 7.56352 13 7.01123V7Z" fill="#1ED760"></path>
                                                            </g>
                                                        </svg>  
                                                    </div>
                                                    <div id="sp_connect_icon_white" style="display:none">
                                                        <svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="0.00024000000000000003">
                                                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="0.096"></g>
                                                            <g id="SVGRepo_iconCarrier">
                                                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93417 2L9 2L15.0658 2C15.9523 1.99995 16.7161 1.99991 17.3278 2.08215C17.9833 2.17028 18.6117 2.36902 19.1213 2.87868C19.631 3.38835 19.8297 4.0167 19.9179 4.67221C20.0001 5.28387 20.0001 6.04769 20 6.93417V17.0658C20.0001 17.9523 20.0001 18.7161 19.9179 19.3278C19.8297 19.9833 19.631 20.6117 19.1213 21.1213C18.6117 21.631 17.9833 21.8297 17.3278 21.9179C16.7161 22.0001 15.9523 22.0001 15.0658 22H8.9342C8.0477 22.0001 7.28388 22.0001 6.67221 21.9179C6.0167 21.8297 5.38835 21.631 4.87868 21.1213C4.36902 20.6117 4.17028 19.9833 4.08215 19.3278C3.99991 18.7161 3.99995 17.9523 4 17.0658L4 7L4 6.93417C3.99995 6.04769 3.99991 5.28387 4.08215 4.67221C4.17028 4.0167 4.36902 3.38835 4.87868 2.87868C5.38835 2.36902 6.0167 2.17028 6.67221 2.08215C7.28387 1.99991 8.04769 1.99995 8.93417 2ZM12 12C10.8954 12 10 12.8954 10 14C10 15.1046 10.8954 16 12 16C13.1046 16 14 15.1046 14 14C14 12.8954 13.1046 12 12 12ZM8 14C8 11.7909 9.79086 10 12 10C14.2091 10 16 11.7909 16 14C16 16.2091 14.2091 18 12 18C9.79086 18 8 16.2091 8 14ZM13 7C13 6.44772 12.5523 6 12 6C11.4477 6 11 6.44772 11 7V7.01123C11 7.56352 11.4477 8.01123 12 8.01123C12.5523 8.01123 13 7.56352 13 7.01123V7Z" fill="#ffffff"></path> 
                                                            </g>
                                                        </svg>    
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="sp_main">
                                            <div class="sp_left">
                                                <div class="sp_album_art" id="sp_album_art"></div>
                                            </div>
                                            <div class="sp_right">
                                                <div class="song-info">
                                                    <p class="sp_title" id="sp_title"></p>
                                                    <p class="sp_album" id="sp_album"></p>
                                                    <p class="sp_artist" id="sp_artist"></p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
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
        <div class="player" id="sdk_player" style="display:none">
            <script src="https://sdk.scdn.co/spotify-player.js"></script>
            <div class="control-container" id="play_pause">
                <svg viewBox="0 0 24.00 24.00" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M8 5V19M16 5V19" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                <svg fill="#ffffff" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="0.00032" style="display:none; margin-left: 7px"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>play</title> <path d="M5.92 24.096q0 1.088 0.928 1.728 0.512 0.288 1.088 0.288 0.448 0 0.896-0.224l16.16-8.064q0.48-0.256 0.8-0.736t0.288-1.088-0.288-1.056-0.8-0.736l-16.16-8.064q-0.448-0.224-0.896-0.224-0.544 0-1.088 0.288-0.928 0.608-0.928 1.728v16.16z"></path> </g></svg>
            </div>
            <div class="controls-center">
                <input type="range" id="tracker" min="0" value="0" max="100">
            </div>
            <div class="controls-right">
                <div class="control-container" id="previous_section">
                    <img src="images/backward.svg" alt="Backward">
                </div>
                <div class="control-container" id="3s_backward" style="position: relative;">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <path d="M12.0016 3.47945C11.9216 3.47945 11.8416 3.48945 11.7616 3.48945L12.5816 2.46945C12.8416 2.14945 12.7916 1.66945 12.4616 1.41945C12.1316 1.16945 11.6716 1.20945 11.4116 1.53945L9.44156 3.99945C9.43156 4.00945 9.43156 4.01945 9.42156 4.03945C9.39156 4.07945 9.37156 4.12945 9.35156 4.16945C9.33156 4.21945 9.31156 4.25945 9.30156 4.29945C9.29156 4.34945 9.29156 4.38945 9.29156 4.43945C9.29156 4.48945 9.29156 4.53945 9.29156 4.58945C9.29156 4.60945 9.29156 4.61945 9.29156 4.63945C9.30156 4.66945 9.32156 4.68945 9.33156 4.71945C9.35156 4.76945 9.37156 4.80945 9.39156 4.85945C9.42156 4.89945 9.45156 4.93945 9.49156 4.96945C9.51156 4.99945 9.52156 5.02945 9.55156 5.04945C9.57156 5.05945 9.58156 5.06945 9.60156 5.07945C9.63156 5.09945 9.65156 5.10945 9.68156 5.11945C9.73156 5.14945 9.79156 5.16945 9.85156 5.17945C9.88156 5.19945 9.91156 5.19945 9.94156 5.19945C9.97156 5.19945 9.99156 5.20945 10.0216 5.20945C10.0516 5.20945 10.0716 5.19945 10.0916 5.18945C10.1216 5.18945 10.1516 5.19945 10.1816 5.18945C10.8216 5.03945 11.4216 4.96945 11.9916 4.96945C16.4816 4.96945 20.1316 8.61945 20.1316 13.1095C20.1316 17.5994 16.4816 21.2495 11.9916 21.2495C7.50156 21.2495 3.85156 17.5994 3.85156 13.1095C3.85156 11.3695 4.42156 9.68945 5.50156 8.24945C5.75156 7.91945 5.68156 7.44945 5.35156 7.19945C5.02156 6.94945 4.55156 7.01945 4.30156 7.34945C3.02156 9.04945 2.35156 11.0395 2.35156 13.1095C2.35156 18.4195 6.67156 22.7495 11.9916 22.7495C17.3116 22.7495 21.6316 18.4295 21.6316 13.1095C21.6316 7.78945 17.3116 3.47945 12.0016 3.47945Z" fill="#ffffff"></path>
                        </g>
                    </svg>
                    <p style="position: absolute; top: 54%; left: 51%; color: #ffffff; font-size: small; transform: translate(-50%, -50%); z-index: 1;" id="backwardValue"></p>
                </div>
                </div>
                <div class="control-container" id="3s_forward" style="position: relative;">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                        <g id="SVGRepo_iconCarrier">
                            <path d="M19.4791 7.09052C19.2191 6.77052 18.7491 6.72052 18.4291 6.98052C18.1091 7.24052 18.0591 7.71052 18.3191 8.03052C19.4491 9.43052 20.0791 11.0905 20.1391 12.8305C20.2991 17.3105 16.7791 21.0905 12.2891 21.2405C7.79906 21.4005 4.02906 17.8805 3.86906 13.4005C3.70906 8.92052 7.22906 5.14052 11.7191 4.99052C12.2891 4.97052 12.8891 5.02052 13.5391 5.15052C13.5791 5.16052 13.6191 5.15052 13.6591 5.15052C13.7591 5.20052 13.8791 5.23052 13.9891 5.23052C14.1591 5.23052 14.3191 5.18052 14.4591 5.06052C14.7791 4.80052 14.8291 4.33052 14.5791 4.01052L12.5991 1.54052C12.3391 1.22052 11.8691 1.16052 11.5491 1.42052C11.2291 1.68052 11.1791 2.15052 11.4291 2.47052L12.2591 3.50052C12.0691 3.49052 11.8691 3.48052 11.6791 3.49052C6.36906 3.67052 2.19906 8.15052 2.38906 13.4605C2.57906 18.7705 7.04906 22.9405 12.3591 22.7505C17.6691 22.5605 21.8391 18.0905 21.6491 12.7805C21.5591 10.7105 20.8191 8.74052 19.4791 7.09052Z" fill="#ffffff"></path>         
                        </g>
                    </svg>
                    <p style="position: absolute; top: 54%; left: 49%; color: #ffffff; font-size: small; transform: translate(-50%, -50%); z-index: 1;" id="forwardValue"></p>
                </div>
                <div class="control-container" id="next_section">
                    <img src="images/forward.svg" alt="Forward">
                </div>
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

        <div id="devices_options" class="devices_options" style="display:none; bottom: 105px">
        </div>

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
                        <button class="spotify_button" id="spotify_button">
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
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Autoplay</p>
                        <p class="popup_option_description">Automatically transfer the playback to LyricsFormatter upon opening the website.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="spAutoPlay" onclick="checkContent()">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Backwards value</p>
                        <p class="popup_option_description">Specify the duration in seconds to rewind during backward playback</p>
                    </div>
                    <div class="number_selector">
                        <svg class="arrow left" viewBox="0 0 24 24" onclick="decreaseValue('selectedValue1')">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                        </svg>
                        <span id="selectedValue1" style="user-select: none;">3</span>
                        <svg class="arrow right" viewBox="0 0 24 24" onclick="increaseValue('selectedValue1')">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                        </svg>
                    </div>
                </div>
                <div class="popup_option">
                    <div class="popup_title">
                        <p class="popup_option_title">Fast forward value</p>
                        <p class="popup_option_description">Specify the duration in seconds to fast forward during playback</p>
                    </div>
                    <div class="number_selector">
                        <svg class="arrow left" viewBox="0 0 24 24" onclick="decreaseValue('selectedValue2')">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path>
                        </svg>
                        <span id="selectedValue2" style="user-select: none;">3</span>
                        <svg class="arrow right" viewBox="0 0 24 24" onclick="increaseValue('selectedValue2')">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path>
                        </svg>
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

                let currentState;

                window.onSpotifyWebPlaybackSDKReady = () => {

                    fetchUserData().then(() => {

                        // Recuperar os tokens do armazenamento local do navegador
                        const accessToken = localStorage.getItem('accessToken');
                        const refreshToken = localStorage.getItem('refreshToken');

                        // Verificar se os tokens estão em cache
                        if (!accessToken || !refreshToken) {
                            return; // sair da função porque não há tokens do Spotify
                        }

                        // botões playpause 
                        const controlContainer = document.getElementById('play_pause');
                        const svg1 = controlContainer.querySelector('svg:nth-child(1)');
                        const svg2 = controlContainer.querySelector('svg:nth-child(2)');

                        // carregar possível faixa em execução
                        fetchCurrentlyPlayingData()

                        // a partir daqui, cria-se a instancia do player sdk
                        const token = localStorage.getItem('accessToken');
                        const player = new Spotify.Player({
                            name: 'LyricsFormatter Player',
                            getOAuthToken: cb => { cb(token); },
                            volume: 1.0
                        });

                        // Ready
                        player.addListener('ready', ({ device_id }) => {
                            console.log('Ready with Device ID', device_id);
                            fetchAvailableDevices()
                        });

                        // Not Ready
                        player.addListener('not_ready', ({ device_id }) => {
                            console.log('Device ID has gone offline', device_id);
                            notification('Player has gone offline, please refresh the page');

                        });

                        player.addListener('initialization_error', ({ message }) => {
                            console.error(message);
                            notification('Error initializing the player, please refresh the page');
                        });

                        player.addListener('authentication_error', ({ message }) => {
                            console.error(message);
                            notification('Spotify authentication failed, please refresh the page');
                        });

                        player.addListener('account_error', ({ message }) => {
                            console.error(message);
                            notification('An unexpected error occurred, please refresh the page');
                        });

                        player.connect();

                        document.getElementById('play_pause').onclick = function() {
                            player.togglePlay();
                            togglePlayPause()
                            fetchCurrentlyPlayingData()
                        };

                        document.getElementById('3s_backward').onclick = function() {
                            rewind(document.getElementById('selectedValue1').textContent)
                        };

                        document.getElementById('3s_forward').onclick = function() {
                            fastForward(document.getElementById('selectedValue2').textContent)
                        };;

                        // CÓDIGO QUE TRATA DOS COMANDOS DO TECLADO
                        document.addEventListener('keydown', function(event) {

                            // Recuperar os tokens do armazenamento local do navegador
                            const accessToken = localStorage.getItem('accessToken');
                            const refreshToken = localStorage.getItem('refreshToken');

                            // Verificar se os tokens estão em cache
                            if (!accessToken || !refreshToken) {
                                return; // sair da função porque não há tokens do Spotify
                            }

                            var numericKeys = ['0', '1', '3', '4', '5', '6'];

                            // verifica se a tecla pressionada está no numpad
                            var isNumpadKey = (event.location === KeyboardEvent.DOM_KEY_LOCATION_NUMPAD);

                            if (numericKeys.includes(event.key) && isNumpadKey) {
                                switch (event.key) {
                                    case '1':
                                        rewind(document.getElementById('selectedValue1').textContent)
                                        break;
                                    case '3':
                                        fastForward(document.getElementById('selectedValue2').textContent)
                                        break;
                                    case '4':
                                        console.log("Clique no botão 4 identificado: voltar para estrofe anterior")
                                        break;
                                    case '5':
                                        console.log("Clique no botão 5 identificado: reproduzir estrofe atual novamente")
                                        break;
                                    case '6':
                                        console.log("Clique no botão 6 identificado: pular para próxima estrofe")
                                        break;
                                    case '0':
                                        player.togglePlay();
                                        togglePlayPause()
                                        break;
                                    default:
                                        // outras teclas (não são tratadas)
                                        break;
                                }
                                event.preventDefault();
                            }

                            // Event listener para controlar quando uma música termina
                            player.addListener('player_state_changed', state => {
                                if (!state || !state.position) {
                                    // Se o estado não estiver disponível ou a posição for indefinida, resete o valor do tracker
                                    document.getElementById('tracker').value = 0;
                                }
                            });

                        });

                        // Função para atualizar a barra de progresso com base na posição atual da música
                        function updateProgressBar(position, duration) {
                            const tracker = document.getElementById('tracker');
                            if (duration > 0) {
                                const progress = (position / duration) * 100;
                                tracker.value = progress;
                            }
                        }


                        // MELHORAR (avançar ao tocar no tracker, mas está definindo a posição como 0)
                        const tracker = document.getElementById('tracker');
                        tracker.addEventListener('input', function() {
                            const newPosition = tracker.value;
                            player.seek(newPosition).then(() => {
                                // Atualiza a posição para a música atual
                                positions[currentState.track.id] = newPosition;
                            }).catch((err) => {
                                console.error('Failed to seek:', err);
                            });
                        });
                        // MELHORAR



                        player.addListener('player_state_changed', newState => {
                            console.log(newState);
                            currentState = newState; // Atualiza a variável currentState

                            if (newState && newState.position && newState.duration) {
                                const newPosition = newState.position;
                                const duration = newState.duration;
                                updateProgressBar(newPosition, duration);
                            }

                            if (newState && typeof newState.playback_id === 'string' && newState.playback_id.trim() !== '') {
                                const playbackId = newState.playback_id;
                                fetchCurrentlyPlayingData();
                                showTracker();


                                // Definir o botão play/pause com base no estado de reprodução
                                if (newState.paused) {
                                    // Se estiver pausado, mostrar o botão de play
                                    svg1.style.display = 'none';
                                    svg2.style.display = 'block';
                                } else {
                                    // Se estiver reproduzindo, mostrar o botão de pausa
                                    svg1.style.display = 'block';
                                    svg2.style.display = 'none';
                                }
                            } else {
                                fetchCurrentlyPlayingData();
                                hideTracker();
                            }
                        });

                        // Função para iniciar o efeito de progresso na barra de progresso
                        function startProgressEffect() {
                            const interval = 0.5 * 1000; // Intervalo em milissegundos (0.5 segundos)
                            setInterval(() => {
                                player.getCurrentState().then(state => {
                                    if (state) {
                                        const newPosition = state.position;
                                        const duration = state.duration;
                                        updateProgressBar(newPosition, duration);
                                    }
                                });
                            }, interval);
                        }

                        // Chama a função para iniciar o efeito de progresso na barra de progresso
                        startProgressEffect();

                        // Objeto para armazenar as posições atuais de cada música
                        const positions = {};

                        // Função para retroceder uma quantidade específica de segundos na reprodução
                        function rewind(seconds) {
                            player.getCurrentState().then(state => {
                                if (state) {
                                    const milliseconds = seconds * 1000; // Convertendo segundos para milissegundos
                                    const newPosition = Math.max(0, state.position - milliseconds);
                                    player.seek(newPosition).then(() => {
                                        positions[state.track.id] = newPosition; // Atualiza a posição para a música atual
                                    });
                                }
                            });
                        }

                        // Função para avançar uma quantidade específica de segundos na reprodução
                        function fastForward(seconds) {
                            player.getCurrentState().then(state => {
                                if (state) {
                                    const milliseconds = seconds * 1000; // Convertendo segundos para milissegundos
                                    const newPosition = Math.min(state.duration, state.position + milliseconds);
                                    player.seek(newPosition).then(() => {
                                        positions[state.track.id] = newPosition; // Atualiza a posição para a música atual
                                    });
                                }
                            });
                        }

                        function showTracker() {
                            document.getElementById('sdk_player').style = 'display:flex';
                            document.getElementById('sp_player_div').style.margin = '0 0 45px 0';
                            document.getElementById('sp_connect_icon_green').style.display = 'none'
                            document.getElementById('sp_connect_icon_white').style.display = 'block'
                            document.getElementById('devices_options').style.bottom = '150px'
                        }
                        function hideTracker() {
                            document.getElementById('sdk_player').style = 'display:none';
                            document.getElementById('sp_player_div').style.margin = '0 0 0 0';
                            document.getElementById('sp_connect_icon_green').style.display = 'block'
                            document.getElementById('sp_connect_icon_white').style.display = 'none'
                            document.getElementById('devices_options').style.bottom = '105px'
                            
                        }

                        // Quando uma nova música é reproduzida, obtenha a posição atual se estiver disponível
                        player.on('track_change', () => {
                            player.getCurrentState().then(state => {
                                if (state) {
                                    positions[state.track.id] = state.position; // Armazena a posição para a nova música
                                }
                            });
                        });
                    });     
                };

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


                document.addEventListener('DOMContentLoaded', function() {
                    const spConnectButton = document.getElementById('sp_connect');
                    const menuOptions = document.getElementById('devices_options');
                    const spRefreshButton = document.getElementById('player_refresh')

                    // Adiciona um evento de clique à div com ID sp_connect
                    spConnectButton.addEventListener('click', function(e) {
                        // Mostra ou esconde o menu de opções ao clicar no botão sp_connect
                        if (menuOptions.style.display === 'none') {
                            menuOptions.style.display = 'block';
                        } else {
                            menuOptions.style.display = 'none';
                        }
                        e.stopPropagation(); // Impede a propagação do evento para evitar que o menu seja fechado imediatamente
                    });

                    // Fecha o menu ao clicar fora dele
                    document.addEventListener('click', function(e) {
                        if (!menuOptions.contains(e.target) && e.target !== spConnectButton) {
                            menuOptions.style.display = 'none';
                        }
                    });

                    spRefreshButton.addEventListener('click', function(e) {
                        fetchCurrentlyPlayingData()
                        fetchAvailableDevices()
                    });
                });


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

                function increaseValue(selectedId) {
                    var selectedValue = parseInt(document.getElementById(selectedId).textContent);
                    if (selectedValue < 15) {
                        selectedValue++;
                        updateSelectedValue(selectedId, selectedValue);
                    }
                }

                function decreaseValue(selectedId) {
                    var selectedValue = parseInt(document.getElementById(selectedId).textContent);
                    if (selectedValue > 3) {
                        selectedValue--;
                        updateSelectedValue(selectedId, selectedValue);
                    }
                }

                 // Função para obter os valores armazenados no localStorage ou definir padrões
                function getStoredValue(id) {
                    return localStorage.getItem(id) || '5'; // Valor padrão é 5 segundos
                }

                // Função para armazenar os valores selecionados no localStorage
                function setStoredValue(id, value) {
                    localStorage.setItem(id, value);
                }

                // Função para carregar os valores armazenados e definir os elementos correspondentes
                function loadStoredValues() {
                    document.getElementById('selectedValue1').textContent = getStoredValue('selectedValue1');
                    document.getElementById('selectedValue2').textContent = getStoredValue('selectedValue2');
                    document.getElementById('backwardValue').textContent = getStoredValue('selectedValue1');
                    document.getElementById('forwardValue').textContent = getStoredValue('selectedValue2');
                }

                function updateSelectedValue(id, value) {
                    document.getElementById(id).textContent = value;
                    setStoredValue(id, value); // Armazenar o valor selecionado no localStorage
                    // Atualizar os elementos <p> com base nos valores selecionados
                    if (id === 'selectedValue1') {
                        document.getElementById('backwardValue').textContent = value;
                    } else if (id === 'selectedValue2') {
                        document.getElementById('forwardValue').textContent = value;
                    }
                    // Aqui você pode fazer qualquer outra ação necessária com o valor selecionado
                }

                // Carregar os valores armazenados ao carregar a página
                window.onload = function() {
                    loadStoredValues();
                };


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


