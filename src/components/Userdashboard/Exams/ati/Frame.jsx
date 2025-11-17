"use client";

import React, { useEffect, useState, useRef } from "react";
import FrameTopBar from "./FrameTopBar";
import Notify from "./Notify";
import Success from "./Success";
import ExamReview from "./ExamReview";
import Format1 from "./formats/Format1";
import Format2 from "./formats/Format2";
import Format3 from "./formats/Format3";
import Format4 from "./formats/Format4";
import Format5 from "./formats/Format5";
import Format6 from "./formats/Format6";
import Format7 from "./formats/Format7";
import Format8 from "./formats/Format8";
import Format9 from "./formats/Format9";
import Format10 from "./formats/Format10";

import styles from "./Frame.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function mapFormatToComponent(format) {
  const map = {
    1: Format1,
    2: Format2,
    3: Format3,
    4: Format4,
    5: Format5,
    6: Format6,
    7: Format7,
    8: Format8,
    9: Format9,
    10: Format10,
  };
  return map[format] || Format1;
}

export default function Frame({ mode, examname, displayExam }) {
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyVisible, setNotifyVisible] = useState(false);
  const [success, setSuccess] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExamReview, setShowExamReview] = useState(false);

  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const defaultTimeSecondsRef = useRef(3600);

  const ensureCsrf = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: "include" });
    } catch (err) {
      console.error("Failed to fetch CSRF", err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function load() {
      await ensureCsrf();
      const examRes = await fetch(`${API_BASE}/api/exam/${encodeURIComponent(examname)}/`, {
        credentials: "include",
      });
      if (examRes.status === 200) {
        const data = await examRes.json();
        if (!isMounted) return;
        setExam(data);
        defaultTimeSecondsRef.current = data.default_time_seconds || 3600;
        const attRes = await fetch(`${API_BASE}/api/attempt/${data.id}/`, { credentials: "include" });
        if (attRes.status === 200) {
          const attData = await attRes.json();
          setAttempt(attData);
          setNotifyVisible(true);
          const left = (data.default_time_seconds || 3600) - (attData.time_spent || 0);
          setTimeLeft(Math.max(left, 0));
          setCurrentQuestionIndex(Math.max((attData.last_question || 1) - 1, 0));
        } else {
          const blankAttempt = {
            time_spent: 0,
            last_question: 1,
            answers: {},
            is_completed: false,
          };
          setAttempt(blankAttempt);
          setTimeLeft(defaultTimeSecondsRef.current);
          setCurrentQuestionIndex(0);
        }
      } else {
        const txt = await examRes.text();
        console.error("Failed loading exam", examRes.status, txt);
      }
      setLoading(false);
    }
    load();
    return () => { isMounted = false; };
  }, [examname]);

  useEffect(() => {
    if (timeLeft == null) return;
    if (attempt && attempt.is_completed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          saveAttempt({ time_spent: defaultTimeSecondsRef.current, last_question: currentQuestionIndex + 1, answers: attempt.answers || {}, is_completed: false });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, attempt, currentQuestionIndex]);

  const saveAttempt = async (payload) => {
    if (!exam) return;
    const body = {
      time_spent: payload.time_spent ?? (defaultTimeSecondsRef.current - (timeLeft || defaultTimeSecondsRef.current)),
      last_question: payload.last_question ?? (currentQuestionIndex + 1),
      answers: payload.answers ?? (attempt && attempt.answers) ?? {},
      is_completed: payload.is_completed ?? (attempt && attempt.is_completed) ?? false,
      grade: payload.grade ?? null,
      points_scored: payload.points_scored ?? null,
      total_questions: payload.total_questions ?? exam.total_questions,
    };
    try {
      await fetch(`${API_BASE}/api/attempt/${exam.id}/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(body),
      });
      setAttempt(prev => ({ ...(prev || {}), ...body }));
    } catch (err) {
      console.error("Failed saving attempt", err);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const used = defaultTimeSecondsRef.current - (timeLeft ?? defaultTimeSecondsRef.current);
      const url = `${API_BASE}/api/attempt/${exam ? exam.id : ""}/`;
      const data = {
        time_spent: used,
        last_question: currentQuestionIndex + 1,
        answers: (attempt && attempt.answers) || {},
        is_completed: attempt ? attempt.is_completed : false,
      };
      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, false);
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.send(JSON.stringify(data));
        }
      } catch (err) {
        console.warn("Failed to send beacon", err);
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [exam, timeLeft, currentQuestionIndex, attempt]);

  function getCookie(name) {
    if (typeof document === "undefined") return "";
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : "";
  }

  const handleAnswerUpdate = (questionId, value, options = { autosave: false, markLastQuestion: true }) => {
    const newAnswers = { ...(attempt.answers || {}) };
    newAnswers[questionId] = value;
    const newAttempt = { ...(attempt || {}), answers: newAnswers };
    if (options.markLastQuestion) newAttempt.last_question = currentQuestionIndex + 1;
    setAttempt(newAttempt);
    if (options.autosave) {
      saveAttempt({
        time_spent: defaultTimeSecondsRef.current - (timeLeft || defaultTimeSecondsRef.current),
        last_question: newAttempt.last_question,
        answers: newAnswers,
        is_completed: newAttempt.is_completed || false,
      });
    }
  };

  const handleBookmark = async (questionId) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookmark/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ question_id: questionId }),
      });
      if (res.ok) {
        setSuccess("📚 Bookmarked successfully!");
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      console.error("bookmark failed", err);
    }
  };

  const handleReport = async (questionId, description) => {
    try {
      const res = await fetch(`${API_BASE}/api/report/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ question_id: questionId, exam_id: exam.id, description }),
      });
      if (res.status === 201) {
        setSuccess("🚨 Report submitted successfully!");
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (err) {
      console.error("report failed", err);
    }
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    const answers = attempt.answers || {};
    let points = 0;
    exam.questions.forEach((q) => {
      const qid = String(q.id);
      const userAnswer = answers[qid];
      if ([7,8,9,10].includes(q.format)) {
        if (Array.isArray(userAnswer) && JSON.stringify(userAnswer) === JSON.stringify(q.special_correct_order || [])) {
          points += 1;
        }
      } else {
        const correct = q.choices.filter(c => c.is_correct).map(c => c.id);
        if (Array.isArray(userAnswer)) {
          const ua = userAnswer.map(String);
          const correctIds = correct.map(String);
          if (ua.length === correctIds.length && ua.every(x => correctIds.includes(String(x)))) points += 1;
        } else if (userAnswer) {
          if (String(userAnswer) === String(correct[0])) points += 1;
        }
      }
    });
    const total = exam.total_questions || exam.questions.length;
    await saveAttempt({
      time_spent: defaultTimeSecondsRef.current - (timeLeft || defaultTimeSecondsRef.current),
      last_question: currentQuestionIndex + 1,
      answers: answers,
      is_completed: true,
      grade: (points / total) * 100,
      points_scored: points,
      total_questions: total,
    });
    setShowExamReview(true);
  };

  if (loading) return <div className={styles.loading}>🔄 Loading exam...</div>;
  if (!exam) return <div className={styles.error}>❌ Exam not found</div>;

  const question = exam.questions[currentQuestionIndex];
  const FormatComponent = mapFormatToComponent(question.format);
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;

  const onNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) setCurrentQuestionIndex(currentQuestionIndex + 1);
  };
  const onPrev = () => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  return (
    <div className={styles.frame}>
      <FrameTopBar
        examName={displayExam}
        mode={mode}
        timeLeft={timeLeft}
        totalQuestions={exam.questions.length}
        answeredCount={Object.keys(attempt.answers || {}).length}
        currentIndex={currentQuestionIndex}
      />

      {notifyVisible && attempt && attempt && attempt.time_spent >= 0 && attempt && !(attempt && attempt.is_completed) ? (
        <Notify
          onClose={() => setNotifyVisible(false)}
          onContinue={() => {
            setNotifyVisible(false);
            setCurrentQuestionIndex((attempt.last_question || 1) - 1);
          }}
          onStartFresh={async () => {
            await saveAttempt({
              time_spent: 0,
              last_question: 1,
              answers: {},
              is_completed: false,
            });
            setAttempt({ time_spent: 0, last_question: 1, answers: {}, is_completed: false });
            setTimeLeft(defaultTimeSecondsRef.current);
            setCurrentQuestionIndex(0);
            setNotifyVisible(false);
          }}
        />
      ) : null}

      <div className={styles.contentArea}>
        <div className={styles.questionArea}>
          <FormatComponent
            question={question}
            mode={mode}
            selectedAnswer={(attempt && attempt.answers && attempt.answers[String(question.id)]) || null}
            onAnswer={(value, opts) => handleAnswerUpdate(String(question.id), value, opts)}
            onBookmark={() => handleBookmark(question.id)}
            onReport={(description) => handleReport(question.id, description)}
          />
          <div className={styles.navButtons}>
            <button 
              className={`${styles.navBtn} ${styles.prevBtn}`} 
              onClick={onPrev} 
              disabled={currentQuestionIndex === 0}
            >
              ◀ Previous
            </button>
            <button 
              className={`${styles.navBtn} ${styles.nextBtn}`} 
              onClick={onNext} 
              disabled={currentQuestionIndex === exam.questions.length - 1}
            >
              Next ▶
            </button>
            {isLastQuestion && (
              <button className={styles.submitBtn} onClick={handleSubmitExam}>
                🚀 Submit Exam
              </button>
            )}
          </div>
        </div>

        <div className={`${styles.rightPanel} ${showExamReview ? styles.show : ""}`}>
          <ExamReview exam={exam} attempt={attempt} />
        </div>
      </div>

      {success && <Success message={success} />}
    </div>
  );
}