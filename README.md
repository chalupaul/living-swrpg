# living-swrpg
## living star wars rpg api

### Installation

After cloning repo, install dependencies.

```bash
$ npm install 
```

Create a config file and change your config variables. Most important is the mongodb connection uri located in **config.json**
```bash
$ cp config.json.defaults config.json
```

### Hacking

All the dev stuff is provided by npm scripts. These scripts start pieces of the application in interactive terminals, so probably want to either tmux or screen session them (or a separate terminal window).

This package uses nvm if you have it installed. You can find it [here](http://nvm.sh/). If you want to use the builtin functions, please ensure your nvm hooks are loaded thru your .bash\_profile.

The mongo script is a trivial wrapper around a stock (homebrew)[http://brew.sh] installed mongodb and assumes a stock config file location.

Typical order is:

1. cp config.json.defaults config.json
2. npm install
2. Edit the config.json file as necessary.
3. npm run mongo
4. npm start 

If you don't want to use the wrappers, you can kick it off normally:

```bash
$ node init.js
```
