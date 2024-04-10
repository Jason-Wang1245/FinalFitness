const equipmentNameInput = document.getElementById("equipmentName");
const equipmentQuantityInput = document.getElementById("equipmentQuantity");
const maximumDurabilityInput = document.getElementById("maximumDurability");
const submitEquipmentButton = document.getElementById("submitEquipment");
const equipmentError = document.getElementById("equipmentCreateError");

// post request for adding new equipment
submitEquipmentButton.addEventListener("click", () => {
  const equipmentName = equipmentNameInput.value.trim();
  const equipmentQuantity = equipmentQuantityInput.value;
  const maximumDurability = maximumDurabilityInput.value;

  if (equipmentName === "" || equipmentQuantity === "" || maximumDurability === "") {
    equipmentError.innerText = "Please enter a value for all fields.";
    equipmentError.style.display = "inline";
  } else if (equipmentQuantity <= 0) {
    equipmentError.innerText = "Equipment quantity must be greater than 0.";
    equipmentError.style.display = "inline";
  } else if (maximumDurability <= 0) {
    equipmentError.innerText = "Equipment maximum durability must be greater than 0.";
    equipmentError.style.display = "inline";
  } else {
    fetch("/createEquipment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ equipmentName: equipmentName, equipmentQuantity: equipmentQuantity, maximumDurability: maximumDurability }),
    }).then((response) => {
      window.location.reload();
    });
  }
});

const handleEditEquipment = (event) => {
  const curEquipmentId = event.target.parentNode.id;
  const curDurabilityInput = document.getElementById(curEquipmentId + "CurrentInput");
  const curDurabilityValue = document.getElementById(curEquipmentId + "CurrentValue");
  const curSubmit = document.getElementById(curEquipmentId + "Submit");
  const curError = document.getElementById(curEquipmentId + "Error");

  if (curDurabilityValue.style.display !== "none"){
    curDurabilityValue.style.display = "none";
    curDurabilityInput.style.display = "inline";
    curSubmit.style.display = "inline";
  } else {
    curDurabilityValue.style.display = "inline";
    curDurabilityInput.style.display = "none";
    curSubmit.style.display = "none";
    curError.style.display = "none";
  }
};

const handleEditDurability = (event) => {
  const curEquipmentId = event.target.id.substring(0, event.target.id.length - 6);
  const curDurabilityInput = document.getElementById(curEquipmentId + "CurrentInput");
  const curMaxDurability = document.getElementById(curEquipmentId + "Max");
  const curError = document.getElementById(curEquipmentId + "Error");

  if (parseInt(curDurabilityInput.value) > parseInt(curMaxDurability.innerText) || parseInt(curDurabilityInput.value) < 0){
    curError.innerText = "Durability must be non-zero and below the max.";
    curError.style.display = "inline";
  } else if (parseInt(curDurabilityInput.value).toString() !== curDurabilityInput.value) {
    curError.innerText = "Please enter a integer value.";
    curError.style.display = "inline";
  } else {
    fetch("/editEquipmentDurability", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newDurability: curDurabilityInput.value, equipmentId: curEquipmentId }),
    }).then((response) => {
      window.location.reload();
    });
  }
}
