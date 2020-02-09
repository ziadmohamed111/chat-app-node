// requiring libs
// import Mustache from 'mustache';
// import moment from 'moment';

const socket = io();

//elements -----------------------------------------------------------------------------

//messages box
const $messages = document.querySelector('#messages');
const $sideBar = document.querySelector('#side-bar');
//templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//message form
const $messageForm = document.querySelector('#message-form');
const $messageFormBtn = document.querySelector('#message-form').elements[1];
const $messageFormInput = document.querySelector('#message-form').elements.message;
//location form
const $sendLocationBtn = document.querySelector('#send-location-btn');

// -------------------------------------------------------------------------------------

const autoScroll = () => {
	//new message element
	const $newMessage = $messages.lastElementChild;
	//height of new message
	const newMessageStyles = getComputedStyle($newMessage);
	const newMessageMargin = parseInt(newMessageStyles.marginBottom);
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

	//visible Height
	const visibleHeight = $messages.offsetHeight;

	//Height of messages container
	const containerHeight = $messages.scrollHeight;

	//how far have the user scrolled
	const scrollOffSet = $messages.scrollTop + visibleHeight;

	if (containerHeight - newMessageHeight <= scrollOffSet) {
		$messages.scrollTop = $messages.scrollHeight;
	}
};

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

socket.on('message', ({ username, text, createdAt }) => {
	const html = Mustache.render(messageTemplate, {
		username,
		message: text,
		createdAt: moment(createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoScroll();
});
// sending message
$messageForm.addEventListener('submit', (e) => {
	e.preventDefault(); // previnting refreshing
	$messageFormBtn.setAttribute('disabled', 'disabled');

	const message = $messageFormInput.value;

	//if there is a blank message
	if (!message) {
		$messageFormBtn.removeAttribute('disabled');
		return;
	}

	//if the message has a value
	socket.emit('sendMessage', message, (error) => {
		//reEnabeling the sending message button.
		$messageFormBtn.removeAttribute('disabled');
		if (error) {
			// if there is any errors.
			return;
		}

		$messageFormInput.value = '';
		$messageFormInput.focus();
	});
});

socket.on('locatioMessage', ({ username, url, createdAt }) => {
	const html = Mustache.render(locationTemplate, {
		username,
		url: url.text,
		createdAt: moment(createdAt).format('h:mm a')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoScroll();
});
socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	});
	$sideBar.innerHTML = html;
});

$sendLocationBtn.addEventListener('click', () => {
	//disabling the location button till the message is sent
	$sendLocationBtn.setAttribute('disabled', 'disabled');

	// if the geolocation is not supported in the users browser
	if (!navigator.geolocation) {
		return alert('Sharing location is not supported by you browser.');
	}

	//if it's supported
	navigator.geolocation.getCurrentPosition((position) => {
		const location = {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		};

		//handling Acknowledgements
		socket.emit('sendLocation', location, (error) => {
			//reEnabeling the button.
			$sendLocationBtn.removeAttribute('disabled');

			//if there is an error
			if (error) {
				return;
			}
		});
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = '/';
	}
});
