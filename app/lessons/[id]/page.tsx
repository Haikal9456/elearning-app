function QuizQuestion({
  quiz,
  userId,
  onXpEarned,
}: {
  quiz: any;
  userId: string;
  onXpEarned: (xp: number) => void;
}) {
  const supabase = createClient();

  async function recordAttempt(isCorrect: boolean) {
    await supabase
      .from("quiz_attempts")
      .insert({ user_id: userId, quiz_id: quiz.id, is_correct: isCorrect });
    if (isCorrect) onXpEarned(quiz.xp_reward);
  }

  const type = quiz.quiz_type || "multiple_choice";

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white">
      {quiz.image_url && (
        <img
          src={quiz.image_url}
          alt="Quiz question"
          className="w-full rounded-lg mb-3 max-h-64 object-contain"
        />
      )}
      <p className="font-medium mb-3">{quiz.question}</p>

      {type === "multiple_choice" && (
        <MultipleChoice quiz={quiz} onDone={recordAttempt} />
      )}
      {type === "match" && <MatchQuiz quiz={quiz} onDone={recordAttempt} />}
      {type === "spell" && <SpellQuiz quiz={quiz} onDone={recordAttempt} />}
      {type === "sentence" && (
        <SentenceQuiz quiz={quiz} onDone={recordAttempt} />
      )}
      {type === "count" && <CountQuiz quiz={quiz} onDone={recordAttempt} />}
    </div>
  );
}

function MultipleChoice({
  quiz,
  onDone,
}: {
  quiz: any;
  onDone: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    onDone(index === quiz.correct_answer);
  }

  return (
    <div>
      {quiz.options.map((opt: string, i: number) => {
        let style = "border";
        if (answered && i === selected) {
          style =
            i === quiz.correct_answer
              ? "border bg-green-100 border-green-400"
              : "border bg-red-100 border-red-400";
        } else if (answered && i === quiz.correct_answer) {
          style = "border bg-green-50 border-green-300";
        }
        return (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            className={`block w-full text-left p-2 mb-1 rounded ${style}`}
          >
            {opt}
          </button>
        );
      })}
      {answered && (
        <p className="mt-2 font-semibold text-sm">
          {selected === quiz.correct_answer
            ? `✅ Correct! +${quiz.xp_reward} XP`
            : "❌ Not quite"}
        </p>
      )}
    </div>
  );
}

function MatchQuiz({
  quiz,
  onDone,
}: {
  quiz: any;
  onDone: (correct: boolean) => void;
}) {
  const pairs = quiz.quiz_data?.pairs || [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [rightOrder] = useState(() =>
    [...pairs.keys()].sort(() => Math.random() - 0.5),
  );
  const [done, setDone] = useState(false);

  function handleLeftClick(i: number) {
    if (matched.includes(i)) return;
    setSelectedLeft(i);
  }

  function handleRightClick(rightIdx: number) {
    if (selectedLeft === null) return;
    if (rightIdx === selectedLeft) {
      const newMatched = [...matched, selectedLeft];
      setMatched(newMatched);
      setSelectedLeft(null);
      if (newMatched.length === pairs.length && !done) {
        setDone(true);
        onDone(true);
      }
    } else {
      setWrongFlash(rightIdx);
      setTimeout(() => setWrongFlash(null), 500);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        {pairs.map((pair: any, i: number) => (
          <button
            key={i}
            onClick={() => handleLeftClick(i)}
            disabled={matched.includes(i)}
            className={`block w-full p-2 rounded border text-left ${
              matched.includes(i)
                ? "bg-green-100 border-green-400"
                : selectedLeft === i
                  ? "bg-blue-100 border-blue-400"
                  : "border-slate-200"
            }`}
          >
            {pair.left}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {rightOrder.map((originalIdx: number) => {
          const pair = pairs[originalIdx];
          return (
            <button
              key={originalIdx}
              onClick={() => handleRightClick(originalIdx)}
              disabled={matched.includes(originalIdx)}
              className={`block w-full p-2 rounded border ${
                matched.includes(originalIdx)
                  ? "bg-green-100 border-green-400"
                  : wrongFlash === originalIdx
                    ? "bg-red-100 border-red-400"
                    : "border-slate-200"
              }`}
            >
              {pair.right_type === "image" ? (
                <img
                  src={pair.right}
                  alt=""
                  className="h-12 mx-auto object-contain"
                />
              ) : (
                pair.right
              )}
            </button>
          );
        })}
      </div>
      {done && (
        <p className="col-span-2 font-semibold text-sm text-green-700">
          🎉 All matched! +{quiz.xp_reward} XP
        </p>
      )}
    </div>
  );
}

function SpellQuiz({
  quiz,
  onDone,
}: {
  quiz: any;
  onDone: (correct: boolean) => void;
}) {
  const correctWord: string = quiz.quiz_data?.correct_word || "";
  const extra: string = quiz.quiz_data?.extra_letters || "";
  const [tiles] = useState(() =>
    [...correctWord, ...extra].sort(() => Math.random() - 0.5),
  );
  const [used, setUsed] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);

  const currentWord = used.map((i) => tiles[i]).join("");

  function pickLetter(i: number) {
    if (answered || used.includes(i)) return;
    const newUsed = [...used, i];
    setUsed(newUsed);
    if (newUsed.length === correctWord.length) {
      setAnswered(true);
      onDone(newUsed.map((idx) => tiles[idx]).join("") === correctWord);
    }
  }

  function reset() {
    setUsed([]);
    setAnswered(false);
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap min-h-[2.5rem]">
        {Array.from({ length: correctWord.length }).map((_, i) => (
          <span
            key={i}
            className="w-8 h-8 border-b-2 border-slate-300 text-center font-bold text-lg"
          >
            {currentWord[i] || ""}
          </span>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mb-3">
        {tiles.map((letter, i) => (
          <button
            key={i}
            onClick={() => pickLetter(i)}
            disabled={used.includes(i) || answered}
            className={`w-9 h-9 rounded border font-bold uppercase ${
              used.includes(i)
                ? "bg-slate-100 text-slate-300"
                : "bg-white border-slate-300"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
      {answered && (
        <div>
          <p className="font-semibold text-sm mb-2">
            {currentWord === correctWord
              ? `✅ Correct! +${quiz.xp_reward} XP`
              : `❌ Not quite — correct word: ${correctWord}`}
          </p>
          {currentWord !== correctWord && (
            <button onClick={reset} className="text-sm text-blue-600">
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SentenceQuiz({
  quiz,
  onDone,
}: {
  quiz: any;
  onDone: (correct: boolean) => void;
}) {
  const sentence: string = quiz.quiz_data?.sentence || "";
  const wordBank: string[] = quiz.quiz_data?.word_bank || [];
  const correctAnswer: string = quiz.quiz_data?.correct_answer || "";
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const [before, after] = sentence.split("___");

  function pick(word: string) {
    if (answered) return;
    setSelected(word);
    setAnswered(true);
    onDone(word === correctAnswer);
  }

  return (
    <div>
      <p className="mb-3">
        {before}
        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 mx-1">
          {selected || "____"}
        </span>
        {after}
      </p>
      <div className="flex gap-2 flex-wrap">
        {wordBank.map((word, i) => {
          let style = "border-slate-200";
          if (answered && word === selected) {
            style =
              word === correctAnswer
                ? "bg-green-100 border-green-400"
                : "bg-red-100 border-red-400";
          }
          return (
            <button
              key={i}
              onClick={() => pick(word)}
              disabled={answered}
              className={`px-3 py-1.5 rounded border ${style}`}
            >
              {word}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-2 font-semibold text-sm">
          {selected === correctAnswer
            ? `✅ Correct! +${quiz.xp_reward} XP`
            : `❌ Correct answer: ${correctAnswer}`}
        </p>
      )}
    </div>
  );
}

function CountQuiz({
  quiz,
  onDone,
}: {
  quiz: any;
  onDone: (correct: boolean) => void;
}) {
  const { item_name, correct_count, min, max } = quiz.quiz_data || {};
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  function pick(n: number) {
    if (answered) return;
    setSelected(n);
    setAnswered(true);
    onDone(n === correct_count);
  }

  const numbers = [];
  for (let i = min; i <= max; i++) numbers.push(i);

  return (
    <div>
      <p className="text-sm text-slate-500 mb-2">How many {item_name}?</p>
      <div className="flex gap-2 flex-wrap">
        {numbers.map((n) => {
          let style = "border-slate-200";
          if (answered && n === selected) {
            style =
              n === correct_count
                ? "bg-green-100 border-green-400"
                : "bg-red-100 border-red-400";
          } else if (answered && n === correct_count) {
            style = "bg-green-50 border-green-300";
          }
          return (
            <button
              key={n}
              onClick={() => pick(n)}
              disabled={answered}
              className={`w-10 h-10 rounded border font-bold ${style}`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className="mt-2 font-semibold text-sm">
          {selected === correct_count
            ? `✅ Correct! +${quiz.xp_reward} XP`
            : `❌ The answer was ${correct_count}`}
        </p>
      )}
    </div>
  );
}
