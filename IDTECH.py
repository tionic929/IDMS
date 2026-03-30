import subprocess
import shlex
import sys
import tkinter as tk
import customtkinter as cctk
from PIL import Image
import threading
import time
import os
import socket
import pystray
from pystray import MenuItem as item
import queue

# Appearance settings
cctk.set_appearance_mode("Dark")
cctk.set_default_color_theme("blue")

class ProjectLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("IDTECH CONTROL CENTER")
        self.root.geometry("1200x850")
        
        # Minimize to tray on close
        self.root.protocol('WM_DELETE_WINDOW', self.hide_window)
        
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.processes = {}
        self.log_queues = {}
        
        # Full Service Configuration
        self.services = {
            "python_app": {
                "name": "Python Backend", 
                "cmd": "python -u app.py", # -u forces unbuffered output for logs
                "cwd": self.base_path, 
                "port": None
            },
            "laravel_server": {
                "name": "Laravel Server", 
                "cmd": "php artisan serve", 
                "cwd": os.path.join(self.base_path, "backend"), 
                "port": 8000
            },
            "laravel_queue": {
                "name": "Laravel Queue", 
                "cmd": "php artisan queue:listen", 
                "cwd": os.path.join(self.base_path, "backend"), 
                "port": None
            },
            "frontend_dev": {
                "name": "Vite Frontend", 
                "cmd": "npm run dev", 
                "cwd": os.path.join(self.base_path, "frontend"), 
                "port": 5173
            },
            "electron": {
                "name": "Electron App", 
                "cmd": "npm run electron", 
                "cwd": os.path.join(self.base_path, "frontend"), 
                "port": None
            },
            "ngrok": {
                "name": "Ngrok Tunnel",
                "cmd": "ngrok start --all --config ./ngrok.yml --region ap --log stdout",
                "cwd": self.base_path, 
                "port": None
            }
        }
        
        self.setup_ui()
        self.setup_tray()
        self.update_logs_loop()

    def setup_ui(self):
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)

        # --- Sidebar ---
        self.sidebar = cctk.CTkFrame(self.root, width=240, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        self.logo_label = cctk.CTkLabel(self.sidebar, text="IDTECH", font=cctk.CTkFont(size=28, weight="bold"))
        self.logo_label.pack(pady=(40, 20), padx=20)
        
        self.sub_label = cctk.CTkLabel(self.sidebar, text="System Management", font=cctk.CTkFont(size=12), text_color="gray")
        self.sub_label.pack(pady=(0, 30))

        self.start_btn = cctk.CTkButton(self.sidebar, text="LAUNCH ALL", height=45, font=cctk.CTkFont(weight="bold"), command=self.start_all)
        self.start_btn.pack(pady=10, padx=20)

        self.stop_btn = cctk.CTkButton(self.sidebar, text="STOP ALL SYSTEMS", height=45, fg_color="#444444", hover_color="#555555", command=self.stop_all)
        self.stop_btn.pack(pady=10, padx=20)

        # --- Main Content ---
        self.main_frame = cctk.CTkFrame(self.root, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, padx=25, pady=25, sticky="nsew")

        # Status Grid (Using the requested 200x180 dimensions)
        self.status_scroll = cctk.CTkScrollableFrame(self.main_frame, label_text="System Dashboard", orientation="horizontal", height=230)
        self.status_scroll.pack(fill="x", pady=(0, 25))

        self.status_cards = {}
        self.status_indicators = {}
        
        for key, val in self.services.items():
            card = cctk.CTkFrame(self.status_scroll, width=200, height=180, border_width=1, border_color="#333333")
            card.pack(side="left", padx=10, pady=5)
            card.pack_propagate(False)
            
            cctk.CTkLabel(card, text=val["name"], font=cctk.CTkFont(size=14, weight="bold")).pack(pady=(15, 5))
            
            indicator = cctk.CTkLabel(card, text="● OFFLINE", text_color="#666666", font=cctk.CTkFont(size=12))
            indicator.pack(pady=5)
            self.status_indicators[key] = indicator
            
            # Individual Control Buttons
            btn_frame = cctk.CTkFrame(card, fg_color="transparent")
            btn_frame.pack(side="bottom", pady=15)
            
            cctk.CTkButton(btn_frame, text="Start", width=60, height=24, font=cctk.CTkFont(size=11), 
                           command=lambda k=key: threading.Thread(target=self.run_command, args=(k,), daemon=True).start()).pack(side="left", padx=5)
            
            cctk.CTkButton(btn_frame, text="Stop", width=60, height=24, fg_color="#333333", font=cctk.CTkFont(size=11), 
                           command=lambda k=key: self.stop_service(k)).pack(side="left", padx=5)

        # --- Terminal Area ---
        self.tabview = cctk.CTkTabview(self.main_frame)
        self.tabview.pack(fill="both", expand=True)
        
        self.terminal_logs = {}
        for key, val in self.services.items():
            self.log_queues[key] = queue.Queue()
            tab = self.tabview.add(val["name"])
            
            # Text Area for Logs
            txt = tk.Text(tab, height=15, font=("Consolas", 11), bg="#0a0a0a", fg="#00ff41", 
                         insertbackground="white", borderwidth=0, padx=15, pady=15,
                         relief="flat", highlightthickness=0)
            txt.pack(fill="both", expand=True)
            
            # Scrollbar for terminal
            scroll = cctk.CTkScrollbar(txt, command=txt.yview)
            txt.configure(yscrollcommand=scroll.set)
            
            self.terminal_logs[key] = txt

    def setup_tray(self):
        icon_img = Image.new('RGB', (64, 64), color=(0, 120, 212))
        menu = (item('Show Launcher', self.show_window), item('Exit Entirely', self.exit_app))
        self.tray_icon = pystray.Icon("IDTECH", icon_img, "IDTECH System Control", menu)
        threading.Thread(target=self.tray_icon.run, daemon=True).start()

    def hide_window(self):
        self.root.withdraw()

    def show_window(self):
        self.root.after(0, self.root.deiconify)

    def exit_app(self):
        self.stop_all()
        self.tray_icon.stop()
        self.root.destroy()
        sys.exit(0)

    def check_port(self, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.3)
            return s.connect_ex(('127.0.0.1', port)) == 0

    def monitor_output(self, service_id, process):
        """ Reads process output and puts it into a thread-safe queue. """
        for line in iter(process.stdout.readline, ''):
            if line:
                self.log_queues[service_id].put(line)
        process.stdout.close()

    def update_logs_loop(self):
        """ Periodically checks queues for new logs and updates the UI. """
        for service_id, q in self.log_queues.items():
            try:
                while True: # Get all pending lines
                    line = q.get_nowait()
                    self.terminal_logs[service_id].insert(tk.END, line)
                    self.terminal_logs[service_id].see(tk.END)
            except queue.Empty:
                pass
        self.root.after(100, self.update_logs_loop)

    def update_status_ui(self, service_id, status, color):
        self.status_indicators[service_id].configure(text=f"● {status}", text_color=color)

    def run_command(self, service_id):
        if service_id in self.processes:
            return # Already running

        service = self.services[service_id]
        
        if service_id == "electron":
            self.update_status_ui(service_id, "WAITING (5s)", "yellow")
            time.sleep(5)
        
        self.update_status_ui(service_id, "STARTING...", "#3b8ed0")

        try:
            # We use creationflags to hide the console window on Windows if desired, 
            # but ensure stdout is piped so we can see logs in our UI.
            # FIX: On Windows, 'npm' is a .cmd/.ps1 script, so shell=True is REQUIRED for resolution.
            use_shell = os.name == 'nt'
            cmd_payload = service["cmd"] if use_shell else shlex.split(service["cmd"])

            proc = subprocess.Popen(
                cmd_payload,
                cwd=service["cwd"],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
                shell=use_shell
            )
            self.processes[service_id] = proc
            threading.Thread(target=self.monitor_output, args=(service_id, proc), daemon=True).start()

            if service["port"]:
                for _ in range(30):
                    if self.check_port(service["port"]):
                        self.update_status_ui(service_id, "READY", "#28a745")
                        return
                    time.sleep(1)
                self.update_status_ui(service_id, "DELAYED", "orange")
            else:
                time.sleep(1)
                self.update_status_ui(service_id, "RUNNING", "#28a745")

        except Exception as e:
            self.log_queues[service_id].put(f"LAUNCH ERROR: {str(e)}\n")
            self.update_status_ui(service_id, "ERROR", "#dc3545")

    def start_all(self):
        self.start_btn.configure(state="disabled", text="LAUNCHING...")
        threading.Thread(target=self._launch_sequence, daemon=True).start()

    def _launch_sequence(self):
        for service_id in self.services.keys():
            self.run_command(service_id)
            time.sleep(0.5) # Slight stagger to prevent CPU spikes
        self.start_btn.configure(state="normal", text="LAUNCH ALL")

    def stop_service(self, service_id):
        if service_id in self.processes:
            p = self.processes[service_id]
            try:
                if os.name == 'nt':
                    subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)])
                else:
                    p.terminate()
            except Exception:
                pass
            del self.processes[service_id]
            self.update_status_ui(service_id, "OFFLINE", "#666666")

    def stop_all(self):
        for sid in list(self.processes.keys()):
            self.stop_service(sid)

if __name__ == "__main__":
    root = cctk.CTk()
    app = ProjectLauncher(root)
    root.mainloop()