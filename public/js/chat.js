const socket = io();

// Elements
const messageForm = document.querySelector('#messageForm');
const messageFormInput = messageForm.querySelector('input');
const messageFormButton = messageForm.querySelector('button');
const locationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sideBarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = messages.offsetHeight;

    // Height of messages container
    const contentHeight = messages.scrollHeight;

    // How far have i scrolled
    const scrollOfset = messages.scrollTop + visibleHeight;

    if (contentHeight - newMessageHeight <= scrollOfset) {
        messages.scrollTop = messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (mapsUrl) => {
    const html = Mustache.render(locationTemplate, {
        username: mapsUrl.username,
        mapsUrl: mapsUrl.url,
        createdAt: moment(mapsUrl.createdAt).format('hh:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    messageFormButton.setAttribute('disabled', 'disabled');

    const messageInput = event.target.elements.message;
    const text = messageInput.value;
    socket.emit('sendMessage', text , (error) => {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();

        if ( error ) {
            return console.log(error);
        }
        // console.log('Message delivered');
    });
});

locationButton.addEventListener('click', () => {
    if ( !navigator.geolocation ) {
        return alert('Geolocation is not supported for your browser.');
    }
    locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        const location = {
            latitud: position.coords.latitude, 
            longitud: position.coords.longitude 
        }
        socket.emit('sendLocation', location, () => {
            locationButton.removeAttribute('disabled');
            console.log('Location shared');
        });
    });
});

socket.emit('join', { username, room}, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
