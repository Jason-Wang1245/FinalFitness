// weight tags
const weightEditButton = document.getElementById("weight-metric-edit");
const currentWeightValueSpan = document.getElementById("weight-metric-current-value");
const currentWeightInput = document.getElementById("weight-metric-current-input");
const goalWeightValueSpan = document.getElementById("weight-metric-goal-value");
const goalWeightInput = document.getElementById("weight-metric-goal-input");
const weightSubmitButton = document.getElementById("weight-metric-submit");
const weightError = document.getElementById("weight-metric-error");

// steps tags
const stepEditButton = document.getElementById("steps-metric-edit");
const currentStepValueSpan = document.getElementById("steps-metric-current-value");
const currentStepInput = document.getElementById("steps-metric-current-input");
const goalStepValueSpan = document.getElementById("steps-metric-goal-value");
const goalStepInput = document.getElementById("steps-metric-goal-input");
const stepSubmitButton = document.getElementById("steps-metric-submit");
const stepError = document.getElementById("steps-metric-error");

// calorie tags
const calorieEditButton = document.getElementById("calories-metric-edit");
const currentCalorieValueSpan = document.getElementById("calories-metric-current-value");
const currentCalorieInput = document.getElementById("calories-metric-current-input");
const goalCalorieValueSpan = document.getElementById("calories-metric-goal-value");
const goalCalorieInput = document.getElementById("calories-metric-goal-input");
const calorieSubmitButton = document.getElementById("calories-metric-submit");
const calorieError = document.getElementById("calories-metric-error");

// goals tags
const addGoalButton = document.getElementById("add-goal-button");
const addGoalInput = document.getElementById("add-goal-input");
const addGoalError = document.getElementById("add-goal-error");
const editAchievementsButton = document.getElementById("edit-achievements");

// routine tags
const addRoutineButton = document.getElementById("add-routine-button");
const addRoutineInput = document.getElementById("add-routine-input");
const addRoutineError = document.getElementById("add-routine-error");
const editRoutinesButton = document.getElementById("edit-routines");

// toggle weight tags
weightEditButton.addEventListener("click", () => {
  if (currentWeightValueSpan.style.display !== "none") {
    currentWeightValueSpan.style.display = "none";
    currentWeightInput.style.display = "inline";
    goalWeightValueSpan.style.display = "none";
    goalWeightInput.style.display = "inline";
    weightSubmitButton.style.display = "inline";
  } else {
    currentWeightValueSpan.style.display = "inline";
    currentWeightInput.style.display = "none";
    goalWeightValueSpan.style.display = "inline";
    goalWeightInput.style.display = "none";
    weightSubmitButton.style.display = "none";
    weightError.style.display = "none";
  }
});

// toggle step tags
stepEditButton.addEventListener("click", () => {
  if (currentStepValueSpan.style.display !== "none") {
    currentStepValueSpan.style.display = "none";
    currentStepInput.style.display = "inline";
    goalStepValueSpan.style.display = "none";
    goalStepInput.style.display = "inline";
    stepSubmitButton.style.display = "inline";
  } else {
    currentStepValueSpan.style.display = "inline";
    currentStepInput.style.display = "none";
    goalStepValueSpan.style.display = "inline";
    goalStepInput.style.display = "none";
    stepSubmitButton.style.display = "none";
    stepError.style.display = "none";
  }
});

// toggle calories tags
calorieEditButton.addEventListener("click", () => {
  if (currentCalorieValueSpan.style.display !== "none") {
    currentCalorieValueSpan.style.display = "none";
    currentCalorieInput.style.display = "inline";
    goalCalorieValueSpan.style.display = "none";
    goalCalorieInput.style.display = "inline";
    calorieSubmitButton.style.display = "inline";
  } else {
    currentCalorieValueSpan.style.display = "inline";
    currentCalorieInput.style.display = "none";
    goalCalorieValueSpan.style.display = "inline";
    goalCalorieInput.style.display = "none";
    calorieSubmitButton.style.display = "none";
    calorieError.style.display = "none";
  }
});

// post request for weight updated data
weightSubmitButton.addEventListener("click", () => {
  const currentWeight = parseFloat(currentWeightInput.value).toFixed(2);
  const goalWeight = parseFloat(goalWeightInput.value).toFixed(2);

  if (currentWeight > 0 && currentWeight < 500 && goalWeight > 0 && goalWeight < 500) {
    fetch("/editWeight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentWeight: currentWeight, goalWeight: goalWeight, username: username }),
    }).then((response) => {
      window.location.reload();
    });
  } else {
    weightError.style.display = "block";
  }
});

// post request for update steps data
stepSubmitButton.addEventListener("click", () => {
  const currentSteps = parseInt(currentStepInput.value);
  const goalSteps = parseInt(goalStepInput.value);

  if (currentSteps > 0 && currentSteps < 100000 && goalSteps > 0 && goalSteps < 100000) {
    fetch("/editSteps", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentSteps: currentSteps, goalSteps: goalSteps, username: username }),
    }).then((response) => {
      window.location.reload();
    });
  } else {
    stepError.style.display = "block";
  }
});

// post request for calorie updated data
calorieSubmitButton.addEventListener("click", () => {
  const currentCalories = parseInt(currentCalorieInput.value);
  const goalCalories = parseInt(goalCalorieInput.value);

  if (currentCalories > 0 && currentCalories < 100000 && goalCalories > 0 && goalCalories < 100000) {
    fetch("/editCalories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentCalories: currentCalories, goalCalories: goalCalories, username: username }),
    }).then((response) => {
      window.location.reload();
    });
  } else {
    calorieError.style.display = "block";
  }
});

// post request for adding goal
addGoalButton.addEventListener("click", () => {
  const goalContent = addGoalInput.value.trim();

  if (goalContent.length === 0) {
    addGoalError.style.display = "inline";
  } else {
    fetch("/addGoal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goalContent: goalContent, username: username }),
    }).then((response) => {
      window.location.reload();
    });
  }
});

// post request for adding routine
addRoutineButton.addEventListener("click", () => {
  const routineContent = addRoutineInput.value.trim();

  if (routineContent.length === 0) {
    addRoutineError.style.display = "inline";
  } else {
    fetch("/addRoutine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ routineContent: routineContent, username: username }),
    }).then((response) => {
      window.location.reload();
    });
  }
});

// toggles delete buttons for achievements
editAchievementsButton.addEventListener("click", () => {
  const deleteButtons = document.getElementsByClassName("delete-event");
  if (deleteButtons[0].style.display === "none" || deleteButtons[0].style.display === "") {
    for (const button of deleteButtons) button.style.display = "inline";
  } else {
    for (const button of deleteButtons) button.style.display = "none";
  }
});

// toggles delete buttons for routines
editRoutinesButton.addEventListener("click", () => {
  const deleteButtons = document.getElementsByClassName("delete-routine");
  if (deleteButtons[0].style.display === "none" || deleteButtons[0].style.display === "") {
    for (const button of deleteButtons) button.style.display = "inline";
  } else {
    for (const button of deleteButtons) button.style.display = "none";
  }
});

const handleCompleteGoal = (event) => {
  const goalId = event.target.parentNode.id;

  fetch("/completeGoal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ goalId: goalId}),
  }).then((response) => {
    window.location.reload();
  });
};

const handleDeleteAchievement = (event) => {
  const goalId = event.target.parentNode.parentNode.id;
  fetch("/deleteAchievement", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ goalId: goalId }),
  }).then((response) => {
    window.location.reload();
  });
};

const handleDeleteRoutine = (event) => {
  const routineId = event.target.parentNode.parentNode.id;

  fetch("/deleteRoutine", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ routineId: routineId }),
  }).then((response) => {
    window.location.reload();
  });
};
