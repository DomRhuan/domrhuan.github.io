
# A very simple Flask Hello World app for you to get started with...
from flask import Flask, send_from_directory, request, jsonify
import os
import sys
import webbrowser
import threading
import time
import logging
import json
import shutil

# Configuração de logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('plantao_helper.log'),
        logging.StreamHandler()
    ]
)

app = Flask(__name__, static_folder='.', static_url_path='')

def get_resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

def get_executable_dir():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def setup_user_files():
    try:
        executable_dir = get_executable_dir()
        required_files = ['index.html', 'style.css', 'script.js', 'banco.json', 'admin.html', 'admin.css', 'admin.js']

        for file in required_files:
            dest_path = os.path.join(executable_dir, file)
            source_path = get_resource_path(file)

            if not os.path.exists(dest_path):
                shutil.copy2(source_path, dest_path)
                logging.info(f"Arquivo {file} criado em: {dest_path}")
            else:
                logging.info(f"Arquivo {file} já existe em: {dest_path}")
    except Exception as e:
        logging.error(f"Erro ao configurar arquivos do usuário: {str(e)}")
        raise

@app.route('/')
def index():
    return send_from_directory(get_executable_dir(), 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(get_executable_dir(), filename)

@app.route('/salvar-banco', methods=['POST'])
def salvar_banco():
    try:
        banco_data = request.get_json()
        banco_path = os.path.join(get_executable_dir(), 'banco.json')
        with open(banco_path, 'w', encoding='utf-8') as f:
            json.dump(banco_data, f, ensure_ascii=False, indent=2)
        logging.info("Banco de dados atualizado com sucesso")
        return jsonify(success=True, message='Dados salvos com sucesso')
    except json.JSONDecodeError as e:
        logging.error(f"Erro JSON: {e}")
        return jsonify(success=False, message='JSON inválido'), 400
    except Exception as e:
        logging.error(f"Erro ao salvar banco: {e}")
        return jsonify(success=False, message=str(e)), 500

def start_flask_server():
    app.run(port=8000, debug=False, use_reloader=False)

def main():
    try:
        logging.info("Iniciando Plantão Helper com Flask...")

        setup_user_files()

        server_thread = threading.Thread(target=start_flask_server)
        server_thread.daemon = True
        server_thread.start()

        time.sleep(2)
        webbrowser.open('http://localhost:8000')

        while True:
            time.sleep(1)
    except Exception as e:
        logging.error(f"Erro fatal: {str(e)}")
        input("Pressione Enter para sair...")
        sys.exit(1)

if __name__ == "__main__":
    main()
