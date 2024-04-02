const toggleTrainerCode = () => {
  let selectElement = document.getElementById("accountType");
  let popupElement = document.getElementById("trainerCodeBlock");
  let selectedValue = selectElement.value;

  if (selectedValue === "Trainer") {
    popupElement.style.display = "block";
  } else {
    popupElement.style.display = "none";
  }
};
