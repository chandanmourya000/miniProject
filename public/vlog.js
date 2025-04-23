const socket = io(); // Connect to server

// Form submission
document.getElementById('vlogForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const title = document.getElementById('title').value;

  socket.emit('new-vlog-uploaded', {
    title,
    author: currentUsername
  });

  this.reset();
});

