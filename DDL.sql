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

CREATE TABLE rooms (
	roomName TEXT PRIMARY KEY,
	capacity INT NOT NULL
);

CREATE TABLE roomBookings (
	bookingId BIGINT PRIMARY KEY,
	roomName TEXT,
	trainerUsername VARCHAR(20),
	startTime TIME NOT NULL,
	endTime TIME NOT NULL,
	date DATE NOT NULL,
	FOREIGN KEY (trainerUsername) 
		REFERENCES users(username),
	FOREIGN KEY (roomName)
		REFERENCES rooms(roomName)
		ON DELETE CASCADE
);

CREATE TABLE equipment (
	equipmentId BIGINT PRIMARY KEY,
	equipmentName TEXT NOT NULL,
	equipmentQuantity INT NOT NULL,
	currentDurability INT NOT NULL,
	maximumDurability INT NOT NULL,
	CONSTRAINT check_durability CHECK (currentDurability <= maximumDurability)
);

CREATE TABLE classes (
	classId BIGINT PRIMARY KEY,
	className TEXT NOT NULL,
	currentCapacity INT NOT NULL DEFAULT 0,
	maxCapacity INT NOT NULL,
	startTime TIME NOT NULL,
	endTime TIME NOT NULL,
	date DATE NOT NULL
);

CREATE TABLE classBooking (
	classId BIGINT,
	memberUsername VARCHAR(20),
	FOREIGN KEY (memberUsername) 
		REFERENCES users(username),
	FOREIGN KEY (classId) 
		REFERENCES classes(classId),
	PRIMARY KEY (classId, memberUsername)
);

DROP TABLE bookedAppointments;
DROP TABLE availableAppointments;

DELETE FROM availableAppointments;
DELETE FROM bookedAppointments;
DELETE FROM users;

SELECT startTime, endTime, date FROM bookedAppointments WHERE trainerUsername = 'a'
