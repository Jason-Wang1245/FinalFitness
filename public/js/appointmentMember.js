const bookingError = document.getElementById("bookingError");

const handleBookAppointment = (event) => {
  const appointmentId = event.target.parentNode.parentNode.parentNode.id.substr(8);

  fetch("/bookAppointment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId: appointmentId, username: username }),
  }).then((response) => {
    if (response.status === 304) {
      bookingError.innerText = "Appointment is already booked.";
      bookingError.style.display = "inline";
    } else if (response.status === 305) {
    bookingError.innerText = "There is a time conflict with this booking.";
      bookingError.style.display = "inline";
    } else {
      window.location.reload();
    }
  });
};

const handleCancelAppointment = (event) => {
  const appointmentId = event.target.parentNode.parentNode.parentNode.id.substr(8);

  fetch("/cancelAppointment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId: appointmentId }),
  }).then((response) => {
    window.location.reload();
  });
};

const handlePayAppointment = event => {
  const appointmentId = event.target.parentNode.parentNode.parentNode.id.substr(8);
  fetch("/payAppointment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId: appointmentId }),
  }).then((response) => {
    window.location.reload();
  });
}
