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
            if (err) {
                return done(null, false, { message: "Database error." });
            } else {
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
        const dataQuery = {
            text: "SELECT * FROM users WHERE username = $1",
            values: [id]
        }

        client.query(dataQuery, (err, result) => {
            // console.log(result.rows);
            if (err) {
                console.log(err);
            } else {
                return done(null, result.rows[0]);
            }
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
        res.redirect("/signin");
    }
    
});

app.get("/dashboard", (req, res) => {
    if (req.isAuthenticated()){
        res.render("dashboard.ejs", {username: req.user.username, accountType: req.user.accountType});
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
    req.logout();
    res.redirect("/a");
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
                    const createUserQuery = {
                        text: 'INSERT INTO users (username, password, accountType) VALUES ($1, $2, $3)',
                        values: [username, password, accountType]
                    };
                    
                    client.query(createUserQuery);
                    
                    passport.authenticate("local")(req, res, ()=>{
                        res.redirect("/dashboard"); 
                    })
                }
            }
        });
    } 
});

app.post("/signin", passport.authenticate('local', { successRedirect: '/dashboard', failureRedirect: '/signin', failureFlash: true}));

app.listen(process.env.PORT || 3000);