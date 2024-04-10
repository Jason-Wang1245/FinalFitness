const appointmentTitleInput = document.getElementById("appointmentTitle");
const appointmentDateInput = document.getElementById("appointmentDate");
const appointmentStartingTimeInput = document.getElementById("appointmentStartingTime");
const appointmentEndingTimeInput = document.getElementById("appointmentEndingTime");
const submitAppointmentButton = document.getElementById("submitAppointment");
const appointmentCreateError = document.getElementById("appointmentCreateError");
const appointmentError = document.getElementById("appointmentError");

// post request for creating new appointment
submitAppointmentButton.addEventListener("click", () => {
  const title = appointmentTitleInput.value.trim();
  const date = appointmentDateInput.value;
  const startingTime = appointmentStartingTimeInput.value;
  const endingTime = appointmentEndingTimeInput.value;

  if (title === "" || date === "" || startingTime === "" || endingTime === "") {
    appointmentCreateError.innerText = "Please enter a value for all fields.";
    appointmentCreateError.style.display = "inline";
  } else if (endingTime <= startingTime) {
    appointmentCreateError.innerText = "Ending Time must be greater than Starting Time.";
    appointmentCreateError.style.display = "inline";
  } else {
    fetch("/createAppointment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: title, date: date, startingTime: startingTime, endingTime: endingTime, username: username }),
    }).then((response) => {
      if (response.status === 305) {
        appointmentCreateError.innerText = "You already have an appointment post during this time period.";
        appointmentCreateError.style.display = "inline";
      } else window.location.reload();
    });
  }
});

const handleDeleteAppointment = (event) => {
  const appointmentId = event.target.parentNode.parentNode.parentNode.id.substr(8);

  fetch("/deleteAppointment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId: appointmentId }),
  }).then((response) => {
    if (response.status === 304){
      appointmentError.innerText = "Appointment is already booked.";
      appointmentError.style.display = "inline";
    } else {
      window.location.reload();
    }
  });
};
