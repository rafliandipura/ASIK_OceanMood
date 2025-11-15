// Chatbot Hybrid dengan OpenAI API dan Pertanyaan Kustom
class HybridChatbot {
    constructor() {
        this.customResponses = {}; // Menyimpan pertanyaan dan jawaban kustom
        this.apiKey = null; // API Key OpenAI
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.conversationHistory = []; // Menyimpan riwayat percakapan
        this.init();
    }

    init() {
        // Membuat elemen chatbot
        this.createChatbotUI();
        // Mengatur event listener
        this.setupEventListeners();
        // Memuat respons kustom dari localStorage
        this.loadCustomResponses();
    }

    createChatbotUI() {
        // Membuat elemen chatbot
        const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container" style="display: none;">
                <div class="chatbot-header">
                    <h5><img src="/static/image/Oceanmoodlogoo.png" alt="Logo" width="24" height="24" class="d-inline-block align-text-top rounded-circle me-2">OceanMood.AI</h5>
                    <div>
                        <button id="clear-conversation" class="btn btn-sm btn-light me-1" title="Hapus Riwayat Percakapan">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button id="chatbot-toggle" class="btn btn-sm btn-light">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
                <div class="chatbot-body">
                    <div id="chatbot-messages" class="chatbot-messages">
                        <div class="message bot-message">
                            <p>Halo! Saya adalah asisten AI yang dapat membantu Anda dengan berbagai pertanyaan dan topik. Saya dapat menjawab pertanyaan umum, membantu dengan tugas, atau sekadar mengobrol. Ada yang bisa saya bantu hari ini?</p>
                        </div>
                    </div>
                    <div class="chatbot-input-container">
                        <input type="text" id="chatbot-input" class="form-control" placeholder="Ketik pesan Anda...">
                        <button id="chatbot-send" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
                <div id="chatbot-settings" class="chatbot-settings" style="display: none;">
                    <h6>Pengaturan Chatbot</h6>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i> Chatbot ini menggunakan teknologi OpenAI untuk memberikan respons yang cerdas dan kontekstual. Chatbot akan mencocokkan pertanyaan dengan jawaban kustom terlebih dahulu, jika tidak ada kecocokan maka akan menggunakan OpenAI API.
                    </div>
                    <div class="mb-3">
                        <label for="openai-key" class="form-label">OpenAI API Key</label>
                        <input type="password" id="openai-key" class="form-control" placeholder="Masukkan API Key Anda">
                        <div class="form-text">Dapatkan API key dari <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a>. API key akan disimpan secara lokal di browser Anda dan digunakan untuk menghubungi OpenAI API.</div>
                    </div>
                    <div class="mb-3">
                        <label for="model-selection" class="form-label">Model GPT</label>
                        <select id="model-selection" class="form-select">
                            <option value="auto">Otomatis (Pilih model terbaik)</option>
                            <option value="gpt-4o">GPT-4o (Model terbaru)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Lebih cepat)</option>
                        </select>
                        <div class="form-text">Pilih model GPT yang ingin digunakan. Model yang lebih canggih mungkin memerlukan API key dengan akses ke model tersebut.</div>
                    </div>
                    <div class="mb-3">
                        <h6>Pertanyaan & Jawaban Kustom</h6>
                        <p class="small text-muted">Chatbot sudah dilengkapi dengan jawaban kustom untuk pertanyaan umum tentang aplikasi ASIK. Anda dapat menambahkan pertanyaan dan jawaban kustom lainnya sesuai kebutuhan.</p>
                        <div id="custom-qa-container">
                            <!-- Pertanyaan kustom akan ditambahkan di sini -->
                        </div>
                        <button id="add-custom-qa" class="btn btn-sm btn-success">
                            <i class="fas fa-plus"></i> Tambah Q&A
                        </button>
                    </div>
                    <button id="save-settings" class="btn btn-primary">Simpan Pengaturan</button>
                </div>
                <button id="chatbot-settings-toggle" class="btn btn-sm btn-secondary chatbot-settings-toggle">
                    <i class="fas fa-cog"></i>
                </button>
            </div>
            <button id="chatbot-open" class="chatbot-open-button">
                <img src="/static/image/Oceanmoodlogoo.png" alt="Logo" width="36" height="36" class="rounded-circle">
            </button>
        `;

        // Menambahkan elemen chatbot ke body
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    setupEventListeners() {
        // Tombol buka chatbot
        document.getElementById('chatbot-open').addEventListener('click', () => {
            document.getElementById('chatbot-container').style.display = 'flex';
            document.getElementById('chatbot-open').style.display = 'none';
        });

        // Tombol tutup chatbot
        document.getElementById('chatbot-toggle').addEventListener('click', () => {
            document.getElementById('chatbot-container').style.display = 'none';
            document.getElementById('chatbot-open').style.display = 'flex';
        });

        // Tombol kirim pesan
        document.getElementById('chatbot-send').addEventListener('click', () => {
            this.sendMessage();
        });

        // Input pesan (Enter untuk mengirim)
        document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Tombol pengaturan
        document.getElementById('chatbot-settings-toggle').addEventListener('click', () => {
            const settings = document.getElementById('chatbot-settings');
            settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
        });

        // Tombol tambah Q&A kustom
        document.getElementById('add-custom-qa').addEventListener('click', () => {
            this.addCustomQA();
        });

        // Tombol simpan pengaturan
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Tombol hapus riwayat percakapan
        document.getElementById('clear-conversation').addEventListener('click', () => {
            this.clearConversation();
        });
    }

    // Fungsi untuk menghapus riwayat percakapan
    clearConversation() {
        // Kosongkan riwayat percakapan
        this.conversationHistory = [];

        // Kosongkan pesan di UI kecuali pesan pembuka
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.innerHTML = `
            <div class="message bot-message">
                <p>Halo! Saya adalah asisten AI yang dapat membantu Anda dengan berbagai pertanyaan dan topik. Saya dapat menjawab pertanyaan umum, membantu dengan tugas, atau sekadar mengobrol. Ada yang bisa saya bantu hari ini?</p>
            </div>
        `;
    }

    sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Menampilkan pesan pengguna
        this.addMessage(message, 'user');
        input.value = '';

        // Debug: Tampilkan pesan yang dikirim
        console.log('Pesan yang dikirim:', message);
        console.log('API Key tersedia:', this.apiKey ? 'Ya' : 'Tidak');
        console.log('Panjang API Key:', this.apiKey ? this.apiKey.length : 0);

        // Cek jawaban kustom lokal terlebih dahulu
        const messageLower = message.toLowerCase();
        let customResponse = null;

        // Cari jawaban kustom yang cocok
        for (const [question, answer] of Object.entries(this.customResponses)) {
            if (messageLower === question || question.includes(messageLower) || messageLower.includes(question)) {
                customResponse = answer;
                break;
            }
        }

        if (customResponse) {
            // Jika ada jawaban kustom, gunakan itu
            console.log('Menggunakan jawaban kustom');
            setTimeout(() => {
                this.addMessage(customResponse, 'bot', null, 'custom');
            }, 500);
        } else if (this.apiKey) {
            // Jika tidak ada jawaban kustom tapi ada API key, gunakan OpenAI
            console.log('Menggunakan OpenAI API');
            this.callOpenAI(message);
        } else {
            // Respons default jika tidak ada jawaban kustom dan API key
            console.log('Tidak ada jawaban kustom dan API key');
            setTimeout(() => {
                this.addMessage("Mohon maaf, saya tidak memiliki jawaban untuk pertanyaan tersebut. Silakan tambahkan jawaban kustom di pengaturan atau masukkan OpenAI API key.", 'bot', null, 'default');
            }, 500);
        }
    }

    callOpenAI(message) {
        // Menampilkan indikator pengetikan
        this.showTypingIndicator();

        // Jika API key tersedia, gunakan endpoint lokal yang akan menghubungi OpenAI
        if (this.apiKey) {
            // Tambahkan pesan pengguna ke riwayat percakapan
            const updatedHistory = [...this.conversationHistory, {"role": "user", "content": message}];

            // Mendapatkan model yang dipilih
            const selectedModel = document.getElementById('model-selection').value;

            // Debug: Tampilkan model yang dipilih di konsol
            console.log('Model yang dipilih:', selectedModel);
            console.log('API Key tersedia:', this.apiKey ? 'Ya' : 'Tidak');
            console.log('Pesan:', message);

            // Debug: Tampilkan data yang akan dikirim
            const requestData = {
                message: message,
                api_key: this.apiKey,
                conversation_history: updatedHistory,
                model: selectedModel
            };
            console.log('Data yang akan dikirim:', requestData);

            fetch('/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                // Debug: Tampilkan status respons
                console.log('Status respons:', response.status);

                if (!response.ok) {
                    // Jika respons tidak OK, tampilkan pesan error
                    throw new Error(`Server mengembalikan status ${response.status}: ${response.statusText}`);
                }

                return response.json();
            })
            .then(data => {
                this.removeTypingIndicator();

                // Debug: Tampilkan respons dari server
                console.log('Respons dari server:', data);
                console.log('Model yang digunakan:', data.model);
                console.log('Sumber respons:', data.source);

                if (data.response) {
                    this.addMessage(data.response, 'bot', data.model, data.source);
                    // Perbarui riwayat percakapan dengan respons bot
                    this.conversationHistory = [...updatedHistory, {"role": "assistant", "content": data.response}];
                } else if (data.error) {
                    this.addMessage(data.error, 'bot');
                    console.error('Error dari server:', data.error);
                } else {
                    this.addMessage('Maaf, terjadi kesalahan saat memproses permintaan Anda.', 'bot');
                    console.error('Respons tidak valid:', data);
                }
            })
            .catch(error => {
                this.removeTypingIndicator();
                console.error('Error:', error);
                this.addMessage('Maaf, terjadi kesalahan saat menghubungi server. Silakan coba lagi nanti.', 'bot');
            });
        } else {
            // Jika tidak ada API key, coba langsung ke OpenAI API (untuk pengembangan)
            this.removeTypingIndicator();
            this.addMessage('Mohon masukkan OpenAI API key di pengaturan untuk menggunakan fitur AI.', 'bot');
        }
    }

    addMessage(message, sender, model = null, source = null) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;

        let messageContent = `<p>${message}</p>`;

        // Tampilkan sumber dan model yang digunakan jika ada dan pesan dari bot
        if (sender === 'bot') {
            let sourceInfo = '';
            if (source === 'custom') {
                sourceInfo = 'Jawaban Kustom';
            } else if (source === 'openai' && model) {
                sourceInfo = `Model: ${model}`;
            } else if (source === 'default') {
                sourceInfo = 'Respons Default';
            }

            if (sourceInfo) {
                messageContent += `<small class="text-muted d-block mt-1">${sourceInfo}</small>`;
            }
        }

        messageElement.innerHTML = messageContent;
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingElement = document.createElement('div');
        typingElement.className = 'message bot-message typing-indicator';
        typingElement.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        typingElement.id = 'typing-indicator';
        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    addCustomQA() {
        const container = document.getElementById('custom-qa-container');
        const qaElement = document.createElement('div');
        qaElement.className = 'custom-qa-item mb-2';
        qaElement.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control custom-question" placeholder="Pertanyaan">
                <input type="text" class="form-control custom-answer" placeholder="Jawaban">
                <button class="btn btn-outline-danger remove-qa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(qaElement);

        // Event listener untuk tombol hapus
        qaElement.querySelector('.remove-qa').addEventListener('click', () => {
            qaElement.remove();
        });
    }

    saveSettings() {
        // Simpan API key
        this.apiKey = document.getElementById('openai-key').value;

        // Debug: Tampilkan API key yang disimpan
        console.log('API Key yang disimpan:', this.apiKey ? 'Tersedia' : 'Tidak tersedia');
        console.log('Panjang API Key:', this.apiKey ? this.apiKey.length : 0);

        // Simpan model yang dipilih
        const selectedModel = document.getElementById('model-selection').value;
        localStorage.setItem('chatbot-selected-model', selectedModel);

        // Debug: Tampilkan model yang dipilih
        console.log('Model yang dipilih:', selectedModel);

        // Simpan respons kustom
        this.customResponses = {};
        document.querySelectorAll('.custom-qa-item').forEach(item => {
            const question = item.querySelector('.custom-question').value.trim().toLowerCase();
            const answer = item.querySelector('.custom-answer').value.trim();

            if (question && answer) {
                this.customResponses[question] = answer;
            }
        });

        // Simpan ke localStorage
        localStorage.setItem('chatbot-api-key', this.apiKey);
        localStorage.setItem('chatbot-custom-responses', JSON.stringify(this.customResponses));

        // Debug: Konfirmasi penyimpanan
        console.log('Pengaturan berhasil disimpan ke localStorage');

        // Tampilkan notifikasi
        this.addMessage('Pengaturan berhasil disimpan!', 'bot');

        // Sembunyikan panel pengaturan
        document.getElementById('chatbot-settings').style.display = 'none';
    }

    loadCustomResponses() {
        // Memuat API key dari localStorage
        const savedApiKey = localStorage.getItem('chatbot-api-key');
        if (savedApiKey) {
            this.apiKey = savedApiKey;
            document.getElementById('openai-key').value = savedApiKey;

            // Debug: Tampilkan API key yang dimuat
            console.log('API Key yang dimuat:', this.apiKey ? 'Tersedia' : 'Tidak tersedia');
            console.log('Panjang API Key:', this.apiKey ? this.apiKey.length : 0);
        } else {
            // Debug: API key tidak ditemukan
            console.log('API Key tidak ditemukan di localStorage');
        }

        // Memuat model yang dipilih dari localStorage
        const savedModel = localStorage.getItem('chatbot-selected-model');
        if (savedModel) {
            document.getElementById('model-selection').value = savedModel;

            // Debug: Tampilkan model yang dimuat
            console.log('Model yang dimuat:', savedModel);
        } else {
            // Debug: Model tidak ditemukan
            console.log('Model tidak ditemukan di localStorage, menggunakan default');
        }

        // Memuat respons kustom dari localStorage
        const savedResponses = localStorage.getItem('chatbot-custom-responses');
        if (savedResponses) {
            this.customResponses = JSON.parse(savedResponses);

            // Menampilkan respons kustom di UI
            Object.entries(this.customResponses).forEach(([question, answer]) => {
                const container = document.getElementById('custom-qa-container');
                const qaElement = document.createElement('div');
                qaElement.className = 'custom-qa-item mb-2';
                qaElement.innerHTML = `
                    <div class="input-group">
                        <input type="text" class="form-control custom-question" value="${question}" placeholder="Pertanyaan">
                        <input type="text" class="form-control custom-answer" value="${answer}" placeholder="Jawaban">
                        <button class="btn btn-outline-danger remove-qa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                container.appendChild(qaElement);

                // Event listener untuk tombol hapus
                qaElement.querySelector('.remove-qa').addEventListener('click', () => {
                    qaElement.remove();
                });
            });
        } else {
            // Menambahkan contoh pertanyaan dan jawaban kustom jika belum ada
            this.addExampleCustomQA();
        }
    }

    // Menambahkan contoh pertanyaan dan jawaban kustom
    addExampleCustomQA() {
        const examples = [
            { question: "apa itu asik 2025", answer: "ASIK 2025 adalah aplikasi analisis data populasi ikan yang membantu pengelola perikanan dalam memantau dan menganalisis populasi ikan berdasarkan parameter oseanografi." },
            { question: "bagaimana cara upload data", answer: "Untuk mengunggah data, klik menu 'Unggah Data' di navbar, lalu pilih file CSV yang berisi data populasi ikan dan parameter oseanografi, kemudian klik tombol 'Unggah'." },
            { question: "parameter apa saja yang dianalisis", answer: "Aplikasi ASIK 2025 menganalisis parameter oseanografi seperti Suhu Permukaan Laut (SPL), Klorofil-a, dan Total Suspended Solid (TSS) untuk memprediksi populasi ikan." },
            { question: "apa itu ai", answer: "AI (Artificial Intelligence) atau Kecerdasan Buatan adalah teknologi yang memungkinkan mesin untuk belajar dari pengalaman, menyesuaikan input baru, dan melakukan tugas-tugas seperti manusia." },
            { question: "siapa presiden indonesia", answer: "Presiden Indonesia saat ini adalah Bapak Joko Widodo yang menjabat sejak 20 Oktober 2014." },
            { question: "hi", answer: "Hi! Senang berbicara dengan Anda. Ada yang bisa saya bantu?" },
            { question: "halo", answer: "Halo! Ada yang bisa saya bantu hari ini?" },
            { question: "selamat pagi", answer: "Selamat pagi! Semoga hari Anda menyenangkan. Ada yang bisa saya bantu?" },
            { question: "selamat siang", answer: "Selamat siang! Ada yang bisa saya bantu?" },
            { question: "selamat sore", answer: "Selamat sore! Ada yang bisa saya bantu?" },
            { question: "selamat malam", answer: "Selamat malam! Ada yang bisa saya bantu?" },
            { question: "terima kasih", answer: "Sama-sama! Senang bisa membantu Anda. Ada lagi yang bisa saya bantu?" },
            { question: "thanks", answer: "You're welcome! Ada lagi yang bisa saya bantu?" },
            { question: "sampai jumpa", answer: "Sampai jumpa! Semoga harimu menyenangkan!" },
            { question: "apa kabar", answer: "Saya baik-baik saja, terima kasih sudah bertanya! Saya siap membantu Anda dengan informasi tentang aplikasi ASIK 2025 atau topik lainnya." }
        ];

        examples.forEach(example => {
            this.customResponses[example.question] = example.answer;

            // Menambahkan ke UI
            const container = document.getElementById('custom-qa-container');
            const qaElement = document.createElement('div');
            qaElement.className = 'custom-qa-item mb-2';
            qaElement.innerHTML = `
                <div class="input-group">
                    <input type="text" class="form-control custom-question" value="${example.question}" placeholder="Pertanyaan">
                    <input type="text" class="form-control custom-answer" value="${example.answer}" placeholder="Jawaban">
                    <button class="btn btn-outline-danger remove-qa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(qaElement);

            // Event listener untuk tombol hapus
            qaElement.querySelector('.remove-qa').addEventListener('click', () => {
                qaElement.remove();
            });
        });

        // Menyimpan contoh ke localStorage
        localStorage.setItem('chatbot-custom-responses', JSON.stringify(this.customResponses));
    }
}

// Inisialisasi chatbot saat DOM dimuat
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new HybridChatbot();
});
