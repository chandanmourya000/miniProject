// const socket = io();

// socket.on('broadcast-new-vlog', (data) => {
//   showVlogNotification(`${data.author} uploaded a new vlog: "${data.title}"`);
// });

// function showVlogNotification(message) {
//   const notif = document.createElement('div');
//   notif.textContent = message;
//   notif.style.position = 'fixed';
//   notif.style.top = '10px';
//   notif.style.right = '10px';
//   notif.style.backgroundColor = '#2196F3';
//   notif.style.color = 'white';
//   notif.style.padding = '12px 18px';
//   notif.style.borderRadius = '10px';
//   notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
//   notif.style.zIndex = '9999';
//   notif.style.transition = 'opacity 0.5s ease';
//   notif.style.fontFamily = 'sans-serif';

//   document.body.appendChild(notif);

//   setTimeout(() => {
//     notif.style.opacity = '0';
//     setTimeout(() => notif.remove(), 500);
//   }, 4000);
// }
const socket = io(); // Reconnect here too

socket.on('broadcast-new-vlog', (data) => {
  // Optional: Add to vlog list if it exists
  const vlogList = document.getElementById('vlogList');
  if (vlogList) {
    const vlogItem = document.createElement('li');
    vlogItem.innerHTML = `<strong>${data.title}</strong> by ${data.author} - just now`;
    vlogList.prepend(vlogItem);
  }

  // Show notification
  showVlogNotification(`${data.author} just uploaded a new vlog: "${data.title}"`);
});

function showVlogNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.position = 'fixed';
  notif.style.top = '10px';
  notif.style.right = '10px';
  notif.style.backgroundColor = '#4CAF50';
  notif.style.color = 'white';
  notif.style.padding = '12px 18px';
  notif.style.borderRadius = '10px';
  notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  notif.style.zIndex = '9999';
  notif.style.fontFamily = 'sans-serif';
  notif.style.transition = 'opacity 0.5s ease';

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 500);
  }, 4000); // Hide after 4 seconds
}
