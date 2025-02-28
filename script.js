let currentFlow = null;
let jitsiMeet = null;

const symptomStages = [
    { 
        stage: "Stage 1: Most Common Symptoms", 
        symptoms: ["Fever", "Fatigue", "Cough", "Shortness of breath", "Sneezing", "Sore throat"]
    },
    { 
        stage: "Stage 2: Second Most Common Symptoms", 
        symptoms: ["Body aches", "Runny/stuffy nose", "Nausea/vomiting", "Headache", "Blurred vision", "Increased thirst/hunger"]
    },
    { 
        stage: "Stage 3: Main Diseases", 
        symptoms: ["Hypertension", "Diabetes"]
    }
];

let symptomState = {
    currentStageIndex: 0,
    selectedSymptoms: []
};

function startFlow(flowType) {
    currentFlow = flowType;
    document.getElementById('homePage').classList.add('hidden');
    document.getElementById('backBtn').classList.remove('hidden');

    if (flowType === 'video') {
        startVideoConsultation();
    } else {
        document.getElementById('chatContainer').classList.remove('hidden');
        document.getElementById('videoSection').classList.add('hidden');
        resetChat();

        if (flowType === 'symptom') {
            appendBotMessage("🩺 Symptom Checker Started");
            showSymptomStage(0);
        } else if (flowType === 'advice') {
            appendBotMessage("💡 Health Advice Assistant");
            appendBotMessage("Ask me general health questions:");
        }
    }
}

function startVideoConsultation() {
    document.getElementById('videoSection').classList.remove('hidden');
    document.getElementById('chatContainer').classList.add('hidden');
    
    // Load the doctor dashboard content
    const videoSection = document.getElementById('videoSection');
    videoSection.innerHTML = `
        <div class="container">
            <h2>Available Doctors</h2>
            <div class="doctor-list">
                <!-- Doctor 1 -->
                <div class="doctor-card">
                    <img src="https://via.placeholder.com/50" alt="Doctor 1">
                    <div class="doctor-info">
                        <strong>Dr. Sarah Johnson</strong>
                        <p>Cardiologist</p>
                    </div>
                    <button class="consult-button" onclick="startConsultation('https://meet.google.com/new')">Start Consultation</button>
                </div>
                <!-- Doctor 2 -->
                <div class="doctor-card">
                    <img src="https://via.placeholder.com/50" alt="Doctor 2">
                    <div class="doctor-info">
                        <strong>Dr. James Smith</strong>
                        <p>Dermatologist</p>
                    </div>
                    <button class="consult-button" onclick="startConsultation('https://meet.google.com/new')">Start Consultation</button>
                </div>
                <!-- Doctor 3 -->
                <div class="doctor-card">
                    <img src="https://via.placeholder.com/50" alt="Doctor 3">
                    <div class="doctor-info">
                        <strong>Dr. Emily White</strong>
                        <p>Neurologist</p>
                    </div>
                    <button class="consult-button" onclick="startConsultation('https://meet.google.com/new')">Start Consultation</button>
                </div>
            </div>
        </div>
    `;
}

function startConsultation(meetLink) {
    window.open(meetLink, '_blank'); // Opens Google Meet in a new tab
}

function showSymptomStage(stageIndex) {
    symptomState.currentStageIndex = stageIndex;
    const stage = symptomStages[stageIndex];

    if (!stage) {
        concludeSymptomChecker();
        return;
    }

    appendBotMessage(stage.stage);
    
    // Offer all symptoms in the stage + "None"
    const availableOptions = [...stage.symptoms.filter(symptom => !symptomState.selectedSymptoms.includes(symptom)), "None"];
    showQuickReplies(availableOptions);
}

function handleSymptomResponse(symptom) {
    if (symptom === "None") {
        appendBotMessage("✅ Noted: No symptoms from this stage.");
        moveToNextStage();
        return;
    }

    symptomState.selectedSymptoms.push(symptom);
    appendBotMessage(`✅ Noted: ${symptom}`);

    const stage = symptomStages[symptomState.currentStageIndex];
    const remainingSymptoms = stage.symptoms.filter(sym => !symptomState.selectedSymptoms.includes(sym));

    if (remainingSymptoms.length > 0) {
        showQuickReplies(remainingSymptoms.concat("None"));
    } else {
        moveToNextStage();
    }
}

function moveToNextStage() {
    const nextStageIndex = symptomState.currentStageIndex + 1;
    if (nextStageIndex < symptomStages.length) {
        showSymptomStage(nextStageIndex);
    } else {
        concludeSymptomChecker();
    }
}

function concludeSymptomChecker() {
    appendBotMessage("✅ All stages completed. Analyzing your symptoms...");
    setTimeout(() => {
        const analysis = analyzeSymptoms();
        appendBotMessage(`🩺 Based on your symptoms, you might have: ${analysis.condition}`);
        appendBotMessage(`💡 Recommended action: ${analysis.recommendation}`);
        showQuickReplies(["Start over", "Video consult", "Exit"]);
    }, 1000);
}

function analyzeSymptoms() {
    const symptoms = symptomState.selectedSymptoms;

    // Predefined conditions mapped to symptom combinations
    const conditions = [
        {
            condition: "Flu or COVID-19",
            symptoms: ["Fever", "Cough", "Fatigue", "Shortness of breath"],
            recommendation: "Rest, stay hydrated, and seek medical advice if symptoms worsen."
        },
        {
            condition: "Migraine",
            symptoms: ["Headache", "Blurred vision", "Nausea/vomiting"],
            recommendation: "Rest in a dark room, avoid triggers like bright light, and consult a doctor if severe."
        },
        {
            condition: "Hypertension",
            symptoms: ["Headache", "Blurred vision"],
            recommendation: "Monitor blood pressure and consult a physician if readings are high."
        },
        {
            condition: "Allergic Rhinitis",
            symptoms: ["Sneezing", "Runny/stuffy nose", "Sore throat"],
            recommendation: "Consider antihistamines and consult if symptoms persist."
        },
        {
            condition: "Diabetes",
            symptoms: ["Increased thirst/hunger", "Fatigue", "Blurred vision"],
            recommendation: "Consider a blood sugar test and lifestyle changes; consult a doctor."
        },
        {
            condition: "Arthritis",
            symptoms: ["Body aches", "Fatigue"],
            recommendation: "Manage pain with medication, exercise, and consult a specialist if needed."
        },
        {
            condition: "Anemia",
            symptoms: ["Fatigue", "Shortness of breath", "Headache"],
            recommendation: "Check your iron levels and dietary intake; consult a healthcare provider."
        },
        {
            condition: "Depression",
            symptoms: ["Fatigue", "Headache"],
            recommendation: "Consider talking to a mental health professional."
        }
    ];

    // Match the user's symptoms to the most fitting condition
    let bestMatch = null;
    let highestMatchCount = 0;

    conditions.forEach(condition => {
        const matchCount = condition.symptoms.filter(sym => symptoms.includes(sym)).length;
        if (matchCount > highestMatchCount && matchCount >= 2) {
            highestMatchCount = matchCount;
            bestMatch = condition;
        }
    });

    if (bestMatch) {
        return {
            condition: bestMatch.condition,
            recommendation: bestMatch.recommendation
        };
    }

    // Handle cases where user picked almost nothing or symptoms don't match any profile
    if (symptoms.length === 0) {
        return {
            condition: "No significant symptoms reported",
            recommendation: "You seem to be healthy! If you feel unwell later, you can check again."
        };
    }

    return {
        condition: "Mild Symptoms - No clear diagnosis",
        recommendation: "Monitor your condition and consult a doctor if symptoms persist or worsen."
    };
}

function showQuickReplies(options) {
    const container = document.createElement('div');
    container.className = 'quick-replies';
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = option;
        btn.onclick = () => handleQuickReply(option);
        container.appendChild(btn);
    });
    
    document.getElementById('chatMessages').appendChild(container);
    document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
}

function handleQuickReply(response) {
    switch(response) {
        case 'Start over':
            resetChat();
            startFlow('symptom');
            break;
        case 'Video consult':
            startFlow('video');
            break;
        case 'Exit':
            showHomePage();
            break;
        default:
            appendMessage(response, 'user');
            if (currentFlow === 'symptom') {
                handleSymptomResponse(response);
            } else {
                handleHealthAdvice(response);
            }
    }
}

wss.on("connection", (ws) => {
    console.log("✅ New WebSocket connection");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);

        if (data.type === "chat") {
            const userMessage = data.message;
            console.log("💬 User Message:", userMessage);

            try {
                const response = await axios.post(
                    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
                    { contents: [{ parts: [{ text: userMessage }] }] },
                    { params: { key: GEMINI_API_KEY }, headers: { "Content-Type": "application/json" } }
                );

                let botReply = response.data.candidates[0]?.content?.parts[0]?.text || "I couldn't process that.";
                botReply = botReply.replace(/\*/g, '').replace(/\. /g, '\n');
                ws.send(JSON.stringify({ type: "chat", message: botReply }));
            } catch (error) {
                console.error("❌ Gemini API Error:", error.response?.data || error.message);
                ws.send(JSON.stringify({ type: "chat", message: "I'm having trouble responding right now. Please try again later." }));
            }
        }
    });

    ws.on("close", () => {
        console.log("❌ WebSocket disconnected");
    });
});


function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const indicator = document.createElement('div');
    indicator.id = 'typingIndicator';
    indicator.className = 'typing-indicator';
    indicator.innerHTML = `
        <div class="typing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function appendMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `
        <div class="message-content">${text}</div>
        <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendBotMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    messageDiv.innerHTML = `<div class="message-content">typing...</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    setTimeout(() => {
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        `;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 700);
}

function resetChat() {
    document.getElementById('chatMessages').innerHTML = '';
    symptomState = { currentStageIndex: 0, selectedSymptoms: [] };
}

function showHomePage() {
    document.getElementById('homePage').classList.remove('hidden');
    document.getElementById('chatContainer').classList.add('hidden');
    document.getElementById('videoSection').classList.add('hidden');
    document.getElementById('backBtn').classList.add('hidden');
    resetChat();
}

function goBack() {
    showHomePage();
}

// Add event listener for the send button
document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

function sendMessage() {
    const userInput = document.getElementById('userInput');
    const message = userInput.value.trim();
    
    if (message) {
        appendMessage(message, 'user');
        userInput.value = '';
        
        if (currentFlow === 'advice') {
            handleHealthAdvice(message);
        }
    }
}