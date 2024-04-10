const classNameInput = document.getElementById("className");
const classDateInput = document.getElementById("classDate");
const classStartingTimeInput = document.getElementById("classStartingTime");
const classEndingTimeInput = document.getElementById("classEndingTime");
const classMaximumCapacityInput = document.getElementById("classMaximumCapacity");
const submitClassButton = document.getElementById("submitClass");
const classCreateError = document.getElementById("classCreateError");
const classError = document.getElementById("classError");

// post request for creating class
submitClassButton.addEventListener("click", () => {
  const name = classNameInput.value.trim();
  const date = classDateInput.value;
  const startingTime = classStartingTimeInput.value;
  const endingTime = classEndingTimeInput.value;
  const maxCapacity = classMaximumCapacityInput.value;

  if (name === "" || date === "" || startingTime === "" || endingTime === "" || maxCapacity === "") {
    classCreateError.innerText = "Please enter a value for all fields.";
    classCreateError.style.display = "inline";
  } else if (endingTime <= startingTime) {
    classCreateError.innerText = "Ending Time must be greater than Starting Time.";
    classCreateError.style.display = "inline";
  } else if (parseInt(maxCapacity).toString() !== maxCapacity) {
    classCreateError.innerText = "Please enter a integer for capacity.";
    classCreateError.style.display = "inline";
  } else if (parseInt(maxCapacity) <= 0) {
    classCreateError.innerText = "Maximum capacity must be greater than 0.";
    classCreateError.style.display = "inline";
  } else {
    fetch("/createClass", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name, date: date, startingTime: startingTime, endingTime: endingTime, username: username, maxCapacity: maxCapacity }),
    }).then((response) => {
      window.location.reload();
    });
  }
});

const handleDeleteClass = event => {
    const classId = event.target.parentNode.parentNode.parentNode.id.substr(8);

    fetch("/deleteClass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId: classId }),
      }).then((response) => {
        window.location.reload();
      });
}