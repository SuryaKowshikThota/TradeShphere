const user = Store.current();

if (!user) {
  window.location.href = "index.html";
}

document.getElementById("welcomeUser").textContent =
  "Welcome, " + user.name;

document.getElementById("logoutButton").addEventListener("click", () => {
  Store.logout();
  window.location.href = "index.html";
});

const transactions = user.transactions;

const tasks = [
  {
    text: "Make your first purchase",
    done: transactions.some(t => t.type === "BUY")
  },
  {
    text: "Own 3 different stocks at once",
    done: user.holdings.length >= 3
  },
  {
    text: "Sell a stock",
    done: transactions.some(t => t.type === "SELL")
  },
  {
    text: "Complete 5 trades",
    done: transactions.length >= 5
  }
];

const taskList = document.getElementById("taskList");

tasks.forEach(task => {
  const li = document.createElement("li");

  li.className = task.done ? "completed" : "";

  li.innerHTML = `
    <span class="task-circle">${task.done ? "✓" : ""}</span>
    <span>${task.text}</span>
  `;

  taskList.appendChild(li);
});

const completedTasks = tasks.filter(task => task.done).length;

document.getElementById("taskProgress").textContent =
  completedTasks + " of " + tasks.length + " completed";

const questions = [
  {
    q: "You bought a share at ₹100 and it is now ₹120. What is your position?",
    a: [
      "A profit of ₹20",
      "A loss of ₹20",
      "No change"
    ],
    c: 0
  },
  {
    q: "What does your portfolio value include?",
    a: [
      "Only your cash",
      "Only your stocks",
      "Cash plus the value of your stocks"
    ],
    c: 2
  },
  {
    q: "Why spread money across several stocks?",
    a: [
      "To reduce the impact of one bad stock",
      "To guarantee profit",
      "To pay lower prices"
    ],
    c: 0
  },
  {
    q: "You buy 1 share at ₹100 and 1 at ₹200. What is your average cost?",
    a: [
      "₹100",
      "₹150",
      "₹200"
    ],
    c: 1
  }
];

let score = 0;
let answered = 0;

const quiz = document.getElementById("quiz");
const scoreElement = document.getElementById("quizScore");

scoreElement.textContent =
  "Answer all " + questions.length + " questions.";

questions.forEach(question => {
  const box = document.createElement("div");
  box.className = "quiz-question";

  const questionText = document.createElement("p");
  questionText.textContent = question.q;

  const note = document.createElement("small");

  box.appendChild(questionText);

  const buttons = question.a.map((answer, index) => {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = answer;

    button.addEventListener("click", () => {
      buttons.forEach(button => {
        button.disabled = true;
      });

      buttons[question.c].classList.add("correct");

      if (index === question.c) {
        score++;
        note.textContent = "Correct.";
      } else {
        button.classList.add("incorrect");
        note.textContent =
          "Not quite. The correct answer is highlighted.";
      }

      answered++;

      if (answered === questions.length) {
        scoreElement.textContent =
          "Your score: " + score + " out of " + questions.length;
      } else {
        scoreElement.textContent =
          answered + " of " + questions.length + " answered";
      }
    });

    box.appendChild(button);

    return button;
  });

  box.appendChild(note);
  quiz.appendChild(box);
});
