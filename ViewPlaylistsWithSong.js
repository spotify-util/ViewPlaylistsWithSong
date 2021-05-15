// NAME: ViewPlaylistsWithSong
// AUTHOR: elijaholmos
// DESCRIPTION: Adds context menu button to view playlists in your library that contain the selected song
// VERSION: 1.1.0

(async function ViewPlaylistsWithSong() {
    if (!Spicetify.LocalStorage) {
        setTimeout(ViewPlaylistsWithSong, 1000);
        return;
    }

    // ------------ "constants" ------------
    const SONG_PAGE_DISABLED    = !window.initialState.isSongPageEnabled;   //does the user have the song page enabled or disabled per their Spicetify settings
    let READY_TO_USE            = false;    //is the extension ready to use yet (has setup complete)
    const VERSION = '1.0.1';

    console.log(`Running ViewPlaylistsWithSong v${VERSION}`);   //log current version for debugging purposes

    // ------------ API methods, based off code from @khanhas ------------
    const fetchPlaylist = (uri) => new Promise((resolve, reject) => {
        Spicetify.BridgeAPI.cosmosJSON(
            {
                method: "GET",
                uri: `sp://core-playlist/v1/playlist/${uri}`,
                body: {
                    policy: {
                        link: true
                    }
                }
            },
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    name: res.playlist.name,
                    description: res.playlist.description,
                    uri: res.playlist.link,
                    image: res.playlist.picture,
                    tracks: res.items   //simplify this to only return what is necessary?
                })
            }
        );
    });

    const fetchFolder = () => new Promise((resolve, reject) => {
        Spicetify.BridgeAPI.cosmosJSON(
            {
                method: "GET",
                uri: `sp://core-playlist/v1/rootlist`,
                body: {
                    policy: {
                        folder: {
                            rows: true,
                            link: true
                        }
                    }
                }
            },
            (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(res);
            }
        );
    });

    // ------------ Custom methods ------------
    /**
     * get and store all the self-created, public playlists in the current user's library
     * @param {boolean} [setup] whether or not to display "progressbar" with current retrieval status
     * @returns {Array} array of custom playlist objects, see fetchPlaylist()
     */
    const getUserPlaylists = async function (setup = false) {
        const playlists = [];
        const library = await fetchFolder();
        let counter = 1;    //for "progress bar" notification
        for (const item of library.rows) {
            //if the current item in their library is a folder, we need to read all the playlists and any sub-folders inside it
            item.type == "folder" ? 
                playlists.push(...(await recursivelyExtractPlaylistsFromFolder(item))) :
                item.ownedBySelf && item.totalLength > 0 && playlists.push(await fetchPlaylist(item.link));
            setup && Spicetify.showNotification(`ViewPlaylistsWithSong: Setup ${Math.round(((counter++) / library.rows.length) * 100)}% Complete`);
        } //TODO: add error catching?
        READY_TO_USE = true;
        setup && Spicetify.showNotification(`ViewPlaylistsWithSong: Setup 100% Complete`);   //just in case counter gets messed up, display 100% notif to user
        return playlists;
    };

    //gets user's playlists, updates global variable, then calls itself after the specified delay
    const getUserPlaylistsLoop = async function () {
        USER_PLAYLISTS = await getUserPlaylists();
        setTimeout(getUserPlaylistsLoop, 5000);
        return;
    };

    //this needs to be recursive in case there are subfolders
    const recursivelyExtractPlaylistsFromFolder = async function (folder) {
        const playlists = [];
        for(const item of folder.rows) {
            item.type == "folder" ? 
                playlists.push(...(await recursivelyExtractPlaylistsFromFolder(item))) :
                item.ownedBySelf && item.totalLength > 0 && playlists.push(await fetchPlaylist(item.link));
        }
        return playlists;
    };

    /**
     * Search through the stored playlist library for the specified song
     * @param {string} uri URI of the song to search for
     * @returns {Array} Array of playlists that contain the specified song
     */
    const getPlaylistsWithSong = function (uri) {
        const playlists = [];
        for(const playlist of USER_PLAYLISTS) 
            playlist.tracks.some(track => track.link === uri) && playlists.push(playlist);
        return playlists;
    };

    // ------------ HTML Methods ------------
    /**
     * pass in a playlist object and receive an HTML string ready to be appended to the SongPage grid
     * @param {Object} playlist a custom playlist object, see fetchPlaylist()
     * @returns {String} HTML string ready to be appended to the DOM
     */
    const generatePlaylistCard = function (playlist = {}) {
        return `<div class="col-md-3">
            <div class="card card-type-playlist" 
                data-interaction-context="card"
                data-log-data="{ &quot;name&quot;: &quot;${playlist.name}&quot;, &quot;target_uri&quot;: &quot;${playlist.uri}&quot; }"
                data-uri="${playlist.uri}" data-contextmenu="" data-context=""
                data-card-pressed-container="" data-ta-id="card">
                <div class="card-attention-highlight-box">
                </div>
                <div class="card-image-wrapper" data-contextmenu-spy="" data-ta-id="card-image-wrapper">
                    <div class="card-image-hit-area" data-card-trigger-pressed-state="">
                        <a href="${playlist.uri}" data-uri="${playlist.uri}"
                            draggable="true" data-drag-text="${playlist.name}" class="card-image-link "
                            data-interaction-target="image" aria-hidden="true" tabindex="-1">
                            <div class="card-hit-area-counter-scale"></div>
                            <div class="card-placeholder-wrapper">
                                <svg class="card-placeholder" viewBox="0 0 10 10" preserveAspectRatio="xMidYMid meet">
                                    <text class="playlist-placeholder" x="5" y="9.8"></text>
                                    <text class="playlist-folder-placeholder" x="5" y="9.8"></text>
                                    <text class="album-placeholder" x="5" y="9.8"></text>
                                    <text class="track-placeholder" x="5" y="9.8"></text>
                                    <text class="artist-placeholder" x="5" y="9.8"></text>
                                    <text class="user-placeholder" x="5" y="9.8"></text>
                                    <text class="genre-placeholder" x="5" y="9.8"></text>
                                    <text class="collection-placeholder" x="5" y="9.8"></text>
                                    <text class="local-files-placeholder" x="5" y="9.8"></text>
                                    <text class="episode-placeholder" x="5" y="9.8"></text>
                                </svg>
                            </div>
                            <div class="card-image-content-wrapper">
                                <div class="card-image"
                                    style="background-image: url('${playlist.image}')"
                                    data-ta-id="card-image"
                                    data-image-url="${playlist.image}">
                                </div>
                            </div>
                            <div class="card-overlay"></div>
                        </a>
    
                        <button type="button" data-button="add" class="button button-add card-button-add"
                            data-ta-id="card-button-add" data-tooltip="Save to Your Library"
                            data-tooltip-add="Save to Your Library" data-tooltip-remove="Remove from Your Library"
                            data-interaction-target="toggle-follow-state-button" data-interaction-intent="follow"></button>
    
                        <button type="button" class="button button-play button-icon-with-stroke card-button-play"
                            data-ta-id="card-button-play" data-interaction-target="play-pause-button"
                            data-interaction-intent="play" data-button="play-context"></button>
    
                        <button type="button" data-button="contextmenu"
                            class="button button-more button-no-border card-button-more"
                            data-ta-id="card-button-context-menu" data-tooltip="More"
                            data-interaction-target="context-menu-button" data-interaction-intent="show-options"></button>
                    </div>
                </div>
    
                <div class="card-info-wrapper card-info-with-subtitle-links card-info-with-metadata">
                    <div class="card-info-title">
                        <a href="${playlist.uri}" data-uri="${playlist.uri}"
                            data-ta-id="card-title-link" data-tooltip="${playlist.name}"
                            data-interaction-target="title" dir="auto">
                            ${playlist.name}
                        </a>
                    </div>
    
                    <div class="card-info-subtitle-links" data-interaction-context="subtitle-links">
                        <a dir="auto" title="" href="" data-uri="" data-ta-id="card-subtitle-link"
                            data-interaction-target="0"></a>
                    </div>
    
                    <div class="card-info-subtitle-description" data-ta-id="card-description">
                        <span dir="auto">${playlist.description}</span>
                    </div>
                </div>
    
            </div>
        </div>`;
    };

    //recursively hide the carousel element that appears by default on the SongPage
    //counter is to prevent infinite loops
    const hideCarousel = function (counter = 0) {
        return new Promise((resolve, reject) => {
            if(counter > 10) reject('hideCarousel timed out');
            const carousel = document.querySelector('.SongPage .Carousel');
            !!carousel ? carousel.style.display = 'none' : setTimeout(function() { return hideCarousel(++counter); }, 500);
            resolve();
        });
    };

    //render the given array of playlists on the SongPage
    const renderPlaylists = function ({playlists = [], song = ''} = {}) {
        document.querySelector('.SongPage').setAttribute('current-song', song);  //update the current-song to prevent UI errors

        //isolate and modify the wrapper element
        const wrapper = document.querySelector('.SongPage .glue-page-wrapper') || document.querySelector('.SongPage .profile-section');
        wrapper.className = 'profile-section container';
        wrapper.setAttribute('data-navbar-view-id', 'public-playlists');

        //create the h2 header
        const list_header = document.createElement('div');
        list_header.className = "GlueSectionDivider";
        list_header.innerHTML = `<div class="GlueSectionDivider__container">
            <div class="GlueSectionDivider__title-container">
                <h2 class="GlueSectionDivider__title">Appears in <a>${playlists.length}</a> of your playlists</h2>
            </div>
        </div>`;
        wrapper.append(list_header);

        //create the grid of playlists
        const row_wrapper = document.createElement('div');
        row_wrapper.className = 'row standard-grid no-section-divider';
        for (const playlist of playlists) 
            row_wrapper.innerHTML += generatePlaylistCard(playlist);

        hideCarousel();
        wrapper.append(row_wrapper);
    };

    /**
     * Change the enabled state of the SongPage to the value specified. If no value is provided, the current isSongPageEnabled value will be toggled.
     * @param {Boolean} [value] true to enable SongPage, false to disable it
     */
    const toggleSongPage = function (value = !window.initialState.isSongPageEnabled) {
        window.initialState = { ...window.initialState, isSongPageEnabled: value };
    };

    // ------------ Other code ------------

    //function to be performed when ContextMenu button is clicked
    const btnClick = async function (uris) {
        if(uris.length != 1) throw new Error();

        const uri = uris[0];    //isolate the only uri passed to the function

        //prepare the data to be sent in the postMessage() function
        const data = {  // I reversed engineered this by watching JS events in the console. I don't entirely know what all of the properties mean
            type: "navigation_request_state",
            method: "open",
            state: JSON.stringify({uri:uri}),
            extra: "{}"
        };
        //enable the song page, otherwise the postMessage() requests will not work with track URIs
        SONG_PAGE_DISABLED && toggleSongPage(true);
        //send the message to update the GUI
        window.postMessage(data, window); 

        //prevent appending the same HTML multiple times for one song if user repeatedly clicks button
        if (document.querySelector('.SongPage')?.getAttribute('current-song') === uri) return;

        //retrieve the user's playlists that contain the selected song
        const matched_playlists = getPlaylistsWithSong(uri);

        //code to execute after postMessage() has finished updating the UI
        setTimeout(function() {
            renderPlaylists({song:uri, playlists:matched_playlists}); //render the playlists in the UI
            SONG_PAGE_DISABLED && toggleSongPage(false); //we need to disable the SongPage since we overrode its state earlier
        }, 250);
        return;
    };

    //add context menu item
    new Spicetify.ContextMenu.Item("View Playlists with Song", btnClick, (uris) => {
        if(uris.length != 1) return false;  //only one song at a time
        return READY_TO_USE && Spicetify.URI.fromString(uris[0]).type == Spicetify.URI.Type.TRACK;  //uri must be track type
    }, "search").register();

    //this goes at the bottom because await
    var USER_PLAYLISTS = await getUserPlaylists(true);

    //in case the user adds/removes a playlist or changes the song composition,
    //this will ensure the USER_PLAYLISTS variable is (nearly) always up to date
    getUserPlaylistsLoop();
})();
