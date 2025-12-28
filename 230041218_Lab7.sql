CREATE TABLE Faculty (
    FacultyID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Project (
    ProjectID INT PRIMARY KEY,
    Title VARCHAR(200) NOT NULL,
    StartDate DATE,
    EndDate DATE
);

CREATE TABLE Group (
    GroupID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    LabRoomNumber VARCHAR(20),
    YearlyBudget DECIMAL(15, 2),
    HeadID INT,
    CONSTRAINT FK_Group_Head FOREIGN KEY (HeadID) REFERENCES Faculty(FacultyID),
    CONSTRAINT UQ_Group_Head UNIQUE (HeadID)
);

CREATE TABLE Student (
    StudentID INT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    SupervisorID INT NOT NULL,
    CurrentProjectID INT NOT NULL,
    CONSTRAINT FK_Student_Supervisor FOREIGN KEY (SupervisorID) REFERENCES Faculty(FacultyID),
    CONSTRAINT FK_Student_Project FOREIGN KEY (CurrentProjectID) REFERENCES Project(ProjectID)
);

CREATE TABLE Publication (
    ProjectID INT,
    Title VARCHAR(200),
    ConferenceName VARCHAR(200),
    PublicationDate DATE,
    PRIMARY KEY (ProjectID, Title),
    CONSTRAINT FK_Publication_Project FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID) ON DELETE CASCADE
);

CREATE TABLE Faculty_Group_Member (
    FacultyID INT,
    GroupID INT,
    PRIMARY KEY (FacultyID, GroupID),
    CONSTRAINT FK_FGM_Faculty FOREIGN KEY (FacultyID) REFERENCES Faculty(FacultyID),
    CONSTRAINT FK_FGM_Group FOREIGN KEY (GroupID) REFERENCES ResearchGroup(GroupID)
);

CREATE TABLE Student_Group_Join (
    StudentID INT,
    GroupID INT,
    PRIMARY KEY (StudentID, GroupID),
    CONSTRAINT FK_SGJ_Student FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    CONSTRAINT FK_SGJ_Group FOREIGN KEY (GroupID) REFERENCES ResearchGroup(GroupID)
);

CREATE TABLE Faculty_Project_Collaborate (
    FacultyID INT,
    ProjectID INT,
    PRIMARY KEY (FacultyID, ProjectID),
    CONSTRAINT FK_FPC_Faculty FOREIGN KEY (FacultyID) REFERENCES Faculty(FacultyID),
    CONSTRAINT FK_FPC_Project FOREIGN KEY (ProjectID) REFERENCES Project(ProjectID)
);