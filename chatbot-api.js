// Chatbot AI untuk OceanMood dengan API integration
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

        // Kirim permintaan ke API backend
        fetch('/api/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                type: type
            })
        })
        .then(response => response.json())
        .then(data => {
            // Sembunyikan indikator thinking
            if (thinkingIndicator) {
                thinkingIndicator.style.display = 'none';
            }

            // Tampilkan respons dari API
            addMessage(type, data.response, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);

            // Sembunyikan indikator thinking
            if (thinkingIndicator) {
                thinkingIndicator.style.display = 'none';
            }

            // Tampilkan pesan error jika gagal
            addMessage(type, 'Mohon maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.', 'bot');
        });
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
}
