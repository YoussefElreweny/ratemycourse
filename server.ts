import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("coursemap.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS faculties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY(university_id) REFERENCES universities(id)
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY(faculty_id) REFERENCES faculties(id)
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    credit_hours INTEGER,
    level INTEGER,
    semester INTEGER,
    category TEXT, -- 'university', 'faculty', 'discipline', 'program'
    FOREIGN KEY(department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS prerequisites (
    course_id INTEGER,
    prerequisite_id INTEGER,
    PRIMARY KEY(course_id, prerequisite_id),
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(prerequisite_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS course_professors (
    course_id INTEGER,
    professor_id INTEGER,
    PRIMARY KEY(course_id, professor_id),
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(professor_id) REFERENCES professors(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    course_id INTEGER,
    professor_id INTEGER,
    difficulty INTEGER,
    workload INTEGER,
    exam_difficulty INTEGER,
    grading_fairness INTEGER,
    attendance_strictness INTEGER,
    recommend BOOLEAN,
    advice TEXT,
    professor_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id),
    FOREIGN KEY(professor_id) REFERENCES professors(id)
  );

  CREATE TABLE IF NOT EXISTS user_courses (
    user_id INTEGER,
    course_id INTEGER,
    status TEXT CHECK(status IN ('completed', 'in_progress', 'planned', 'not_taken')) DEFAULT 'not_taken',
    PRIMARY KEY(user_id, course_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );

  CREATE TABLE IF NOT EXISTS user_layouts (
    user_id INTEGER,
    course_id INTEGER,
    x REAL,
    y REAL,
    semester INTEGER,
    PRIMARY KEY(user_id, course_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(course_id) REFERENCES courses(id)
  );
`);

// Migration: Add role column to users if it doesn't exist
try {
  db.prepare("SELECT role FROM users LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student'");
}

// Migration: Set y.reweny@gmail.com as admin
db.prepare("UPDATE users SET role = 'admin' WHERE email = 'y.reweny@gmail.com'").run();

// Migration: Add semester column to courses if it doesn't exist
try {
  db.prepare("SELECT semester FROM courses LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE courses ADD COLUMN semester INTEGER DEFAULT 1");
}

// Migration: Add category column to courses if it doesn't exist
try {
  db.prepare("SELECT category FROM courses LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE courses ADD COLUMN category TEXT");
}

// Migration: Add semester column to user_layouts if it doesn't exist
try {
  db.prepare("SELECT semester FROM user_layouts LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE user_layouts ADD COLUMN semester INTEGER");
}

// Migration: Add professor_feedback column to reviews if it doesn't exist
try {
  db.prepare("SELECT professor_feedback FROM reviews LIMIT 1").get();
} catch (e) {
  db.exec("ALTER TABLE reviews ADD COLUMN professor_feedback TEXT");
}

// Migration: Populate existing reviews with demo feedback if they have none
db.exec(`
  UPDATE reviews 
  SET professor_feedback = CASE 
    WHEN professor_id % 3 = 0 THEN 'Focuses heavily on practical applications and expects students to participate in class discussions. Exams are fair but require deep understanding.'
    WHEN professor_id % 3 = 1 THEN 'Very organized lectures. Provides excellent study guides for exams. Expect a lot of reading but it is all relevant.'
    ELSE 'Incredible depth of knowledge. Encourages critical thinking and open debate. Grading is based more on effort and insight than rote memorization.'
  END
  WHERE professor_feedback IS NULL AND professor_id IS NOT NULL;
`);

// Seed Data (if empty)
const universityCount = db.prepare("SELECT COUNT(*) as count FROM universities").get() as { count: number };
if (universityCount.count === 0) {
  const insertUni = db.prepare("INSERT INTO universities (name) VALUES (?)");
  const uniId = insertUni.run("Ain Shams University").lastInsertRowid;

  const insertFaculty = db.prepare("INSERT INTO faculties (university_id, name) VALUES (?, ?)");
  const facultyId = insertFaculty.run(uniId, "Faculty of Engineering").lastInsertRowid;

  const insertDept = db.prepare("INSERT INTO departments (faculty_id, name) VALUES (?, ?)");
  const deptId = insertDept.run(facultyId, "Computer and Systems Engineering").lastInsertRowid;

  // Cairo University
  const uniId2 = insertUni.run("Cairo University").lastInsertRowid;
  const facultyId2 = insertFaculty.run(uniId2, "Faculty of Engineering").lastInsertRowid;
  const deptId2 = insertDept.run(facultyId2, "Electronics and Communications").lastInsertRowid;

  const insertCourse = db.prepare("INSERT INTO courses (department_id, code, name, credit_hours, level, semester, category) VALUES (?, ?, ?, ?, ?, ?, ?)");
  
  // Ain Shams Courses (Based on PDF)
  // Level 0
  const c1 = insertCourse.run(deptId, "MDP011", "Engineering Drawing", 3, 0, 1, "faculty").lastInsertRowid;
  const c2 = insertCourse.run(deptId, "PHM021", "Vibration and Waves", 3, 0, 1, "faculty").lastInsertRowid;
  const c3 = insertCourse.run(deptId, "PHM012", "Mathematics (1)", 3, 0, 1, "faculty").lastInsertRowid;
  const c4 = insertCourse.run(deptId, "PHM041", "Engineering Chemistry", 3, 0, 1, "faculty").lastInsertRowid;
  const c5 = insertCourse.run(deptId, "PHM031", "Statics", 3, 0, 1, "faculty").lastInsertRowid;
  const c6 = insertCourse.run(deptId, "CSE031", "Computing in Engineering", 2, 0, 1, "university").lastInsertRowid;
  
  const c1_2 = insertCourse.run(deptId, "CEP011", "Projection and Engineering Graphics", 3, 0, 2, "faculty").lastInsertRowid;
  const c2_2 = insertCourse.run(deptId, "PHM022", "Electricity & Magnetism", 3, 0, 2, "faculty").lastInsertRowid;
  const c3_2 = insertCourse.run(deptId, "PHM013", "Mathematics (2)", 3, 0, 2, "faculty").lastInsertRowid;
  const c4_2 = insertCourse.run(deptId, "ENG011", "Fundamentals of Engineering", 2, 0, 2, "faculty").lastInsertRowid;
  const c5_2 = insertCourse.run(deptId, "PHM032", "Dynamics", 3, 0, 2, "faculty").lastInsertRowid;
  const c6_2 = insertCourse.run(deptId, "MDP081", "Production Engineering", 3, 0, 2, "faculty").lastInsertRowid;

  // Level 1
  const l1_1 = insertCourse.run(deptId, "EPM111", "Electrical Circuits (1)", 4, 1, 1, "discipline").lastInsertRowid;
  const l1_2 = insertCourse.run(deptId, "PHM121", "Modern Physics and Quantum Mechanics", 3, 1, 1, "discipline").lastInsertRowid;
  const l1_3 = insertCourse.run(deptId, "PHM113", "Differential and Partial Differential Equations", 3, 1, 1, "discipline").lastInsertRowid;
  const l1_4 = insertCourse.run(deptId, "PHM111", "Probability and Statistics", 2, 1, 1, "faculty").lastInsertRowid;
  const l1_5 = insertCourse.run(deptId, "CSE111", "Logic Design", 3, 1, 1, "program").lastInsertRowid;
  const l1_6 = insertCourse.run(deptId, "ASU112", "Report Writing and Communication Skills", 3, 1, 1, "university").lastInsertRowid;

  // Level 2
  const c21 = insertCourse.run(deptId, "EPM211", "Properties of Electrical Materials", 2, 2, 1, "discipline").lastInsertRowid;
  const c22 = insertCourse.run(deptId, "ECE211", "Electronics", 3, 2, 1, "discipline").lastInsertRowid;
  const c23 = insertCourse.run(deptId, "ECE251", "Signals and Systems Fundamentals", 4, 2, 1, "discipline").lastInsertRowid;
  const c24 = insertCourse.run(deptId, "CSE271", "System Dynamics and Control Components", 4, 2, 1, "program").lastInsertRowid;
  const c25 = insertCourse.run(deptId, "CSE212", "Computer Organization", 3, 2, 1, "program").lastInsertRowid;
  
  // Level 3
  const c31 = insertCourse.run(deptId, "CSE351", "Computer Networks", 3, 3, 1, "program").lastInsertRowid;
  const c32 = insertCourse.run(deptId, "CSE371", "Control Engineering", 3, 3, 1, "program").lastInsertRowid;
  const c33 = insertCourse.run(deptId, "CSE331", "Data Structures and Algorithms", 3, 3, 1, "program").lastInsertRowid;
  const c34 = insertCourse.run(deptId, "CSE335", "Operating Systems", 3, 3, 1, "program").lastInsertRowid;
  const c35 = insertCourse.run(deptId, "CSE311", "Computer Architecture", 3, 3, 1, "program").lastInsertRowid;

  // Level 4
  const c41 = insertCourse.run(deptId, "CSE472", "Artificial Intelligence", 3, 4, 1, "program").lastInsertRowid;
  const c42 = insertCourse.run(deptId, "CSE411", "Real-Time and Embedded Systems Design", 3, 4, 1, "program").lastInsertRowid;
  const c43 = insertCourse.run(deptId, "CSE491", "Computer Engineering Graduation Project (1)", 3, 4, 1, "program").lastInsertRowid;
  const c44 = insertCourse.run(deptId, "CSE492", "Computer Engineering Graduation Project (2)", 3, 4, 2, "program").lastInsertRowid;

  // Cairo University Courses
  const cc1 = insertCourse.run(deptId2, "ELC101", "Circuit Analysis I", 3, 1, 1, "discipline").lastInsertRowid;
  const cc2 = insertCourse.run(deptId2, "ELC102", "Electronic Components", 3, 1, 2, "discipline").lastInsertRowid;
  const cc3 = insertCourse.run(deptId2, "ELC201", "Signals and Systems", 3, 2, 3, "discipline").lastInsertRowid;
  const cc4 = insertCourse.run(deptId2, "ELC202", "Digital Communications", 3, 2, 4, "discipline").lastInsertRowid;

  // Additional courses for variety
  const c11 = insertCourse.run(deptId, "CSE121", "Digital Logic", 3, 1, 1, "program").lastInsertRowid;
  const c12 = insertCourse.run(deptId, "CSE221", "Microprocessors", 3, 2, 3, "program").lastInsertRowid;
  const c13 = insertCourse.run(deptId, "CSE321", "Control Systems", 3, 3, 5, "program").lastInsertRowid;

  const insertPrereq = db.prepare("INSERT INTO prerequisites (course_id, prerequisite_id) VALUES (?, ?)");
  insertPrereq.run(c2, c1);
  insertPrereq.run(c3, c2);
  insertPrereq.run(c5, c2);
  insertPrereq.run(c33, c1); // DS needs Intro
  insertPrereq.run(c31, c33); // Networks needs DS
  insertPrereq.run(c41, c33); // AI needs DS
  insertPrereq.run(c44, c43); // Grad 2 needs Grad 1
  insertPrereq.run(c12, c11);
  insertPrereq.run(c13, c12);
  
  // Cairo Uni Prereqs
  insertPrereq.run(cc2, cc1);
  insertPrereq.run(cc3, cc1);
  insertPrereq.run(cc4, cc3);

  const insertProf = db.prepare("INSERT INTO professors (name) VALUES (?)");
  const p1 = insertProf.run("Dr. Ahmed Ali").lastInsertRowid;
  const p2 = insertProf.run("Dr. Sarah Hassan").lastInsertRowid;
  const p3 = insertProf.run("Dr. Mohamed Ibrahim").lastInsertRowid;
  const p4 = insertProf.run("Dr. Laila Mahmoud").lastInsertRowid;
  const p5 = insertProf.run("Dr. Khaled Youssef").lastInsertRowid;

  const insertCourseProf = db.prepare("INSERT INTO course_professors (course_id, professor_id) VALUES (?, ?)");
  insertCourseProf.run(c1, p1);
  insertCourseProf.run(c1, p2);
  insertCourseProf.run(c2, p1);
  insertCourseProf.run(c2, p2);
  insertCourseProf.run(c3, p3);
  insertCourseProf.run(c31, p4);
  insertCourseProf.run(c33, p2);
  insertCourseProf.run(c41, p3);
  insertCourseProf.run(c11, p1);
  insertCourseProf.run(c12, p2);
  insertCourseProf.run(c13, p3);
  
  // Cairo Uni Profs
  insertCourseProf.run(cc1, p5);
  insertCourseProf.run(cc2, p5);
  insertCourseProf.run(cc3, p5);
  insertCourseProf.run(cc4, p5);

  const insertUser = db.prepare("INSERT INTO users (email, name, role) VALUES (?, ?, ?)");
  const u1 = insertUser.run("demo@asu.edu.eg", "Demo Student", "student").lastInsertRowid;
  insertUser.run("y.reweny@gmail.com", "Admin User", "admin");

  const insertReview = db.prepare(`
    INSERT INTO reviews (user_id, course_id, professor_id, difficulty, workload, exam_difficulty, grading_fairness, attendance_strictness, recommend, advice, professor_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertReview.run(u1, c1, p1, 2, 3, 2, 5, 4, 1, "Great intro course. Dr. Ahmed is very helpful and explains concepts clearly. Exams are fair if you attend lectures.", "Dr. Ahmed focuses a lot on the fundamental concepts. Make sure to understand the first 3 weeks perfectly as everything builds on them.");
  insertReview.run(u1, c2, p1, 4, 5, 4, 4, 5, 1, "Data structures is tough but rewarding. Be prepared for heavy assignments. Dr. Ahmed expects high quality work.", "He values clean code and well-documented algorithms. Don't just make it work, make it elegant.");
  insertReview.run(u1, c33, p2, 5, 4, 5, 2, 5, 0, "Very difficult exams and strict grading. Hard to get an A even if you study a lot.", "She is very strict about attendance and participation. If you miss more than two lectures, your final grade will suffer significantly.");
  insertReview.run(u1, c41, p3, 5, 5, 5, 3, 5, 1, "AI is tough but essential. Dr. Mohamed is a genius.", "He loves when students ask deep questions about neural networks. The final project is where you can really shine.");
  insertReview.run(u1, c11, p1, 3, 3, 3, 4, 4, 1, "Digital logic is interesting. Dr. Ahmed makes it easy to understand.", "Focus on the K-maps and state machines; they are 60% of the midterm.");
  
  // Cairo Uni Reviews
  insertReview.run(u1, cc1, p5, 4, 4, 4, 3, 5, 1, "Circuit analysis is the foundation. Dr. Khaled is very strict with attendance.", "He uses a lot of real-world examples from the power grid. Pay attention to the lab sessions.");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get("/api/universities", (req, res) => {
    const unis = db.prepare("SELECT * FROM universities").all();
    res.json(unis);
  });

  app.get("/api/faculties/:uniId", (req, res) => {
    const faculties = db.prepare("SELECT * FROM faculties WHERE university_id = ?").all(req.params.uniId);
    res.json(faculties);
  });

  app.get("/api/departments/:facultyId", (req, res) => {
    const depts = db.prepare("SELECT * FROM departments WHERE faculty_id = ?").all(req.params.facultyId);
    res.json(depts);
  });

  app.get("/api/courses/:deptId", (req, res) => {
    const courses = db.prepare(`
      SELECT c.*, d.name as department_name, f.name as faculty_name,
             AVG(r.difficulty) as avg_difficulty,
             AVG(r.recommend) * 100 as recommend_percent,
             COUNT(r.id) as review_count
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      JOIN faculties f ON d.faculty_id = f.id
      LEFT JOIN reviews r ON c.id = r.course_id
      WHERE c.department_id = ?
      GROUP BY c.id
    `).all(req.params.deptId);
    res.json(courses);
  });

  app.get("/api/courses-by-faculty/:facultyId", (req, res) => {
    const courses = db.prepare(`
      SELECT c.*, d.name as department_name, f.name as faculty_name,
             AVG(r.difficulty) as avg_difficulty,
             AVG(r.recommend) * 100 as recommend_percent,
             COUNT(r.id) as review_count
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      JOIN faculties f ON d.faculty_id = f.id
      LEFT JOIN reviews r ON c.id = r.course_id
      WHERE f.id = ?
      GROUP BY c.id
    `).all(req.params.facultyId);
    res.json(courses);
  });

  app.get("/api/course-tree/:deptId", (req, res) => {
    const courses = db.prepare("SELECT * FROM courses WHERE department_id = ?").all(req.params.deptId);
    const prereqs = db.prepare(`
      SELECT p.* FROM prerequisites p 
      JOIN courses c ON p.course_id = c.id 
      WHERE c.department_id = ?
    `).all(req.params.deptId);
    res.json({ courses, prereqs });
  });

  app.get("/api/course/:id", (req, res) => {
    const course = db.prepare(`
      SELECT c.*, d.name as department_name, f.name as faculty_name
      FROM courses c
      JOIN departments d ON c.department_id = d.id
      JOIN faculties f ON d.faculty_id = f.id
      WHERE c.id = ?
    `).get(req.params.id);
    
    const profs = db.prepare(`
      SELECT p.*, 
             AVG(r.difficulty) as avg_difficulty,
             AVG(r.workload) as avg_workload,
             AVG(r.recommend) * 100 as recommend_percent,
             COUNT(r.id) as review_count,
             (SELECT professor_feedback FROM reviews WHERE professor_id = p.id AND course_id = ? AND professor_feedback IS NOT NULL ORDER BY created_at DESC LIMIT 1) as latest_feedback
      FROM professors p
      JOIN course_professors cp ON p.id = cp.professor_id
      LEFT JOIN reviews r ON p.id = r.professor_id AND r.course_id = ?
      WHERE cp.course_id = ?
      GROUP BY p.id
    `).all(req.params.id, req.params.id, req.params.id);
    res.json({ ...course, professors: profs });
  });

  app.get("/api/course/:id/reviews", (req, res) => {
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name, p.name as professor_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN professors p ON r.professor_id = p.id
      WHERE r.course_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);
    res.json(reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const { user_id, course_id, professor_id, difficulty, workload, exam_difficulty, grading_fairness, attendance_strictness, recommend, advice, professor_feedback } = req.body;
    
    // Check if user already reviewed this prof for this course (if prof is provided)
    if (professor_id) {
      const existing = db.prepare("SELECT id FROM reviews WHERE user_id = ? AND course_id = ? AND professor_id = ?").get(user_id, course_id, professor_id);
      if (existing) {
        return res.status(400).json({ error: "You have already reviewed this professor for this course." });
      }
    }

    const insert = db.prepare(`
      INSERT INTO reviews (user_id, course_id, professor_id, difficulty, workload, exam_difficulty, grading_fairness, attendance_strictness, recommend, advice, professor_feedback)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(user_id, course_id, professor_id || null, difficulty, workload, exam_difficulty, grading_fairness, attendance_strictness, recommend ? 1 : 0, advice, professor_feedback || null);
    res.json({ success: true });
  });

  // User State APIs
  app.get("/api/user/:userId/courses", (req, res) => {
    const states = db.prepare("SELECT * FROM user_courses WHERE user_id = ?").all(req.params.userId);
    res.json(states);
  });

  app.post("/api/user/course-status", (req, res) => {
    const { user_id, course_id, status } = req.body;
    const upsert = db.prepare(`
      INSERT INTO user_courses (user_id, course_id, status)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, course_id) DO UPDATE SET status = excluded.status
    `);
    upsert.run(user_id, course_id, status);
    res.json({ success: true });
  });

  app.get("/api/user/:userId/layouts", (req, res) => {
    const layouts = db.prepare("SELECT * FROM user_layouts WHERE user_id = ?").all(req.params.userId);
    res.json(layouts);
  });

  app.post("/api/user/layout", (req, res) => {
    const { user_id, course_id, x, y, semester } = req.body;
    const upsert = db.prepare(`
      INSERT INTO user_layouts (user_id, course_id, x, y, semester)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id, course_id) DO UPDATE SET x = excluded.x, y = excluded.y, semester = excluded.semester
    `);
    upsert.run(user_id, course_id, x, y, semester);
    res.json({ success: true });
  });

  // Mock Auth for demo
  app.post("/api/register", (req, res) => {
    const { email, name } = req.body;
    const role = email === "y.reweny@gmail.com" ? "admin" : "student";
    const insert = db.prepare("INSERT INTO users (email, name, role) VALUES (?, ?, ?)");
    try {
      const result = insert.run(email, name, role);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      res.json(user);
    } catch (e) {
      // If user already exists, just return it (simplified for demo)
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (user) {
        res.json(user);
      } else {
        res.status(500).json({ error: "Registration failed" });
      }
    }
  });

  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      const role = email === "y.reweny@gmail.com" ? "admin" : "student";
      const insert = db.prepare("INSERT INTO users (email, name, role) VALUES (?, ?, ?)");
      const id = insert.run(email, email.split("@")[0], role).lastInsertRowid;
      user = { id, email, name: email.split("@")[0], role };
    }
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
