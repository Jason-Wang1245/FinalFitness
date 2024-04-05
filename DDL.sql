CREATE TABLE users (
	username VARCHAR(20) PRIMARY KEY,
	password TEXT NOT NULL,
	accountType VARCHAR(10) NOT NULL,
	CONSTRAINT checkAccountType CHECK (accountType IN ('Member', 'Trainer', 'Admin'))
);

SELECT EXISTS (SELECT 1 FROM members WHERE username = 'john_doe');

CREATE TABLE fitnessGoals (
	username VARCHAR(20) PRIMARY KEY,
	currentWeight NUMERIC(5, 2) NOT NULL DEFAULT 180.00,
	goalWeight NUMERIC(5, 2) NOT NULL DEFAULT 150.00,
	currentSteps INT NOT NULL DEFAULT 0,
	goalSteps INT NOT NULL DEFAULT 10000,
	currentCalories NUMERIC(6, 1) NOT NULL DEFAULT 0,
	goalCalories NUMERIC(6,1) NOT NULL DEFAULT 1000,
	FOREIGN KEY (username) 
		REFERENCES users(username)
);

DELETE FROM users;
DELETE FROM fitnessGoals;