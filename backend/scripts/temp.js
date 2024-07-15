const quizzes = [
  /**JSON DATA */
];
quizzes.forEach((quiz, i) => {
  console.log("index: ", i);
  console.log("- subject title: ", quiz.subject);
  console.log("- quiz title: ", quiz.quiz);
  console.log("- length of questions: ", quiz.questions.length);
});

/***
 * 
 * Shape:
{
    "subject": "Subject Title",
    "quiz": "Quiz Title",
    "duration": "Duration in minutes",
    "successPercentage": "Minimum percentage to pass",
    "questions": [
        {
            "title": "Question Title",
            "answers": [
                {
                    "title": "Answer Title",
                    "isCorrect": true
                }
            ]
        }
    ]
}
 */
