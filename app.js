const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const crypto = require('crypto');
const passport = require('passport');
const session = require('express-session');
const flash = require("express-flash");
const LocalStrategy = require('passport-local').Strategy;
const { client } = require("./database");

// one-way hashing for passwords
const hashPassword = (password) => {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}
  
const initialize = (passport) => {
    // authenticating user login
    const authenticateUser = (username, password, done) => {
        const userQuery = {
            text: 'SELECT * FROM users WHERE username = $1',
            values: [username]
        };

        client.query(userQuery, (err, result) => {
            if (err) return done(null, false, { message: "Database error." });
            else if (result.rowCount == 0) return done(null, false, { message: "Invalid username or password." });    
            else {
                if (hashPassword(password) === result.rows[0].password) return done(null, result.rows[0]);
                else return done (null, false, { message: "Invalid username or password."} );
            }
        })
    }

    passport.use(
        new LocalStrategy(
            { usernameField: "username", passwordField: "password" },
            authenticateUser
        )
    );

    passport.serializeUser((user, done) => done(null, user.username));
    passport.deserializeUser((id, done) => {
        const userQuery = {
            text: "SELECT * FROM users WHERE username = $1",
            values: [id]
        }

        // retrieve user data
        client.query(userQuery, (err, result) => {
            if (err) console.log(err);
            let data = result.rows[0];
            // if member, retrieve fitness goal data
            if (data.accounttype) {
                const fitnessGoalsQuery = {
                    text: "SELECT * FROM fitnessGoals WHERE username = $1",
                    values: [id]
                }
                // retrieve fitness goal data
                client.query(fitnessGoalsQuery, (err, result) => {
                    if (err) console.log(err);
                    data.fitnessGoals = result.rows[0];

                    return done(null, data);
                })
            } else return done(null, data);    
        });
        
        
    });
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: "comp3005",
    resave: false,
    saveUninitialized: false
}));

initialize(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// client.query(`SELECT * FROM students`, (err, result) => {
//     if (!err){
//         data = res.rows;
//     } else {
//         console.log(err.message);
//     }
// })

app.get("/a", (req, res) => {
    if (req.isAuthenticated()){
        res.send("Hello World");
    } else {
        res.redirect("/signin",);
    }
    
});

app.get("/dashboard", (req, res) => {
    if (req.isAuthenticated()){
        res.render("dashboard.ejs", {username: req.user.username, accountType: req.user.accounttype, fitnessGoals: req.user.fitnessGoals});
    } else {
        res.redirect("/signin");
    }
})

app.get("/signup", (req, res) => {
    res.render("signup.ejs", {errorMessage: ""})
});

app.get("/signin", (req, res) => {
    res.render("signin.ejs");
});

app.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) console.log(err);
        res.redirect("/signin");
    });
})

app.get("/test", passport.authenticate('local', { successRedirect: '/a', failureRedirect: '/signup', failureFlash: true}));

app.post("/signup", (req, res) => {
    const username = req.body.username;
    const password = hashPassword(req.body.password);
    const accountType = req.body.accountType;
    const trainerCode = req.body.trainerCode;

    // check if username length is valid
    if (username.length > 20) res.render("signup", {errorMessage: "Username must be less than 20 characters."});
    if (accountType === "Trainer" && trainerCode != "comp3005") res.render("signup", {errorMessage: "Trainer Creation code is incorrect."});
    else {
        const query = {
            text: 'SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)',
            values: [username]
        };
        
        client.query(query, (err, result) => {
            if (err) {
                res.render("signup", {errorMessage: "Error with Database."})
            } else {
                const exists = result.rows[0].exists;
                 // check if user with username exists
                if (exists) {
                    res.render("signup", {errorMessage: "Username already exists."})
                } else {
                    // create new user
                    const createUserQuery = {
                        text: 'INSERT INTO users (username, password, accountType) VALUES ($1, $2, $3)',
                        values: [username, password, accountType]
                    };
                    
                    client.query(createUserQuery);

                    // create base fitness goals
                    if (accountType === "Member") {
                        const fitnessGoalsQuery = {
                            text: 'INSERT INTO fitnessGoals (username) VALUES ($1)',
                            values: [username]
                        }

                        client.query(fitnessGoalsQuery);
                    }
                    
                    passport.authenticate("local")(req, res, ()=>{
                        res.redirect("/dashboard"); 
                    })
                }
            }
        });
    } 
});

app.post("/signin", passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/signin', failureFlash: true}));

// update weight values
app.post("/editWeight", (req, res) => {
    const currentWeight = req.body.currentWeight;
    const goalWeight = req.body.goalWeight;
    const username = req.body.username;

    const updateQuery = {
        text: 'UPDATE fitnessGoals SET currentWeight = $1, goalWeight = $2 WHERE username = $3',
        values: [currentWeight, goalWeight, username]
    }

    client.query(updateQuery);

    res.redirect("/dashboard");
});

// update steps values
app.post("/editSteps", (req, res) => {
    const currentSteps = req.body.currentSteps;
    const goalSteps = req.body.goalSteps;
    const username = req.body.username;

    const updateQuery = {
        text: 'UPDATE fitnessGoals SET currentSteps = $1, goalSteps = $2 WHERE username = $3',
        values: [currentSteps, goalSteps, username]
    }

    client.query(updateQuery);

    res.redirect("/dashboard");
});

app.post("/editCalories", (req, res) => {
    const currentCalories = req.body.currentCalories;
    const goalCalories = req.body.goalCalories;
    const username = req.body.username;

    const updateQuery = {
        text: 'UPDATE fitnessGoals SET currentCalories = $1, goalCalories = $2 WHERE username = $3',
        values: [currentCalories, goalCalories, username]
    }

    client.query(updateQuery, (err, result) => {
        if (err) {
            console.error('Error updating calories:', err);
            // Handle the error, perhaps by sending an error response
            res.status(500).send('Error updating calories');
        } else {
            // Redirect to the dashboard after successfully updating
            res.redirect("/dashboard");
        }
    });
});

app.listen(process.env.PORT || 3000);