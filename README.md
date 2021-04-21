# ViewPlaylistsWithSong
An extension developed for [Spicetify](https://github.com/khanhas/spicetify-cli/) that allows you to view all the playlists in your library that contain a certain song. Ideal for Spotify enthusiasts with several dozen playlists.

![Demo Gif](demo.gif "Demo")

## What it does
This extension adds a new button "View Playlists with Song" that appears whenever you click on any track in Spotify. This can be in context of a playlist, album, friend activity, or even the song that's currently playing.
When you click this button, you will be redirected to a page that displays the song information on top and any playlists it appears in on bottom. Only playlists in your library that are **owned by you** will appear in the results.
If you select a song that does not appear in any of your playlists, no playlists will be displayed.

## How to install it
Make sure you have a functioning, updated install of [Spicetify](https://github.com/khanhas/spicetify-cli/). Download the file in this repository called `ViewPlaylistsWithSong.js` and place this file inside your `.spicetify/Extensions` folder. If this is your first time downloading an extension, you may want to reference [this](https://github.com/khanhas/spicetify-cli/wiki/Extensions) document.
Once you have placed the file in the Extensions directory, you need to open the file called `config.ini` (should be in the parent directory) and edit the `Extensions` value under `AdditionalOptions`. If you have no other extensions, set it equal to the filename (`ViewPlaylistsWithSong.js`). If you have other extensions installed, proceed the filename with a pipe character (`|`) as mentioned in the [documentation](https://github.com/khanhas/spicetify-cli/wiki/Extensions). 

## What if it doesn't work
If you encounter any bugs or unexpected behavior, please file an issue explaining your problem and how to replicate it. Including screenshots is always helpful, and bonus points if you mention any errors appearing in the DevTools console.

## Bonus: How it works
This is for developers that want to get a bit of an insight into how the code works.
If you reference the file, you should find it to be reasonably well-commented. I did a lot of reverse-engineering by logging events in the console and trying to determine what causes what. There are very few documentations of the Spotify Desktop API out there, and the ones that exist are heavily outdated. 
I definitely recommend looking at `spicetifyWrapper.js` inside the `jsHelper` folder in the [spicetify-cli](https://github.com/khanhas/spicetify-cli/) repository. This helped me get a fundamental understanding of what was going on. Run a github search for "spicetify" and see what repos come up. Look at other people's extensions and see if you can make sense of their code. Some of the framework laid down by Khanhas' extensions were a solid help for me.

As for what's actually going on inside of my code - in the background, a BridgeAPI call is being placed on an interval to get the most current reading of the user's library. This is then sorted through and only playlists that meet certain criteria (public & owned by the user) are stored in a local variable. Whenver the user clicks the ContextMenu button, the song uri is passed to a handler that iterates through every playlist and searchs for the specific song, keeping track of the playlists that contain it. 
After this is done, I simulate a call to the desktop app's source code telling it to load a page called SongPage. Once that page has rendered, I inject my own HTML and override some of the pre-placed DOM in order to display the playlists that were collected previously. This was the hardest part for me, since frontend development isn't my forte (especially when there is no documentation!).

## Conclusion
Thank you for using my extension.

If you would like to contribute, please feel free to create a pull request or contact me on Discord: Ollog10#2051

God bless!
