# source this file
if [[ $0 == "develop.sh" ]]; then
	cat <<- EOF
	Do not run this file directly. Source it instead.
	start_server: Starts nodemon in your code directory.
	start_mongo: Starts mongodb in current shell (will run until ctrl-C).
	EOF
    exit
fi

function start_mongo() {
    mongod --config /usr/local/etc/mongod.conf
}

function start_server() {
	if [[ ! -f config.json ]]; then
		echo "create config.json first!"
		return
	fi
	[[ -f .nvmrc ]] && nvm use
	npm install
	nodemon init.js
}
