import subprocess
import tkinter as tk
import customtkinter as cctk
from PIL import Image
import threading
import time
import os
import socket
import pystray
from pystray import MenuItem as item

# Appearance settings
cctk.set_appearance_mode("Dark")
cctk.set_default_color_theme("blue")

class ProjectLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("IDTECH CONTROL CENTER")
        self.root.geometry("1100x800")
        
        # Minimize to tray on close
        self.root.protocol('WM_DELETE_WINDOW', self.hide_window)
        
        self.base_path = os.path.dirname(os.path.abspath(__file__))
        self.processes = {}
        
        # Full Service Configuration from original run_all.bat
        self.services = {
            "python_app": {
                "name": "Python Backend", 
                "cmd": "python app.py", 
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
            # "electron": {
            #     "name": "Electron App", 
            #     "cmd": "npm run electron", 
            #     "cwd": os.path.join(self.base_path, "frontend"), 
            #     "port": None
            # }
        }
        
        self.setup_ui()
        self.setup_tray()

    def setup_ui(self):
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar = cctk.CTkFrame(self.root, width=220, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        
        self.logo_label = cctk.CTkLabel(self.sidebar, text="IDTECH", font=cctk.CTkFont(size=24, weight="bold"))
        self.logo_label.pack(pady=30, padx=20)

        self.start_btn = cctk.CTkButton(self.sidebar, text="Launch Systems", command=self.start_all)
        self.start_btn.pack(pady=10, padx=20)

        self.stop_btn = cctk.CTkButton(self.sidebar, text="Stop All", fg_color="#444444", hover_color="#555555", command=self.stop_all)
        self.stop_btn.pack(pady=10, padx=20)

        # Main Content
        self.main_frame = cctk.CTkFrame(self.root, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")

        # Dashboard (Fixed Height Issue)
        self.status_container = cctk.CTkScrollableFrame(self.main_frame, label_text="Live Status", height=300)
        self.status_container.pack(fill="x", pady=(0, 20))

        self.status_labels = {}
        for key, val in self.services.items():
            frame = cctk.CTkFrame(self.status_container)
            frame.pack(fill="x", pady=5, padx=5)
            
            name_lbl = cctk.CTkLabel(frame, text=val["name"], font=cctk.CTkFont(weight="bold"), width=200, anchor="w")
            name_lbl.pack(side="left", padx=20, pady=10)
            
            status_lbl = cctk.CTkLabel(frame, text="STOPPED", text_color="gray")
            status_lbl.pack(side="right", padx=20)
            self.status_labels[key] = status_lbl

        # Terminal Tabs
        self.tabview = cctk.CTkTabview(self.main_frame)
        self.tabview.pack(fill="both", expand=True)
        
        self.terminal_logs = {}
        for key, val in self.services.items():
            tab = self.tabview.add(val["name"])
            txt = tk.Text(tab, height=15, font=("Consolas", 10), bg="#111111", fg="#00ff41", borderwidth=0, padx=10, pady=10)
            txt.pack(fill="both", expand=True)
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
        os._exit(0)

    def check_port(self, port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex(('127.0.0.1', port)) == 0

    def monitor_output(self, service_id, process):
        for line in iter(process.stdout.readline, ''):
            if line:
                self.terminal_logs[service_id].insert(tk.END, line)
                self.terminal_logs[service_id].see(tk.END)
        process.stdout.close()

    def update_status_ui(self, service_id, status, color="gray"):
        self.status_labels[service_id].configure(text=status, text_color=color)

    def run_command(self, service_id):
        service = self.services[service_id]
        
        if service_id == "electron":
            self.update_status_ui(service_id, "⌛ WAITING (5s)", "yellow")
            time.sleep(5) # Replicates timeout /t 5
        
        self.update_status_ui(service_id, "🔄 STARTING...", "#3b8ed0")

        try:
            # CREATE_NEW_CONSOLE ensures we keep the separate windows feature from the .bat
            proc = subprocess.Popen(
                service["cmd"],
                cwd=service["cwd"],
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            self.processes[service_id] = proc
            threading.Thread(target=self.monitor_output, args=(service_id, proc), daemon=True).start()

            if service["port"]:
                # Check port for 20 seconds before giving up
                for _ in range(40):
                    if self.check_port(service["port"]):
                        self.update_status_ui(service_id, "✅ READY", "#28a745")
                        return
                    time.sleep(0.5)
                self.update_status_ui(service_id, "⚠️ DELAYED", "orange")
            else:
                time.sleep(1)
                self.update_status_ui(service_id, "✅ RUNNING", "#28a745")

        except Exception as e:
            self.update_status_ui(service_id, "❌ ERROR", "#dc3545")

    def start_all(self):
        self.start_btn.configure(state="disabled")
        threading.Thread(target=self._launch_sequence, daemon=True).start()

    def _launch_sequence(self):
        for service_id in self.services.keys():
            self.run_command(service_id)
        self.start_btn.configure(state="normal")

    def stop_all(self):
        for sid, p in self.processes.items():
            try:
                # Kills the process tree on Windows
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)])
            except:
                p.terminate()
            self.update_status_ui(sid, "STOPPED", "gray")
        self.processes = {}

if __name__ == "__main__":
    root = cctk.CTk()
    app = ProjectLauncher(root)
    root.mainloop()