# Fall_Detection

## Remote access

Access https://4464a8012d4d.ngrok-free.app

**Note**: Leasing server resources is expensive and cannot be started at any time. If you cannot access it, please contact xuanmingbi2002@gmail.com by email.

## Local deployment

### Create a database and cache.

#### Install MySQL

**Note**: Please ensure that the MySQL password is: 12345.
Create a database named FallDetection. (The name cannot be changed.)

```sql
CREATE DATABASE FallDetection
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Execute the **create_tables.sql** file in MySQL to create the user table and the fall event table.
Enter the administrator into the user table.

```sql
-- insert admin
INSERT INTO users (username, password)
VALUES ('Ming', '123456');
```

Then ensure that MySQL is started on port 3306.

#### Install Redis

**Note**: Please ensure that no password is set for Redis.
Ensure that Redis is started on port 6379.

### Start the YOLO model

Run the following command to start the fall detection service

```
/backend/app.py 
```

### Start the front-end service

Run the following command to start the front - end service

```
npm run dev 
```

### Start the backend service

Enter the backend project directory

```
cd FallDetection-Backend-master
```

Ensure there is an environment with JDK17.
Run the following command to start the backend service:

```
java -jar target/backend-0.0.1-SNAPSHOT.jar
```
