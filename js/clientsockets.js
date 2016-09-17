var socket  = io.connect()
  , text    = document.getElementsByTagName('p')[0]

socket.on('user connected', function(data) {
  text.innerHTML = data
})
