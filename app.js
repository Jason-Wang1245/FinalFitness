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
            }
            // retrieve fitness routines data
            client.query(fitnessRoutinesQuery, (err, result) => {
              if (err) console.log(err);
              data.fitnessRoutines = result.rows;

              return done(null, data);
            });
          });
        });
      } else if (data.accounttype === "Trainer" || accountType === "Admin") {
        const getMembersQuery = {
          text: "SELECT * FROM users WHERE accountType = $1",
          values: ["Member"]
        }

        client.query(getMembersQuery, (err, result) => {
          if (err) console.log(err);
          data.membersList = result.rows;

          return done(null, data);
        })
      } else return done(null, data);
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
        fitnessGoals: req.user.fitnessGoals.filter(tuple => !tuple.iscomplete), 
        fitnessAchievements: req.user.fitnessGoals.filter(tuple => tuple.iscomplete),
        fitnessRoutines: req.user.fitnessRoutines 
      });
    } else {
      res.render("dashboard.ejs", { 
        username: req.user.username, 
        firstName: req.user.firstname, 
        lastName: req.user.lastname, 
        accountType: req.user.accounttype, 
        membersList: req.user.membersList
      });
    }
  } else {
    res.redirect("/signin");
  }
});

app.get("/appointments", (req, res) => {
  if (req.isAuthenticated()){
    res.render("appointments.ejs", {
      username: req.user.username,
      firstName: req.user.firstname, 
      lastName: req.user.lastname, 
      accountType: req.user.accounttype, });
  } else {
    res.redirect("/signin");
  }
})

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

// HEALTH METRICS
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
  const newUniqueId = new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0];
  
  const addGoalQuery = {
    text: "INSERT INTO fitnessGoals (goalId, username, goalContent, isComplete) VALUES ($1, $2, $3, $4)",
    values: [newUniqueId, username, goalContent, false],
  }

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
  const newUniqueId = new Uint32Array(1)[0] = crypto.getRandomValues(new Uint32Array(1))[0];
  
  const addRoutineQuery = {
    text: "INSERT INTO fitnessRoutines (routineId, username, routineContent) VALUES ($1, $2, $3)",
    values: [newUniqueId, username, routineContent],
  }

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
    text: "SELECT * FROM users WHERE firstName = $1",
    values: [firstName]
  }

  if (firstName.trim().length === 0){
    getMembersQuery.text = "SELECT * FROM users WHERE accountType = $1";
    getMembersQuery.values = ["Member"];
  } 

  client.query(getMembersQuery, (err, result) => {
    if (err) console.log(err);
    res.json(result.rows);
  })
})
app.listen(process.env.PORT || 3000);
