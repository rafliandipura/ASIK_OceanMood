// Chatbot AI untuk OceanMood
document.addEventListener('DOMContentLoaded', function() {
    // Fungsi untuk menampilkan waktu saat ini
    function updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const currentTimeElements = document.querySelectorAll('#current-time, #current-time-analyze');
        currentTimeElements.forEach(element => {
            if (element) {
                element.textContent = timeString;
            }
        });
    }

    // Update waktu setiap menit
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);

    // Inisialisasi chatbot dashboard
    initializeChatbot('dashboard');

    // Inisialisasi chatbot analisis
    initializeChatbot('analyze');
});

// Fungsi untuk menginisialisasi chatbot
function initializeChatbot(type) {
    const chatBody = document.getElementById(`chatbot-body-${type}`);
    const chatInput = document.getElementById(`chatbot-input-${type}`);
    const sendButton = document.getElementById(`chatbot-send-${type}`);
    const thinkingIndicator = document.getElementById(`chatbot-thinking-${type}`);
    const suggestionChips = document.querySelectorAll(`#chatbot-body-${type}`).forEach ? 
        document.querySelectorAll(`#chatbot-body-${type}`) : 
        document.querySelectorAll(`.suggestion-chip`);

    // Event listener untuk tombol kirim
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            sendMessage(type);
        });
    }

    // Event listener untuk input field
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage(type);
            }
        });
    }

    // Event listener untuk suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            if (chatInput) {
                chatInput.value = query;
                sendMessage(type);
            }
        });
    });

    // Fungsi untuk mengirim pesan
    function sendMessage(type) {
        if (!chatInput || !chatInput.value.trim()) return;

        const message = chatInput.value.trim();
        chatInput.value = '';

        // Tambahkan pesan user ke chat
        addMessage(type, message, 'user');

        // Tampilkan indikator thinking
        if (thinkingIndicator) {
            thinkingIndicator.style.display = 'flex';
        }

        // Simulasi respons AI
        setTimeout(() => {
            if (thinkingIndicator) {
                thinkingIndicator.style.display = 'none';
            }

            // Generate respons berdasarkan pesan user
            const response = generateAIResponse(message, type);
            addMessage(type, response, 'bot');
        }, 1500 + Math.random() * 1500); // Simulasi waktu respons 1.5-3 detik
    }

    // Fungsi untuk menambahkan pesan ke chat
    function addMessage(type, message, sender) {
        const chatBody = document.getElementById(`chatbot-body-${type}`);
        if (!chatBody) return;

        const messageContainer = document.createElement('div');
        messageContainer.className = `chat-message ${sender}-message`;

        const messageBubble = document.createElement('div');
        messageBubble.className = 'message-bubble';

        const messageText = document.createElement('p');
        messageText.textContent = message;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = `Hari ini, ${new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;

        messageBubble.appendChild(messageText);
        messageBubble.appendChild(messageTime);
        messageContainer.appendChild(messageBubble);

        // Tambahkan indikator typing untuk bot
        if (sender === 'bot') {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = '<span></span><span></span><span></span>';

            // Sisipkan sebelum pesan bot, lalu hapus setelah jeda singkat
            chatBody.appendChild(typingIndicator);

            setTimeout(() => {
                chatBody.removeChild(typingIndicator);
                chatBody.appendChild(messageContainer);
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 800);
        } else {
            chatBody.appendChild(messageContainer);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    // Fungsi untuk generate respons AI
    function generateAIResponse(message, type) {
        const lowerMessage = message.toLowerCase();

        // Respons untuk dashboard
        if (type === 'dashboard') {
            if (lowerMessage.includes('prediksi') && lowerMessage.includes('populasi')) {
                return 'Maaf, fitur prediksi populasi ikan sedang dalam pengembangan. Saat ini, saya dapat membantu Anda dengan analisis data historis populasi ikan, identifikasi faktor-faktor yang mempengaruhi populasi, dan rekomendasi strategis untuk pengelolaan perikanan berdasarkan data yang ada.';
            }
            else if (lowerMessage.includes('lokasi') && (lowerMessage.includes('terbaik') || lowerMessage.includes('tertinggi'))) {
                return 'Berdasarkan data real-time saat ini, lokasi dengan populasi ikan tertinggi adalah Perairan Timur Sulawesi dengan estimasi 125 ton, diikuti oleh Perairan Papua dengan 118 ton. Kondisi oseanografi optimal di kedua lokasi dengan SPL 27.8°C dan klorofil-a 0.38 mg/m³ untuk Sulawesi, serta SPL 28.7°C dan klorofil-a 0.45 mg/m³ untuk Papua.';
            }
            else if (lowerMessage.includes('spl') || lowerMessage.includes('suhu')) {
                return 'Kenaikan SPL memiliki dampak signifikan terhadap populasi ikan. Analisis kami menunjukkan korelasi negatif -0.75 antara SPL dan populasi ikan. Setiap kenaikan 1°C cenderung mengurangi populasi ikan sebesar 8-12%. Spesies yang paling terpengaruh adalah ikan pelagik kecil seperti layang dan tongkol. Saya merekomendasikan adaptasi zona penangkapan ke perairan yang lebih dalam atau berkunjung ke area dengan upwelling.';
            }
            else if (lowerMessage.includes('rekomendasi') || lowerMessage.includes('berkelanjutan')) {
                return 'Untuk praktik penangkapan berkelanjutan, saya merekomendasikan: 1) Terapkan kuota penangkapan berbasis ilmiah yang memperhitungkan musim reproduksi, 2) Gunakan alat penangkapan selektif untuk mengurangi bycatch, 3) Hindari area dengan konsentrasi ikan muda (<20cm), 4) Lakukan rotasi area penangkapan setiap 2-3 minggu, 5) Implementasikan sistem pelaporan elektronik untuk data yang lebih akurat.';
            }
            else {
                return 'Terima kasih atas pertanyaan Anda. Saya OceanMood AssistantAI siap membantu dengan analisis data kelautan. Untuk informasi yang lebih spesifik, silakan ajukan pertanyaan tentang prediksi populasi, lokasi terbaik, dampak parameter oseanografi, atau rekomendasi pengelolaan perikanan.';
            }
        }
        // Respons untuk analisis
        else if (type === 'analyze') {
            if (lowerMessage.includes('faktor') && lowerMessage.includes('penurunan')) {
                return 'Berdasarkan analisis data yang Anda unggah, tiga faktor utama yang berkontribusi pada penurunan populasi ikan adalah: 1) Kenaikan suhu permukaan laut (SPL) dengan korelasi -0.75, 2) Penurunan konsentrasi klorofil-a dengan korelasi 0.82, dan 3) Peningkatan TSS (Total Suspended Solid) yang mengurangi penetrasi cahaya. Model regresi kami menunjukkan bahwa perubahan ketiga faktor ini menjelaskan 78% variabilitas populasi ikan.';
            }
            else if (lowerMessage.includes('meningkatkan') || lowerMessage.includes('strategi')) {
                return 'Untuk meningkatkan populasi ikan, saya merekomendasikan strategi berikut: 1) Implementasikan zona perlindungan laut di area dengan tingkat reproduksi tinggi, 2) Kurangi emisi lokal yang memengaruhi kualitas perairan, 3) Rehabilitasi habitat pesisir seperti mangrove dan padang lamun, 4) Pengaturan intensitas penangkapan berbasis data spasial-temporal, dan 5) Program restocking spesies kunci dengan fokus pada area yang memiliki kondisi oseanografi optimal.';
            }
            else if (lowerMessage.includes('simulasi') && (lowerMessage.includes('spl') || lowerMessage.includes('suhu'))) {
                return 'Simulasi kenaikan SPL 2°C menunjukkan dampak signifikan: Populasi ikan diperkirakan akan menurun 15-22% dalam 3 bulan, spesies tropis akan bermigrasi ke perairan lebih dalam atau lintang lebih tinggi, dan produktivitas primer akan menurun 12-18% akibat stres termal pada fitoplankton. Namun, beberapa spesies ikan subtropis mungkin akan mengalami peningkatan populasi di perairan Indonesia bagian timur.';
            }
            else if (lowerMessage.includes('rekomendasi')) {
                return 'Berdasarkan analisis data Anda, saya merekomendasikan: 1) Fokus pada konservasi area dengan klorofil-a >0.4 mg/m³ yang menjadi habitat utama, 2) Implementasikan sistem monitoring real-time untuk parameter kritis (SPL, klorofil-a, TSS), 3) Tetapkan batas penangkapan musiman saat tren populasi menurun >5%, 4) Prioritaskan pengelolaan perikanan skala kecil yang memiliki dampak ekologis lebih rendah, dan 5) Kembangkan model prediktif berbasis machine learning untuk perencanaan jangka panjang.';
            }
            else {
                return 'Terima kasih atas pertanyaan Anda. Sebagai OceanMood AssistantAI, saya siap memberikan analisis mendalam tentang data kelautan Anda. Untuk informasi yang lebih spesifik, silakan ajukan pertanyaan tentang faktor-faktor yang mempengaruhi populasi, strategi peningkatan, simulasi perubahan parameter, atau rekomendasi berbasis data.';
            }
        }

        return 'Mohon maaf, saya tidak sepenuhnya memahami pertanyaan Anda. Sebagai OceanMood AssistantAI, saya dirancang untuk membantu dengan analisis data kelautan. Silakan ajukan pertanyaan yang lebih spesifik terkait populasi ikan atau parameter oseanografi.';
    }
}
