Plex-status Docker
==================

Run it:
-------
`docker run -it --net=host -e TOKEN=[your plex token] tyzbit/plex-status`


| Environment Variable |          Description            |  Default               |
|----------------------|---------------------------------|------------------------|
| TOKEN                | Your Plex API token (see below) | null                   |
| PLEX_SERVER          | URL to plex server              | http://localhost:32400 |


You get the token from viewing XML in the Plex UI and grabbing it from the URL

It needs host network since Plex doesn't allow API calls except from localhost, but if you get around that you can set `PLEX_SERVER` to redirect it

Script originally from here: https://gist.github.com/Dirrk/608642bd820849736ad2

Also, made into a module here: https://github.com/mrlannigan/plex-status
