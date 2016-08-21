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

There's a file called develop.sh that exports a bunch of functions. These functions start pieces of the application in interactive terminals, so probably want to either tmux or screen session them (or a separate terminal window).

The start_server function will run setup for you.

 Typical order is:

1. source develop.sh
2. cp config.json.defaults config.json
3. start\_mongo
4. start\_server 

If you don't want to use the wrappers, you can kick it off normally:

```bash
$ node init.js
```
