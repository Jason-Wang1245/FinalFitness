CREATE TABLE users (
	username VARCHAR(20) PRIMARY KEY,
	password TEXT NOT NULL,
	accountType VARCHAR(10) NOT NULL,
	firstName TEXT NOT NULL,
	lastName TEXT NOT NULL,
	CONSTRAINT checkAccountType CHECK (accountType IN ('Member', 'Trainer', 'Admin'))
);

CREATE TABLE healthMetrics (
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

CREATE TABLE fitnessGoals (
	goalId BIGINT PRIMARY KEY,
	username VARCHAR(20),
	goalContent TEXT NOT NULL,
	isComplete BOOLEAN NOT NULL,
	FOREIGN KEY (username) 
		REFERENCES users(username)
);

CREATE TABLE fitnessRoutines (
	routineId BIGINT PRIMARY KEY,
	username VARCHAR (20),
	routineContent TEXT NOT NULL,
	FOREIGN KEY (username) 
		REFERENCES users(username)
);

CREATE TABLE availableAppointments (
	appointmentId BIGINT PRIMARY KEY,
	appointmentName TEXT NOT NULL,
	trainerUsername VARCHAR (20),
	startTime TIME NOT NULL,
	endTime TIME NOT NULL,
	date DATE NOT NULL,
	FOREIGN KEY (trainerUsername) 
		REFERENCES users(username)
);

CREATE TABLE bookedAppointments (
	appointmentId BIGINT PRIMARY KEY,
	appointmentName TEXT NOT NULL,
	trainerUsername VARCHAR (20),
	memberUsername VARCHAR (20),
	startTime TIME NOT NULL,
	endTime TIME NOT NULL,
	date DATE NOT NULL,
	FOREIGN KEY (trainerUsername) 
		REFERENCES users(username),
	FOREIGN KEY (memberUsername) 
		REFERENCES users(username)
);

DROP TABLE fitnessRoutines

DELETE FROM fitnessGoals;
DELETE FROM users;
