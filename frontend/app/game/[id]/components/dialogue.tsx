"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// Questions data: each has question text, options, correct answer index, and difficulty
const QUESTIONS = [
  {
    question: "In a product-led sales setup, who is primarily accountable for the sales pipeline?",
    options: ["Marketing team", "Sales team", "Product team", "Customer support"],
    correctIndex: 2,
    difficulty: "EASY",
  },
  {
    question: "What is the main benefit of product-led growth?",
    options: ["Higher marketing spend", "Lower customer acquisition cost", "More sales reps needed", "Longer sales cycles"],
    correctIndex: 1,
    difficulty: "MEDIUM",
  },
  {
    question: "Which metric is most important for measuring product-led success?",
    options: ["Number of sales calls", "Time to value", "Email open rates", "Office locations"],
    correctIndex: 1,
    difficulty: "HARD",
  },
];

// Damage dealt to NPC based on difficulty (correct answer)
const DIFFICULTY_DAMAGE: Record<string, number> = {
  EASY: 20,
  MEDIUM: 30,
  HARD: 50,
};

// Damage dealt to player on wrong answer
const WRONG_ANSWER_DAMAGE = 10;

const MAX_HP = 100;

interface DialoguePageProps {
  gameId: string;
  npcName: string;
  npcSpriteCol: number;
  npcSpriteRow: number;
}

export default function DialoguePage({ gameId, npcName, npcSpriteCol, npcSpriteRow }: DialoguePageProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [npcHP, setNpcHP] = useState(MAX_HP);

  // Player sprite position (back view)
  const playerCol = 1;
  const playerRow = 1;

  // NPC sprite position (from props)
  const npcCol = npcSpriteCol;
  const npcRow = npcSpriteRow;

  // Navigate back to map
  const handleClose = useCallback(() => {
    router.push(`/game/${gameId}`);
  }, [router, gameId]);

  const currentQuestion = QUESTIONS[currentQuestionIndex];
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Move to next question after showing feedback
  const moveToNextQuestion = useCallback(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedIndex(0);
      setAnswered(false);
      setIsCorrect(false);
    } else {
      setGameComplete(true);
    }
  }, [currentQuestionIndex]);

  // Keyboard navigation for answer options
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        
        // If already answered, skip to next question immediately
        if (answered) {
          moveToNextQuestion();
          return;
        }
        
        // Check if answer is correct
        const correct = selectedIndex === currentQuestion.correctIndex;
        setIsCorrect(correct);
        setAnswered(true);
        
        // Apply damage based on answer
        if (correct) {
          // Correct answer: damage the NPC based on difficulty
          const damage = DIFFICULTY_DAMAGE[currentQuestion.difficulty] || 20;
          setNpcHP((prev) => Math.max(0, prev - damage));
        } else {
          // Wrong answer: damage the player
          setPlayerHP((prev) => Math.max(0, prev - WRONG_ANSWER_DAMAGE));
        }
        
        // Move to next question after delay (can be skipped with Enter)
        timeoutRef.current = setTimeout(() => {
          moveToNextQuestion();
        }, 1500);
        return;
      }

      // If already answered, ignore arrow keys
      if (answered) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev <= 0 ? currentQuestion.options.length - 1 : prev - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev >= currentQuestion.options.length - 1 ? 0 : prev + 1));
          break;
      }
    },
    [selectedIndex, answered, currentQuestion, moveToNextQuestion]
  );
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Check for win/lose conditions (HP reaches 0)
  useEffect(() => {
    if (playerHP <= 0 || npcHP <= 0) {
      // Wait a moment to show the final damage, then end game
      const timeout = setTimeout(() => {
        setGameComplete(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [playerHP, npcHP]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Get HP bar color based on health percentage
  const getHPBarColor = (hp: number) => {
    const percentage = (hp / MAX_HP) * 100;
    if (percentage > 60) {
      return "from-green-500 to-green-400"; // Green: 100-60%
    } else if (percentage > 40) {
      return "from-yellow-500 to-yellow-400"; // Yellow: 60-40%
    } else if (percentage > 20) {
      return "from-orange-500 to-orange-400"; // Orange: 40-20%
    } else {
      return "from-red-500 to-red-400"; // Red: 20-0%
    }
  };

  // Get button styling based on state
  const getOptionStyle = (index: number) => {
    if (answered) {
      // After answering, show correct/wrong
      if (index === currentQuestion.correctIndex) {
        // Correct answer - always show green
        return "border-green-600 bg-green-300 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]";
      }
      if (index === selectedIndex && !isCorrect) {
        // User's wrong selection - show red
        return "border-red-600 bg-red-300 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]";
      }
      // Other options - dim
      return "border-zinc-400 bg-zinc-200 opacity-50";
    }
    
    // Before answering - normal selection highlight
    if (selectedIndex === index) {
      return "border-amber-500 bg-amber-200 shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]";
    }
    return "border-black bg-white hover:bg-amber-50";
  };

  return (
    <div
      className="font-pixel relative flex min-h-screen flex-col bg-[#5a9c4a] text-zinc-900"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Close button - top right corner of page */}
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded border-2 border-black bg-zinc-300 text-sm font-bold shadow-[2px_2px_0_0_rgba(0,0,0,0.4)] transition hover:bg-zinc-400 sm:h-9 sm:w-9"
        aria-label="Close"
      >
        ×
      </button>

      {/* Yellow border frame */}
      <div className="flex flex-1 flex-col border-4 border-amber-400 p-2 sm:p-3">
        {/* Scene: green field + path + characters */}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-sm bg-[#5a9c4a]">
          {/* Random grass/pixel decorations - horizontal bars */}
          <div className="absolute inset-0 overflow-hidden" style={{ imageRendering: "pixelated" }}>
            {/* Left side - dark green */}
            <div className="absolute top-[22%] left-[3%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[26%] left-[8%] h-1 w-8 bg-[#3d6930]" />
            <div className="absolute top-[30%] left-[5%] h-1 w-5 bg-[#4a7c3a]" />
            <div className="absolute top-[35%] left-[12%] h-1 w-7 bg-[#3d6930]" />
            <div className="absolute top-[40%] left-[6%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[45%] left-[10%] h-1 w-8 bg-[#3d6930]" />
            <div className="absolute top-[50%] left-[4%] h-1 w-5 bg-[#4a7c3a]" />
            <div className="absolute top-[55%] left-[15%] h-1 w-6 bg-[#3d6930]" />
            <div className="absolute top-[60%] left-[7%] h-1 w-7 bg-[#4a7c3a]" />
            <div className="absolute top-[65%] left-[11%] h-1 w-5 bg-[#3d6930]" />
            <div className="absolute top-[70%] left-[5%] h-1 w-8 bg-[#4a7c3a]" />
            <div className="absolute top-[75%] left-[14%] h-1 w-6 bg-[#3d6930]" />
            <div className="absolute top-[80%] left-[8%] h-1 w-7 bg-[#4a7c3a]" />
            <div className="absolute top-[85%] left-[3%] h-1 w-5 bg-[#3d6930]" />
            {/* Left side - light green accents */}
            <div className="absolute top-[28%] left-[18%] h-1 w-4 bg-[#6ab85a]" />
            <div className="absolute top-[42%] left-[2%] h-1 w-5 bg-[#6ab85a]" />
            <div className="absolute top-[58%] left-[20%] h-1 w-4 bg-[#6ab85a]" />
            <div className="absolute top-[72%] left-[16%] h-1 w-5 bg-[#6ab85a]" />
            <div className="absolute top-[88%] left-[12%] h-1 w-4 bg-[#6ab85a]" />
            {/* Right side - dark green */}
            <div className="absolute top-[24%] left-[82%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[28%] left-[88%] h-1 w-7 bg-[#3d6930]" />
            <div className="absolute top-[33%] left-[80%] h-1 w-5 bg-[#4a7c3a]" />
            <div className="absolute top-[38%] left-[85%] h-1 w-8 bg-[#3d6930]" />
            <div className="absolute top-[43%] left-[78%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[48%] left-[90%] h-1 w-5 bg-[#3d6930]" />
            <div className="absolute top-[53%] left-[83%] h-1 w-7 bg-[#4a7c3a]" />
            <div className="absolute top-[58%] left-[87%] h-1 w-6 bg-[#3d6930]" />
            <div className="absolute top-[63%] left-[79%] h-1 w-8 bg-[#4a7c3a]" />
            <div className="absolute top-[68%] left-[84%] h-1 w-5 bg-[#3d6930]" />
            <div className="absolute top-[73%] left-[92%] h-1 w-4 bg-[#4a7c3a]" />
            <div className="absolute top-[78%] left-[81%] h-1 w-7 bg-[#3d6930]" />
            <div className="absolute top-[83%] left-[86%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[88%] left-[78%] h-1 w-5 bg-[#3d6930]" />
            {/* Right side - light green accents */}
            <div className="absolute top-[26%] left-[76%] h-1 w-4 bg-[#6ab85a]" />
            <div className="absolute top-[45%] left-[94%] h-1 w-3 bg-[#6ab85a]" />
            <div className="absolute top-[55%] left-[75%] h-1 w-5 bg-[#6ab85a]" />
            <div className="absolute top-[70%] left-[89%] h-1 w-4 bg-[#6ab85a]" />
            <div className="absolute top-[85%] left-[74%] h-1 w-5 bg-[#6ab85a]" />
            {/* Bottom area scattered */}
            <div className="absolute top-[90%] left-[25%] h-1 w-6 bg-[#4a7c3a]" />
            <div className="absolute top-[92%] left-[35%] h-1 w-5 bg-[#3d6930]" />
            <div className="absolute top-[88%] left-[55%] h-1 w-7 bg-[#4a7c3a]" />
            <div className="absolute top-[91%] left-[65%] h-1 w-6 bg-[#3d6930]" />
            <div className="absolute top-[94%] left-[45%] h-1 w-4 bg-[#6ab85a]" />
          </div>

          {/* Forest line in back */}
          <div
            className="absolute top-0 left-0 right-0 h-16 border-b-4 border-green-900"
            style={{ background: "linear-gradient(180deg, #2d5a27 0%, #1e3d1a 100%)" }}
          />

          {/* Characters - diagonal layout: player bottom-left, NPC top-right */}
          <div className="relative z-10 flex w-full max-w-3xl items-start justify-center gap-24 px-4 py-6 sm:gap-32">
            {/* Player character (from back) - positioned lower */}
            <div className="relative mt-16 flex flex-col items-center sm:mt-24">
              {/* Island/spot under character */}
              <div
                className="absolute -bottom-2 left-1/2 h-8 w-28 -translate-x-1/2 rounded-[50%] border-2 border-[#3a6a2a] sm:h-10 sm:w-36"
                style={{ background: "radial-gradient(ellipse, #4a8a3a 0%, #3a6a2a 100%)" }}
              />
              {/* Player info box on top */}
              <div className="mb-2 flex flex-col rounded-lg border-4 border-zinc-700 bg-zinc-800 px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                <p className="text-xs font-bold uppercase text-white sm:text-sm">YOU</p>
                <div className="mt-1.5 ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-400">HP</span>
                  <div className="h-2.5 w-20 overflow-hidden rounded-sm border-2 border-zinc-600 bg-zinc-700 sm:w-24">
                    <div
                      className={`h-full transition-all duration-500 ease-out bg-linear-to-r ${getHPBarColor(playerHP)}`}
                      style={{ width: `${(playerHP / MAX_HP) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="mt-0.5 ml-auto text-[10px] font-bold tabular-nums text-zinc-400">
                  {playerHP} / {MAX_HP}
                </p>
              </div>
              {/* Character sprite - back view */}
              <div
                className="relative z-10 h-24 w-24 shrink-0 bg-no-repeat sm:h-32 sm:w-32"
                style={{
                  backgroundImage: "url(/characters-sprite.png)",
                  backgroundPosition: `${(playerCol / 7) * 100}% ${(playerRow / 1) * 100}%`,
                  backgroundSize: "800% 200%",
                  imageRendering: "pixelated",
                }}
                title="Player (back)"
              />
            </div>

            {/* NPC (from front) - positioned higher */}
            <div className="relative mt-0 flex flex-col items-center sm:mt-0">
              {/* Island/spot under character */}
              <div
                className="absolute -bottom-2 left-1/2 h-8 w-28 -translate-x-1/2 rounded-[50%] border-2 border-[#3a6a2a] sm:h-10 sm:w-36"
                style={{ background: "radial-gradient(ellipse, #4a8a3a 0%, #3a6a2a 100%)" }}
              />
              {/* NPC info box above */}
              <div className="mb-2 flex flex-col rounded-lg border-4 border-zinc-700 bg-zinc-800 px-4 py-2 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">
                <p className="text-xs font-bold uppercase text-white sm:text-sm">{npcName}</p>
                <div className="mt-1.5 ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-400">HP</span>
                  <div className="h-2.5 w-20 overflow-hidden rounded-sm border-2 border-zinc-600 bg-zinc-700 sm:w-24">
                    <div
                      className={`h-full transition-all duration-500 ease-out bg-linear-to-r ${getHPBarColor(npcHP)}`}
                      style={{ width: `${(npcHP / MAX_HP) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="mt-0.5 ml-auto text-[10px] font-bold tabular-nums text-zinc-400">
                  {npcHP} / {MAX_HP}
                </p>
              </div>
              {/* Character sprite - front view */}
              <div
                className="relative z-10 h-24 w-24 shrink-0 bg-no-repeat sm:h-32 sm:w-32"
                style={{
                  backgroundImage: "url(/characters-sprite.png)",
                  backgroundPosition: `${(npcCol / 7) * 100}% ${(npcRow / 1) * 100}%`,
                  backgroundSize: "800% 200%",
                  imageRendering: "pixelated",
                }}
                title={`${npcName} (front)`}
              />
            </div>
          </div>
        </div>

        {/* Dialogue box */}
        <div className="mt-2 flex flex-col rounded-none border-4 border-black bg-white shadow-[6px_6px_0_0_rgba(0,0,0,0.5)]">
          {gameComplete ? (
            // Game complete screen
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-lg font-bold uppercase text-green-600 sm:text-xl">Battle Complete!</p>
              <p className="mt-2 text-sm text-zinc-600">
                {npcHP <= 0 ? `You defeated ${npcName}!` : playerHP <= 0 ? "You were defeated..." : "You answered all questions."}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedIndex(0);
                    setAnswered(false);
                    setIsCorrect(false);
                    setGameComplete(false);
                    setPlayerHP(MAX_HP);
                    setNpcHP(MAX_HP);
                  }}
                  className="rounded border-2 border-black bg-amber-400 px-6 py-2 font-bold shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-amber-300"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded border-2 border-black bg-zinc-300 px-6 py-2 font-bold shadow-[3px_3px_0_0_rgba(0,0,0,0.4)] transition hover:bg-zinc-200"
                >
                  Back to Map
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-0 sm:flex-row">
              {/* Left: question */}
              <div className="relative flex flex-1 flex-col border-b-4 border-black p-4 sm:border-b-0 sm:border-r-4 sm:border-black">
                <p className="text-[10px] font-bold uppercase text-zinc-500">
                  {String(currentQuestionIndex + 1)}/{QUESTIONS.length}
                </p>
                <p className="mt-2 text-sm font-bold leading-snug sm:text-base">{currentQuestion.question}</p>
                <div className="mt-4 text-center">
                  {answered ? (
                    <div>
                      <p className={`text-sm font-bold uppercase ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                        {isCorrect ? "✓ Correct!" : "✗ Wrong!"}
                      </p>
                      <p className={`text-[10px] font-bold ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                        {isCorrect
                          ? `${DIFFICULTY_DAMAGE[currentQuestion.difficulty]} damage to enemy!`
                          : `You took ${WRONG_ANSWER_DAMAGE} damage!`}
                      </p>
                      <p className="mt-1 text-[10px] uppercase text-zinc-400">ENTER TO CONTINUE</p>
                    </div>
                  ) : (
                    <p className="text-[10px] uppercase text-zinc-500">↑↓ SELECT · ENTER CONFIRM</p>
                  )}
                </div>
              </div>

              {/* Right: options */}
              <div className="flex w-full flex-col border-t-4 border-black bg-zinc-50 p-4 sm:w-80 sm:border-t-0 sm:border-l-0">
                <p className="mb-2 text-[10px] font-bold uppercase text-zinc-500">{currentQuestion.difficulty}</p>
                <ul className="flex flex-col gap-1">
                  {currentQuestion.options.map((option, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => !answered && setSelectedIndex(i)}
                        disabled={answered}
                        className={`flex w-full items-center gap-2 border-2 px-3 py-2 text-left text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-400 ${getOptionStyle(i)}`}
                      >
                        {/* Fixed-width icon slot to prevent text shifting */}
                        <span className="inline-block w-4 shrink-0 text-center" aria-hidden>
                          {answered ? (
                            i === currentQuestion.correctIndex ? (
                              <span className="text-green-700">✓</span>
                            ) : i === selectedIndex && !isCorrect ? (
                              <span className="text-red-700">✗</span>
                            ) : null
                          ) : selectedIndex === i ? (
                            <span className="text-amber-600">▶</span>
                          ) : null}
                        </span>
                        <span className="tabular-nums text-zinc-600">{i + 1}.</span>
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}