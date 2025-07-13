score = 0;
currentIndex = 0;
const chooseCategory = document.querySelector(".chooseCategory");
const question = document.querySelector(".question");
const correctAnswer = document.querySelector(".correctAnswer");
const incorrectAnswer = document.querySelector(".incorrectAnswer");
const finalScore = document.querySelector(".finalScore");
const questionAsker = document.querySelector(".question-box h2");
const topicShower = document.querySelector(".question-box p span");
const ansButton = document.querySelectorAll(".option");
const nextButton = document.querySelectorAll(".next-button")
const apiBaseUrl = "";

async function fetchQuestions(category){
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
    try{
        const response = await fetch(`${apiBaseUrl}/trivia/questions/${category}`)
        if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : { message: response.statusText };
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorBody.message}`
            );
          }
          const questions = await response.json();

          if (questions === 0){
            console.log("category not found");
          }else{
            list = []
            questions.forEach(function(x){
              list.push(x.question_text);
            });
            shuffle(list);
            console.log(list);
            return list;
          }
    }catch(error){
        console.error("error fetching questions",error)
    }
}

async function refreshAnswers(list){
  let currentNum = 0;
  ansButton.forEach(async function(button){
    currenAns = list[currentNum];
    button.textContent = currenAns.answer_text;
    button.setAttribute("is_correct",currenAns.is_correct);
    currentNum += 1;
  })
}
async function getAnswer(question){

  try{
    const response = await fetch(`${apiBaseUrl}/trivia/options/${encodeURIComponent(question)}`);
    if (!response.ok) {
      // Handle HTTP errors (e.g., 404, 500)
      // Attempt to read error body if available, otherwise use status text
      const errorBody = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : { message: response.statusText };
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorBody.message}`
      );
    }
    const answer = await response.json();

    if (answer === 0){
      console.log("answers not found");
    }else{
      list = []
      answer.forEach(function(x){
        list.push(x);
      });
      console.log(list)
      return list;
    }
}catch(error){
  console.error("error fetching answers",error)
  }
}


document.addEventListener("DOMContentLoaded", function() {
   const categoryButtons = document.querySelectorAll(".card");
   const goBackButton = document.querySelector(".back-button");
   const scoreTracker = document.querySelector(".question h1 span");
   const questionTracker = document.querySelector(".question-box p strong");
   const answerButtons = document.querySelectorAll(".question-box .options-grid .option")
   const currentQuestion = document.querySelector(".question-box h2")
   let currentQuestionList;

   categoryButtons.forEach(async function(button){
    button.addEventListener("click",async function(){
        testName = button.getAttribute("item");
        console.log(testName);
        currentQuestionList = await fetchQuestions(testName);
        topicShower.textContent = testName;
        chooseCategory.style.display = "none";
        scoreTracker.textContent = "Score 0/5";
        questionTracker.textContent = "Question 1 of 5";
        console.log(currentQuestionList[currentIndex]);
        currentQuestion.textContent = currentQuestionList[currentIndex];
        question.style.display = "block";
        let answer = await getAnswer(currentQuestionList[currentIndex]);
        refreshAnswers(answer);
    })
   })
   ansButton.forEach(function(button){
    button.addEventListener("click", function(){
      console.log(button.getAttribute("is_correct"));
      if (button.getAttribute("is_correct") == "true") {
        score += 1;
        correctAnswer.style.display = "flex";
      } else {
        score = 0;
        incorrectAnswer.style.display = "flex";
      }
      question.style.display = "none";
      currentIndex += 1;
    });
   })
   goBackButton.addEventListener("click",function(){
      chooseCategory.style.display = "block";
      question.style.display = "none";
      score = 0;
      currentIndex = 0;
   })
   nextButton.forEach(async function(button){
    button.addEventListener("click",async function(){
      correctAnswer.style.display = "none";
      incorrectAnswer.style.display = "none";
      if (currentIndex != 5){
        scoreTracker.textContent = `Score ${score}/5`;
        questionTracker.textContent = `Question ${currentIndex+1} of 5`;
        console.log(currentQuestionList[currentIndex]);
        currentQuestion.textContent = currentQuestionList[currentIndex];
        question.style.display = "block";
        let answer = await getAnswer(currentQuestionList[currentIndex]);
        refreshAnswers(answer);
      }else{
        let scoreFract = document.querySelector(".score-fraction");
        let scorePerc = document.querySelector(".score-percent");
        let congrats = document.querySelector(".congrats");
        let tryCategory = document.querySelector(".try-category");
        let tryAgain = document.querySelector(".try-again");
        finalScore.style.display = "block";
        scoreFract.textContent = score + "/5";
        scorePerc.textContent = (score/5)*100 + "%";
        if(score <3){
          scoreFract.style.color = "red";
          scorePerc.style.color = "red";
          congrats.textContent = "Try harder next time!"
        }else{
          scoreFract.style.color = "limegreen";
          scorePerc.style.color = "limegreen";
          congrats.textContent = "🎯Congrats on your amazing score!"
        }
        score = 0;
        currentIndex = 0;

        tryCategory.addEventListener("click",function(){
          finalScore.style.display = "none";
          chooseCategory.style.display = "block";
        })
        tryAgain.addEventListener("click",function(){
          finalScore.style.display = "none";
          question.style.display = "block";
          questionTracker.textContent = `Question 1 of 5`;
        })

      }
    })
   })

});