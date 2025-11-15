
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session, send_from_directory
import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
import random
import os
from werkzeug.utils import secure_filename
import matplotlib.pyplot as plt
import io
import base64
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
import joblib

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Diperlukan untuk flash messages

# Konfigurasi folder upload menyimpan file yang di upload
UPLOAD_FOLDER = 'static/uploads'
ALLOWED_EXTENSIONS = {'csv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Pastikan folder upload ada
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_ocean_data():
    """
    Membaca data populasi ikan, SPL, dan Klorofil dari CSV per-bulan.
    File harus disimpan seperti:
        static/data/sst/sst_bln1.csv
        static/data/cloro/cloro_bln1.csv
        dst...
    """
    try:
        # --- 1. BACA POPULASI IKAN ---
        fish_path = os.path.join('static', 'data', 'ikan', 'populasi_ikan.csv')
        df = pd.read_csv(fish_path, sep=';')
        df.columns = [c.lower().strip() for c in df.columns]

        monthly_data = df.groupby('bulan')['jumlah'].sum().reset_index()
        bulan = monthly_data['bulan'].tolist()
        populasi = monthly_data['jumlah'].tolist()

        # --- 2. BACA CSV SPL & KLOROFIL ---
        spl_list = []
        chl_list = []

        for i in range(1, len(bulan) + 1):
            # SPL
            sst_file = f"static/data/grafiksst/sst_bln{i}.csv"
            if os.path.exists(sst_file):
                df_sst = pd.read_csv(sst_file)
                spl_list.append(round(df_sst['SST'].mean(), 3))
            else:
                spl_list.append(None)

            # KLOROFIL
            chl_file = f"static/data/grafikcloro/cloro_bln{i}.csv"
            if os.path.exists(chl_file):
                df_chl = pd.read_csv(chl_file)
                chl_list.append(round(df_chl['CHL'].mean(), 3))
            else:
                chl_list.append(None)

        # -------------------------------------------------------------------
        # Pastikan panjang SPL & Klorofil sama dengan jumlah bulan populasi
        # -------------------------------------------------------------------
        if len(spl_list) < len(bulan):
            spl_list += [None] * (len(bulan) - len(spl_list))

        if len(chl_list) < len(bulan):
            chl_list += [None] * (len(bulan) - len(chl_list))

        return {
            'dates': bulan,
            'populasi': populasi,
            'spl': spl_list,
            'klorofil_a': chl_list
        }

    except Exception as e:
        print(f"[ERROR] {e}")
        return {
            'dates': [],
            'populasi': [],
            'spl': [],
            'klorofil_a': []
        }


@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tentang')
def tentang():
    return render_template('tentang.html')


@app.route('/upload', methods=['GET', 'POST'])
def upload_file():
    if request.method == 'POST':
        # Cek apakah file ada dalam request
        if 'file' not in request.files:
            flash('Tidak ada file yang dipilih')
            return redirect(request.url)
        
        file = request.files['file']
        
        # Cek apakah user memilih file
        if file.filename == '':
            flash('Tidak ada file yang dipilih')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            # Analisis file CSV
            try:
                # Baca file CSV
                df = pd.read_csv(filepath)
                
                # Simpan data ke session untuk digunakan di halaman analisis
                session['csv_data'] = df.to_json()
                session['filename'] = filename
                
                flash(f'File {filename} berhasil diunggah dan dianalisis')
                return redirect(url_for('analyze_data'))
            except Exception as e:
                flash(f'Terjadi kesalahan saat membaca file: {str(e)}')
                return redirect(request.url)
    
    return render_template('upload.html')


@app.route('/analyze')
def analyze_data():
    if 'csv_data' not in session:
        flash('Silakan unggah file CSV terlebih dahulu')
        return redirect(url_for('upload_file'))
    
    # Load data dari session
    df = pd.read_json(session['csv_data'])
    filename = session['filename']
    
    # Analisis data populasi ikan
    analysis_result = analyze_fish_population(df)
    
    # Prediksi populasi 7 hari ke depan
    prediction_result = predict_fish_population(df)
    
    return render_template('analyze.html', 
                           filename=filename,
                           analysis_result=analysis_result,
                           prediction_result=prediction_result)

def analyze_fish_population(df):
    """
    Fungsi untuk menganalisis data populasi ikan
    """
    result = {}
    
    # Pastikan kolom yang diperlukan ada
    required_columns = ['tanggal', 'populasi']
    for col in required_columns:
        if col not in df.columns:
            raise ValueError(f"Kolom '{col}' tidak ditemukan dalam file CSV")
    
    # Konversi kolom tanggal ke datetime
    df['tanggal'] = pd.to_datetime(df['tanggal'])
    
    # Sortir data berdasarkan tanggal
    df = df.sort_values('tanggal')
    
    # Tren populasi (apakah meningkat, menurun, atau stabil)
    df['populasi_change'] = df['populasi'].diff()
    avg_change = df['populasi_change'].mean()
    
    if avg_change > 0.5:
        trend = "Meningkat"
    elif avg_change < -0.5:
        trend = "Menurun"
    else:
        trend = "Stabil"
    
    # Statistik dasar populasi
    stats = {
        'mean': df['populasi'].mean(),
        'median': df['populasi'].median(),
        'std': df['populasi'].std(),
        'min': df['populasi'].min(),
        'max': df['populasi'].max()
    }

    # Statistik SPL jika kolom ada
    spl_stats = {}
    if 'spl' in df.columns:
        spl_stats = {
            'mean': df['spl'].mean(),
            'median': df['spl'].median(),
            'std': df['spl'].std(),
            'min': df['spl'].min(),
            'max': df['spl'].max()
        }
    else:
        # Nilai default jika kolom tidak ada
        spl_stats = {
            'mean': 28.5,
            'median': 28.2,
            'std': 1.2,
            'min': 26.8,
            'max': 30.1
        }

    # Statistik klorofil jika kolom ada
    klorofil_stats = {}
    if 'klorofil' in df.columns:
        klorofil_stats = {
            'mean': df['klorofil'].mean(),
            'median': df['klorofil'].median(),
            'std': df['klorofil'].std(),
            'min': df['klorofil'].min(),
            'max': df['klorofil'].max()
        }
    else:
        # Nilai default jika kolom tidak ada
        klorofil_stats = {
            'mean': 0.35,
            'median': 0.33,
            'std': 0.08,
            'min': 0.25,
            'max': 0.45
        }
    
    # Fluktuasi (perubahan populasi maksimum dan minimum)
    fluctuation = {
        'max_increase': df['populasi_change'].max(),
        'max_decrease': df['populasi_change'].min()
    }
    
    # Persentase perubahan
    df['pct_change'] = df['populasi'].pct_change() * 100
    avg_pct_change = df['pct_change'].mean()
    
    result = {
        'trend': trend,
        'avg_change': avg_change,
        'stats': stats,
        'spl_stats': spl_stats,
        'klorofil_stats': klorofil_stats,
        'fluctuation': fluctuation,
        'avg_pct_change': avg_pct_change,
        'data_count': len(df)
    }
    
    return result

@app.route('/api/ocean_data')
def api_ocean_data():
    data = generate_ocean_data()
    print("[DEBUG] Data yang dikirim ke frontend:", data)
    return jsonify(data)

@app.route('/api/location_data')
def get_location_data():
    return jsonify(generate_location_data())

@app.route('/api/prediction')
def get_prediction():
    # Cek jika ada data CSV yang telah diunggah
    if 'csv_data' in session:
        try:
            # Load data dari session
            df = pd.read_json(session['csv_data'])
            
            # Gunakan fungsi prediksi dengan data aktual
            prediction = predict_fish_population(df)
            
            return jsonify({
                'dates': prediction['dates'],
                'populasi_prediksi': prediction['predictions'],
                'lower_bound': prediction['lower_bound'],
                'upper_bound': prediction['upper_bound'],
                'model_score': prediction['model_score']
            })
        except Exception as e:
            # Jika terjadi kesalahan, kembalikan ke data dummy
            pass
    
    # Generate prediksi dummy untuk 7 hari ke depan
    dates = [(datetime.now() + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 8)]

    # Generate data prediksi populasi ikan
    populasi_prediksi = [100 + random.uniform(-15, 25) for _ in range(7)]

    # Generate confidence interval
    lower_bound = [p - random.uniform(5, 10) for p in populasi_prediksi]
    upper_bound = [p + random.uniform(5, 10) for p in populasi_prediksi]

    return jsonify({
        'dates': dates,
        'populasi_prediksi': populasi_prediksi,
        'lower_bound': lower_bound,
        'upper_bound': upper_bound
    })

@app.route('/api/csv_data')
def get_csv_data():
    # Cek jika ada data CSV yang telah diunggah
    if 'csv_data' in session:
        try:
            # Load data dari session
            df = pd.read_json(session['csv_data'])
            
            # Konversi data ke format yang dibutuhkan oleh frontend
            # Pastikan kolom tanggal ada dan dalam format yang benar
            if 'tanggal' in df.columns:
                df['tanggal'] = pd.to_datetime(df['tanggal'])
                dates = df['tanggal'].dt.strftime('%Y-%m-%d').tolist()
            else:
                # Jika tidak ada kolom tanggal, buat tanggal dummy
                dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(len(df), 0, -1)]
            
            # Pastikan kolom populasi ada
            if 'populasi' in df.columns:
                populasi = df['populasi'].tolist()
            else:
                # Jika tidak ada kolom populasi, buat data dummy
                populasi = [100 + random.uniform(-20, 30) for _ in range(len(df))]
            
            # Cek kolom lainnya (SPL, Klorofil-a, TSS)
            spl = df['spl'].tolist() if 'spl' in df.columns else [28 + random.uniform(-1.5, 1.5) for _ in range(len(df))]
            klorofil = df['klorofil'].tolist() if 'klorofil' in df.columns else [0.3 + random.uniform(-0.1, 0.2) for _ in range(len(df))]
            tss = df['tss'].tolist() if 'tss' in df.columns else [15 + random.uniform(-5, 10) for _ in range(len(df))]
            
            return jsonify({
                'dates': dates,
                'spl': spl,
                'klorofil': klorofil,
                'populasi': populasi
            })
        except Exception as e:
            # Jika terjadi kesalahan, kembalikan ke data dummy
            pass
    
    # Jika tidak ada data CSV, kembalikan data dummy
    return jsonify(generate_ocean_data())

@app.route('/api/csv_analysis')
def get_csv_analysis():
    # Cek jika ada data CSV yang telah diunggah
    if 'csv_data' in session:
        try:
            # Load data dari session
            df = pd.read_json(session['csv_data'])
            
            # Analisis data
            analysis = analyze_fish_population(df)
            
            # Hitung korelasi jika semua kolom tersedia
            correlations = {}
            if all(col in df.columns for col in ['spl', 'klorofil', 'tss', 'populasi']):
                correlations['spl_populasi'] = df['spl'].corr(df['populasi'])
                correlations['klorofil_populasi'] = df['klorofil'].corr(df['populasi'])
                correlations['tss_populasi'] = df['tss'].corr(df['populasi'])
            else:
                # Gunakan nilai dummy jika kolom tidak lengkap
                correlations['spl_populasi'] = 0.75
                correlations['klorofil_populasi'] = 0.82
                correlations['tss_populasi'] = 0.63
            
            return jsonify({
                'trend_analysis': f"Populasi ikan menunjukkan tren {analysis['trend'].lower()} dengan perubahan rata-rata {analysis['avg_change']:.2f} per hari.",
                'correlations': correlations
            })
        except Exception as e:
            # Jika terjadi kesalahan, kembalikan ke data dummy
            pass
    
    # Jika tidak ada data CSV, kembalikan data dummy
    return jsonify({
        'trend_analysis': "Populasi ikan menunjukkan penurunan sebesar 12% dalam 30 hari terakhir, terutama dipengaruhi oleh kenaikan suhu permukaan laut.",
        'correlations': {
            'spl_populasi': 0.75,
            'klorofil_populasi': 0.82,
            'tss_populasi': 0.63
        }
    })

from flask import send_from_directory

@app.route('/static/data/geojson/cloro/<filename>')
def serve_chloro_geojson(filename):
    """Menyajikan file GeoJSON klorofil-a dari direktori static/data/geojson/cloro"""
    return send_from_directory('static/data/geojson/cloro', filename, mimetype='application/json')

@app.route('/static/data/geojson/sst/<filename>')
def serve_sst_geojson(filename):
    """Menyajikan file GeoJSON SPL dari direktori static/data/geojson/sst"""
    return send_from_directory('static/data/geojson/sst', filename, mimetype='application/json')


@app.route('/api/chatbot', methods=['POST'])
def chatbot_response():
    # Mendapatkan pesan dari user
    user_message = request.json.get('message', '')
    chat_type = request.json.get('type', 'dashboard')
    
    # Jika tidak ada pesan, kembalikan respons kosong
    if not user_message:
        return jsonify({'response': ''})
    
    # Generate respons berdasarkan pesan user dan tipe chat
    response = generate_chatbot_response(user_message, chat_type)
    
    return jsonify({'response': response})

def generate_chatbot_response(message, chat_type):
    """
    Fungsi untuk generate respons chatbot berdasarkan pesan user
    """
    lower_message = message.lower()
    
    # Respons untuk dashboard
    if chat_type == 'dashboard':
        if 'prediksi' in lower_message and 'populasi' in lower_message:
            return 'Berdasarkan analisis tren data 30 hari terakhir, prediksi populasi ikan untuk minggu depan menunjukkan penurunan sebesar 5-8%. Faktor utama penyebab adalah kenaikan suhu permukaan laut (SPL) sebesar 0.7°C dan penurunan konsentrasi klorofil-a. Saya merekomendasikan untuk fokus pada area dengan kedalaman 50-100m di mana suhu lebih stabil.'
        elif 'lokasi' in lower_message and ('terbaik' in lower_message or 'tertinggi' in lower_message):
            return 'Berdasarkan data real-time saat ini, lokasi dengan populasi ikan tertinggi adalah Perairan Timur Sulawesi dengan estimasi 125 ton, diikuti oleh Perairan Papua dengan 118 ton. Kondisi oseanografi optimal di kedua lokasi dengan SPL 27.8°C dan klorofil-a 0.38 mg/m³ untuk Sulawesi, serta SPL 28.7°C dan klorofil-a 0.45 mg/m³ untuk Papua.'
        elif 'spl' in lower_message or 'suhu' in lower_message:
            return 'Kenaikan SPL memiliki dampak signifikan terhadap populasi ikan. Analisis kami menunjukkan korelasi negatif -0.75 antara SPL dan populasi ikan. Setiap kenaikan 1°C cenderung mengurangi populasi ikan sebesar 8-12%. Spesies yang paling terpengaruh adalah ikan pelagik kecil seperti layang dan tongkol. Saya merekomendasikan adaptasi zona penangkapan ke perairan yang lebih dalam atau berkunjung ke area dengan upwelling.'
        elif 'rekomendasi' in lower_message or 'berkelanjutan' in lower_message:
            return 'Untuk praktik penangkapan berkelanjutan, saya merekomendasikan: 1) Terapkan kuota penangkapan berbasis ilmiah yang memperhitungkan musim reproduksi, 2) Gunakan alat penangkapan selektif untuk mengurangi bycatch, 3) Hindari area dengan konsentrasi ikan muda (<20cm), 4) Lakukan rotasi area penangkapan setiap 2-3 minggu, 5) Implementasikan sistem pelaporan elektronik untuk data yang lebih akurat.'
        else:
            return 'Terima kasih atas pertanyaan Anda. Saya OceanMood AssistantAI siap membantu dengan analisis data kelautan. Untuk informasi yang lebih spesifik, silakan ajukan pertanyaan tentang prediksi populasi, lokasi terbaik, dampak parameter oseanografi, atau rekomendasi pengelolaan perikanan.'
    # Respons untuk analisis
    elif chat_type == 'analyze':
        if 'faktor' in lower_message and 'penurunan' in lower_message:
            return 'Berdasarkan analisis data yang Anda unggah, tiga faktor utama yang berkontribusi pada penurunan populasi ikan adalah: 1) Kenaikan suhu permukaan laut (SPL) dengan korelasi -0.75, 2) Penurunan konsentrasi klorofil-a dengan korelasi 0.82, dan 3) Peningkatan TSS (Total Suspended Solid) yang mengurangi penetrasi cahaya. Model regresi kami menunjukkan bahwa perubahan ketiga faktor ini menjelaskan 78% variabilitas populasi ikan.'
        elif 'meningkatkan' in lower_message or 'strategi' in lower_message:
            return 'Untuk meningkatkan populasi ikan, saya merekomendasikan strategi berikut: 1) Implementasikan zona perlindungan laut di area dengan tingkat reproduksi tinggi, 2) Kurangi emisi lokal yang memengaruhi kualitas perairan, 3) Rehabilitasi habitat pesisir seperti mangrove dan padang lamun, 4) Pengaturan intensitas penangkapan berbasis data spasial-temporal, dan 5) Program restocking spesies kunci dengan fokus pada area yang memiliki kondisi oseanografi optimal.'
        elif 'simulasi' in lower_message and ('spl' in lower_message or 'suhu' in lower_message):
            return 'Simulasi kenaikan SPL 2°C menunjukkan dampak signifikan: Populasi ikan diperkirakan akan menurun 15-22% dalam 3 bulan, spesies tropis akan bermigrasi ke perairan lebih dalam atau lintang lebih tinggi, dan produktivitas primer akan menurun 12-18% akibat stres termal pada fitoplankton. Namun, beberapa spesies ikan subtropis mungkin akan mengalami peningkatan populasi di perairan Indonesia bagian timur.'
        elif 'rekomendasi' in lower_message:
            return 'Berdasarkan analisis data Anda, saya merekomendasikan: 1) Fokus pada konservasi area dengan klorofil-a >0.4 mg/m³ yang menjadi habitat utama, 2) Implementasikan sistem monitoring real-time untuk parameter kritis (SPL, klorofil-a, TSS), 3) Tetapkan batas penangkapan musiman saat tren populasi menurun >5%, 4) Prioritaskan pengelolaan perikanan skala kecil yang memiliki dampak ekologis lebih rendah, dan 5) Kembangkan model prediktif berbasis machine learning untuk perencanaan jangka panjang.'
        else:
            return 'Terima kasih atas pertanyaan Anda. Sebagai OceanMood AssistantAI, saya siap memberikan analisis mendalam tentang data kelautan Anda. Untuk informasi yang lebih spesifik, silakan ajukan pertanyaan tentang faktor-faktor yang mempengaruhi populasi, strategi peningkatan, simulasi perubahan parameter, atau rekomendasi berbasis data.'
    
    return 'Mohon maaf, saya tidak sepenuhnya memahami pertanyaan Anda. Sebagai OceanMood AssistantAI, saya dirancang untuk membantu dengan analisis data kelautan. Silakan ajukan pertanyaan yang lebih spesifik terkait populasi ikan atau parameter oseanografi.'

# Data jawaban kustom
custom_answers = [
    {"q": "tentang website", "a": "Website ASIK ini dibuat untuk analisis data populasi ikan dan kelautan."},
    {"q": "fitur utama", "a": "Fitur utamanya termasuk dashboard data, visualisasi tren, dan sistem unggah file CSV."},
    {"q": "kontak", "a": "Silakan hubungi kami melalui email: info@asik2025.com"},
    {"q": "apa itu asik 2025", "a": "ASIK 2025 adalah aplikasi analisis data populasi ikan yang membantu pengelola perikanan dalam memantau dan memprediksi populasi ikan berdasarkan parameter oseanografi."},
    {"q": "bagaimana cara upload data", "a": "Untuk mengunggah data, klik menu 'Unggah Data' di navbar, lalu pilih file CSV yang berisi data populasi ikan dan parameter oseanografi, kemudian klik tombol 'Unggah'."},
    {"q": "parameter apa saja yang dianalisis", "a": "Aplikasi ASIK 2025 menganalisis parameter oseanografi seperti Suhu Permukaan Laut (SPL), Klorofil-a, dan Total Suspended Solid (TSS) untuk memprediksi populasi ikan."},
    {"q": "halo", "a": "Halo! Ada yang bisa saya bantu hari ini?"},
    {"q": "hi", "a": "Hi! Senang berbicara dengan Anda. Ada yang bisa saya bantu?"},
    {"q": "selamat pagi", "a": "Selamat pagi! Semoga hari Anda menyenangkan. Ada yang bisa saya bantu?"},
    {"q": "selamat siang", "a": "Selamat siang! Ada yang bisa saya bantu?"},
    {"q": "selamat sore", "a": "Selamat sore! Ada yang bisa saya bantu?"},
    {"q": "selamat malam", "a": "Selamat malam! Ada yang bisa saya bantu?"},
    {"q": "terima kasih", "a": "Sama-sama! Senang bisa membantu Anda. Ada lagi yang bisa saya bantu?"},
    {"q": "thanks", "a": "You're welcome! Ada lagi yang bisa saya bantu?"},
    {"q": "sampai jumpa", "a": "Sampai jumpa! Semoga harimu menyenangkan!"},
    {"q": "apa kabar", "a": "Saya baik-baik saja, terima kasih sudah bertanya! Saya siap membantu Anda dengan informasi tentang aplikasi ASIK 2025 atau topik lainnya."}
]

# Endpoint untuk chatbot hybrid dengan OpenAI
@app.route('/api/chatbot', methods=['POST'])
def chatbot_api():
    data = request.json
    message = data.get('message', '')
    conversation_history = data.get('conversation_history', [])
    selected_model = data.get('model', 'auto')  # Mendapatkan model yang dipilih

    # Mendapatkan API Key dari request
    api_key = data.get('api_key', '')

    # 1. Cari kecocokan dengan jawaban kustom
    user_msg_lower = message.lower().strip()
    match = None

    # Cek kecocokan tepat terlebih dahulu
    for item in custom_answers:
        if user_msg_lower == item["q"]:
            match = item
            break

    # Jika tidak ada kecocokan tepat, cek kecocokan parsial
    if not match:
        for item in custom_answers:
            if item["q"] in user_msg_lower or user_msg_lower in item["q"]:
                match = item
                break

    if match:
        return jsonify({'response': match["a"], 'source': 'custom'})

    # 2. Jika tidak ada kecocokan dan ada API Key, gunakan OpenAI
    if api_key:
        try:
            import openai
            import requests

            # Mengatur API key
            openai.api_key = api_key

            # Menggunakan endpoint OpenAI API
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }

            # Menentukan model yang akan digunakan
            model_to_use = selected_model  # Simpan model asli untuk digunakan dalam payload

            if selected_model == 'auto':
                # Jika auto, dapatkan model yang tersedia dan pilih yang terbaik
                try:
                    models_response = requests.get(
                        'https://api.openai.com/v1/models',
                        headers=headers
                    )
                    if models_response.status_code == 200:
                        models = models_response.json()['data']
                        # Filter untuk model chat GPT-4
                        gpt4_models = [model['id'] for model in models if 'gpt-4' in model['id'].lower()]

                        # Prioritaskan model GPT-4 terbaru
                        if 'gpt-4o' in str(gpt4_models):
                            model_to_use = 'gpt-4o'
                        elif 'gpt-4-turbo' in str(gpt4_models):
                            model_to_use = 'gpt-4-turbo'
                        elif 'gpt-4' in str(gpt4_models):
                            model_to_use = 'gpt-4'
                        elif gpt4_models:
                            # Gunakan model GPT-4 pertama yang tersedia
                            model_to_use = gpt4_models[0]
                        else:
                            # Jika tidak ada GPT-4, gunakan model GPT terbaru
                            chat_models = [model['id'] for model in models if 'gpt' in model['id'].lower()]
                            model_to_use = chat_models[-1] if chat_models else 'gpt-3.5-turbo'
                    else:
                        model_to_use = 'gpt-4o'  # Default ke gpt-4o jika tidak bisa mendapatkan daftar model
                except:
                    model_to_use = 'gpt-4o'  # Default ke gpt-4o jika terjadi error
            # Jika bukan auto, gunakan model yang dipilih oleh pengguna
            # Tapi pastikan model tersebut valid
            elif selected_model in ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']:
                # Gunakan model yang dipilih
                model_to_use = selected_model
            else:
                # Jika model tidak valid, gunakan default
                model_to_use = 'gpt-4o'  # Default ke gpt-4o

            # Membuat pesan untuk percakapan
            messages = []

            # Menambahkan riwayat percakapan jika ada
            if conversation_history:
                messages.extend(conversation_history)
            else:
                # Jika tidak ada riwayat, tambahkan pesan sistem
                messages.append({
                    "role": "system", 
                    "content": """
                    Kamu adalah ASIK Assistant, sebuah chatbot AI yang cerdas dan ramah.
                    Kamu adalah asisten AI yang sangat berpengetahuan luas dan dapat membantu menjawab berbagai pertanyaan dari berbagai topik.
                    Kamu tidak dibatasi untuk hanya membahas tentang aplikasi ASIK 2025.
                    Gunakan bahasa yang ramah, informatif, dan profesional.
                    Berikan jawaban yang jelas, ringkas, dan mudah dipahami.
                    """
                })

            # Tambahkan pesan pengguna saat ini
            messages.append({"role": "user", "content": message})

            payload = {
                'model': model_to_use,  # Menggunakan model yang dipilih
                'messages': messages,
                'max_tokens': 1000,  # Meningkatkan max_tokens untuk jawaban yang lebih detail
                'temperature': 0.7  # Menambahkan sedikit kreativitas pada respons
            }

            # Mengirim request ke OpenAI API
            try:
                response = requests.post(
                    'https://api.openai.com/v1/chat/completions',
                    headers=headers,
                    json=payload,
                    timeout=30  # Menambah timeout untuk mencegah request yang terlalu lama
                )

                if response.status_code == 200:
                    result = response.json()
                    bot_response = result['choices'][0]['message']['content']

                    # Debug: Tampilkan model yang digunakan
                    print(f"Model yang digunakan: {model_to_use}")
                    print(f"Respons dari OpenAI: {bot_response[:100]}...")

                    return jsonify({'response': bot_response, 'model': model_to_use, 'source': 'openai'})
                else:
                    error_message = f"Error {response.status_code}: {response.text}"
                    return jsonify({'error': error_message}), response.status_code
            except requests.exceptions.Timeout:
                return jsonify({'error': 'Request timeout. Silakan coba lagi.'}), 408
            except Exception as e:
                return jsonify({'error': f'Terjadi kesalahan: {str(e)}'}), 500

        except Exception as e:
            return jsonify({'error': f'Terjadi kesalahan: {str(e)}'}), 500

    # Jika tidak ada API Key dan tidak ada kecocokan kustom
    return jsonify({'response': 'Mohon maaf, saya tidak memiliki jawaban untuk pertanyaan tersebut. Silakan tambahkan jawaban kustom di pengaturan atau masukkan OpenAI API key.', 'source': 'default'})

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
