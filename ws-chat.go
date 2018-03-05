package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var (
	users       = make(map[*websocket.Conn]bool)
	broadcastCh = make(chan Message)
	upgrader    = websocket.Upgrader{}
)

const (
	minUsrLen = 0
	maxUsrLen = 35
)

type Message struct {
	Username string `json:"username"`
	Message  string `json:"message"`
	Time     string `json:"time"`
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)
	http.HandleFunc("/ws", wsHandler)

	go messageHandler()

	log.Println("server is listening...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	// change GET request to WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer ws.Close()
	// add new client
	users[ws] = true

	for {
		// read message from a client
		var message Message
		err := ws.ReadJSON(&message)
		if err != nil {
			log.Printf("Error occurred %v", err)
			delete(users, ws)
			break
		}
		if len(message.Username) <= minUsrLen || len(message.Username) > maxUsrLen ||
			message.Message == "" {
			log.Printf("Unknown user")
			delete(users, ws)
			break
		}

		log.Printf("Got message: %#v\n", message)
		// show message to every user in chat
		broadcastCh <- message
	}
}

func messageHandler() {
	for {
		message := <-broadcastCh

		// send message to every connected client
		for user := range users {
			err := user.WriteJSON(message)
			if err != nil {
				log.Printf("Error occurred %v", err)
				user.Close()
				delete(users, user)
			}
		}
	}
}
