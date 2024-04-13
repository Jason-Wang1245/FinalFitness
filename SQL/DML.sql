INSERT INTO users (username, password, accountType, firstName, lastName) 
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Admin', 'Admin', 'User'),
('trainer1', '167ec7e469d6e543b4180fdbe60ddacf81563fb178f908896e46a5e86633c702', 'Trainer', 'Trainer', 'One'),
('trainer2', '16378a428f831c77c6c49def99620f0f17f4ba693df2826ee8fbd6c6d451e4b7', 'Trainer', 'Trainer', 'Two'),
('member1', '44d2f618b28451c78921b81dc70fe3ff128e933a4499a95c0682bb89cc57c5c6', 'Member', 'Member', 'One'),
('member2', 'd187c4c3e2ccf3fb023e58402e4bf93cf34dd534a1cb0d74dff7984a8f4eb6be', 'Member', 'Member', 'Two');

INSERT INTO healthMetrics (username, currentWeight, goalWeight, currentSteps, goalSteps, currentCalories, goalCalories) 
VALUES ('member1', 180, 150, 0, 10000, 0, 1000),
('member2', 180, 150, 0, 10000, 0, 1000);

INSERT INTO fitnessRoutines (routineId, username, routineContent) 
VALUES (0, 'member1', '100 push-ups'),
(1, 'member1', '100 curl-ups'),
(2, 'member1', '100 squats'),
(3, 'member1', '10km run');

INSERT INTO appointments (appointmentId, appointmentName, trainerUsername, startTime, endTime, date) 
VALUES (0, 'Private Training session', 'trainer1', '9:00', '10:00', '2024-04-15'),
(1, 'Cardio session', 'trainer1', '10:00', '11:00', '2024-04-15'),
(2, 'Weight lifting session', 'trainer2', '10:00', '11:00', '2024-04-15'),
(3, 'Core training session', 'trainer2', '11:00', '12:00', '2024-04-15'),
(4, 'Payment overdue session', 'trainer1', '11:00', '12:00', '2024-04-10');

INSERT INTO bookedAppointments (appointmentId, memberUsername)
VALUES (0, 'member1'),
(1, 'member1'),
(4, 'member1'),
(3, 'member2');

INSERT INTO rooms (roomName, capacity)
VALUES ('HERZBERG', 10),
('SOUTHAM', 100),
('LIBRARY', 2);

INSERT INTO roomBookings (bookingId, roomName, trainerUsername, startTime, endTime, date)
VALUES (0, 'LIBRARY', 'trainer1', '10:00', '11:00', '2024-04-15'),
(1, 'HERZBERG', 'trainer2', '10:00', '11:00', '2024-04-15');

INSERT INTO equipment (equipmentId, equipmentName, equipmentQuantity, currentDurability, maximumDurability)
VALUES (0, 'Dumbells', 10, 100, 1000),
(1, 'Barbells', 10, 1000, 1000),
(2, 'Jumping ropes', 100, 10, 10);

INSERT INTO classes (classId, className, currentCapacity, maxCapacity, startTime, endTime, date)
VALUES (0, 'Full class', 10, 10, '10:00', '11:00', '2024-04-15'),
(1, 'One last spot class', 9, 10, '10:00', '11:00', '2024-04-15'),
(2, 'COMP3005', 50, 100, '10:00', '11:30', '2024-04-16'),
(4, 'Old class', 1, 1, '10:00', '11:30', '2024-04-10');

INSERT INTO classBookings(classId, memberUsername)
VALUES (0, 'member1'),
(4, 'member1');
