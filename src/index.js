const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users');
const { generateMessage, generateLocationMessage } = require('./utils/messages');

const app = express();
const server = http.createServer(app);
const io = socketio(server); //configring io to work with express server

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));
io.on('connection', (socket) => {
	//checking the connection with socket.io server
	socket.on('join', ({ username, room }, callback) => {
		//creating a user
		const { error, user } = addUser({ id: socket.id, username, room });
		//return an aknolegment if there is an error with an err
		if (error) {
			console.log(error);
			return callback(error);
		}
		//if there is no err
		//let the user join the room
		socket.join(user.room);

		//sending a welcome message when a the user join the room
		socket.emit('message', generateMessage('Admin', 'Welcome!'));
		//sending a user has joined message when a user join a room
		socket.broadcast.to(room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
		//sending an obj with all users in the room to fill the sidebar
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUserInRoom(user.room)
		});
		//sending an ack to client
		callback();
	});

	//sending message when a user submit message
	socket.on('sendMessage', (message, callback) => {
		const { username, room } = getUser(socket.id);

		const filter = new Filter();
		if (filter.isProfane(message)) {
			return callback('Profanity is not allowed!');
		}
		io.to(room).emit('message', generateMessage(username, message));
		callback();
	});

	//sending a left message when user leave
	socket.on('disconnect', () => {
		const user = removeUser(socket.id);
		if (user) {
			io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`));
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUserInRoom(user.room)
			});
		}
	});

	//sending the loaction string message
	socket.on('sendLocation', ({ latitude, longitude }, callback) => {
		const { username, room } = getUser(socket.id);

		io
			.to(room)
			.emit(
				'locatioMessage',
				generateLocationMessage(username, `https://google.com/maps?q=${latitude},${longitude}`)
			);
		callback();
	});
});

server.listen(port, () => {
	console.log(`server is up and running on port ${port}`);
});
