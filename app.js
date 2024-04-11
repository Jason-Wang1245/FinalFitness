const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const crypto = require("crypto");
const passport = require("passport");
const session = require("express-session");
const flash = require("express-flash");
const LocalStrategy = require("passport-local").Strategy;
const { client } = require("./database");

// one-way hashing for passwords
const hashPassword = (password) => {
  const hash = crypto.createHash("sha256");
  hash.update(password);
  return hash.digest("hex");
};

// check if appointment is already booked
async function isAvailableAppointment(appointmentId) {
  const result = await client.query("SELECT COUNT(*) AS count FROM availableAppointments WHERE appointmentId = $1", [appointmentId]);
  return result.rows[0].count === "1";
}

// check if there is a time conflict with the given time of the given user
async function isAppointmentTimeConflict(startTime, endTime, date, username, accountType) {
  if (accountType === "Trainer") {
    const result = await client.query("SELECT startTime, endTime, date FROM availableAppointments WHERE trainerUsername = $1", [username]);

    for (let i = 0; i < result.rows.length; i++) {
      if (date === result.rows[i].date.toISOString().slice(0, 10) && ((endTime <= result.rows[i].endtime && endTime > result.rows[i].starttime) || (startTime > result.rows[i].starttime && startTime < result.rows[i].endtime))) return true;
    }
  }

  let result;
  if (accountType === "Member") result = await client.query("SELECT startTime, endTime, date FROM bookedAppointments WHERE memberUsername = $1", [username]);
  else result = await client.query("SELECT startTime, endTime, date FROM bookedAppointments WHERE trainerUsername = $1", [username]);

  for (let i = 0; i < result.rows.length; i++) {
    if (date === result.rows[i].date.toISOString().slice(0, 10) && ((endTime <= result.rows[i].endtime && endTime > result.rows[i].starttime) || (startTime > result.rows[i].starttime && startTime < result.rows[i].endtime))) return true;
  }

  return false;
}

// checks if the room is a time conflict of the given time
async function isRoomTimeConflict(startTime, endTime, date, roomName) {
  const result = await client.query("SELECT startTime, endTime, date FROM roomBookings WHERE roomName = $1", [roomName]);

  for (let i = 0; i < result.rows.length; i++) {
    if (date === result.rows[i].date.toISOString().slice(0, 10) && ((endTime <= result.rows[i].endtime && endTime > result.rows[i].starttime) || (startTime > result.rows[i].starttime && startTime < result.rows[i].endtime))) return true;
  }

  return false;
}

// check if a class is already full
async function isAvailableClass(classId) {
  const result = await client.query("SELECT currentCapacity, maxCapacity FROM classes WHERE classId = $1", [classId]);
  return result.rows[0].currentcapacity < result.rows[0].maxcapacity;
}

// checks if there is a time conflict in class bookings for the member
async function isClassTimeConflict(startTime, endTime, date, username){
  const result = await client.query("SELECT startTime, endTime, date FROM classBookings JOIN classes ON classBookings.classId = classes.classId WHERE classBookings.memberUsername = $1", [username]);
  for (let i = 0; i < result.rows.length; i++) {
    if (date === result.rows[i].date.toISOString().slice(0, 10) && ((endTime <= result.rows[i].endtime && endTime > result.rows[i].starttime) || (startTime > result.rows[i].starttime && startTime < result.rows[i].endtime))) return true;
  }

  return false;
}

const initialize = (passport) => {
  // authenticating user login
  const authenticateUser = (username, password, done) => {
    username = username.trim();

    const userQuery = {
      text: "SELECT * FROM users WHERE username = $1",
      values: [username],
    };

    client.query(userQuery, (err, result) => {
      if (err) return done(null, false, { message: "Database error." });
      else if (result.rowCount == 0) return done(null, false, { message: "Invalid username or password." });
      else {
        if (hashPassword(password) === result.rows[0].password) return done(null, result.rows[0]);
        else return done(null, false, { message: "Invalid username or password." });
      }
    });
  };

  passport.use(new LocalStrategy({ usernameField: "username", passwordField: "password" }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.username));
  passport.deserializeUser((id, done) => {
    const userQuery = {
      text: "SELECT * FROM users WHERE username = $1",
      values: [id],
    };

    // retrieve user data
    client.query(userQuery, (err, result) => {
      if (err) console.log(err);
      let data = result.rows[0];
  
      if (data.accounttype === "Admin" || data.accounttype === "Member"){
        const getClassesQuery = {
          text: "SELECT * FROM classes ORDER BY date, startTime ASC",
          values: []
        }

        client.query(getClassesQuery, (err, result) => {
          if (err) console.log(err);
          data.classes = result.rows;
        })
      }
      // if member, retrieve fitness goal data
      if (data.accounttype === "Member") {
        const healthMetricsQuery = {
          text: "SELECT * FROM healthMetrics WHERE username = $1",
          values: [id],
        };
        // retrieve health metrics data
        client.query(healthMetricsQuery, (err, result) => {
          if (err) console.log(err);
          data.healthMetrics = result.rows[0];
          const fitnessGoalsQuery = {
            text: "SELECT * FROM fitnessGoals WHERE username = $1",
            values: [id],
          };
          // retrieve fitness goals data
          client.query(fitnessGoalsQuery, (err, result) => {
            if (err) console.log(err);
            data.fitnessGoals = result.rows;
            const fitnessRoutinesQuery = {
              text: "SELECT * FROM fitnessRoutines WHERE username = $1",
              values: [id],
            };
            // retrieve fitness routines data
            client.query(fitnessRoutinesQuery, (err, result) => {
              if (err) console.log(err);
              data.fitnessRoutines = result.rows;
              const getAvailableAppointments = {
                text: "SELECT date, startTime, endTime, appointmentName, firstName, lastName, appointmentId FROM availableAppointments, users WHERE availableAppointments.trainerUsername = users.username ORDER BY date, startTime ASC",
                values: [],
              };
              // retrieve available appointments
              client.query(getAvailableAppointments, (err, result) => {
                if (err) console.log(err);
                data.availableAppointments = result.rows;
                const getBookedAppointments = {
                  text: "SELECT date, startTime, endTime, appointmentName, firstName, lastName, appointmentId FROM bookedAppointments, users WHERE bookedAppointments.trainerUsername = users.username AND bookedAppointments.memberUsername = $1 ORDER BY date, startTime ASC",
                  values: [id],
                };
                // retrieve appointments that the user has booked
                client.query(getBookedAppointments, (err, result) => {
                  if (err) console.log(err);
                  data.bookedAppointments = result.rows;
                  const getBookedClasses = {
                    text: "SELECT classes.className, classes.classId, classes.starttime, classes.endtime, classes.date FROM classBookings JOIN classes ON classBookings.classId = classes.classId WHERE classBookings.memberUsername = $1 ORDER BY classes.date, classes.startTime ASC",
                    values: [id]
                  } 
                  // retrieve classes that the user has booked
                  client.query(getBookedClasses, (err, result) => {
                    if (err) console.log(err);
                    data.bookedClasses = result.rows;

                    return done(null, data);
                  });
                });
              });
            });
          });
        });
      } else if (data.accounttype === "Trainer") {
        const getMembersQuery = {
          text: "SELECT * FROM users WHERE accountType = $1 ORDER BY $2 ASC",
          values: ["Member", "firstName"],
        };
        // retrieve list of members
        client.query(getMembersQuery, (err, result) => {
          if (err) console.log(err);
          data.membersList = result.rows;
          const getTrainerAvailableAppointments = {
            text: "SELECT * FROM availableAppointments WHERE trainerUsername = $1 ORDER BY date, startTime ASC",
            values: [id],
          };
          // retrieve this trainers available appointments
          client.query(getTrainerAvailableAppointments, (err, result) => {
            if (err) console.log(err);
            data.myAvailableAppointments = result.rows;
            const getBookedAppointments = {
              text: "SELECT date, startTime, endTime, appointmentName, firstName, lastName, appointmentId FROM bookedAppointments JOIN users ON bookedAppointments.memberUsername = users.username WHERE bookedAppointments.trainerUsername = $1 ORDER BY date, startTime ASC",
              values: [id],
            };
            // get all the appointments booked under this trainer
            client.query(getBookedAppointments, (err, result) => {
              if (err) console.log(err);
              data.bookedAppointments = result.rows;
              const getRoomsQuery = {
                text: "SELECT * FROM rooms ORDER BY roomName ASC",
                values: [],
              };
              // retrieve all rooms
              client.query(getRoomsQuery, (err, result) => {
                if (err) console.log(err);
                data.rooms = result.rows;
                const getBookedRoomsQuery = {
                  text: "SELECT * FROM roomBookings ORDER BY roomName, date, startTime ASC",
                  values: [],
                };
                // retrieve all room bookings
                client.query(getBookedRoomsQuery, (err, result) => {
                  if (err) console.log(err);
                  data.bookedRooms = result.rows;

                  return done(null, data);
                });
              });
            });
          });
        });
      } else if (data.accounttype === "Admin") {
        const getRoomsQuery = {
          text: "SELECT * FROM rooms ORDER BY roomName ASC",
          values: [],
        };
        // retrieve all rooms
        client.query(getRoomsQuery, (err, result) => {
          if (err) console.log(err);
          data.rooms = result.rows;
          const getRoomsQuery = {
            text: "SELECT * FROM rooms ORDER BY roomName ASC",
            values: [],
          };
          // retrieve all rooms
          client.query(getRoomsQuery, (err, result) => {
            if (err) console.log(err);
            data.rooms = result.rows;
            const getBookedRoomsQuery = {
              text: "SELECT * FROM roomBookings ORDER BY roomName, date, startTime ASC",
              values: [],
            };
            // retrieve all room bookings
            client.query(getBookedRoomsQuery, (err, result) => {
              if (err) console.log(err);
              data.bookedRooms = result.rows;
              const getEquipmentQuery = {
                text: "SELECT * FROM equipment ORDER BY equipmentName ASC",
                values: []
              }
              // retrieve all equipment
              client.query(getEquipmentQuery, (err, result) => {
                if (err) console.log(err);
                data.equipment = result.rows;

                return done(null, data);
              })
              
            });
          });
        });
      }
    });
  });
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "comp3005",
    resave: false,
    saveUninitialized: false,
  })
);

initialize(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("homepage.ejs", { authentication: req.isAuthenticated() });
});

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.accounttype === "Member") {
      res.render("dashboard.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        healthMetrics: req.user.healthMetrics,
        fitnessGoals: req.user.fitnessGoals.filter((tuple) => !tuple.iscomplete),
        fitnessAchievements: req.user.fitnessGoals.filter((tuple) => tuple.iscomplete),
        fitnessRoutines: req.user.fitnessRoutines,
      });
    } else if (req.user.accounttype === "Trainer") {
      res.render("dashboard.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        membersList: req.user.membersList,
      });
    } else {
      res.render("dashboard.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
      });
    }
  } else res.redirect("/signin");
});

app.get("/appointments", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.accounttype === "Member") {
      res.render("appointments.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        availableAppointments: req.user.availableAppointments,
        bookedAppointments: req.user.bookedAppointments,
      });
    } else {
      res.render("appointments.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        myAvailableAppointments: req.user.myAvailableAppointments,
        bookedAppointments: req.user.bookedAppointments,
      });
    }
  } else res.redirect("/signin");
});

app.get("/rooms", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.accounttype === "Member") {
      res.redirect("/dashboard");
    } else {
      if (req.user.accounttype === "Admin") {
        res.render("rooms.ejs", {
          username: req.user.username,
          firstName: req.user.firstname,
          lastName: req.user.lastname,
          accountType: req.user.accounttype,
          rooms: req.user.rooms,
          bookedRooms: req.user.bookedRooms,
        });
      } else if (req.user.accounttype === "Trainer") {
        res.render("rooms.ejs", {
          username: req.user.username,
          firstName: req.user.firstname,
          lastName: req.user.lastname,
          accountType: req.user.accounttype,
          rooms: req.user.rooms,
          bookedRooms: req.user.bookedRooms,
          myBookedRooms: req.user.bookedRooms.filter((item) => item.trainerusername === req.user.username),
        });
      }
    }
  } else res.redirect("/signin");
});

app.get("/equipment", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.accounttype === "Admin") {
      res.render("equipment.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        equipment: req.user.equipment
      });
    } else res.redirect("/dashboard");
  } else res.redirect("/signin");
});

app.get("/classes", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.accounttype === "Admin"){
      res.render("classes.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        classes: req.user.classes
      })
    } else if (req.user.accounttype === "Member") {
      res.render("classes.ejs", {
        username: req.user.username,
        firstName: req.user.firstname,
        lastName: req.user.lastname,
        accountType: req.user.accounttype,
        classes: req.user.classes,
        bookedClasses: req.user.bookedClasses
      })
    } else {
      res.redirect("/dashboard");
    }
  } else res.redirect("/signin");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs", { errorMessage: "" });
});

app.get("/signin", (req, res) => {
  res.render("signin.ejs");
});

app.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) console.log(err);
    res.redirect("/signin");
  });
});

app.post("/signup", (req, res) => {
  const username = req.body.username.trim();
  let firstName = req.body.firstName.trim();
  let lastName = req.body.lastName.trim();
  let password = req.body.password.trim();
  const accountType = req.body.accountType;
  const trainerCode = req.body.trainerCode.trim();

  // check if username length is valid
  if (username.length > 20 || username.length == 0) res.render("signup", { errorMessage: "Username must be less than 20 characters and not empty." });
  else {
    // check if username is characters and numbers only
    if (!/^[A-Za-z0-9]+$/.test(username)) res.render("signup", { errorMessage: "Username must be characters and numbers only." });
    else {
      if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) res.render("signup", { errorMessage: "First name and last name must be characters only." });
      else {
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
        // check if password is valid
        if (password.length == 0) res.render("signup", { errorMessage: "Password cannot be empty." });
        else {
          password = hashPassword(password);
          // check if trainer code is valid if accountType is trainer
          if (accountType === "Trainer" && trainerCode != "comp3005") res.render("signup", { errorMessage: "Trainer Creation code is incorrect." });
          else {
            const query = {
              text: "SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)",
              values: [username],
            };

            client.query(query, (err, result) => {
              if (err) {
                res.render("signup", { errorMessage: "Error with Database." });
              } else {
                const exists = result.rows[0].exists;
                // check if user with username exists
                if (exists) {
                  res.render("signup", { errorMessage: "Username already exists." });
                } else {
                  // create new user
                  const createUserQuery = {
                    text: "INSERT INTO users (username, password, accountType, firstName, lastName) VALUES ($1, $2, $3, $4, $5)",
                    values: [username, password, accountType, firstName, lastName],
                  };

                  client.query(createUserQuery);

                  // create base fitness goals
                  if (accountType === "Member") {
                    const healthMetricsQuery = {
                      text: "INSERT INTO healthMetrics (username) VALUES ($1)",
                      values: [username],
                    };

                    client.query(healthMetricsQuery);
                  }

                  passport.authenticate("local")(req, res, () => {
                    res.redirect("/dashboard");
                  });
                }
              }
            });
          }
        }
      }
    }
  }
});

app.post("/signin", passport.authenticate("local", { successRedirect: "/dashboard", failureRedirect: "/signin", failureFlash: true }));

// HEALTH METRICS
// update weight values
app.post("/editWeight", (req, res) => {
  const currentWeight = req.body.currentWeight;
  const goalWeight = req.body.goalWeight;
  const username = req.body.username;

  const updateQuery = {
    text: "UPDATE healthMetrics SET currentWeight = $1, goalWeight = $2 WHERE username = $3",
    values: [currentWeight, goalWeight, username],
  };

  client.query(updateQuery);

  res.redirect("/dashboard");
});

// update steps values
app.post("/editSteps", (req, res) => {
  const currentSteps = req.body.currentSteps;
  const goalSteps = req.body.goalSteps;
  const username = req.body.username;

  const updateQuery = {
    text: "UPDATE healthMetrics SET currentSteps = $1, goalSteps = $2 WHERE username = $3",
    values: [currentSteps, goalSteps, username],
  };

  client.query(updateQuery);

  res.redirect("/dashboard");
});

// update calories values
app.post("/editCalories", (req, res) => {
  const currentCalories = req.body.currentCalories;
  const goalCalories = req.body.goalCalories;
  const username = req.body.username;

  const updateQuery = {
    text: "UPDATE healthMetrics SET currentCalories = $1, goalCalories = $2 WHERE username = $3",
    values: [currentCalories, goalCalories, username],
  };

  client.query(updateQuery);

  res.redirect("/dashboard");
});

// USER INFORMATION
// update user information
app.post("/updateUserInfo", (req, res, next) => {
  const username = req.body.username;
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1).toLowerCase();
  const lastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1).toLowerCase();

  const nameUpdateQuery = {
    text: "UPDATE users SET firstName = $1, lastName = $2 WHERE username = $3",
    values: [firstName, lastName, username],
  };

  client.query(nameUpdateQuery);

  const passwordCheckQuery = {
    text: "SELECT * FROM users WHERE username = $1",
    values: [username],
  };

  client.query(passwordCheckQuery, (err, result) => {
    if (err) console.log(err);
    if (hashPassword(oldPassword) !== result.rows[0].password) {
      const error = new Error("Old password does not match.");
      error.status = 304;
      res.status(error.status).json({ error: "Old password is incorrect." });
    } else {
      if (req.body.updatePassword) {
        const passwordUpdateQuery = {
          text: "UPDATE users SET password = $1 WHERE username = $2",
          values: [hashPassword(newPassword), username],
        };

        client.query(passwordUpdateQuery);
      }

      res.json({ message: "User Information Updated!" });
    }
  });
});

// FITNESS GOALS
// update goal as asComplete true
app.post("/completeGoal", (req, res) => {
  const goalId = req.body.goalId;

  const addAchievementQuery = {
    text: "UPDATE fitnessGoals SET isComplete = $1 WHERE goalId = $2",
    values: [true, goalId],
  };

  client.query(addAchievementQuery);

  res.redirect("/dashboard");
});

// add goal to fitnessGoals
app.post("/addGoal", (req, res) => {
  const username = req.body.username;
  // makes first characters uppercase
  let goalContent = req.body.goalContent.charAt(0).toUpperCase();
  if (req.body.goalContent.trim().length > 1) goalContent += req.body.goalContent.slice(1).toLowerCase().trimEnd();
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  const addGoalQuery = {
    text: "INSERT INTO fitnessGoals (goalId, username, goalContent, isComplete) VALUES ($1, $2, $3, $4)",
    values: [newUniqueId, username, goalContent, false],
  };

  client.query(addGoalQuery);

  res.redirect("/dashboard");
});

// delete goal from fitnessGoals
app.post("/deleteAchievement", (req, res) => {
  const goalId = req.body.goalId;

  const deleteAchievementQuery = {
    text: "DELETE FROM fitnessGoals WHERE goalId = $1",
    values: [goalId],
  };

  client.query(deleteAchievementQuery);

  res.redirect("/dashboard");
});

// FITNESS ROUTINES
// add routine to fitnessRoutines
app.post("/addRoutine", (req, res) => {
  const username = req.body.username;
  // makes first characters uppercase
  let routineContent = req.body.routineContent.charAt(0).toUpperCase();
  if (req.body.routineContent.trim().length > 1) routineContent += req.body.routineContent.slice(1).toLowerCase().trimEnd();
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  const addRoutineQuery = {
    text: "INSERT INTO fitnessRoutines (routineId, username, routineContent) VALUES ($1, $2, $3)",
    values: [newUniqueId, username, routineContent],
  };

  client.query(addRoutineQuery);

  res.redirect("/dashboard");
});

// delete routine from fitnessRoutines
app.post("/deleteRoutine", (req, res) => {
  const routineId = req.body.routineId;

  const deleteRoutineQuery = {
    text: "DELETE FROM fitnessRoutines WHERE routineId = $1",
    values: [routineId],
  };

  client.query(deleteRoutineQuery);

  res.redirect("/dashboard");
});

// MEMBERS SEARCH
app.post("/searchMember", (req, res) => {
  const firstName = req.body.firstName;

  const getMembersQuery = {
    text: "SELECT * FROM users WHERE firstName = $1 ORDER BY $2 ASC",
    values: [firstName, "firstName"],
  };

  if (firstName.trim().length === 0) {
    getMembersQuery.text = "SELECT * FROM users WHERE accountType = $1 ORDER BY $2 ASC";
    getMembersQuery.values = ["Member", "firstName"];
  }

  client.query(getMembersQuery, (err, result) => {
    if (err) console.log(err);
    res.json(result.rows);
  });
});

// APPOINTMENTS
// create appointment
app.post("/createAppointment", (req, res) => {
  let title = req.body.title.charAt(0).toUpperCase();
  if (req.body.title.trim().length > 1) title += req.body.title.slice(1).toLowerCase().trimEnd();
  const date = req.body.date;
  const startingTime = req.body.startingTime;
  const endingTime = req.body.endingTime;
  const trainer = req.body.username;
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  isAppointmentTimeConflict(startingTime + ":00", endingTime + ":00", date, trainer, "Trainer").then((isConflict) => {
    if (isConflict) {
      const error = new Error("Time conflict.");
      error.status = 305;
      res.status(error.status).json({ error: "Time conflict" });
    } else {
      const createAppointmentQuery = {
        text: "INSERT INTO availableAppointments (appointmentId, appointmentName, trainerUsername, startTime, endTime, date) VALUES ($1, $2, $3, $4, $5, $6)",
        values: [newUniqueId, title, trainer, startingTime, endingTime, date],
      };

      client.query(createAppointmentQuery);

      res.redirect("/appointments");
    }
  });
});

// delete appointment
app.post("/deleteAppointment", (req, res) => {
  const appointmentId = req.body.appointmentId;

  isAvailableAppointment(appointmentId).then((available) => {
    if (available) {
      const deleteAppointmentQuery = {
        text: "DELETE FROM availableAppointments WHERE appointmentId = $1",
        values: [appointmentId],
      };

      client.query(deleteAppointmentQuery);

      res.redirect("/appointments");
    } else {
      const error = new Error("Appointment is already booked");
      error.status = 304;
      res.status(error.status).json({ error: "Appointment is already booked" });
    }
  });
});
app.listen(process.env.PORT || 3000);

// book appointment (move appointment from availableAppointments to bookedAppointments)
app.post("/bookAppointment", (req, res) => {
  const appointmentId = req.body.appointmentId;
  const username = req.body.username;

  isAvailableAppointment(appointmentId).then((available) => {
    const getAppointmentQuery = {
      text: "SELECT * FROM availableAppointments WHERE appointmentId = $1",
      values: [appointmentId],
    };
    client.query(getAppointmentQuery, (err, result) => {
      if (err) console.log(err);
      const appointment = result.rows[0];

      if (available) {
        isAppointmentTimeConflict(appointment.starttime + ":00", appointment.endtime + ":00", appointment.date.toISOString().slice(0, 10), username, "Member").then((isAppointmentConflict) => {
          isClassTimeConflict(appointment.starttime + ":00", appointment.endtime + ":00", appointment.date.toISOString().slice(0, 10), username).then(isClassConflict => {
            if (isAppointmentConflict || isClassConflict) {
              const error = new Error("Time conflict.");
              error.status = 305;
              res.status(error.status).json({ error: "Time conflict" });
            } else {
              const addAppointmentQuery = {
                text: "INSERT INTO bookedAppointments (appointmentId, appointmentName, trainerUsername, memberUsername, startTime, endTime, date) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                values: [appointmentId, appointment.appointmentname, appointment.trainerusername, username, appointment.starttime, appointment.endtime, appointment.date],
              };
  
              client.query(addAppointmentQuery);
  
              const deleteAppointmentQuery = {
                text: "DELETE FROM availableAppointments WHERE appointmentId = $1",
                values: [appointmentId],
              };
  
              client.query(deleteAppointmentQuery);
  
              res.redirect("/appointments");
            }
          });
        });
      } else {
        const error = new Error("Appointment is already booked");
        error.status = 304;
        res.status(error.status).json({ error: "Appointment is already booked" });
      }
    });
  });
});

// cancel appointment (move appointment from bookedAppointments to availableAppointments)
app.post("/cancelAppointment", (req, res) => {
  const appointmentId = req.body.appointmentId;

  const getAppointmentQuery = {
    text: "SELECT * FROM bookedAppointments WHERE appointmentId = $1",
    values: [appointmentId],
  };

  client.query(getAppointmentQuery, (err, result) => {
    if (err) console.log(err);
    const appointment = result.rows[0];

    const addAppointmentQuery = {
      text: "INSERT INTO availableAppointments (appointmentId, appointmentName, trainerUsername, startTime, endTime, date) VALUES ($1, $2, $3, $4, $5, $6)",
      values: [appointment.appointmentid, appointment.appointmentname, appointment.trainerusername, appointment.starttime, appointment.endtime, appointment.date],
    };

    client.query(addAppointmentQuery);
  });

  const deleteAppointmentQuery = {
    text: "DELETE FROM bookedAppointments WHERE appointmentId = $1",
    values: [appointmentId],
  };

  client.query(deleteAppointmentQuery);

  res.redirect("/appointments");
});

// ROOMS
// create room
app.post("/createRoom", (req, res) => {
  const roomName = req.body.roomName.toUpperCase();
  const roomCapacity = req.body.roomCapacity;

  const checkRoomCapacity = {
    text: "SELECT COUNT(*) AS count FROM rooms WHERE roomName = $1",
    values: [roomName],
  };

  client.query(checkRoomCapacity, (err, result) => {
    if (err) console.log(err);

    if (result.rows[0].count !== "0") {
      const error = new Error("Room name in use.");
      error.status = 304;
      res.status(error.status).json({ error: "Room name in use." });
    } else {
      const addRoomQuery = {
        text: "INSERT INTO rooms (roomName, capacity) VALUES ($1, $2)",
        values: [roomName, roomCapacity],
      };

      client.query(addRoomQuery);

      res.redirect("/rooms");
    }
  });
});
// delete room (cascades and deletes room bookings associated with room as well)
app.post("/deleteRoom", (req, res) => {
  const roomName = req.body.roomName;

  const deleteRoomQuery = {
    text: "DELETE FROM rooms WHERE roomName = $1",
    values: [roomName],
  };

  client.query(deleteRoomQuery);

  res.redirect("/rooms");
});

// book room (checks for time conflicts)
app.post("/bookRoom", (req, res) => {
  const trainer = req.body.username;
  const date = req.body.date;
  const startingTime = req.body.startingTime;
  const endingTime = req.body.endingTime;
  const roomName = req.body.roomName;
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  isRoomTimeConflict(startingTime + ":00", endingTime + ":00", date, roomName).then((isConflict) => {
    if (isConflict) {
      const error = new Error("Room time conflict.");
      error.status = 304;
      res.status(error.status).json({ error: "Room time conflict." });
    } else {
      const createRoomBookingQuery = {
        text: "INSERT INTO roomBookings (bookingId, roomName, trainerUsername, startTime, endTime, date) VALUES ($1, $2, $3, $4, $5, $6)",
        values: [newUniqueId, roomName, trainer, startingTime, endingTime, date],
      };

      client.query(createRoomBookingQuery);

      res.redirect("/rooms");
    }
  });
});
// trainer cancel booking (deletes booking)
app.post("/cancelBooking", (req, res) => {
  const bookingId = req.body.bookingId;

  const deleteRoomBooking = {
    text: "DELETE FROM roomBookings WHERE bookingId = $1",
    values: [bookingId],
  };

  client.query(deleteRoomBooking);

  res.redirect("/rooms");
});
// admin delete booking (deletes booking)
app.post("/deleteBooking", (req, res) => {
  const bookingId = req.body.bookingId.substring(1);

  const deleteRoomBooking = {
    text: "DELETE FROM roomBookings WHERE bookingId = $1",
    values: [bookingId],
  };

  client.query(deleteRoomBooking);

  res.redirect("/rooms");
});


// EQUIPMENT
// create equipment
app.post("/createEquipment", (req, res) => {
  let equipmentName = req.body.equipmentName.charAt(0).toUpperCase();
  if (req.body.equipmentName.trim().length > 1) equipmentName += req.body.equipmentName.slice(1).toLowerCase().trimEnd();
  const equipmentQuantity = req.body.equipmentQuantity;
  const maximumDurability = req.body.maximumDurability;
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  const addEquipmentQuery = {
    text: "INSERT INTO equipment (equipmentId, equipmentName, equipmentQuantity, maximumDurability, currentDurability) VALUES ($1, $2, $3, $4, $5)",
    values: [newUniqueId, equipmentName, equipmentQuantity, maximumDurability, maximumDurability]
  }

  client.query(addEquipmentQuery);

  res.redirect("/equipment");
});

// edit durability
app.post("/editEquipmentDurability", (req, res) => {
  const equipmentId = req.body.equipmentId;
  const newDurability = req.body.newDurability;

  if (newDurability == 0){
    const deleteEquipmentQuery = {
      text: "DELETE FROM equipment WHERE equipmentId = $1",
      values: [equipmentId]
    }

    client.query(deleteEquipmentQuery);
  } else {
    const editDurabilityQuery = {
      text: "UPDATE equipment SET currentDurability = $1 WHERE equipmentId = $2",
      values: [newDurability, equipmentId]
    }

    client.query(editDurabilityQuery);
  }
  
  res.redirect("/equipment")
});

// CLASSES
// add class (no time conflict check)
app.post("/createClass", (req, res) => {
  let name = req.body.name.charAt(0).toUpperCase();
  if (req.body.name.trim().length > 1) name += req.body.name.slice(1).toLowerCase().trimEnd();
  const date = req.body.date;
  const startingTime = req.body.startingTime;
  const endingTime = req.body.endingTime;
  const maxCapacity = req.body.maxCapacity;
  const newUniqueId = (new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0]);

  const createClassQuery = {
    text: "INSERT INTO classes (classId, className, maxCapacity, startTime, endTime, date) VALUES ($1, $2, $3, $4, $5, $6)",
    values: [newUniqueId, name, maxCapacity, startingTime, endingTime, date]
  }

  client.query(createClassQuery);

  res.redirect("/classes");
});

// delete a class
app.post("/deleteClass", (req, res) => {
  const classId = req.body.classId;

  const deleteClassQuery = {
    text: "DELETE FROM classes WHERE classId = $1",
    values: [classId]
  }

  client.query(deleteClassQuery);

  res.redirect("/classes");
});

// join a class (checks for time conflict and current class capacity)
app.post("/joinClass", (req, res) => {
  const classId = req.body.classId;
  const username = req.body.username;

  isAvailableClass(classId).then(available => {
    const getClassQuery = {
      text: "SELECT * FROM classes WHERE classId = $1",
      values: [classId]
    }

    client.query(getClassQuery, (err, result) => {
      if (err) console.log(err);
      const foundClass = result.rows[0];

      if (available) {
        isAppointmentTimeConflict(foundClass.starttime + ":00", foundClass.endtime + ":00", foundClass.date.toISOString().slice(0, 10), username, "Member").then((isAppointmentConflict) => {
          isClassTimeConflict(foundClass.starttime + ":00", foundClass.endtime + ":00", foundClass.date.toISOString().slice(0, 10), username).then(isClassConflict => {
            if (isAppointmentConflict || isClassConflict) {
              const error = new Error("Time conflict.");
              error.status = 305;
              res.status(error.status).json({ error: "Time conflict" });
            } else {
              const createClassBookingQuery = {
                text: "INSERT INTO classBookings (classId, memberUsername) VALUES ($1, $2)",
                values: [classId, username]
              }

              client.query(createClassBookingQuery);

              const updateClassCapacityQuery = {
                text: "UPDATE classes SET currentCapacity = $1 WHERE classId = $2",
                values: [foundClass.currentcapacity + 1, classId]
              }

              client.query(updateClassCapacityQuery);

              res.redirect("/classes");
            }
          });
        });
      } else {
        const error = new Error("Class is already full");
        error.status = 304;
        res.status(error.status).json({ error: "Class is already full" });
      }
    });
  })
});
// Deletes class booking for user (also updates classes capacity)
app.post("/leaveClass", (req, res) => {
  const classId = req.body.classId;
  const username = req.body.username;

  const deleteClassBookingQuery = {
    text: "DELETE FROM classBookings WHERE classId = $1 AND memberUsername = $2",
    values: [classId, username]
  }

  client.query(deleteClassBookingQuery);

  const updateClassesQuery = {
    text: "UPDATE classes SET currentCapacity = currentCapacity - 1 WHERE classId = $1",
    values: [classId]
  }

  client.query(updateClassesQuery);

  res.redirect("/classes");
});