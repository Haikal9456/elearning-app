"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AdminPage() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  const [lessonCourseId, setLessonCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [lessonXp, setLessonXp] = useState(10);
  const [filterLessonId, setFilterLessonId] = useState("");

  const [quizLessonId, setQuizLessonId] = useState("");
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", ""]);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [quizXp, setQuizXp] = useState(5);
  const [quizImageFile, setQuizImageFile] = useState<File | null>(null);
  const [quizImageUrl, setQuizImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizType, setQuizType] = useState("multiple_choice");

  // Match
  const [matchPairs, setMatchPairs] = useState([
    {
      left: "",
      rightType: "text",
      rightText: "",
      rightImageFile: null as File | null,
      rightImageUrl: "",
    },
  ]);

  // Spell
  const [spellWord, setSpellWord] = useState("");
  const [spellExtraLetters, setSpellExtraLetters] = useState("");

  // Sentence
  const [sentenceText, setSentenceText] = useState("");
  const [sentenceWordBank, setSentenceWordBank] = useState("");
  const [sentenceCorrectAnswer, setSentenceCorrectAnswer] = useState("");

  // Count
  const [countItemName, setCountItemName] = useState("");
  const [countCorrect, setCountCorrect] = useState(1);
  const [countMin, setCountMin] = useState(1);
  const [countMax, setCountMax] = useState(10);

  const [newStudentUsername, setNewStudentUsername] = useState("");
  const [newStudentPassword, setNewStudentPassword] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [staffUsername, setStaffUsername] = useState("");
  const [staffRole, setStaffRole] = useState("instructor");

  const router = useRouter();
  const supabase = createClient();

  const staffRoles = ["admin", "coordinator", "instructor"];
  const canManageStudents = role === "admin" || role === "coordinator";
  const isAdmin = role === "admin";

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !staffRoles.includes(profile.role)) {
        router.push("/dashboard");
        return;
      }

      setRole(profile.role);
      await loadData();
      setLoading(false);
    }
    check();
  }, []);

  async function loadData() {
    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .order("title");
    const { data: lessonsData } = await supabase
      .from("lessons")
      .select("*")
      .order("order_index");
    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

    setCourses(coursesData || []);
    setLessons(lessonsData || []);
    setQuizzes(quizzesData || []);
  }

  async function addCourse() {
    if (!courseTitle.trim()) return alert("Title is required");
    const { error } = await supabase
      .from("courses")
      .insert({ title: courseTitle, description: courseDesc });
    if (error) return alert("Error: " + error.message);
    setCourseTitle("");
    setCourseDesc("");
    await loadData();
    alert("Course added!");
  }

  async function addLesson() {
    if (!lessonCourseId || !lessonTitle.trim())
      return alert("Course and title are required");
    const { error } = await supabase.from("lessons").insert({
      course_id: lessonCourseId,
      title: lessonTitle,
      content: lessonContent,
      order_index: lessonOrder,
      xp_reward: lessonXp,
    });
    if (error) return alert("Error: " + error.message);
    setLessonTitle("");
    setLessonContent("");
    setLessonOrder(1);
    await loadData();
    alert("Lesson added!");
  }

  async function addQuiz() {
    if (!quizLessonId) return alert("Select a lesson");
    if (!quizQuestion.trim())
      return alert("Question/instruction text is required");

    let quizData: any = null;
    let options: string[] | null = null;
    let correctAnswer: number | null = null;
    const imageUrl = await uploadQuizImage();

    if (quizType === "multiple_choice") {
      const filledOptions = quizOptions.filter((o) => o.trim() !== "");
      if (filledOptions.length < 2) return alert("Add at least 2 options");
      options = filledOptions;
      correctAnswer = quizCorrect;
    }

    if (quizType === "match") {
      const pairs = [];
      for (const pair of matchPairs) {
        if (!pair.left.trim()) continue;
        let right = pair.rightText;
        if (pair.rightType === "image") {
          if (pair.rightImageFile) {
            const url = await uploadImageFile(pair.rightImageFile);
            if (!url) return;
            right = url;
          } else {
            right = pair.rightImageUrl;
          }
        }
        if (!right.trim()) continue;
        pairs.push({ left: pair.left, right, right_type: pair.rightType });
      }
      if (pairs.length < 2) return alert("Add at least 2 complete pairs");
      quizData = { pairs };
    }

    if (quizType === "spell") {
      if (!spellWord.trim()) return alert("Enter the word to spell");
      quizData = {
        correct_word: spellWord.trim().toLowerCase(),
        extra_letters: spellExtraLetters.trim().toLowerCase(),
      };
    }

    if (quizType === "sentence") {
      if (!sentenceText.includes("___"))
        return alert("Sentence must contain ___ to mark the blank");
      const wordBank = sentenceWordBank
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);
      if (wordBank.length < 2)
        return alert("Add at least 2 words in the word bank (comma separated)");
      if (!sentenceCorrectAnswer.trim()) return alert("Set the correct answer");
      quizData = {
        sentence: sentenceText,
        word_bank: wordBank,
        correct_answer: sentenceCorrectAnswer.trim(),
      };
    }

    if (quizType === "count") {
      if (!countItemName.trim())
        return alert('Enter what the student is counting (e.g. "apples")');
      quizData = {
        item_name: countItemName,
        correct_count: countCorrect,
        min: countMin,
        max: countMax,
      };
    }

    const { error } = await supabase.from("quizzes").insert({
      lesson_id: quizLessonId,
      question: quizQuestion,
      quiz_type: quizType,
      quiz_data: quizData,
      options,
      correct_answer: correctAnswer,
      xp_reward: quizXp,
      image_url: imageUrl,
    });

    if (error) return alert("Error: " + error.message);

    // Reset all form fields
    setQuizQuestion("");
    setQuizOptions(["", "", ""]);
    setQuizImageFile(null);
    setQuizImageUrl("");
    setMatchPairs([
      {
        left: "",
        rightType: "text",
        rightText: "",
        rightImageFile: null,
        rightImageUrl: "",
      },
    ]);
    setSpellWord("");
    setSpellExtraLetters("");
    setSentenceText("");
    setSentenceWordBank("");
    setSentenceCorrectAnswer("");
    setCountItemName("");
    setCountCorrect(1);
    alert("Quiz question added!");
  }

  async function deleteCourse(id: string) {
    if (!confirm("Delete this course and all its lessons?")) return;
    await supabase.from("courses").delete().eq("id", id);
    await loadData();
  }

  async function deleteLesson(id: string) {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", id);
    await loadData();
  }

  async function deleteQuiz(id: string) {
    if (!confirm("Delete this quiz question?")) return;
    await supabase.from("quizzes").delete().eq("id", id);
    await loadData();
  }

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 8; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    setNewStudentPassword(pass);
  }

  async function createStudentAccount() {
    if (!newStudentUsername.trim() || !newStudentPassword.trim()) {
      return alert("Username and password required");
    }
    const res = await fetch("/api/admin/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: newStudentUsername,
        password: newStudentPassword,
        requestedBy: userId,
      }),
    });
    const result = await res.json();
    if (!res.ok) return alert("Error: " + result.error);
    setCreatedCredentials({
      username: result.username,
      password: result.password,
    });
    setNewStudentUsername("");
    setNewStudentPassword("");
  }

  async function uploadQuizImage(): Promise<string | null> {
    if (!quizImageFile) return quizImageUrl.trim() || null;

    setUploadingImage(true);
    const fileExt = quizImageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("quiz-images")
      .upload(fileName, quizImageFile);

    setUploadingImage(false);

    if (uploadError) {
      alert("Image upload failed: " + uploadError.message);
      return null;
    }

    const { data } = supabase.storage
      .from("quiz-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function uploadImageFile(file: File): Promise<string | null> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const { error } = await supabase.storage
      .from("quiz-images")
      .upload(fileName, file);
    if (error) {
      alert("Image upload failed: " + error.message);
      return null;
    }
    const { data } = supabase.storage
      .from("quiz-images")
      .getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function assignStaffRole() {
    if (!staffUsername.trim()) return alert("Username required");
    const res = await fetch("/api/admin/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUsername: staffUsername,
        newRole: staffRole,
        requestedBy: userId,
      }),
    });
    const result = await res.json();
    if (!res.ok) return alert("Error: " + result.error);
    alert(`${staffUsername} is now ${staffRole}`);
    setStaffUsername("");
  }

  if (loading)
    return (
      <div className="text-center mt-20 text-slate-500">Checking access...</div>
    );
  if (!role) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-700">
          🛠️ Admin Panel{" "}
          <span className="text-sm font-normal text-slate-400">({role})</span>
        </h1>
        <a href="/dashboard" className="text-sm" style={{ color: "#5B8DEF" }}>
          ← Back to Dashboard
        </a>
      </div>

      {/* Manage Staff — admin only */}
      {isAdmin && (
        <section className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200">
          <h2 className="font-bold text-slate-700 mb-3">
            👑 Manage Staff Roles
          </h2>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full mb-2"
            placeholder="Username"
            value={staffUsername}
            onChange={(e) => setStaffUsername(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-lg p-2 w-full mb-3"
            value={staffRole}
            onChange={(e) => setStaffRole(e.target.value)}
          >
            <option value="instructor">Instructor</option>
            <option value="coordinator">Coordinator</option>
            <option value="admin">Admin</option>
            <option value="student">Student</option>
          </select>
          <button
            onClick={assignStaffRole}
            className="text-white px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: "#5B8DEF" }}
          >
            Set Role
          </button>
        </section>
      )}

      {/* Create Student Account — admin + coordinator */}
      {canManageStudents && (
        <section className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200">
          <h2 className="font-bold text-slate-700 mb-3">
            👶 Create Student Account
          </h2>
          <input
            className="border border-slate-200 rounded-lg p-2 w-full mb-2"
            placeholder="Student username"
            value={newStudentUsername}
            onChange={(e) => setNewStudentUsername(e.target.value)}
          />
          <div className="flex gap-2 mb-2">
            <input
              className="border border-slate-200 rounded-lg p-2 flex-1"
              placeholder="Password"
              value={newStudentPassword}
              onChange={(e) => setNewStudentPassword(e.target.value)}
            />
            <button
              onClick={generatePassword}
              className="bg-slate-100 px-3 rounded-lg text-sm text-slate-600"
            >
              Generate
            </button>
          </div>
          <button
            onClick={createStudentAccount}
            className="text-white px-4 py-2 rounded-lg font-medium"
            style={{ backgroundColor: "#7FB77E" }}
          >
            Create Account
          </button>
          {createdCredentials && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-sm mb-1 text-slate-700">
                ✅ Write these down for the student:
              </p>
              <p className="text-sm text-slate-600">
                Username: <strong>{createdCredentials.username}</strong>
              </p>
              <p className="text-sm text-slate-600">
                Password: <strong>{createdCredentials.password}</strong>
              </p>
            </div>
          )}
        </section>
      )}

      {/* Add Course — all staff */}
      <section className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200">
        <h2 className="font-bold text-slate-700 mb-3">Add a Course</h2>
        <input
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          placeholder="Course title"
          value={courseTitle}
          onChange={(e) => setCourseTitle(e.target.value)}
        />
        <textarea
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          placeholder="Description"
          value={courseDesc}
          onChange={(e) => setCourseDesc(e.target.value)}
        />
        <button
          onClick={addCourse}
          className="text-white px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: "#5B8DEF" }}
        >
          Add Course
        </button>
      </section>

      {/* Add Lesson */}
      <section className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200">
        <h2 className="font-bold text-slate-700 mb-3">Add a Lesson</h2>
        <select
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          value={lessonCourseId}
          onChange={(e) => setLessonCourseId(e.target.value)}
        >
          <option value="">-- Select course --</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <input
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          placeholder="Lesson title"
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
        />
        <textarea
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          placeholder="Lesson content"
          value={lessonContent}
          onChange={(e) => setLessonContent(e.target.value)}
          rows={4}
        />
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <div className="w-full sm:w-1/2">
            <label className="text-xs text-slate-500 mb-1 block">
              Lesson order (1, 2, 3...)
            </label>
            <input
              type="number"
              className="border border-slate-200 rounded-lg p-2 w-full"
              value={lessonOrder}
              onChange={(e) => setLessonOrder(Number(e.target.value))}
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label className="text-xs text-slate-500 mb-1 block">
              XP reward for completing
            </label>
            <input
              type="number"
              className="border border-slate-200 rounded-lg p-2 w-full"
              value={lessonXp}
              onChange={(e) => setLessonXp(Number(e.target.value))}
            />
          </div>
        </div>
        <button
          onClick={addLesson}
          className="text-white px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: "#5B8DEF" }}
        >
          Add Lesson
        </button>
      </section>

      {/* Add Quiz */}
      <section className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200">
        <h2 className="font-bold text-slate-700 mb-3">Add a Quiz Question</h2>

        <select
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          value={quizLessonId}
          onChange={(e) => setQuizLessonId(e.target.value)}
        >
          <option value="">-- Select lesson --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>

        <label className="text-xs text-slate-500 mb-1 block">Quiz type</label>
        <select
          className="border border-slate-200 rounded-lg p-2 w-full mb-3"
          value={quizType}
          onChange={(e) => setQuizType(e.target.value)}
        >
          <option value="multiple_choice">Multiple Choice</option>
          <option value="match">Match (word-word or image-word)</option>
          <option value="spell">Spell the word</option>
          <option value="sentence">Complete the sentence</option>
          <option value="count">Pick a number (counting)</option>
        </select>

        <input
          className="border border-slate-200 rounded-lg p-2 w-full mb-2"
          placeholder={
            quizType === "multiple_choice"
              ? "Question"
              : 'Instruction (e.g. "Match the animals!")'
          }
          value={quizQuestion}
          onChange={(e) => setQuizQuestion(e.target.value)}
        />

        {/* Shared image upload (used directly for multiple_choice/count, optional for others) */}
        <div className="mb-3">
          <label className="text-xs text-slate-500 mb-1 block">
            Image (optional, required for "count" type)
          </label>
          <input
            type="file"
            accept="image/*"
            className="border border-slate-200 rounded-lg p-2 w-full mb-2 text-sm"
            onChange={(e) => setQuizImageFile(e.target.files?.[0] || null)}
          />
          <input
            className="border border-slate-200 rounded-lg p-2 w-full"
            placeholder="— or paste an image URL —"
            value={quizImageUrl}
            onChange={(e) => setQuizImageUrl(e.target.value)}
            disabled={!!quizImageFile}
          />
        </div>

        {/* Multiple Choice fields */}
        {quizType === "multiple_choice" && (
          <>
            {quizOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="radio"
                  name="correct"
                  checked={quizCorrect === i}
                  onChange={() => setQuizCorrect(i)}
                />
                <input
                  className="border border-slate-200 rounded-lg p-2 flex-1"
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...quizOptions];
                    newOpts[i] = e.target.value;
                    setQuizOptions(newOpts);
                  }}
                />
              </div>
            ))}
            <p className="text-xs text-slate-400 mb-2">
              Select the radio button next to the correct answer.
            </p>
          </>
        )}

        {/* Match fields */}
        {quizType === "match" && (
          <div className="mb-3 space-y-3">
            {matchPairs.map((pair, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    className="border border-slate-200 rounded-lg p-2 flex-1"
                    placeholder="Left (e.g. 'Cat')"
                    value={pair.left}
                    onChange={(e) => {
                      const newPairs = [...matchPairs];
                      newPairs[i].left = e.target.value;
                      setMatchPairs(newPairs);
                    }}
                  />
                  <select
                    className="border border-slate-200 rounded-lg p-2"
                    value={pair.rightType}
                    onChange={(e) => {
                      const newPairs = [...matchPairs];
                      newPairs[i].rightType = e.target.value;
                      setMatchPairs(newPairs);
                    }}
                  >
                    <option value="text">Word</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                {pair.rightType === "text" ? (
                  <input
                    className="border border-slate-200 rounded-lg p-2 w-full"
                    placeholder="Right (e.g. 'Meow')"
                    value={pair.rightText}
                    onChange={(e) => {
                      const newPairs = [...matchPairs];
                      newPairs[i].rightText = e.target.value;
                      setMatchPairs(newPairs);
                    }}
                  />
                ) : (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      className="border border-slate-200 rounded-lg p-2 w-full mb-2 text-sm"
                      onChange={(e) => {
                        const newPairs = [...matchPairs];
                        newPairs[i].rightImageFile =
                          e.target.files?.[0] || null;
                        setMatchPairs(newPairs);
                      }}
                    />
                    <input
                      className="border border-slate-200 rounded-lg p-2 w-full"
                      placeholder="— or image URL —"
                      value={pair.rightImageUrl}
                      onChange={(e) => {
                        const newPairs = [...matchPairs];
                        newPairs[i].rightImageUrl = e.target.value;
                        setMatchPairs(newPairs);
                      }}
                    />
                  </>
                )}
              </div>
            ))}
            <button
              onClick={() =>
                setMatchPairs([
                  ...matchPairs,
                  {
                    left: "",
                    rightType: "text",
                    rightText: "",
                    rightImageFile: null,
                    rightImageUrl: "",
                  },
                ])
              }
              className="text-sm text-blue-600"
            >
              + Add another pair
            </button>
          </div>
        )}

        {/* Spell fields */}
        {quizType === "spell" && (
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">
              Word to spell
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full mb-2"
              placeholder="e.g. apple"
              value={spellWord}
              onChange={(e) => setSpellWord(e.target.value)}
            />
            <label className="text-xs text-slate-500 mb-1 block">
              Extra decoy letters (optional)
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full"
              placeholder="e.g. xz"
              value={spellExtraLetters}
              onChange={(e) => setSpellExtraLetters(e.target.value)}
            />
          </div>
        )}

        {/* Sentence fields */}
        {quizType === "sentence" && (
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">
              Sentence (use ___ for the blank)
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full mb-2"
              placeholder="I am going to the ___ today."
              value={sentenceText}
              onChange={(e) => setSentenceText(e.target.value)}
            />
            <label className="text-xs text-slate-500 mb-1 block">
              Word bank (comma separated)
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full mb-2"
              placeholder="store, school, park"
              value={sentenceWordBank}
              onChange={(e) => setSentenceWordBank(e.target.value)}
            />
            <label className="text-xs text-slate-500 mb-1 block">
              Correct answer
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full"
              placeholder="store"
              value={sentenceCorrectAnswer}
              onChange={(e) => setSentenceCorrectAnswer(e.target.value)}
            />
          </div>
        )}

        {/* Count fields */}
        {quizType === "count" && (
          <div className="mb-3">
            <label className="text-xs text-slate-500 mb-1 block">
              What are they counting?
            </label>
            <input
              className="border border-slate-200 rounded-lg p-2 w-full mb-2"
              placeholder="e.g. apples"
              value={countItemName}
              onChange={(e) => setCountItemName(e.target.value)}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">
                  Correct count
                </label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-lg p-2 w-full"
                  value={countCorrect}
                  onChange={(e) => setCountCorrect(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">
                  Min option
                </label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-lg p-2 w-full"
                  value={countMin}
                  onChange={(e) => setCountMin(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">
                  Max option
                </label>
                <input
                  type="number"
                  className="border border-slate-200 rounded-lg p-2 w-full"
                  value={countMax}
                  onChange={(e) => setCountMax(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mb-2">
          <label className="text-xs text-slate-500 mb-1 block">
            XP reward for correct answer
          </label>
          <input
            type="number"
            className="border border-slate-200 rounded-lg p-2 w-full"
            value={quizXp}
            onChange={(e) => setQuizXp(Number(e.target.value))}
          />
        </div>

        <button
          onClick={addQuiz}
          className="text-white px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: "#5B8DEF" }}
        >
          Add Quiz Question
        </button>
      </section>

      {/* Existing Courses */}
      <section>
        <h2 className="font-bold text-slate-700 mb-3">Existing Courses</h2>
        <div className="space-y-2">
          {courses.map((c) => (
            <div
              key={c.id}
              className="rounded-xl p-3 bg-white border border-slate-200 flex justify-between items-center"
            >
              <span className="text-slate-700">{c.title}</span>
              <button
                onClick={() => deleteCourse(c.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Existing Lessons */}
      <section>
        <h2 className="font-bold text-slate-700 mb-3">Existing Lessons</h2>
        <div className="space-y-2">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="rounded-xl p-3 bg-white border border-slate-200 flex justify-between items-center"
            >
              <span className="text-slate-700">{l.title}</span>
              <button
                onClick={() => deleteLesson(l.id)}
                className="text-red-500 text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Existing Quiz Questions */}
      <section>
        <h2 className="font-bold text-slate-700 mb-3">
          Existing Quiz Questions
        </h2>

        <select
          className="border border-slate-200 rounded-lg p-2 w-full mb-3"
          value={filterLessonId}
          onChange={(e) => setFilterLessonId(e.target.value)}
        >
          <option value="">-- Select a lesson to view its quizzes --</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>

        {!filterLessonId ? (
          <p className="text-slate-400 text-sm">
            Pick a lesson above to see its quiz questions.
          </p>
        ) : (
          <div className="space-y-2">
            {quizzes.filter((q) => q.lesson_id === filterLessonId).length ===
            0 ? (
              <p className="text-slate-400 text-sm">
                No quiz questions for this lesson yet.
              </p>
            ) : (
              quizzes
                .filter((q) => q.lesson_id === filterLessonId)
                .map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl p-3 bg-white border border-slate-200 flex justify-between items-start gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-slate-700 truncate">{q.question}</p>
                      {q.image_url && (
                        <span className="text-xs text-blue-500">
                          📷 has image
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteQuiz(q.id)}
                      className="text-red-500 text-sm shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}
