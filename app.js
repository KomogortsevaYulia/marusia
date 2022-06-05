const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config')

const port = 3000;
const comand = 'youthblossom' 
const str = ['вездекод', 'вездеход'] 
const initString = 'тестовый скилл' 
const questions = config.questions 
const app = express();

const sendResponse = (text, session, session_state = {}, TTStext = text, end_session = false, card = []) => {
    return {
        "response": {
            "text": text,
            "tts": TTStext,
            "commands": card,
            "end_session": end_session,
        },
        "session": {
            ...session,
        },
        "session_state": session_state,
        "version": "1.0"
      }
} 

Array.prototype.contains = function(target) {
    return this.some( obj => target.includes(obj) );
};


app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.post('/webhook', async (res, req) => {
    
    const request = res.body
    const command = request.request.command   
    const inputText = request.request.nlu.tokens 

    if(inputText.contains(initString.slice(' '))) {
        return req.send(sendResponse(`Спасибо что запустили меня! Доступные команды --- Команда "${comand} Вездекод" -- Команда - "Опрос" `, res.body.session))
    }

    if(inputText.contains(str) && inputText.includes(comand)) {
        return req.send(sendResponse('Привет Вездекодерам!', res.body.session, {}, 'Привет Вездек+одерам!'))
    }

    if(['опрос'].includes(command)) {
        return req.send(sendResponse(`Начнём опрос! Отправляй ответы : один,два,три\n\nПервый вопрос:\n${questions[0].question}\n\n${questions[0].answers}`, res.body.session, {
            "question": 0,
            "score": {
                "Дизайн": 0,
                "Спорт. прог": 0,
                "VK Mini Apps": 0,
                "Mobile": 0,
                "JS": 0,
                "Back End": 0 ,
                "Инфо без": 0,
                "Back End": 0 ,
                "Маруся": 0
            }
        }, `Начнём опрос!Отправляй ответы : один,два,три\nПервый вопрос:\n${questions[0].tts}`))
    }

    if([ 'вариант', 'номер', '1', '2', '3', 'один', 'два', 'три', 'первый', 'второй', 'третий', 'первое', 'второе', 'третье'].includes(inputText[0])) {
        
        let answer = inputText[1] || inputText[0] 
       
        if(!answer) {
            answer = config.answerInput[answer] 
        }
        
        const questionData = questions[request.state.session.question]
        
        const isCorrect = answer == questionData.correctAnswer
        let session_state = request.state.session

        if(isCorrect) {
            session_state.score[questionData.group]++
        }
        const scoreKeys =  Object.keys(session_state.score)
        
        const correctScoreNames = []
        for( let scoreKey of scoreKeys){
            if(session_state.score[scoreKey]){
                correctScoreNames.push(scoreKey)
            }
        }

        session_state.question++
        if(session_state.question == questions.length) {
            const result =correctScoreNames.join(', ');
            //console.log(result)
            return req.send(sendResponse(`Тест закончен! Вам подходят категории: ${result}`, res.body.session, {}, `${config.finishSound} Тест закончен! Вам подходят категории ^${result}^\n`, false, 
            ))
        }

        return req.send(sendResponse(`${questions[session_state.question].question}\n\n${questions[session_state.question].answers}`,
         res.body.session, session_state,
          `Следующий вопрос: ${questions[session_state.question].tts}`, false, 
        ))
    }

    return req.send(sendResponse('Неизвестная команда!', res.body.session))
});

app.listen(port, () => console.log(` Сервер запущен на PORT=${port} `));