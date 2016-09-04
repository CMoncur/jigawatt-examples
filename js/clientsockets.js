var socket  = io.connect()
  , text    = document.getElementsByTagName('p')[1]

socket.on('user connected', function(data) {
  text.innerHTML = data
})
