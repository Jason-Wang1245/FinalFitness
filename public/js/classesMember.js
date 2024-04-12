const classBookingError = document.getElementById("classBookingError");

const handleJoinClass = (event) => {
  const classId = event.target.parentNode.parentNode.parentNode.id.substr(8);

  fetch("/joinClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ classId: classId, username: username }),
  }).then((response) => {
    if (response.status === 304) {
      classBookingError.innerText = "Class is already full.";
      classBookingError.style.display = "inline";
    } else if (response.status === 305) {
      classBookingError.innerText = "There is a time conflict with this booking.";
      classBookingError.style.display = "inline";
    } else window.location.reload();
  });
};

const handleLeaveClass = (event) => {
  const classId = event.target.parentNode.parentNode.parentNode.id.substr(9);
  fetch("/leaveClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ classId: classId, username: username }),
  }).then((response) => {
    window.location.reload();
  });
};

const handlePayClass = event => {
  const classId = event.target.parentNode.parentNode.parentNode.id.substr(9);
  fetch("/payClass", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ classId: classId, username: username }),
  }).then((response) => {
    window.location.reload();
  });
}