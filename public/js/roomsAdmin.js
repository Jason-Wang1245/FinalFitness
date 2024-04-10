const roomNameInput = document.getElementById("roomName");
const roomCapacityInput = document.getElementById("roomCapacity");
const roomCreateButton = document.getElementById("submitRoom");
const roomError = document.getElementById("roomCreateError");

// post request to add new room
roomCreateButton.addEventListener("click", () => {
  const roomName = roomNameInput.value.trim();
  const roomCapacity = roomCapacityInput.value;

  if (roomName.length === 0) {
    roomError.innerText = "Room name cannot be empty.";
    roomError.style.display = "inline";
  } else if (roomCapacity <= 0) {
    roomError.innerText = "Room capacity must be 0 or greater.";
    roomError.style.display = "inline";
  } else {
    fetch("/createRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomName: roomName, roomCapacity: roomCapacity }),
    }).then((response) => {
      if (response.status === 304) {
        roomError.innerText = "Room name is already in use.";
        roomError.style.display = "inline";
      } else window.location.reload();
    });
  }
});

const handleDeleteRoom = (event) => {
  const roomName = event.target.parentNode.parentNode.parentNode.id.substr(8);

  fetch("/deleteRoom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roomName: roomName }),
  }).then((response) => {
    window.location.reload();
  });
};

const handleDeleteBooking = event => {
  const bookingId = event.target.parentNode.parentNode.parentNode.id.substr(8);
  
  fetch("/deleteBooking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookingId: bookingId }),
  }).then((response) => {
    window.location.reload();
  });
}
