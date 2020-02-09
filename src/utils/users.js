const users = [];

const addUser = ({ id, username, room }) => {
	//validate
	if (!username.trim() || !room.trim()) {
		return {
			error: 'username and room are required'
		};
	}

	// clean the data
	username = username.trim().toLowerCase();
	room = room.trim().toLowerCase();

	//check for existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username;
	});

	//validate username
	if (existingUser) {
		return {
			error: 'this username name is already in use '
		};
	}
	//store user
	const user = { id, username, room };
	users.push(user);
	return { user };
};
const removeUser = (id) => {
	const index = users.findIndex((user) => user.id === id);
	if (index != -1) {
		return users.splice(index, 1)[0];
	}
};
const getUser = (id) => {
	const user = users.find((user) => {
		return user.id === id;
	});
	return user;
};
const getUserInRoom = (room) => {
	room.trim().toLowerCase();
	if (!room) {
		return {
			error: 'the is no room with this name'
		};
	}
	return users.filter((user) => user.room === room);
};

module.exports = {
	addUser,
	removeUser,
	getUser,
	getUserInRoom
};
