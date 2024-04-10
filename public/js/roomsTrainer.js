const roomNameTag = document.getElementById("roomNameTag");
const dateInput = document.getElementById("bookingDate");
const startingTimeInput = document.getElementById("bookingStartingTime");
const endingTimeInput = document.getElementById("bookingEndingTime");
const bookingError = document.getElementById("bookRoomError");
const submitRoomBookingButton = document.getElementById("submitRoomBooking");

// post request for booking room
submitRoomBookingButton.addEventListener("click", () => {
  const roomName = roomNameTag.value;
  const date = dateInput.value;
  const startingTime = startingTimeInput.value;
  const endingTime = endingTimeInput.value;

  if (roomName === "" || date === "" || startingTime === "" || endingTime === "") {
    bookingError.innerText = "Please enter a value for all fields.";
    bookingError.style.display = "inline";
  } else if (endingTime <= startingTime) {
    bookingError.innerText = "Ending Time must be greater than Starting Time.";
    bookingError.style.display = "inline";
  } else {
    fetch("/bookRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, roomName: roomName, date: date, startingTime: startingTime, endingTime: endingTime }),
    }).then((response) => {
      if (response.status === 304) {
        bookingError.innerText = "This room is booked during this time.";
        bookingError.style.display = "inline";
      } else window.location.reload();
    });
  }
});

const selectRoom = (event) => {
  roomNameTag.value = event.target.getAttribute("value");
};

const handleCancelBooking = event => {
  const bookingId = event.target.parentNode.parentNode.parentNode.id.substr(8);
  
  fetch("/cancelBooking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bookingId: bookingId }),
  }).then((response) => {
    window.location.reload();
  });
}