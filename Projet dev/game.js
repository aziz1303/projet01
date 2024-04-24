document.addEventListener("DOMContentLoaded", function() {
    const socket = io(); // Initialiser la connexion WebSocket

    // Gestionnaire d'événement pour recevoir les informations de la partie
    socket.on('gameInfo', (data) => {
        // Mettre à jour les informations sur les joueurs
        const playerInfoDiv = document.getElementById('player-info');
        playerInfoDiv.innerHTML = "<h3>Informations sur les joueurs :</h3>";
        data.players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.textContent = "`${player.name}` - `Rôle: ${player.role}`";
            playerInfoDiv.appendChild(playerDiv);
        });

        // Mettre à jour les informations sur les mots
        const wordInfoDiv = document.getElementById('word-info');
        wordInfoDiv.innerHTML = "<h3>Informations sur les mots :</h3>";
        data.words.forEach(word => {
            const wordDiv = document.createElement('div');
            wordDiv.textContent = "Mot: ${word.word} - Propriétaire: ${word.owner}";
            wordInfoDiv.appendChild(wordDiv);
        });
    });

    // Gestionnaire d'événement pour révéler un mot
    const revealWordButton = document.getElementById('reveal-word');
    revealWordButton.addEventListener('click', () => {
        socket.emit('revealWord');
    });

    // Gestionnaire d'événement pour éliminer un joueur
    const eliminatePlayerButton = document.getElementById('eliminate-player');
    eliminatePlayerButton.addEventListener('click', () => {
        socket.emit('eliminatePlayer');
    });

    // Fonction pour récupérer et afficher le code de partie
    function displayGameCode() {
        // Envoi de la requête GET pour récupérer le code de partie
        fetch("/game-code")
            .then(response => response.json())
            .then(data => {
                // Vérifier si la récupération du code de partie a réussi
                if (data.success) {
                    // Mettre à jour l'élément HTML pour afficher le code de partie
                    const gameCodeDisplayDiv = document.getElementById("game-code-display");
                    gameCodeDisplayDiv.innerHTML = "Code de partie : " + data.gameCode;
                } else {
                    // Afficher un message d'erreur si la récupération du code de partie a échoué
                    console.error("Erreur lors de la récupération du code de partie :", data.message);
                }
            })
            .catch(error => console.error("Erreur lors de la récupération du code de partie :", error));
    }
    // Appeler la fonction pour afficher le code de partie au chargement de la page
    displayGameCode();

    const app = document.querySelector(".app");
    let uname;

    app.querySelector(".join-screen #join-user").addEventListener("click", function(){
        let username = app.querySelector(".join-screen #username").value;

        if(username.length === 0){
            return;
        }

        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function(){
        let message = app.querySelector(".chat-screen #message-input").value;

        if (message.length === 0) {
            return;
        }

        renderMessage("my", {
            username: uname,
            text: message
        });

        socket.emit("chat", {
            username: uname,
            text: message
        });
        app.querySelector(".chat-screen #message-input").value = "";
    });

    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");

        if(type == "my") {
            let el = document.createElement("div");
            el.setAttribute("class", "message my-message");
            el.innerHTML = `
                <div>
                    <div class="name">You</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
        } else if(type === "other") {
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `
                <div>
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
         } else if(type === "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }

        // Scroll chat to end
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }

    socket.on("update", function(update) {
        // Vérifier si le message est déjà affiché pour éviter la duplication
        const messageContainer = app.querySelector(".chat-screen .messages");
        if (!messageContainer.innerHTML.includes(update)) {
            renderMessage("update", update);
        }
    });

    socket.on("chat", function(message){
        // Afficher le message uniquement s'il ne provient pas de l'utilisateur actuel
        if (message.username !== uname) {
            renderMessage("other", message);
        }
    });

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function(){
        socket.emit("exituser", uname);
        window.location.href = window.location.href;
    });
});